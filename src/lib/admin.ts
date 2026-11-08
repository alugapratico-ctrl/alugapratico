import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Lê o papel de admin no banco (a tabela de papéis é protegida). Só esconde/mostra UI; o banco faz a checagem real. */
export async function fetchIsAdmin(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  return data === true;
}

export function useIsAdmin() {
  return useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin, staleTime: 5 * 60_000 });
}

export type BetaUser = {
  user_id: string; full_name: string | null; email: string | null; business_name: string | null;
  phone: string | null; city: string | null; created_at: string; last_access_at: string | null;
  is_admin: boolean; products: number; clients: number; rentals: number; returned: number;
  active_rentals: number; messages: number; last_activity: string | null;
};

export type Engagement = "ativo" | "iniciando" | "pendente" | "inativo";

/** Classifica o locador no beta. */
export function engagementOf(u: Pick<BetaUser, "products" | "clients" | "rentals" | "last_activity" | "created_at">, now = new Date()): Engagement {
  const last = new Date(u.last_activity ?? u.created_at).getTime();
  const days = (now.getTime() - last) / 86_400_000;
  if (Number(u.rentals) > 0) return days > 14 ? "inativo" : "ativo";
  if (Number(u.products) > 0 || Number(u.clients) > 0) return "iniciando";
  return days > 3 ? "inativo" : "pendente";
}
