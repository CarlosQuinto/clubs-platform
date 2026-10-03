import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clubScreen,
  type ClubScreenData,
  dataConnect,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { toClubScreen } from "./clubMapper";

export const CLUB_REFRESH = "club-sql-refresh";

export function requestClubRefresh() {
  window.dispatchEvent(new Event(CLUB_REFRESH));
}

export function useClubScreen(slug: string) {
  const [data, setData] = useState<ClubScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const reload = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    if (!slug) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void clubScreen(dataConnect, { slug }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        if (result.data == null) {
          setError("No se pudo cargar el equipo.");
          return;
        }
        setData(result.data);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setError("No se pudo cargar el equipo.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onRefresh = () => reload();
    window.addEventListener(CLUB_REFRESH, onRefresh);
    return () => window.removeEventListener(CLUB_REFRESH, onRefresh);
  }, [reload]);

  return { data, loading, error, reload };
}

export function useClubModel(slug: string, userId: string | null) {
  const screen = useClubScreen(slug);
  const model = useMemo(
    () => (screen.data ? toClubScreen(screen.data, userId) : null),
    [screen.data, userId],
  );
  return { ...screen, model };
}

const ClubModelContext = createContext<ReturnType<typeof useClubModel> | null>(null);

export function ClubModelProvider({
  value,
  children,
}: {
  value: ReturnType<typeof useClubModel>;
  children: ReactNode;
}) {
  return createElement(ClubModelContext.Provider, { value }, children);
}

export function useClubModelContext() {
  const value = useContext(ClubModelContext);
  if (!value) throw new Error("useClubModelContext debe usarse dentro del equipo.");
  return value;
}
