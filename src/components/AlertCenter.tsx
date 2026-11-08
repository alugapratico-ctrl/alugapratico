import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BellRing, CheckCircle2, ChevronRight } from "lucide-react";
import { Panel } from "@/components/AppShell";
import { PRIORITY_UI, linkFor } from "@/components/Notifications";
import { useAlerts } from "@/lib/notifications";
import type { AlertGroup } from "@/lib/alerts";
import { cn } from "@/lib/utils";

const GROUPS: { id: AlertGroup; label: string }[] = [
  { id: "locacoes", label: "Locações" },
  { id: "financeiro", label: "Financeiro" },
  { id: "estoque", label: "Disponibilidade" },
];

export function AlertCenter() {
  const alerts = useAlerts();
  const [showAll, setShowAll] = useState(false);
  const counts = { urgente: 0, atencao: 0, info: 0 };
  alerts.forEach((a) => counts[a.priority]++);
  const visible = showAll ? alerts : alerts.slice(0, 6);

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground"><BellRing className="h-6 w-6 text-primary" /> Central de alertas</h2>
        <div className="flex flex-wrap gap-2">
          {(["urgente", "atencao", "info"] as const).map((p) => counts[p] > 0 && (
            <span key={p} className={cn("rounded-full px-3 py-1 text-sm font-bold", PRIORITY_UI[p].className)}>{counts[p]} {PRIORITY_UI[p].label.toLowerCase()}</span>
          ))}
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="flex items-center gap-3 rounded-xl bg-success-soft p-4 text-base font-semibold text-success"><CheckCircle2 className="h-6 w-6" /> Tudo em dia! Nenhuma pendência no momento.</p>
      ) : (
        <>
          <div className="space-y-4">
            {GROUPS.map((g) => {
              const items = visible.filter((a) => a.group === g.id);
              if (!items.length) return null;
              return (
                <div key={g.id}>
                  <p className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                  <ul className="space-y-2">
                    {items.map((a) => {
                      const ui = PRIORITY_UI[a.priority];
                      return (
                        <li key={a.key}>
                          <Link {...linkFor(a.linkType ?? null, a.linkId ?? null)} className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted">
                            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", ui.className)}><ui.icon className="h-5 w-5" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-bold text-foreground">{a.title}</span>
                              <span className="block text-sm text-muted-foreground">{a.body}</span>
                            </span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
          {alerts.length > 6 && (
            <button type="button" className="mt-3 text-base font-bold text-primary hover:underline" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Mostrar menos" : `Ver todos os ${alerts.length} alertas`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}
