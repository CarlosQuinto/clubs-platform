import { type CourtsPageData } from "../../infrastructure/dataconnect";
import {
  daySlotStarts,
  formatDuration,
  fromMinutes,
  maxFreeMinutes,
  slotOccupied,
  weekdayOf,
} from "../../domains/courts/courts";
import { whatsappUrl } from "../../domains/platform/social";
import { asCourtSlot, type CourtHold, type TimeWindow, type Weekday } from "../../shared/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../shared/helpers";
import type { CourtsPageView } from "./courtsViewState";

export interface CourtsSelection {
  date: string;
  courtId: string | null;
  start: number | null;
  duration: number;
  /** Fecha de hoy (YYYY-MM-DD) y minuto del día actual, en hora local. */
  today: string;
  nowMinutes: number;
}

function money(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function windowsOf(data: CourtsPageData): TimeWindow[] {
  const windows: TimeWindow[] = [];
  for (const window of data.courtOpenWindows) {
    const day = window.weekday;
    if (day < 1 || day > 7 || window.startTime >= window.endTime) continue;
    windows.push({
      day: day as Weekday,
      start: window.startTime,
      end: window.endTime,
    });
  }
  return windows;
}

function holdsOf(data: CourtsPageData, date: string): CourtHold[] {
  return data.courtHolds.map((hold, index) => ({
    id: `${hold.court.id}-${index}`,
    courtId: hold.court.id,
    date,
    startTime: hold.startTime,
    endTime: hold.endTime,
    source: "manual",
  }));
}

export function toCourtsPage(data: CourtsPageData, selection: CourtsSelection): CourtsPageView {
  const settings = data.platformSettings;
  const enabled = settings?.courtsEnabled === true;
  const slot = asCourtSlot(settings?.courtSlotMinutes);
  const windows = windowsOf(data);
  const holds = holdsOf(data, selection.date);
  const whatsapp = settings?.whatsapp?.trim() || "";
  const courts = data.courts;
  const selected = courts.find((court) => court.id === selection.courtId) || courts[0] || null;
  const day = weekdayOf(selection.date);
  const past = selection.date < selection.today;
  const starts = day ? daySlotStarts(windows, day, slot) : [];
  // Hoy solo se ofrecen los horarios que aún no empiezan; un día pasado no ofrece ninguno.
  const upcoming = past
    ? []
    : selection.date === selection.today
      ? starts.filter((minutes) => minutes > selection.nowMinutes)
      : starts;
  const freeStarts = selected
    ? upcoming.filter((minutes) => !slotOccupied(holds, selected.id, selection.date, minutes, slot))
    : [];
  // Un horario elegido que ya pasó (o se ocupó al recargar) deja de contar.
  const start = selection.start != null && freeStarts.includes(selection.start) ? selection.start : null;
  const maxMinutes =
    selected == null || start == null
      ? 0
      : maxFreeMinutes({
          holds,
          courtId: selected.id,
          date: selection.date,
          start,
          slotMinutes: slot,
          openWindows: windows,
        });
  const durations: number[] = [];
  for (let minutes = slot; minutes <= maxMinutes; minutes += slot) durations.push(minutes);
  const chosen = durations.includes(selection.duration) ? selection.duration : durations[0] || 0;
  const end = start == null || !chosen ? null : start + chosen;
  const cost = selected == null || end == null ? null : (selected.hourlyRate * chosen) / 60;
  const whatsappHref =
    selected == null || end == null || start == null
      ? null
      : whatsappUrl(
          whatsapp,
          `Hola, quiero apartar ${selected.name} el ${formatFriendlyDate(selection.date)} de ${formatFriendlyTime(fromMinutes(start))} a ${formatFriendlyTime(fromMinutes(end))} (${formatDuration(chosen)}).`,
        ) || null;

  let availability: CourtsPageView["availability"] = "ready";
  if (!enabled) availability = "disabled";
  else if (windows.length === 0) availability = "no-hours";
  else if (!selected) availability = "no-courts";

  return {
    availability,
    whatsappMissing: !whatsapp,
    courts: courts.map((court) => ({
      id: court.id,
      name: court.name,
      description: court.description.trim() || null,
      // `?? ""`: un conector desplegado antes de este cambio no devuelve la columna.
      location: (court.location ?? "").trim() || null,
      priceLabel: `$${money(court.hourlyRate)} / hora`,
      imageUrl: court.imageUrl?.trim() || null,
      selected: court.id === selected?.id,
    })),
    date: selection.date,
    minDate: selection.today,
    slots: freeStarts.map((minutes) => ({
      minutes,
      label: formatFriendlyTime(fromMinutes(minutes)),
      selected: minutes === start,
    })),
    noSlots: past
      ? "past"
      : starts.length === 0
        ? "closed"
        : upcoming.length === 0
          ? "over"
          : freeStarts.length === 0
            ? "booked"
            : null,
    durations: durations.map((minutes) => ({
      minutes,
      label: formatDuration(minutes),
    })),
    duration: durations.length === 0 ? "" : String(chosen),
    summary:
      availability === "ready" && selected && end != null && cost != null && start != null
        ? {
            imageUrl: selected.imageUrl?.trim() || null,
            name: selected.name,
            dateLabel: formatFriendlyDate(selection.date),
            rangeLabel: `${formatFriendlyTime(fromMinutes(start))} – ${formatFriendlyTime(fromMinutes(end))} · ${formatDuration(chosen)}`,
            priceLabel: `Total: $${money(cost)}`,
            whatsappHref,
          }
        : null,
  };
}
