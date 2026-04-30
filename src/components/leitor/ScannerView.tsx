import { useEffect } from "react";
import { useScanner } from "@/hooks/useScanner";
import { Button } from "@/components/ui/button";

interface Props {
  onScan: (text: string) => void;
}

export function ScannerView({ onScan }: Props) {
  const { active, error, start, stop, containerId } = useScanner({ onDecode: onScan });

  useEffect(() => () => { void stop(); }, [stop]);

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-md border border-border bg-muted/40"
      >
        {!active && (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            📷 Câmera desativada
          </div>
        )}
      </div>
      <div className="flex justify-center">
        {active ? (
          <Button variant="outline" onClick={() => void stop()}>Parar câmera</Button>
        ) : (
          <Button onClick={() => void start()}>Ativar câmera</Button>
        )}
      </div>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
