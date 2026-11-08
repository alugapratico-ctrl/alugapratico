import { describe, expect, it } from "vitest";
import { authErrorMessage, fieldErrors, loginSchema, resetPasswordSchema, safeRedirect, signupSchema } from "@/lib/auth-validation";

const valid = {
  fullName: "Maria Souza",
  businessName: "",
  email: "maria@email.com",
  password: "senha1234",
  confirm: "senha1234",
  terms: true,
};

describe("cadastro", () => {
  it("aceita um cadastro válido", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("recusa e-mail inválido", () => {
    const r = signupSchema.safeParse({ ...valid, email: "maria@" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).email).toBe("Digite um e-mail válido. Ex.: nome@email.com");
  });

  it("recusa senha com menos de 8 caracteres", () => {
    const r = signupSchema.safeParse({ ...valid, password: "abc123", confirm: "abc123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).password).toBe("A senha precisa ter pelo menos 8 caracteres.");
  });

  it("recusa senha sem número", () => {
    const r = signupSchema.safeParse({ ...valid, password: "senhasemnumero", confirm: "senhasemnumero" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).password).toBe("A senha precisa ter pelo menos um número.");
  });

  it("recusa senhas diferentes", () => {
    const r = signupSchema.safeParse({ ...valid, confirm: "outra1234" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).confirm).toBe("As duas senhas não são iguais.");
  });

  it("exige aceite dos termos", () => {
    const r = signupSchema.safeParse({ ...valid, terms: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).terms).toBe("Para continuar, aceite os termos de uso e a política de privacidade.");
  });
});

describe("login e nova senha", () => {
  it("exige a senha no login", () => {
    const r = loginSchema.safeParse({ email: "maria@email.com", password: "" });
    expect(r.success).toBe(false);
  });

  it("nova senha precisa ser confirmada", () => {
    expect(resetPasswordSchema.safeParse({ password: "nova12345", confirm: "nova12345" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "nova12345", confirm: "nova1234" }).success).toBe(false);
  });
});

describe("redirecionamento após login", () => {
  it("aceita só páginas internas", () => {
    expect(safeRedirect("/produtos")).toBe("/produtos");
    expect(safeRedirect("https://site-malicioso.com")).toBe("/painel");
    expect(safeRedirect("//site-malicioso.com")).toBe("/painel");
    expect(safeRedirect(undefined)).toBe("/painel");
  });
});

describe("mensagens de erro", () => {
  it("traduz credenciais inválidas", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos. Confira e tente de novo.");
  });
  it("avisa quando está sem internet", () => {
    expect(authErrorMessage({ message: "Failed to fetch" })).toBe("Sem conexão com a internet. Verifique sua conexão e tente novamente.");
  });
  it("explica quando a senha já vazou na internet", () => {
    expect(authErrorMessage({ code: "weak_password", message: "Password is known to be weak and easy to guess, please choose a different one." })).toBe("Essa senha já apareceu em vazamentos de dados na internet. Por segurança, escolha outra senha.");
  });
  it("avisa sobre e-mail já cadastrado", () => {
    expect(authErrorMessage({ code: "user_already_exists" })).toBe("Este e-mail já tem uma conta. Entre com ele ou recupere sua senha.");
  });
});
