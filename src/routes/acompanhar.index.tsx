import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/acompanhar/")({
  head: () => ({
    meta: [
      { title: "Acompanhar protocolo — AcompanhaAí" },
      {
        name: "description",
        content:
          "Informe o número do protocolo ou o CPF e acompanhe o guincho em tempo real no mapa.",
      },
      { property: "og:title", content: "Acompanhar protocolo — AcompanhaAí" },
      {
        property: "og:description",
        content: "Veja o status, o motorista e a posição do guincho em tempo real.",
      },
    ],
  }),
  component: Acompanhar,
});

function Acompanhar() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
          <Link to="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Acompanhar protocolo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe o número do protocolo (ex.: AC-2608-01001) ou o CPF do segurado.
          </p>
          <form
            className="surface mt-6 flex gap-2 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              const q = value.trim();
              if (q.length < 3) return;
              navigate({ to: "/acompanhar/$query", params: { query: q } });
            }}
          >
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Protocolo ou CPF"
              className="border-0 shadow-none focus-visible:ring-0"
              maxLength={40}
            />
            <Button type="submit" disabled={value.trim().length < 3}>
              <Search className="size-4" />
              Buscar
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
