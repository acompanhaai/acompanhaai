import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SupportChat } from "@/components/SupportChat";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Central de Suporte — AcompanhaAí" },
      {
        name: "description",
        content:
          "Encontre respostas sobre conta, uso da plataforma, acompanhamento e problemas técnicos do AcompanhaAí.",
      },
      { property: "og:title", content: "Central de Suporte — AcompanhaAí" },
      {
        property: "og:description",
        content: "Perguntas frequentes e contato com o suporte do AcompanhaAí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Suporte,
});

const faq = [
  {
    category: "Conta e acesso",
    items: [
      {
        q: "Como crio uma conta na plataforma?",
        a: "O cadastro é feito na tela de acesso, informando os dados da empresa e do responsável pela operação.",
      },
      {
        q: "Esqueci minha senha. O que faço?",
        a: "Na tela de acesso, use a opção de recuperação de senha para receber um e-mail com o link de redefinição.",
      },
      {
        q: "Como um motorista recebe acesso?",
        a: "O acesso do motorista é criado pela base operacional, que o cadastra na lista de motoristas.",
      },
    ],
  },
  {
    category: "Uso da plataforma",
    items: [
      {
        q: "Como registro uma nova solicitação?",
        a: "Na base operacional, abra um novo protocolo com os dados do atendimento e atribua um motorista.",
      },
      {
        q: "Posso alterar o status de um atendimento?",
        a: "Sim. O status é atualizado pela base operacional ou pelo motorista durante o atendimento.",
      },
    ],
  },
  {
    category: "Acompanhamento",
    items: [
      {
        q: "Como o cliente acompanha o serviço?",
        a: "Basta informar o número do protocolo na página de acompanhamento para ver o status e a posição do atendimento.",
      },
      {
        q: "Com que frequência a posição é atualizada?",
        a: "A posição é atualizada automaticamente enquanto o aplicativo do motorista está aberto durante o atendimento.",
      },
    ],
  },
  {
    category: "Problemas técnicos",
    items: [
      {
        q: "O mapa não está carregando. O que fazer?",
        a: "Verifique a conexão com a internet e atualize a página. Se o problema continuar, entre em contato com o suporte.",
      },
      {
        q: "A localização do motorista não atualiza.",
        a: "Confirme se a permissão de localização está ativada no dispositivo e se o aplicativo está aberto.",
      },
    ],
  },
];

function Suporte() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return faq;
    return faq
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term) ||
            group.category.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Central de Suporte</h1>
        <p className="mt-4 text-base text-muted-foreground">
          Encontre respostas para as dúvidas mais comuns ou entre em contato com o nosso suporte.
        </p>

        <Input
          className="mt-8"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 120))}
          placeholder="Buscar na central de suporte"
          aria-label="Buscar na central de suporte"
        />

        <div className="mt-10 space-y-8">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum resultado encontrado para a sua busca.
            </p>
          ) : (
            results.map((group) => (
              <section key={group.category}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {group.category}
                </h2>
                <Accordion type="single" collapsible className="mt-2">
                  {group.items.map((item) => (
                    <AccordionItem key={item.q} value={item.q}>
                      <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))
          )}
        </div>

        <div className="mt-12">
          <SupportChat />
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
