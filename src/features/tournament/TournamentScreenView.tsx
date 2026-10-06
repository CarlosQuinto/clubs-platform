import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Goal, ListOrdered, Medal, Pencil, SearchX, Trophy } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import AdSlot from "../shell/AdSlot";
import SectionHead from "../shell/SectionHead";
import { Ranking, TeamsEmpty } from "../teams/StandingsRanking";
import { useTournamentEdit } from "./TournamentEditModal";
import { useAuth } from "../../domains/auth/AuthContext";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import TournamentCalendarPanel from "./TournamentCalendarPanel";
import TournamentScorers from "./TournamentScorers";
import { TOURNAMENT_STATUS } from "./tournamentStatus";
import { useTournamentScreen } from "./useTournamentScreen";
import type { PodiumSlotView } from "./tournamentViewState";

/** Clase de cada escalón del podio, en el orden en que se pinta: subcampeón, campeón, tercero. */
const PODIUM_TONE = ["is-second", "is-first", "is-third"] as const;

export default function TournamentScreenView() {
  const { id = "" } = useParams();
  const { isSuperAdmin } = useAuth();
  const { openEdit } = useTournamentEdit();
  const { loading, missing, error, view, onRefresh } = useTournamentScreen(id);

  if (missing) {
    return (
      <PlatformLayout>
        <div className="teams-page tour-detail">
          <BackLink />
          <TeamsEmpty
            icon={<SearchX size={20} />}
            title="Torneo no encontrado."
            hint="Puede que se haya eliminado. Revisa la lista de torneos."
          />
        </div>
      </PlatformLayout>
    );
  }

  if (!view && loading) {
    return (
      <PlatformLayout>
        <div className="teams-page tour-detail">
          <p className="teams-loading">Cargando torneo…</p>
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

  const status = TOURNAMENT_STATUS[view.phase];
  const rounds = view.rounds.length;

  return (
    <PlatformLayout>
      <div className="teams-page tour-detail">
        <AdSlot placement="tournament" layout="top" />
        <BackLink />
        <header className="teams-head">
          <span className="teams-head__icon" aria-hidden="true">
            <Trophy size={24} />
          </span>
          <div className="teams-head__copy">
            <h1>{view.title}</h1>
            {view.subtitle ? <p>{view.subtitle}</p> : null}
          </div>
          {isSuperAdmin ? (
            <button
              type="button"
              className="home-btn home-btn--outline teams-head__cta"
              onClick={() => openEdit(id)}
            >
              <Pencil size={16} />
              Editar torneo
            </button>
          ) : null}
        </header>
        <div className="tour-detail__meta">
          <span className={`home-status ${status.className}`}>
            <span className="home-status__dot" aria-hidden />
            {status.label}
          </span>
          {view.prize ? (
            <span className="tour-detail__prize">
              <Medal size={15} aria-hidden />
              Premio al campeón: <strong>{view.prize}</strong>
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="teams-error">
            {error}{" "}
            <button type="button" onClick={onRefresh}>
              Reintentar
            </button>
          </p>
        ) : null}

        {view.showPodium ? <Podium slots={view.podium} /> : null}

        <section className="tour-detail__section">
          <SectionHead icon={<ListOrdered size={22} />} title="Posiciones" subtitle="Tabla del torneo" />
          <Ranking
            rows={view.standings}
            emptyTitle="Sin partidos oficiales todavía."
            emptyHint="La tabla se arma con los marcadores de cada jornada."
          />
        </section>

        <section className="tour-detail__section">
          <SectionHead icon={<Goal size={22} />} title="Goleadores" subtitle="Los máximos anotadores" />
          <TournamentScorers scorers={view.scorers} />
        </section>

        <section className="tour-detail__section">
          <SectionHead
            icon={<CalendarDays size={22} />}
            title="Calendario"
            subtitle={rounds ? `${rounds} ${rounds === 1 ? "jornada" : "jornadas"}` : "Partidos del torneo"}
          />
          <TournamentCalendarPanel rounds={view.rounds} admin={isSuperAdmin} onSaved={onRefresh} />
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

function Podium({ slots }: { slots: PodiumSlotView[] }) {
  return (
    <section className="tour-detail__section">
      <SectionHead icon={<Trophy size={22} />} title="Podio" subtitle="Torneo finalizado" />
      <ol className="tour-podium">
        {slots.map((slot, index) => {
          const tone = PODIUM_TONE[index] ?? "is-third";
          const Icon = tone === "is-first" ? Trophy : Medal;
          return (
            <li key={slot.placeLabel} className={`tour-podium__step ${tone}`}>
              <span className="home-crest home-crest--lg">
                <img src={slot.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
              </span>
              <span className="tour-podium__place">
                <Icon size={14} aria-hidden />
                {slot.placeLabel}
              </span>
              {slot.clubName && slot.clubHref ? (
                <Link to={slot.clubHref} className="tour-podium__club">
                  {slot.clubName}
                </Link>
              ) : (
                <span className="tour-podium__club is-empty">{slot.clubName || "—"}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
