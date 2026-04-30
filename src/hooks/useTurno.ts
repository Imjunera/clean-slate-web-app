import { useEffect, useState } from "react";
import { getTurnoAtual } from "@/domain/time";
import type { Turno } from "@/domain/types";

export function useTurnoAtivo(intervalMs: number = 30_000) {
  const [turno, setTurno] = useState<Turno | null>(() => getTurnoAtual());

  useEffect(() => {
    const id = window.setInterval(() => setTurno(getTurnoAtual()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return turno;
}

export function useRelogio() {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
