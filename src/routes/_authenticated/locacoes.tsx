import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, CalendarArrowUp, CalendarArrowDown, CheckCheck, Loader2, Pencil, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, StatusPill } from "@/components/AppShell";
import { RentalForm } from "@/components/Forms";
import { MessageDialog } from "@/components/MessageDialog";
import { WhatsAppIcon } from "@/components/SupportButton";
import { useStore, brl, fmtDate, STATUS_INFO, type Rental, type RentalStatus } from "@/lib/store";
import { isActiveRental } from "@/lib/availability";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/locacoes")({
  head: () => seo("Locações", "Acompanhe todos os aluguéis e suas situações."),
  component: Locacoes,
});

function Locacoes() {
  const { rentals, clients, products, finishRental, cancelRental } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (id: string, fn: () => Promise<void>, okMsg: string) => {
    setBusy(id);
    try { await fn(); toast.success(okMsg); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Não foi possível salvar agora."); }
    setBusy(null);
  };
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rental | undefined>();
  const [cancelling, setCancelling] = useState<Rental | undefined>();
  const [msgFor, setMsgFor] = useState<string | null>(null);
  const msgRental = rentals.find((r) => r.id === msgFor);
  const msgClient = msgRental ? clients.find((c) => c.id === msgRental.clientId) : undefined;
  const [filter, setFilter] = useState<RentalStatus | "todas">("todas");
  const list = filter === "todas" ? rentals : rentals.filter((r) => r.status === filter);
  const keys = Object.keys(STATUS_INFO) as RentalStatus[];

  return (
    <>
      <PageHeader title="Locações" subtitle="Todos os aluguéis, do mais novo ao mais antigo."
        action={<Button size="lg" className="h-14 w-full px-6 text-lg sm:w-auto" onClick={() => { setEditing(undefined); setOpen(true); }}><Plus className="h-5 w-5" /> Registrar locação</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button onClick={() => setFilter("todas")} className={cn("min-w-0 rounded-2xl border-2 p-4 text-left", filter === "todas" ? "border-primary bg-accent" : "border-border bg-card")}>
          <p className="text-2xl font-extrabold text-foreground">{rentals.length}</p><p className="truncate font-semibold text-muted-foreground">Todas</p>
        </button>
        {keys.map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("min-w-0 rounded-2xl border-2 p-4 text-left", filter === k ? "border-primary bg-accent" : "border-border bg-card")}>
            <p className="flex items-center gap-2 text-2xl font-extrabold text-foreground"><span className={cn("h-3 w-3 shrink-0 rounded-full", STATUS_INFO[k].dot)} />{rentals.filter((r) => r.status === k).length}</p>
            <p className="font-semibold leading-tight text-muted-foreground">{STATUS_INFO[k].label}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((r) => {
          const c = clients.find((x) => x.id === r.clientId);
          const p = products.find((x) => x.id === r.productId);
          const s = STATUS_INFO[r.status];
          const active = isActiveRental(r.status);
          return (
            <article key={r.id} className={cn("flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5 lg:flex-row lg:items-center", !active && r.status === "cancelada" && "opacity-75")}>
              <div className="min-w-0 flex-1">
                <StatusPill label={s.label} className={s.className} />
                <h3 className="mt-2 truncate text-xl font-bold text-foreground">{c?.name}</h3>
                <p className="truncate text-base text-muted-foreground">{p?.name}{r.quantity > 1 ? ` · ${r.quantity} unidades` : ""}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-base lg:w-72">
                <div className="min-w-0"><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarArrowUp className="h-4 w-4 shrink-0" /> Retirada</p><p className="font-bold text-foreground">{fmtDate(r.start)}</p></div>
                <div className="min-w-0"><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarArrowDown className="h-4 w-4 shrink-0" /> Devolução</p><p className="font-bold text-foreground">{fmtDate(r.end)}</p></div>
              </div>
              <div className="flex min-w-0 flex-col gap-3 lg:w-auto lg:items-end">
                <p className={cn("text-2xl font-extrabold text-foreground", r.status === "cancelada" && "line-through")}>{brl(r.total)}</p>
                <div className="flex flex-wrap gap-2">
                  {c && <Button variant="outline" size="lg" className="h-12" aria-label="Enviar mensagem" onClick={() => setMsgFor(r.id)}><WhatsAppIcon className="h-5 w-5" /></Button>}
                  {active && <Button variant="outline" size="lg" className="h-12" aria-label="Editar locação" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-5 w-5" /> Editar</Button>}
                  {active && r.status !== "aguardando" && (
                    <Button variant="outline" size="lg" className="h-12" disabled={busy === r.id}
                      onClick={() => run(r.id, () => finishRental(r.id), "Devolução registrada! As unidades voltaram ao estoque.")}>
                      {busy === r.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCheck className="h-5 w-5" />} Devolvido
                    </Button>
                  )}
                  {active && <Button variant="outline" size="lg" className="h-12 text-destructive" disabled={busy === r.id} onClick={() => setCancelling(r)}><Ban className="h-5 w-5" /> Cancelar</Button>}
                </div>
              </div>
            </article>
          );
        })}
        {list.length === 0 && <p className="rounded-2xl bg-muted p-8 text-center text-lg text-muted-foreground">Nenhuma locação nesta situação.</p>}
      </div>
      <RentalForm open={open} onOpenChange={setOpen} rental={editing} />
      <AlertDialog open={!!cancelling} onOpenChange={(o) => { if (!o) setCancelling(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Cancelar esta locação?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              As unidades reservadas voltam para o estoque. A locação continua no histórico como “Cancelada” e não poderá ser reaberta nem marcada como devolvida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base">Voltar</AlertDialogCancel>
            <AlertDialogAction className="h-12 text-base" onClick={() => { const r = cancelling; setCancelling(undefined); if (r) void run(r.id, () => cancelRental(r.id), "Locação cancelada. O estoque foi liberado."); }}>
              Sim, cancelar locação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {msgClient && <MessageDialog open={!!msgFor} onOpenChange={(o) => { if (!o) setMsgFor(null); }} client={msgClient} rental={msgRental} />}
    </>
  );
}
