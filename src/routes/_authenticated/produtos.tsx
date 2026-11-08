import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/AppShell";
import { ProductForm } from "@/components/Forms";
import { ProductDetailsDialog } from "@/components/ProductDetails";
import { detailSummary } from "@/lib/product-details";
import { useStore, brl, CATEGORIES, type Product } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => seo("Meus produtos", "Veja e cadastre os itens que você aluga."),
  component: Produtos,
});

function Produtos() {
  const { products } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [viewing, setViewing] = useState<Product | undefined>();
  // Sempre mostra a versão mais recente do produto (após editar, os detalhes já aparecem atualizados).
  const viewingProduct = viewing ? products.find((x) => x.id === viewing.id) ?? viewing : undefined;
  const [cat, setCat] = useState("Todos");
  const list = cat === "Todos" ? products : products.filter((p) => p.category === cat);

  return (
    <>
      <PageHeader title="Meus produtos" subtitle="Tudo o que você tem para alugar."
        action={<Button size="lg" className="h-14 px-6 text-lg" onClick={() => { setEditing(undefined); setOpen(true); }}><Plus className="h-5 w-5" /> Cadastrar produto</Button>} />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {["Todos", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-4 py-2 text-base font-semibold", cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>{c}</button>
        ))}
      </div>

      {list.length === 0 && <p className="rounded-2xl bg-muted p-8 text-center text-lg text-muted-foreground">Nenhum produto nesta categoria ainda.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="aspect-[4/3] bg-muted">
              {p.photo ? <img src={p.photo} alt={p.name} loading="lazy" width={944} height={704} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-14 w-14" /></div>}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-primary">{p.category}</p>
                <StatusPill label={p.available ? "Disponível" : "Alugado"} className={p.available ? "bg-success-soft text-success" : "bg-info-soft text-info"} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
              {detailSummary(p.category, p.details) && <p className="truncate text-base text-muted-foreground">{detailSummary(p.category, p.details)}</p>}
              <p className="text-lg"><span className="font-extrabold text-foreground">{brl(p.price)}</span> <span className="text-muted-foreground">/ {p.billing === "diária" ? "dia" : p.billing === "semanal" ? "semana" : "mês"}</span></p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="lg" className="h-12 text-base" onClick={() => setViewing(p)}><Eye className="h-4 w-4" /> Detalhes</Button>
                <Button variant="outline" size="lg" className="h-12 text-base" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /> Editar</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <ProductForm open={open} onOpenChange={setOpen} product={editing} />
      <ProductDetailsDialog product={viewingProduct} open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(undefined); }}
        onEdit={(p) => { setViewing(undefined); setEditing(p); setOpen(true); }} />
    </>
  );
}
