import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ListFilter,
  Loader2,
  MessageCircle,
  PlusCircle,
  Search,
  SearchX,
  Shield,
} from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import AdSlot from "../shell/AdSlot";
import { FormInput, FormSelect } from "../../shared/ui";
import { useAuth } from "../../domains/auth/AuthContext";
import RegisterClubModal from "./RegisterClubModal";
import { useTeamsPage } from "./useTeamsPage";
import { ClubCrest, MoreButton, Ranking, TeamsEmpty } from "./StandingsRanking";
import type { ClubCardView, DirectoryEmptyView } from "./teamsViewState";

export default function TeamsPageView() {
  const screen = useTeamsPage();
  const { isSuperAdmin } = useAuth();
  const [registering, setRegistering] = useState(false);

  return (
    <PlatformLayout>
      <div className="teams-page">
        <AdSlot placement="teams" layout="top" />
        <header className="teams-head">
          <span className="teams-head__icon" aria-hidden="true">
            <Shield size={24} />
          </span>
          <div className="teams-head__copy">
            <h1>Equipos</h1>
            <p>Conoce a los clubes</p>
          </div>
          {isSuperAdmin ? (
            <button
              type="button"
              className="home-btn home-btn--gold teams-head__cta"
              onClick={() => setRegistering(true)}
            >
              <PlusCircle size={18} />
              Registrar equipo
            </button>
          ) : null}
        </header>

        {screen.error ? (
          <p className="teams-error">
            {screen.error}{" "}
            <button type="button" onClick={screen.onRefresh}>
              Reintentar
            </button>
          </p>
        ) : null}

        <label className="teams-search">
          <Search size={18} aria-hidden="true" />
          <FormInput
            value={screen.query}
            onChange={(event) => screen.onSearch(event.target.value)}
            placeholder="Buscar por nombre de equipo..."
            aria-label="Buscar por nombre de equipo"
            maxLength={30}
          />
        </label>

        {screen.loading && !screen.seasons.length && screen.directory.length === 0 ? (
          <p className="teams-loading">Cargando equipos…</p>
        ) : (
          <>
            <Directory
              clubs={screen.directory}
              empty={screen.directoryEmpty}
              hasMore={screen.hasMoreDirectory}
              onMore={screen.onMoreDirectory}
            />

            <h2 className="teams-rule">
              <span>Rankings generales por equipos</span>
            </h2>
            {screen.loading && screen.standings.length === 0 ? (
              <p className="teams-loading">Cargando estadísticas…</p>
            ) : (
              <>
                <div className="teams-scope">
                  <span className="teams-scope__label">
                    <ListFilter size={14} /> Estadísticas
                  </span>
                  <div className="teams-scope__selects">
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
                </div>
                <Ranking
                  rows={screen.standings}
                  hasMore={screen.hasMoreStandings}
                  onMore={screen.onMoreStandings}
                  emptyTitle="No hay equipos en este filtro."
                  emptyHint="Prueba con otra temporada o categoría."
                />
              </>
            )}
          </>
        )}
      </div>

      {registering ? (
        <RegisterClubModal onClose={() => setRegistering(false)} onCreated={screen.onCreated} />
      ) : null}
    </PlatformLayout>
  );
}

function Directory({
  clubs,
  empty,
  hasMore,
  onMore,
}: {
  clubs: ClubCardView[];
  empty: DirectoryEmptyView;
  hasMore: boolean;
  onMore: () => void;
}) {
  if (clubs.length === 0) {
    if (empty === "loading") {
      return (
        <TeamsEmpty
          loading
          icon={<Loader2 size={20} />}
          title="Buscando equipos…"
          hint="Esto puede tardar unos segundos."
        />
      );
    }
    return empty === "search" ? (
      <TeamsEmpty
        icon={<SearchX size={20} />}
        title="Ningún equipo coincide con esa búsqueda."
        hint="Revisa la ortografía o intenta con otro nombre."
      />
    ) : (
      <TeamsEmpty
        icon={<Shield size={20} />}
        title="Todavía no hay clubes publicados."
        hint="La temporada está por abrir convocatorias para nuevos registros."
      />
    );
  }
  return (
    <>
      <div className="teams-grid">
        {clubs.map((club) => (
          <article key={club.href} className="teams-card">
            <Link to={club.href} className="teams-card__link" aria-label={club.name} />
            <ClubCrest logoUrl={club.logoUrl} initials={club.initials} />
            <div className="teams-card__copy">
              <div className="teams-card__name">{club.name}</div>
              <div className="teams-card__meta">
                <span className="teams-card__place">{club.locality}</span>
                {club.phoneHref && club.phoneLabel ? (
                  <a
                    className="teams-card__phone"
                    href={club.phoneHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Escribir por WhatsApp al presidente: ${club.phoneLabel}`}
                  >
                    <MessageCircle size={11} />
                    {club.phoneLabel}
                  </a>
                ) : null}
              </div>
            </div>
            <ChevronRight className="teams-card__chevron" size={18} aria-hidden="true" />
          </article>
        ))}
      </div>
      {hasMore ? <MoreButton onClick={onMore} /> : null}
    </>
  );
}
