import { useState, type ReactNode } from "react";
import { CalendarX2, ClipboardList } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";
import { dataConnect, resetWalkoverMatch } from "../../infrastructure/dataconnect";
import { ArchiveSection } from "../shell/ArchiveUI";
import FixtureCard from "../matches/FixtureCard";
import ResultCard from "../matches/ResultCard";
import { TeamsEmpty } from "../teams/StandingsRanking";
import MatchScoreModal from "./MatchScoreModal";
import type { CalendarCardView, CalendarMatchView, RoundView } from "./tournamentViewState";

/** Calendario de la ficha de torneo: jornadas con las tarjetas de partido de portada y /partidos. */
export default function TournamentCalendarPanel({
  rounds,
  admin,
  onSaved,
}: {
  rounds: RoundView[];
  admin: boolean;
  onSaved: () => void;
}) {
  // Un solo formulario de programar abierto a la vez, como en /partidos.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scoring, setScoring] = useState<CalendarMatchView | null>(null);
  // Un W.O. no se captura: primero se confirma que vuelva a «por programar».
  const [resetting, setResetting] = useState<CalendarMatchView | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");

  const openScore = (match: CalendarMatchView) => {
    setResetError("");
    if (match.walkover) setResetting(match);
    else setScoring(match);
  };

  const confirmReset = async () => {
    if (!resetting) return;
    setResetBusy(true);
    setResetError("");
    try {
      const result = await resetWalkoverMatch(dataConnect, { id: resetting.id });
      if (!result.data.match) throw new Error("No se pudo reiniciar el partido.");
      setResetting(null);
      onSaved();
    } catch (err) {
      console.error(err);
      setResetError("No se pudo reiniciar el partido.");
    } finally {
      setResetBusy(false);
    }
  };

  if (rounds.length === 0) {
    return (
      <TeamsEmpty
        icon={<CalendarX2 size={20} />}
        title="Este torneo todavía no tiene partidos."
        hint="El calendario aparecerá aquí cuando se programen las jornadas."
      />
    );
  }
  return (
    <div className="tour-rounds">
      {rounds.map((round) => (
        <RoundBlock key={round.label} round={round}>
          {round.matches.map((card) => (
            <MatchCard
              key={card.score.id}
              card={card}
              admin={admin}
              editing={editingId === card.score.id}
              onEdit={setEditingId}
              onScore={openScore}
              onSaved={onSaved}
            />
          ))}
        </RoundBlock>
      ))}
      {scoring ? (
        <MatchScoreModal
          match={scoring}
          onClose={() => setScoring(null)}
          onSaved={() => {
            setScoring(null);
            onSaved();
          }}
        />
      ) : null}
      <ConfirmModal
        open={resetting !== null}
        title="Partido por ingreso tardío"
        message={
          resetting
            ? `${resetting.home.name} vs ${resetting.away.name} se dio por terminado 3-0 por ingreso tardío. Si continúas dejará de ser W.O., el marcador vuelve a 0-0 y el partido quedará por programar para jugarse.`
            : ""
        }
        confirmLabel="Continuar"
        cancelLabel="Volver"
        danger
        busy={resetBusy}
        confirmHint={resetError || undefined}
        onConfirm={() => void confirmReset()}
        onCancel={() => {
          if (resetBusy) return;
          setResetting(null);
          setResetError("");
        }}
      />
    </div>
  );
}

function RoundBlock({ round, children }: { round: RoundView; children: ReactNode }) {
  const title = /^\d+$/.test(round.label) ? `Jornada ${round.label}` : round.label;
  const count = round.matches.length;
  return (
    <ArchiveSection
      title={title}
      count={count}
      countLabel={`${count} ${count === 1 ? "partido" : "partidos"}`}
      collapsed={round.collapsed}
    >
      <div className="home-grid">{children}</div>
    </ArchiveSection>
  );
}

function MatchCard({
  card,
  admin,
  editing,
  onEdit,
  onScore,
  onSaved,
}: {
  card: CalendarCardView;
  admin: boolean;
  editing: boolean;
  onEdit: (id: string | null) => void;
  onScore: (match: CalendarMatchView) => void;
  onSaved: () => void;
}) {
  const scoreButton = admin ? (
    <button type="button" onClick={() => onScore(card.score)}>
      <ClipboardList size={16} aria-hidden />
      Marcador
    </button>
  ) : null;
  if (card.result) return <ResultCard match={card.result} actions={scoreButton} />;
  if (!card.fixture) return null;
  return (
    <FixtureCard
      match={card.fixture}
      admin={admin}
      editing={editing}
      onEdit={onEdit}
      onSaved={onSaved}
      actions={scoreButton}
    />
  );
}
