import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Aluno } from "@/domain/types";

interface Props {
  alunos: Aluno[];
  loading: boolean;
  onEdit: (aluno: Aluno) => void;
  onDelete: (aluno: Aluno) => void;
}

export function AlunosTable({ alunos, loading, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-md border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Idade</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Turno</TableHead>
            <TableHead>QR</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : alunos.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum aluno</TableCell></TableRow>
          ) : alunos.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.nome}</TableCell>
              <TableCell>{a.idade ?? "—"}</TableCell>
              <TableCell>{a.turma}</TableCell>
              <TableCell>{a.turno}</TableCell>
              <TableCell>
                {a.qr ? (
                  <img src={a.qr} alt={`QR ${a.nome}`} className="h-10 w-10 rounded bg-white p-0.5" />
                ) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => onEdit(a)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(a)} aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
