
## Phase 1 — Analysis of the original repo

### File map and responsibility

```text
README.md                         empty placeholder
index.html                        Students CRUD page (Cadastro)
registar.html                     QR landing page — marks attendance via ?id=
leitor.html                       Camera scanner — reads QR, registers presence
analise.html                      Analytics dashboard (Chart.js)
historico.html                    Daily/shift history with PDF export (jsPDF)

assets/css/style.css              Single 38 KB stylesheet for all pages
assets/images/logo.png            School logo
assets/js/config.js               Supabase init, ENV, TURNOS table, Time helpers — global `db`
assets/js/main.js                 Cadastro page logic (despite its generic name)
assets/js/notifications.js        Toast IIFE exposing global `Notif`
assets/js/modules/leitor.js       Scanner page logic + late-arrival rules
assets/js/modules/scanner-visual.js  Camera/QR overlay rendering, torch, zoom
assets/js/modules/analise.js      Analytics charts + per-student frequency table
assets/js/modules/historico.js    History list, modal, PDF generation
(referenced but missing) assets/js/modules/cadastro.js  index.html includes it; file does not exist
```

### Data flow

```text
[User] -> HTML page -> page-specific module.js
                          |
                          v
                 window.db (Supabase JS, global)
                          |
                          v
                tables:  alunos, presencas
                          |
                          v
            module re-renders DOM via innerHTML
            shows toast via global Notif
```

Domain model (inferred from queries):

- `alunos { id, nome, idade, turma, turno, qr }`
- `presencas { id, aluno_id, nome, turma, turno, status, horario_chegada }`

Shifts (`turnos`) and late-arrival cutoffs are hard-coded:
Manhã 06:45–13:00 (late > 07:45), Tarde 13:00–18:00 (late > 13:15), Noite 19:00–24:00 (late > 19:15).

### Frontend ↔ backend interaction

- No backend code. The browser talks to Supabase directly with the anon key embedded in `config.js` (committed to the repo).
- Every module re-imports `@supabase/supabase-js` from CDN and reuses the same global `db`.

### State management

- Each page owns a private `state` object (some IIFE-scoped, some global like `_cadastroState`).
- No shared store, no observers — re-renders are imperative `innerHTML` rewrites after each mutation.

### Structural issues found

1. Anon key + project URL committed in plain JS — needs RLS to be safe; not a secret leak by itself but should move to env.
2. `main.js` only contains Cadastro logic but is loaded on every page (analise, historico, leitor) where it does nothing useful.
3. `index.html` imports `modules/cadastro.js` which does not exist — silent 404.
4. `config.js` exposes globals (`db`, `ENV`, `TURNOS`, `Time`, `turnoAtual`, `intervaloPorTurno`, `minutosDoDia`) plus `Notif` from notifications.js — namespace pollution and load-order coupling.
5. Mixed responsibilities inside each module (data access + DOM + business rules + formatting all in one file).
6. Two different `state` constants in `analise.js` and `historico.js` — solved by IIFEs but fragile.
7. Late-arrival cutoffs duplicated between `config.js` (TURNOS) and `leitor.js` (`LIMITES_ATRASO`).
8. `_gerarQR` in main.js mounts a DOM node and reads its canvas — UI work bleeding into a save flow.
9. Time/shift helpers exist as both `Time.*` methods and bare `turnoAtual()` aliases for back-compat.
10. No routing layer; navigation is plain anchor links between `.html` files; no shared header.
11. Inconsistent naming: Portuguese identifiers, leading underscores for "private", camelCase mixed with snake_case (DB columns), file names mixing `analise.js` / `scanner-visual.js`.
12. No build step, no types, no linter, no error boundary — runtime errors silently break pages.

## Phase 2 — New architecture

Target stack: **TanStack Start (React 19 + TypeScript + Vite)** — the framework this Lovable project ships with. Backend stays on the original Supabase project (its URL + anon key reused). Routing is file-based; data access is centralized in a service layer.

### Folder structure

```text
src/
  routes/
    __root.tsx              Layout: HeadContent, Scripts, AppShell
    index.tsx               /          Cadastro (students CRUD)
    leitor.tsx              /leitor    Camera scanner
    registar.tsx            /registar  QR landing (?id=)
    analise.tsx             /analise   Analytics dashboard
    historico.tsx           /historico History + PDF
  components/
    layout/
      AppShell.tsx          Header + nav + main outlet
      NavLink.tsx
    cadastro/
      AlunoForm.tsx
      AlunosTable.tsx
    leitor/
      ScannerView.tsx       Wraps html5-qrcode
      ChegadasTable.tsx
      ShiftBanner.tsx
    analise/
      KpiCards.tsx
      ChartsGrid.tsx        Chart.js wrappers (presencas, turnos, etc.)
      FrequenciaTable.tsx
    historico/
      HistoricoList.tsx
      HistoricoModal.tsx
    ui/                     Existing shadcn components (kept)
  services/
    supabase/
      client.ts             Single createClient() — browser-only
    alunos.service.ts       CRUD on alunos
    presencas.service.ts    Insert + queries by date/shift
    qr.service.ts           Generates QR data-URL (qrcode npm)
    pdf.service.ts          jsPDF builders for daily/shift PDFs
  domain/
    types.ts                Aluno, Presenca, Turno, Status
    turnos.ts               TURNOS table + late cutoffs (single source of truth)
    time.ts                 nowMinutes, getTurnoAtual, intervalo
    status.ts               calcularStatus(turno) -> "presente" | "atrasado"
  hooks/
    useAlunos.ts            Load + mutate students
    usePresencasHoje.ts     Today's attendance for the active shift
    useScanner.ts           html5-qrcode lifecycle, debouncing
    useAnalytics.ts         Aggregations memoized
  lib/
    notify.ts               Wrapper over sonner (replaces Notif IIFE)
    format.ts               Dates, names, escaping
  styles.css                Tailwind v4 design tokens (existing)
```

### Module responsibilities

- **routes/**: page composition only — fetch via hooks, render components, no Supabase calls.
- **components/**: pure presentation + local UI state.
- **services/**: the only place that imports the Supabase client; returns typed domain objects.
- **domain/**: framework-free pure functions and constants (turnos, time, status, types).
- **hooks/**: bridge services to React state; expose `data / loading / error / actions`.
- **lib/**: cross-cutting helpers (toast, formatting).

### Naming conventions

- Files: `kebab-case.tsx` for routes, `PascalCase.tsx` for components, `camelCase.ts` for services/hooks/lib.
- Identifiers and DB columns stay in the original Portuguese (`aluno`, `presenca`, `turno`) to match Supabase schema; React APIs and helpers in English.
- No leading-underscore "private" markers — module scope handles encapsulation.
- One default export per component; named exports for services and hooks.

### State strategy

- Local component state via `useState` / `useReducer` for forms and UI.
- Server data via lightweight custom hooks wrapping services (no global store). If complexity grows, swap a single hook for TanStack Query without touching components.
- No globals on `window`. Supabase client is a singleton inside `services/supabase/client.ts`.

### Data flow

```text
Route component
   └─ hook (useAlunos, usePresencasHoje, ...)
        └─ service (alunos.service, presencas.service)
             └─ supabase client (services/supabase/client.ts)
                  └─ Supabase REST (RLS enforced)
```

Mutations call a service, the hook revalidates, components re-render from new state. Toasts are fired from the hook layer so UI stays declarative.

### Backend

- Reuse the original Supabase project URL + anon key (stored in `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`). You'll paste them once after approval.
- No edge functions needed — current behavior is pure CRUD against `alunos` and `presencas`.
- Existing RLS policies on the original project are preserved.

### Third-party libraries

- `@supabase/supabase-js` (already needed)
- `html5-qrcode` (matches `leitor.html`)
- `qrcode` (replaces the old global `QRCode` constructor used in `_gerarQR`)
- `chart.js` + `react-chartjs-2` (matches `analise.html`)
- `jspdf` + `jspdf-autotable` (matches `historico.html` PDF export)
- `sonner` (already in template) replaces the custom toast IIFE

## Phase 3 — Rebuild scope

After approval, I will:

1. Add the dependencies above.
2. Create `src/services/supabase/client.ts` and the typed services (`alunos`, `presencas`, `qr`, `pdf`).
3. Create `src/domain/` (turnos, time, status, types) — single source of truth for shift cutoffs.
4. Build hooks (`useAlunos`, `usePresencasHoje`, `useScanner`, `useAnalytics`).
5. Build the five route files and their components, porting all behaviors from the original modules:
   - Cadastro: form (with uppercase name, validation, edit, delete, delete-all), search, table with QR thumbnail, today's-presence counter, PDF report.
   - Leitor: shift banner, live clock, html5-qrcode scanner, late detection, presence insert with dedupe per shift, recent arrivals table, CSV export.
   - Registar: reads `?id=`, looks up aluno, inserts presenca, shows result card.
   - Analise: date/shift filters, four Chart.js charts, per-student frequency table with sorting/search.
   - Historico: list grouped by day+shift, modal with rows, jsPDF export per shift.
6. Replace the custom toast with `sonner`-backed `lib/notify.ts`.
7. Add a shared `AppShell` with the school logo, navigation, and SEO `head()` per route.
8. Add `errorComponent` + `notFoundComponent` per route loader, per project conventions.
9. Drop `main.js`-style cross-page coupling and the missing `cadastro.js` reference.

Out of scope unless you ask: authentication, role management, schema migrations, PWA/manifest, mobile app shell.
