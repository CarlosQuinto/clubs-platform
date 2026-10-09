import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { courtsPage, dataConnect, QueryFetchPolicy } from "../../infrastructure/dataconnect";
import { todayIso } from "../../domains/courts/courts";
import { asCourtSlot } from "../../shared/types";
import { toCourtsPage } from "./courtsMapper";

function readClock() {
  const now = new Date();
  return { today: todayIso(), nowMinutes: now.getHours() * 60 + now.getMinutes() };
}

export function useCourtsPage() {
  const [date, setDate] = useState(todayIso);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof courtsPage>>["data"] | null>(null);
  const [clock, setClock] = useState(readClock);
  const request = useRef(0);

  // Con la página abierta, los horarios de hoy se retiran conforme pasa la hora.
  useEffect(() => {
    const timer = window.setInterval(() => setClock(readClock()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    void courtsPage(dataConnect, { date }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        setData(result.data);
        setDuration(asCourtSlot(result.data.platformSettings?.courtSlotMinutes));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setError("No se pudieron cargar las canchas.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const view = useMemo(
    () => (data ? toCourtsPage(data, { date, courtId, start, duration, ...clock }) : null),
    [data, date, courtId, start, duration, clock],
  );

  const slot = asCourtSlot(data?.platformSettings?.courtSlotMinutes);

  return {
    loading,
    error,
    view,
    onSelectCourt: (id: string) => {
      setCourtId(id);
      setStart(null);
      setDuration(slot);
    },
    onDate: (value: string) => {
      setDate(value);
      setStart(null);
      setDuration(slot);
    },
    onStart: (minutes: number) => {
      setStart(minutes);
      setDuration(slot);
    },
    onDuration: setDuration,
    onRefresh: load,
  };
}
