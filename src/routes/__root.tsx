import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-7xl font-bold">404</h1>
          <p className="mt-2 text-muted-foreground">Página não encontrada</p>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Colégio Antônio Costa — Gestão Escolar" },
      { name: "description", content: "Sistema de cadastro, presença e análise do Colégio Antônio Costa." },
      { property: "og:title", content: "Colégio Antônio Costa — Gestão Escolar" },
      { name: "twitter:title", content: "Colégio Antônio Costa — Gestão Escolar" },
      { property: "og:description", content: "Sistema de cadastro, presença e análise do Colégio Antônio Costa." },
      { name: "twitter:description", content: "Sistema de cadastro, presença e análise do Colégio Antônio Costa." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e5fbd7df-a5ba-48a0-b603-95ced3527327/id-preview-c8abadf3--b18c7bbe-6939-497e-9d0c-4cce5fac1ee5.lovable.app-1777682913259.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e5fbd7df-a5ba-48a0-b603-95ced3527327/id-preview-c8abadf3--b18c7bbe-6939-497e-9d0c-4cce5fac1ee5.lovable.app-1777682913259.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
      <Toaster richColors position="top-right" />
    </AppShell>
  );
}
