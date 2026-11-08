import { describe, expect, it } from "vitest";
import { computeAlerts } from "@/lib/alerts";
import { whatsappNumber, buildMessage } from "@/lib/messages";
import { supportLink } from "@/lib/support";
import type { Client, Product, Rental } from "@/lib/store";

const clients: Client[] = [{ id: "c1", name: "Maria Souza", phone: "(11) 98888-7777" }];
const products: Product[] = [{ id: "p1", name: "Furadeira", category: "Outros", description: "", price: 50, billing: "diária", details: {}, available: false }];
const r = (o: Partial<Rental>): Rental => ({ id: "r1", clientId: "c1", productId: "p1", start: "2026-11-01", end: "2026-11-10", total: 100, status: "andamento", paid: true, ...o });
const prefs = { retiradasDevolucoes: true, pagamentos: true, antecedencia: 1 };
const TODAY = "2026-11-06";

describe("alertas", () => {
  it("devolução atrasada é urgente", () => {
    const a = computeAlerts({ clients, products, rentals: [r({ status: "atrasada", end: "2026-11-05" })] }, TODAY, prefs);
    expect(a[0]).toMatchObject({ kind: "devolucao_atrasada", priority: "urgente" });
  });
  it("devolução hoje é atenção", () => {
    const a = computeAlerts({ clients, products, rentals: [r({ end: TODAY })] }, TODAY, prefs);
    expect(a.map((x) => [x.kind, x.priority])).toEqual([["devolucao_hoje", "atencao"]]);
  });
  it("pagamento vencido é urgente e soma aguardando recebimento", () => {
    const a = computeAlerts({ clients, products, rentals: [r({ status: "atrasada", end: "2026-11-05", paid: false })] }, TODAY, { ...prefs, retiradasDevolucoes: false });
    expect(a.find((x) => x.kind === "pagamento_vencido")?.priority).toBe("urgente");
    expect(a.find((x) => x.kind === "aguardando_recebimento")?.body).toContain("100,00");
  });
  it("respeita a antecedência", () => {
    const rentals = [r({ end: "2026-11-09" })];
    expect(computeAlerts({ clients, products, rentals }, TODAY, prefs)).toHaveLength(0);
    expect(computeAlerts({ clients, products, rentals }, TODAY, { ...prefs, antecedencia: 3 })[0]?.kind).toBe("devolucao_proxima");
  });
  it("desligar pagamentos remove alertas financeiros", () => {
    const a = computeAlerts({ clients, products, rentals: [r({ paid: false, end: TODAY })] }, TODAY, { ...prefs, pagamentos: false });
    expect(a.some((x) => x.group === "financeiro")).toBe(false);
  });
  it("detecta conflito de datas do mesmo produto", () => {
    const a = computeAlerts({ clients, products, rentals: [r({ id: "a" }), r({ id: "b", status: "aguardando", start: "2026-11-08", end: "2026-11-12" })] }, TODAY, prefs);
    expect(a.some((x) => x.kind === "conflito")).toBe(true);
  });
});

describe("whatsapp", () => {
  it("adiciona o código do Brasil", () => expect(whatsappNumber("(11) 98888-7777")).toBe("5511988887777"));
  it("rejeita telefone incompleto", () => expect(whatsappNumber("9888")).toBeNull());
  it("botão de atendimento some sem número", () => expect(supportLink("")).toBeNull());
  it("mensagem de confirmação usa os dados da locação", () => {
    const m = buildMessage("confirmacao", clients[0]!, r({}), products[0]);
    expect(m).toContain("Olá, Maria!");
    expect(m).toContain("Produto: Furadeira");
    expect(m).toContain("Devolução: 10/11/2026");
  });
});
