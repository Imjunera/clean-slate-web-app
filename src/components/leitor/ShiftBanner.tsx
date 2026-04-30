import { Card, CardContent } from "@/components/ui/card";
import { useRelogio, useTurnoAtivo } from "@/hooks/useTurno";
import { formatDateLong } from "@/lib/format";

export function ShiftBanner() {
  const turno = useTurnoAtivo();
  const now = useRelogio();

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-sm font-semibold">{formatDateLong(now)}</div>
          <div className="text-xs text-muted-foreground">
            {turno ? `Turno ativo: ${turno.nome}` : "Fora do horário de turnos"}
          </div>
        </div>
        <div className="font-mono text-lg tabular-nums">
          {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </CardContent>
    </Card>
  );
}
