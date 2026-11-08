import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2, ShieldCheck, CalendarCheck, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { friendlyAuthError, rememberSession } from "@/lib/auth";
import { safeRedirect } from "@/lib/auth-validation";

/** Moldura das telas de entrada: painel roxo no computador, cartão limpo no celular. */
export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string | undefined; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-foreground/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-foreground/10" />
        <Link to="/" className="relative flex items-center gap-3">
          <img src="/alugapratico.png" alt="" className="h-12 w-12 rounded-xl shadow-soft" />
          <span className="font-display text-2xl font-extrabold">AlugaPratico</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Suas locações organizadas, sem complicação.</h2>
          <ul className="mt-8 space-y-4 text-lg">
            {[
              { i: Package, t: "Cadastre produtos e clientes em segundos" },
              { i: CalendarCheck, t: "Veja retiradas e devoluções no calendário" },
              { i: ShieldCheck, t: "Seus dados ficam protegidos e só você vê" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15"><x.i className="h-5 w-5" /></span>
                {x.t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-80">© {new Date().getFullYear()} AlugaPratico</p>
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex flex-col items-center gap-3 lg:hidden">
            <img src="/alugapratico.png" alt="Logo AlugaPratico" className="h-20 w-20 rounded-[22%] shadow-soft" />
          </Link>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <h1 className="text-center text-3xl font-extrabold text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-center text-base text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-base text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function FormField({ id, label, hint, error, children }: { id: string; label: string; hint?: string | undefined; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-bold">{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="flex items-start gap-1.5 text-sm font-semibold text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const authInputCls = "h-13 rounded-xl text-base md:text-base";

export function PasswordInput({ id, value, onChange, error, placeholder, autoComplete }: { id: string; value: string; onChange: (v: string) => void; error?: string | undefined; placeholder?: string | undefined; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        className={cn(authInputCls, "pr-14", error && "border-destructive")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-erro` : undefined}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl p-4 text-base font-semibold",
        tone === "error" && "bg-danger-soft text-destructive",
        tone === "success" && "bg-success-soft text-success",
        tone === "info" && "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-sm font-semibold text-muted-foreground">
      <span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" />
    </div>
  );
}

const GOOGLE_G = (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

/** Botão oficial "Continuar com o Google" — abre o login real do Google. */
export function GoogleButton({ label, remember = true, disabled, redirectTo, onError }: { label: string; remember?: boolean | undefined; disabled?: boolean | undefined; redirectTo?: string | undefined; onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const go = async () => {
    setBusy(true);
    onError("");
    rememberSession(remember);
    try { sessionStorage.setItem("alugapratico:destino", safeRedirect(redirectTo)); } catch { /* indisponível */ }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setBusy(false);
      const m = result.error.message?.toLowerCase() ?? "";
      onError(m.includes("closed") || m.includes("cancel") ? "O login com Google foi cancelado." : friendlyAuthError(result.error));
      return;
    }
    if (result.redirected) return;
    await navigate({ href: safeRedirect(redirectTo) });
  };
  return (
    <button
      type="button"
      onClick={go}
      disabled={disabled || busy}
      className="flex h-13 w-full items-center justify-center rounded-xl border border-google-border bg-google-bg pl-3 pr-3 font-google text-[14px] font-medium leading-5 text-google-text transition-shadow hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" /> : GOOGLE_G}
      <span className="ml-2.5">{busy ? "Abrindo o Google…" : label}</span>
    </button>
  );
}

/** Se a pessoa já está conectada, leva direto ao painel. */
export function useRedirectIfSignedIn(redirectTo?: string | undefined) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) void navigate({ href: safeRedirect(redirectTo), replace: true });
      else setChecking(false);
    });
    return () => { alive = false; };
  }, [navigate, redirectTo]);
  return checking;
}

export function CheckingSession() {
  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-base font-semibold text-muted-foreground">Verificando sua conta…</p>
    </div>
  );
}
