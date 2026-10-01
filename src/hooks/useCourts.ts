import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { courtHoldsCol, courtsCol } from "../lib/paths";
import type { Court, CourtHold } from "../lib/types";

function mapCourt(id: string, data: Record<string, unknown>): Court {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    description: typeof data.description === "string" ? data.description : "",
    hourlyRate: typeof data.hourlyRate === "number" ? data.hourlyRate : 0,
    active: data.active !== false,
    order: typeof data.order === "number" ? data.order : 0,
  };
}

function mapHold(id: string, data: Record<string, unknown>): CourtHold {
  return {
    id,
    courtId: typeof data.courtId === "string" ? data.courtId : "",
    date: typeof data.date === "string" ? data.date : "",
    startTime: typeof data.startTime === "string" ? data.startTime : "",
    endTime: typeof data.endTime === "string" ? data.endTime : "",
    source: data.source === "match" ? "match" : "manual",
    matchId: typeof data.matchId === "string" ? data.matchId : undefined,
    note: typeof data.note === "string" ? data.note : "",
  };
}

export function useCourts(enabled = true) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setCourts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      courtsCol(),
      (snap) => {
        const list = snap.docs.map((docSnap) =>
          mapCourt(docSnap.id, docSnap.data() as Record<string, unknown>),
        );
        list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        setCourts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando canchas:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [enabled]);

  return { courts, loading };
}

/** Apartados entre dos fechas inclusive. `from === to` usa igualdad. */
export function useCourtHolds(from: string | null, to: string | null) {
  const [holds, setHolds] = useState<CourtHold[]>([]);
  const [loading, setLoading] = useState(Boolean(from && to));

  useEffect(() => {
    if (!from || !to) {
      setHolds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const source =
      from === to
        ? query(courtHoldsCol(), where("date", "==", from))
        : query(
            courtHoldsCol(),
            where("date", ">=", from),
            where("date", "<=", to),
          );
    const unsub = onSnapshot(
      source,
      (snap) => {
        setHolds(
          snap.docs.map((docSnap) =>
            mapHold(docSnap.id, docSnap.data() as Record<string, unknown>),
          ),
        );
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando apartados:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [from, to]);

  return { holds, loading };
}
