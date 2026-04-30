import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { to: "/", label: "Cadastro" },
  { to: "/leitor", label: "Leitor" },
  { to: "/analise", label: "Análise" },
  { to: "/historico", label: "Histórico" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              CA
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold">Colégio Antônio Costa</div>
              <div className="text-xs text-muted-foreground">Sistema de Gestão Escolar</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {ITEMS.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "rounded-md px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground" }}
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
