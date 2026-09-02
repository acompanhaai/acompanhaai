import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, CreditCard, Lock, QrCode, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatRequests, planById, plans, type PlanId } from "@/config/plans";
import { supabase } from "@/integrations/supabase/client";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

const searchSchema = z.object({
  plan: z.enum(["free", "start", "growth", "scale"]).optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Checkout do plano — AcompanhaAí" },
      {
        name: "description",
        content:
          "Revise o plano escolhido, o valor mensal e as solicitações incluídas para ativar sua assinatura AcompanhaAí.",
      },
      { property: "og:title", content: "Checkout do plano — AcompanhaAí" },
      {
        property: "og:description",
        content: "Contratação self-service dos planos do AcompanhaAí.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const PRICE_BY_PLAN: Partial<Record<PlanId, string>> = {
  start: "acompanha_plus_monthly",
  growth: "acompanha_pro_monthly",
  scale: "acompanha_max_monthly",
};

function CheckoutPage() {
  const { plan: planParam } = Route.useSearch();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const [user, setUser] = useState<{ id: string; email?: string | undefined } | null>(null);
  const [started, setStarted] = useState(false);

  const plan = planParam ? planById(planParam) : null;
  const priceId = plan ? PRICE_BY_PLAN[plan.id] : undefined;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  async function start() {
    if (!priceId || !user) return;
    setStarted(true);
    try {
      await openCheckout({
        priceId,
        customerEmail: user.email,
        customData: { userId: user.id },
        frameTarget: "checkout-container",
        successUrl: `${window.location.origin}/checkout/sucesso`,
      });
    } catch {
      setStarted(false);
    }
  }

  if (!plan || !priceId) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <CheckoutHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
          <h1 className="text-2xl font-bold text-foreground">Escolha um plano</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione um dos planos pagos para continuar com a contratação.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {plans
              .filter((p) => p.price > 0)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate({ to: "/checkout", search: { plan: p.id } })}
                  className="rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50"
                >
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {formatPrice(p.price)}
                    <span className="text-xs font-normal text-muted-foreground">/mês</span>
                  </p>
                </button>
              ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CheckoutHeader />
      <PaymentTestModeBanner />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/planos">
            <ArrowLeft className="size-4" />
            Voltar e escolher outro plano
          </Link>
        </Button>

        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          Finalizar assinatura
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Contratação imediata, sem precisar falar com ninguém. Cancele quando quiser.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="surface p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pagamento
            </h2>
            {!started ? (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    <CreditCard className="size-3.5" aria-hidden="true" /> Cartão de crédito
                    (assinatura recorrente)
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    <QrCode className="size-3.5" aria-hidden="true" /> Pix, quando disponível
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  As formas de pagamento disponíveis para a sua conta aparecem no formulário
                  seguro abaixo.
                </p>
                <Button className="mt-5 w-full" onClick={start} disabled={loading || !user}>
                  {loading ? "Abrindo pagamento..." : "Ir para o pagamento"}
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <div id="checkout-container" />
                <Skeleton className="mt-4 h-2 w-24" />
              </div>
            )}

            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden="true" />
              Pagamento processado em ambiente seguro. A cobrança aparece com a marca
              AcompanhaAí.
            </p>
          </section>

          <aside className="surface h-fit p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Resumo do plano
            </h2>
            <p className="mt-3 text-lg font-bold text-foreground">{plan.name}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {formatPrice(plan.price)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {formatRequests(plan.requests)} solicitações por mês
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary-strong" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Assinatura mensal renovada automaticamente. Você pode cancelar quando quiser.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function CheckoutHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-5">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
