import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, CalendarArrowUp, CalendarArrowDown, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/AppShell";
import { RentalForm } from "@/components/Forms";
import { MessageDialog } from "@/components/MessageDialog";
import { WhatsAppIcon } from "@/components/SupportButton";
import { useStore, brl, fmtDate, STATUS_INFO, type RentalStatus } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/locacoes")({
  head: () => seo("Locações", "Acompanhe todos os aluguéis e suas situações."),
  component: Locacoes,
});

function Locacoes() {
  const { rentals, clients, products, finishRental } = useStore();
  const [finishing, setFinishing] = useState<string | null>(null);
  const finish = async (id: string) => {
    setFinishing(id);
    try { await finishRental(id); toast.success("Devolução registrada! O produto está disponível de novo."); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Não foi possível registrar a devolução."); }
    setFinishing(null);
  };
  const [open, setOpen] = useState(false);
  const [msgFor, setMsgFor] = useState<string | null>(null);
  const msgRental = rentals.find((r) => r.id === msgFor);
  const msgClient = msgRental ? clients.find((c) => c.id === msgRental.clientId) : undefined;
  const [filter, setFilter] = useState<RentalStatus | "todas">("todas");
  const list = filter === "todas" ? rentals : rentals.filter((r) => r.status === filter);
  const keys = Object.keys(STATUS_INFO) as RentalStatus[];

  return (
    <>
      <PageHeader title="Locações" subtitle="Todos os aluguéis, do mais novo ao mais antigo."
        action={<Button size="lg" className="h-14 px-6 text-lg" onClick={() => setOpen(true)}><Plus className="h-5 w-5" /> Registrar locação</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button onClick={() => setFilter("todas")} className={cn("rounded-2xl border-2 p-4 text-left", filter === "todas" ? "border-primary bg-accent" : "border-border bg-card")}>
          <p className="text-2xl font-extrabold text-foreground">{rentals.length}</p><p className="font-semibold text-muted-foreground">Todas</p>
        </button>
        {keys.map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-2xl border-2 p-4 text-left", filter === k ? "border-primary bg-accent" : "border-border bg-card")}>
            <p className="flex items-center gap-2 text-2xl font-extrabold text-foreground"><span className={cn("h-3 w-3 rounded-full", STATUS_INFO[k].dot)} />{rentals.filter((r) => r.status === k).length}</p>
            <p className="font-semibold text-muted-foreground">{STATUS_INFO[k].label}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((r) => {
          const c = clients.find((x) => x.id === r.clientId);
          const p = products.find((x) => x.id === r.productId);
          const s = STATUS_INFO[r.status];
          return (
            <article key={r.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft md:flex-row md:items-center">
              <div className="flex-1">
                <StatusPill label={s.label} className={s.className} />
                <h3 className="mt-2 text-xl font-bold text-foreground">{c?.name}</h3>
                <p className="text-base text-muted-foreground">{p?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-base md:w-80">
                <div><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarArrowUp className="h-4 w-4" /> Retirada</p><p className="font-bold text-foreground">{fmtDate(r.start)}</p></div>
                <div><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarArrowDown className="h-4 w-4" /> Devolução</p><p className="font-bold text-foreground">{fmtDate(r.end)}</p></div>
              </div>
              <div className="flex items-center justify-between gap-4 md:w-64 md:justify-end">
                <p className="text-2xl font-extrabold text-foreground">{brl(r.total)}</p>
                {c && <Button variant="outline" size="lg" className="h-12" aria-label="Enviar mensagem" onClick={() => setMsgFor(r.id)}><WhatsAppIcon className="h-5 w-5" /></Button>}
                {r.status !== "finalizada" && r.status !== "aguardando" && (
                  <Button variant="outline" size="lg" className="h-12" disabled={finishing === r.id} onClick={() => finish(r.id)}>{finishing === r.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCheck className="h-5 w-5" />} Devolvido</Button>
                )}
              </div>
            </article>
          );
        })}
        {list.length === 0 && <p className="rounded-2xl bg-muted p-8 text-center text-lg text-muted-foreground">Nenhuma locação nesta situação.</p>}
      </div>
      <RentalForm open={open} onOpenChange={setOpen} />
      {msgClient && <MessageDialog open={!!msgFor} onOpenChange={(o) => { if (!o) setMsgFor(null); }} client={msgClient} rental={msgRental} />}
    </>
  );
}
