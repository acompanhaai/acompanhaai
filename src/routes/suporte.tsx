import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, MessageCircle } from "lucide-react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SupportChat } from "@/components/SupportChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ARTICLES = [
  {
    id: "criar-conta",
    title: "Como criar minha conta",
    summary: "Cadastre sua operação com CNPJ ou CPF, razão social e dados do responsável.",
    steps: [
      "Acesse a página de cadastro e escolha Criar conta.",
      "Preencha CNPJ ou CPF da empresa e a razão social.",
      "Informe o nome e e-mail do responsável pela operação.",
      "Confirme seu e-mail e comece a usar o painel.",
    ],
  },
  {
    id: "adicionar-motorista",
    title: "Como adicionar um motorista",
    summary: "Motoristas são cadastrados pela base operacional e acessam a área exclusiva deles.",
    steps: [
      "No painel, vá até a seção Motoristas.",
      "Clique em Adicionar motorista.",
      "Preencha nome, e-mail e telefone.",
      "O motorista receberá os dados de acesso e poderá entrar na área do motorista.",
    ],
  },
  {
    id: "criar-protocolo",
    title: "Como criar um protocolo de atendimento",
    summary: "Registre a solicitação do segurado e acompanhe cada etapa em tempo real.",
    steps: [
      "Na base operacional, clique em Novo protocolo.",
      "Informe os dados do segurado e do veículo.",
      "Vincule o motorista disponível mais próximo.",
      "Compartilhe o número do protocolo com o segurado.",
    ],
  },
  {
    id: "acompanhar-cliente",
    title: "Como meu cliente acompanha o serviço",
    summary: "O segurado acessa o acompanhamento público com o número do protocolo.",
    steps: [
      "Envie ao cliente o número do protocolo gerado.",
      "Ele acessa a página de Acompanhamento Público.",
      "Informando o protocolo, vê o status, mapa, motorista e tempo estimado.",
    ],
  },
  {
    id: "rastreamento",
    title: "Como funciona o rastreamento do motorista",
    summary: "A posição é enviada automaticamente enquanto o app do motorista está aberto.",
    steps: [
      "O motorista precisa estar logado na área do motorista.",
      "Com o app aberto, a localização atualiza a cada poucos segundos.",
      "A base e o segurado veem a posição em tempo real no mapa.",
    ],
  },
  {
    id: "planos",
    title: "Planos e limites de solicitações",
    summary: "Conheça os planos Free, Start, Growth e Scale e seus limites mensais.",
    steps: [
      "Free: 10 solicitações por mês para testar a plataforma.",
      "Start: 100 solicitações por mês.",
      "Growth: 500 solicitações por mês.",
      "Scale: 2.000 solicitações por mês.",
      "Você pode fazer upgrade a qualquer momento no painel.",
    ],
  },
  {
    id: "upgrade",
    title: "Como fazer upgrade do meu plano",
    summary: "Acesse as configurações da conta e escolha o plano ideal para sua operação.",
    steps: [
      "No painel, vá em Configurações > Plano.",
      "Selecione o plano desejado.",
      "Siga as instruções para ativar a assinatura.",
      "O novo limite é liberado assim que o pagamento é confirmado.",
    ],
  },
  {
    id: "senha",
    title: "Esqueci minha senha. O que faço?",
    summary: "Use a opção de recuperação de senha na tela de acesso.",
    steps: [
      "Na tela de login, clique em Esqueci minha senha.",
      "Informe o e-mail cadastrado.",
      "Siga o link enviado para seu e-mail.",
      "Crie uma nova senha e acesse novamente.",
    ],
  },
];

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Central de Suporte — AcompanhaAí" },
      {
        name: "description",
        content: "Encontre respostas rápidas sobre o AcompanhaAí. Se precisar, fale com nosso assistente de IA.",
      },
      { property: "og:title", content: "Central de Suporte — AcompanhaAí" },
      {
        property: "og:description",
        content: "Central de ajuda do AcompanhaAí com artigos e atendimento por IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Suporte,
});

function Suporte() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Central de Suporte</h1>
        <p className="mt-4 text-base text-muted-foreground">
          Encontre respostas rápidas sobre o AcompanhaAí. Se não encontrar o que precisa, nosso assistente está disponível.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Soluções mais buscadas</h2>
          <div className="grid gap-4">
            {ARTICLES.map((article) => {
              const isOpen = openId === article.id;
              return (
                <Card key={article.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : article.id)}
                      className="flex w-full items-center justify-between text-left"
                      aria-expanded={isOpen}
                    >
                      <CardTitle className="text-base font-medium">{article.title}</CardTitle>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>
                  </CardHeader>
                  {isOpen ? (
                    <CardContent className="px-4 pb-4 pt-0">
                      <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
                        {article.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </CardContent>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-border bg-muted/50 p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ainda precisa de ajuda?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nosso assistente de IA pode tirar dúvidas mais específicas sobre a plataforma.
              </p>
            </div>
            <Button
              type="button"
              variant={showChat ? "secondary" : "default"}
              onClick={() => setShowChat((value) => !value)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {showChat ? "Fechar conversa" : "Falar com o assistente"}
            </Button>
          </div>
          {showChat ? (
            <div className="mt-6">
              <SupportChat />
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
