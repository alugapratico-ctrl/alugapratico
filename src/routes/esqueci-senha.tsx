import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, FormField, Notice, authInputCls } from "@/components/AuthUI";
import { friendlyAuthError } from "@/lib/auth";
import { fieldErrors, forgotSchema } from "@/lib/auth-validation";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => seo("Recuperar senha", "Receba um link por e-mail para criar uma nova senha no AlugaPratico."),
  component: EsqueciSenha,
});

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (target: string) => {
    setBusy(true);
    setFormError("");
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(target, { redirectTo: `${window.location.origin}/redefinir-senha` });
      if (err) { setFormError(friendlyAuthError(err)); return false; }
      setSent(target);
      setWait(60);
      return true;
    } catch (err) {
      setFormError(friendlyAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) { setError(fieldErrors(parsed.error).email ?? ""); return; }
    setError("");
    await send(parsed.data.email);
  };

  return (
    <AuthLayout
      title={sent ? "Verifique seu e-mail" : "Esqueceu sua senha?"}
      subtitle={sent ? undefined : "Sem problema. Digite seu e-mail e enviaremos um link para criar uma nova senha."}
      footer={<Link to="/entrar" className="inline-flex items-center gap-2 font-bold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar para o login</Link>}
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary"><MailCheck className="h-8 w-8" /></span>
          <p className="text-lg text-foreground">Se existir uma conta com <strong>{sent}</strong>, você vai receber um link em instantes.</p>
          <ol className="w-full space-y-2 rounded-2xl bg-muted p-4 text-left text-base text-foreground">
            <li>1. Abra o e-mail do AlugaPratico.</li>
            <li>2. Toque no link para criar a nova senha.</li>
            <li>3. Entre com a nova senha.</li>
          </ol>
          <p className="text-sm text-muted-foreground">Não chegou? Olhe a pasta de spam.</p>
          {formError && <Notice tone="error">{formError}</Notice>}
          <Button variant="outline" className="h-12 w-full text-base" disabled={busy || wait > 0} onClick={() => send(sent)}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : wait > 0 ? `Enviar de novo em ${wait}s` : "Enviar de novo"}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          {formError && <Notice tone="error">{formError}</Notice>}
          <FormField id="email" label="E-mail da sua conta" error={error}>
            <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="Ex.: maria@email.com"
              className={cn(authInputCls, error && "border-destructive")} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
          </FormField>
          <Button type="submit" size="lg" disabled={busy} className="h-14 w-full text-lg">
            {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</> : <><Send className="h-5 w-5" /> Enviar link</>}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
