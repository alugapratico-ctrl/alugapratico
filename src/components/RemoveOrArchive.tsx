import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/**
 * Sem histórico: oferece excluir. Com histórico: oferece arquivar/desativar (os registros ficam guardados).
 * O banco também recusa a exclusão de itens com histórico.
 */
export function RemoveOrArchive({ name, hasHistory, archived, archiveLabel, onDelete, onArchive, onRestore, className }: {
  name: string; hasHistory: boolean; archived: boolean; archiveLabel: "Arquivar" | "Desativar";
  onDelete: () => Promise<void>; onArchive: () => Promise<void>; onRestore: () => Promise<void>; className?: string;
}) {
  const [confirm, setConfirm] = useState<"delete" | "archive" | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true);
    try { await fn(); toast.success(msg); } catch (err) { toast.error(err instanceof Error ? err.message : "Não foi possível salvar agora."); }
    setBusy(false);
  };
  const done = archiveLabel === "Arquivar" ? "arquivado" : "desativado";

  if (archived) {
    return (
      <Button variant="outline" size="lg" className={className} disabled={busy} onClick={() => run(onRestore, `${name} foi reativado.`)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />} Reativar
      </Button>
    );
  }
  return (
    <>
      <Button variant="outline" size="lg" className={className} disabled={busy} onClick={() => setConfirm(hasHistory ? "archive" : "delete")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : hasHistory ? <Archive className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
        {hasHistory ? archiveLabel : "Excluir"}
      </Button>
      <AlertDialog open={confirm !== null} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">{confirm === "delete" ? `Excluir “${name}”?` : `${archiveLabel} “${name}”?`}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {confirm === "delete"
                ? "Não há nenhum histórico ligado a este cadastro. Ele será apagado definitivamente."
                : `Há histórico ligado a este cadastro, então ele não pode ser apagado. Ao ${archiveLabel.toLowerCase()}, ele some das novas locações, mas todo o histórico fica guardado. Você pode reativar depois.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base">Voltar</AlertDialogCancel>
            <AlertDialogAction className="h-12 text-base" onClick={() => {
              const c = confirm; setConfirm(null);
              if (c === "delete") void run(onDelete, `${name} foi excluído.`);
              else void run(onArchive, `${name} foi ${done}.`);
            }}>
              {confirm === "delete" ? "Sim, excluir" : `Sim, ${archiveLabel.toLowerCase()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
