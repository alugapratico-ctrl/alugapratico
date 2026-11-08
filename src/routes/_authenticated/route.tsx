import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enforceRememberPreference } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { NotificationsSync } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated")({
  // A sessão fica guardada no navegador, então a verificação acontece no navegador.
  ssr: false,
  beforeLoad: async ({ location }) => {
    await enforceRememberPreference();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/entrar", search: { redirect: location.href } });
    }
    return { user: data.session.user };
  },
  pendingComponent: FullScreenLoader,
  component: AuthenticatedLayout,
});

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" role="status">
      <img src="/alugapratico.png" alt="" className="h-16 w-16 rounded-2xl shadow-soft" />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-base font-semibold text-muted-foreground">Abrindo seu painel…</p>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  // Registra o último acesso uma vez por abertura do app.
  useEffect(() => {
    const key = `alugapratico:acesso:${user.id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* indisponível */ }
    const now = new Date().toISOString();
    // As consultas só rodam quando são aguardadas (then).
    void supabase.from("profiles").update({ last_access_at: now }).eq("id", user.id).then(() => undefined);
    // Quem entrou pelo Google viu o aviso dos termos ao continuar.
    void supabase.from("profiles").update({ terms_accepted_at: now }).eq("id", user.id).is("terms_accepted_at", null).then(() => undefined);
  }, [user.id]);

  return (
    <AppShell>
      <StoreProvider key={user.id} userId={user.id}>
        <NotificationsSync />
        <Outlet />
      </StoreProvider>
    </AppShell>
  );
}
