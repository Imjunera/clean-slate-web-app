import { useCallback, useEffect, useState } from "react";
import { presencasService } from "@/services/presencas.service";

export function usePresencasCountToday(refreshKey: number = 0) {
  const [count, setCount] = useState<number | null>(null);

  const reload = useCallback(async () => {
    try {
      setCount(await presencasService.countToday());
    } catch {
      setCount(null);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  return { count, reload };
}
