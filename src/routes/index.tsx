import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { safeRedirect } from "@/lib/auth-validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Gestão de locações", "Gerencie seus produtos, clientes e locações de forma simples e organizada."),
  component: Home,
});

/** Porta de entrada: quem já entrou vai ao painel; quem não entrou vai ao login. */
function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      let dest: string | null = null;
      try { dest = sessionStorage.getItem("alugapratico:destino"); sessionStorage.removeItem("alugapratico:destino"); } catch { /* indisponível */ }
      if (data.session) void navigate({ href: safeRedirect(dest), replace: true });
      else void navigate({ to: "/entrar", replace: true });
    });
    return () => { alive = false; };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" role="status">
      <img src="/alugapratico.png" alt="Logo AlugaPratico" className="h-20 w-20 rounded-[22%] shadow-soft" />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-base font-semibold text-muted-foreground">Abrindo o AlugaPratico…</p>
    </div>
  );
}
