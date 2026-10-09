import { useCallback, useEffect, useRef, useState } from "react";
import { dataConnect, playerProfile, QueryFetchPolicy } from "../../infrastructure/dataconnect";
import { toPlayerProfile } from "./playerProfileMapper";
import type { PlayerProfileView } from "./playerProfileViewState";

/** Ficha pública de un jugador. `missing` = no existe (o se fusionó con otro). La usa también /admin → Jugadores. */
export function usePlayerProfile(playerId: string): {
  loading: boolean;
  missing: boolean;
  error: string | null;
  view: PlayerProfileView | null;
  onRefresh: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PlayerProfileView | null>(null);
  const request = useRef(0);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    if (!playerId) {
      setMissing(true);
      setView(null);
      setLoading(false);
      return;
    }
    void playerProfile(dataConnect, { id: playerId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        const player = result.data.player;
        setMissing(!player);
        setView(player ? toPlayerProfile(player) : null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setMissing(false);
        setError("No se pudo cargar la ficha del jugador.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, missing, error, view, onRefresh: load };
}
