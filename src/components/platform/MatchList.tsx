import { Link } from "react-router-dom";
import { DEFAULT_CLUB_LOGO } from "../../lib/clubDefaults";
import { sortByDate } from "../../lib/stats";
import type { ClubSummary, Match } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime, isoDate } from "../../utils/helpers";

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

export default function MatchList({
  matches,
  clubNames,
  clubsById,
  subtitleOf,
}: {
  matches: Match[];
  clubNames: Record<string, string>;
  clubsById: Record<string, Pick<ClubSummary, "name" | "logoUrl">>;
  subtitleOf: (match: Match) => string;
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
          />
        ))}
      </div>
    </div>
  );
}

function UpcomingMatchCard({
  match,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  subtitle,
}: {
  match: Match;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  subtitle: string;
}) {
  const date = dateParts(match.date);
  const when = match.time ? formatFriendlyTime(match.time) : "";
  const venue = match.venue?.trim() || "";

  return (
    <Link to={`/torneos/${match.tournamentId}`} className="match-card">
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
    </Link>
  );
}

function Crest({ src, alt }: { src?: string; alt: string }) {
  return (
    <span className="match-card__crest">
      <img src={src || DEFAULT_CLUB_LOGO} alt={alt} />
    </span>
  );
}
