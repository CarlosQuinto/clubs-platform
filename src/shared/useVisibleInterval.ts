import { useEffect, useRef } from "react";

/**
 * Llama a `onTick` cada `ms` mientras la pestaña está visible, y una vez más al volver
 * a ella (`resumed = true`). Con la pestaña oculta no hace nada: no gasta consultas.
 */
export function useVisibleInterval(onTick: (now: Date, resumed: boolean) => void, ms: number) {
  const tick = useRef(onTick);
  tick.current = onTick;

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      tick.current(new Date(), false);
    }, ms);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick.current(new Date(), true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ms]);
}
