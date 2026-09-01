import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o AcompanhaAí — plataforma de acompanhamento de serviços" },
      {
        name: "description",
        content:
          "Conheça o AcompanhaAí: plataforma que centraliza o acompanhamento de solicitações e serviços entre empresas, operações, prestadores e clientes.",
      },
      { property: "og:title", content: "Sobre o AcompanhaAí" },
      {
        property: "og:description",
        content: "Por que criamos o AcompanhaAí e como centralizamos o acompanhamento de serviços.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sobre,
});

const sections = [
  {
    title: "O problema",
    body: "Muitas operações ainda dependem de ligações, mensagens em vários canais e informações descentralizadas para saber o andamento de um serviço. O resultado é retrabalho para a equipe e falta de previsibilidade para quem está esperando.",
  },
  {
    title: "Nossa solução",
    body: "O AcompanhaAí centraliza o acompanhamento em um único lugar: a operação registra e acompanha as solicitações, o prestador atualiza o andamento e o cliente consulta a situação sem precisar ligar. A comunicação fica no mesmo fluxo do atendimento.",
  },
  {
    title: "Nossa visão",
    body: "Queremos tornar o acompanhamento de serviços mais simples, transparente e automatizado, para que cada pessoa envolvida tenha a informação certa no momento certo, sem esforço manual.",
  },
];

function Sobre() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Sobre o AcompanhaAí</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          O AcompanhaAí é uma plataforma criada para facilitar o acompanhamento de solicitações e
          serviços, conectando empresas, operações, prestadores e clientes em uma experiência mais
          transparente.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <Button asChild className="mt-12">
          <Link to="/contato">Falar com o time</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
