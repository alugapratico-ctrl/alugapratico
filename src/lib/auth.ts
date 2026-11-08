import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth-validation";

// "Lembrar de mim": quando desmarcado, a sessão termina ao fechar o navegador.
const REMEMBER_KEY = "alugapratico:lembrar";
const ACTIVE_KEY = "alugapratico:sessao-ativa";
const ACTIVE_COOKIE = "ap_sessao_ativa";

function markActive() {
  try { sessionStorage.setItem(ACTIVE_KEY, "1"); } catch { /* indisponível */ }
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ACTIVE_COOKIE}=1; path=/; SameSite=Lax${secure}`;
  } catch { /* indisponível */ }
}

function isActive() {
  try { if (sessionStorage.getItem(ACTIVE_KEY)) return true; } catch { /* indisponível */ }
  try { return document.cookie.split("; ").some((c) => c === `${ACTIVE_COOKIE}=1`); } catch { return false; }
}

export function rememberSession(remember: boolean) {
  try { localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0"); } catch { /* indisponível */ }
  markActive();
}

/** Encerra a sessão local se o usuário pediu para não ser lembrado e o navegador foi fechado. */
export async function enforceRememberPreference() {
  if (typeof window === "undefined") return;
  let remember: string | null = null;
  try { remember = localStorage.getItem(REMEMBER_KEY); } catch { return; }
  if (remember === "0" && !isActive()) {
    try { localStorage.removeItem(REMEMBER_KEY); } catch { /* indisponível */ }
    await supabase.auth.signOut({ scope: "local" });
    return;
  }
  markActive();
}

function clearRememberFlags() {
  try { localStorage.removeItem(REMEMBER_KEY); sessionStorage.removeItem(ACTIVE_KEY); } catch { /* indisponível */ }
}

export function friendlyAuthError(error: unknown) {
  return authErrorMessage(error, typeof navigator === "undefined" ? true : navigator.onLine);
}

/** Sair: para buscas em andamento, apaga dados em memória, encerra a sessão e volta ao login. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) await supabase.auth.signOut({ scope: "local" });
    clearRememberFlags();
    await navigate({ to: "/entrar", search: { aviso: "saiu" }, replace: true });
  };
}
