import { isoDate } from "../../shared/helpers";

export type LiveMatchPhase = "upcoming" | "live" | "finished";

const MINUTE = 60_000;
const TIME_RE = /^(\d{2}):(\d{2})$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Inicio y fin (con margen) del partido, en hora local; null si fecha u hora no son válidas. */
export function liveMatchWindow(
  matchDate: string,
  startTime: string,
  durationMinutes: number,
  marginMinutes: number,
): { start: number; end: number } | null {
  const date = DATE_RE.exec(matchDate.slice(0, 10));
  const time = TIME_RE.exec(startTime);
  if (!date || !time) return null;
  const start = new Date(
    Number(date[1]),
    Number(date[2]) - 1,
    Number(date[3]),
    Number(time[1]),
    Number(time[2]),
  ).getTime();
  if (!Number.isFinite(start)) return null;
  return { start, end: start + (durationMinutes + marginMinutes) * MINUTE };
}

/**
 * Fase del partido en la portada: «live» desde el inicio hasta la hora de fin más el margen,
 * «finished» después y solo durante el día del partido. null = ya no se muestra.
 */
export function liveMatchPhase(
  matchDate: string,
  startTime: string,
  durationMinutes: number,
  marginMinutes: number,
  now: Date,
): LiveMatchPhase | null {
  const window = liveMatchWindow(matchDate, startTime, durationMinutes, marginMinutes);
  if (!window) return null;
  const at = now.getTime();
  if (at < window.start) return "upcoming";
  if (at < window.end) return "live";
  return matchDate.slice(0, 10) === isoDate(now) ? "finished" : null;
}
