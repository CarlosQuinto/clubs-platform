import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, BarChart3, Flame, SearchX, Trophy } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import SectionHead from "../shell/SectionHead";
import ShareButton from "../shell/ShareButton";
import { TeamsEmpty } from "../teams/StandingsRanking";
import Podium from "../tournament/Podium";
import { avatarFallback } from "../tournament/TournamentScorers";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { useSeasonSummary } from "./useSeasonSummary";
import type { AwardGroupView, RecordView, SeasonChampionView } from "./seasonSummaryViewState";

/**
 * Resumen de una temporada cerrada (/temporadas/:id/resumen). Solo se enlaza desde /admin,
 * pero la página es pública: la ve cualquiera que tenga el enlace.
 */
export default function SeasonSummaryView() {
  const { id = "" } = useParams();
  const { loading, missing, error, view, onRefresh } = useSeasonSummary(id);

  if (missing) {
    return (
      <PlatformLayout>
        <div className="teams-page tour-detail">
          <BackLink />
          <TeamsEmpty
            icon={<SearchX size={20} />}
            title="Este resumen no está disponible."
            hint="El resumen se publica cuando la temporada se cierra."
          />
        </div>
      </PlatformLayout>
    );
  }

  if (!view && loading) {
    return (
      <PlatformLayout>
        <div className="teams-page tour-detail">
          <p className="teams-loading">Cargando resumen…</p>
        </div>
      </PlatformLayout>
    );
  }

  if (!view) {
    return (
      <PlatformLayout>
        <div className="teams-page tour-detail">
          <BackLink />
          <p className="teams-error">
            {error}{" "}
            <button type="button" onClick={onRefresh}>
              Reintentar
            </button>
          </p>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="teams-page tour-detail season-summary">
        <BackLink />
        <header className="teams-head">
          <span className="teams-head__icon" aria-hidden="true">
            <Trophy size={24} />
          </span>
          <div className="teams-head__copy">
            <h1>{view.title}</h1>
            <p>{view.rangeLabel ? `Resumen · ${view.rangeLabel}` : "Resumen de la temporada"}</p>
          </div>
          <div className="teams-head__cta">
            <ShareButton text={view.shareText} className="home-btn home-btn--outline" />
          </div>
        </header>

        <section className="tour-detail__section">
          <SectionHead icon={<Trophy size={22} />} title="Campeones" subtitle="Podio de cada torneo" />
          {view.champions.length === 0 ? (
            <TeamsEmpty icon={<Trophy size={20} />} title="Sin torneos en esta temporada." hint="No se jugó ningún torneo." />
          ) : (
            <div className="season-summary__champions">
              {view.champions.map((champion) => (
                <ChampionBlock key={champion.id} champion={champion} />
              ))}
            </div>
          )}
        </section>

        <section className="tour-detail__section">
          <SectionHead icon={<BarChart3 size={22} />} title="La temporada en números" subtitle="Todos los torneos juntos" />
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
          <SectionHead icon={<Award size={22} />} title="Premios individuales" subtitle="Los mejores de la temporada" />
          {view.awards.length === 0 ? (
            <TeamsEmpty
              icon={<Award size={20} />}
              title="Sin datos individuales."
              hint="Los premios salen de los goles, MVP y arqueros capturados en cada partido."
            />
          ) : (
            <div className="season-summary__awards">
              {view.awards.map((group) => (
                <AwardCard key={group.key} group={group} />
              ))}
            </div>
          )}
        </section>

        <section className="tour-detail__section">
          <SectionHead icon={<Flame size={22} />} title="Récords" subtitle="Lo más destacado" />
          {view.records.length === 0 ? (
            <TeamsEmpty icon={<Flame size={20} />} title="Sin récords." hint="No hubo partidos jugados en la temporada." />
          ) : (
            <ul className="season-summary__records">
              {view.records.map((record) => (
                <RecordCard key={record.key} record={record} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PlatformLayout>
  );
}

function BackLink() {
  return (
    <Link to="/torneos" className="tour-detail__back">
      <ArrowLeft size={16} aria-hidden />
      Torneos
    </Link>
  );
}

function ChampionBlock({ champion }: { champion: SeasonChampionView }) {
  return (
    <article className="season-summary__champion">
      <header>
        <Link to={champion.href}>{champion.name}</Link>
        {champion.detail ? <span>{champion.detail}</span> : null}
      </header>
      {champion.hasPodium ? <Podium slots={champion.slots} /> : <p className="season-summary__muted">Sin podio.</p>}
    </article>
  );
}

function AwardCard({ group }: { group: AwardGroupView }) {
  return (
    <div className="tour-scorers season-summary__award">
      <header>
        <strong>{group.title}</strong>
        <span>{group.subtitle}</span>
      </header>
      <ol className="tour-scorers__list">
        {group.entries.map((entry, index) => (
          <li key={entry.key} className={index === 0 ? "is-first" : undefined}>
            <span className="tour-scorers__rank">{index + 1}</span>
            <img
              className="tour-scorers__photo"
              src={entry.imageUrl || avatarFallback(entry.name)}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = avatarFallback(entry.name);
              }}
            />
            <span className="tour-scorers__who">
              <strong>{entry.name}</strong>
              {entry.clubName ? (
                <span className="tour-scorers__club">
                  <img src={entry.clubLogo || DEFAULT_CLUB_LOGO} alt="" />
                  <span>{entry.clubName}</span>
                </span>
              ) : null}
              {entry.detail ? <span className="tour-scorers__club">{entry.detail}</span> : null}
            </span>
            <span className="tour-scorers__goals">
              <strong>{entry.value}</strong>
              <span>{entry.unit}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RecordCard({ record }: { record: RecordView }) {
  const body = (
    <>
      <span className="season-summary__record-label">{record.label}</span>
      <span className="season-summary__record-main">
        <span className="season-summary__record-logos" aria-hidden>
          {record.logos.map((logo, index) => (
            <img key={index} src={logo || DEFAULT_CLUB_LOGO} alt="" />
          ))}
        </span>
        <strong>{record.headline}</strong>
      </span>
      <span className="season-summary__record-detail">{record.detail}</span>
    </>
  );
  return (
    <li>
      {record.href ? (
        <Link to={record.href} className="season-summary__record">
          {body}
        </Link>
      ) : (
        <div className="season-summary__record">{body}</div>
      )}
    </li>
  );
}
