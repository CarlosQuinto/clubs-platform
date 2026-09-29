import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Calendar, ChevronDown, ChevronRight, Clock, MapPin, Pencil } from "lucide-react";
import { updateDoc } from "firebase/firestore";
import { matchRef, tournamentRef } from "../../lib/paths";
import {
  groupMatchesByRound,
  isPlayed,
} from "../../lib/stats";
import { DEFAULT_CLUB_LOGO } from "../../lib/clubDefaults";
import type { ClubSummary, Match, MatchSide, Tournament } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../utils/helpers";
import {
  C,
  FormInput,
  PrimaryButton,
  SectionCard,
} from "../ui";
import MatchStatsEditor from "./MatchStatsEditor";

export default function TournamentCalendar({
  tournament,
  matches,
  loading,
  clubNames,
  clubsById,
  isAdmin,
}: {
  tournament: Tournament;
  matches: Match[];
  loading: boolean;
  clubNames: Record<string, string>;
  clubsById: Record<string, Pick<ClubSummary, "name" | "logoUrl">>;
  isAdmin: boolean;
}) {
  const rounds = useMemo(() => {
    const groups = groupMatchesByRound(matches);
    const open: Array<(typeof groups)[number] & { collapsed: boolean }> = [];
    const finished: typeof open = [];
    for (const group of groups) {
      const collapsed = group.list.length > 0 && group.list.every(isPlayed);
      (collapsed ? finished : open).push({ ...group, collapsed });
    }
    return [...open, ...finished];
  }, [matches]);

  const [visibleCount, setVisibleCount] = useState(1);
  const [visibleFor, setVisibleFor] = useState(tournament.id);
  if (visibleFor !== tournament.id) {
    setVisibleFor(tournament.id);
    setVisibleCount(1);
  }
  const shownCount = visibleFor === tournament.id ? visibleCount : 1;
  const revealNext = useCallback(() => {
    setVisibleCount((count) => count + 1);
  }, []);
  const sentinelRef = useRevealNextRound(
    shownCount < rounds.length,
    shownCount,
    revealNext,
  );

  const visibleRounds = rounds.slice(0, shownCount);

  return (
    <SectionCard title="Calendario" icon={<Calendar size={16} />}>
      {loading ? (
        <p style={{ margin: 0, color: C.gray400 }}>Cargando partidos…</p>
      ) : matches.length === 0 ? (
        <p style={{ margin: 0, color: C.gray400 }}>
          {tournament.clubIds.length < 2
            ? "Inscribe al menos 2 equipos para generar el calendario."
            : "Sin partidos."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {isAdmin && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray500 }}>
              Toca Editar para fecha, hora y sede. Marcador abre goles,
              asistencias y tarjetas.
            </p>
          )}
          {visibleRounds.map((group) => (
            <RoundBlock
              key={group.round}
              round={group.round}
              matches={group.list}
              tournament={tournament}
              clubNames={clubNames}
              clubsById={clubsById}
              isAdmin={isAdmin}
              collapsed={group.collapsed}
            />
          ))}
          {shownCount < rounds.length && (
            <div ref={sentinelRef} aria-hidden className="cal-round-sentinel" />
          )}
        </div>
      )}
    </SectionCard>
  );
}

function scrollingInner(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  let el: Element | null = target;
  while (el && el !== document.body) {
    const overflowY = getComputedStyle(el).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

/** Muestra una jornada más cuando el usuario baja hasta el final de la lista. */
function useRevealNextRound(
  hasMore: boolean,
  visibleCount: number,
  reveal: () => void,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cooldownUntil = useRef(0);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    let revealed = false;
    const revealOnce = () => {
      if (revealed) return;
      const now = performance.now();
      if (now < cooldownUntil.current) return;
      revealed = true;
      cooldownUntil.current = now + 500;
      reveal();
    };

    const nearEnd = () => node.getBoundingClientRect().top <= window.innerHeight + 80;
    let wasHidden = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!entry.isIntersecting) {
          wasHidden = true;
          return;
        }
        if (wasHidden) revealOnce();
      },
      { root: null, rootMargin: "80px 0px" },
    );
    observer.observe(node);

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0 || scrollingInner(event.target)) return;
      if (nearEnd()) revealOnce();
    };
    let lastTouchY = 0;
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? 0;
      const scrollingDown = y < lastTouchY - 12;
      lastTouchY = y;
      if (!scrollingDown || scrollingInner(event.target)) return;
      if (nearEnd()) revealOnce();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "PageDown" && event.key !== " ") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (nearEnd()) revealOnce();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      revealed = true;
      observer.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [hasMore, visibleCount, reveal]);

  return sentinelRef;
}

function roundTitle(round: string) {
  return /^\d+$/.test(round) ? `Jornada ${round}` : round;
}

function RoundBlock({
  round,
  matches,
  tournament,
  clubNames,
  clubsById,
  isAdmin,
  collapsed,
}: {
  round: string;
  matches: Match[];
  tournament: Tournament;
  clubNames: Record<string, string>;
  clubsById: Record<string, Pick<ClubSummary, "name" | "logoUrl">>;
  isAdmin: boolean;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(!collapsed);
  const title = roundTitle(round);

  const list = (
    <div className="cal-round">
      {matches.map((m) => (
        <MatchRow
          key={m.id}
          match={m}
          tournament={tournament}
          clubNames={clubNames}
          clubsById={clubsById}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );

  if (!collapsed) {
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
        onClick={() => setOpen((v) => !v)}
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
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.15s ease",
            }}
          />
          {title}
        </span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.gray400 }}>
          {matches.length} {matches.length === 1 ? "partido" : "partidos"}
        </span>
      </button>
      {open ? list : null}
    </div>
  );
}

const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

function dateParts(iso?: string) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month: MONTHS[month - 1] || "", year };
}

function MatchRow({
  match,
  tournament,
  clubNames,
  clubsById,
  isAdmin,
}: {
  match: Match;
  tournament: Tournament;
  clubNames: Record<string, string>;
  clubsById: Record<string, Pick<ClubSummary, "name" | "logoUrl">>;
  isAdmin: boolean;
}) {
  const played = isPlayed(match);
  const [date, setDate] = useState(match.date || "");
  const [time, setTime] = useState(match.time || "");
  const [venue, setVenue] = useState(match.venue || "");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const when = dateParts(match.date);
  const homeName = clubNames[match.homeClubId] || "Local";
  const awayName = clubNames[match.awayClubId] || "Visitante";
  const homeLogo = clubsById[match.homeClubId]?.logoUrl;
  const awayLogo = clubsById[match.awayClubId]?.logoUrl;
  const kickoff = match.time ? formatFriendlyTime(match.time) : "";
  const place = match.venue?.trim() || "";

  useEffect(() => {
    setDate(match.date || "");
    setTime(match.time || "");
    setVenue(match.venue || "");
  }, [match.date, match.time, match.venue]);

  const saveSchedule = async () => {
    try {
      setBusy(true);
      const scheduled = Boolean(date && time);
      await updateDoc(matchRef(match.id), {
        date: date || "",
        time: time || "",
        venue: venue.trim(),
        status: played ? "played" : scheduled ? "scheduled" : "unscheduled",
        updatedAt: new Date().toISOString(),
      });
      if (scheduled && tournament.status === "upcoming") {
        await updateDoc(tournamentRef(tournament.id), { status: "active" });
      }
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la programación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cal-match">
      <div className="cal-match__main">
        {when ? (
          <time
            className="match-card__date"
            dateTime={match.date}
            aria-label={formatFriendlyDate(match.date || "")}
          >
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
            <span className="cal-match__side">
              <Crest src={homeLogo} alt="" />
              {homeName}
            </span>
            <span className="cal-match__vs">vs</span>
            <span className="cal-match__side">
              <Crest src={awayLogo} alt="" />
              {awayName}
            </span>
          </div>
          {(kickoff || place) && (
            <div className="cal-match__meta">
              {kickoff && (
                <span>
                  <Clock size={13} />
                  {kickoff}
                </span>
              )}
              {place && (
                <span>
                  <MapPin size={13} />
                  {place}
                </span>
              )}
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="cal-match__aside">
            <div className="cal-match__actions">
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="cal-match__action"
              >
                {editing ? "Cerrar" : "Editar"}
                {!editing && <Pencil size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setStatsOpen(true)}
                className="cal-match__action"
              >
                Marcador
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {played ? (
        <MatchSummary
          open={summaryOpen}
          onToggle={() => setSummaryOpen((v) => !v)}
          match={match}
          homeName={homeName}
          awayName={awayName}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
        />
      ) : null}

      {isAdmin && editing && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            paddingTop: "0.15rem",
          }}
        >
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
      )}
      {statsOpen && (
        <MatchStatsEditor
          match={match}
          tournament={tournament}
          clubNames={clubNames}
          onClose={() => setStatsOpen(false)}
        />
      )}
    </div>
  );
}

function MatchSummary({
  open,
  onToggle,
  match,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
}: {
  open: boolean;
  onToggle: () => void;
  match: Match;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
}) {
  const home = match.sides?.[match.homeClubId];
  const away = match.sides?.[match.awayClubId];

  return (
    <div className="cal-match__summary">
      <button
        type="button"
        className="cal-match__summary-toggle"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>Resumen</span>
        <span className="cal-match__summary-end">
          <span
            className="cal-match__score"
            aria-label={`Marcador ${match.homeScore} a ${match.awayScore}`}
          >
            <span className="cal-match__score-n">{match.homeScore}</span>
            <span className="cal-match__score-sep" aria-hidden>
              –
            </span>
            <span className="cal-match__score-n">{match.awayScore}</span>
          </span>
          <ChevronDown
            size={16}
            aria-hidden
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        </span>
      </button>
      {open && (
        <div className="cal-match__summary-grid">
          <SummarySide
            name={homeName}
            logo={homeLogo}
            goals={goalLines(home, match.homeScore)}
            yellow={cardNames(home, "yellowCards")}
            red={cardNames(home, "redCards")}
          />
          <SummarySide
            name={awayName}
            logo={awayLogo}
            goals={goalLines(away, match.awayScore)}
            yellow={cardNames(away, "yellowCards")}
            red={cardNames(away, "redCards")}
          />
        </div>
      )}
    </div>
  );
}

function SummarySide({
  name,
  logo,
  goals,
  yellow,
  red,
}: {
  name: string;
  logo?: string;
  goals: string[];
  yellow: string[];
  red: string[];
}) {
  return (
    <div className="cal-match__sum-side">
      <div className="cal-match__sum-team">
        <Crest src={logo} alt="" />
        <span>{name}</span>
      </div>
      <div className="cal-match__sum-facts">
        {goals.length > 0 && (
          <p>
            <strong>Goles:</strong> {goals.join(" · ")}
          </p>
        )}
        {yellow.length > 0 && (
          <p>
            <strong>Tarjetas Amarillas:</strong> {yellow.join(" · ")}
          </p>
        )}
        {red.length > 0 && (
          <p>
            <strong>Tarjetas Rojas:</strong> {red.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function Crest({ src, alt }: { src?: string; alt: string }) {
  return (
    <span className="cal-match__crest">
      <img src={src || DEFAULT_CLUB_LOGO} alt={alt} />
    </span>
  );
}

/** "Jaime Noé" → "Jaime N." Un solo nombre se deja igual. */
function shortName(full: string) {
  const clean = full.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return clean;
  const initial = parts[parts.length - 1].charAt(0).toLocaleUpperCase("es");
  return `${parts[0]} ${initial}.`;
}

function goalLines(side: MatchSide | undefined, score?: number | null) {
  const names = side?.playerNames || {};
  const lines = (side?.stats || []).map((s) => {
    if (!s.scorer?.trim()) return "Jugador";
    const scorer = shortName(names[s.scorer] || s.scorer);
    if (s.isOwnGoal) return `${scorer} (autogol)`;
    if (s.isPenalty) return `${scorer} (P)`;
    if (s.assist) return `${scorer} (${names[s.assist] || s.assist})`;
    return scorer;
  });
  const total = typeof score === "number" ? score : lines.length;
  while (lines.length < total) lines.push("Jugador");
  return lines;
}

function cardNames(side: MatchSide | undefined, key: "yellowCards" | "redCards") {
  if (!side?.[key]?.length) return [];
  const names = side.playerNames || {};
  return side[key]!.map((id) => shortName(names[id] || id));
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
