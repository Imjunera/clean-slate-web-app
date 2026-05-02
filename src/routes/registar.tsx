import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { alunosService } from "@/services/alunos.service";
import { presencasService } from "@/services/presencas.service";
import { getTurnoAtual } from "@/domain/time";
import { calcularStatus } from "@/domain/status";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/registar")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Registrar Presença — Colégio Antônio Costa" },
      { name: "description", content: "Página de confirmação de presença via QR Code." },
    ],
  }),
  component: RegistarPage,
});

type State =
  | { kind: "loading" }
  | { kind: "no-id" }
  | { kind: "not-found" }
  | { kind: "no-shift" }
  | { kind: "duplicate"; nome: string }
  | { kind: "ok"; nome: string; status: "presente" | "atrasado" }
  | { kind: "error"; message: string };

function RegistarPage() {
  const { id } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) { setState({ kind: "no-id" }); return; }
      try {
        const aluno = await alunosService.getById(id);
        if (cancelled) return;
        if (!aluno) { setState({ kind: "not-found" }); return; }
        const turno = getTurnoAtual();
        if (!turno) { setState({ kind: "no-shift" }); return; }
        const exists = await presencasService.existsToday(aluno.id);
        if (cancelled) return;
        if (exists) { setState({ kind: "duplicate", nome: aluno.nome }); return; }
        const status = calcularStatus(turno.nome);
        const now = new Date();
        await presencasService.create({
          aluno_id: aluno.id,
          status,
          horario_chegada: now.toISOString(),
          data: now.toISOString().slice(0, 10),
        });
        if (!cancelled) setState({ kind: "ok", nome: aluno.nome, status });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: (e as Error).message });
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {state.kind === "loading" && <Message icon="⏳" title="Verificando presença" subtitle="Aguarde..." />}
          {state.kind === "no-id" && <Message icon="❓" title="QR inválido" subtitle="Nenhum identificador foi informado." />}
          {state.kind === "not-found" && <Message icon="✕" title="Aluno não encontrado" />}
          {state.kind === "no-shift" && <Message icon="🕒" title="Sem turno ativo" subtitle="Não há turno em andamento agora." />}
          {state.kind === "duplicate" && <Message icon="ℹ️" title="Já registrado" subtitle={`${state.nome} já marcou presença neste turno.`} />}
          {state.kind === "ok" && (
            <Message
              icon={state.status === "presente" ? "✓" : "!"}
              title={state.status === "presente" ? "Presença confirmada" : "Atraso registrado"}
              subtitle={state.nome}
            />
          )}
          {state.kind === "error" && <Message icon="✕" title="Erro" subtitle={state.message} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Message({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <>
      <div className="mb-3 text-5xl">{icon}</div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </>
  );
}
