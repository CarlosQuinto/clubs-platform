import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Goal, ListOrdered, Lock, Medal, Pencil, SearchX, Trophy, Unlock } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import ConfirmModal from "../../shared/ConfirmModal";
import { closeTournament, dataConnect, reopenTournament } from "../../infrastructure/dataconnect";
import AdSlot from "../shell/AdSlot";
import SectionHead from "../shell/SectionHead";
import { Ranking, TeamsEmpty } from "../teams/StandingsRanking";
import { useTournamentEdit } from "./TournamentEditModal";
import { useAuth } from "../../domains/auth/AuthContext";
import Podium from "./Podium";
import TournamentCalendarPanel from "./TournamentCalendarPanel";
import TournamentScorers from "./TournamentScorers";
import { TOURNAMENT_STATUS } from "./tournamentStatus";
import { useTournamentScreen } from "./useTournamentScreen";
import type { PodiumSlotView } from "./tournamentViewState";

function closeMessage(pending: number) {
  const lines = [
    "El torneo pasará a Finalizado y se creará el podio con la tabla actual. No se podrán capturar marcadores ni cambiar el calendario hasta reabrirlo.",
  ];
  if (pending > 0) {
    lines.push(
      `¿Seguro? Aún hay ${pending} partido${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"}: se desprogramarán y se liberarán sus canchas.`,
    );
  }
  return lines.join("\n\n");
}

export default function TournamentScreenView() {
  const { id = "" } = useParams();
  const { isSuperAdmin } = useAuth();
  const { openEdit } = useTournamentEdit();
  const { loading, missing, error, view, onRefresh } = useTournamentScreen(id);
  const [closeOpen, setCloseOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const runAction = async (action: () => Promise<boolean>, failure: string) => {
    setActionBusy(true);
    setActionError("");
    try {
      if (!(await action())) throw new Error(failure);
      setCloseOpen(false);
      setReopenOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(failure);
    } finally {
      setActionBusy(false);
    }
  };
  const runClose = () =>
    runAction(async () => Boolean((await closeTournament(dataConnect, { id })).data.tournament), "No se pudo cerrar el torneo.");
  const runReopen = () =>
    runAction(
      async () => Boolean((await reopenTournament(dataConnect, { id })).data.tournament),
      "No se pudo reabrir el torneo. Si su temporada ya está cerrada, no se puede.",
    );
  const cancelAction = () => {
    if (actionBusy) return;
    setCloseOpen(false);
    setReopenOpen(false);
    setActionError("");
  };

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
            <div className="teams-head__cta" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {view.phase !== "finished" ? (
                <>
                  <button type="button" className="home-btn home-btn--outline" onClick={() => openEdit(id)}>
                    <Pencil size={16} />
                    Editar torneo
                  </button>
                  <button type="button" className="home-btn home-btn--outline" onClick={() => setCloseOpen(true)}>
                    <Lock size={16} />
                    Cerrar torneo
                  </button>
                </>
              ) : view.seasonActive ? (
                <button type="button" className="home-btn home-btn--outline" onClick={() => setReopenOpen(true)}>
                  <Unlock size={16} />
                  Reabrir torneo
                </button>
              ) : null}
            </div>
          ) : null}
        </header>
        <div className="tour-detail__meta">
          <span className={`home-status ${status.className}`}>
            <span className="home-status__dot" aria-hidden />
            {status.label}
          </span>
          {view.phase === "upcoming" && view.startLabel ? (
            <span className="tour-detail__prize">
              <CalendarDays size={15} aria-hidden />
              Inicia: <strong>{view.startLabel}</strong>
            </span>
          ) : null}
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

        {view.showPodium ? <PodiumSection slots={view.podium} /> : null}

        <section className="tour-detail__section">
          <SectionHead icon={<ListOrdered size={22} />} title="Posiciones" />
          <Ranking
            rows={view.standings}
            emptyTitle="Sin partidos oficiales todavía."
          />
        </section>

        <section className="tour-detail__section">
          <SectionHead icon={<Goal size={22} />} title="Goleadores" />
          <TournamentScorers scorers={view.scorers} />
        </section>

        <section className="tour-detail__section">
          <SectionHead
            icon={<CalendarDays size={22} />}
            title="Calendario"
            subtitle={rounds ? `${rounds} ${rounds === 1 ? "jornada" : "jornadas"}` : undefined}
          />
          <TournamentCalendarPanel rounds={view.rounds} admin={isSuperAdmin && view.phase !== "finished"} onSaved={onRefresh} />
        </section>
        <ConfirmModal
          open={closeOpen}
          title={`Cerrar ${view.title}`}
          message={closeMessage(view.pendingMatches)}
          confirmLabel="Cerrar torneo"
          cancelLabel="Volver"
          danger={view.pendingMatches > 0}
          busy={actionBusy}
          confirmHint={actionError || undefined}
          onConfirm={() => void runClose()}
          onCancel={cancelAction}
        />
        <ConfirmModal
          open={reopenOpen}
          title={`Reabrir ${view.title}`}
          message="El torneo vuelve a estar en curso: se quita el podio y se podrán capturar marcadores y programar partidos otra vez."
          confirmLabel="Reabrir torneo"
          cancelLabel="Volver"
          busy={actionBusy}
          confirmHint={actionError || undefined}
          onConfirm={() => void runReopen()}
          onCancel={cancelAction}
        />
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

function PodiumSection({ slots }: { slots: PodiumSlotView[] }) {
  return (
    <section className="tour-detail__section">
      <SectionHead icon={<Trophy size={22} />} title="Podio" subtitle="Torneo finalizado" />
      <Podium slots={slots} />
    </section>
  );
}
