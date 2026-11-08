/** Regras de estoque por período (o banco aplica as mesmas regras de forma definitiva). */
export type StockRental = { id: string; productId: string; start: string; end: string; quantity: number; status: string };

export const isActiveRental = (status: string) => status !== "finalizada" && status !== "cancelada";

/** Unidades já reservadas de um produto que se sobrepõem ao período [start, end]. */
export function reservedInPeriod(rentals: StockRental[], productId: string, start: string, end: string, excludeId?: string) {
  return rentals
    .filter((r) => r.productId === productId && r.id !== excludeId && isActiveRental(r.status) && r.start <= end && r.end >= start)
    .reduce((s, r) => s + r.quantity, 0);
}

export function availableInPeriod(total: number, rentals: StockRental[], productId: string, start: string, end: string, excludeId?: string) {
  return Math.max(0, total - reservedInPeriod(rentals, productId, start, end, excludeId));
}

/** Maior quantidade reservada ao mesmo tempo, de hoje em diante (mínimo permitido para o estoque). */
export function peakCommitted(rentals: StockRental[], productId: string, today: string) {
  const active = rentals.filter((r) => r.productId === productId && isActiveRental(r.status) && r.end >= today);
  let peak = 0;
  for (const r of active) {
    const day = r.start > today ? r.start : today;
    const sum = active.filter((x) => x.start <= day && x.end >= day).reduce((s, x) => s + x.quantity, 0);
    peak = Math.max(peak, sum);
  }
  return peak;
}
