import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, TODAY, STATUS_INFO, brl } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => seo("Calendário", "Veja no calendário as retiradas e devoluções."),
  component: Calendario,
});

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const pad = (n: number) => String(n).padStart(2, "0");

function Calendario() {
  const { rentals, clients, products } = useStore();
  const [ym, setYm] = useState(() => ({ y: Number(TODAY.slice(0, 4)), m: Number(TODAY.slice(5, 7)) - 1 }));
  const [sel, setSel] = useState(TODAY);
  const first = new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay();
  const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const iso = (d: number) => `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
  const on = (date: string) => rentals.filter((r) => r.status !== "finalizada" && r.start <= date && r.end >= date);
  const move = (n: number) => setYm(({ y, m }) => { const t = m + n; return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 }; });
  const selected = on(sel);

  return (
    <>
      <PageHeader title="Calendário" subtitle="Toque em um dia para ver o que está alugado." />
      <div className="mb-5 flex flex-wrap gap-4">
        {(["andamento", "aguardando", "atrasada"] as const).map((k) => (
          <span key={k} className="flex items-center gap-2 text-base font-semibold text-foreground"><span className={cn("h-4 w-4 rounded-full", STATUS_INFO[k].dot)} />{STATUS_INFO[k].label}</span>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <Button variant="outline" size="lg" className="h-12" onClick={() => move(-1)}><ChevronLeft className="h-5 w-5" /> Anterior</Button>
            <h2 className="text-xl font-bold text-foreground">{MONTHS[ym.m]} {ym.y}</h2>
            <Button variant="outline" size="lg" className="h-12" onClick={() => move(1)}>Próximo <ChevronRight className="h-5 w-5" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEK.map((w) => <div key={w} className="py-2 text-sm font-bold text-muted-foreground">{w}</div>)}
            {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const d = iso(i + 1);
              const items = on(d);
              return (
                <button key={d} onClick={() => setSel(d)} className={cn("flex min-h-16 flex-col items-center gap-1 rounded-xl border p-1.5 sm:min-h-20", sel === d ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted", d === TODAY && "ring-2 ring-primary")}>
                  <span className="text-base font-bold text-foreground">{i + 1}</span>
                  <span className="flex flex-wrap justify-center gap-1">{items.slice(0, 4).map((r) => <span key={r.id} className={cn("h-2.5 w-2.5 rounded-full", STATUS_INFO[r.status].dot)} />)}</span>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title={`Dia ${sel.split("-").reverse().join("/")}`}>
          {selected.length === 0 ? <p className="text-base text-muted-foreground">Nenhuma locação neste dia.</p> : (
            <ul className="space-y-3">
              {selected.map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-4">
                  <span className={cn("inline-block rounded-full px-3 py-0.5 text-sm font-bold", STATUS_INFO[r.status].className)}>{STATUS_INFO[r.status].label}</span>
                  <p className="mt-2 font-bold text-foreground">{products.find((p) => p.id === r.productId)?.name}</p>
                  <p className="text-muted-foreground">{clients.find((c) => c.id === r.clientId)?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.end === sel ? "Devolução hoje" : r.start === sel ? "Retirada hoje" : "Em uso"} · {brl(r.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
