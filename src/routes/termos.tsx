import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/termos")({
  head: () => seo("Termos de uso", "Regras de uso do AlugaPratico, o sistema de gestão de locações."),
  component: Termos,
});

function Termos() {
  return (
    <LegalPage title="Termos de uso" updated="05/11/2026">
      <p>Estes termos explicam as regras para usar o AlugaPratico. Ao criar sua conta, você concorda com eles.</p>
      <h2>1. O que é o AlugaPratico</h2>
      <p>É um sistema para organizar produtos, clientes, locações e valores do seu negócio de aluguel.</p>
      <h2>2. Sua conta</h2>
      <ul>
        <li>Use informações verdadeiras no cadastro.</li>
        <li>Guarde sua senha com cuidado e não a compartilhe.</li>
        <li>Você é responsável pelo que for feito com a sua conta.</li>
      </ul>
      <h2>3. Seus dados</h2>
      <p>Os produtos, clientes e locações que você cadastra pertencem a você. Só a sua conta tem acesso a eles.</p>
      <h2>4. Uso correto</h2>
      <p>Não use o sistema para atividades ilegais ou para cadastrar dados de outras pessoas sem permissão.</p>
      <h2>5. Mudanças</h2>
      <p>Podemos atualizar estes termos. Quando isso acontecer, avisaremos no próprio sistema.</p>
    </LegalPage>
  );
}
