import { describe, expect, it } from "vitest";
import { availableInPeriod, peakCommitted, type StockRental } from "@/lib/availability";

const r = (o: Partial<StockRental>): StockRental => ({ id: "x", productId: "p", start: "2026-12-01", end: "2026-12-05", quantity: 1, status: "aguardando", ...o });

describe("estoque por período", () => {
  it("estoque 1: uma reserva ocupa o período inteiro", () => {
    expect(availableInPeriod(1, [r({ id: "a" })], "p", "2026-12-03", "2026-12-04")).toBe(0);
  });
  it("estoque 100: reserva de 60 deixa 40 livres", () => {
    const rs = [r({ id: "a", quantity: 60 })];
    expect(availableInPeriod(100, rs, "p", "2026-12-01", "2026-12-05")).toBe(40);
  });
  it("períodos sem sobreposição não contam", () => {
    expect(availableInPeriod(1, [r({ id: "a" })], "p", "2026-12-06", "2026-12-08")).toBe(1);
  });
  it("devolução no mesmo dia da retirada seguinte conta como sobreposição", () => {
    expect(availableInPeriod(1, [r({ id: "a" })], "p", "2026-12-05", "2026-12-07")).toBe(0);
  });
  it("canceladas e finalizadas liberam o estoque", () => {
    const rs = [r({ id: "a", status: "cancelada", quantity: 60 }), r({ id: "b", status: "finalizada", quantity: 30 })];
    expect(availableInPeriod(100, rs, "p", "2026-12-01", "2026-12-05")).toBe(100);
  });
  it("ao editar, a própria reserva não conta", () => {
    expect(availableInPeriod(100, [r({ id: "a", quantity: 60 })], "p", "2026-12-01", "2026-12-05", "a")).toBe(100);
  });
  it("mínimo do estoque é o pico de reservas simultâneas", () => {
    const rs = [r({ id: "a", quantity: 60 }), r({ id: "b", start: "2026-12-04", end: "2026-12-10", quantity: 30 }), r({ id: "c", start: "2026-12-08", quantity: 50, end: "2026-12-09" })];
    expect(peakCommitted(rs, "p", "2026-11-30")).toBe(90);
  });
});
