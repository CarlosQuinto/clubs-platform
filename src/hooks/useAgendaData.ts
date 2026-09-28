import { useMemo } from "react";

export function useAgendaData(events: any[]) {
  // ─── CÁLCULO DEL RÉCORD DEL CLUB ───
  const statsClub = useMemo(() => {
    let jugados = 0,
      ganados = 0,
      perdidos = 0,
      entrenamientos = 0;

    events
      .filter(
        (e: any) => new Date(e.eventDate + "T" + e.eventTime) < new Date(),
      )
      .forEach((ev: any) => {
        if (ev.eventType === "Entrenamiento") {
          entrenamientos++;
        } else if (ev.eventType === "Partido") {
          if (ev.matchType === "Amistoso") {
            // 👇 Los amistosos cuentan como entrenamiento para el club también 👇
            entrenamientos++;
          } else {
            // 👇 Partidos Oficiales (Suman al récord) 👇
            jugados++;

            if (ev.scoreOurs !== undefined && ev.scoreTheirs !== undefined) {
              if (ev.scoreOurs > ev.scoreTheirs) {
                ganados++;
              } else if (ev.scoreOurs < ev.scoreTheirs) {
                perdidos++;
              } else if (ev.scoreOurs === ev.scoreTheirs) {
                // 👇 MAGIA: Desempatamos usando los penales (si existen) 👇
                if (ev.penaltiesOurs != null && ev.penaltiesTheirs != null) {
                  if (ev.penaltiesOurs > ev.penaltiesTheirs) ganados++;
                  if (ev.penaltiesOurs < ev.penaltiesTheirs) perdidos++;
                }
              }
            }
          }
        }
      });

    return { jugados, ganados, perdidos, entrenamientos };
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
        (e) => new Date(e.eventDate + "T" + e.eventTime) >= now,
      ),
      // Eventos pasados
      pastEvents: sorted.filter(
        (e) => new Date(e.eventDate + "T" + e.eventTime) < now,
      ),
    };
  }, [events]);

  return {
    statsClub,
    nextEvents,
    pastEvents,
  };
}
