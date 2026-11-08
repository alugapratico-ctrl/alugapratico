import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/SupportButton";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES, buildMessage, mailtoLink, whatsappLink, whatsappNumber, type TemplateId } from "@/lib/messages";
import { useStore, type Client, type Rental } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Modelos que fazem sentido para a situação da locação. */
export function templatesFor(rental?: Rental): TemplateId[] {
  if (!rental) return ["confirmacao", "retirada", "devolucao", "atraso", "cobranca", "pagamento"];
  const t: TemplateId[] = ["confirmacao"];
  if (rental.status === "aguardando") t.push("retirada");
  if (rental.status === "andamento") t.push("devolucao");
  if (rental.status === "atrasada") t.push("atraso");
  t.push(rental.paid ? "pagamento" : "cobranca");
  return t;
}

export function MessageDialog({ open, onOpenChange, client, rental }: { open: boolean; onOpenChange: (o: boolean) => void; client: Client; rental?: Rental | undefined }) {
  const { products, rentals, userId } = useStore();
  const qc = useQueryClient();
  const clientRentals = rentals.filter((r) => r.clientId === client.id);
  const [rentalId, setRentalId] = useState<string | undefined>(rental?.id);
  const current = rentalId ? clientRentals.find((r) => r.id === rentalId) : undefined;
  const options = templatesFor(current);
  const [tpl, setTpl] = useState<TemplateId>(options[0]!);
  const [text, setText] = useState("");

  useEffect(() => { if (open) setRentalId(rental?.id ?? clientRentals[0]?.id); }, [open, rental?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!options.includes(tpl)) setTpl(options[0]!); }, [rentalId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setText(buildMessage(tpl, client, current, current ? products.find((p) => p.id === current.productId) : undefined));
  }, [tpl, rentalId, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const wa = whatsappNumber(client.phone);
  const subject = TEMPLATES.find((t) => t.id === tpl)?.subject ?? "AlugaPrático";

  const record = async (channel: "whatsapp" | "email") => {
    const { error } = await supabase.from("communications").insert({
      user_id: userId, client_id: client.id, rental_id: current?.id ?? null, channel, template: tpl,
      status: channel === "whatsapp" ? "aberto_no_whatsapp" : "aberto_no_app_de_email", message: text.slice(0, 4000),
    });
    if (!error) void qc.invalidateQueries({ queryKey: ["comunicacoes", client.id] });
  };

  const openWhatsApp = () => {
    if (!wa) return;
    if (!text.trim()) { toast.error("Escreva a mensagem antes de abrir o WhatsApp."); return; }
    window.open(whatsappLink(wa, text), "_blank", "noopener,noreferrer");
    void record("whatsapp");
    toast.success("Conversa aberta no WhatsApp. Confira e toque em enviar por lá.");
    onOpenChange(false);
  };
  const openEmail = () => {
    if (!client.email) return;
    window.location.href = mailtoLink(client.email, subject, text);
    void record("email");
    toast.success("E-mail aberto no seu aplicativo de e-mail. Confira e envie por lá.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enviar mensagem</DialogTitle>
          <DialogDescription className="text-base">Para {client.name}. Revise o texto antes de enviar.</DialogDescription>
        </DialogHeader>

        {clientRentals.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="msg-locacao" className="text-base font-bold">Sobre qual locação?</Label>
            <select id="msg-locacao" className="h-12 w-full rounded-md border border-input bg-background px-3 text-base text-foreground" value={rentalId ?? ""} onChange={(e) => setRentalId(e.target.value || undefined)}>
              {clientRentals.map((r) => <option key={r.id} value={r.id}>{products.find((p) => p.id === r.productId)?.name ?? "Produto"} · {r.start.split("-").reverse().join("/")}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-base font-bold text-foreground">Tipo de mensagem</p>
          <div className="flex flex-wrap gap-2">
            {options.map((id) => (
              <button key={id} type="button" onClick={() => setTpl(id)} className={cn("rounded-full border px-3 py-2 text-sm font-semibold", tpl === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground")}>
                {TEMPLATES.find((t) => t.id === id)?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="msg-texto" className="text-base font-bold">Mensagem</Label>
          <Textarea id="msg-texto" rows={9} maxLength={4000} className="text-base" value={text} onChange={(e) => setText(e.target.value)} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="lg" className="h-12 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90" disabled={!wa} onClick={openWhatsApp}><WhatsAppIcon className="h-5 w-5" /> Abrir no WhatsApp</Button>
          <Button size="lg" variant="outline" className="h-12" disabled={!client.email} onClick={openEmail}><Mail className="h-5 w-5" /> Abrir no e-mail</Button>
        </div>
        {!wa && <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> Para usar o WhatsApp, cadastre um telefone válido com DDD para este cliente.</p>}
        {!client.email && <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground"><Mail className="mt-0.5 h-4 w-4 shrink-0" /> Este cliente não tem e-mail cadastrado.</p>}
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Nada é enviado automaticamente: a mensagem abre no WhatsApp ou no seu e-mail para você conferir e enviar.</p>
      </DialogContent>
    </Dialog>
  );
}
