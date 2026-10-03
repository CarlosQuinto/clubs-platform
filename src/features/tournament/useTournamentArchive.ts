import { useCallback, useEffect, useRef, useState } from "react";
import { dataConnect, QueryFetchPolicy, tournamentArchive } from "../../infrastructure/dataconnect";
import { TOURNAMENT_EDITED } from "../../domains/competition/tournamentEdited";
import { toTournamentArchive } from "./tournamentArchiveMapper";
import type { TournamentArchiveView } from "./tournamentArchiveViewState";

export function useTournamentArchive(): {
  loading: boolean;
  error: string | null;
  view: TournamentArchiveView | null;
  onRefresh: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<TournamentArchiveView | null>(null);
  const request = useRef(0);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    void tournamentArchive(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        setView(toTournamentArchive(result.data));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setError("No se pudieron cargar los torneos.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
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

  return { loading, error, view, onRefresh: load };
}
