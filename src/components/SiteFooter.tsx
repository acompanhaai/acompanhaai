import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

const columns = [
  {
    title: "Empresa",
    links: [
      { to: "/sobre", label: "Sobre" },
      { to: "/planos", label: "Planos" },
      { to: "/contato", label: "Contato" },
    ],
  },
  {
    title: "Suporte",
    links: [{ to: "/suporte", label: "Central de Suporte" }],
  },
  {
    title: "Termos",
    links: [
      { to: "/termos", label: "Termos de Uso" },
      { to: "/privacidade", label: "Política de Privacidade" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-4xl px-5 py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Logo size={24} />
            <p className="mt-3 text-sm text-muted-foreground">
              Acompanhamento de solicitações e serviços em um só lugar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="nav-link transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © 2026 AcompanhaAí.
          <br />
          <br />
          Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
