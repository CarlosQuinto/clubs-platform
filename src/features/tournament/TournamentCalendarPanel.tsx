import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronDown, ChevronRight, Clock, MapPin, Pencil } from "lucide-react";
import { C, SectionCard } from "../../shared/ui";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { formatFriendlyTime } from "../../shared/helpers";
import { matchPath } from "../../shared/paths";
import { loadMatchSummary } from "./tournamentQueries";
import MatchScheduleForm from "../matches/MatchScheduleForm";
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
          <Link to={matchPath(match.id)} className="cal-match__link">
            Ver partido
            <ChevronRight size={13} />
          </Link>
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
        <MatchScheduleForm
          match={{ ...match, homeClubId: match.home.id, awayClubId: match.away.id }}
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
