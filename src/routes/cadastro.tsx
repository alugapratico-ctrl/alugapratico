import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, MailCheck, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, CheckingSession, FormField, GoogleButton, Notice, OrDivider, PasswordInput, authInputCls, useRedirectIfSignedIn } from "@/components/AuthUI";
import { friendlyAuthError, rememberSession } from "@/lib/auth";
import { PASSWORD_RULES, fieldErrors, safeRedirect, signupSchema, type FieldErrors } from "@/lib/auth-validation";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cadastro")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => seo("Criar conta", "Crie sua conta grátis no AlugaPratico e organize suas locações."),
  component: Cadastro,
});

function Cadastro() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const checking = useRedirectIfSignedIn(redirect);
  const [f, setF] = useState({ fullName: "", businessName: "", email: "", password: "", confirm: "", terms: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [resent, setResent] = useState(false);

  const set = (k: keyof typeof f, v: string | boolean) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const parsed = signupSchema.safeParse(f);
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setErrors({});
    setBusy(true);
    rememberSession(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/entrar`,
          data: { full_name: parsed.data.fullName, business_name: parsed.data.businessName || null, terms_accepted: true },
        },
      });
      if (error) { setFormError(friendlyAuthError(error)); setBusy(false); return; }
      // Quando o e-mail já existe, o serviço devolve um usuário sem identidades.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setFormError("Este e-mail já tem uma conta. Entre com ele ou recupere sua senha.");
        setBusy(false);
        return;
      }
      if (data.session) { await navigate({ href: safeRedirect(redirect), replace: true }); return; }
      setSentTo(parsed.data.email);
      setBusy(false);
    } catch (err) {
      setFormError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  const resend = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email: sentTo, options: { emailRedirectTo: `${window.location.origin}/entrar` } });
    if (error) setFormError(friendlyAuthError(error));
    else setResent(true);
  };

  if (sentTo) {
    return (
      <AuthLayout title="Confirme seu e-mail" footer={<Link to="/entrar" className="font-bold text-primary hover:underline">Voltar para o login</Link>}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary"><MailCheck className="h-8 w-8" /></span>
          <p className="text-lg text-foreground">Enviamos um link para <strong>{sentTo}</strong>.</p>
          <p className="text-base text-muted-foreground">Abra o e-mail e toque em <strong>"Confirmar"</strong> para ativar sua conta. Se não encontrar, olhe também a pasta de spam.</p>
          {formError && <Notice tone="error">{formError}</Notice>}
          {resent ? <Notice tone="success">Enviamos o link de novo.</Notice>
            : <Button variant="outline" className="h-12 w-full text-base" onClick={resend}>Não recebi, enviar de novo</Button>}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="É grátis e leva menos de um minuto."
      footer={<>Já tem uma conta? <Link to="/entrar" search={{ redirect }} className="font-bold text-primary hover:underline">Entrar</Link></>}
    >
      {checking ? <CheckingSession /> : (
        <>
          {formError && <div className="mb-5"><Notice tone="error">{formError}{formError.startsWith("Este e-mail já") && <> <Link to="/entrar" className="underline">Entrar</Link> · <Link to="/esqueci-senha" className="underline">Recuperar senha</Link></>}</Notice></div>}
          <GoogleButton label="Cadastrar com Google" disabled={busy} redirectTo={redirect} onError={setFormError} />
          <p className="mt-2 text-center text-xs text-muted-foreground">Ao continuar com o Google, você concorda com os <Link to="/termos" className="underline">Termos de uso</Link> e a <Link to="/privacidade" className="underline">Política de privacidade</Link>.</p>
          <OrDivider />
          <form onSubmit={submit} className="space-y-5" noValidate>
            <FormField id="nome" label="Nome completo" error={errors.fullName}>
              <Input id="nome" autoComplete="name" placeholder="Ex.: Maria da Silva" className={cn(authInputCls, errors.fullName && "border-destructive")} value={f.fullName} onChange={(e) => set("fullName", e.target.value)} aria-invalid={!!errors.fullName} />
            </FormField>
            <FormField id="negocio" label="Nome do negócio (opcional)" hint="Aparece no seu painel." error={errors.businessName}>
              <Input id="negocio" autoComplete="organization" placeholder="Ex.: Aluguéis da Maria" className={authInputCls} value={f.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </FormField>
            <FormField id="email" label="E-mail" error={errors.email}>
              <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="Ex.: maria@email.com" className={cn(authInputCls, errors.email && "border-destructive")} value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
            </FormField>
            <FormField id="senha" label="Senha" error={errors.password}>
              <PasswordInput id="senha" autoComplete="new-password" placeholder="Crie uma senha" value={f.password} error={errors.password} onChange={(v) => set("password", v)} />
            </FormField>
            <ul className="-mt-2 space-y-1">
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(f.password);
                return (
                  <li key={r.label} className={cn("flex items-center gap-2 text-sm font-semibold", ok ? "text-success" : "text-muted-foreground")}>
                    {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{r.label}
                  </li>
                );
              })}
            </ul>
            <FormField id="confirmar" label="Confirme a senha" error={errors.confirm}>
              <PasswordInput id="confirmar" autoComplete="new-password" placeholder="Digite a senha de novo" value={f.confirm} error={errors.confirm} onChange={(v) => set("confirm", v)} />
            </FormField>
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-base text-foreground">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} aria-invalid={!!errors.terms} />
                <span>Li e aceito os <Link to="/termos" target="_blank" className="font-bold text-primary underline">Termos de uso</Link> e a <Link to="/privacidade" target="_blank" className="font-bold text-primary underline">Política de privacidade</Link>.</span>
              </label>
              {errors.terms && <p className="mt-2 text-sm font-semibold text-destructive">{errors.terms}</p>}
            </div>
            <Button type="submit" size="lg" disabled={busy} className="h-14 w-full text-lg">
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Criando sua conta…</> : <><UserPlus className="h-5 w-5" /> Criar minha conta</>}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
