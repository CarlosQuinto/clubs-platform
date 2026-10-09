import { Link } from "react-router-dom";
import { Goal } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { TeamsEmpty } from "../teams/StandingsRanking";
import type { ScorerRowView } from "./tournamentViewState";

const TOP = 5;

/** Top 5 de goleadores «Carbón y Oro»: el primero con anillo dorado. */
export default function TournamentScorers({ scorers }: { scorers: ScorerRowView[] }) {
  const top = scorers.slice(0, TOP);
  if (top.length === 0) {
    return (
      <TeamsEmpty
        icon={<Goal size={20} />}
        title="Sin goles registrados todavía."
      />
    );
  }
  return (
    <div className="tour-scorers">
      <ol className="tour-scorers__list">
        {top.map((scorer, index) => (
          <li key={`${scorer.clubId}:${scorer.playerId}`} className={index === 0 ? "is-first" : undefined}>
            <span className="tour-scorers__rank">{index + 1}</span>
            <img
              className="tour-scorers__photo"
              src={scorer.imageUrl || avatarFallback(scorer.name)}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = avatarFallback(scorer.name);
              }}
            />
            <span className="tour-scorers__who">
              <strong>{scorer.href ? <Link to={scorer.href}>{scorer.name}</Link> : scorer.name}</strong>
              {scorer.clubName ? (
                <span className="tour-scorers__club">
                  <img src={scorer.clubLogo || DEFAULT_CLUB_LOGO} alt="" />
                  <span>{scorer.clubName}</span>
                </span>
              ) : null}
            </span>
            <span className="tour-scorers__goals">
              <strong>{scorer.goals}</strong>
              <span>{scorer.goals === 1 ? "gol" : "goles"}</span>
              {scorer.assists ? <span className="is-muted">{scorer.assists} asist.</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Jugador")}&background=121212&color=fff&size=80`;
}
