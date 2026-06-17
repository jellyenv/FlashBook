import type { CSSProperties } from "react";

/**
 * Per-artist theming. Colors are stored as HSL triplets ("343 81% 62%") matching the
 * CSS custom-property format used across the app, so a theme can be injected by
 * setting a handful of CSS variables on a wrapper element.
 */

export type ThemeLike = {
  font?: string | null;
  palette?: Record<string, unknown> | null;
  background_color?: string | null;
  background_image_url?: string | null;
  button_shape?: "rounded" | "sharp" | null;
  header_image_url?: string | null;
  center_widget_image_url?: string | null;
};

export const PRESET_PALETTES: { name: string; brand: string }[] = [
  { name: "Coral", brand: "343 81% 62%" },
  { name: "Violet", brand: "262 70% 62%" },
  { name: "Jade", brand: "168 64% 44%" },
  { name: "Amber", brand: "35 92% 55%" },
  { name: "Sky", brand: "210 80% 56%" },
  { name: "Ink", brand: "240 10% 22%" },
];

export const FONT_OPTIONS: { name: string; stack: string }[] = [
  { name: "Geist (clean sans)", stack: "var(--font-geist-sans), system-ui, sans-serif" },
  { name: "Fraunces (boutique serif)", stack: "var(--font-fraunces), Georgia, serif" },
  { name: "Georgia (classic serif)", stack: "Georgia, 'Times New Roman', serif" },
  { name: "System", stack: "system-ui, -apple-system, sans-serif" },
];

/** Build inline CSS variables + data attributes for a themed surface. */
export function themeToStyle(theme: ThemeLike | null | undefined): {
  style: CSSProperties;
  buttonShape: "rounded" | "sharp";
} {
  const style: Record<string, string> = {};
  const brand = (theme?.palette as { brand?: string } | null)?.brand;
  if (brand) style["--brand"] = brand;
  if (theme?.background_image_url) {
    const base = theme.background_color ? `${theme.background_color} ` : "";
    style["--page-bg"] =
      `${base}url('${theme.background_image_url}') center / cover no-repeat fixed`;
  } else if (theme?.background_color) {
    style["--page-bg"] = theme.background_color;
  }
  if (theme?.font) style["--font-body"] = theme.font;
  return {
    style: style as CSSProperties,
    buttonShape: theme?.button_shape === "sharp" ? "sharp" : "rounded",
  };
}

// --- WCAG contrast (for the theme editor's accessibility warning) ---

function hslTripletToRgb(triplet: string): [number, number, number] | null {
  const m = triplet.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue(h + 1 / 3) * 255),
    Math.round(hue(h) * 255),
    Math.round(hue(h - 1 / 3) * 255),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.4222 * a[2];
}

/** Contrast ratio between two HSL triplets; returns null if either is unparseable. */
export function contrastRatio(a: string, b: string): number | null {
  const ra = hslTripletToRgb(a);
  const rb = hslTripletToRgb(b);
  if (!ra || !rb) return null;
  const la = relativeLuminance(ra);
  const lb = relativeLuminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** White-text-on-brand passes AA for large text (>= 3:1)? */
export function brandPassesAA(brand: string): boolean {
  const ratio = contrastRatio(brand, "0 0% 100%");
  return ratio !== null && ratio >= 3;
}
