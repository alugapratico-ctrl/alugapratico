import { brl, fmtDate, type Client, type Product, type Rental } from "@/lib/store";

export type TemplateId = "confirmacao" | "retirada" | "devolucao" | "atraso" | "cobranca" | "pagamento";

export const TEMPLATES: { id: TemplateId; label: string; subject: string }[] = [
  { id: "confirmacao", label: "Confirmação de locação", subject: "Sua locação foi registrada" },
  { id: "retirada", label: "Lembrete de retirada", subject: "Lembrete de retirada" },
  { id: "devolucao", label: "Lembrete de devolução", subject: "Lembrete de devolução" },
  { id: "atraso", label: "Aviso de devolução atrasada", subject: "Devolução pendente" },
  { id: "cobranca", label: "Cobrança de pagamento", subject: "Pagamento pendente" },
  { id: "pagamento", label: "Confirmação de pagamento", subject: "Pagamento registrado" },
];

/** Monta o texto do modelo com os dados disponíveis. (O sistema guarda apenas datas, sem horário.) */
export function buildMessage(id: TemplateId, client: Client, rental?: Rental, product?: Product) {
  const nome = client.name.trim().split(/\s+/)[0] || client.name;
  const prod = product?.name ?? "[Produto]";
  const ini = rental ? fmtDate(rental.start) : "[Data]";
  const fim = rental ? fmtDate(rental.end) : "[Data]";
  const valor = rental ? brl(rental.total) : "[Valor]";
  switch (id) {
    case "confirmacao":
      return `Olá, ${nome}! Sua locação foi registrada com sucesso.\n\nProduto: ${prod}\nRetirada: ${ini}\nDevolução: ${fim}\nValor total: ${valor}\n\nQualquer dúvida, estamos à disposição!`;
    case "retirada":
      return `Olá, ${nome}! Passando para lembrar que sua retirada está prevista para ${ini}.\n\nProduto: ${prod}\n\nEstamos aguardando você!`;
    case "devolucao":
      return `Olá, ${nome}! Lembramos que a devolução de ${prod} está prevista para ${fim}.\n\nCaso precise de alguma informação, estamos à disposição.`;
    case "atraso":
      return `Olá, ${nome}! Identificamos que a devolução de ${prod}, prevista para ${fim}, ainda consta como pendente.\n\nPor favor, entre em contato para combinarmos a regularização.`;
    case "cobranca":
      return `Olá, ${nome}! Tudo bem?\n\nEstamos entrando em contato para lembrar que existe um pagamento pendente referente à sua locação.\n\nValor pendente: ${valor}\nVencimento: ${fim}\n\nCaso já tenha realizado o pagamento, por favor, desconsidere esta mensagem.`;
    case "pagamento":
      return `Olá, ${nome}! Seu pagamento de ${valor} foi registrado com sucesso.\n\nObrigado pela preferência!`;
  }
}

/** Converte um telefone brasileiro para o formato do WhatsApp (55 + DDD + número). Retorna null se inválido. */
export function whatsappNumber(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (d.length < 12 || d.length > 13) return null;
  return d;
}

export const whatsappLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const mailtoLink = (email: string, subject: string, body: string) =>
  `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
