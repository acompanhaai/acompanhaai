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
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-5">
        <Link to="/">
          <Logo size={24} />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
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
        <Button asChild size="sm">
          <Link to="/auth" search={{ mode: "login" }}>
            Entrar
          </Link>
        </Button>
      </div>
    </header>
  );
}
