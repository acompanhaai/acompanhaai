import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Building2, MapPin, Truck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { resolveHomePath } from "@/lib/session";

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
    description: "Acompanhe o guincho em tempo real, veja os dados do motorista e consulte o tempo estimado de chegada.",
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
          <nav className="flex shrink-0 items-center gap-1">
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
          <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-strong">
                Assistência 24h em tempo real
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
                Chega de perguntar onde está o guincho!
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                Protocolo, motorista, mapa e status — atualizados automaticamente para a base, para o
                motorista e para o segurado :)
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-14 md:grid-cols-3">
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
      </main>


      <SiteFooter />
    </div>
  );
}
