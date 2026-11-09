import { z } from "zod";

// Regras de senha mostradas ao usuário e usadas na validação.
export const PASSWORD_RULES = [
  { label: "Pelo menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Pelo menos uma letra", test: (p: string) => /[A-Za-zÀ-ÿ]/.test(p) },
  { label: "Pelo menos um número", test: (p: string) => /\d/.test(p) },
] as const;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Digite seu e-mail.")
  .max(255, "O e-mail pode ter no máximo 255 caracteres.")
  .email("Digite um e-mail válido. Ex.: nome@email.com");

export const newPasswordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.")
  .regex(/[A-Za-zÀ-ÿ]/, "A senha precisa ter pelo menos uma letra.")
  .regex(/\d/, "A senha precisa ter pelo menos um número.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Digite sua senha."),
});

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Digite seu nome completo.")
      .max(120, "O nome pode ter no máximo 120 caracteres.")
      .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Digite nome e sobrenome."),
    businessName: z.string().trim().max(120, "O nome do negócio pode ter no máximo 120 caracteres."),
    email: emailSchema,
    password: newPasswordSchema,
    confirm: z.string().min(1, "Digite a senha novamente."),
    terms: z.boolean().refine((v) => v, "Para continuar, aceite os termos de uso e a política de privacidade."),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "As duas senhas não são iguais." });

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirm: z.string().min(1, "Digite a senha novamente."),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "As duas senhas não são iguais." });

export const forgotSchema = z.object({ email: emailSchema });

export type FieldKey = "email" | "password" | "confirm" | "fullName" | "businessName" | "terms" | "form";
export type FieldErrors = Partial<Record<FieldKey, string>>;

/** Converte o resultado do zod em { campo: "primeira mensagem de erro" }. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form") as FieldKey;
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Aceita só caminhos internos (ex.: "/produtos"), nunca outro site. */
export function safeRedirect(path: string | undefined | null, fallback = "/painel"): string {
  if (!path || typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.startsWith("/entrar") || path.startsWith("/cadastro") || path.startsWith("/auth")) return fallback;
  return path;
}

type AuthLikeError = { message?: string; code?: string; status?: number } | null | undefined;

/** Traduz erros do serviço de login para mensagens claras em português. */
export function authErrorMessage(error: unknown, online = true): string {
  const e = error as AuthLikeError;
  const msg = (e?.message ?? "").toLowerCase();
  const code = e?.code ?? "";
  if (!online || msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network request failed") || msg.includes("load failed"))
    return "Sem conexão com a internet. Verifique sua conexão e tente novamente.";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials"))
    return "E-mail ou senha incorretos. Confira e tente de novo.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Você ainda não confirmou seu e-mail. Abra a mensagem que enviamos e toque no link de confirmação.";
  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered"))
    return "Este e-mail já tem uma conta. Entre com ele ou recupere sua senha.";
  if (code === "weak_password" || msg.includes("password should"))
    return "Essa senha é fraca. Use pelo menos 8 caracteres, com letras e números.";
  if (code === "same_password") return "A nova senha precisa ser diferente da senha atual.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || e?.status === 429)
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
  if (code === "otp_expired" || msg.includes("expired")) return "Este link expirou ou já foi usado. Peça um novo link.";
  if (code === "session_not_found" || code === "refresh_token_not_found" || msg.includes("auth session missing"))
    return "Sua sessão expirou. Entre novamente.";
  if (code === "email_address_invalid" || msg.includes("email address") && msg.includes("invalid"))
    return "Esse e-mail não é válido. Confira e tente de novo.";
  if (msg.includes("email address is not allowed") || msg.includes("cannot receive email"))
    return "Esse e-mail não consegue receber mensagens. Confira se digitou certo ou use outro e-mail.";
  if (code === "signup_disabled") return "Novos cadastros estão desativados no momento.";
  return "Não foi possível concluir agora. Tente novamente em instantes.";
}
