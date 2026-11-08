import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, CheckCircle2, FileText, Loader2, Paperclip, Pencil, Plus, ReceiptText, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/AppShell";
import { attachmentError, filterFines, FINE_STATUS, FINE_STATUSES, fineTotals, type Fine, type FineStatus } from "@/lib/fines";
import { brl, fmtDate, TODAY, useStore, type Client, type Product, type Rental } from "@/lib/store";
import { cn } from "@/lib/utils";

const VEHICLE_CATEGORY = "Veículos";
const inputCls = "h-12 text-base";
const selectCls = "h-12 w-full rounded-md border border-input bg-card px-3 text-base text-foreground";

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string | undefined; htmlFor?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-base font-bold">{label}</Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const vehicleLabel = (p: Product) => {
  const plate = typeof p.details["placa"] === "string" ? p.details["placa"] : "";
  return plate ? `${p.name} (${plate})` : p.name;
};
export const rentalLabel = (r: Rental, products: Product[]) =>
  `${products.find((p) => p.id === r.productId)?.name ?? "Produto removido"} · ${fmtDate(r.start)} a ${fmtDate(r.end)}`;

type FormState = {
  rentalId: string; productId: string; infractionDate: string; description: string; amount: string;
  dueDate: string; status: FineStatus; notes: string;
};
const emptyForm = (): FormState => ({ rentalId: "", productId: "", infractionDate: TODAY, description: "", amount: "", dueDate: "", status: "pendente", notes: "" });

export function FineForm({ client, fine, open, onOpenChange }: { client: Client; fine?: Fine | undefined; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { rentals, products, addFine, updateFine } = useStore();
  const [f, setF] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | undefined>();
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(fine ? {
      rentalId: fine.rentalId ?? "", productId: fine.productId ?? "", infractionDate: fine.infractionDate, description: fine.description,
      amount: String(fine.amount), dueDate: fine.dueDate ?? "", status: fine.status, notes: fine.notes ?? "",
    } : emptyForm());
    setFile(undefined);
    setRemoveAttachment(false);
  }, [open, fine]);

  const clientRentals = rentals.filter((r) => r.clientId === client.id);
  const vehicles = products.filter((p) => p.category === VEHICLE_CATEGORY);
  const rental = clientRentals.find((r) => r.id === f.rentalId);
  const rentalProduct = rental ? products.find((p) => p.id === rental.productId) : undefined;
  const rentalVehicle = rentalProduct?.category === VEHICLE_CATEGORY ? rentalProduct : undefined;
  const linkedProduct = products.find((p) => p.id === f.productId);

  const chooseRental = (id: string) => {
    const r = clientRentals.find((x) => x.id === id);
    const p = r ? products.find((x) => x.id === r.productId) : undefined;
    // Ao escolher uma locação de veículo, o veículo daquela locação é identificado sozinho.
    setF({ ...f, rentalId: id, productId: p?.category === VEHICLE_CATEGORY ? p.id : r ? "" : f.productId });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const amount = Number(f.amount.replace(",", "."));
    if (!f.description.trim()) { toast.error("Descreva a infração."); return; }
    if (f.description.trim().length > 500) { toast.error("A descrição pode ter no máximo 500 letras."); return; }
    if (!f.infractionDate) { toast.error("Informe a data da infração."); return; }
    if (!f.amount.trim() || !Number.isFinite(amount) || amount < 0) { toast.error("Digite um valor válido para a multa."); return; }
    if (f.notes.length > 1000) { toast.error("As observações podem ter no máximo 1000 letras."); return; }
    const data = {
      clientId: client.id, rentalId: f.rentalId || undefined, productId: f.productId || undefined, infractionDate: f.infractionDate,
      description: f.description, amount, dueDate: f.dueDate || undefined, status: f.status, notes: f.notes || undefined,
    };
    setBusy(true);
    try {
      if (fine) { await updateFine(fine.id, data, { file, removeAttachment }); toast.success("Multa atualizada!", { icon: <CheckCircle2 className="h-5 w-5" /> }); }
      else { await addFine(data, file); toast.success("Multa registrada!", { icon: <CheckCircle2 className="h-5 w-5" /> }); }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar agora. Tente novamente.");
    }
    setBusy(false);
  };

  const hasSavedAttachment = !!fine?.attachmentPath && !removeAttachment && !file;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{fine ? "Editar multa" : "Registrar multa"}</DialogTitle>
          <DialogDescription className="text-base">Só a data, a descrição e o valor são obrigatórios.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <Field label="Cliente responsável">
            <p className="flex h-12 items-center rounded-md border border-input bg-muted px-3 text-base font-semibold text-foreground">{client.name}</p>
          </Field>
          <Field label="Locação relacionada" htmlFor="fine-rental" hint={clientRentals.length ? undefined : "Este cliente ainda não tem locações registradas."}>
            <select id="fine-rental" className={selectCls} value={f.rentalId} onChange={(e) => chooseRental(e.target.value)}>
              <option value="">Nenhuma locação</option>
              {clientRentals.map((r) => <option key={r.id} value={r.id}>{rentalLabel(r, products)}</option>)}
            </select>
          </Field>
          {rentalVehicle ? (
            <Field label="Veículo relacionado" hint="Veículo que estava nesta locação.">
              <p className="flex h-12 items-center gap-2 rounded-md border border-input bg-muted px-3 text-base font-semibold text-foreground"><Car className="h-5 w-5 text-primary" />{vehicleLabel(rentalVehicle)}</p>
            </Field>
          ) : (vehicles.length > 0 || linkedProduct) && (
            <Field label="Veículo relacionado (opcional)" htmlFor="fine-vehicle">
              <select id="fine-vehicle" className={selectCls} value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
                <option value="">Nenhum veículo</option>
                {vehicles.map((p) => <option key={p.id} value={p.id}>{vehicleLabel(p)}</option>)}
                {linkedProduct && linkedProduct.category !== VEHICLE_CATEGORY && <option value={linkedProduct.id}>{linkedProduct.name}</option>}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data da infração" htmlFor="fine-date"><Input id="fine-date" className={inputCls} type="date" value={f.infractionDate} onChange={(e) => setF({ ...f, infractionDate: e.target.value })} /></Field>
            <Field label="Vencimento" htmlFor="fine-due"><Input id="fine-due" className={inputCls} type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          </div>
          <Field label="Descrição da infração" htmlFor="fine-desc">
            <Textarea id="fine-desc" className="text-base" placeholder="Ex.: Excesso de velocidade na Av. Brasil" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          <Field label="Valor da multa (R$)" htmlFor="fine-amount">
            <Input id="fine-amount" className={inputCls} type="number" min="0" step="0.01" inputMode="decimal" placeholder="Ex.: 195,23" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </Field>
          <Field label="Situação">
            <div className="grid grid-cols-3 gap-2">
              {FINE_STATUSES.map((s) => (
                <button key={s} type="button" aria-pressed={f.status === s} onClick={() => setF({ ...f, status: s })}
                  className={cn("h-12 rounded-xl border-2 text-base font-semibold transition-colors", f.status === s ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground")}>
                  {FINE_STATUS[s].label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Anexo (opcional)" hint="Foto ou PDF da notificação, até 5 MB.">
            {hasSavedAttachment ? (
              <div className="flex items-center gap-3 rounded-xl border-2 border-input bg-muted p-3">
                <Paperclip className="h-5 w-5 shrink-0 text-primary" />
                {fine?.attachmentUrl ? <a href={fine.attachmentUrl} target="_blank" rel="noreferrer" className="flex-1 text-base font-semibold text-primary underline">Ver anexo salvo</a> : <span className="flex-1 text-base font-semibold">Anexo salvo</span>}
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setRemoveAttachment(true)}><X className="h-4 w-4" /> Remover</Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-input bg-muted p-4">
                <Paperclip className="h-6 w-6 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">{file ? file.name : "Adicionar foto ou documento"}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" aria-label="Anexo da multa"
                  onChange={(e) => { const x = e.target.files?.[0]; if (!x) return; const err = attachmentError(x); if (err) { toast.error(err); return; } setFile(x); }} />
              </label>
            )}
          </Field>
          <Field label="Observações (opcional)" htmlFor="fine-notes">
            <Textarea id="fine-notes" className="text-base" placeholder="Ex.: Cliente avisado por WhatsApp" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </Field>
          <Button type="submit" size="lg" disabled={busy} className="h-14 w-full text-lg">
            {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</> : fine ? "Salvar alterações" : "Registrar multa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Seção "Multas e ocorrências" dentro dos detalhes do cliente. */
export function FinesSection({ client }: { client: Client }) {
  const { fines: allFines, rentals, products, setFineStatus, deleteFine } = useStore();
  const fines = allFines.filter((x) => x.clientId === client.id);
  const [filter, setFilter] = useState<FineStatus | "todas">("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fine | undefined>();
  const [deleting, setDeleting] = useState<Fine | undefined>();
  const [busyId, setBusyId] = useState<string | null>(null);
  const totals = fineTotals(fines);
  const list = filterFines(fines, filter);

  const changeStatus = async (fine: Fine, status: FineStatus) => {
    setBusyId(fine.id);
    try { await setFineStatus(fine.id, status); toast.success(`Multa marcada como ${FINE_STATUS[status].label.toLowerCase()}.`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Não foi possível salvar agora."); }
    setBusyId(null);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setBusyId(target.id);
    try { await deleteFine(target.id); toast.success("Multa excluída."); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Não foi possível excluir agora."); }
    setBusyId(null);
    setDeleting(undefined);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6" aria-labelledby="multas-titulo">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="multas-titulo" className="text-2xl font-extrabold text-foreground">Multas e ocorrências</h2>
          <p className="text-base text-muted-foreground">Registre multas e acompanhe se já foram pagas.</p>
        </div>
        <Button size="lg" className="h-12 px-5 text-base" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="h-5 w-5" /> Registrar multa</Button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { l: "Registradas", v: String(totals.count), c: "bg-accent text-accent-foreground" },
          { l: "Pendente", v: brl(totals.pending), c: "bg-warning-soft text-warning" },
          { l: "Pago", v: brl(totals.paid), c: "bg-success-soft text-success" },
        ].map((s) => (
          <div key={s.l} className={cn("rounded-xl p-3 sm:p-4", s.c)}>
            <p className="text-sm font-semibold">{s.l}</p>
            <p className="text-lg font-extrabold sm:text-2xl">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar multas por situação">
        {(["todas", ...FINE_STATUSES] as const).map((s) => (
          <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}
            className={cn("shrink-0 rounded-full border px-4 py-2 text-base font-semibold", filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
            {s === "todas" ? "Todas" : FINE_STATUS[s].plural}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-muted p-8 text-center">
          <ReceiptText className="h-10 w-10 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{fines.length ? "Nenhuma multa com esta situação." : "Nenhuma multa registrada para este cliente."}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((fine) => {
            const rental = rentals.find((r) => r.id === fine.rentalId);
            const vehicle = products.find((p) => p.id === fine.productId);
            return (
              <li key={fine.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><CalendarDays className="h-4 w-4" /> {fmtDate(fine.infractionDate)}{fine.dueDate && <> · vence em {fmtDate(fine.dueDate)}</>}</p>
                    <p className="mt-1 break-words text-lg font-bold text-foreground">{fine.description}</p>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{brl(fine.amount)}</p>
                </div>
                <div className="mt-2 space-y-1 text-base text-muted-foreground">
                  <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0" />{rental ? rentalLabel(rental, products) : fine.rentalId ? "Locação removida" : "Sem locação relacionada"}</p>
                  {vehicle && <p className="flex items-center gap-2"><Car className="h-4 w-4 shrink-0" />{vehicleLabel(vehicle)}</p>}
                  {fine.attachmentUrl && <a href={fine.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-primary underline"><Paperclip className="h-4 w-4" /> Ver anexo</a>}
                  {fine.notes && <p className="break-words text-sm">{fine.notes}</p>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill label={FINE_STATUS[fine.status].label} className={FINE_STATUS[fine.status].className} />
                  <select aria-label="Mudar situação da multa" disabled={busyId === fine.id} value={fine.status}
                    onChange={(e) => changeStatus(fine, e.target.value as FineStatus)}
                    className="h-10 rounded-md border border-input bg-card px-2 text-sm font-semibold text-foreground">
                    {FINE_STATUSES.map((s) => <option key={s} value={s}>Marcar como {FINE_STATUS[s].label.toLowerCase()}</option>)}
                  </select>
                  <span className="flex-1" />
                  <Button variant="outline" size="sm" className="h-10" onClick={() => { setEditing(fine); setFormOpen(true); }}><Pencil className="h-4 w-4" /> Editar</Button>
                  <Button variant="outline" size="sm" className="h-10 text-destructive" onClick={() => setDeleting(fine)}><Trash2 className="h-4 w-4" /> Excluir</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FineForm client={client} fine={editing} open={formOpen} onOpenChange={setFormOpen} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Excluir esta multa?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">“{deleting?.description}” de {deleting ? brl(deleting.amount) : ""} será apagada junto com o anexo. Isso não pode ser desfeito.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="h-12 bg-destructive text-base text-destructive-foreground hover:bg-destructive/90" onClick={(e) => { e.preventDefault(); void confirmDelete(); }}>
              {busyId === deleting?.id ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Excluir multa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
