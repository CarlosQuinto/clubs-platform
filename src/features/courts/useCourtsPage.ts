import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { courtsPage } from "../../../dataconnect/generated";
import { todayIso } from "../../lib/courts";
import { asCourtSlot } from "../../lib/types";
import { dataConnect } from "../../lib/sqlConnect";
import { toCourtsPage } from "./courtsMapper";

export function useCourtsPage() {
  const [date, setDate] = useState(todayIso);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof courtsPage>>["data"] | null>(null);
  const request = useRef(0);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    void courtsPage(dataConnect, { date })
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
    () => (data ? toCourtsPage(data, { date, courtId, start, duration }) : null),
    [data, date, courtId, start, duration],
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
