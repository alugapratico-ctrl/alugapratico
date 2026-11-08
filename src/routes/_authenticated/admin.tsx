import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Rocket, KeyRound, Activity, Search, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { WhatsAppIcon } from "@/components/SupportButton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchIsAdmin, engagementOf, type BetaUser, type Engagement } from "@/lib/admin";
import { whatsappNumber } from "@/lib/messages";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => seo("Painel Admin", "Acompanhe os locadores do beta do AlugaPrático."),
  // Só esconde a tela; os dados são protegidos pelo banco, que recusa quem não é admin.
  beforeLoad: async () => {
    if (!(await fetchIsAdmin())) throw redirect({ to: "/painel" });
  },
  component: AdminPage,
});

const ENG: Record<Engagement, { label: string; cls: string }> = {
  ativo: { label: "Ativo", cls: "bg-success/15 text-success" },
  iniciando: { label: "Iniciando", cls: "bg-info/15 text-info" },
  pendente: { label: "Pendente", cls: "bg-warning/15 text-warning" },
  inativo: { label: "Inativo", cls: "bg-muted text-muted-foreground" },
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

function AdminPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"locadores" | "auditoria">("locadores");

  useEffect(() => { void supabase.rpc("admin_log_view").then(() => undefined); }, []);

  const users = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw error;
      return (data ?? []) as BetaUser[];
    },
  });
  const audit = useQuery({
    queryKey: ["admin-audit"],
    enabled: tab === "auditoria",
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const setRole = useMutation({
    mutationFn: async (v: { id: string; admin: boolean }) => {
      const { error } = await supabase.rpc("admin_set_role", { _target: v.id, _make_admin: v.admin });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Acesso atualizado"); void qc.invalidateQueries({ queryKey: ["admin-overview"] }); void qc.invalidateQueries({ queryKey: ["admin-audit"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = users.data ?? [];
  const now = new Date();
  const week = now.getTime() - 7 * 86_400_000;
  const stats = {
    total: list.length,
    novos: list.filter((u) => new Date(u.created_at).getTime() > week).length,
    ativados: list.filter((u) => Number(u.rentals) > 0).length,
    locacoes: list.reduce((s, u) => s + Number(u.rentals), 0),
    devolvidas: list.reduce((s, u) => s + Number(u.returned), 0),
    ativos7: list.filter((u) => u.last_activity && new Date(u.last_activity).getTime() > week).length,
  };
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return list.filter((u) => !t || [u.full_name, u.email, u.business_name, u.city].some((v) => v?.toLowerCase().includes(t)));
  }, [list, q]);
  const nameOf = (id: string | null) => list.find((u) => u.user_id === id)?.full_name ?? list.find((u) => u.user_id === id)?.email ?? "—";

  return (
    <div>
      <PageHeader title="Painel Admin" subtitle="Acompanhe quem está usando o beta." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Locadores" value={stats.total} hint={`+${stats.novos} nos últimos 7 dias`} />
        <Stat icon={Rocket} label="Ativados" value={stats.ativados} hint={stats.total ? `${Math.round((stats.ativados / stats.total) * 100)}% fizeram 1 locação` : "—"} />
        <Stat icon={KeyRound} label="Locações" value={stats.locacoes} hint={`${stats.devolvidas} devolvidas`} />
        <Stat icon={Activity} label="Ativos (7 dias)" value={stats.ativos7} hint="com acesso recente" />
      </div>

      <div className="mb-4 flex gap-2">
        {(["locadores", "auditoria"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
            {t === "locadores" ? "Locadores" : "Auditoria"}
          </button>
        ))}
      </div>

      {tab === "locadores" ? (
        <Panel title="Locadores do beta">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail, negócio ou cidade" className="pl-9" />
          </div>
          {users.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> :
           users.error ? <p className="text-destructive">Não foi possível carregar: {users.error.message}</p> :
           filtered.length === 0 ? <p className="text-muted-foreground">Nenhum locador encontrado.</p> : (
            <ul className="divide-y divide-border">
              {filtered.map((u) => {
                const e = ENG[engagementOf(u, now)];
                const wa = u.phone ? whatsappNumber(u.phone) : null;
                return (
                  <li key={u.user_id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground">{u.full_name || "Sem nome"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.cls}`}>{e.label}</span>
                        {u.is_admin && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{[u.business_name, u.city, u.email].filter(Boolean).join(" · ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cadastro {fmt(u.created_at)} · Última atividade {fmt(u.last_activity)} · {u.products} produtos · {u.clients} clientes · {u.rentals} locações · {u.messages} mensagens
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-whatsapp px-3 py-2 text-sm font-semibold text-whatsapp-foreground"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>}
                      {u.email && <a href={`mailto:${u.email}`} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-foreground"><Mail className="h-4 w-4" />E-mail</a>}
                      <button
                        disabled={setRole.isPending}
                        onClick={() => { if (confirm(u.is_admin ? "Remover acesso de admin?" : "Dar acesso de admin a este usuário?")) setRole.mutate({ id: u.user_id, admin: !u.is_admin }); }}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground">
                        <ShieldCheck className="h-4 w-4" />{u.is_admin ? "Remover admin" : "Tornar admin"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel title="Registro de ações de administradores">
          {audit.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : (
            <ul className="divide-y divide-border text-sm">
              {(audit.data ?? []).map((a) => (
                <li key={a.id} className="py-2">
                  <span className="font-semibold">{nameOf(a.admin_id)}</span>{" "}
                  {a.action === "abriu_painel" ? "abriu o painel" : a.action === "tornar_admin" ? `deu acesso de admin a ${nameOf(a.target_user_id)}` : `removeu o admin de ${nameOf(a.target_user_id)}`}
                  <span className="text-muted-foreground"> · {new Date(a.created_at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-3xl font-extrabold text-foreground">{value}</p>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
