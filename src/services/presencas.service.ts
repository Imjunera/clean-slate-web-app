import { supabase } from "./supabase/client";
import type { Presenca, PresencaInsert, TurnoNome } from "@/domain/types";
import { intervaloDoTurno, todayISO, turnoNomeForTimestamp } from "@/domain/time";
import { getTurno } from "@/domain/turnos";

const TABLE = "presencas";
// Embed student fields via PostgREST join. The `presencas` table itself does
// NOT carry nome/turma/turno — those live on `alunos` and are joined in.
const SELECT_WITH_ALUNO =
  "id,aluno_id,horario_chegada,status,data,alunos!inner(nome,turma,turno)";

interface RawRow {
  id: string;
  aluno_id: string;
  horario_chegada: string;
  status: "presente" | "atrasado";
  data: string | null;
  alunos: { nome: string; turma: string; turno: TurnoNome } | null;
}

function toPresenca(row: RawRow): Presenca {
  const aluno = row.alunos;
  return {
    id: row.id,
    aluno_id: row.aluno_id,
    horario_chegada: row.horario_chegada,
    status: row.status,
    data: row.data,
    nome: aluno?.nome ?? "",
    turma: aluno?.turma ?? "",
    // Shift of the registration is derived from when it occurred, not from
    // the student's enrolled shift, so reports remain accurate even if the
    // student arrives in a different period.
    turno: turnoNomeForTimestamp(row.horario_chegada),
  };
}

export const presencasService = {
  async countToday(): Promise<number> {
    const dia = todayISO();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .gte("horario_chegada", `${dia}T00:00:00`)
      .lte("horario_chegada", `${dia}T23:59:59`);
    if (error) throw error;
    return count ?? 0;
  },

  async listByShiftToday(turnoNome: TurnoNome): Promise<Presenca[]> {
    const t = getTurno(turnoNome);
    if (!t) return [];
    const { inicio, fim } = intervaloDoTurno(t);
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_WITH_ALUNO)
      .gte("horario_chegada", inicio)
      .lte("horario_chegada", fim)
      .order("horario_chegada", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as RawRow[]).map(toPresenca);
  },

  async existsForShiftToday(alunoId: string, turnoNome: TurnoNome): Promise<boolean> {
    const t = getTurno(turnoNome);
    if (!t) return false;
    const { inicio, fim } = intervaloDoTurno(t);
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("aluno_id", alunoId)
      .gte("horario_chegada", inicio)
      .lte("horario_chegada", fim);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  /** One attendance per student per day. */
  async existsToday(alunoId: string): Promise<boolean> {
    const dia = todayISO();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("aluno_id", alunoId)
      .gte("horario_chegada", `${dia}T00:00:00`)
      .lte("horario_chegada", `${dia}T23:59:59`);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  async create(input: PresencaInsert): Promise<void> {
    const { error } = await supabase.from(TABLE).insert([input]);
    if (error) throw error;
  },

  async listInRange(fromDate: string, toDate: string): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_WITH_ALUNO)
      .gte("horario_chegada", `${fromDate}T00:00:00`)
      .lte("horario_chegada", `${toDate}T23:59:59`)
      .order("horario_chegada", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as RawRow[]).map(toPresenca);
  },

  async listAll(): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_WITH_ALUNO)
      .order("horario_chegada", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as RawRow[]).map(toPresenca);
  },
};
