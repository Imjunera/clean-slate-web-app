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

export type AlunoInput = Omit<Aluno, "id" | "qr">;

export interface Presenca {
  id: string;
  aluno_id: string;
  nome: string;
  turma: string;
  turno: TurnoNome;
  status: Status;
  horario_chegada: string; // ISO
}

export type PresencaInput = Omit<Presenca, "id">;
