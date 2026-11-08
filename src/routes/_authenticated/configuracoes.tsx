import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Sun, Moon, MonitorSmartphone, Info } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PREFS, profileKey, useCurrentUser, useProfile, type Preferences } from "@/lib/profile";
import { dataErrorMessage } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => seo("Configurações", "Dados do seu negócio e preferências do sistema."),
  component: Configuracoes,
});

function Configuracoes() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: profile, isPending } = useProfile();
  const [biz, setBiz] = useState({ businessName: "", phone: "", city: "" });
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const { mode, setMode } = useTheme();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBiz({ businessName: profile.businessName, phone: profile.phone, city: profile.city });
    setPrefs(profile.preferences);
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (biz.businessName.length > 120 || biz.phone.length > 30 || biz.city.length > 80) { toast.error("Algum campo está grande demais. Encurte e tente de novo."); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      business_name: biz.businessName.trim() || null,
      phone: biz.phone.trim() || null,
      city: biz.city.trim() || null,
      preferences: prefs,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(dataErrorMessage(error)); return; }
    await queryClient.invalidateQueries({ queryKey: profileKey(user.id) });
    toast.success("Configurações salvas com sucesso!");
  };

  const toggles = [
    { k: "notificacoes", l: "Ativar central de notificações", d: "Guarda os alertas importantes no sino para você não perder nada." },
    { k: "retiradasDevolucoes", l: "Retiradas e devoluções", d: "Retiradas e devoluções do dia, próximas e atrasadas." },
    { k: "pagamentos", l: "Pagamentos", d: "Pagamentos pendentes, vencendo e vencidos." },
  ] as const;
  const themes: { v: ThemeMode; l: string; icon: typeof Sun }[] = [
    { v: "claro", l: "Claro", icon: Sun },
    { v: "escuro", l: "Escuro", icon: Moon },
    { v: "automatico", l: "Automático", icon: MonitorSmartphone },
  ];
  const fields = [
    { k: "businessName", l: "Nome do negócio", p: "Ex.: Aluguéis da Ana", max: 120 },
    { k: "phone", l: "Telefone", p: "Ex.: (11) 99999-0000", max: 30 },
    { k: "city", l: "Cidade", p: "Ex.: Campinas - SP", max: 80 },
  ] as const;

  if (isPending) return <div className="flex min-h-[40vh] items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <form onSubmit={save}>
      <PageHeader title="Configurações" subtitle="Ajuste o sistema do seu jeito." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dados do seu negócio">
          <div className="space-y-5">
            {fields.map((f) => (
              <div key={f.k} className="space-y-2">
                <Label htmlFor={f.k} className="text-base font-bold">{f.l}</Label>
                <Input id={f.k} className="h-12 text-base" maxLength={f.max} placeholder={f.p} value={biz[f.k]} onChange={(e) => setBiz({ ...biz, [f.k]: e.target.value })} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Aparência do sistema">
          <div role="radiogroup" aria-label="Aparência do sistema" className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button key={t.v} type="button" role="radio" aria-checked={mode === t.v} onClick={() => setMode(t.v)}
                className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-base font-bold", mode === t.v ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground")}>
                <t.icon className="h-7 w-7" />{t.l}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Muda na hora e fica salvo neste aparelho. O automático acompanha o modo do seu celular ou computador.</p>
        </Panel>
        <Panel title="Notificações e lembretes" className="lg:col-span-2">
          <ul className="space-y-3">
            {toggles.map((t) => (
              <li key={t.k} className="flex items-center justify-between gap-4 rounded-xl bg-muted p-4">
                <span><span className="block text-base font-semibold text-foreground">{t.l}</span><span className="block text-sm text-muted-foreground">{t.d}</span></span>
                <Switch checked={prefs[t.k]} onCheckedChange={(v) => setPrefs({ ...prefs, [t.k]: v })} />
              </li>
            ))}
            <li className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted p-4">
              <Label htmlFor="antecedencia" className="text-base font-semibold">Avisar com quantos dias de antecedência?</Label>
              <select id="antecedencia" className="h-12 rounded-md border border-input bg-background px-3 text-base text-foreground" value={prefs.antecedencia} onChange={(e) => setPrefs({ ...prefs, antecedencia: Number(e.target.value) })}>
                {[0, 1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n === 0 ? "Só no dia" : n === 1 ? "1 dia antes" : `${n} dias antes`}</option>)}
              </select>
            </li>
          </ul>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-info-soft p-3 text-sm text-info"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Os avisos aparecem no painel e no sino do sistema. Notificações no celular com o app fechado ainda não estão disponíveis.</p>
        </Panel>
      </div>
      <Button type="submit" size="lg" disabled={saving} className="mt-6 h-14 w-full px-8 text-lg sm:w-auto">
        {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</> : <><Save className="h-5 w-5" /> Salvar configurações</>}
      </Button>
    </form>
  );
}
