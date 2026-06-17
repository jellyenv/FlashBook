export type FlashLike = {
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  price_plus?: boolean;
  size_min?: string | null;
  size_plus?: boolean;
  ask_about?: boolean;
};

export const EVENT_TAGS: { value: string; label: string }[] = [
  { value: "", label: "No event" },
  { value: "halloween", label: "🎃 Halloween" },
  { value: "friday_13th", label: "🔮 Friday the 13th" },
  { value: "christmas", label: "🎄 Christmas" },
  { value: "valentines", label: "💘 Valentine's" },
  { value: "new_year", label: "✨ New Year" },
  { value: "st_patricks", label: "🍀 St. Patrick's" },
];

export function eventLabel(tag?: string | null): string | undefined {
  if (!tag) return undefined;
  return EVENT_TAGS.find((t) => t.value === tag)?.label ?? tag;
}

function dollars(cents: number): string {
  const v = cents / 100;
  return v % 1 === 0 ? `$${v}` : `$${v.toFixed(2)}`;
}

/** "$200", "$150–$300", "$200+" — or null when the piece is consult-only. */
export function formatFlashPrice(p: FlashLike): string | null {
  if (p.ask_about) return null;
  const min = p.price_min_cents;
  const max = p.price_max_cents;
  let base: string | null = null;
  if (min != null && max != null && max !== min) base = `${dollars(min)}–${dollars(max)}`;
  else if (min != null) base = dollars(min);
  else if (max != null) base = dollars(max);
  if (!base) return null;
  return p.price_plus ? `${base}+` : base;
}

/** '3"' or '3"+' */
export function formatFlashSize(p: FlashLike): string | null {
  if (!p.size_min) return null;
  return p.size_plus ? `${p.size_min}+` : p.size_min;
}
