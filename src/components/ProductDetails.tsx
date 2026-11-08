import { useState } from "react";
import { ChevronDown, ListPlus, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/AppShell";
import { allowsCustomFields, detailEntries, fieldsFor, MAX_CUSTOM_FIELDS, type DetailField, type DetailForm } from "@/lib/product-details";
import { brl, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

const inputCls = "h-12 text-base";
const selectCls = "h-12 w-full rounded-md border border-input bg-card px-3 text-base text-foreground";

function FieldInput({ field, value, onChange }: { field: DetailField; value: string; onChange: (v: string) => void }) {
  const id = `detail-${field.key}`;
  let control;
  if (field.type === "select") {
    control = (
      <select id={id} className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Não informado</option>
        {field.options?.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  } else if (field.type === "yesno") {
    control = (
      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={id}>
        {[{ v: "sim", l: "Sim" }, { v: "nao", l: "Não" }].map((o) => (
          <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(value === o.v ? "" : o.v)}
            className={cn("h-12 rounded-xl border-2 text-base font-semibold transition-colors", value === o.v ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground")}>
            {o.l}
          </button>
        ))}
      </div>
    );
  } else if (field.type === "textarea") {
    control = <Textarea id={id} className="text-base" placeholder={field.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />;
  } else {
    control = (
      <div className="relative">
        <Input id={id} className={cn(inputCls, field.suffix && "pr-14", field.upper && "uppercase")}
          type={field.type === "number" ? "number" : "text"} inputMode={field.type === "number" ? (field.decimal ? "decimal" : "numeric") : undefined}
          min={field.type === "number" ? (field.min ?? 0) : undefined} max={field.max} step={field.decimal ? "any" : undefined}
          placeholder={field.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        {field.suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">{field.suffix}</span>}
      </div>
    );
  }
  return (
    <div className={cn("space-y-2", field.wide && "sm:col-span-2")}>
      <Label htmlFor={field.type === "yesno" ? undefined : id} id={field.type === "yesno" ? id : undefined} className="text-base font-bold">{field.label}</Label>
      {control}
    </div>
  );
}

/** Seção "Informações específicas do produto" do formulário, que muda conforme a categoria. */
export function SpecificFieldsSection({ category, form, onChange, defaultOpen }: {
  category: string; form: DetailForm; onChange: (f: DetailForm) => void; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const fields = fieldsFor(category);
  const custom = allowsCustomFields(category);
  if (!fields.length && !custom) return null;
  const filled = fields.filter((f) => (form.values[f.key] ?? "").trim()).length + (custom ? form.custom.filter((c) => c.label.trim()).length : 0);
  const setValue = (key: string, v: string) => onChange({ ...form, values: { ...form.values, [key]: v } });
  const setCustom = (i: number, patch: Partial<{ label: string; value: string }>) =>
    onChange({ ...form, custom: form.custom.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border-2 border-border bg-card">
      <CollapsibleTrigger type="button" className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><ListPlus className="h-5 w-5" /></span>
          <span>
            <span className="block text-base font-bold text-foreground">Informações específicas do produto</span>
            <span className="block text-sm text-muted-foreground">{filled ? `${filled} preenchida${filled > 1 ? "s" : ""}` : "Opcional"} · {category}</span>
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t border-border p-4">
        {fields.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => <FieldInput key={`${category}-${f.key}`} field={f} value={form.values[f.key] ?? ""} onChange={(v) => setValue(f.key, v)} />)}
          </div>
        )}
        {custom && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Adicione as informações que quiser. Ex.: Material: madeira; Potência: 500W; Cor: preta.</p>
            {form.custom.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-muted p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                <Input aria-label={`Nome do campo ${i + 1}`} className={cn(inputCls, "bg-card")} placeholder="Nome do campo" value={c.label} onChange={(e) => setCustom(i, { label: e.target.value })} />
                <Input aria-label={`Valor do campo ${i + 1}`} className={cn(inputCls, "col-start-1 bg-card sm:col-start-auto")} placeholder="Valor ou descrição" value={c.value} onChange={(e) => setCustom(i, { value: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" className="row-start-1 h-12 w-12 text-destructive sm:row-start-auto" aria-label={`Remover campo ${i + 1}`}
                  onClick={() => onChange({ ...form, custom: form.custom.filter((_, j) => j !== i) })}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
            {form.custom.length < MAX_CUSTOM_FIELDS && (
              <Button type="button" variant="outline" size="lg" className="h-12 w-full text-base" onClick={() => onChange({ ...form, custom: [...form.custom, { label: "", value: "" }] })}>
                <Plus className="h-5 w-5" /> Adicionar campo
              </Button>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

const billingUnit = (b: Product["billing"]) => (b === "diária" ? "dia" : b === "semanal" ? "semana" : "mês");

/** Janela com todos os detalhes de um produto. */
export function ProductDetailsDialog({ product, open, onOpenChange, onEdit }: {
  product: Product | undefined; open: boolean; onOpenChange: (o: boolean) => void; onEdit: (p: Product) => void;
}) {
  const entries = product ? detailEntries(product.category, product.details) : [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {product && (
          <>
            <DialogHeader>
              <p className="text-sm font-semibold text-primary">{product.category}</p>
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
              <DialogDescription className="text-base">Todas as informações deste produto.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {product.photo ? <img src={product.photo} alt={product.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-14 w-14" /></div>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xl"><span className="font-extrabold text-foreground">{brl(product.price)}</span> <span className="text-muted-foreground">/ {billingUnit(product.billing)}</span></p>
                <StatusPill label={product.maintenance ? "Em manutenção" : product.available ? "Disponível" : "Alugado"}
                  className={product.maintenance ? "bg-warning-soft text-warning" : product.available ? "bg-success-soft text-success" : "bg-info-soft text-info"} />
              </div>
              {product.description && <p className="text-base text-foreground">{product.description}</p>}
              <section className="rounded-2xl border border-border p-4">
                <h3 className="mb-3 text-lg font-bold text-foreground">Informações específicas do produto</h3>
                {entries.length ? (
                  <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    {entries.map((e, i) => (
                      <div key={`${e.label}-${i}`}>
                        <dt className="text-sm font-semibold text-muted-foreground">{e.label}</dt>
                        <dd className="whitespace-pre-line break-words text-base font-semibold text-foreground">{e.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-base text-muted-foreground">Nenhuma informação específica cadastrada ainda. Toque em “Editar” para adicionar.</p>
                )}
              </section>
              <Button size="lg" className="h-14 w-full text-lg" onClick={() => onEdit(product)}><Pencil className="h-5 w-5" /> Editar produto</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
