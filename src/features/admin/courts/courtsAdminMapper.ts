import { type AdminCourtsData } from "../../../infrastructure/dataconnect";
import { readWindows } from "../../../domains/courts/courts";
import {
  asCourtSlot,
  type Court,
  type CourtHold,
  type CourtSlotMinutes,
  type TimeWindow,
} from "../../../shared/types";

export interface CourtsAdminView {
  enabled: boolean;
  slot: CourtSlotMinutes;
  windows: TimeWindow[];
  courts: Court[];
  holds: CourtHold[];
}

export const EMPTY_COURTS_ADMIN: CourtsAdminView = {
  enabled: false,
  slot: 60,
  windows: [],
  courts: [],
  holds: [],
};

export function toCourtsAdmin(data: AdminCourtsData): CourtsAdminView {
  const settings = data.platformSettings;
  return {
    enabled: settings?.courtsEnabled === true,
    slot: asCourtSlot(settings?.courtSlotMinutes),
    windows: readWindows(
      data.courtOpenWindows.map((window) => ({
        day: window.weekday,
        start: window.startTime,
        end: window.endTime,
      })),
    ),
    courts: data.courts.map((court) => ({
      id: court.id,
      name: court.name,
      description: court.description,
      location: court.location ?? "",
      hourlyRate: court.hourlyRate,
      active: court.active,
      order: court.sortOrder,
      imageUrl: court.imageUrl || "",
      football: court.football,
    })),
    holds: data.courtHolds.map((hold) => ({
      id: hold.id,
      courtId: hold.court.id,
      date: hold.holdDate,
      startTime: hold.startTime,
      endTime: hold.endTime,
      source: hold.source === "MATCH" ? "match" : "manual",
      matchId: hold.match?.id,
      homeClubName: hold.match?.homeClub.name,
      awayClubName: hold.match?.awayClub.name,
      matchDurationMinutes: hold.match?.tournament.durationMinutes,
      matchStartDate: hold.match?.tournament.startDate || undefined,
      note: hold.note,
      guestEmail: hold.guestEmail,
    })),
  };
}
