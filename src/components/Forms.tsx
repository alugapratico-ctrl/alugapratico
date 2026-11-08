import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CATEGORIES, brl, calcTotal, useStore, TODAY, type Billing, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SpecificFieldsSection } from "@/components/ProductDetails";
import { buildDetails, detailsToForm, hasDetailValues, type DetailForm } from "@/lib/product-details";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-base font-bold">{label}</Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls = "h-12 text-base";
const selectCls = "h-12 w-full rounded-md border border-input bg-card px-3 text-base text-foreground";

function Shell({ open, onOpenChange, title, desc, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; desc: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base">{desc}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "h-12 rounded-xl border-2 text-base font-semibold transition-colors",
            value === o.v ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

const ok = (msg: string) => toast.success(msg, { icon: <CheckCircle2 className="h-5 w-5" /> });
const fail = (err: unknown) => toast.error(err instanceof Error ? err.message : "Não foi possível salvar agora. Tente novamente.");

function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={busy} className="h-14 w-full text-lg">
      {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</> : children}
    </Button>
  );
}

const EMPTY_DETAILS: DetailForm = { values: {}, custom: [] };

export function ProductForm({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product?: Product | undefined }) {
  const { addProduct, updateProduct } = useStore();
  const empty = { name: "", category: CATEGORIES[0] as string, description: "", price: "", billing: "diária" as Billing, available: "sim" as "sim" | "nao", photo: undefined as string | undefined };
  const [f, setF] = useState(empty);
  // Informações específicas guardadas por categoria: trocar e voltar a categoria não perde o que foi digitado.
  const [detailForms, setDetailForms] = useState<Record<string, DetailForm>>({});
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setFormKey((k) => k + 1);
      setF(product ? { name: product.name, category: product.category, description: product.description, billing: product.billing, photo: product.photo, price: String(product.price), available: product.available ? "sim" : "nao" } : empty);
      setDetailForms(product ? { [product.category]: detailsToForm(product.details) } : {});
      setPendingCategory(null);
      setPhotoFile(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const detailForm = detailForms[f.category] ?? EMPTY_DETAILS;
  const changeCategory = (next: string) => {
    if (next === f.category) return;
    if (hasDetailValues(f.category, detailForm)) setPendingCategory(next);
    else setF({ ...f, category: next });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const price = Number(f.price);
    if (!f.name.trim() || !f.price) { toast.error("Preencha o nome e o valor do produto."); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error("Digite um valor válido para a locação."); return; }
    if (f.name.trim().length > 150) { toast.error("O nome pode ter no máximo 150 caracteres."); return; }
    const built = buildDetails(f.category, detailForm);
    if (built.error) { toast.error(built.error); return; }
    const data = { name: f.name, category: f.category, description: f.description, price, billing: f.billing, available: f.available === "sim", details: built.details };
    setBusy(true);
    try {
      if (product) { await updateProduct(product.id, data, photoFile); ok("Produto atualizado com sucesso!"); }
      else { await addProduct(data, photoFile); ok("Produto cadastrado com sucesso!"); }
      onOpenChange(false);
    } catch (err) { fail(err); }
    setBusy(false);
  };

  return (
    <Shell open={open} onOpenChange={onOpenChange} title={product ? "Editar produto" : "Cadastrar produto"} desc="Preencha as informações do item que você aluga.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Nome do produto"><Input className={inputCls} placeholder="Ex.: Furadeira de impacto" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Categoria">
          <select className={selectCls} value={f.category} onChange={(e) => changeCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            {!CATEGORIES.includes(f.category) && <option>{f.category}</option>}
          </select>
        </Field>
        <Field label="Descrição" hint="Conte detalhes importantes, como tamanho ou estado."><Textarea className="text-base" placeholder="Ex.: Acompanha 2 baterias e maleta" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Valor da locação (R$)"><Input className={inputCls} type="number" min="0" placeholder="Ex.: 50" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        <Field label="Tipo de cobrança">
          <Choice value={f.billing} onChange={(v) => setF({ ...f, billing: v })} options={[{ v: "diária", l: "Diária" }, { v: "semanal", l: "Semanal" }, { v: "mensal", l: "Mensal" }]} />
        </Field>
        <SpecificFieldsSection key={`${formKey}-${f.category}`} category={f.category} form={detailForm}
          defaultOpen={hasDetailValues(f.category, detailForm)}
          onChange={(d) => setDetailForms((all) => ({ ...all, [f.category]: d }))} />
        <Field label="Fotografias" hint="Escolha uma foto do seu celular ou computador.">
          <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-input bg-muted p-4">
            {f.photo ? <img src={f.photo} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <ImagePlus className="h-8 w-8 text-primary" />}
            <span className="text-base font-semibold text-foreground">{f.photo ? "Trocar foto" : "Adicionar foto"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { if (file.size > 5 * 1024 * 1024) { toast.error("A foto é muito grande. Escolha uma de até 5 MB."); return; } setPhotoFile(file); setF({ ...f, photo: URL.createObjectURL(file) }); } }} />
          </label>
        </Field>
        <Field label="Disponibilidade">
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "sim", l: "Disponível" }, { v: "nao", l: "Indisponível" }].map((o) => (
              <button type="button" key={o.v} onClick={() => setF({ ...f, available: o.v as "sim" | "nao" })}
                className={cn("h-12 rounded-xl border-2 text-base font-semibold", f.available === o.v ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground")}>{o.l}</button>
            ))}
          </div>
        </Field>
        <SubmitButton busy={busy}>{product ? "Salvar alterações" : "Cadastrar produto"}</SubmitButton>
      </form>
      <AlertDialog open={pendingCategory !== null} onOpenChange={(o) => { if (!o) setPendingCategory(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Trocar a categoria?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              As informações específicas de “{f.category}” não servem para “{pendingCategory}”. Se você salvar com a nova categoria, elas serão removidas deste produto.
              Enquanto não salvar, nada muda — e se voltar para “{f.category}”, tudo o que você digitou continua aqui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base">Manter “{f.category}”</AlertDialogCancel>
            <AlertDialogAction className="h-12 text-base" onClick={() => { if (pendingCategory) setF({ ...f, category: pendingCategory }); setPendingCategory(null); }}>
              Trocar categoria
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}

export function ClientForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addClient } = useStore();
  const [f, setF] = useState({ name: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setF({ name: "", phone: "", email: "", notes: "" }); }, [open]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!f.name.trim() || !f.phone.trim()) { toast.error("Preencha o nome e o telefone."); return; }
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { toast.error("Digite um e-mail válido ou deixe em branco."); return; }
    setBusy(true);
    try {
      await addClient({ name: f.name, phone: f.phone, email: f.email || undefined, notes: f.notes || undefined });
      ok("Cliente cadastrado com sucesso!");
      onOpenChange(false);
    } catch (err) { fail(err); }
    setBusy(false);
  };
  return (
    <Shell open={open} onOpenChange={onOpenChange} title="Cadastrar cliente" desc="Só o nome e o telefone são obrigatórios.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Nome completo"><Input className={inputCls} placeholder="Ex.: Maria da Silva" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Telefone"><Input className={inputCls} type="tel" placeholder="Ex.: (11) 98765-4321" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="E-mail (opcional)"><Input className={inputCls} type="email" placeholder="Ex.: maria@email.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Observações (opcional)"><Textarea className="text-base" placeholder="Ex.: Prefere contato pelo WhatsApp" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <SubmitButton busy={busy}>Cadastrar cliente</SubmitButton>
      </form>
    </Shell>
  );
}

export function RentalForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { clients, products, addRental } = useStore();
  const [f, setF] = useState({ clientId: "", productId: "", start: TODAY, end: "", total: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setF({ clientId: "", productId: "", start: TODAY, end: "", total: "" }); }, [open]);
  const prod = products.find((p) => p.id === f.productId);
  const suggested = prod && f.start && f.end && f.end >= f.start ? calcTotal(prod.price, prod.billing, f.start, f.end) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!f.clientId || !f.productId || !f.end) { toast.error("Escolha o cliente, o produto e as datas."); return; }
    if (f.end < f.start) { toast.error("A devolução precisa ser depois da retirada."); return; }
    const total = Number(f.total) || suggested || 0;
    setBusy(true);
    try {
      await addRental({ clientId: f.clientId, productId: f.productId, start: f.start, end: f.end, total, status: f.start > TODAY ? "aguardando" : "andamento", paid: false });
      ok("Locação registrada com sucesso!");
      onOpenChange(false);
    } catch (err) { fail(err); }
    setBusy(false);
  };

  return (
    <Shell open={open} onOpenChange={onOpenChange} title="Registrar locação" desc="Escolha quem vai alugar, o quê e por quanto tempo.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="1. Cliente">
          <select className={selectCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">Selecione o cliente</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="2. Produto">
          <select className={selectCls} value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
            <option value="">Selecione o produto</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.available ? "" : " (alugado)"}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="3. Retirada"><Input className={inputCls} type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
          <Field label="4. Devolução"><Input className={inputCls} type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
        </div>
        <Field label="5. Valor total (R$)" hint={suggested ? `Valor sugerido pelo sistema: ${brl(suggested)}` : "Escolha produto e datas para ver o valor sugerido."}>
          <Input className={inputCls} type="number" min="0" placeholder={suggested ? String(suggested) : "Ex.: 300"} value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
        </Field>
        {(clients.length === 0 || products.length === 0) && (
          <p className="rounded-xl bg-warning-soft p-3 text-sm font-semibold text-warning">Antes de registrar uma locação, cadastre pelo menos um cliente e um produto.</p>
        )}
        <SubmitButton busy={busy}>Registrar locação</SubmitButton>
      </form>
    </Shell>
  );
}
