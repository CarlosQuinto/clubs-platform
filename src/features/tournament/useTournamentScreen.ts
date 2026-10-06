import { useCallback, useEffect, useRef, useState } from "react";
import { dataConnect, QueryFetchPolicy, tournamentScreen } from "../../infrastructure/dataconnect";
import { todayIso } from "../../domains/courts/courts";
import { toTournamentScreen } from "./tournamentMapper";
import type { TournamentScreenView } from "./tournamentViewState";

export function useTournamentScreen(tournamentId: string): {
  loading: boolean;
  missing: boolean;
  error: string | null;
  view: TournamentScreenView | null;
  onRefresh: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<TournamentScreenView | null>(null);
  const request = useRef(0);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    if (!tournamentId) {
      setMissing(true);
      setView(null);
      setLoading(false);
      return;
    }
    void tournamentScreen(
      dataConnect,
      { id: tournamentId },
      { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
    )
      .then((result) => {
        if (ticket !== request.current) return;
        if (result.data.tournaments.length === 0) {
          setMissing(true);
          setView(null);
          return;
        }
        setMissing(false);
        setView(toTournamentScreen(result.data, todayIso()));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setMissing(false);
        setError("No se pudo cargar el torneo.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, missing, error, view, onRefresh: load };
}
