export type ModuleKey = "book" | "about" | "portfolio" | "flash" | "merch";

export type BookingModule = { key: ModuleKey; enabled: boolean };

export const MODULE_META: Record<
  ModuleKey,
  { label: string; description: string }
> = {
  book: { label: "Book Now", description: "Calendar + booking form" },
  about: { label: "About Me", description: "Your bio & location" },
  portfolio: { label: "Portfolio", description: "Showcase your best work" },
  flash: { label: "Available Flash", description: "Flash pieces clients can book" },
  merch: { label: "Merch", description: "Your shop & checkout" },
};

export const DEFAULT_MODULES: BookingModule[] = [
  { key: "book", enabled: true },
  { key: "about", enabled: true },
  { key: "portfolio", enabled: true },
  { key: "flash", enabled: true },
  { key: "merch", enabled: true },
];

const ALL_KEYS = Object.keys(MODULE_META) as ModuleKey[];

/** Ensure every known module is present (append missing), drop unknown keys. */
export function normalizeModules(
  mods: { key: string; enabled?: boolean }[] | null | undefined,
): BookingModule[] {
  const valid: BookingModule[] = (mods ?? [])
    .filter((m) => ALL_KEYS.includes(m.key as ModuleKey))
    .map((m) => ({ key: m.key as ModuleKey, enabled: m.enabled ?? true }));
  const present = new Set(valid.map((m) => m.key));
  const missing = DEFAULT_MODULES.filter((m) => !present.has(m.key));
  return [...valid, ...missing];
}
