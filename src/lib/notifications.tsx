import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeAlerts, type Alert, type Priority } from "@/lib/alerts";
import { DEFAULT_PREFS, useCurrentUser, useProfile } from "@/lib/profile";
import { TODAY, useStore } from "@/lib/store";

export type AppNotification = {
  id: string;
  kind: string;
  priority: Priority;
  title: string;
  body: string;
  linkType: "cliente" | "produto" | "locacao" | null;
  linkId: string | null;
  readAt: string | null;
  createdAt: string;
};

export const notificationsKey = (userId: string) => ["notificacoes", userId] as const;

export function useNotifications() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: notificationsKey(user.id),
    staleTime: 30_000,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (error) throw new Error("Não foi possível carregar as notificações.");
      return (data ?? []).map((n) => ({
        id: n.id, kind: n.kind, priority: n.priority as Priority, title: n.title, body: n.body,
        linkType: n.link_type as AppNotification["linkType"], linkId: n.link_id, readAt: n.read_at, createdAt: n.created_at,
      }));
    },
  });
}

export function useMarkRead() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[] | "all") => {
      let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
      if (ids !== "all") q = q.in("id", ids);
      const { error } = await q;
      if (error) throw new Error("Não foi possível marcar como lida.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationsKey(user.id) }),
  });
}

/** Alertas atuais conforme as preferências do usuário. */
export function useAlerts(): Alert[] {
  const { rentals, clients, products } = useStore();
  const { data: profile } = useProfile();
  const p = profile?.preferences ?? DEFAULT_PREFS;
  return useMemo(
    () => computeAlerts({ rentals, clients, products }, TODAY, { retiradasDevolucoes: p.retiradasDevolucoes, pagamentos: p.pagamentos, antecedencia: p.antecedencia }),
    [rentals, clients, products, p.retiradasDevolucoes, p.pagamentos, p.antecedencia],
  );
}

/** Guarda na central os alertas de "atenção" e "urgente". Cada situação vira uma única notificação (sem repetir). */
export function NotificationsSync() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const alerts = useAlerts();
  const enabled = profile ? profile.preferences.notificacoes : false;
  const signature = alerts.filter((a) => a.priority !== "info").map((a) => a.key).join("|");

  useEffect(() => {
    if (!enabled || !signature) return;
    const rows = alerts.filter((a) => a.priority !== "info").map((a) => ({
      user_id: user.id, dedupe_key: a.key, kind: a.kind, priority: a.priority, title: a.title, body: a.body.slice(0, 600),
      link_type: a.linkType ?? null, link_id: a.linkId ?? null,
    }));
    void supabase.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .then(({ error }) => { if (!error) void qc.invalidateQueries({ queryKey: notificationsKey(user.id) }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, signature, user.id]);
  return null;
}
