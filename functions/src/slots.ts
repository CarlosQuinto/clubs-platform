export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TimeWindow {
  day: Weekday;
  start: string;
  end: string;
}

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

export function rangeFitsOpen(
  openWindows: TimeWindow[],
  day: Weekday,
  start: number,
  end: number,
) {
  return openWindows.some((window) => {
    if (window.day !== day) return false;
    const a = toMinutes(window.start);
    const b = toMinutes(window.end);
    if (a == null || b == null) return false;
    return start >= a && end <= b;
  });
}

export function asDuration(value: unknown): 30 | 60 | 90 | 120 {
  return value === 30 || value === 60 || value === 90 || value === 120 ? value : 90;
}

export function asSlot(value: unknown): 30 | 60 {
  return value === 30 ? 30 : 60;
}
