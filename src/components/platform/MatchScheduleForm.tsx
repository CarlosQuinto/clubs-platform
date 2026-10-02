import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { onSnapshot } from "firebase/firestore";
import { Clock } from "lucide-react";
import { availabilityRef } from "../../lib/paths";
import type { Court, CourtHold, Match, TimeWindow } from "../../lib/types";
import { asCourtSlot, asMatchDuration, type CourtSlotMinutes, type MatchDurationMinutes } from "../../lib/types";
import {
  courtsFreeAt,
  readWindows,
  shortSlotLabel,
  suggestSlots,
  todayIso,
  type SlotSuggestion,
} from "../../lib/courts";
import { scheduleMatch } from "../../lib/scheduleMatch";
import { formatFriendlyTime } from "../../utils/helpers";
import { C, FormInput, FormSelect, PrimaryButton } from "../ui";

export type MatchScheduleResources = {
  courtsEnabled: boolean;
  slotMinutes: CourtSlotMinutes;
  openWindows: TimeWindow[];
  courts: Court[];
  holds: CourtHold[];
  /** Canchas y apartados ya cargados. La disponibilidad de cada equipo la pide el formulario. */
  ready: boolean;
};

export function scheduleResources(input: {
  courtsEnabled: boolean;
  courtSlotMinutes: unknown;
  courtOpenWindows: unknown;
  courts: Court[];
  holds: CourtHold[];
  holdsLoading: boolean;
}): MatchScheduleResources {
  return {
    courtsEnabled: input.courtsEnabled,
    slotMinutes: asCourtSlot(input.courtSlotMinutes),
    openWindows: readWindows(input.courtOpenWindows),
    courts: input.courts.filter((court) => court.football !== false),
    holds: input.holds,
    ready: !input.courtsEnabled || !input.holdsLoading,
  };
}

/**
 * Fecha, hora y cancha o sede de un partido oficial.
 * El mismo formulario del calendario de torneo.
 */
export default function MatchScheduleForm({
  match,
  schedule,
  startDate,
  durationMinutes,
  onSaved,
}: {
  match: Match;
  schedule: MatchScheduleResources;
  startDate?: string;
  durationMinutes?: MatchDurationMinutes;
  onSaved?: () => void;
}) {
  const [date, setDate] = useState(match.date || "");
  const [time, setTime] = useState(match.time || "");
  const [venue, setVenue] = useState(match.venue || "");
  const [courtId, setCourtId] = useState(match.courtId || "");
  const [busy, setBusy] = useState(false);
  const { availability, ready: availabilityReady } = useClubAvailability(
    match.homeClubId,
    match.awayClubId,
    schedule.courtsEnabled,
  );

  useEffect(() => {
    setDate(match.date || "");
    setTime(match.time || "");
    setVenue(match.venue || "");
    setCourtId(match.courtId || "");
  }, [match.date, match.time, match.venue, match.courtId]);

  const duration = asMatchDuration(durationMinutes);
  const freeCourts = useMemo(() => {
    if (!schedule.courtsEnabled || !date || !time) return [];
    return courtsFreeAt({
      courts: schedule.courts,
      holds: schedule.holds,
      openWindows: schedule.openWindows,
      date,
      time,
      slotMinutes: schedule.slotMinutes,
      duration,
      ignoreMatchId: match.id,
    });
  }, [schedule, date, time, duration, match.id]);

  useEffect(() => {
    if (!schedule.courtsEnabled || !schedule.ready || !courtId || !date || !time) return;
    if (!freeCourts.some((court) => court.id === courtId)) setCourtId("");
  }, [schedule.courtsEnabled, schedule.ready, courtId, date, time, freeCourts]);

  const homeWindows = availability[match.homeClubId] || [];
  const awayWindows = availability[match.awayClubId] || [];
  const hasAvailability = homeWindows.length > 0 && awayWindows.length > 0;
  const suggestions = useMemo(() => {
    if (!schedule.courtsEnabled || !schedule.ready || !availabilityReady || !hasAvailability) {
      return [];
    }
    const today = todayIso();
    const start = startDate && startDate > today ? startDate : today;
    return suggestSlots({
      fromDate: start,
      days: 21,
      slotMinutes: schedule.slotMinutes,
      duration,
      openWindows: schedule.openWindows,
      homeWindows,
      awayWindows,
      courts: schedule.courts,
      holds: schedule.holds,
      ignoreMatchId: match.id,
    });
  }, [
    schedule,
    availabilityReady,
    hasAvailability,
    startDate,
    duration,
    homeWindows,
    awayWindows,
    match.id,
  ]);

  const applySuggestion = (slot: SlotSuggestion) => {
    setDate(slot.date);
    setTime(slot.time);
    setCourtId(slot.courtId);
    setVenue(slot.courtName);
  };

  const saveSchedule = async () => {
    try {
      setBusy(true);
      const chosen = freeCourts.find((court) => court.id === courtId);
      await scheduleMatch({
        matchId: match.id,
        date,
        time,
        venue: schedule.courtsEnabled ? chosen?.name || "" : venue.trim(),
        courtId: schedule.courtsEnabled ? (chosen ? courtId : "") : "",
      });
      onSaved?.();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      alert(message || "No se pudo guardar la programación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="match-schedule">
      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem" }}>
          <span style={matchFieldLabel}>Fechas sugeridas</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.28rem" }}>
            {suggestions.map((slot) => (
              <button
                key={`${slot.date}-${slot.time}-${slot.courtId}`}
                type="button"
                onClick={() => applySuggestion(slot)}
                style={{
                  border: "1px solid rgba(229, 223, 211, 0.7)",
                  background: "rgba(252, 250, 248, 0.55)",
                  color: C.navy900,
                  borderRadius: 7,
                  padding: "0.16rem 0.38rem",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {shortSlotLabel(slot.date, slot.time)} · {slot.courtName}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="match-edit-when">
        <label style={matchField}>
          <span style={matchFieldLabel}>Fecha</span>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Fecha"
            style={compactInput}
          />
        </label>
        <div style={matchField}>
          <span style={matchFieldLabel}>Hora</span>
          <TimeField value={time} onChange={setTime} />
        </div>
      </div>
      {schedule.courtsEnabled ? (
        <label style={matchField}>
          <span style={matchFieldLabel}>Cancha</span>
          <FormSelect
            aria-label="Cancha"
            value={freeCourts.some((court) => court.id === courtId) ? courtId : ""}
            disabled={!date || !time}
            onChange={(e) => {
              const next = e.target.value;
              setCourtId(next);
              const court = freeCourts.find((item) => item.id === next);
              setVenue(court?.name || "");
            }}
            style={compactInput}
          >
            <option value="">
              {!date || !time
                ? "Elige fecha y hora"
                : freeCourts.length
                  ? "Sin cancha"
                  : "Ninguna cancha libre en ese horario"}
            </option>
            {freeCourts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </FormSelect>
        </label>
      ) : (
        <label style={matchField}>
          <span style={matchFieldLabel}>Sede</span>
          <FormInput
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Sede"
            aria-label="Sede"
            style={compactInput}
          />
        </label>
      )}
      <div className="match-edit-actions">
        <PrimaryButton
          type="button"
          disabled={busy}
          onClick={() => void saveSchedule()}
          style={compactBtn}
        >
          {busy ? "…" : "Guardar"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function useClubAvailability(homeId: string, awayId: string, enabled: boolean) {
  const [availability, setAvailability] = useState<Record<string, TimeWindow[]>>({});
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled || !homeId || !awayId) {
      setAvailability({});
      setReady(true);
      return;
    }
    setReady(false);
    const pending = new Set([homeId, awayId]);
    const mark = (clubId: string) => {
      pending.delete(clubId);
      if (pending.size === 0) setReady(true);
    };
    const listen = (clubId: string) =>
      onSnapshot(
        availabilityRef(clubId),
        (snap) => {
          setAvailability((prev) => ({
            ...prev,
            [clubId]: readWindows(snap.data()?.windows),
          }));
          mark(clubId);
        },
        () => mark(clubId),
      );
    const unsubs = [...new Set([homeId, awayId])].map(listen);
    return () => unsubs.forEach((unsub) => unsub());
  }, [enabled, homeId, awayId]);

  return { availability, ready };
}

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parseClock(value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    rootRef.current.querySelectorAll(".time-pick__opt.is-on").forEach((node) => {
      const el = node as HTMLElement;
      const col = el.parentElement;
      if (!col) return;
      col.scrollTop = el.offsetTop - col.clientHeight / 2 + el.clientHeight / 2;
    });
  }, [open, value]);

  const pick = (part: Partial<{ h12: number; minute: number; pm: boolean }>) => {
    const base = parsed ?? { h12: 12, minute: 0, pm: false };
    onChange(toClock({ ...base, ...part }));
  };

  return (
    <div className="time-pick" ref={rootRef}>
      <button
        type="button"
        className="time-pick__btn"
        aria-label="Hora"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? undefined : "time-pick__placeholder"}>
          {value ? formatFriendlyTime(value) : "Hora"}
        </span>
        <Clock size={14} />
      </button>
      {open && (
        <div className="time-pick__pop" role="listbox" aria-label="Elegir hora">
          <div className="time-pick__col">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                className={`time-pick__opt${parsed?.h12 === hour ? " is-on" : ""}`}
                onClick={() => pick({ h12: hour })}
              >
                {String(hour).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="time-pick__col">
            {MINUTES.map((minute) => (
              <button
                key={minute}
                type="button"
                className={`time-pick__opt${parsed?.minute === minute ? " is-on" : ""}`}
                onClick={() => pick({ minute })}
              >
                {String(minute).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="time-pick__col time-pick__col--period">
            {(["AM", "PM"] as const).map((period) => {
              const pm = period === "PM";
              return (
                <button
                  key={period}
                  type="button"
                  className={`time-pick__opt${parsed && parsed.pm === pm ? " is-on" : ""}`}
                  onClick={() => pick({ pm })}
                >
                  {period}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parseClock(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 > 23 || minute > 59) return null;
  const pm = hour24 >= 12;
  const h12 = hour24 % 12 || 12;
  return { h12, minute, pm };
}

function toClock(parts: { h12: number; minute: number; pm: boolean }) {
  let hour = parts.h12 % 12;
  if (parts.pm) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

const compactInput: CSSProperties = {
  padding: "0.35rem 0.5rem",
  fontSize: "0.78rem",
};

const compactBtn: CSSProperties = {
  padding: "0.35rem 0.6rem",
  fontSize: "0.72rem",
};

const matchField: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
};

const matchFieldLabel: CSSProperties = {
  fontSize: "0.62rem",
  fontWeight: 700,
  color: C.gray500,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
