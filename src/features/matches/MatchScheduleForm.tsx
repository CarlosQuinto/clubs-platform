import { useEffect, useMemo, useState } from "react";
import { C, FormInput, FormSelect, PrimaryButton, SecondaryButton } from "../../shared/ui";
import { courtPlaceLabel, shortSlotLabel } from "../../domains/courts/courts";
import { freeCourtsAt, saveMatchSchedule } from "../../domains/matches/matchCommands";
import { loadSlotHints } from "../tournament/tournamentQueries";
import type { Court, CourtSlotMinutes, TimeWindow } from "../../shared/types";

/** Lo que el formulario necesita del partido; lo comparten el calendario del torneo, la portada y /partidos. */
export interface ScheduleTarget {
  id: string;
  isoDate: string;
  /** «HH:MM»; "" sin hora. */
  time: string;
  venue: string;
  /** "" sin cancha. */
  courtId: string;
  homeClubId: string;
  awayClubId: string;
}

/** Programa o reprograma un partido: sugiere horarios, lista solo canchas libres, aparta la cancha y avisa. */
export default function MatchScheduleForm({
  match,
  durationMinutes,
  startDate,
  onSaved,
  onCancel,
}: {
  match: ScheduleTarget;
  durationMinutes: number;
  startDate: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState(match.isoDate);
  const [time, setTime] = useState(match.time);
  const [courtId, setCourtId] = useState(match.courtId);
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [openWindows, setOpenWindows] = useState<TimeWindow[]>([]);
  const [slotMinutes, setSlotMinutes] = useState<CourtSlotMinutes>(60);
  const [freeIds, setFreeIds] = useState<string[] | null>(null);
  const [suggestions, setSuggestions] = useState<{ date: string; time: string; courtId: string; courtName: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadSlotHints({
      homeClubId: match.homeClubId,
      awayClubId: match.awayClubId,
      startDate,
      durationMinutes,
      ignoreMatchId: match.id,
    })
      .then((hints) => {
        if (cancelled) return;
        setCourts(hints.courts);
        setOpenWindows(hints.openWindows);
        setSlotMinutes(hints.slotMinutes);
        setSuggestions(hints.suggestions);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setCourts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [match.homeClubId, match.awayClubId, match.id, startDate, durationMinutes]);

  useEffect(() => {
    if (!date || !time || !courts) {
      setFreeIds(null);
      return;
    }
    let cancelled = false;
    void freeCourtsAt({
      date,
      time,
      durationMinutes,
      ignoreMatchId: match.id,
      courts,
      openWindows,
      slotMinutes,
    })
      .then((free) => {
        if (cancelled) return;
        const ids = free.map((court) => court.id);
        setFreeIds(ids);
        setCourtId((current) => (current && !ids.includes(current) ? "" : current));
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFreeIds(null);
      });
    return () => {
      cancelled = true;
    };
  }, [date, time, courts, openWindows, slotMinutes, durationMinutes, match.id]);

  const listedCourts = useMemo(() => {
    const all = courts || [];
    if (!date || !time || !freeIds) return all;
    return all.filter((court) => freeIds.includes(court.id));
  }, [courts, date, time, freeIds]);

  const save = async () => {
    if (!date || !time) {
      setError("Elige fecha y hora.");
      return;
    }
    const court = courts?.find((item) => item.id === courtId);
    try {
      setBusy(true);
      setError("");
      await saveMatchSchedule({
        matchId: match.id,
        date,
        time,
        startDate,
        venue: court?.name || (courtId ? match.venue : ""),
        courtId,
        durationMinutes,
        courts: courts || [],
        openWindows,
        slotMinutes,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message ? err.message : "No se pudo guardar.");
      setBusy(false);
    }
  };

  return (
    <div className="match-schedule">
      {suggestions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem" }}>
          <span style={fieldLabel}>Fechas sugeridas</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.28rem" }}>
            {suggestions.map((slot) => (
              <button
                key={`${slot.date}-${slot.time}-${slot.courtId}`}
                type="button"
                onClick={() => {
                  setDate(slot.date);
                  setTime(slot.time);
                  setCourtId(slot.courtId);
                }}
                style={suggestionButton}
              >
                {shortSlotLabel(slot.date, slot.time)} · {slot.courtName}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="match-edit-when">
        <label style={field}>
          <span style={fieldLabel}>Fecha</span>
          <FormInput
            type="date"
            value={date}
            min={startDate || undefined}
            aria-label="Fecha"
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label style={field}>
          <span style={fieldLabel}>Hora</span>
          <FormInput type="time" value={time} aria-label="Hora" onChange={(event) => setTime(event.target.value)} />
        </label>
      </div>
      <label style={field}>
        <span style={fieldLabel}>Cancha</span>
        <FormSelect
          aria-label="Cancha"
          value={courtId}
          onChange={(event) => setCourtId(event.target.value)}
        >
          <option value="">Sin cancha</option>
          {listedCourts.map((court) => (
            <option key={court.id} value={court.id}>
              {courtPlaceLabel(court.location, court.name)}
            </option>
          ))}
        </FormSelect>
      </label>
      {error ? <p style={{ margin: 0, color: C.red, fontSize: "0.78rem" }}>{error}</p> : null}
      <div className="match-edit-actions">
        {onCancel ? (
          <SecondaryButton type="button" disabled={busy} onClick={onCancel}>
            Cancelar
          </SecondaryButton>
        ) : null}
        <PrimaryButton type="button" disabled={busy || courts === null} onClick={() => void save()}>
          {busy ? "…" : "Guardar"}
        </PrimaryButton>
      </div>
    </div>
  );
}

const field = { display: "flex", flexDirection: "column", gap: "0.25rem" } as const;
const fieldLabel = {
  fontSize: "0.68rem",
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: C.gray500,
} as const;

const suggestionButton = {
  border: "1px solid rgba(229, 223, 211, 0.7)",
  background: "rgba(252, 250, 248, 0.55)",
  color: C.navy900,
  borderRadius: 7,
  padding: "0.16rem 0.38rem",
  fontSize: "0.62rem",
  fontWeight: 700,
  cursor: "pointer",
} as const;
