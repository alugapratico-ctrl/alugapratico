import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, Clock, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, StatusPill } from "@/components/AppShell";
import { useStore, brl, fmtDate, monthlySummary, TODAY } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => seo("Financeiro", "Quanto você recebeu, quanto falta receber e o histórico."),
  component: Financeiro,
});

function Financeiro() {
  const { rentals, clients, products } = useStore();
  const received = rentals.filter((r) => r.paid).reduce((s, r) => s + r.total, 0);
  const pending = rentals.filter((r) => !r.paid).reduce((s, r) => s + r.total, 0);
  const month = rentals.filter((r) => r.paid && r.start.startsWith(TODAY.slice(0, 7))).reduce((s, r) => s + r.total, 0);
  const MONTHLY = monthlySummary(rentals);

  const cards = [
    { label: "Total recebido", value: received, icon: ArrowDownCircle, tone: "bg-success-soft text-success" },
    { label: "Valores pendentes", value: pending, icon: Clock, tone: "bg-warning-soft text-warning" },
    { label: "Receitas do mês", value: month, icon: TrendingUp, tone: "bg-accent text-primary" },
  ];

  return (
    <>
      <PageHeader title="Financeiro" subtitle="Seu dinheiro de forma clara." />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.tone}`}><c.icon className="h-6 w-6" /></span>
            <p className="mt-4 text-base font-semibold text-muted-foreground">{c.label}</p>
            <p className="text-3xl font-extrabold text-foreground">{brl(c.value)}</p>
          </div>
        ))}
      </div>
      <Panel title="Receita dos últimos meses" className="mt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={15} />
              <YAxis tickLine={false} axisLine={false} fontSize={13} tickFormatter={(v) => `R$${v / 1000}mil`} width={70} />
              <Tooltip formatter={(v: number) => brl(v)} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="valor" name="Receita" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Histórico de movimentações" className="mt-6">
        {rentals.length === 0 && <p className="py-4 text-base text-muted-foreground">Nenhuma movimentação ainda. Elas aparecem aqui quando você registra locações.</p>}
        <ul className="divide-y divide-border">
          {rentals.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-foreground">{products.find((p) => p.id === r.productId)?.name}</p>
                <p className="text-sm text-muted-foreground">{clients.find((c) => c.id === r.clientId)?.name} · {fmtDate(r.start)}</p>
              </div>
              <StatusPill label={r.paid ? "Recebido" : "Pendente"} className={r.paid ? "bg-success-soft text-success" : "bg-warning-soft text-warning"} />
              <p className="w-32 text-right text-lg font-extrabold text-foreground">{brl(r.total)}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
