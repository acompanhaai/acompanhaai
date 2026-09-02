import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/checkout/sucesso")({
  head: () => ({
    meta: [
      { title: "Pagamento em processamento — AcompanhaAí" },
      { name: "description", content: "Acompanhe a confirmação da sua assinatura AcompanhaAí." },
      { property: "og:title", content: "Pagamento em processamento — AcompanhaAí" },
      { property: "og:description", content: "A ativação do plano depende da confirmação do pagamento." },
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
          <Link to="/" className="interactive shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Logo /></Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section className="surface surface-elevated w-full max-w-lg p-8 text-center">
          <Clock3 className="mx-auto size-12 text-primary-strong" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-bold text-foreground">Pagamento em processamento</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            O checkout foi concluído no Paddle. Seu plano só será ativado depois que o pagamento for confirmado e o evento chegar ao AcompanhaAí.
          </p>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Você pode continuar usando a conta enquanto a confirmação é processada.
          </p>
          <Button asChild className="mt-7 w-full"><Link to="/dashboard">Voltar para a base operacional</Link></Button>
        </section>
      </main>
    </div>
  );
}
