import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — AcompanhaAí" },
      {
        name: "description",
        content:
          "Saiba quais dados o AcompanhaAí pode coletar, como eles são utilizados e quais são os direitos dos titulares.",
      },
      { property: "og:title", content: "Política de Privacidade — AcompanhaAí" },
      {
        property: "og:description",
        content: "Como o AcompanhaAí trata dados pessoais na plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

const sections = [
  {
    title: "Introdução",
    body: "Esta política explica como a [Razão social], inscrita no CNPJ [CNPJ], trata os dados pessoais utilizados na plataforma AcompanhaAí.",
  },
  {
    title: "Dados que podemos coletar",
    body: "Podemos coletar dados de cadastro (nome, e-mail, telefone e documento da empresa), dados das solicitações registradas na plataforma, mensagens trocadas no atendimento e dados de localização do prestador durante o atendimento em andamento.",
  },
  {
    title: "Como utilizamos os dados",
    body: "Os dados são utilizados para permitir o funcionamento da plataforma: autenticar usuários, registrar e acompanhar solicitações, exibir o andamento do atendimento às pessoas envolvidas e prestar suporte.",
  },
  {
    title: "Compartilhamento de dados",
    body: "Os dados são compartilhados apenas com as pessoas envolvidas no atendimento (operação, prestador e cliente que possui o número do protocolo) e com fornecedores de infraestrutura necessários ao funcionamento da plataforma, além de casos exigidos por lei.",
  },
  {
    title: "Segurança",
    body: "Adotamos medidas técnicas e organizacionais para proteger os dados, como controle de acesso por usuário e regras de permissão por perfil na base de dados.",
  },
  {
    title: "Armazenamento e retenção",
    body: "Os dados são armazenados enquanto a conta estiver ativa e pelo período necessário ao cumprimento de obrigações legais. Prazos específicos: [prazo de retenção].",
  },
  {
    title: "Direitos dos titulares",
    body: "O titular pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, nos termos da LGPD, pelo canal indicado na seção Contato.",
  },
  {
    title: "Cookies",
    body: "Utilizamos apenas os cookies e mecanismos de armazenamento necessários para manter a sessão do usuário autenticado e o funcionamento básico da plataforma.",
  },
  {
    title: "Alterações desta política",
    body: "Esta política pode ser atualizada. A versão vigente estará sempre disponível nesta página, com a data de atualização correspondente.",
  },
  {
    title: "Contato",
    body: "Para assuntos de privacidade, entre em contato pelo e-mail [e-mail de privacidade]. Encarregado (DPO): [nome do encarregado, se houver].",
  },
];

function Privacidade() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: [data]</p>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-foreground">
                {index + 1}. {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
