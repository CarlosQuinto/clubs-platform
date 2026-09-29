import { useMemo } from "react";

export function useAgendaData(events: any[]) {
  const statsClub = useMemo(() => {
    let entrenamientos = 0,
      amistosos = 0,
      oficiales = 0;

    events
      .filter(
        (e: any) => new Date(e.eventDate + "T" + (e.eventTime || "00:00")) < new Date(),
      )
      .forEach((ev: any) => {
        if (ev.eventType === "Entrenamiento") {
          entrenamientos++;
        } else if (ev.isOfficial || ev.matchType === "Oficial") {
          oficiales++;
        } else if (ev.eventType === "Partido") {
          amistosos++;
        }
      });

    return {
      entrenamientos,
      amistosos,
      oficiales,
      total: entrenamientos + amistosos + oficiales,
    };
  }, [events]);

  // ─── FILTRO Y ORDENAMIENTO DE EVENTOS ───
  const { nextEvents, pastEvents } = useMemo(() => {
    const now = new Date();

    // Ordenamos todos los eventos cronológicamente (del más antiguo al más nuevo)
    const sorted = [...events].sort(
      (a: any, b: any) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    );

    return {
      // Eventos futuros (incluyendo los que están pasando hoy/ahora)
      nextEvents: sorted.filter(
        (e) => new Date(e.eventDate + "T" + (e.eventTime || "00:00")) >= now,
      ),
      pastEvents: sorted.filter(
        (e) => new Date(e.eventDate + "T" + (e.eventTime || "00:00")) < now,
      ),
    };
  }, [events]);

  return {
    statsClub,
    nextEvents,
    pastEvents,
  };
}
