import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TURMAS, TURNO_NOMES } from "@/domain/turnos";
import type { Aluno, AlunoInput, TurnoNome } from "@/domain/types";
import { notify } from "@/lib/notify";

interface Props {
  editing: Aluno | null;
  saving: boolean;
  onSubmit: (input: AlunoInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: AlunoInput = { nome: "", idade: 0, turma: "", turno: "Manhã" };

export function AlunoForm({ editing, saving, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<AlunoInput>(EMPTY);

  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome,
        idade: editing.idade ?? 0,
        turma: editing.turma,
        turno: editing.turno,
      });
    } else {
      setForm(EMPTY);
    }
  }, [editing]);

  function validate(): boolean {
    if (!form.nome.trim() || !form.turma || !form.turno) {
      notify.aviso("Campos obrigatórios");
      return false;
    }
    if (isNaN(form.idade) || form.idade < 1 || form.idade > 99) {
      notify.aviso("Idade inválida");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ ...form, nome: form.nome.trim().toUpperCase() });
    if (!editing) setForm(EMPTY);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `Editando: ${editing.nome}` : "Novo aluno"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })}
              placeholder="Nome do aluno"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="idade">Idade</Label>
            <Input
              id="idade"
              type="number"
              min={1}
              max={99}
              value={form.idade || ""}
              onChange={(e) => setForm({ ...form, idade: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="turma">Turma</Label>
            <Select value={form.turma} onValueChange={(v) => setForm({ ...form, turma: v })}>
              <SelectTrigger id="turma"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
              <SelectContent>
                {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="turno">Turno</Label>
            <Select value={form.turno} onValueChange={(v) => setForm({ ...form, turno: v as TurnoNome })}>
              <SelectTrigger id="turno"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TURNO_NOMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : editing ? "Atualizar" : "Salvar aluno"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
