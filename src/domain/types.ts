export type TurnoNome = "Manhã" | "Tarde" | "Noite";

export type Status = "presente" | "atrasado";

export interface Turno {
  nome: TurnoNome;
  inicio: number; // minutes from 00:00
  fim: number;
  cutoffAtraso: number; // minutes from 00:00
}

export interface Aluno {
  id: string;
  nome: string;
  idade: number | null;
  turma: string;
  turno: TurnoNome;
  qr: string | null;
}

export interface AlunoInput {
  nome: string;
  idade: number;
  turma: string;
  turno: TurnoNome;
}

/**
 * Row stored in the `presencas` table. Schema only contains:
 *   id, aluno_id, horario_chegada, status, data
 * Student details (nome, turma, turno) live on the `alunos` table and are
 * joined in via PostgREST embeds.
 */
export interface PresencaRow {
  id: string;
  aluno_id: string;
  horario_chegada: string; // ISO
  status: Status;
  data?: string | null;
}

export interface PresencaInsert {
  aluno_id: string;
  horario_chegada: string;
  status: Status;
  data: string; // YYYY-MM-DD
}

/**
 * Domain object used in the UI. Combines the row with joined student
 * information and the shift derived from `horario_chegada`.
 */
export interface Presenca extends PresencaRow {
  nome: string;
  turma: string;
  turno: TurnoNome;
}
