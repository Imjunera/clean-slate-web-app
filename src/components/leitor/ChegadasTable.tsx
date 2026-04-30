import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/format";
import type { Presenca } from "@/domain/types";

export function ChegadasTable({ registros }: { registros: Presenca[] }) {
  return (
    <div className="rounded-md border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma presença</TableCell></TableRow>
          ) : registros.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell>{r.turma}</TableCell>
              <TableCell>{formatTime(r.horario_chegada)}</TableCell>
              <TableCell>
                <Badge variant={r.status === "presente" ? "default" : "destructive"}>
                  {r.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
