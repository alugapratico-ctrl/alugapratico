import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, CheckingSession, FormField, GoogleButton, Notice, OrDivider, PasswordInput, authInputCls, useRedirectIfSignedIn } from "@/components/AuthUI";
import { friendlyAuthError, rememberSession } from "@/lib/auth";
import { fieldErrors, loginSchema, safeRedirect, type FieldErrors } from "@/lib/auth-validation";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Aviso = "saiu" | "senha-alterada" | "sessao-expirada";
type Search = { redirect?: string | undefined; aviso?: Aviso | undefined };

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
    aviso: s["aviso"] === "saiu" || s["aviso"] === "senha-alterada" || s["aviso"] === "sessao-expirada" ? s["aviso"] : undefined,
  }),
  head: () => seo("Entrar", "Entre na sua conta do AlugaPratico para gerenciar suas locações."),
  component: Entrar,
});

const AVISOS: Record<Aviso, string> = {
  saiu: "Você saiu da sua conta com segurança.",
  "senha-alterada": "Senha alterada! Agora entre com a sua nova senha.",
  "sessao-expirada": "Sua sessão expirou. Entre novamente.",
};

function Entrar() {
  const { redirect, aviso } = Route.useSearch();
  const navigate = useNavigate();
  const checking = useRedirectIfSignedIn(redirect);
  const [f, setF] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    setUnconfirmed(false);
    const parsed = loginSchema.safeParse(f);
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setErrors({});
    setBusy(true);
    rememberSession(remember);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        setFormError(friendlyAuthError(error));
        setUnconfirmed(error.code === "email_not_confirmed");
        setBusy(false);
        return;
      }
      setDone(true);
      await navigate({ href: safeRedirect(redirect), replace: true });
    } catch (err) {
      setFormError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  const resend = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email: f.email.trim(), options: { emailRedirectTo: `${window.location.origin}/entrar` } });
    if (error) setFormError(friendlyAuthError(error));
    else setResent(true);
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta!"
      subtitle="Entre para cuidar das suas locações."
      footer={<>Ainda não tem conta? <Link to="/cadastro" search={{ redirect }} className="font-bold text-primary hover:underline">Criar conta grátis</Link></>}
    >
      {checking ? <CheckingSession /> : done ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="text-lg font-bold text-foreground">Tudo certo! Abrindo seu painel…</p>
        </div>
      ) : (
        <>
          {aviso && !formError && <div className="mb-5"><Notice tone={aviso === "sessao-expirada" ? "info" : "success"}>{AVISOS[aviso]}</Notice></div>}
          {formError && (
            <div className="mb-5 space-y-3">
              <Notice tone="error">{formError}</Notice>
              {unconfirmed && (resent
                ? <Notice tone="success">Enviamos um novo link de confirmação para {f.email.trim()}.</Notice>
                : <Button type="button" variant="outline" className="h-12 w-full text-base" onClick={resend}>Reenviar e-mail de confirmação</Button>)}
            </div>
          )}

          <GoogleButton label="Entrar com Google" remember={remember} disabled={busy} redirectTo={redirect} onError={setFormError} />
          <p className="mt-2 text-center text-xs text-muted-foreground">Ao continuar com o Google, você concorda com os <Link to="/termos" className="underline">Termos de uso</Link> e a <Link to="/privacidade" className="underline">Política de privacidade</Link>.</p>
          <OrDivider />

          <form onSubmit={submit} className="space-y-5" noValidate>
            <FormField id="email" label="E-mail" error={errors.email}>
              <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="Ex.: maria@email.com"
                className={cn(authInputCls, errors.email && "border-destructive")} value={f.email}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-erro" : undefined}
                onChange={(e) => setF({ ...f, email: e.target.value })} />
            </FormField>
            <FormField id="senha" label="Senha" error={errors.password}>
              <PasswordInput id="senha" autoComplete="current-password" placeholder="Digite sua senha" value={f.password} error={errors.password} onChange={(v) => setF({ ...f, password: v })} />
            </FormField>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-base font-semibold text-foreground">
                <input type="checkbox" className="h-5 w-5 accent-primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Lembrar de mim
              </label>
              <Link to="/esqueci-senha" className="text-base font-bold text-primary hover:underline">Esqueci minha senha</Link>
            </div>
            <Button type="submit" size="lg" disabled={busy} className="h-14 w-full text-lg">
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Entrando…</> : <><LogIn className="h-5 w-5" /> Entrar</>}
            </Button>
            {!remember && <p className="text-center text-sm text-muted-foreground">Você sairá da conta ao fechar o navegador.</p>}
          </form>
        </>
      )}
    </AuthLayout>
  );
}
