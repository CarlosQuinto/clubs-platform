import { Link } from "react-router-dom";
import { ChevronRight, Filter, Phone, Search, Shield, Users } from "lucide-react";
import { PageTitle, SectionRule } from "../../components/platform/ArchiveUI";
import { LoadMoreButton } from "../../components/platform/ClubDirectoryList";
import PlatformLayout from "../../components/platform/PlatformLayout";
import { C, FormInput, FormSelect, SectionCard } from "../../components/ui";
import { DEFAULT_CLUB_LOGO } from "../../lib/clubDefaults";
import { useTeamsPage } from "./useTeamsPage";
import type { ClubCardView } from "./teamsViewState";
import type { StandingRowView } from "../tournament/tournamentViewState";

export default function TeamsPageView() {
  const screen = useTeamsPage();

  return (
    <PlatformLayout>
      <PageTitle icon={<Shield size={22} color="#cd9a40" />}>Equipos</PageTitle>
      {screen.error ? (
        <p style={{ color: C.red, fontSize: "0.9rem" }}>
          {screen.error}{" "}
          <button type="button" onClick={screen.onRefresh} style={retryButton}>
            Reintentar
          </button>
        </p>
      ) : null}
      {screen.loading && !screen.seasons.length && screen.directory.length === 0 ? (
        <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando equipos…</p>
      ) : (
        <>
          <SectionCard title="Directorio" icon={<Users size={16} />} style={{ marginBottom: "0.85rem" }}>
            <label className="club-dir-search">
              <Search size={14} color={C.gray400} />
              <FormInput
                value={screen.query}
                onChange={(event) => screen.onSearch(event.target.value)}
                placeholder="Buscar por nombre de equipo"
                aria-label="Buscar por nombre de equipo"
              />
            </label>
            <Directory
              clubs={screen.directory}
              emptyLabel={screen.directoryEmptyLabel}
              hasMore={screen.hasMoreDirectory}
              onMore={screen.onMoreDirectory}
            />
          </SectionCard>

          <SectionRule title="Rankings generales por equipos" />
          {screen.loading && screen.standings.length === 0 ? (
            <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando estadísticas…</p>
          ) : (
            <>
              <div className="stats-scope-bar">
                <span className="stats-scope-bar__label">
                  <Filter size={12} /> Estadísticas
                </span>
                <FormSelect
                  value={screen.scope.seasonId}
                  onChange={(event) =>
                    screen.onScopeChange({ ...screen.scope, seasonId: event.target.value })
                  }
                  aria-label="Temporada"
                >
                  <option value="">Histórico (todas las temporadas)</option>
                  {screen.seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  value={screen.scope.categoryId}
                  onChange={(event) =>
                    screen.onScopeChange({ ...screen.scope, categoryId: event.target.value })
                  }
                  aria-label="Categoría"
                >
                  <option value="">Todas las categorías</option>
                  {screen.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <Ranking
                rows={screen.standings}
                hasMore={screen.hasMoreStandings}
                onMore={screen.onMoreStandings}
              />
            </>
          )}
        </>
      )}
    </PlatformLayout>
  );
}

function Directory({
  clubs,
  emptyLabel,
  hasMore,
  onMore,
}: {
  clubs: ClubCardView[];
  emptyLabel: string | null;
  hasMore: boolean;
  onMore: () => void;
}) {
  if (clubs.length === 0) {
    return (
      <div className="club-dir-empty">
        <Shield size={32} color={C.gray300} />
        <div>{emptyLabel || "Todavía no hay clubes publicados."}</div>
      </div>
    );
  }
  return (
    <>
      <div className="club-dir-grid">
        {clubs.map((club) => (
          <article key={club.href} className="club-dir-card">
            <Link to={club.href} className="club-dir-card__main">
              <div className="club-dir-card__logo">
                <img src={club.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
              </div>
              <div className="club-dir-card__copy">
                <div className="club-dir-card__name">{club.name}</div>
                <div className="club-dir-card__meta">{club.locality}</div>
              </div>
              <ChevronRight size={16} color={C.gray400} />
            </Link>
            {club.phoneHref && club.phoneLabel ? (
              <a className="club-dir-card__phone" href={club.phoneHref}>
                <Phone size={13} />
                {club.phoneLabel}
              </a>
            ) : null}
          </article>
        ))}
      </div>
      {hasMore ? <LoadMoreButton onClick={onMore} /> : null}
    </>
  );
}

function Ranking({
  rows,
  hasMore,
  onMore,
}: {
  rows: StandingRowView[];
  hasMore: boolean;
  onMore: () => void;
}) {
  return (
    <SectionCard title="Ranking de equipos">
      {rows.length === 0 ? (
        <p style={{ color: C.gray500, margin: 0 }}>No hay equipos en este filtro.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ color: C.gray500, textAlign: "right" }}>
                <th style={headLeft}>#</th>
                <th style={headLeft}>Club</th>
                {["PJ", "G", "E", "P", "GF", "GC", "DG", "Pts"].map((label) => (
                  <th key={label} style={head}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.rank}-${row.clubName}`} style={{ borderTop: `1px solid ${C.gray200}` }}>
                  <td style={cellLeft}>{row.rank}</td>
                  <td style={cellLeft}>
                    {row.clubHref ? (
                      <Link to={row.clubHref} style={clubLink}>
                        {row.clubName}
                      </Link>
                    ) : (
                      row.clubName
                    )}
                  </td>
                  {[
                    row.played,
                    row.won,
                    row.drawn,
                    row.lost,
                    row.goalsFor,
                    row.goalsAgainst,
                    row.goalDiff,
                    row.points,
                  ].map((value, index) => (
                    <td key={index} style={{ ...cell, fontWeight: index === 7 ? 800 : 500 }}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore ? <LoadMoreButton onClick={onMore} /> : null}
    </SectionCard>
  );
}

const retryButton = {
  color: C.navy900,
  fontWeight: 700,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
} as const;

const clubLink = {
  color: C.navy900,
  fontWeight: 800,
  textDecoration: "none",
} as const;

const head = {
  padding: "0.35rem 0.4rem",
  fontSize: "0.68rem",
  fontWeight: 700,
} as const;

const headLeft = { ...head, textAlign: "left" } as const;
const cell = { padding: "0.55rem 0.4rem", textAlign: "right" } as const;
const cellLeft = { ...cell, textAlign: "left" } as const;
