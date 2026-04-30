import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { presencasService } from "@/services/presencas.service";
import { alunosService } from "@/services/alunos.service";
import { TURNO_NOMES } from "@/domain/turnos";
import { dayKey } from "@/lib/format";
import { notify } from "@/lib/notify";
import type { Aluno, Presenca, TurnoNome } from "@/domain/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export const Route = createFileRoute("/analise")({
  head: () => ({
    meta: [
      { title: "Análise — Colégio Antônio Costa" },
      { name: "description", content: "Painel de frequência, atrasos e desempenho por aluno." },
    ],
  }),
  component: AnalisePage,
});

type SortKey = "presencas" | "atrasos" | "nome";

function defaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function AnalisePage() {
  const { from: fromDef, to: toDef } = defaultDates();
  const [from, setFrom] = useState(fromDef);
  const [to, setTo] = useState(toDef);
  const [turnoFiltro, setTurnoFiltro] = useState<"all" | TurnoNome>("all");
  const [registros, setRegistros] = useState<Presenca[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [sort, setSort] = useState<SortKey>("presencas");

  async function load() {
    setLoading(true);
    try {
      const [regs, als] = await Promise.all([
        presencasService.listInRange(from, to),
        alunosService.list(),
      ]);
      setRegistros(regs);
      setAlunos(als);
    } catch (e) {
      notify.erro("Erro ao carregar análise", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtrados = useMemo(
    () => turnoFiltro === "all" ? registros : registros.filter((r) => r.turno === turnoFiltro),
    [registros, turnoFiltro],
  );

  const kpis = useMemo(() => {
    const presentes = filtrados.filter((r) => r.status === "presente").length;
    const atrasos = filtrados.filter((r) => r.status === "atrasado").length;
    const total = presentes + atrasos;
    const pontualidade = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { presentes, atrasos, pontualidade, alunos: alunos.length };
  }, [filtrados, alunos]);

  const porDia = useMemo(() => {
    const map = new Map<string, number>();
    filtrados.forEach((r) => {
      const k = dayKey(r.horario_chegada);
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    const labels = [...map.keys()].sort();
    return { labels, data: labels.map((l) => map.get(l) ?? 0) };
  }, [filtrados]);

  const presVsAtraso = useMemo(() => ({
    labels: ["Presentes", "Atrasos"],
    data: [
      filtrados.filter((r) => r.status === "presente").length,
      filtrados.filter((r) => r.status === "atrasado").length,
    ],
  }), [filtrados]);

  const porTurno = useMemo(() => {
    const labels = TURNO_NOMES;
    const presentes = labels.map((t) => filtrados.filter((r) => r.turno === t && r.status === "presente").length);
    const atrasos = labels.map((t) => filtrados.filter((r) => r.turno === t && r.status === "atrasado").length);
    return { labels: [...labels], presentes, atrasos };
  }, [filtrados]);

  const porAluno = useMemo(() => {
    const map = new Map<string, { aluno: Aluno; presencas: number; atrasos: number }>();
    alunos.forEach((a) => map.set(a.id, { aluno: a, presencas: 0, atrasos: 0 }));
    filtrados.forEach((r) => {
      const cur = map.get(r.aluno_id);
      if (!cur) return;
      if (r.status === "presente") cur.presencas++;
      else cur.atrasos++;
    });
    let arr = [...map.values()];
    const q = busca.toLowerCase().trim();
    if (q) arr = arr.filter((x) => x.aluno.nome.toLowerCase().includes(q));
    arr.sort((a, b) => {
      if (sort === "nome") return a.aluno.nome.localeCompare(b.aluno.nome);
      if (sort === "atrasos") return b.atrasos - a.atrasos;
      return b.presencas - a.presencas;
    });
    return arr;
  }, [alunos, filtrados, busca, sort]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Painel de Análise</h1>
        <p className="text-sm text-muted-foreground">Frequência, atrasos e desempenho por aluno.</p>
      </header>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <div>
            <label className="text-xs text-muted-foreground">De</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Até</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Turno</label>
            <Select value={turnoFiltro} onValueChange={(v) => setTurnoFiltro(v as "all" | TurnoNome)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os turnos</SelectItem>
                {TURNO_NOMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={() => void load()} disabled={loading} className="flex-1">Filtrar</Button>
            <Button variant="outline" onClick={() => { setFrom(fromDef); setTo(toDef); setTurnoFiltro("all"); }}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Presenças" value={kpis.presentes} />
        <Stat label="Atrasos" value={kpis.atrasos} />
        <Stat label="Pontualidade" value={`${kpis.pontualidade}%`} />
        <Stat label="Alunos" value={kpis.alunos} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Presenças no tempo">
          <Line
            data={{
              labels: porDia.labels,
              datasets: [{ label: "Presenças", data: porDia.data, borderColor: "#1a6641", tension: 0.3 }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </ChartCard>
        <ChartCard title="Presentes vs Atrasos">
          <Doughnut
            data={{
              labels: presVsAtraso.labels,
              datasets: [{ data: presVsAtraso.data, backgroundColor: ["#1a6641", "#e53e3e"] }],
            }}
          />
        </ChartCard>
        <ChartCard title="Presenças por turno">
          <Bar
            data={{
              labels: porTurno.labels,
              datasets: [{ label: "Presentes", data: porTurno.presentes, backgroundColor: "#1a6641" }],
            }}
          />
        </ChartCard>
        <ChartCard title="Atrasos por turno">
          <Bar
            data={{
              labels: porTurno.labels,
              datasets: [{ label: "Atrasos", data: porTurno.atrasos, backgroundColor: "#e53e3e" }],
            }}
          />
        </ChartCard>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold">Frequência por aluno</h2>
            <div className="flex gap-2">
              <Input placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencas">Mais presenças</SelectItem>
                  <SelectItem value="atrasos">Mais atrasos</SelectItem>
                  <SelectItem value="nome">Nome (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Presenças</TableHead>
                  <TableHead>Atrasos</TableHead>
                  <TableHead>Pontualidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porAluno.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
                ) : porAluno.map((row, i) => {
                  const total = row.presencas + row.atrasos;
                  const pct = total > 0 ? Math.round((row.presencas / total) * 100) : 0;
                  return (
                    <TableRow key={row.aluno.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.aluno.nome}</TableCell>
                      <TableCell>{row.aluno.turma}</TableCell>
                      <TableCell>{row.aluno.turno}</TableCell>
                      <TableCell>{row.presencas}</TableCell>
                      <TableCell>{row.atrasos}</TableCell>
                      <TableCell>{total > 0 ? `${pct}%` : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card><CardContent className="p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="relative h-64">{children}</div>
    </CardContent></Card>
  );
}
