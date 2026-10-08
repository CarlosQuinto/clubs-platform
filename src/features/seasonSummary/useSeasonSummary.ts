import { useCallback, useEffect, useRef, useState } from "react";
import { dataConnect, QueryFetchPolicy, seasonSummary } from "../../infrastructure/dataconnect";
import { toSeasonSummary } from "./seasonSummaryMapper";
import type { SeasonSummaryView } from "./seasonSummaryViewState";

/** Resumen de una temporada cerrada. `missing` cubre tanto una temporada inexistente como una que sigue activa. */
export function useSeasonSummary(seasonId: string): {
  loading: boolean;
  missing: boolean;
  error: string | null;
  view: SeasonSummaryView | null;
  onRefresh: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<SeasonSummaryView | null>(null);
  const request = useRef(0);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    if (!seasonId) {
      setMissing(true);
      setView(null);
      setLoading(false);
      return;
    }
    void seasonSummary(dataConnect, { id: seasonId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        const season = result.data.season;
        setMissing(!season);
        setView(season ? toSeasonSummary(season) : null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setMissing(false);
        setError("No se pudo cargar el resumen.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, [seasonId]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, missing, error, view, onRefresh: load };
}
