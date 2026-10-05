import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dataConnect,
  liveMatches,
  type LiveMatchesData,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { isoDate } from "../../shared/helpers";
import { TOURNAMENT_EDITED } from "../../domains/competition/tournamentEdited";
import { useVisibleInterval } from "../../shared/useVisibleInterval";
import { hasLiveWindow, toLiveMatches } from "./homeMapper";
import type { LiveMatchView } from "./homeViewState";

/** Cada cuánto se revisa el marcador mientras hay partidos en vivo. */
const POLL_MS = 15_000;

function yesterday(now: Date) {
  return isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
}

/**
 * Partidos de hoy para la sección «En vivo». Consulta una vez y, mientras algún partido
 * está en vivo y la pestaña se ve, vuelve a consultar cada 15 s para recoger el marcador.
 */
export function useLiveMatches(): LiveMatchView[] {
  const [payload, setPayload] = useState<LiveMatchesData | null>(null);
  const [now, setNow] = useState(() => new Date());
  const request = useRef(0);
  const payloadRef = useRef<LiveMatchesData | null>(null);
  const loadedDay = useRef("");

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    const at = new Date();
    const day = isoDate(at);
    void liveMatches(
      dataConnect,
      { from: yesterday(at), to: day },
      { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
    )
      .then((result) => {
        if (ticket !== request.current) return;
        payloadRef.current = result.data;
        loadedDay.current = day;
        setPayload(result.data);
        setNow(new Date());
      })
      .catch((err: unknown) => {
        // Se conservan los últimos datos: un fallo de red no vacía la sección.
        console.error(err);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onEdited = () => load();
    window.addEventListener(TOURNAMENT_EDITED, onEdited);
    return () => window.removeEventListener(TOURNAMENT_EDITED, onEdited);
  }, [load]);

  useVisibleInterval((at, resumed) => {
    setNow(at);
    const data = payloadRef.current;
    if (resumed || isoDate(at) !== loadedDay.current || (data && hasLiveWindow(data, at))) load();
  }, POLL_MS);

  return useMemo(() => (payload ? toLiveMatches(payload, now) : []), [payload, now]);
}
