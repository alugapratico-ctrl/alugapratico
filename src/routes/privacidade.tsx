import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacidade")({
  head: () => seo("Política de privacidade", "Como o AlugaPratico coleta, usa e protege os seus dados."),
  component: Privacidade,
});

function Privacidade() {
  return (
    <LegalPage title="Política de privacidade" updated="05/11/2026">
      <p>Esta política explica quais dados guardamos e como cuidamos deles, de acordo com a Lei Geral de Proteção de Dados (LGPD).</p>
      <h2>1. Dados que guardamos</h2>
      <ul>
        <li>Nome, e-mail, nome do negócio e foto de perfil (quando você informa ou entra com o Google).</li>
        <li>Os produtos, clientes e locações que você cadastra.</li>
        <li>Data de criação da conta e do último acesso.</li>
      </ul>
      <h2>2. Como protegemos</h2>
      <ul>
        <li>Sua senha é guardada de forma criptografada. Nem nós conseguimos vê-la.</li>
        <li>Cada conta só enxerga os próprios dados.</li>
        <li>As fotos ficam em uma pasta privada da sua conta.</li>
      </ul>
      <h2>3. Para que usamos</h2>
      <p>Usamos seus dados apenas para fazer o sistema funcionar para você. Não vendemos seus dados.</p>
      <h2>4. Seus direitos</h2>
      <p>Você pode ver e corrigir seus dados na página "Meu perfil" e pedir a exclusão da sua conta a qualquer momento.</p>
    </LegalPage>
  );
}
