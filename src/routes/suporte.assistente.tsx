import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SupportChat } from "@/components/SupportChat";

export const Route = createFileRoute("/suporte/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente de Suporte — AcompanhaAí" },
      {
        name: "description",
        content:
          "Converse com o assistente do AcompanhaAí e tire dúvidas sobre protocolos, motoristas, rastreamento e planos.",
      },
      { property: "og:title", content: "Assistente de Suporte — AcompanhaAí" },
      {
        property: "og:description",
        content: "Atendimento por IA do AcompanhaAí, disponível a qualquer hora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assistente,
});

function Assistente() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-12">
        <Link
          to="/suporte"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Central de Suporte
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-foreground">Assistente AcompanhaAí</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Respostas rápidas e diretas sobre a plataforma, sua conta, protocolos e planos.
        </p>

        <div className="mt-8">
          <SupportChat />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
