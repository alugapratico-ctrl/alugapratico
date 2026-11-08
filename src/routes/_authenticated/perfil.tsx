import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, KeyRound, Loader2, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, useSignOut } from "@/lib/auth";
import { initials, profileKey, useCurrentUser, useProfile } from "@/lib/profile";
import { BUCKET, dataErrorMessage, uploadUserImage } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => seo("Meu perfil", "Veja e edite os dados da sua conta no AlugaPratico."),
  component: Perfil,
});

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function Perfil() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const { data: profile, isPending } = useProfile();
  const [f, setF] = useState({ fullName: "", businessName: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const hasPassword = user.app_metadata?.providers?.includes?.("email") ?? user.app_metadata?.provider === "email";

  useEffect(() => {
    if (profile) setF({ fullName: profile.fullName, businessName: profile.businessName });
  }, [profile]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: profileKey(user.id) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const fullName = f.fullName.trim();
    if (fullName.length < 3) { toast.error("Digite seu nome completo."); return; }
    if (fullName.length > 120 || f.businessName.trim().length > 120) { toast.error("Os campos podem ter no máximo 120 caracteres."); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, business_name: f.businessName.trim() || null }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(dataErrorMessage(error)); return; }
    await refresh();
    toast.success("Perfil atualizado com sucesso!");
  };

  const changePhoto = async (file: File) => {
    setUploading(true);
    try {
      const path = await uploadUserImage(user.id, "perfil", file);
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (error) throw new Error(dataErrorMessage(error));
      if (profile?.avatarUrl && !/^https?:\/\//.test(profile.avatarUrl)) await supabase.storage.from(BUCKET).remove([profile.avatarUrl]);
      await refresh();
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível trocar a foto.");
    }
    setUploading(false);
  };

  const sendReset = async () => {
    if (!user.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/redefinir-senha` });
    setSendingReset(false);
    if (error) toast.error(friendlyAuthError(error));
    else toast.success(`Enviamos um link para ${user.email}. Abra o e-mail para criar a nova senha.`);
  };

  if (isPending || !profile) {
    return <div className="flex min-h-[40vh] items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <PageHeader title="Meu perfil" subtitle="Os dados da sua conta." />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel className="flex flex-col items-center text-center">
          <div className="relative">
            {profile.avatarSrc ? (
              <img src={profile.avatarSrc} alt="Sua foto de perfil" referrerPolicy="no-referrer" className="h-28 w-28 rounded-full object-cover shadow-soft" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-accent text-3xl font-extrabold text-primary">{initials(profile.fullName, profile.email)}</span>
            )}
            <label className="absolute bottom-0 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft" aria-label="Trocar foto">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void changePhoto(file); e.target.value = ""; }} />
            </label>
          </div>
          <p className="mt-4 text-xl font-bold text-foreground">{profile.fullName || "Sem nome"}</p>
          <p className="break-all text-base text-muted-foreground">{profile.email}</p>
          <dl className="mt-6 w-full space-y-3 text-left text-base">
            <div className="rounded-xl bg-muted p-3"><dt className="text-sm text-muted-foreground">Conta criada em</dt><dd className="font-bold text-foreground">{fmtDateTime(profile.createdAt)}</dd></div>
            <div className="rounded-xl bg-muted p-3"><dt className="text-sm text-muted-foreground">Último acesso</dt><dd className="font-bold text-foreground">{fmtDateTime(profile.lastAccessAt ?? user.last_sign_in_at ?? null)}</dd></div>
          </dl>
        </Panel>

        <div className="space-y-6">
          <Panel title="Dados pessoais">
            <form onSubmit={save} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="nome" className="text-base font-bold">Nome completo</Label>
                <Input id="nome" className="h-12 text-base" value={f.fullName} maxLength={120} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="negocio" className="text-base font-bold">Nome do negócio</Label>
                <Input id="negocio" className="h-12 text-base" placeholder="Ex.: Aluguéis da Maria" value={f.businessName} maxLength={120} onChange={(e) => setF({ ...f, businessName: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="email" className="text-base font-bold">E-mail</Label>
                <Input id="email" className="h-12 text-base" value={profile.email} disabled />
                <p className="text-sm text-muted-foreground">O e-mail é usado para entrar e não pode ser alterado aqui.</p></div>
              <Button type="submit" size="lg" disabled={saving} className="h-14 w-full text-lg sm:w-auto sm:px-8">
                {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</> : <><Save className="h-5 w-5" /> Salvar alterações</>}
              </Button>
            </form>
          </Panel>

          <Panel title="Segurança">
            <p className="text-base text-muted-foreground">
              {hasPassword ? "Para trocar sua senha, enviaremos um link seguro para o seu e-mail." : "Você entra com o Google. Se quiser também entrar com e-mail e senha, crie uma senha pelo link enviado ao seu e-mail."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" size="lg" className="h-12 text-base" disabled={sendingReset} onClick={sendReset}>
                {sendingReset ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />} {hasPassword ? "Trocar minha senha" : "Criar uma senha"}
              </Button>
              <Button variant="outline" size="lg" className="h-12 text-base text-destructive" onClick={() => void signOut()}>
                <LogOut className="h-5 w-5" /> Sair da conta
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
