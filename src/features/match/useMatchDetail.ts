import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MatchDetailData, MatchPreviewData } from "../../infrastructure/dataconnect";
import { TOURNAMENT_EDITED } from "../../domains/competition/tournamentEdited";
import { useVisibleInterval } from "../../shared/useVisibleInterval";
import { loadMatchDetail, loadMatchPreview } from "./matchDetailQueries";
import { shouldPoll, toMatchDetail, toMatchPreview } from "./matchDetailMapper";
import type { MatchDetailView, MatchPreviewView } from "./matchDetailViewState";

/** Cada cuánto se revisa el marcador mientras el partido está en juego. */
const POLL_MS = 15_000;

/**
 * Ficha del partido. Consulta una vez y, mientras el partido está cerca de su horario
 * y sin finalizar, vuelve a consultar cada 15 s con la pestaña visible.
 */
export function useMatchDetail(matchId: string): {
  loading: boolean;
  missing: boolean;
  error: string | null;
  view: MatchDetailView | null;
  preview: MatchPreviewView | null;
  refresh: () => void;
} {
  const [payload, setPayload] = useState<MatchDetailData | null>(null);
  const [previewData, setPreviewData] = useState<MatchPreviewData | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const previewRequest = useRef(0);
  const payloadRef = useRef<MatchDetailData | null>(null);

  const load = useCallback(
    (quiet: boolean) => {
      const ticket = request.current + 1;
      request.current = ticket;
      if (!quiet) {
        setLoading(true);
        setError(null);
      }
      if (!matchId) {
        setMissing(true);
        setLoading(false);
        return;
      }
      void loadMatchDetail(matchId)
        .then((data) => {
          if (ticket !== request.current) return;
          payloadRef.current = data;
          setPayload(data);
          setMissing(data.matches.length === 0);
          setError(null);
          setNow(new Date());
        })
        .catch((err: unknown) => {
          console.error(err);
          if (ticket !== request.current) return;
          // Un fallo del sondeo conserva lo último que se vio.
          if (!payloadRef.current) setError("No se pudo cargar el partido.");
        })
        .finally(() => {
          if (ticket === request.current) setLoading(false);
        });
    },
    [matchId],
  );

  useEffect(() => {
    payloadRef.current = null;
    setPayload(null);
    setPreviewData(null);
    load(false);
  }, [load]);

  useEffect(() => {
    const onEdited = () => load(true);
    window.addEventListener(TOURNAMENT_EDITED, onEdited);
    return () => window.removeEventListener(TOURNAMENT_EDITED, onEdited);
  }, [load]);

  useVisibleInterval((at, resumed) => {
    setNow(at);
    if (resumed || shouldPoll(payloadRef.current, at)) load(true);
  }, POLL_MS);

  // La previa (tabla, forma, historial) no se sondea: se pide de nuevo solo al cambiar el estado.
  const match = payload?.matches[0];
  const tournamentId = match?.tournament.id ?? "";
  const homeClubId = match?.homeClub.id ?? "";
  const awayClubId = match?.awayClub.id ?? "";
  const status = match?.status ?? "";
  useEffect(() => {
    if (!tournamentId || !homeClubId || !awayClubId) return;
    const ticket = previewRequest.current + 1;
    previewRequest.current = ticket;
    void loadMatchPreview({ tournamentId, homeClubId, awayClubId })
      .then((data) => {
        if (ticket === previewRequest.current) setPreviewData(data);
      })
      .catch((err: unknown) => console.error(err));
  }, [tournamentId, homeClubId, awayClubId, status]);

  const view = useMemo(() => (payload ? toMatchDetail(payload, now) : null), [payload, now]);
  const preview = useMemo(
    () =>
      previewData && view
        ? toMatchPreview(previewData, view.id, view.tournamentId, view.homeClubId, view.awayClubId)
        : null,
    [previewData, view],
  );
  const refresh = useCallback(() => load(true), [load]);

  return { loading, missing, error, view, preview, refresh };
}
