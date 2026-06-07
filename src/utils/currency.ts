export function parsePrice(p: string): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function formatCurrency(n: number): string {
  return "¥" + Math.round(n).toLocaleString();
}
