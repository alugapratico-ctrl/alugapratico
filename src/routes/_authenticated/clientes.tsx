import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Phone, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/AppShell";
import { ClientForm } from "@/components/Forms";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => seo("Clientes", "Lista das pessoas e empresas que alugam com você."),
  component: Clientes,
});

function Clientes() {
  const { clients, rentals, fines } = useStore();
  const pending = (id: string) => fines.filter((f) => f.clientId === id && f.status === "pendente").length;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const count = (id: string) => rentals.filter((r) => r.clientId === id).length;

  return (
    <>
      <PageHeader title="Clientes" subtitle="Quem aluga com você."
        action={<Button size="lg" className="h-14 px-6 text-lg" onClick={() => setOpen(true)}><Plus className="h-5 w-5" /> Cadastrar cliente</Button>} />
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-14 pl-12 text-base" placeholder="Procurar cliente pelo nome" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="hidden grid-cols-[2fr_1.3fr_1.8fr_1fr] gap-4 bg-muted px-6 py-3 text-sm font-bold text-muted-foreground md:grid">
          <span>Nome</span><span>Telefone</span><span>E-mail</span><span className="text-right">Locações</span>
        </div>
        <ul className="divide-y divide-border">
          {list.map((c) => (
            <li key={c.id} className="grid gap-2 px-5 py-4 md:grid-cols-[2fr_1.3fr_1.8fr_1fr] md:items-center md:gap-4 md:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-primary">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                <div>
                  <Link to="/clientes/$clientId" params={{ clientId: c.id }} className="text-lg font-bold text-foreground underline-offset-4 hover:text-primary hover:underline">{c.name}</Link>
                  {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
                  <Link to="/clientes/$clientId" params={{ clientId: c.id }} className="mt-1 flex items-center gap-1 text-sm font-semibold text-primary">
                    Ver detalhes e multas <ChevronRight className="h-4 w-4" />
                    {pending(c.id) > 0 && <span className="ml-1 rounded-full bg-warning-soft px-2 py-0.5 text-warning">{pending(c.id)} pendente{pending(c.id) > 1 ? "s" : ""}</span>}
                  </Link>
                </div>
              </div>
              <span className="flex items-center gap-2 text-base text-foreground"><Phone className="h-4 w-4 text-muted-foreground" />{c.phone}</span>
              <span className="flex items-center gap-2 text-base text-foreground"><Mail className="h-4 w-4 text-muted-foreground" />{c.email ?? <span className="text-muted-foreground">Não informado</span>}</span>
              <span className="text-base md:text-right"><span className="rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground">{count(c.id)} locações</span></span>
            </li>
          ))}
          {list.length === 0 && <li className="p-8 text-center text-lg text-muted-foreground">Nenhum cliente encontrado.</li>}
        </ul>
      </div>
      <ClientForm open={open} onOpenChange={setOpen} />
    </>
  );
}
