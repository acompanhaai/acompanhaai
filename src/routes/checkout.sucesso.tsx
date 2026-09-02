import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/checkout/sucesso")({
  head: () => ({
    meta: [
      { title: "Assinatura recebida — AcompanhaAí" },
      {
        name: "description",
        content: "A confirmação da assinatura AcompanhaAí foi recebida.",
      },
      { property: "og:title", content: "Assinatura recebida — AcompanhaAí" },
      {
        property: "og:description",
        content: "Acompanhe a ativação do seu plano AcompanhaAí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-5">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section className="surface w-full max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-primary-strong" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold text-foreground">Pagamento recebido</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Obrigado por assinar o AcompanhaAí. Sua confirmação foi recebida e o plano será
            disponibilizado automaticamente assim que o pagamento for confirmado.
          </p>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            A atualização pode levar alguns instantes.
          </p>
          <Button asChild className="mt-7 w-full">
            <Link to="/dashboard">Ir para a base operacional</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
