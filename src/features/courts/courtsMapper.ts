import type { CourtsPageData } from "../../../dataconnect/generated";
import {
  daySlotStarts,
  formatDuration,
  fromMinutes,
  maxFreeMinutes,
  slotOccupied,
  weekdayOf,
} from "../../lib/courts";
import { whatsappUrl } from "../../lib/social";
import { asCourtSlot, type CourtHold, type TimeWindow, type Weekday } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../utils/helpers";
import type { CourtsPageView } from "./courtsViewState";

export interface CourtsSelection {
  date: string;
  courtId: string | null;
  start: number | null;
  duration: number;
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
  const starts = day ? daySlotStarts(windows, day, slot) : [];
  const freeStarts = selected
    ? starts.filter((minutes) => !slotOccupied(holds, selected.id, selection.date, minutes, slot))
    : [];
  const maxMinutes =
    selected == null || selection.start == null
      ? 0
      : maxFreeMinutes({
          holds,
          courtId: selected.id,
          date: selection.date,
          start: selection.start,
          slotMinutes: slot,
          openWindows: windows,
        });
  const durations: number[] = [];
  for (let minutes = slot; minutes <= maxMinutes; minutes += slot) durations.push(minutes);
  const chosen = durations.includes(selection.duration) ? selection.duration : durations[0] || 0;
  const end = selection.start == null || !chosen ? null : selection.start + chosen;
  const cost = selected == null || end == null ? null : (selected.hourlyRate * chosen) / 60;
  const whatsappHref =
    selected == null || end == null || selection.start == null
      ? null
      : whatsappUrl(
          whatsapp,
          `Hola, quiero apartar ${selected.name} el ${formatFriendlyDate(selection.date)} de ${formatFriendlyTime(fromMinutes(selection.start))} a ${formatFriendlyTime(fromMinutes(end))} (${formatDuration(chosen)}).`,
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
      priceLabel: `$${money(court.hourlyRate)} / hora`,
      imageUrl: court.imageUrl?.trim() || null,
      selected: court.id === selected?.id,
    })),
    date: selection.date,
    slots: freeStarts.map((minutes) => ({
      minutes,
      label: formatFriendlyTime(fromMinutes(minutes)),
      selected: minutes === selection.start,
    })),
    dayClosed: starts.length === 0,
    fullyBooked: starts.length > 0 && freeStarts.length === 0,
    durations: durations.map((minutes) => ({
      minutes,
      label: formatDuration(minutes),
    })),
    duration: durations.length === 0 ? "" : String(chosen),
    summary:
      availability === "ready" && selected && end != null && cost != null && selection.start != null
        ? {
            imageUrl: selected.imageUrl?.trim() || null,
            name: selected.name,
            dateLabel: formatFriendlyDate(selection.date),
            rangeLabel: `${formatFriendlyTime(fromMinutes(selection.start))} – ${formatFriendlyTime(fromMinutes(end))} · ${formatDuration(chosen)}`,
            priceLabel: `$${money(cost)} estimados`,
            whatsappHref,
          }
        : null,
  };
}
