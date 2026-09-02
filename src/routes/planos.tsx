import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  comparison,
  formatPrice,
  formatRequests,
  plans,
  requestDefinition,
} from "@/config/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e preços — AcompanhaAí" },
      {
        name: "description",
        content:
          "Comece grátis com 10 solicitações por mês e faça upgrade quando precisar de mais volume. Planos de R$ 0 a R$ 399 por mês.",
      },
      { property: "og:title", content: "Planos e preços — AcompanhaAí" },
      {
        property: "og:description",
        content: "Grátis para começar. Mais volume de solicitações, plano maior.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Planos,
});

const faq = [
  {
    q: "O plano Acompanha é realmente gratuito?",
    a: "Sim. O plano Acompanha custa R$ 0/mês e permite acompanhar até 10 solicitações por mês. Não é necessário cartão de crédito para começar.",
  },
  {
    q: "O que acontece quando eu atingir o limite?",
    a: "Ao atingir o limite mensal de solicitações, novos protocolos não poderão ser criados até o próximo ciclo ou até que você faça upgrade para um plano com maior capacidade. As solicitações que já estão em andamento continuam funcionando normalmente.",
  },
  {
    q: "Como funciona a contratação de um plano pago?",
    a: "Ao escolher um plano pago, você será direcionado para uma página segura de pagamento, onde poderá visualizar as opções de pagamento disponíveis e concluir a contratação.",
  },
  {
    q: "Posso fazer upgrade quando quiser?",
    a: "Sim. Você pode fazer upgrade para um plano superior quando precisar de mais solicitações ou recursos.",
  },
  {
    q: "Posso fazer downgrade?",
    a: "Sim, desde que o plano desejado esteja disponível para sua conta e respeitando as condições de cobrança aplicáveis.",
  },
  { q: "O que é uma solicitação?", a: requestDefinition },
];

function Planos() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-16">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Planos simples. Para cada tamanho de operação.
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Comece grátis e faça upgrade quando precisar de mais solicitações.
          </p>
        </header>

        <section className="mt-10 rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="font-semibold text-foreground">10</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-foreground">100</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-foreground">500</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-foreground">2.000</span>
            <span className="text-muted-foreground">solicitações/mês</span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            O principal limite de cada plano é a quantidade de solicitações por mês.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{requestDefinition}</p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border border-border p-5",
                plan.highlight && "border-primary/50 ring-1 ring-primary/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {plan.name}
                </h2>
                {plan.highlight ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-strong">
                    Mais popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">
                {formatPrice(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>

              <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-4 text-sm font-medium text-foreground">
                {formatRequests(plan.requests)} solicitações por mês
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary-strong" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-2">
                <Button
                  asChild
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {plan.price > 0 ? (
                    <Link to="/checkout" search={{ plan: plan.id }}>
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link to="/auth" search={{ mode: "signup" }}>
                      {plan.cta}
                    </Link>
                  )}
                </Button>
                {plan.note ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">{plan.note}</p>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-lg font-semibold text-foreground">Compare os planos</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Recurso</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="py-2 px-3 font-semibold text-foreground">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-border">
                    <td className="py-2.5 pr-4 text-muted-foreground">{row.label}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className="py-2.5 px-3 text-foreground">
                        {typeof value === "string" ? (
                          value
                        ) : value ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Check className="size-4 text-primary-strong" aria-hidden="true" />
                            Incluído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Minus className="size-4" aria-hidden="true" />
                            Não incluído
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 max-w-2xl">
          <h2 className="text-lg font-semibold text-foreground">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-2">
            {faq.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold text-foreground">Comece a usar o AcompanhaAí.</h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Crie sua conta gratuitamente e descubra uma forma mais simples de acompanhar sua
            operação. Mais controle para a operação. Mais transparência para quem espera.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>
              Começar grátis
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
