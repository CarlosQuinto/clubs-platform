import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../lib/clubDefaults";
import { sortByDate } from "../../lib/stats";
import type { ClubSummary, Match, MatchDurationMinutes } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime, isoDate } from "../../utils/helpers";
import MatchScheduleForm, { type MatchScheduleResources } from "./MatchScheduleForm";

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

export function upcomingOfficialMatches(
  matches: Match[],
  liveTournamentIds: Set<string>,
  today = isoDate(),
) {
  return sortByDate(
    matches.filter((m) => {
      if (!liveTournamentIds.has(m.tournamentId)) return false;
      if (!m.date) return false;
      if (m.status === "played") return false;
      return m.date >= today;
    }),
  );
}

function dateParts(iso?: string) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month: MONTHS[month - 1] || "", year };
}

type CardMatch = {
  id: string;
  tournamentId: string;
  homeClubId: string;
  awayClubId: string;
  date?: string;
  time?: string;
  venue?: string;
};

export default function MatchList<T extends CardMatch>({
  matches,
  clubNames,
  clubsById,
  subtitleOf,
  schedule,
  tournamentOf,
}: {
  matches: T[];
  clubNames: Record<string, string>;
  clubsById: Record<string, Pick<ClubSummary, "name" | "logoUrl">>;
  subtitleOf: (match: T) => string;
  /** Si llega, el superadmin puede editar fecha, hora y cancha. */
  schedule?: MatchScheduleResources;
  tournamentOf?: (match: T) => { startDate?: string; durationMinutes?: MatchDurationMinutes } | undefined;
}) {
  if (matches.length === 0) return null;

  return (
    <div className="match-list">
      <div className="match-list__grid">
        {matches.map((m) => (
          <UpcomingMatchCard
            key={m.id}
            match={m}
            homeName={
              clubNames[m.homeClubId] || clubsById[m.homeClubId]?.name || "Local"
            }
            awayName={
              clubNames[m.awayClubId] ||
              clubsById[m.awayClubId]?.name ||
              "Visitante"
            }
            homeLogo={clubsById[m.homeClubId]?.logoUrl}
            awayLogo={clubsById[m.awayClubId]?.logoUrl}
            subtitle={subtitleOf(m)}
            schedule={schedule}
            tournament={tournamentOf?.(m)}
          />
        ))}
      </div>
    </div>
  );
}

function UpcomingMatchCard<T extends CardMatch>({
  match,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  subtitle,
  schedule,
  tournament,
}: {
  match: T;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  subtitle: string;
  schedule?: MatchScheduleResources;
  tournament?: { startDate?: string; durationMinutes?: MatchDurationMinutes };
}) {
  const [editing, setEditing] = useState(false);
  const date = dateParts(match.date);
  const when = match.time ? formatFriendlyTime(match.time) : "";
  const venue = match.venue?.trim() || "";
  const body = (
    <>
      {date && (
        <time
          className="match-card__date"
          dateTime={match.date}
          aria-label={formatFriendlyDate(match.date || "")}
        >
          <span className="match-card__day">{date.day}</span>
          <span className="match-card__month">{date.month}</span>
          <span className="match-card__year">{date.year}</span>
        </time>
      )}
      <div className="match-card__body">
        <div className="match-card__side">
          <Crest src={homeLogo} alt="" />
          <span className="match-card__club" title={homeName}>
            {homeName}
          </span>
        </div>
        <div className="match-card__side">
          <Crest src={awayLogo} alt="" />
          <span className="match-card__club" title={awayName}>
            {awayName}
          </span>
        </div>
        {subtitle ? <div className="match-card__comp">{subtitle}</div> : null}
        {(when || venue) && (
          <div className="match-card__when">
            {when ? (
              <span className="match-card__time">
                <span className="match-card__dot" aria-hidden />
                {when}
              </span>
            ) : null}
            {venue ? <span className="match-card__venue">{venue}</span> : null}
          </div>
        )}
      </div>
    </>
  );

  if (!schedule) {
    return (
      <Link to={`/torneos/${match.tournamentId}`} className="match-card">
        {body}
      </Link>
    );
  }

  return (
    <div className="match-card match-card--admin">
      <Link to={`/torneos/${match.tournamentId}`} className="match-card__main">
        {body}
      </Link>
      <div className="match-card__toolbar">
        <button
          type="button"
          className="cal-match__action"
          onClick={() => setEditing((open) => !open)}
        >
          {editing ? "Cerrar" : "Editar"}
          {!editing && <Pencil size={13} />}
        </button>
      </div>
      {editing && "status" in match && (
        <MatchScheduleForm
          match={match as unknown as Match}
          schedule={schedule}
          startDate={tournament?.startDate}
          durationMinutes={tournament?.durationMinutes}
          onSaved={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function Crest({ src, alt }: { src?: string; alt: string }) {
  return (
    <span className="match-card__crest">
      <img src={src || DEFAULT_CLUB_LOGO} alt={alt} />
    </span>
  );
}
