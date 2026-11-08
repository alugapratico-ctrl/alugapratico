// Regras das multas e ocorrências dos clientes.

export type FineStatus = "pendente" | "paga" | "contestada";
export type Fine = {
  id: string;
  clientId: string;
  rentalId?: string | undefined;
  productId?: string | undefined;
  infractionDate: string;
  description: string;
  amount: number;
  dueDate?: string | undefined;
  status: FineStatus;
  attachmentPath?: string | undefined;
  attachmentUrl?: string | undefined;
  notes?: string | undefined;
};

export const FINE_STATUS: Record<FineStatus, { label: string; plural: string; className: string }> = {
  pendente: { label: "Pendente", plural: "Pendentes", className: "bg-warning-soft text-warning" },
  paga: { label: "Paga", plural: "Pagas", className: "bg-success-soft text-success" },
  contestada: { label: "Contestada", plural: "Contestadas", className: "bg-info-soft text-info" },
};
export const FINE_STATUSES: FineStatus[] = ["pendente", "paga", "contestada"];

/** Resumo: quantidade de multas, soma das pendentes e soma das pagas (contestadas ficam fora das somas). */
export function fineTotals(fines: Fine[]) {
  const sum = (s: FineStatus) => fines.filter((f) => f.status === s).reduce((t, f) => t + f.amount, 0);
  return { count: fines.length, pending: sum("pendente"), paid: sum("paga") };
}

export function filterFines(fines: Fine[], status: FineStatus | "todas") {
  return status === "todas" ? fines : fines.filter((f) => f.status === status);
}

/** Arquivos aceitos como anexo da multa: fotos ou PDF, até 5 MB. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export function attachmentError(file: { type: string; size: number }) {
  if (!(file.type.startsWith("image/") || file.type === "application/pdf")) return "Escolha uma foto ou um arquivo PDF.";
  if (file.size > MAX_ATTACHMENT_BYTES) return "O arquivo é muito grande. Escolha um de até 5 MB.";
  return null;
}
