import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryFetchPolicy } from "firebase/data-connect";
import { homePage, type HomePageData } from "../../../dataconnect/generated";
import { dataConnect } from "../../lib/sqlConnect";
import { isoDate } from "../../utils/helpers";
import { TOURNAMENT_EDITED } from "../../lib/tournamentEdited";
import { toHomePage } from "./homeMapper";
import type { HomePageModel } from "./homeViewState";

export function useHomePage(): {
  loading: boolean;
  error: string | null;
  view: HomePageModel | null;
  onRefresh: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<HomePageData | null>(null);
  const [now, setNow] = useState(() => new Date());
  const request = useRef(0);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    void homePage(dataConnect, { today: isoDate() }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        setPayload(result.data);
        setNow(new Date());
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setError("No se pudo cargar la portada.");
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const view = useMemo(() => (payload ? toHomePage(payload, now) : null), [payload, now]);

  return { loading, error, view, onRefresh: load };
}
