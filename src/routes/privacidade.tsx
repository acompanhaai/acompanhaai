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
    title: "Sobre o AcompanhaAí",
    body: `O AcompanhaAí é uma plataforma de software como serviço (SaaS) voltada ao gerenciamento e acompanhamento de solicitações, atendimentos e serviços.

A plataforma pode ser utilizada por empresas para organizar operações, acompanhar solicitações, gerenciar prestadores e compartilhar informações relacionadas a determinados atendimentos.

Dependendo da situação e da finalidade do tratamento, o AcompanhaAí poderá atuar como controlador ou operador de dados pessoais.

Quando uma empresa utiliza o AcompanhaAí para gerenciar dados de seus próprios clientes, prestadores ou usuários, essa empresa poderá ser responsável pelas decisões relacionadas ao tratamento desses dados, cabendo ao AcompanhaAí realizar o tratamento necessário para fornecer o serviço, conforme as funcionalidades contratadas e as instruções aplicáveis.`,
  },
  {
    title: "Dados que podem ser tratados",
    body: `Dependendo da utilização da plataforma, poderão ser tratados diferentes tipos de dados pessoais.

Dados de cadastro
Podem ser tratados dados necessários para criação e manutenção da conta, como nome, endereço de e-mail, telefone, informações relacionadas à empresa ou organização, e informações necessárias à autenticação e gerenciamento da conta.

Dados relacionados às solicitações
Os usuários poderão inserir informações relacionadas a solicitações, atendimentos e serviços. Essas informações poderão incluir dados necessários para identificar, acompanhar, atualizar e concluir determinada solicitação. O conteúdo inserido pelo usuário deverá respeitar a legislação aplicável e não deverá conter informações desnecessárias para a finalidade da operação.

Dados de prestadores
Quando aplicável, poderão ser tratados dados relacionados aos prestadores envolvidos em um atendimento, incluindo nome, identificação operacional, telefone, informações relacionadas ao serviço e informações de localização, quando a funcionalidade estiver habilitada.

Dados de localização
Determinadas funcionalidades poderão tratar dados de localização de prestadores ou dispositivos durante atendimentos. A localização poderá ser utilizada para permitir que pessoas autorizadas acompanhem o andamento de determinado atendimento. A disponibilidade e precisão das informações poderão variar de acordo com GPS, conexão de internet, dispositivo, sistema operacional, permissões concedidas e outros fatores técnicos.

Dados técnicos
Para segurança, funcionamento e manutenção da plataforma, poderão ser tratados dados técnicos, como endereço IP, informações do dispositivo, navegador utilizado, sistema operacional, data e horário de acesso, registros de utilização e informações relacionadas à segurança e prevenção de abusos.`,
  },
  {
    title: "Como utilizamos os dados",
    body: `Os dados pessoais poderão ser utilizados para:

• criar e administrar contas;
• autenticar usuários;
• fornecer as funcionalidades da plataforma;
• registrar e acompanhar solicitações;
• permitir o acompanhamento de atendimentos;
• disponibilizar informações às pessoas autorizadas envolvidas em determinado atendimento;
• disponibilizar funcionalidades de localização;
• prestar suporte;
• processar assinaturas e pagamentos, quando aplicável;
• prevenir fraudes, abusos e usos indevidos;
• proteger a segurança da plataforma;
• realizar manutenção e melhoria do serviço;
• cumprir obrigações legais ou regulatórias;
• exercer ou defender direitos;
• atender solicitações legítimas dos titulares.

O AcompanhaAí buscará utilizar os dados pessoais de acordo com as finalidades informadas nesta Política e com as bases legais aplicáveis.`,
  },
  {
    title: "Bases legais",
    body: `O tratamento de dados pessoais poderá ocorrer com fundamento nas hipóteses previstas na legislação aplicável, incluindo, conforme o caso:

• execução de contrato ou de procedimentos relacionados a contrato;
• cumprimento de obrigação legal ou regulatória;
• exercício regular de direitos;
• legítimo interesse, quando aplicável e observados os requisitos legais;
• consentimento, quando necessário;
• outras hipóteses legalmente permitidas.

A base legal aplicável poderá variar conforme o tipo de dado, finalidade e contexto do tratamento.`,
  },
  {
    title: "Compartilhamento de dados",
    body: `Os dados poderão ser compartilhados quando necessário para o funcionamento da plataforma e para as finalidades descritas nesta Política.

Isso poderá incluir:

• empresas que utilizam o AcompanhaAí;
• usuários autorizados pela organização contratante;
• prestadores envolvidos em determinado atendimento;
• clientes ou destinatários de uma solicitação, quando a funcionalidade permitir;
• provedores de hospedagem e armazenamento;
• provedores de autenticação;
• provedores de comunicação;
• provedores de pagamentos;
• provedores de mapas e localização;
• outros fornecedores necessários à operação do serviço;
• autoridades públicas, quando houver obrigação legal ou determinação válida.

O compartilhamento será limitado ao necessário para a finalidade correspondente, observadas as medidas de segurança aplicáveis.`,
  },
  {
    title: "Dados de localização",
    body: `Quando uma funcionalidade de localização estiver habilitada, os dados poderão ser tratados durante o período necessário para permitir o acompanhamento do atendimento.

A localização poderá ser disponibilizada às pessoas autorizadas a acompanhar determinada solicitação.

O funcionamento da localização depende de fatores externos, incluindo GPS, internet, dispositivo e permissões concedidas.

O AcompanhaAí não garante precisão absoluta ou disponibilidade contínua das informações de localização.`,
  },
  {
    title: "Cookies e tecnologias semelhantes",
    body: `O AcompanhaAí poderá utilizar cookies, armazenamento local e tecnologias semelhantes necessárias para manter sessões autenticadas, preservar determinadas preferências, garantir segurança, permitir o funcionamento da plataforma e obter informações técnicas necessárias à operação do serviço.

Caso sejam utilizados cookies não essenciais, suas finalidades e formas de gerenciamento poderão ser apresentadas ao usuário por meio dos mecanismos disponibilizados na plataforma.`,
  },
  {
    title: "Segurança",
    body: `O AcompanhaAí adota medidas técnicas e organizacionais compatíveis com a natureza dos dados tratados e com os riscos envolvidos, buscando reduzir riscos de acesso não autorizado, perda, alteração, divulgação ou destruição indevida.

As medidas podem incluir autenticação de usuários, controle de permissões, segregação de acessos, proteção das comunicações, registros técnicos e de segurança, e mecanismos de controle de acesso à infraestrutura.

Apesar das medidas adotadas, nenhum sistema conectado à internet pode garantir segurança absoluta.`,
  },
  {
    title: "Armazenamento e retenção",
    body: `Os dados poderão ser armazenados enquanto forem necessários para fornecimento dos serviços, manutenção da conta, execução de contratos, cumprimento de obrigações legais, prevenção de fraudes, resolução de disputas, exercício regular de direitos e outras finalidades legítimas relacionadas à operação da plataforma.

Após o encerramento da conta ou o término da finalidade aplicável, os dados poderão ser eliminados, anonimizados ou mantidos pelo período necessário quando houver fundamento legal para sua conservação.

Os prazos de retenção poderão variar de acordo com a natureza dos dados, a finalidade do tratamento e as obrigações legais aplicáveis.`,
  },
  {
    title: "Direitos dos titulares",
    body: `Nos termos da legislação aplicável, especialmente da Lei Geral de Proteção de Dados Pessoais (LGPD), o titular poderá exercer os direitos previstos em lei, incluindo, quando aplicável:

• confirmação da existência de tratamento;
• acesso aos dados pessoais;
• correção de dados incompletos, inexatos ou desatualizados;
• informações sobre o tratamento e compartilhamento;
• anonimização, bloqueio ou eliminação de dados tratados em desconformidade com a legislação;
• portabilidade, observadas as condições legais e regulamentares;
• revogação do consentimento, quando o tratamento estiver baseado nessa hipótese;
• demais direitos previstos na legislação.

A extensão e o exercício desses direitos poderão estar sujeitos às limitações previstas na legislação.`,
  },
  {
    title: "Como exercer seus direitos",
    body: `Solicitações relacionadas a dados pessoais poderão ser encaminhadas para:

E-mail de privacidade: acompanhaai.app@gmail.com

Para proteger os dados dos titulares e evitar solicitações fraudulentas, poderão ser solicitadas informações razoavelmente necessárias para confirmação da identidade do solicitante.

Quando o AcompanhaAí atuar como operador de dados em determinada situação, a solicitação poderá ser direcionada ao controlador responsável pela respectiva operação.`,
  },
  {
    title: "Dados de menores",
    body: `O AcompanhaAí não é direcionado especificamente a crianças ou adolescentes.

Caso dados de menores sejam tratados dentro de uma operação realizada por uma empresa cliente, caberá ao responsável pela operação assegurar que o tratamento esteja fundamentado na legislação aplicável e que sejam observadas as proteções específicas previstas para esses titulares.`,
  },
  {
    title: "Serviços e infraestrutura de terceiros",
    body: `Para fornecer seus serviços, o AcompanhaAí poderá utilizar fornecedores tecnológicos localizados no Brasil ou no exterior.

Esses fornecedores poderão prestar serviços relacionados a hospedagem, armazenamento, autenticação, comunicação, pagamentos, mapas, localização e outras infraestruturas necessárias à operação.

Quando houver transferência internacional de dados pessoais, serão observados os requisitos previstos na legislação aplicável.`,
  },
  {
    title: "Alterações desta Política",
    body: `Esta Política de Privacidade poderá ser atualizada periodicamente para refletir alterações na plataforma, nos serviços, na legislação ou nas práticas de tratamento de dados.

A versão vigente estará sempre disponível na plataforma, acompanhada da respectiva data de atualização.

Quando necessário, alterações relevantes poderão ser comunicadas por meios adequados.`,
  },
  {
    title: "Contato",
    body: `Para dúvidas, solicitações ou assuntos relacionados à privacidade e proteção de dados:

AcompanhaAí
E-mail: acompanhaai.app@gmail.com

Quando aplicável, informações adicionais sobre o responsável pelo tratamento ou sobre o encarregado de proteção de dados poderão ser disponibilizadas por meio deste canal ou em local apropriado da plataforma, conforme a legislação aplicável.`,
  },
];

function Privacidade() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 01 de setembro de 2026
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A presente Política de Privacidade explica como o{" "}
              <strong className="text-foreground">AcompanhaAí</strong> realiza o tratamento de dados
              pessoais no contexto de seus sites, sistemas, aplicações e serviços.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              O objetivo deste documento é apresentar de forma clara quais informações podem ser
              tratadas, para quais finalidades podem ser utilizadas, com quem podem ser
              compartilhadas e quais são os direitos dos titulares.
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
