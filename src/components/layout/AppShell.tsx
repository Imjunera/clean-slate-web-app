import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";

interface NavItem {
  to: string;
  label: string;
}

// MANDATORY order: Cadastro, Leitor, Histórico, Análise.
const ITEMS: NavItem[] = [
  { to: "/", label: "Cadastro" },
  { to: "/leitor", label: "Leitor" },
  { to: "/historico", label: "Histórico" },
  { to: "/analise", label: "Análise" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Colégio Estadual Desembargador Antônio F. F. da Costa"
              className="h-12 w-12 shrink-0 object-contain md:h-14 md:w-14"
              width={56}
              height={56}
            />
            <div className="leading-tight">
              <div className="text-sm font-bold text-primary">
                Colégio Estadual Antônio F. F. da Costa
              </div>
              <div className="text-xs text-muted-foreground">
                Sistema de Gestão Escolar — Icaraíma/PR
              </div>
            </div>
          </Link>
          <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
            {ITEMS.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                activeProps={{
                  className:
                    "rounded-md px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary",
                }}
                activeOptions={{ exact: it.to === "/" }}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
