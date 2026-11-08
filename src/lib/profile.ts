import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "@/lib/store";

export type Preferences = {
  lembrete: boolean; atraso: boolean; letra: boolean;
  /** Central de notificações ligada. */
  notificacoes: boolean;
  retiradasDevolucoes: boolean;
  pagamentos: boolean;
  /** Dias de antecedência dos lembretes. */
  antecedencia: number;
};
export type Profile = {
  id: string;
  fullName: string;
  email: string;
  businessName: string;
  phone: string;
  city: string;
  avatarUrl: string | null;
  avatarSrc: string | null;
  preferences: Preferences;
  createdAt: string;
  lastAccessAt: string | null;
};

export const DEFAULT_PREFS: Preferences = { lembrete: true, atraso: true, letra: false, notificacoes: true, retiradasDevolucoes: true, pagamentos: true, antecedencia: 1 };

export const profileKey = (userId: string) => ["perfil", userId] as const;

/** Usuário da sessão atual (disponível em todas as páginas privadas). */
export function useCurrentUser() {
  return useRouteContext({ from: "/_authenticated" }).user;
}

export function useProfile() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: profileKey(user.id),
    staleTime: 60_000,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw new Error("Não foi possível carregar seu perfil.");
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const avatarUrl = data?.avatar_url ?? meta["avatar_url"] ?? meta["picture"] ?? null;
      let avatarSrc: string | null = avatarUrl;
      if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(avatarUrl, 60 * 60 * 12);
        avatarSrc = signed?.signedUrl ?? null;
      }
      return {
        id: user.id,
        fullName: data?.full_name ?? meta["full_name"] ?? meta["name"] ?? "",
        email: data?.email ?? user.email ?? "",
        businessName: data?.business_name ?? "",
        phone: data?.phone ?? "",
        city: data?.city ?? "",
        avatarUrl,
        avatarSrc,
        preferences: { ...DEFAULT_PREFS, ...((data?.preferences as Partial<Preferences> | null) ?? {}) },
        createdAt: data?.created_at ?? user.created_at,
        lastAccessAt: data?.last_access_at ?? null,
      };
    },
  });
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
export const initials = (name: string, email = "") =>
  (name.trim() ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("") : email.slice(0, 1)).toUpperCase();
