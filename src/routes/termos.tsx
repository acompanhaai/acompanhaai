import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — AcompanhaAí" },
      {
        name: "description",
        content: "Termos de Uso da plataforma AcompanhaAí: condições de cadastro, uso e responsabilidades.",
      },
      { property: "og:title", content: "Termos de Uso — AcompanhaAí" },
      { property: "og:description", content: "Condições de uso da plataforma AcompanhaAí." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Termos,
});

const sections = [
  {
    title: "Aceitação dos termos",
    body: "Ao criar uma conta ou utilizar a plataforma AcompanhaAí, o usuário declara que leu e concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.",
  },
  {
    title: "Sobre o AcompanhaAí",
    body: "O AcompanhaAí é uma plataforma de acompanhamento de solicitações e serviços, que permite registrar atendimentos, acompanhar o andamento e compartilhar informações entre operação, prestadores e clientes. A plataforma é operada por [Razão social], inscrita no CNPJ [CNPJ].",
  },
  {
    title: "Cadastro e acesso",
    body: "O cadastro exige informações verdadeiras e atualizadas. O usuário é responsável pela guarda das suas credenciais de acesso e por toda atividade realizada com a sua conta. Acessos de prestadores e motoristas são criados e gerenciados pela empresa contratante.",
  },
  {
    title: "Uso da plataforma",
    body: "A plataforma deve ser utilizada apenas para as finalidades previstas nestes termos. É vedado utilizar a plataforma para atividades ilícitas, tentar acessar dados de terceiros, realizar engenharia reversa ou comprometer a segurança e a disponibilidade do serviço.",
  },
  {
    title: "Responsabilidades do usuário",
    body: "O usuário é responsável pelas informações inseridas na plataforma, pela sua exatidão e pelo cumprimento da legislação aplicável à sua operação, inclusive quanto às informações compartilhadas com clientes finais.",
  },
  {
    title: "Responsabilidades do AcompanhaAí",
    body: "O AcompanhaAí se compromete a disponibilizar a plataforma conforme descrito, adotar medidas razoáveis de segurança e tratar os dados pessoais conforme a Política de Privacidade.",
  },
  {
    title: "Disponibilidade do serviço",
    body: "A plataforma pode passar por manutenções programadas ou interrupções decorrentes de fatores técnicos e de terceiros. Não há garantia de disponibilidade ininterrupta, salvo condições específicas previstas em contrato.",
  },
  {
    title: "Propriedade intelectual",
    body: "A marca, o software, o design e os demais elementos da plataforma pertencem ao AcompanhaAí. O uso da plataforma não transfere ao usuário qualquer direito de propriedade intelectual.",
  },
  {
    title: "Limitação de responsabilidade",
    body: "Na máxima extensão permitida pela legislação aplicável, o AcompanhaAí não responde por danos indiretos ou lucros cessantes decorrentes do uso ou da indisponibilidade da plataforma. Condições comerciais específicas podem estar previstas em contrato.",
  },
  {
    title: "Alterações dos termos",
    body: "Estes termos podem ser atualizados a qualquer momento. A versão vigente estará sempre disponível nesta página, com a respectiva data de atualização.",
  },
  {
    title: "Encerramento",
    body: "O usuário pode encerrar a sua conta a qualquer momento. O AcompanhaAí pode suspender ou encerrar o acesso em caso de descumprimento destes termos ou de uso indevido da plataforma.",
  },
  {
    title: "Legislação aplicável",
    body: "Estes termos são regidos pela legislação brasileira. Fica eleito o foro de [Comarca/UF] para dirimir eventuais controvérsias.",
  },
  {
    title: "Contato",
    body: "Dúvidas sobre estes termos podem ser enviadas para [e-mail de contato].",
  },
];

function Termos() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
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
