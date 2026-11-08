import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço alternativo: /auth leva para a tela de login.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/entrar" });
  },
});
