import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SupportChat } from "@/components/SupportChat";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Central de Suporte — AcompanhaAí" },
      {
        name: "description",
        content: "Tire suas dúvidas sobre o AcompanhaAí com nosso assistente de suporte por IA.",
      },
      { property: "og:title", content: "Central de Suporte — AcompanhaAí" },
      {
        property: "og:description",
        content: "Suporte por IA para ajudar você a usar o AcompanhaAí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Suporte,
});

function Suporte() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Central de Suporte</h1>
        <p className="mt-4 text-base text-muted-foreground">
          Converse com nosso assistente de IA e encontre respostas sobre o AcompanhaAí.
        </p>
        <div className="mt-8">
          <SupportChat />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
