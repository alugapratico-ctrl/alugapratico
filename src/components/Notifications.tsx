import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, AlertTriangle, AlertOctagon, Info, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useMarkRead, useNotifications, type AppNotification } from "@/lib/notifications";
import type { Priority } from "@/lib/alerts";
import { cn } from "@/lib/utils";

export const PRIORITY_UI: Record<Priority, { label: string; icon: typeof Info; className: string }> = {
  urgente: { label: "Urgente", icon: AlertOctagon, className: "bg-danger-soft text-destructive" },
  atencao: { label: "Atenção", icon: AlertTriangle, className: "bg-warning-soft text-warning" },
  info: { label: "Informativo", icon: Info, className: "bg-info-soft text-info" },
};

export function linkFor(type: AppNotification["linkType"], id: string | null) {
  if (type === "cliente" && id) return { to: "/clientes/$clientId" as const, params: { clientId: id } };
  if (type === "produto") return { to: "/produtos" as const };
  return { to: "/locacoes" as const };
}

const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data = [], isPending } = useNotifications();
  const mark = useMarkRead();
  const navigate = useNavigate();
  const unread = data.filter((n) => !n.readAt).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={unread ? `Notificações: ${unread} não lidas` : "Notificações"} className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-muted">
          <Bell className="h-6 w-6" />
          {unread > 0 && <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,24rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <p className="text-lg font-bold text-foreground">Notificações</p>
          {unread > 0 && <Button variant="ghost" size="sm" disabled={mark.isPending} onClick={() => mark.mutate("all")}><CheckCheck className="h-4 w-4" /> Marcar todas como lidas</Button>}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {isPending ? <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            : data.length === 0 ? <p className="p-6 text-center text-base text-muted-foreground">Nenhuma notificação por enquanto.</p>
            : (
              <ul className="divide-y divide-border">
                {data.map((n) => {
                  const ui = PRIORITY_UI[n.priority];
                  return (
                    <li key={n.id} className={cn("flex gap-3 p-4", !n.readAt && "bg-accent/40")}>
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", ui.className)}><ui.icon className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <button type="button" className="text-left" onClick={() => { if (!n.readAt) mark.mutate([n.id]); setOpen(false); void navigate(linkFor(n.linkType, n.linkId)); }}>
                          <p className="font-bold text-foreground">{!n.readAt && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-label="Não lida" />}{n.title}</p>
                          <p className="text-sm text-muted-foreground">{n.body}</p>
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn("rounded-full px-2 py-0.5 font-bold", ui.className)}>{ui.label}</span>
                          <span>{when(n.createdAt)}</span>
                          {!n.readAt && <button type="button" className="font-semibold text-primary hover:underline" onClick={() => mark.mutate([n.id])}>Marcar como lida</button>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
