import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronDown, ChevronRight, Clock, MapPin, Pencil } from "lucide-react";
import { C, FormInput, FormSelect, PrimaryButton, SectionCard } from "../../components/ui";
import { DEFAULT_CLUB_LOGO } from "../../lib/clubDefaults";
import { shortSlotLabel } from "../../lib/courts";
import { formatFriendlyTime } from "../../utils/helpers";
import { freeCourtsAt, loadMatchSummary, loadSlotHints, saveMatchSchedule } from "./tournamentCommands";
import type { Court, CourtSlotMinutes, TimeWindow } from "../../lib/types";
import MatchScoreModal from "./MatchScoreModal";
import type { CalendarMatchView, MatchSummaryView, RoundView } from "./tournamentViewState";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export default function TournamentCalendarPanel({
  rounds,
  durationMinutes,
  startDate,
  admin,
  onSaved,
}: {
  rounds: RoundView[];
  durationMinutes: number;
  startDate: string;
  admin: boolean;
  onSaved: () => void;
}) {
  if (rounds.length === 0) {
    return (
      <SectionCard title="Calendario" icon={<Calendar size={16} />}>
        <p style={{ margin: 0, color: C.gray400 }}>Este torneo todavía no tiene partidos.</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Calendario" icon={<Calendar size={16} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {rounds.map((round) => (
          <RoundBlock
            key={round.label}
            round={round}
            durationMinutes={durationMinutes}
            startDate={startDate}
            admin={admin}
            onSaved={onSaved}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function RoundBlock({
  round,
  durationMinutes,
  startDate,
  admin,
  onSaved,
}: {
  round: RoundView;
  durationMinutes: number;
  startDate: string;
  admin: boolean;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(!round.collapsed);
  const title = /^\d+$/.test(round.label) ? `Jornada ${round.label}` : round.label;
  const list = (
    <div className="cal-round">
      {round.matches.map((match) => (
        <MatchRow
          key={match.id}
          match={match}
          durationMinutes={durationMinutes}
          startDate={startDate}
          admin={admin}
          onSaved={onSaved}
        />
      ))}
    </div>
  );
  if (!round.collapsed) {
    return (
      <div>
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "0.3rem",
          }}
        >
          {title}
        </div>
        {list}
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.15rem 0 0.35rem",
          marginBottom: open ? "0.2rem" : 0,
          background: "none",
          border: "none",
          borderBottom: `1px solid ${C.gray200}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            color: C.gray600,
            fontWeight: 800,
            fontSize: "0.65rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <ChevronDown
            size={14}
            color={C.gray400}
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
          {title}
        </span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.gray400 }}>
          {round.matches.length} {round.matches.length === 1 ? "partido" : "partidos"}
        </span>
      </button>
      {open ? list : null}
    </div>
  );
}

function dateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month: MONTHS[month - 1] || "", year };
}

function MatchRow({
  match,
  durationMinutes,
  startDate,
  admin,
  onSaved,
}: {
  match: CalendarMatchView;
  durationMinutes: number;
  startDate: string;
  admin: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const when = dateParts(match.isoDate);
  const kickoff = match.time ? formatFriendlyTime(match.time) : "";

  return (
    <div className="cal-match">
      <div className="cal-match__main">
        {match.walkover ? (
          <span className="match-card__date">
            <span className="cal-match__tbd">3-0</span>
          </span>
        ) : when ? (
          <time className="match-card__date" dateTime={match.isoDate}>
            <span className="match-card__day">{when.day}</span>
            <span className="match-card__month">{when.month}</span>
            <span className="match-card__year">{when.year}</span>
          </time>
        ) : (
          <span className="match-card__date">
            <span className="cal-match__tbd">Por definir</span>
          </span>
        )}
        <div className="cal-match__body">
          <div className="cal-match__teams">
            <Side club={match.home} />
            <span className="cal-match__vs">vs</span>
            <Side club={match.away} />
          </div>
          {match.walkover ? (
            <div className="cal-match__meta">
              <span>3-0 por ingreso tardío</span>
            </div>
          ) : (
            (kickoff || match.venue) && (
              <div className="cal-match__meta">
                {kickoff ? (
                  <span>
                    <Clock size={13} />
                    {kickoff}
                  </span>
                ) : null}
                {match.venue ? (
                  <span>
                    <MapPin size={13} />
                    {match.venue}
                  </span>
                ) : null}
              </div>
            )
          )}
        </div>
        {admin ? (
          <div className="cal-match__aside">
            <div className="cal-match__actions">
              <button type="button" className="cal-match__action" onClick={() => setEditing((value) => !value)}>
                {editing ? "Cerrar" : "Editar"}
                {!editing ? <Pencil size={13} /> : null}
              </button>
              <button type="button" className="cal-match__action" onClick={() => setStatsOpen(true)}>
                Marcador
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {match.played ? (
        <Summary
          open={summaryOpen}
          onToggle={() => setSummaryOpen((value) => !value)}
          match={match}
        />
      ) : null}
      {admin && editing ? (
        <ScheduleForm
          match={match}
          durationMinutes={durationMinutes}
          startDate={startDate}
          onSaved={() => {
            setEditing(false);
            onSaved();
          }}
        />
      ) : null}
      {statsOpen ? (
        <MatchScoreModal
          match={match}
          onClose={() => setStatsOpen(false)}
          onSaved={() => {
            setStatsOpen(false);
            onSaved();
          }}
        />
      ) : null}
    </div>
  );
}

function Side({ club }: { club: CalendarMatchView["home"] }) {
  const crest = (
    <span className="cal-match__crest">
      <img src={club.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
    </span>
  );
  if (!club.slug) {
    return (
      <span className="cal-match__side">
        {crest}
        {club.name}
      </span>
    );
  }
  return (
    <Link to={`/${club.slug}`} className="cal-match__side" style={{ color: "inherit", textDecoration: "none" }}>
      {crest}
      {club.name}
    </Link>
  );
}

function Summary({
  open,
  onToggle,
  match,
}: {
  open: boolean;
  onToggle: () => void;
  match: CalendarMatchView;
}) {
  const [detail, setDetail] = useState<MatchSummaryView | null>(null);
  const [failed, setFailed] = useState(false);
  const show = () => {
    onToggle();
    if (open || detail || match.walkover) return;
    void loadMatchSummary(match.id, match.home.id, match.away.id)
      .then(setDetail)
      .catch((err) => {
        console.error(err);
        setFailed(true);
      });
  };
  return (
    <div className="cal-match__summary">
      <button type="button" className="cal-match__summary-toggle" aria-expanded={open} onClick={show}>
        <span>Resumen</span>
        <span className="cal-match__summary-end">
          <span className="cal-match__score">
            <span className="cal-match__score-n">{match.homeScore ?? 0}</span>
            <span className="cal-match__score-sep">–</span>
            <span className="cal-match__score-n">{match.awayScore ?? 0}</span>
          </span>
          <ChevronDown size={16} style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }} />
        </span>
      </button>
      {open && match.walkover ? (
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: C.gray500 }}>3-0 por ingreso tardío</p>
      ) : null}
      {open && !match.walkover && failed ? (
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: C.red }}>No se pudo cargar el resumen.</p>
      ) : null}
      {open && !match.walkover && detail ? (
        <div className="cal-match__summary-grid">
          <SummarySide name={match.home.name} logo={match.home.logoUrl} side={detail.home} />
          <SummarySide name={match.away.name} logo={match.away.logoUrl} side={detail.away} />
        </div>
      ) : null}
    </div>
  );
}

function SummarySide({
  name,
  logo,
  side,
}: {
  name: string;
  logo: string | null;
  side: MatchSummaryView["home"];
}) {
  return (
    <div className="cal-match__sum-side">
      <div className="cal-match__sum-team">
        <span className="cal-match__crest">
          <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
        </span>
        <span>{name}</span>
      </div>
      <div className="cal-match__sum-facts">
        {side.goals.length > 0 ? (
          <p>
            <strong>Goles:</strong> {side.goals.join(" · ")}
          </p>
        ) : null}
        {side.yellow.length > 0 ? (
          <p>
            <strong>Tarjetas Amarillas:</strong> {side.yellow.join(" · ")}
          </p>
        ) : null}
        {side.red.length > 0 ? (
          <p>
            <strong>Tarjetas Rojas:</strong> {side.red.join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ScheduleForm({
  match,
  durationMinutes,
  startDate,
  onSaved,
}: {
  match: CalendarMatchView;
  durationMinutes: number;
  startDate: string;
  onSaved: () => void;
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
      homeClubId: match.home.id,
      awayClubId: match.away.id,
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
  }, [match.home.id, match.away.id, match.id, startDate, durationMinutes]);

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
          <FormInput type="date" value={date} aria-label="Fecha" onChange={(event) => setDate(event.target.value)} />
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
              {court.name}
            </option>
          ))}
        </FormSelect>
      </label>
      {error ? <p style={{ margin: 0, color: C.red, fontSize: "0.78rem" }}>{error}</p> : null}
      <div className="match-edit-actions">
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
