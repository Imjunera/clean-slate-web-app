import { TURNOS } from "./turnos";
import type { Turno, TurnoNome } from "./types";

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function getTurnoAtual(): Turno | null {
  const m = nowMinutes();
  return TURNOS.find((t) => m >= t.inicio && m < t.fim) ?? null;
}

/** Returns the shift that contains the given timestamp, or null. */
export function getTurnoForTimestamp(iso: string): Turno | null {
  const d = new Date(iso);
  const m = d.getHours() * 60 + d.getMinutes();
  return TURNOS.find((t) => m >= t.inicio && m < t.fim) ?? null;
}

export function turnoNomeForTimestamp(iso: string): TurnoNome {
  return getTurnoForTimestamp(iso)?.nome ?? "Manhã";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatMin(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}:00`;
}

export function intervaloDoTurno(
  turno: Turno,
  date: Date = new Date(),
): { inicio: string; fim: string } {
  const dia = date.toISOString().slice(0, 10);
  return {
    inicio: `${dia}T${formatMin(turno.inicio)}`,
    fim: turno.fim === 1440 ? `${dia}T23:59:59` : `${dia}T${formatMin(turno.fim)}`,
  };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
