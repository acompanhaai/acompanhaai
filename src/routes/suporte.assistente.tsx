import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

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
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to="/suporte"
          aria-label="Voltar para a Central de Suporte"
          className="nav-link inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
        <h1 className="text-sm font-semibold text-foreground">Atendimento AcompanhaAí</h1>
      </header>

      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col p-3 sm:p-4">
        <SupportChat />
      </main>
    </div>
  );
}
