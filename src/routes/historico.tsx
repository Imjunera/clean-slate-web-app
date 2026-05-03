import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { presencasService } from "@/services/presencas.service";
import { pdfService } from "@/services/pdf.service";
import { TURNO_NOMES } from "@/domain/turnos";
import { dayKey, formatDate, formatTime } from "@/lib/format";
import { notify, uiError } from "@/lib/notify";
import type { Presenca, TurnoNome } from "@/domain/types";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de Presenças — Colégio Antônio Costa" },
      { name: "description", content: "Histórico de relatórios por dia e turno." },
    ],
  }),
  component: HistoricoPage,
});

interface GroupKey { dia: string; turno: TurnoNome }

function HistoricoPage() {
  const [registros, setRegistros] = useState<Presenca[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroTurno, setFiltroTurno] = useState<"all" | TurnoNome>("all");
  const [modal, setModal] = useState<GroupKey | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRegistros(await presencasService.listAll());
      } catch (e) {
        notify.erro("Erro ao carregar histórico", uiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (filtroData && dayKey(r.horario_chegada) !== filtroData) return false;
      if (filtroTurno !== "all" && r.turno !== filtroTurno) return false;
      return true;
    });
  }, [registros, filtroData, filtroTurno]);

  const grupos = useMemo(() => {
    const map = new Map<string, { dia: string; turno: TurnoNome; registros: Presenca[] }>();
    filtrados.forEach((r) => {
      const dia = dayKey(r.horario_chegada);
      const k = `${dia}__${r.turno}`;
      if (!map.has(k)) map.set(k, { dia, turno: r.turno, registros: [] });
      map.get(k)!.registros.push(r);
    });
    return [...map.values()].sort((a, b) => b.dia.localeCompare(a.dia) || a.turno.localeCompare(b.turno));
  }, [filtrados]);

  const stats = useMemo(() => {
    const dias = new Set(registros.map((r) => dayKey(r.horario_chegada)));
    const sortedDays = [...dias].sort();
    return {
      dias: dias.size,
      registros: registros.length,
      primeiro: sortedDays[0] ?? "—",
    };
  }, [registros]);

  const modalRegistros = useMemo(() => {
    if (!modal) return [];
    return filtrados.filter((r) => dayKey(r.horario_chegada) === modal.dia && r.turno === modal.turno);
  }, [modal, filtrados]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Histórico de Presenças</h1>
        <p className="text-sm text-muted-foreground">Relatórios por dia e turno registrados.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Dias" value={stats.dias} />
        <Stat label="Registros" value={stats.registros} />
        <Stat label="Primeiro dia" value={stats.primeiro === "—" ? "—" : formatDate(stats.primeiro)} />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Data</label>
            <Input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Turno</label>
            <Select value={filtroTurno} onValueChange={(v) => setFiltroTurno(v as "all" | TurnoNome)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os turnos</SelectItem>
                {TURNO_NOMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => { setFiltroData(""); setFiltroTurno("all"); }}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground">Carregando histórico...</p>
      ) : grupos.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhum registro encontrado.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => {
            const presentes = g.registros.filter((r) => r.status === "presente").length;
            const atrasos = g.registros.filter((r) => r.status === "atrasado").length;
            return (
              <Card key={`${g.dia}-${g.turno}`} className="cursor-pointer transition hover:shadow" onClick={() => setModal({ dia: g.dia, turno: g.turno })}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{formatDate(g.dia)}</div>
                      <div className="text-xs text-muted-foreground">{g.turno}</div>
                    </div>
                    <Badge>{g.registros.length}</Badge>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <Badge variant="secondary">{presentes} presentes</Badge>
                    <Badge variant="destructive">{atrasos} atrasos</Badge>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); pdfService.presencasDoTurno(g.dia, g.turno, g.registros); }}
                    >
                      Gerar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modal ? `${formatDate(modal.dia)} — ${modal.turno}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modalRegistros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell>{r.turma}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "presente" ? "default" : "destructive"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>{formatTime(r.horario_chegada)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              onClick={() => modal && pdfService.presencasDoTurno(modal.dia, modal.turno, modalRegistros)}
              disabled={!modal || modalRegistros.length === 0}
            >
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </CardContent></Card>
  );
}
