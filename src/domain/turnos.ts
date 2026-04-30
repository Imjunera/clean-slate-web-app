import type { Turno, TurnoNome } from "./types";

export const TURNOS: readonly Turno[] = Object.freeze([
  { nome: "Manhã", inicio: 405, fim: 780, cutoffAtraso: 7 * 60 + 45 },
  { nome: "Tarde", inicio: 780, fim: 1080, cutoffAtraso: 13 * 60 + 15 },
  { nome: "Noite", inicio: 1140, fim: 1440, cutoffAtraso: 19 * 60 + 15 },
]);

export const TURNO_NOMES: readonly TurnoNome[] = ["Manhã", "Tarde", "Noite"];

export const TURMAS: readonly string[] = [
  "6º A", "6º B", "6º C", "6º D",
  "7º A", "7º B", "7º C", "7º D",
  "8º A", "8º B", "8º C", "8º D",
  "9º A", "9º B", "9º C", "9º D",
  "1º Téc. Sistemas", "1º Téc. Agronegócio", "1º NEM", "1º EMP",
  "2º Téc. Sistemas", "2º Téc. Agronegócio", "2º NEM", "2º EMP",
  "3º Téc. Sistemas", "3º Téc. Agronegócio", "3º NEM", "3º EMP",
];

export function getTurno(nome: TurnoNome): Turno | undefined {
  return TURNOS.find((t) => t.nome === nome);
}
