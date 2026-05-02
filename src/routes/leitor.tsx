import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShiftBanner } from "@/components/leitor/ShiftBanner";
import { ScannerView } from "@/components/leitor/ScannerView";
import { ChegadasTable } from "@/components/leitor/ChegadasTable";
import { useTurnoAtivo } from "@/hooks/useTurno";
import { presencasService } from "@/services/presencas.service";
import { alunosService } from "@/services/alunos.service";
import { calcularStatus } from "@/domain/status";
import { notify } from "@/lib/notify";
import { formatTime } from "@/lib/format";
import type { Presenca } from "@/domain/types";

export const Route = createFileRoute("/leitor")({
  head: () => ({
    meta: [
      { title: "Leitor de Presença — Colégio Antônio Costa" },
      { name: "description", content: "Registre presenças escaneando o QR Code dos alunos." },
    ],
  }),
  component: LeitorPage,
});

function extractAlunoId(decoded: string): string | null {
  try {
    const url = new URL(decoded);
    return url.searchParams.get("id");
  } catch {
    return /^[0-9a-f-]{36}$/i.test(decoded.trim()) ? decoded.trim() : null;
  }
}

function LeitorPage() {
  const turno = useTurnoAtivo();
  const [registros, setRegistros] = useState<Presenca[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!turno) { setRegistros([]); return; }
    setLoading(true);
    try {
      setRegistros(await presencasService.listByShiftToday(turno.nome));
    } catch (e) {
      notify.erro("Erro ao carregar chegadas", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [turno]);

  useEffect(() => { void reload(); }, [reload]);

  const counts = useMemo(() => ({
    presentes: registros.filter((r) => r.status === "presente").length,
    atrasos: registros.filter((r) => r.status === "atrasado").length,
    ultima: registros[0],
  }), [registros]);

  const handleScan = useCallback(async (text: string) => {
    if (!turno) {
      notify.aviso("Sem turno ativo", "Não há turno em andamento agora.");
      return;
    }
    const alunoId = extractAlunoId(text);
    if (!alunoId) {
      notify.erro("QR inválido");
      return;
    }
    try {
      const aluno = await alunosService.getById(alunoId);
      if (!aluno) { notify.erro("Aluno não encontrado"); return; }

      const exists = await presencasService.existsToday(aluno.id);
      if (exists) {
        notify.info("Já registrado", `${aluno.nome} já marcou presença hoje.`);
        return;
      }

      const status = calcularStatus(turno.nome);
      const now = new Date();
      await presencasService.create({
        aluno_id: aluno.id,
        status,
        horario_chegada: now.toISOString(),
        data: now.toISOString().slice(0, 10),
      });

      if (status === "atrasado") notify.aviso("Atraso registrado", aluno.nome);
      else notify.sucesso("Presença registrada", aluno.nome);

      await reload();
    } catch (e) {
      notify.erro("Erro ao registrar", (e as Error).message);
    }
  }, [turno, reload]);

  function exportCSV() {
    const rows = [
      ["Nome", "Turma", "Turno", "Status", "Horário"],
      ...registros.map((r) => [r.nome, r.turma, r.turno, r.status, formatTime(r.horario_chegada)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presencas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Controle de Presença</h1>
        <p className="text-sm text-muted-foreground">Escaneie o QR Code do aluno para registrar a presença.</p>
      </header>

      <ShiftBanner />

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Presentes" value={counts.presentes} />
        <Stat label="Atrasos" value={counts.atrasos} />
        <Stat label="Última entrada" value={counts.ultima ? formatTime(counts.ultima.horario_chegada) : "—"} />
        <Stat label="Turno" value={turno?.nome ?? "—"} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Scanner</h2>
            <ScannerView onScan={handleScan} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Chegadas</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void reload()} disabled={loading}>
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" onClick={exportCSV} disabled={registros.length === 0}>
                  Exportar
                </Button>
              </div>
            </div>
            <ChegadasTable registros={registros} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
