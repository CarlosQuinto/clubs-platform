import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Minus, Plus, Radio, X } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";
import { useModalLock } from "../../shared/useModalLock";
import { PrimaryButton } from "../../shared/ui";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { liveMinute } from "../../domains/matches/liveMatchPhase";
import {
  closeLiveMatch,
  recordLiveCard,
  recordLiveGoal,
} from "../../domains/matches/liveMatchCommands";
import { notifyTournamentEdited } from "../../domains/competition/tournamentEdited";
import { BallIcon, CardIcon } from "./MatchIcons";
import type { MatchDetailView, MatchSide, RosterPlayerView, TimelineKind } from "./matchDetailViewState";

const MINUTE_MAX = 150;

const ACTIONS: { kind: TimelineKind; label: string }[] = [
  { kind: "goal", label: "Gol" },
  { kind: "penalty", label: "Penal" },
  { kind: "ownGoal", label: "Autogol" },
  { kind: "yellow", label: "Amarilla" },
  { kind: "red", label: "Roja" },
];

const SAVED_LABEL: Record<TimelineKind, string> = {
  goal: "Gol registrado.",
  penalty: "Penal registrado.",
  ownGoal: "Autogol registrado.",
  yellow: "Amarilla registrada.",
  red: "Roja registrada.",
};

/** Minuto sugerido: el que corre desde la hora de inicio; null antes de empezar o sin horario. */
function suggestedMinute(view: MatchDetailView) {
  if (view.kickoffMs == null) return null;
  const now = new Date();
  if (now.getTime() < view.kickoffMs) return null;
  return liveMinute(view.kickoffMs, now, view.durationMinutes);
}

/**
 * Marcador en vivo del superadmin: cada gol o tarjeta se guarda al momento con su minuto.
 * «Finalizar partido» lo marca como jugado y desde ahí cuenta en la tabla.
 */
export default function LiveScorePanel({ view, onSaved }: { view: MatchDetailView; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="live-sheet__trigger" onClick={() => setOpen(true)}>
        <Radio size={16} />
        Marcador en vivo
      </button>
      {open ? <LiveSheet view={view} onSaved={onSaved} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function LiveSheet({
  view,
  onSaved,
  onClose,
}: {
  view: MatchDetailView;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [side, setSide] = useState<MatchSide | null>(null);
  const [kind, setKind] = useState<TimelineKind | null>(null);
  /** "" = «Sin asignar» (solo en goles); null = aún no elegido. */
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [assistId, setAssistId] = useState("");
  const [minute, setMinute] = useState<number | null>(() => suggestedMinute(view));
  const [minuteTouched, setMinuteTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const sending = useRef(false);

  // Con la confirmación abierta, ESC solo cierra la confirmación.
  useModalLock(confirmFinish ? () => undefined : onClose);

  // Mientras nadie lo toque, el minuto sigue al reloj del partido.
  useEffect(() => {
    if (minuteTouched) return;
    const timer = window.setInterval(() => setMinute(suggestedMinute(view)), 15_000);
    return () => window.clearInterval(timer);
  }, [minuteTouched, view]);

  const team = side === "home" ? view.header.home : side === "away" ? view.header.away : null;
  const own = side ? view.roster[side] : [];
  const rival = side === "home" ? view.roster.away : side === "away" ? view.roster.home : [];
  const isGoal = kind === "goal" || kind === "penalty" || kind === "ownGoal";
  // El autogol se suma al equipo elegido, pero lo marca un jugador rival.
  const candidates = kind === "ownGoal" ? rival : own;
  const ready = side != null && kind != null && playerId != null && (isGoal || playerId !== "");

  const reset = (keepMessage: string) => {
    setKind(null);
    setPlayerId(null);
    setAssistId("");
    setMinuteTouched(false);
    setMinute(suggestedMinute(view));
    setMessage(keepMessage);
  };

  const pickSide = (next: MatchSide) => {
    setSide(next);
    setPlayerId(null);
    setAssistId("");
    setMessage("");
    setError("");
  };

  const pickKind = (next: TimelineKind) => {
    setKind(next);
    setPlayerId(null);
    setAssistId("");
    setMessage("");
    setError("");
  };

  const changeMinute = (next: number | null) => {
    setMinuteTouched(true);
    setMinute(next == null ? null : Math.min(Math.max(next, 1), MINUTE_MAX));
  };

  const save = async () => {
    if (!ready || !side || !kind || playerId == null || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const clubId = side === "home" ? view.homeClubId : view.awayClubId;
    try {
      if (kind === "yellow" || kind === "red") {
        await recordLiveCard({
          matchId: view.id,
          clubId,
          playerId,
          color: kind === "red" ? "RED" : "YELLOW",
          minute,
        });
      } else {
        await recordLiveGoal({
          matchId: view.id,
          clubId,
          kind,
          scorerId: playerId,
          assistId,
          minute,
        });
      }
      reset(SAVED_LABEL[kind]);
      onSaved();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Si el partido ya se finalizó, recarga la página.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const finish = async () => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await closeLiveMatch(view.id);
      notifyTournamentEdited();
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setConfirmFinish(false);
      setError("No se pudo finalizar. Si ya estaba finalizado, recarga la página.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const homeScore = view.header.home.score ?? 0;
  const awayScore = view.header.away.score ?? 0;

  return createPortal(
    <div className="live-sheet" role="dialog" aria-modal="true" aria-labelledby="live-sheet-title" onClick={onClose}>
      <div className="live-sheet__panel" onClick={(event) => event.stopPropagation()}>
        <div className="live-sheet__head">
          <div>
            <h2 id="live-sheet-title" className="live-sheet__title">
              Marcador en vivo
            </h2>
            <p className="live-sheet__score">
              {view.header.home.name} <strong>{homeScore}–{awayScore}</strong> {view.header.away.name}
            </p>
          </div>
          <button type="button" className="live-sheet__close" aria-label="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="live-sheet__body">
          <div className="live-sheet__label">Equipo</div>
          <div className="live-sheet__teams">
            {(["home", "away"] as const).map((key) => {
              const club = view.header[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`live-sheet__team${side === key ? " is-on" : ""}`}
                  aria-pressed={side === key}
                  onClick={() => pickSide(key)}
                >
                  <img src={club.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
                  <span>{club.name}</span>
                </button>
              );
            })}
          </div>

          {side ? (
            <>
              <div className="live-sheet__label">Acción</div>
              <div className="live-sheet__actions">
                {ACTIONS.map((action) => (
                  <button
                    key={action.kind}
                    type="button"
                    className={`live-sheet__action live-sheet__action--${action.kind}${kind === action.kind ? " is-on" : ""}`}
                    aria-pressed={kind === action.kind}
                    onClick={() => pickKind(action.kind)}
                  >
                    {action.kind === "yellow" || action.kind === "red" ? (
                      <CardIcon color={action.kind} />
                    ) : (
                      <BallIcon size={16} />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {side && kind ? (
            <>
              <div className="live-sheet__label">
                {kind === "ownGoal" ? `Jugador rival que lo marcó` : isGoal ? "Goleador" : "Jugador"}
                {team && kind !== "ownGoal" ? <span> · {team.name}</span> : null}
              </div>
              <PlayerGrid
                players={candidates}
                value={playerId}
                onChange={setPlayerId}
                allowUnassigned={isGoal}
              />
            </>
          ) : null}

          {kind === "goal" && playerId != null ? (
            <>
              <div className="live-sheet__label">Asistencia</div>
              <PlayerGrid
                players={own.filter((player) => player.id !== playerId)}
                value={assistId}
                onChange={(next) => setAssistId(next ?? "")}
                allowUnassigned
                unassignedLabel="Sin asistencia"
              />
            </>
          ) : null}

          {side && kind && playerId != null ? (
            <>
              <div className="live-sheet__label">
                Minuto
                {!minuteTouched && minute != null ? <span> · automático</span> : null}
              </div>
              <div className="live-sheet__minute">
                <button
                  type="button"
                  className="live-sheet__step"
                  aria-label="Restar un minuto"
                  onClick={() => changeMinute((minute ?? 1) - 1)}
                  disabled={minute == null || minute <= 1}
                >
                  <Minus size={18} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Minuto del partido"
                  className="live-sheet__minute-input"
                  placeholder="—"
                  value={minute == null ? "" : String(minute)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                    changeMinute(digits ? Number(digits) || null : null);
                  }}
                />
                <button
                  type="button"
                  className="live-sheet__step"
                  aria-label="Sumar un minuto"
                  onClick={() => changeMinute((minute ?? 0) + 1)}
                  disabled={minute != null && minute >= MINUTE_MAX}
                >
                  <Plus size={18} />
                </button>
              </div>
              {view.kickoffMs != null && Date.now() < view.kickoffMs ? (
                <p className="live-sheet__hint">El partido aún no empieza según su horario.</p>
              ) : null}
            </>
          ) : null}

          {message ? (
            <p className="live-sheet__ok" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="live-sheet__error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="live-sheet__footer">
          <button
            type="button"
            className="live-sheet__finish"
            onClick={() => setConfirmFinish(true)}
            disabled={busy}
          >
            <Flag size={15} /> Finalizar partido
          </button>
          <PrimaryButton type="button" onClick={() => void save()} disabled={!ready || busy}>
            {busy ? "Guardando…" : kind && !isGoal ? "Guardar tarjeta" : "Guardar gol"}
          </PrimaryButton>
        </div>
      </div>
      <div onClick={(event) => event.stopPropagation()}>
        <ConfirmModal
          open={confirmFinish}
          title="Finalizar partido"
          message={`El resultado ${view.header.home.name} ${homeScore}–${awayScore} ${view.header.away.name} contará para la tabla y ya no se podrán registrar eventos en vivo. Las correcciones se hacen después desde «Marcador» en la página del torneo.`}
          confirmLabel="Finalizar"
          busy={busy}
          zIndex={10050}
          onConfirm={() => void finish()}
          onCancel={() => setConfirmFinish(false)}
        />
      </div>
    </div>,
    document.body,
  );
}

function PlayerGrid({
  players,
  value,
  onChange,
  allowUnassigned,
  unassignedLabel = "Sin asignar",
}: {
  players: RosterPlayerView[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowUnassigned: boolean;
  unassignedLabel?: string;
}) {
  return (
    <div className="live-sheet__players">
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          className={`live-sheet__player${value === player.id ? " is-on" : ""}${player.convocado ? " is-called" : ""}`}
          aria-pressed={value === player.id}
          onClick={() => onChange(player.id)}
        >
          <span className="live-sheet__number">{player.shirtNumber ?? "–"}</span>
          <span className="live-sheet__player-name">{player.name}</span>
        </button>
      ))}
      {allowUnassigned ? (
        <button
          type="button"
          className={`live-sheet__player live-sheet__player--none${value === "" ? " is-on" : ""}`}
          aria-pressed={value === ""}
          onClick={() => onChange("")}
        >
          <span className="live-sheet__player-name">{unassignedLabel}</span>
        </button>
      ) : null}
      {players.length === 0 && !allowUnassigned ? (
        <p className="live-sheet__hint">Este equipo no tiene jugadores activos.</p>
      ) : null}
    </div>
  );
}
