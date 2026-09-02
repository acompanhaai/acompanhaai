import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, CheckCircle2, CreditCard, ExternalLink, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountPlan } from "@/lib/plan.functions";
import { formatPeriodDate, usagePercent } from "@/lib/plan";
import { createCustomerPortalSession } from "@/lib/billing.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({
    meta: [
      { title: "Plano e assinatura — AcompanhaAí" },
      { name: "description", content: "Consulte o plano, o uso mensal e gerencie sua assinatura AcompanhaAí." },
      { property: "og:title", content: "Plano e assinatura — AcompanhaAí" },
      { property: "og:description", content: "Plano, consumo e gerenciamento da assinatura da sua operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const accountPlanFn = useServerFn(getAccountPlan);
  const portalFn = useServerFn(createCustomerPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const environment = getPaddleEnvironment();
  const planQuery = useQuery({
    queryKey: ["account-plan", environment],
    queryFn: () => accountPlanFn(),
  });

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { url } = await portalFn({ data: { environment } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Não foi possível abrir o gerenciamento", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  const usage = planQuery.data;
  const isPaid = Boolean(usage && usage.price > 0);
  const statusLabel = usage?.status === "past_due"
    ? "Pagamento pendente"
    : usage?.status === "paused"
      ? "Pausado"
      : usage?.status === "canceled"
        ? "Cancelamento agendado"
        : usage?.price
          ? "Ativo"
          : "Gratuito";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 py-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/dashboard"><ArrowLeft className="size-4" />Voltar para a base</Link>
          </Button>
          <span className="text-sm font-semibold text-foreground">Plano e assinatura</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary-strong">Sua conta</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Plano e assinatura</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe seu consumo e gerencie a cobrança da operação.</p>
        </div>

        {planQuery.isLoading ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : planQuery.isError || !usage ? (
          <div className="surface mt-8 p-6">
            <p className="font-medium text-foreground">Não foi possível carregar o plano.</p>
            <p className="mt-1 text-sm text-muted-foreground">Atualize a página ou tente novamente em instantes.</p>
            <Button className="mt-5" onClick={() => void planQuery.refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CreditCard className="size-4 text-primary" /> Plano atual
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-foreground">{usage.planName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {usage.price === 0 ? "Sem cobrança mensal" : `R$ ${usage.price.toLocaleString("pt-BR")}/mês`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-strong">
                  <CheckCircle2 className="size-3.5" /> {statusLabel}
                </span>
              </div>

              <div className="mt-7 border-t border-border pt-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Solicitações no período</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{usage.used} <span className="text-sm font-medium text-muted-foreground">/ {usage.limit}</span></p>
                  </div>
                  <span className="text-sm text-muted-foreground">{usagePercent(usage)}% usado</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" aria-label={`${usagePercent(usage)}% do limite utilizado`}>
                  <div className="usage-progress h-full rounded-full" data-level={usagePercent(usage) >= 100 ? "full" : usagePercent(usage) >= 90 ? "warn90" : usagePercent(usage) >= 80 ? "warn80" : usagePercent(usage) >= 70 ? "warn70" : "ok"} style={{ width: `${usagePercent(usage)}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{usage.remaining} solicitações restantes neste ciclo.</p>
              </div>
            </section>

            <aside className="surface p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ReceiptText className="size-4 text-primary" /> Detalhes da cobrança
              </p>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd className="text-right font-medium text-foreground">{statusLabel}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Próxima renovação</dt><dd className="flex items-center gap-1 text-right font-medium text-foreground"><CalendarDays className="size-3.5" />{formatPeriodDate(usage.periodEnd)}</dd></div>
              </dl>
              {usage.status === "past_due" ? <p className="mt-5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Não conseguimos confirmar o último pagamento. Seu plano permanece inalterado até a regularização.</p> : null}
              {usage.status === "canceled" ? <p className="mt-5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Seu plano será cancelado ao final do período atual.</p> : null}
              {isPaid ? (
                <Button className="mt-6 w-full" onClick={openPortal} disabled={portalLoading} loading={portalLoading}>
                  {portalLoading ? "Abrindo gerenciamento..." : "Gerenciar assinatura"}
                  {!portalLoading ? <ExternalLink className="size-4" /> : null}
                </Button>
              ) : (
                <Button asChild className="mt-6 w-full"><Link to="/planos">Conhecer planos pagos</Link></Button>
              )}
              <p className="mt-3 text-center text-xs text-muted-foreground">O gerenciamento é feito pelo portal oficial de pagamentos.</p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
