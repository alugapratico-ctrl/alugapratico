import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trophy, Repeat, KeyRound } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, brl, monthlySummary } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => seo("Relatórios", "Resumo dos produtos mais alugados, receita e clientes fiéis."),
  component: Relatorios,
});

function Relatorios() {
  const { rentals, products, clients } = useStore();
  const MONTHLY = monthlySummary(rentals);
  const top = products.map((p) => ({ p, n: rentals.filter((r) => r.productId === p.id).length })).filter((t) => t.n > 0).sort((a, b) => b.n - a.n).slice(0, 5);
  const max = Math.max(1, ...top.map((t) => t.n));
  const loyal = clients.map((c) => ({ c, n: rentals.filter((r) => r.clientId === c.id).length })).filter((x) => x.n > 1).sort((a, b) => b.n - a.n);

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Um resumo simples de como seu negócio está indo." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: "Locações no total", v: String(rentals.length), i: KeyRound },
          { l: "Receita em 6 meses", v: brl(MONTHLY.reduce((s, m) => s + m.valor, 0)), i: Trophy },
          { l: "Clientes que voltaram", v: String(loyal.length), i: Repeat },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <k.i className="h-7 w-7 text-primary" />
            <p className="mt-3 text-3xl font-extrabold text-foreground">{k.v}</p>
            <p className="text-base font-semibold text-muted-foreground">{k.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Produtos mais alugados">
          {top.length === 0 && <p className="text-base text-muted-foreground">Ainda não há locações registradas.</p>}
          <ul className="space-y-4">
            {top.map(({ p, n }, i) => (
              <li key={p.id}>
                <div className="mb-1.5 flex justify-between text-base"><span className="font-semibold text-foreground">{i + 1}. {p.name}</span><span className="font-bold text-primary">{n}x</span></div>
                <div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Clientes recorrentes">
          {loyal.length === 0 && <p className="text-base text-muted-foreground">Clientes que alugarem mais de uma vez aparecem aqui.</p>}
          <ul className="divide-y divide-border">
            {loyal.map(({ c, n }) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-base">
                <span className="font-semibold text-foreground">{c.name}</span>
                <span className="rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground">{n} locações</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Receita mensal" className="mt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={15} />
              <YAxis tickLine={false} axisLine={false} fontSize={13} width={70} tickFormatter={(v) => `R$${v / 1000}mil`} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Area dataKey="valor" name="Receita" stroke="var(--chart-1)" strokeWidth={3} fill="var(--accent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
