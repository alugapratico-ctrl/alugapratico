import { whatsappNumber } from "@/lib/messages";

/**
 * Número oficial de atendimento do AlugaPrático (formato internacional, ex.: 5511999990000).
 * Número fixo oficial; VITE_SUPPORT_WHATSAPP pode sobrescrever. Sem número válido, o botão não aparece.
 */
export const SUPPORT_WHATSAPP: string =
  (import.meta.env["VITE_SUPPORT_WHATSAPP"] as string | undefined) || "5518996142925";

export const SUPPORT_MESSAGE = "Olá! Sou usuário do AlugaPrático e preciso de ajuda com o sistema.";

export function supportLink(raw = SUPPORT_WHATSAPP) {
  const n = raw ? whatsappNumber(raw) : null;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(SUPPORT_MESSAGE)}` : null;
}
