import type { Client, Product, Rental } from "@/lib/store";

export type Priority = "info" | "atencao" | "urgente";
export type AlertGroup = "locacoes" | "financeiro" | "estoque";
export type Alert = {
  key: string;
  kind: string;
  group: AlertGroup;
  priority: Priority;
  title: string;
  body: string;
  linkType?: "cliente" | "produto" | "locacao";
  linkId?: string;
};

export type AlertPrefs = {
  /** Retiradas e devoluções (hoje, próximas, atrasadas). */
  retiradasDevolucoes: boolean;
  /** Pagamentos pendentes, vencendo e vencidos. */
  pagamentos: boolean;
  /** Dias de antecedência para lembretes. */
  antecedencia: number;
};

export const PRIORITY_ORDER: Record<Priority, number> = { urgente: 0, atencao: 1, info: 2 };

const DAY = 86400000;
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const fmt = (iso: string) => iso.split("-").reverse().join("/");
const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Gera os alertas a partir dos dados reais do locador.
 * O vencimento do pagamento é a data de devolução da locação (o sistema não guarda outra data de vencimento).
 */
export function computeAlerts(
  data: { rentals: Rental[]; clients: Client[]; products: Product[] },
  today: string,
  prefs: AlertPrefs,
): Alert[] {
  const lead = Math.max(0, Math.min(30, Math.round(prefs.antecedencia)));
  const limit = addDays(today, lead);
  const cname = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "Cliente";
  const pname = (id: string) => data.products.find((p) => p.id === id)?.name ?? "produto";
  const out: Alert[] = [];

  for (const r of data.rentals) {
    const who = cname(r.clientId);
    const what = pname(r.productId);
    const base = { linkType: "locacao" as const, linkId: r.id };
    if (prefs.retiradasDevolucoes) {
      if (r.status === "aguardando") {
        if (r.start < today) out.push({ ...base, key: `retirada-pendente:${r.id}`, kind: "retirada_pendente", group: "locacoes", priority: "urgente", title: "Retirada precisa de confirmação", body: `${who} deveria ter retirado ${what} em ${fmt(r.start)}.` });
        else if (r.start === today) out.push({ ...base, key: `retirada-hoje:${r.id}:${today}`, kind: "retirada_hoje", group: "locacoes", priority: "atencao", title: "Retirada hoje", body: `${who} retira ${what} hoje.` });
        else if (r.start <= limit) out.push({ ...base, key: `retirada-proxima:${r.id}`, kind: "retirada_proxima", group: "locacoes", priority: "info", title: "Próxima retirada", body: `${who} retira ${what} em ${fmt(r.start)}.` });
      }
      if (r.status === "atrasada") out.push({ ...base, key: `devolucao-atrasada:${r.id}`, kind: "devolucao_atrasada", group: "locacoes", priority: "urgente", title: "Devolução atrasada", body: `${what} com ${who} deveria ter voltado em ${fmt(r.end)}.` });
      if (r.status === "andamento") {
        if (r.end === today) out.push({ ...base, key: `devolucao-hoje:${r.id}:${today}`, kind: "devolucao_hoje", group: "locacoes", priority: "atencao", title: "Devolução hoje", body: `${who} devolve ${what} hoje.` });
        else if (r.end > today && r.end <= limit) out.push({ ...base, key: `devolucao-proxima:${r.id}`, kind: "devolucao_proxima", group: "locacoes", priority: "info", title: "Devolução próxima", body: `${who} devolve ${what} em ${fmt(r.end)}.` });
      }
    }
    if (prefs.pagamentos && !r.paid && r.status !== "finalizada" && r.status !== "cancelada") {
      if (r.end < today) out.push({ ...base, key: `pagamento-vencido:${r.id}`, kind: "pagamento_vencido", group: "financeiro", priority: "urgente", title: "Pagamento vencido", body: `${who} · ${money(r.total)} · venceu em ${fmt(r.end)}.` });
      else if (r.end <= limit) out.push({ ...base, key: `pagamento-vencendo:${r.id}`, kind: "pagamento_vencendo", group: "financeiro", priority: "atencao", title: "Pagamento vence em breve", body: `${who} · ${money(r.total)} · vence em ${fmt(r.end)}.` });
    }
  }

  if (prefs.pagamentos) {
    const open = data.rentals.filter((r) => !r.paid && r.status !== "finalizada" && r.status !== "cancelada");
    if (open.length) {
      const total = open.reduce((s, r) => s + r.total, 0);
      out.push({ key: `aguardando-recebimento:${today}`, kind: "aguardando_recebimento", group: "financeiro", priority: "info", title: "Valores aguardando recebimento", body: `${money(total)} em ${open.length} locação(ões) sem pagamento registrado.` });
    }
  }

  // Conflitos: duas locações não finalizadas do mesmo produto com datas que se cruzam.
  const live = data.rentals.filter((r) => r.status !== "finalizada" && r.status !== "cancelada");
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]!, b = live[j]!;
      if (a.productId === b.productId && a.start <= b.end && b.start <= a.end) {
        const [x, y] = [a.id, b.id].sort();
        out.push({ key: `conflito:${x}:${y}`, kind: "conflito", group: "estoque", priority: "urgente", title: "Conflito de disponibilidade", body: `${pname(a.productId)} está em duas locações com datas que se cruzam (${cname(a.clientId)} e ${cname(b.clientId)}).`, linkType: "produto", linkId: a.productId });
      }
    }
  }

  return out.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
