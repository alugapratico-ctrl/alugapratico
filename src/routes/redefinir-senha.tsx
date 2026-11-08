import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, CheckCircle2, KeyRound, Loader2, X, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, CheckingSession, FormField, Notice, PasswordInput } from "@/components/AuthUI";
import { friendlyAuthError } from "@/lib/auth";
import { PASSWORD_RULES, fieldErrors, resetPasswordSchema, type FieldErrors } from "@/lib/auth-validation";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => seo("Criar nova senha", "Defina uma nova senha para sua conta do AlugaPratico."),
  component: RedefinirSenha,
});

type Stage = "verificando" | "pronto" | "invalido" | "concluido";

function RedefinirSenha() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("verificando");
  const [linkError, setLinkError] = useState("");
  const [f, setF] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // O link do e-mail traz um aviso de erro quando expirou ou já foi usado.
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
    const errCode = params.get("error_code") || params.get("error");
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) setStage("pronto");
      else {
        setLinkError(errCode === "otp_expired" ? "Este link expirou ou já foi usado." : "Este link não é válido.");
        setStage("invalido");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setStage("pronto");
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const parsed = resetPasswordSchema.safeParse(f);
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setErrors({});
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) { setFormError(friendlyAuthError(error)); setBusy(false); return; }
      // Encerra a sessão do link para que a pessoa entre com a nova senha.
      await supabase.auth.signOut();
      setStage("concluido");
    } catch (err) {
      setFormError(friendlyAuthError(err));
    }
    setBusy(false);
  };

  if (stage === "verificando") return <AuthLayout title="Criar nova senha"><CheckingSession /></AuthLayout>;

  if (stage === "invalido") {
    return (
      <AuthLayout title="Link inválido" footer={<Link to="/entrar" className="font-bold text-primary hover:underline">Voltar para o login</Link>}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-destructive"><LinkIcon className="h-8 w-8" /></span>
          <p className="text-lg text-foreground">{linkError}</p>
          <p className="text-base text-muted-foreground">Peça um novo link. Ele vale por pouco tempo e só pode ser usado uma vez.</p>
          <Button asChild size="lg" className="h-14 w-full text-lg"><Link to="/esqueci-senha">Pedir novo link</Link></Button>
        </div>
      </AuthLayout>
    );
  }

  if (stage === "concluido") {
    return (
      <AuthLayout title="Senha alterada!">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-success" />
          <p className="text-lg text-foreground">Sua nova senha foi salva com sucesso.</p>
          <Button size="lg" className="h-14 w-full text-lg" onClick={() => navigate({ to: "/entrar", search: { aviso: "senha-alterada" }, replace: true })}>Entrar com a nova senha</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Criar nova senha" subtitle="Escolha uma senha que você não usa em outros sites.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        {formError && <Notice tone="error">{formError}</Notice>}
        <FormField id="senha" label="Nova senha" error={errors.password}>
          <PasswordInput id="senha" autoComplete="new-password" placeholder="Digite a nova senha" value={f.password} error={errors.password} onChange={(v) => setF({ ...f, password: v })} />
        </FormField>
        <ul className="-mt-2 space-y-1">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(f.password);
            return <li key={r.label} className={cn("flex items-center gap-2 text-sm font-semibold", ok ? "text-success" : "text-muted-foreground")}>{ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{r.label}</li>;
          })}
        </ul>
        <FormField id="confirmar" label="Confirme a nova senha" error={errors.confirm}>
          <PasswordInput id="confirmar" autoComplete="new-password" placeholder="Digite de novo" value={f.confirm} error={errors.confirm} onChange={(v) => setF({ ...f, confirm: v })} />
        </FormField>
        <Button type="submit" size="lg" disabled={busy} className="h-14 w-full text-lg">
          {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</> : <><KeyRound className="h-5 w-5" /> Salvar nova senha</>}
        </Button>
      </form>
    </AuthLayout>
  );
}
