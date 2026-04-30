import type { Status, TurnoNome } from "./types";
import { getTurno } from "./turnos";
import { nowMinutes } from "./time";

export function calcularStatus(turno: TurnoNome): Status {
  const t = getTurno(turno);
  if (!t) return "presente";
  return nowMinutes() <= t.cutoffAtraso ? "presente" : "atrasado";
}
