import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { getAccountPlan } from "@/lib/plan.functions";
import { formatRequests } from "@/config/plans";

export const Route = createFileRoute("/checkout/sucesso")({
  head: () => ({
    meta: [
      { title: "Confirmação da assinatura — AcompanhaAí" },
      { name: "description", content: "Acompanhe a confirmação da sua assinatura AcompanhaAí." },
      { property: "og:title", content: "Confirmação da assinatura — AcompanhaAí" },
      { property: "og:description", content: "A ativação do plano depende da confirmação do pagamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const fetchPlan = useServerFn(getAccountPlan);
  const plan = useQuery({
    queryKey: ["account-plan"],
    queryFn: () => fetchPlan({}),
    refetchInterval: (query) =>
      query.state.data && query.state.data.planId !== "free" ? false : 4000,
  });

  const confirmed = !!plan.data && plan.data.planId !== "free";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-5">
          <Link to="/" className="interactive shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Logo /></Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section className="surface surface-elevated w-full max-w-lg p-8 text-center">
          {confirmed ? (
            <CheckCircle2 className="mx-auto size-12 text-primary-strong" aria-hidden="true" />
          ) : (
            <Clock3 className="mx-auto size-12 text-primary-strong" aria-hidden="true" />
          )}
          <h1 className="mt-5 text-2xl font-bold text-foreground">
            {confirmed ? "Plano ativado" : "Pagamento em processamento"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {confirmed && plan.data
              ? `Sua assinatura ${plan.data.planName} está ativa com ${formatRequests(plan.data.limit)} solicitações por mês.`
              : "O checkout foi concluído. Seu plano será ativado automaticamente assim que o pagamento for confirmado pelo provedor."}
          </p>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {confirmed
              ? "Confirmação validada pelo backend do AcompanhaAí."
              : "Você pode continuar usando a conta enquanto a confirmação é processada."}
          </p>
          <Button asChild className="mt-7 w-full"><Link to="/dashboard">Ir para a base operacional</Link></Button>
        </section>
      </main>
    </div>
  );
}
