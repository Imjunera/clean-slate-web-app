import { supabase } from "./supabase/client";
import type { Presenca, PresencaInput } from "@/domain/types";
import { intervaloDoTurno, todayISO } from "@/domain/time";
import { getTurno } from "@/domain/turnos";
import type { TurnoNome } from "@/domain/types";

const TABLE = "presencas";
const COLS = "id,aluno_id,nome,turma,turno,status,horario_chegada";

export const presencasService = {
  async countToday(): Promise<number> {
    const dia = todayISO();
    const { count, error } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
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
      .select(COLS)
      .gte("horario_chegada", inicio)
      .lte("horario_chegada", fim)
      .order("horario_chegada", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Presenca[];
  },

  async existsForShiftToday(alunoId: string, turnoNome: TurnoNome): Promise<boolean> {
    const t = getTurno(turnoNome);
    if (!t) return false;
    const { inicio, fim } = intervaloDoTurno(t);
    const { count, error } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("aluno_id", alunoId)
      .gte("horario_chegada", inicio)
      .lte("horario_chegada", fim);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  async create(input: PresencaInput): Promise<Presenca> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([input])
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Presenca;
  },

  async listInRange(fromDate: string, toDate: string): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .gte("horario_chegada", `${fromDate}T00:00:00`)
      .lte("horario_chegada", `${toDate}T23:59:59`)
      .order("horario_chegada", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Presenca[];
  },

  async listAll(): Promise<Presenca[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("horario_chegada", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Presenca[];
  },
};
