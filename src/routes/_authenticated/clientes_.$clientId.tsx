import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageDialog } from "@/components/MessageDialog";
import { WhatsAppIcon } from "@/components/SupportButton";
import { TEMPLATES } from "@/lib/messages";
import { ArrowLeft, Mail, Phone, UserX, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/AppShell";
import { FinesSection, rentalLabel } from "@/components/Fines";
import { brl, STATUS_INFO, useStore } from "@/lib/store";
import { RemoveOrArchive } from "@/components/RemoveOrArchive";
import { useNavigate } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/clientes_/$clientId")({
  head: () => seo("Detalhes do cliente", "Contato, locações e multas de um cliente."),
  component: ClienteDetalhes,
});

function ClienteDetalhes() {
  const { clientId } = Route.useParams();
  const { clients, rentals, products, fines, deleteClient, setClientArchived } = useStore();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);
  const [msg, setMsg] = useState<{ rentalId?: string } | null>(null);
  const history = useQuery({
    queryKey: ["comunicacoes", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("communications").select("id, channel, template, created_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!client) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><UserX className="h-8 w-8" /></span>
        <h1 className="text-2xl font-extrabold text-foreground">Cliente não encontrado</h1>
        <p className="text-base text-muted-foreground">Ele pode ter sido removido ou não pertence à sua conta.</p>
        <Button asChild size="lg" className="h-14 px-8 text-lg"><Link to="/clientes">Voltar para clientes</Link></Button>
      </div>
    );
  }

  const clientRentals = rentals.filter((r) => r.clientId === client.id);

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-2 text-base font-semibold text-primary"><ArrowLeft className="h-5 w-5" /> Voltar para clientes</Link>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-primary">{client.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-extrabold text-foreground">{client.name}</h1>
            {client.notes && <p className="text-base text-muted-foreground">{client.notes}</p>}
            {client.archived && <StatusPill label="Desativado" className="mt-1 bg-muted text-muted-foreground" />}
          </div>
        </div>
        <div className="mt-4">
          <RemoveOrArchive name={client.name} archived={client.archived} archiveLabel="Desativar" className="h-12 text-base"
            hasHistory={rentals.some((r) => r.clientId === client.id) || fines.some((f) => f.clientId === client.id) || (history.data?.length ?? 0) > 0}
            onDelete={async () => { await deleteClient(client.id); void navigate({ to: "/clientes" }); }}
            onArchive={() => setClientArchived(client.id, true)} onRestore={() => setClientArchived(client.id, false)} />
        </div>
        <div className="mt-4 flex flex-col gap-2 text-base text-foreground sm:flex-row sm:gap-6">
          <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{client.phone}</span>
          <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{client.email ?? <span className="text-muted-foreground">Não informado</span>}</span>
        </div>
        <Button size="lg" className="mt-4 h-12 w-full sm:w-auto" onClick={() => setMsg({})}><Send className="h-5 w-5" /> Enviar mensagem</Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="mb-3 text-2xl font-extrabold text-foreground">Locações</h2>
        {clientRentals.length === 0 ? (
          <p className="rounded-xl bg-muted p-6 text-center text-lg text-muted-foreground">Nenhuma locação registrada para este cliente.</p>
        ) : (
          <ul className="divide-y divide-border">
            {clientRentals.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-base font-semibold text-foreground">{rentalLabel(r, products)}</span>
                <span className="flex items-center gap-2"><span className="text-base font-bold">{brl(r.total)}</span><StatusPill label={STATUS_INFO[r.status].label} className={STATUS_INFO[r.status].className} />
                  <Button variant="outline" size="sm" className="h-10" aria-label="Mensagem sobre esta locação" onClick={() => setMsg({ rentalId: r.id })}><WhatsAppIcon className="h-4 w-4" /></Button></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="mb-3 text-2xl font-extrabold text-foreground">Mensagens enviadas</h2>
        {(history.data ?? []).length === 0 ? <p className="text-base text-muted-foreground">Nenhuma mensagem registrada ainda.</p> : (
          <ul className="divide-y divide-border">
            {history.data!.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-base">
                <span className="font-semibold text-foreground">{TEMPLATES.find((t) => t.id === h.template)?.label ?? h.template}</span>
                <span className="text-sm text-muted-foreground">{h.channel === "whatsapp" ? "WhatsApp" : "E-mail"} · {new Date(h.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FinesSection client={client} />
      <MessageDialog open={!!msg} onOpenChange={(o) => { if (!o) setMsg(null); }} client={client} rental={msg?.rentalId ? clientRentals.find((r) => r.id === msg.rentalId) : undefined} />
    </div>
  );
}
