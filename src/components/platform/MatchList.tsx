import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { sortByDate } from "../../lib/stats";
import type { Match } from "../../lib/types";
import { formatFriendlyTime, formatShortDate, isoDate } from "../../utils/helpers";
import { C, RADIUS, SHADOWS } from "../ui";

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

export function groupMatchesByDay(matches: Match[]) {
  const groups: { date: string; items: Match[] }[] = [];
  for (const m of matches) {
    const date = m.date || "";
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(m);
    else groups.push({ date, items: [m] });
  }
  return groups;
}

export default function MatchList({
  matches,
  clubNames,
  clubsById,
  subtitleOf,
}: {
  matches: Match[];
  clubNames: Record<string, string>;
  clubsById: Record<string, { name?: string }>;
  subtitleOf: (match: Match) => string;
}) {
  if (matches.length === 0) return null;
  const groups = groupMatchesByDay(matches);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      {groups.map((group) => {
        const grouped = group.items.length > 1;
        return (
          <div
            key={group.date || group.items[0]?.id}
            style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
          >
            {grouped && (
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: C.gray500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {formatShortDate(group.date)}
              </div>
            )}
            {group.items.map((m) => (
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
                subtitle={subtitleOf(m)}
                showDate={!grouped}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function UpcomingMatchCard({
  match,
  homeName,
  awayName,
  subtitle,
  showDate,
}: {
  match: Match;
  homeName: string;
  awayName: string;
  subtitle: string;
  showDate: boolean;
}) {
  const when = [
    showDate ? formatShortDate(match.date || "") : "",
    match.time ? formatFriendlyTime(match.time) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link to={`/torneos/${match.tournamentId}`} style={matchCard}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.85rem",
            lineHeight: 1.25,
            color: C.gray800,
          }}
        >
          {homeName} vs {awayName}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "0.7rem",
              color: C.gray500,
              fontWeight: 600,
              marginTop: 3,
            }}
          >
            {subtitle}
          </div>
        )}
        {(when || match.venue) && (
          <div
            style={{
              fontSize: "0.7rem",
              color: C.gray500,
              fontWeight: 600,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.15rem 0.55rem",
            }}
          >
            {when && <span>{when}</span>}
            {match.venue && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <MapPin size={11} /> {match.venue}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

const matchCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.4rem 0.65rem",
  backgroundColor: C.white,
  border: `1px solid ${C.gray200}`,
  borderRadius: RADIUS.md,
  boxShadow: SHADOWS.sm,
  textDecoration: "none",
  color: C.gray800,
};
