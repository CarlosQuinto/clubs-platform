import type {
  Court,
  CourtHold,
  CourtSlotMinutes,
  TimeWindow,
  Weekday,
} from "./types";
import { asCourtSlot } from "./types";

const TIME_RE = /^(\d{2}):(\d{2})$/;

export function toMinutes(value: string): number | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function weekdayOf(isoDate: string): Weekday | null {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const js = new Date(year, month - 1, day).getDay();
  return (js === 0 ? 7 : js) as Weekday;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Acota una fecha YYYY-MM-DD. Un extremo vacío no limita. */
export function clampIsoDate(value: string, min?: string, max?: string): string {
  let next = value;
  if (min && next < min) next = min;
  if (max && next > max) next = max;
  return next;
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

export function readWindows(value: unknown): TimeWindow[] {
  if (!Array.isArray(value)) return [];
  const windows: TimeWindow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { day?: unknown; start?: unknown; end?: unknown };
    const day = Number(row.day);
    const start = typeof row.start === "string" ? row.start : "";
    const end = typeof row.end === "string" ? row.end : "";
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (day < 1 || day > 7 || startMin == null || endMin == null || startMin >= endMin) {
      continue;
    }
    windows.push({ day: day as Weekday, start, end });
  }
  return windows;
}

export function windowsOnDay(windows: TimeWindow[], day: Weekday): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const window of windows) {
    if (window.day !== day) continue;
    const start = toMinutes(window.start);
    const end = toMinutes(window.end);
    if (start == null || end == null || start >= end) continue;
    ranges.push([start, end]);
  }
  return ranges;
}

function intersect(a0: number, a1: number, b0: number, b1: number): [number, number] | null {
  const start = Math.max(a0, b0);
  const end = Math.min(a1, b1);
  return start < end ? [start, end] : null;
}

export function intersectRanges(
  left: Array<[number, number]>,
  right: Array<[number, number]>,
): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const [a0, a1] of left) {
    for (const [b0, b1] of right) {
      const hit = intersect(a0, a1, b0, b1);
      if (hit) ranges.push(hit);
    }
  }
  return ranges;
}

export function rangesOverlap(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 && b0 < a1;
}

export function rangeFitsOpen(
  openWindows: TimeWindow[],
  day: Weekday,
  start: number,
  end: number,
) {
  return windowsOnDay(openWindows, day).some(([a, b]) => start >= a && end <= b);
}

export function isRangeFree(
  holds: CourtHold[],
  courtId: string,
  date: string,
  start: number,
  end: number,
  ignoreMatchId?: string,
) {
  for (const hold of holds) {
    if (hold.courtId !== courtId || hold.date !== date) continue;
    if (ignoreMatchId && hold.matchId === ignoreMatchId) continue;
    const holdStart = toMinutes(hold.startTime);
    const holdEnd = toMinutes(hold.endTime);
    if (holdStart == null || holdEnd == null) continue;
    if (rangesOverlap(start, end, holdStart, holdEnd)) return false;
  }
  return true;
}

/** Inicios de slot que caben completos dentro de los rangos. */
export function slotStartsIn(
  ranges: Array<[number, number]>,
  slotMinutes: number,
  duration: number,
): number[] {
  const starts = new Set<number>();
  for (const [rangeStart, rangeEnd] of ranges) {
    let cursor = Math.ceil(rangeStart / slotMinutes) * slotMinutes;
    while (cursor + duration <= rangeEnd) {
      starts.add(cursor);
      cursor += slotMinutes;
    }
  }
  return [...starts].sort((a, b) => a - b);
}

export function daySlotStarts(
  openWindows: TimeWindow[],
  day: Weekday,
  slotMinutes: CourtSlotMinutes,
): number[] {
  return slotStartsIn(windowsOnDay(openWindows, day), slotMinutes, slotMinutes);
}

/** Minutos libres y continuos desde `start`, dentro de la misma ventana de apertura. */
export function maxFreeMinutes(opts: {
  holds: CourtHold[];
  courtId: string;
  date: string;
  start: number;
  slotMinutes: number;
  openWindows: TimeWindow[];
}): number {
  const day = weekdayOf(opts.date);
  if (!day) return 0;
  const window = windowsOnDay(opts.openWindows, day).find(
    ([openStart, openEnd]) => opts.start >= openStart && opts.start < openEnd,
  );
  if (!window) return 0;
  let end = opts.start;
  while (end + opts.slotMinutes <= window[1]) {
    if (
      !isRangeFree(
        opts.holds,
        opts.courtId,
        opts.date,
        end,
        end + opts.slotMinutes,
      )
    ) {
      break;
    }
    end += opts.slotMinutes;
  }
  return end - opts.start;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest} min`;
  if (rest === 0) return hours === 1 ? "1 hora" : `${hours} horas`;
  return `${hours} h ${rest} min`;
}

export function courtsFreeAt(opts: {
  courts: Court[];
  holds: CourtHold[];
  openWindows: TimeWindow[];
  date: string;
  time: string;
  slotMinutes: CourtSlotMinutes;
  duration: number;
  ignoreMatchId?: string;
}): Court[] {
  const start = toMinutes(opts.time);
  const day = weekdayOf(opts.date);
  if (start == null || !day) return [];
  if (start % opts.slotMinutes !== 0) return [];
  const end = start + opts.duration;
  if (!rangeFitsOpen(opts.openWindows, day, start, end)) return [];
  return opts.courts
    .filter((court) => court.active)
    .filter((court) =>
      isRangeFree(
        opts.holds,
        court.id,
        opts.date,
        start,
        end,
        opts.ignoreMatchId,
      ),
    )
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export interface SlotSuggestion {
  date: string;
  time: string;
  courtId: string;
  courtName: string;
}

export function suggestSlots(opts: {
  fromDate: string;
  days: number;
  slotMinutes: CourtSlotMinutes;
  duration: number;
  openWindows: TimeWindow[];
  homeWindows: TimeWindow[];
  awayWindows: TimeWindow[];
  courts: Court[];
  holds: CourtHold[];
  ignoreMatchId?: string;
  clubBusy?: Array<{ date: string; start: number; end: number }>;
}): SlotSuggestion[] {
  const active = opts.courts
    .filter((court) => court.active && court.football !== false)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const found: SlotSuggestion[] = [];
  for (let offset = 0; offset < opts.days && found.length < 3; offset += 1) {
    const date = addDays(opts.fromDate, offset);
    const day = weekdayOf(date);
    if (!day) continue;
    const shared = intersectRanges(
      intersectRanges(
        windowsOnDay(opts.openWindows, day),
        windowsOnDay(opts.homeWindows, day),
      ),
      windowsOnDay(opts.awayWindows, day),
    );
    const starts = slotStartsIn(shared, opts.slotMinutes, opts.duration);
    for (const start of starts) {
      const end = start + opts.duration;
      const clubTaken = opts.clubBusy?.some(
        (busy) => busy.date === date && rangesOverlap(start, end, busy.start, busy.end),
      );
      if (clubTaken) continue;
      const court = active.find((item) =>
        isRangeFree(opts.holds, item.id, date, start, end, opts.ignoreMatchId),
      );
      if (!court) continue;
      found.push({
        date,
        time: fromMinutes(start),
        courtId: court.id,
        courtName: court.name,
      });
      if (found.length === 3) break;
    }
  }
  return found;
}

export function readSlotMinutes(value: unknown): CourtSlotMinutes {
  return asCourtSlot(value);
}

export function slotOccupied(
  holds: CourtHold[],
  courtId: string,
  date: string,
  start: number,
  slotMinutes: number,
) {
  return !isRangeFree(holds, courtId, date, start, start + slotMinutes);
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function shortSlotLabel(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return `${date} · ${time}`;
  const js = new Date(year, month - 1, day);
  const weekday = WEEKDAYS[js.getDay()] || "";
  const monthName = MONTHS[month - 1] || "";
  return `${weekday} ${day} ${monthName} · ${time}`;
}
