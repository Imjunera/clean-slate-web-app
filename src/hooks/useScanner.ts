import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export interface UseScannerOptions {
  onDecode: (text: string) => void;
  fps?: number;
}

export function useScanner({ onDecode, fps = 10 }: UseScannerOptions) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerId = "qr-scanner-region";
  const instanceRef = useRef<Html5Qrcode | null>(null);
  const lastDecodedRef = useRef<{ text: string; at: number } | null>(null);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const start = useCallback(async () => {
    if (instanceRef.current) return;
    setError(null);
    try {
      const instance = new Html5Qrcode(containerId);
      instanceRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          const last = lastDecodedRef.current;
          const now = Date.now();
          if (last && last.text === decodedText && now - last.at < 2500) return;
          lastDecodedRef.current = { text: decodedText, at: now };
          onDecodeRef.current(decodedText);
        },
        () => {
          /* ignore per-frame decode errors */
        },
      );
      setActive(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError("Não foi possível iniciar a câmera.");
      instanceRef.current = null;
      setActive(false);
    }
  }, [fps]);

  const stop = useCallback(async () => {
    const instance = instanceRef.current;
    if (!instance) return;
    try {
      await instance.stop();
      await instance.clear();
    } catch {
      /* ignore */
    } finally {
      instanceRef.current = null;
      setActive(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { active, error, start, stop, containerId };
}
