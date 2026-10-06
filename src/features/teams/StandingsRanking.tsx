import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ListFilter } from "lucide-react";
import type { TeamStandingView } from "./teamsViewState";

const STAT_HEADS = ["PJ", "G", "E", "P", "GF", "GC"];

/** Escudo «Carbón y Oro»: logo o siglas (/equipos y ficha de torneo). */
export function ClubCrest({
  logoUrl,
  initials,
  small = false,
}: {
  logoUrl?: string | null;
  initials: string;
  small?: boolean;
}) {
  return (
    <span className={`teams-crest${small ? " teams-crest--sm" : ""}${logoUrl ? " has-logo" : ""}`}>
      {logoUrl ? <img src={logoUrl} alt="" loading="lazy" /> : initials}
    </span>
  );
}

export function TeamsEmpty({
  icon,
  title,
  hint,
  loading = false,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  loading?: boolean;
}) {
  return (
    <div className="teams-empty" role="status" aria-busy={loading || undefined}>
      <span className={`teams-empty__icon${loading ? " is-loading" : ""}`} aria-hidden="true">
        {icon}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{hint}</p>
      </div>
    </div>
  );
}

export function MoreButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="teams-more">
      <button type="button" onClick={onClick}>
        Ver más
      </button>
    </div>
  );
}

/** Tabla de posiciones «Carbón y Oro» (/equipos y ficha de torneo). */
export function Ranking({
  rows,
  hasMore = false,
  onMore,
  emptyTitle,
  emptyHint,
}: {
  rows: TeamStandingView[];
  hasMore?: boolean;
  onMore?: () => void;
  emptyTitle: string;
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return <TeamsEmpty icon={<ListFilter size={20} />} title={emptyTitle} hint={emptyHint} />;
  }
  return (
    <>
      <div className="teams-table-wrap">
        <table className="teams-table">
          <thead>
            <tr>
              <th className="is-rank">#</th>
              <th className="is-club">Club</th>
              {STAT_HEADS.map((label) => (
                <th key={label}>{label}</th>
              ))}
              <th className="is-dg">DG</th>
              <th className="is-pts">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.rank}-${row.clubSlug || row.clubName}`} className={row.rank <= 3 ? "is-top" : ""}>
                <td className="is-rank">
                  <span>{row.rank}</span>
                </td>
                <td className="is-club">
                  <span className="teams-table__club">
                    <ClubCrest logoUrl={row.logoUrl} initials={row.initials} small />
                    {row.clubHref ? (
                      <Link to={row.clubHref}>{row.clubName}</Link>
                    ) : (
                      <span>{row.clubName}</span>
                    )}
                  </span>
                </td>
                <td>{row.played}</td>
                <td className="is-strong">{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td className="is-dg">
                  <span
                    className={`teams-dg${row.goalDiff > 0 ? " is-pos" : row.goalDiff < 0 ? " is-neg" : ""}`}
                  >
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </span>
                </td>
                <td className="is-pts">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && onMore ? <MoreButton onClick={onMore} /> : null}
    </>
  );
}
