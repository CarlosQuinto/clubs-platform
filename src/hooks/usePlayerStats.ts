import { useMemo } from "react";
import { generatePlayerAchievements } from "../components/players/playerAchievements";

export function usePlayerStats(
  players: any[],
  events: any[],
  selectedPlayer: any | null,
  goals: any[] = [],
) {
  const safeEvents = Array.isArray(events) ? events : [];

  const clubPlayerStats = useMemo(() => {
    return players.map((p: any) => {
      let goals = 0,
        assists = 0,
        cleanSheets = 0,
        goalsConceded = 0,
        saves = 0;

      let matchesAttended = 0,
        trainingsAttended = 0,
        mvps = 0;
      let yellowCards = 0,
        redCards = 0;
      let matchesManaged = 0,
        winsManaged = 0;

      safeEvents
        .filter(
          (e: any) => new Date(e.eventDate + "T" + e.eventTime) < new Date(),
        )
        .forEach((ev: any) => {
          const attended = (ev.attendees || []).some(
            (att: string) => att === p.id || att === p.name,
          );

          if (ev.eventType === "Entrenamiento") {
            if (attended) trainingsAttended++;
          } else if (ev.eventType === "Partido") {
            // 👇 NUEVA LÓGICA DE ASISTENCIAS 👇
            if (attended) {
              if (ev.matchType === "Amistoso") {
                trainingsAttended++; // Los amistosos suman como entrenamiento
              } else {
                matchesAttended++; // Solo los oficiales suman como partido
              }
            }

            // 👇 El resto de estadísticas SOLO si NO ES Amistoso 👇
            if (ev.matchType !== "Amistoso") {
              if (ev.manager === p.id || ev.manager === p.name) {
                matchesManaged++;
                const golesAFavor =
                  ev.scoreOurs !== undefined
                    ? ev.scoreOurs
                    : ev.stats
                      ? ev.stats.filter((s: any) => s.scorer).length
                      : 0;
                const golesEnContra = ev.scoreTheirs || 0;
                if (golesAFavor > golesEnContra) {
                  winsManaged++;
                }
              }

              ev.stats?.forEach((s: any) => {
                if (s.scorer === p.id || s.scorer === p.name) goals++;
                if (s.assist === p.id || s.assist === p.name) assists++;
              });

              if (
                ev.goalkeepers &&
                Array.isArray(ev.goalkeepers) &&
                ev.goalkeepers.length > 0
              ) {
                const gkEntry = ev.goalkeepers.find(
                  (gk: any) => gk.id === p.id || gk.id === p.name,
                );
                if (gkEntry) {
                  goalsConceded += gkEntry.conceded || 0;
                  saves += gkEntry.saves || 0;
                  if ((gkEntry.conceded || 0) === 0) cleanSheets++;
                }
              } else if (ev.goalkeeper) {
                if (ev.goalkeeper === p.id || ev.goalkeeper === p.name) {
                  goalsConceded += ev.scoreTheirs || 0;
                  if (ev.scoreTheirs === 0) cleanSheets++;
                }
              }

              if (ev.mvp === p.id || ev.mvp === p.name) mvps++;

              yellowCards += (ev.yellowCards || []).filter(
                (id: string) => id === p.id || id === p.name,
              ).length;

              redCards += (ev.redCards || []).filter(
                (id: string) => id === p.id || id === p.name,
              ).length;
            }
          }
        });

      return {
        ...p,
        goals,
        assists,
        cleanSheets,
        goalsConceded,
        saves,
        matchesAttended,
        trainingsAttended,
        mvps,
        yellowCards,
        redCards,
        matchesManaged,
        winsManaged,
        totalAttendance: matchesAttended + trainingsAttended,
      };
    });
  }, [players, safeEvents]);

  const selectedPlayerAchievements = useMemo(() => {
    if (!selectedPlayer) return [];
    const pStats = clubPlayerStats.find((p: any) => p.id === selectedPlayer.id);

    return generatePlayerAchievements(
      selectedPlayer,
      pStats,
      safeEvents,
      goals,
    );
  }, [selectedPlayer, clubPlayerStats, safeEvents, goals]);

  return {
    clubPlayerStats,
    selectedPlayerAchievements,
  };
}
