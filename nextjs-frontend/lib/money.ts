export function formatMoney(cents: number): string {
  const v = cents / 100;
  return v % 1 === 0 ? `$${v}` : `$${v.toFixed(2)}`;
}
