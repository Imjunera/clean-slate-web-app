import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlunoForm } from "@/components/cadastro/AlunoForm";
import { AlunosTable } from "@/components/cadastro/AlunosTable";
import { ImportAlunos } from "@/components/cadastro/ImportAlunos";
import { useAlunos } from "@/hooks/useAlunos";
import { usePresencasCountToday } from "@/hooks/usePresencasCountToday";
import { pdfService } from "@/services/pdf.service";
import type { Aluno } from "@/domain/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadastro de Alunos — Colégio Antônio Costa" },
      { name: "description", content: "Cadastre, edite e gerencie alunos da escola." },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const { alunos, loading, saving, create, update, remove, removeAll, reload } = useAlunos();
  const { count } = usePresencasCountToday();
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [busca, setBusca] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return q ? alunos.filter((a) => a.nome.toLowerCase().includes(q)) : alunos;
  }, [alunos, busca]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alunos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os alunos cadastrados no sistema</p>
        </div>
        <div className="flex gap-3">
          <Card className="px-4 py-2"><CardContent className="p-0 text-sm">Total <span className="ml-2 font-bold">{alunos.length}</span></CardContent></Card>
          <Card className="px-4 py-2"><CardContent className="p-0 text-sm">Hoje <span className="ml-2 font-bold">{count ?? "—"}</span></CardContent></Card>
        </div>
      </header>

      <ImportAlunos onImported={reload} />

      <AlunoForm
        editing={editing}
        saving={saving}
        onSubmit={async (input) => {
          if (editing) await update(editing.id, input);
          else await create(input);
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar aluno"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="md:max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => pdfService.alunos(alunos)} disabled={alunos.length === 0}>
            Relatório PDF
          </Button>
          {confirmAll ? (
            <>
              <Button variant="destructive" onClick={async () => { await removeAll(); setConfirmAll(false); }}>
                Confirmar
              </Button>
              <Button variant="ghost" onClick={() => setConfirmAll(false)}>Cancelar</Button>
            </>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmAll(true)} disabled={alunos.length === 0}>
              Apagar todos
            </Button>
          )}
        </div>
      </div>

      <AlunosTable
        alunos={filtrados}
        loading={loading}
        onEdit={(a) => setEditing(a)}
        onDelete={(a) => {
          if (confirm(`Excluir "${a.nome}"?`)) void remove(a.id);
        }}
      />
    </div>
  );
}
