import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/planos", label: "Planos" },
  { to: "/sobre", label: "Sobre" },
  { to: "/suporte", label: "Suporte" },
  { to: "/contato", label: "Falar com o time" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-4xl px-5">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 md:flex md:justify-between md:gap-6 md:py-0">
          <Link to="/" className="min-w-0">
            <Logo size={24} />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="whitespace-nowrap transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/auth" search={{ mode: "login" }}>
              Entrar
            </Link>
          </Button>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-3 text-sm text-muted-foreground md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
