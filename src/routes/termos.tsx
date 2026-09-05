import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — AcompanhaAí" },
      {
        name: "description",
        content:
          "Termos de Uso da plataforma AcompanhaAí: condições de cadastro, uso e responsabilidades.",
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
    title: "Sobre o AcompanhaAí",
    body: `O AcompanhaAí é uma plataforma de software como serviço (SaaS) destinada ao gerenciamento e acompanhamento de solicitações, atendimentos e serviços.

A plataforma permite, conforme as funcionalidades disponíveis e o plano contratado, registrar solicitações, acompanhar seu andamento, organizar informações relacionadas aos atendimentos e compartilhar informações necessárias entre as pessoas envolvidas na operação.

O AcompanhaAí fornece uma infraestrutura tecnológica para apoiar a gestão e o acompanhamento das operações de seus usuários.

A utilização do AcompanhaAí não significa que a plataforma seja responsável pela execução, qualidade, prazo ou resultado dos serviços realizados pelo usuário, seus clientes, prestadores, motoristas ou terceiros.`,
  },
  {
    title: "Cadastro e acesso",
    body: `Algumas funcionalidades da plataforma dependem da criação de uma conta.

O usuário declara que as informações fornecidas durante o cadastro são verdadeiras, completas e atualizadas.

O usuário é responsável pela proteção de suas credenciais de acesso e por todas as atividades realizadas através de sua conta.

Quando uma organização utiliza o AcompanhaAí, os acessos de operadores, prestadores, motoristas ou outros usuários poderão ser criados, administrados ou revogados pela própria organização.

O usuário não deverá compartilhar suas credenciais com terceiros ou permitir acesso não autorizado à sua conta.`,
  },
  {
    title: "Planos e utilização",
    body: `O AcompanhaAí poderá disponibilizar diferentes planos de utilização, incluindo planos gratuitos e pagos.

Os limites, funcionalidades e preços de cada plano serão apresentados na página de planos da plataforma ou no momento da contratação.

Os planos poderão possuir limites relacionados ao número de solicitações, usuários, funcionalidades ou outros critérios definidos pelo AcompanhaAí.

Quando o usuário atingir o limite de utilização de seu plano, determinadas funcionalidades poderão ficar indisponíveis até a renovação do período ou até que seja realizado um upgrade para outro plano.

O AcompanhaAí poderá alterar planos, funcionalidades e preços para novas contratações, respeitando as condições aplicáveis aos usuários já contratantes e a legislação vigente.`,
  },
  {
    title: "Contratação e pagamentos",
    body: `Os planos pagos poderão ser cobrados de acordo com a periodicidade e os valores apresentados no momento da contratação.

Quando aplicável, a cobrança poderá ser realizada por meio de provedores de pagamento terceirizados.

Os dados de pagamento poderão ser processados diretamente pelo respectivo provedor, de acordo com seus próprios termos e políticas.

Em caso de falha de pagamento, inadimplência ou cancelamento, o acesso às funcionalidades relacionadas ao plano pago poderá ser limitado ou suspenso conforme as condições apresentadas no momento da contratação.`,
  },
  {
    title: "Cancelamento e reembolso",
    body: `O usuário pode cancelar sua assinatura a qualquer momento diretamente na plataforma ou solicitando pelo canal de contato oficial. O cancelamento interrompe a renovação automática; o acesso ao plano pago permanece disponível até o fim do período já pago.

Em conformidade com o artigo 49 do Código de Defesa do Consumidor, o usuário que contratar um plano pago pela primeira vez pode solicitar o cancelamento com reembolso integral em até 7 (sete) dias corridos após a contratação, sem necessidade de justificativa.

Após esse prazo, não são garantidos reembolsos proporcionais por períodos não utilizados, exceto quando exigido pela legislação aplicável ou em casos de falha comprovada da plataforma que impeça a utilização do serviço contratado.

O processamento de pagamentos e eventuais reembolsos é realizado pelo provedor de pagamentos utilizado no momento da contratação, podendo estar sujeito aos prazos e políticas desse provedor.

Solicitações de cancelamento ou reembolso devem ser enviadas para: acompanhaai.app@gmail.com.`,
  },
  {
    title: "Uso permitido",
    body: `O AcompanhaAí deverá ser utilizado exclusivamente para finalidades lícitas e compatíveis com suas funcionalidades.

É proibido utilizar a plataforma para:

• praticar atividades ilícitas ou fraudulentas;
• inserir informações deliberadamente falsas com finalidade fraudulenta;
• acessar contas, dados ou sistemas de terceiros sem autorização;
• tentar obter acesso não autorizado à infraestrutura da plataforma;
• explorar vulnerabilidades ou comprometer a segurança do serviço;
• realizar engenharia reversa, descompilação ou tentativa de obtenção do código-fonte, salvo quando expressamente permitido pela legislação;
• interferir no funcionamento normal da plataforma;
• utilizar mecanismos automatizados de maneira abusiva;
• transmitir conteúdo que viole direitos de terceiros ou a legislação aplicável;
• utilizar a plataforma para prejudicar terceiros ou outros usuários.`,
  },
  {
    title: "Informações inseridas pelo usuário",
    body: `O usuário é responsável pelas informações, dados, textos e demais conteúdos inseridos na plataforma.

O usuário deverá possuir autorização e fundamento legal adequado para coletar, utilizar, armazenar e compartilhar dados pessoais através do AcompanhaAí, quando exigido pela legislação.

Quando uma empresa utiliza o AcompanhaAí para administrar seus próprios atendimentos, clientes ou prestadores, essa empresa permanece responsável pela legalidade de sua operação e pelas informações que decide inserir ou compartilhar através da plataforma.

O AcompanhaAí não garante a veracidade, completude ou legitimidade das informações inseridas pelos usuários.`,
  },
  {
    title: "Localização e acompanhamento",
    body: `Determinadas funcionalidades poderão permitir o acompanhamento da localização de prestadores ou dispositivos durante atendimentos.

A localização poderá depender de GPS, conexão com a internet, permissões do dispositivo, sistema operacional e outros fatores técnicos.

As informações de localização poderão apresentar atrasos, imprecisões ou indisponibilidade.

O acompanhamento de localização não constitui garantia de horário de chegada, cumprimento de prazo, execução ou conclusão do serviço.`,
  },
  {
    title: "Responsabilidades do usuário",
    body: `O usuário é responsável por:

• utilizar a plataforma de acordo com estes Termos;
• proteger suas credenciais;
• manter suas informações cadastrais atualizadas;
• possuir autorização para utilizar os dados inseridos;
• cumprir a legislação aplicável à sua atividade;
• informar adequadamente seus clientes, prestadores e demais envolvidos sobre o tratamento de dados realizado em sua operação, quando necessário;
• utilizar os recursos de localização e acompanhamento de forma legítima e compatível com a finalidade do serviço.`,
  },
  {
    title: "Responsabilidades do AcompanhaAí",
    body: `O AcompanhaAí buscará manter a plataforma disponível e funcionando de acordo com suas funcionalidades e características apresentadas.

Serão adotadas medidas técnicas e organizacionais compatíveis com a natureza do serviço para contribuir com a segurança e proteção das informações tratadas.

Entretanto, determinadas funcionalidades podem depender de serviços de terceiros, conexão com a internet, GPS, dispositivos, provedores de infraestrutura, APIs ou outros componentes externos.

Por essa razão, não é garantida disponibilidade ininterrupta ou funcionamento livre de erros.`,
  },
  {
    title: "Disponibilidade e manutenção",
    body: `A plataforma poderá passar por manutenções, atualizações, correções, melhorias ou alterações técnicas.

Sempre que possível, manutenções programadas serão realizadas de forma a minimizar impactos aos usuários.

O AcompanhaAí não será responsável por indisponibilidades causadas por eventos fora de seu controle razoável, incluindo falhas de infraestrutura de terceiros, internet, serviços externos, dispositivos dos usuários, ataques cibernéticos, força maior ou outros eventos semelhantes.`,
  },
  {
    title: "Propriedade intelectual",
    body: `A marca AcompanhaAí, o software, código, design, interface, identidade visual, textos, funcionalidades e demais elementos que compõem a plataforma são protegidos pela legislação aplicável.

A utilização do serviço não transfere ao usuário qualquer direito de propriedade intelectual sobre a plataforma.

O usuário recebe apenas uma licença limitada, não exclusiva e não transferível para utilizar o serviço durante o período em que possuir acesso autorizado à plataforma.`,
  },
  {
    title: "Serviços de terceiros",
    body: `O AcompanhaAí poderá utilizar serviços e tecnologias fornecidos por terceiros para disponibilizar determinadas funcionalidades.

Esses serviços podem incluir hospedagem, armazenamento, autenticação, comunicação, pagamentos, mapas, processamento de localização e outras infraestruturas tecnológicas.

A disponibilidade de determinadas funcionalidades poderá depender desses serviços externos.

O uso de serviços de terceiros também poderá estar sujeito aos respectivos termos e políticas de privacidade.`,
  },
  {
    title: "Limitação de responsabilidade",
    body: `Na máxima extensão permitida pela legislação aplicável, o AcompanhaAí não será responsável por:

• informações incorretas ou incompletas inseridas pelos usuários;
• falhas ou atrasos decorrentes de terceiros;
• indisponibilidade de internet, GPS ou dispositivos;
• atrasos, cancelamentos ou falhas na execução de serviços realizados por clientes, prestadores ou terceiros;
• decisões tomadas pelos usuários com base nas informações apresentadas pela plataforma;
• perdas decorrentes de utilização inadequada da plataforma;
• danos indiretos ou lucros cessantes, quando legalmente permitida sua limitação.

Nenhuma disposição destes Termos busca excluir ou limitar responsabilidades que não possam ser excluídas ou limitadas pela legislação aplicável.`,
  },
  {
    title: "Suspensão e encerramento",
    body: `O usuário poderá solicitar o encerramento de sua conta conforme os recursos disponibilizados pela plataforma.

O AcompanhaAí poderá suspender ou encerrar o acesso de uma conta em caso de:

• violação destes Termos;
• utilização ilícita ou fraudulenta;
• tentativa de comprometimento da segurança;
• uso abusivo da plataforma;
• inadimplência, quando aplicável;
• determinação legal ou regulatória.

Quando possível e adequado, o usuário poderá ser informado sobre a suspensão ou encerramento.`,
  },
  {
    title: "Privacidade e proteção de dados",
    body: `O tratamento de dados pessoais realizado através do AcompanhaAí é descrito em sua Política de Privacidade.

Quando o AcompanhaAí for utilizado por uma empresa para tratar dados de seus próprios clientes, prestadores ou usuários, poderão existir responsabilidades específicas entre a empresa contratante e o AcompanhaAí, de acordo com a legislação aplicável e a natureza do tratamento.`,
  },
  {
    title: "Alterações destes Termos",
    body: `Estes Termos poderão ser atualizados periodicamente para refletir alterações na plataforma, nos serviços oferecidos, na legislação ou nas práticas do AcompanhaAí.

A versão vigente estará sempre disponível na plataforma e será identificada pela respectiva data de atualização.

Alterações relevantes poderão ser comunicadas por meios adequados quando necessário.`,
  },
  {
    title: "Legislação aplicável",
    body: `Estes Termos são regidos pelas leis da República Federativa do Brasil.

Eventuais controvérsias serão tratadas de acordo com a legislação brasileira e perante o foro competente, observadas as regras legais aplicáveis ao caso.`,
  },
  {
    title: "Contato",
    body: `Dúvidas, solicitações ou comunicações relacionadas ao AcompanhaAí poderão ser encaminhadas pelo canal oficial:

E-mail: acompanhaai.app@gmail.com`,
  },
];

function Termos() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 01 de setembro de 2026
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma{" "}
              <strong className="text-foreground">AcompanhaAí</strong>, incluindo seus sites,
              sistemas, aplicações e funcionalidades relacionadas.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Ao criar uma conta, contratar um plano ou utilizar a plataforma, o usuário declara que
              leu, compreendeu e concorda com estes Termos de Uso. Caso não concorde com qualquer
              uma de suas disposições, não deverá utilizar a plataforma.
            </p>
          </section>

          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-foreground">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {section.body}
              </div>
            </section>
          ))}

          <section className="border-t border-border pt-8">
            <p className="text-sm font-semibold text-foreground">AcompanhaAí</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Software para acompanhamento e gestão de solicitações.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
