import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Building2,
  Gauge,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { resolveHomePath } from "@/lib/session";
import { formatPrice, formatRequests, plans } from "@/config/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AcompanhaAí — acompanhamento de assistência 24h em tempo real" },
      {
        name: "description",
        content:
          "Base operacional, área do motorista e acompanhamento público de protocolos de assistência 24h em tempo real.",
      },
      { property: "og:title", content: "AcompanhaAí — assistência 24h em tempo real" },
      {
        property: "og:description",
        content: "Protocolos, motoristas e rastreamento ao vivo em um só lugar.",
      },
    ],
  }),
  component: Home,
});

const cards = [
  {
    to: "/auth",
    icon: Building2,
    title: "Base Operacional",
    description: "Gerencie protocolos, motoristas e indicadores da operação em um só lugar.",
  },
  {
    to: "/motorista",
    icon: Truck,
    title: "Área do Motorista",
    description: "Aceite chamados, acompanhe atendimentos e conclua serviços em poucos toques.",
  },
  {
    to: "/acompanhar",
    icon: MapPin,
    title: "Acompanhar Protocolo",
    description:
      "Acompanhe o guincho em tempo real, veja os dados do motorista e consulte o tempo estimado de chegada.",
  },
] as const;

const highlights = [
  {
    icon: Gauge,
    title: "Tempo real de verdade",
    description: "Status e posição atualizam sozinhos — sem recarregar a página.",
  },
  {
    icon: Smartphone,
    title: "Sem app para o segurado",
    description: "Acompanhamento público direto no navegador, por protocolo ou CPF.",
  },
  {
    icon: ShieldCheck,
    title: "Dados isolados por empresa",
    description: "Cada operação vê só os seus protocolos, motoristas e clientes.",
  },
  {
    icon: MessageSquareText,
    title: "Chat integrado",
    description: "Base e motorista conversam sem sair do atendimento.",
  },
] as const;

const faqs = [
  {
    question: "Preciso instalar algo para acompanhar o guincho?",
    answer:
      "Não. O segurado abre a página de acompanhamento pelo navegador, informa o número do protocolo ou o CPF, e acompanha o status e a posição do motorista em tempo real.",
  },
  {
    question: "Como a base operacional cria uma conta?",
    answer:
      "No cadastro, informe CNPJ ou CPF e a razão social. Se já existir uma conta com o mesmo documento, o formulário sugere reaproveitá-la em vez de criar uma empresa duplicada.",
  },
  {
    question: "Como os motoristas entram na operação?",
    answer:
      "A base operacional cadastra o motorista (RE, nome, CPF, veículo). O motorista acessa o app dele e a operação atualiza automaticamente conforme ele aceita, se desloca e finaliza o atendimento.",
  },
  {
    question: "Dá para trocar de plano depois?",
    answer:
      "Sim. Upgrade, downgrade e cancelamento ficam disponíveis a qualquer momento na área de plano e assinatura, sem precisar falar com o suporte.",
  },
] as const;

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    resolveHomePath().then((path) => {
      if (path) navigate({ to: path, replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Logo className="min-w-0" />
          <nav className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link to="/planos">Planos</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "login" }}>
                Entrar
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="grid-fade border-b border-border">
          <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center sm:py-28">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-strong">
                Assistência 24h em tempo real
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Chega de perguntar
                <br />
                onde está o guincho.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Protocolo, motorista, mapa e status — atualizados automaticamente para a base, para
                o motorista e para o segurado.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Começar grátis
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/acompanhar">Acompanhar meu atendimento</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-16 md:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90} className="flex">
              <Link
                to={card.to}
                className="surface elevate group flex w-full flex-col gap-4 p-6 active:translate-y-0"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary-strong transition-transform duration-200 group-hover:scale-105">
                  <card.icon className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{card.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{card.description}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary-strong">
                  Acessar
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item, i) => (
              <Reveal key={item.title} delay={i * 70}>
                <div className="flex flex-col gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary-strong">
                    <item.icon className="size-4.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Um plano para cada tamanho de operação
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Comece grátis e evolua conforme o volume de atendimentos crescer.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 70} className="flex">
                <div
                  className={
                    plan.highlight
                      ? "surface surface-elevated relative flex w-full flex-col gap-4 border-primary/40 p-6 ring-1 ring-primary/30"
                      : "surface flex w-full flex-col gap-4 p-6"
                  }
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                      Mais popular
                    </span>
                  ) : null}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRequests(plan.requests)} solicitações/mês
                  </p>
                  <Button
                    asChild
                    className="mt-auto"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link to="/auth" search={{ mode: "signup", plan: plan.id }}>
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 text-center">
            <Link
              to="/planos"
              className="nav-link inline-flex items-center gap-1 text-sm font-medium text-primary-strong"
            >
              Ver comparativo completo de planos
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-3xl px-5 py-20">
            <Reveal className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Perguntas frequentes
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <Accordion type="single" collapsible className="mt-8">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="text-left text-base font-medium text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
