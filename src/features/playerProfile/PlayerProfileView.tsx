import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, History, SearchX, Shield } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import SectionHead from "../shell/SectionHead";
import ShareButton from "../shell/ShareButton";
import { TeamsEmpty } from "../teams/StandingsRanking";
import { avatarFallback } from "../tournament/TournamentScorers";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { usePlayerProfile } from "./usePlayerProfile";
import type { PlayerProfileView, ProfileClubView, ProfileSeasonView } from "./playerProfileViewState";

/**
 * Ficha pública de un jugador (/jugadores/:id): sus clubes y sus números por temporada, torneo y club.
 * Se enlaza desde la plantilla, los goleadores y el resumen de temporada; /admin → Jugadores usa el mismo cuerpo.
 */
export default function PlayerProfilePage() {
  const { id = "" } = useParams();
  const { loading, missing, error, view, onRefresh } = usePlayerProfile(id);

  return (
    <PlatformLayout>
      <div className="teams-page tour-detail player-profile">
        <BackButton />
        {missing ? (
          <TeamsEmpty
            icon={<SearchX size={20} />}
            title="Este jugador no existe."
            hint="Puede que el enlace esté mal o que su ficha se haya unido a otra."
          />
        ) : !view && loading ? (
          <p className="teams-loading">Cargando jugador…</p>
        ) : !view ? (
          <p className="teams-error">
            {error}{" "}
            <button type="button" onClick={onRefresh}>
              Reintentar
            </button>
          </p>
        ) : (
          <PlayerProfileBody view={view} actions={<ShareButton text={view.shareText} className="home-btn home-btn--outline" />} />
        )}
      </div>
    </PlatformLayout>
  );
}

/** Vuelve a la pantalla anterior; si se abrió el enlace directo, a Equipos. */
function BackButton() {
  const navigate = useNavigate();
  const hasHistory = typeof window !== "undefined" && (window.history.state?.idx ?? 0) > 0;
  return (
    <button
      type="button"
      className="tour-detail__back player-profile__back"
      onClick={() => (hasHistory ? navigate(-1) : navigate("/equipos"))}
    >
      <ArrowLeft size={16} aria-hidden />
      {hasHistory ? "Volver" : "Equipos"}
    </button>
  );
}

/**
 * Cabecera, clubes, totales y trayectoria. `actions` va a la derecha del nombre (Compartir, o Editar en /admin);
 * `clubs` reemplaza la lista pública de clubes (en /admin, la tarjeta para editar sus fichas).
 */
export function PlayerProfileBody({ view, actions, clubs }: { view: PlayerProfileView; actions?: ReactNode; clubs?: ReactNode }) {
  return (
    <>
      <header className="teams-head player-profile__head">
        <img
          className="player-profile__photo"
          src={view.imageUrl || avatarFallback(view.name)}
          alt=""
          onError={(event) => {
            event.currentTarget.src = avatarFallback(view.name);
          }}
        />
        <div className="teams-head__copy">
          <h1>{view.name}</h1>
          <p>{view.subtitle}</p>
        </div>
        {actions ? <div className="player-profile__actions">{actions}</div> : null}
      </header>

      <section className="tour-detail__section">{clubs ?? <PublicClubs view={view} />}</section>

      <section className="tour-detail__section">
        <SectionHead icon={<BarChart3 size={22} />} title="En números" subtitle="Partidos oficiales de todos sus torneos" />
        <ul className="season-summary__stats">
          {view.stats.map((stat) => (
            <li key={stat.key}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="tour-detail__section">
        <SectionHead icon={<History size={22} />} title="Trayectoria" subtitle="Por temporada, torneo y club" />
        {view.seasons.length === 0 ? (
          <TeamsEmpty
            icon={<History size={20} />}
            title="Sin partidos oficiales todavía."
            hint="Aquí aparecen sus goles, tarjetas y MVP cuando juegue un torneo."
          />
        ) : (
          <div className="player-profile__seasons">
            {view.seasons.map((season) => (
              <SeasonBlock key={season.id} season={season} />
            ))}
          </div>
        )}
        <p className="player-profile__footnote">
          Cuenta un partido cuando fue convocado, alineado, anotó, asistió, vio tarjeta o fue MVP. No incluye walkovers ni
          amistosos.
        </p>
      </section>
    </>
  );
}

function PublicClubs({ view }: { view: PlayerProfileView }) {
  return (
    <>
      <SectionHead icon={<Shield size={22} />} title="Clubes" subtitle="Dónde juega y dónde jugó" />
      {view.currentClubs.length === 0 && view.formerClubs.length === 0 ? (
        <TeamsEmpty icon={<Shield size={20} />} title="Sin club." hint="Todavía no está en la plantilla de ningún equipo." />
      ) : (
        <>
          {view.currentClubs.length > 0 ? <ClubList clubs={view.currentClubs} /> : null}
          {view.formerClubs.length > 0 ? (
            <>
              <p className="player-profile__label">Antes en</p>
              <ClubList clubs={view.formerClubs} former />
            </>
          ) : null}
        </>
      )}
    </>
  );
}

function ClubList({ clubs, former = false }: { clubs: ProfileClubView[]; former?: boolean }) {
  return (
    <ul className={`player-profile__clubs${former ? " is-former" : ""}`}>
      {clubs.map((club) => {
        const body = (
          <>
            <img src={club.logo || DEFAULT_CLUB_LOGO} alt="" />
            <span className="player-profile__club-copy">
              <strong>{club.name}</strong>
              {club.detail ? <span>{club.detail}</span> : null}
            </span>
            {club.badge ? <span className="player-profile__badge">{club.badge}</span> : null}
          </>
        );
        return (
          <li key={club.id}>
            {club.href ? (
              <Link to={club.href} className="player-profile__club">
                {body}
              </Link>
            ) : (
              <div className="player-profile__club">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SeasonBlock({ season }: { season: ProfileSeasonView }) {
  return (
    <article className="player-profile__season">
      <header>
        {season.href ? <Link to={season.href}>{season.name}</Link> : <strong>{season.name}</strong>}
        <span>{season.summary}</span>
      </header>
      <div className="player-profile__table-wrap">
        <table className="player-profile__table">
          <thead>
            <tr>
              <th scope="col">Torneo</th>
              <th scope="col" title="Partidos jugados">PJ</th>
              <th scope="col" title="Goles">G</th>
              <th scope="col" title="Asistencias">A</th>
              <th scope="col" title="Veces MVP">MVP</th>
              <th scope="col" title="Amarillas">TA</th>
              <th scope="col" title="Rojas">TR</th>
            </tr>
          </thead>
          <tbody>
            {season.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  <Link to={row.tournamentHref} className="player-profile__tournament">
                    {row.tournamentName}
                  </Link>
                  <span className="player-profile__row-club">
                    <img src={row.clubLogo || DEFAULT_CLUB_LOGO} alt="" />
                    {row.clubHref ? <Link to={row.clubHref}>{row.clubName}</Link> : <span>{row.clubName}</span>}
                  </span>
                  {row.category || row.note ? (
                    <span className="player-profile__row-note">{[row.category, row.note].filter(Boolean).join(" · ")}</span>
                  ) : null}
                </th>
                <td>{row.matches}</td>
                <td>{row.goals}</td>
                <td>{row.assists}</td>
                <td>{row.mvps}</td>
                <td>{row.yellow}</td>
                <td>{row.red}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
