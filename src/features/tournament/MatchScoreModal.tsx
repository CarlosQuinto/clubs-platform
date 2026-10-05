import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useModalLock } from "../../shared/useModalLock";
import { C, FormSelect, PrimaryButton, RADIUS, SHADOWS, SecondaryButton } from "../../shared/ui";
import { loadMatchScoreSheet } from "./tournamentQueries";
import { saveMatchEvents } from "../../domains/matches/matchCommands";
import type { CalendarMatchView, ScoreCardView, ScoreGoalView, ScorePlayerView } from "./tournamentViewState";

const SCORE_MAX = 30;
const MINUTE_MAX = 150;

type GoalRow = ScoreGoalView;

export default function MatchScoreModal({
  match,
  onClose,
  onSaved,
}: {
  match: CalendarMatchView;
  onClose: () => void;
  onSaved: () => void;
}) {
  useModalLock(onClose);
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [homeGoals, setHomeGoals] = useState<GoalRow[]>([]);
  const [awayGoals, setAwayGoals] = useState<GoalRow[]>([]);
  const [homeYellow, setHomeYellow] = useState<ScoreCardView[]>([]);
  const [awayYellow, setAwayYellow] = useState<ScoreCardView[]>([]);
  const [homeRed, setHomeRed] = useState<ScoreCardView[]>([]);
  const [awayRed, setAwayRed] = useState<ScoreCardView[]>([]);
  const [homePlayers, setHomePlayers] = useState<ScorePlayerView[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<ScorePlayerView[]>([]);
  const [homeClubId, setHomeClubId] = useState(match.home.id);
  const [awayClubId, setAwayClubId] = useState(match.away.id);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadMatchScoreSheet(match.id)
      .then((sheet) => {
        if (cancelled || !sheet) return;
        setHomeScore(sheet.homeScore);
        setAwayScore(sheet.awayScore);
        setHomeGoals(sheet.homeGoals);
        setAwayGoals(sheet.awayGoals);
        setHomeYellow(sheet.homeYellow);
        setAwayYellow(sheet.awayYellow);
        setHomeRed(sheet.homeRed);
        setAwayRed(sheet.awayRed);
        setHomePlayers(sheet.homePlayers);
        setAwayPlayers(sheet.awayPlayers);
        setHomeClubId(sheet.homeClubId);
        setAwayClubId(sheet.awayClubId);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("No se pudo cargar el marcador.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [match.id]);

  const save = async () => {
    const names = Object.fromEntries(
      [...homePlayers, ...awayPlayers].map((player) => [player.id, player.name]),
    );
    try {
      setBusy(true);
      setError("");
      await saveMatchEvents({
        matchId: match.id,
        homeScore,
        awayScore,
        homeClubId,
        awayClubId,
        homeGoals: homeGoals.slice(0, homeScore).filter((goal) => goal.scorerId || goal.minute != null),
        awayGoals: awayGoals.slice(0, awayScore).filter((goal) => goal.scorerId || goal.minute != null),
        homeYellow,
        awayYellow,
        homeRed,
        awayRed,
        names,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("No se pudieron guardar las estadísticas.");
      setBusy(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-stats-title"
      onClick={onClose}
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(20, 18, 15, 0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "4vh 0.75rem 0.75rem",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="match-stats-panel"
        style={{
          width: "min(800px, 100%)",
          maxHeight: "calc(100dvh - 4vh - 1.5rem)",
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOWS.lg,
        }}
      >
        <div className="match-stats-head">
          <div>
            <h2 id="match-stats-title" style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: C.navy900 }}>
              Marcador y estadísticas
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: C.gray500 }}>
              {match.home.name} vs {match.away.name}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="match-stats-close">
            <X size={18} />
          </button>
        </div>
        <div className="match-stats-body">
          <div className="match-scoreboard">
            <ScoreStepper name={match.home.name} value={homeScore} onChange={setHomeScore} />
            <span className="match-scoreboard__sep" aria-hidden>
              –
            </span>
            <ScoreStepper name={match.away.name} value={awayScore} onChange={setAwayScore} />
          </div>
          {loading ? (
            <p style={{ color: C.gray400, fontSize: "0.85rem", margin: 0 }}>Cargando plantillas…</p>
          ) : (
            <div className="match-stats-grid">
              <TeamBlock
                name={match.home.name}
                count={homeScore}
                rows={pad(homeGoals, homeScore)}
                onRows={setHomeGoals}
                yellow={homeYellow}
                onYellow={setHomeYellow}
                red={homeRed}
                onRed={setHomeRed}
                players={homePlayers}
                rivals={awayPlayers}
              />
              <TeamBlock
                name={match.away.name}
                count={awayScore}
                rows={pad(awayGoals, awayScore)}
                onRows={setAwayGoals}
                yellow={awayYellow}
                onYellow={setAwayYellow}
                red={awayRed}
                onRed={setAwayRed}
                players={awayPlayers}
                rivals={homePlayers}
              />
            </div>
          )}
          {error ? <p style={{ color: C.red, fontSize: "0.8rem", margin: "0.75rem 0 0" }}>{error}</p> : null}
        </div>
        <div className="match-stats-footer">
          <SecondaryButton type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="button" onClick={() => void save()} disabled={busy || loading}>
            {busy ? "Guardando…" : "Guardar"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ScoreStepper({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const next = (delta: number) => onChange(Math.max(0, Math.min(SCORE_MAX, value + delta)));
  return (
    <div className="score-stepper">
      <span className="score-stepper__name">{name}</span>
      <div className="score-stepper__ctrl">
        <button type="button" className="score-stepper__btn" aria-label={`Subir marcador de ${name}`} onClick={() => next(1)} disabled={value >= SCORE_MAX}>
          <ChevronUp size={18} strokeWidth={2.5} />
        </button>
        <span className="score-stepper__value">{value}</span>
        <button type="button" className="score-stepper__btn" aria-label={`Bajar marcador de ${name}`} onClick={() => next(-1)} disabled={value <= 0}>
          <ChevronDown size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function TeamBlock({
  name,
  count,
  rows,
  onRows,
  yellow,
  onYellow,
  red,
  onRed,
  players,
  rivals,
}: {
  name: string;
  count: number;
  rows: GoalRow[];
  onRows: (rows: GoalRow[]) => void;
  yellow: ScoreCardView[];
  onYellow: (cards: ScoreCardView[]) => void;
  red: ScoreCardView[];
  onRed: (cards: ScoreCardView[]) => void;
  players: ScorePlayerView[];
  rivals: ScorePlayerView[];
}) {
  const patch = (index: number, next: Partial<GoalRow>) =>
    onRows(rows.map((row, item) => (item === index ? { ...row, ...next } : row)));
  return (
    <div className="match-team-block">
      <div className="match-team-block__name">{name}</div>
      <div className="match-section-label">Goles</div>
      {count === 0 ? (
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.75rem", color: C.gray400 }}>Sin goles.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.95rem" }}>
          {rows.slice(0, count).map((row, index) => {
            const scorers = row.isOwnGoal ? rivals : players;
            return (
              <div key={index} className="match-goal-card">
                <div className="match-goal-card__label">
                  <span>{row.isOwnGoal ? `Autogol ${index + 1}` : `Gol ${index + 1}`}</span>
                  <MinuteInput
                    value={row.minute}
                    label={`Minuto del gol ${index + 1} ${name}`}
                    onChange={(minute) => patch(index, { minute })}
                  />
                </div>
                <FormSelect
                  value={row.scorerId}
                  aria-label={`Goleador ${index + 1} ${name}`}
                  onChange={(event) => patch(index, { scorerId: event.target.value })}
                >
                  <option value="">{row.isOwnGoal ? "Jugador rival" : "Goleador"}</option>
                  {scorers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </FormSelect>
                {!row.isOwnGoal && !row.isPenalty ? (
                  <FormSelect
                    value={row.assistId}
                    aria-label={`Asistencia ${index + 1} ${name}`}
                    onChange={(event) => patch(index, { assistId: event.target.value })}
                  >
                    <option value="">Asistencia (opcional)</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </FormSelect>
                ) : null}
                <div className="match-goal-flags">
                  <button
                    type="button"
                    className={`match-flag${row.isPenalty ? " is-on" : ""}`}
                    aria-pressed={row.isPenalty}
                    onClick={() => patch(index, { isPenalty: !row.isPenalty, isOwnGoal: false, assistId: "" })}
                  >
                    Penal
                  </button>
                  <button
                    type="button"
                    className={`match-flag match-flag--og${row.isOwnGoal ? " is-on" : ""}`}
                    aria-pressed={row.isOwnGoal}
                    onClick={() => patch(index, { isOwnGoal: !row.isOwnGoal, isPenalty: false, assistId: "", scorerId: "" })}
                  >
                    Autogol
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CardList label="Amarillas" tone="yellow" cards={yellow} onChange={onYellow} players={players} />
      <CardList label="Rojas" tone="red" cards={red} onChange={onRed} players={players} />
    </div>
  );
}

function CardList({
  label,
  tone,
  cards,
  onChange,
  players,
}: {
  label: string;
  tone: "yellow" | "red";
  cards: ScoreCardView[];
  onChange: (cards: ScoreCardView[]) => void;
  players: ScorePlayerView[];
}) {
  const patch = (index: number, next: Partial<ScoreCardView>) =>
    onChange(cards.map((card, item) => (item === index ? { ...card, ...next } : card)));
  return (
    <div className={`match-discipline match-discipline--${tone}`}>
      <div className="match-discipline__head">
        <span className="match-section-label">{label}</span>
        <button type="button" className="match-discipline__add" onClick={() => onChange([...cards, { playerId: "", minute: null }])}>
          <Plus size={12} /> Añadir
        </button>
      </div>
      {cards.length === 0 ? (
        <p className="match-discipline__empty">Ninguna.</p>
      ) : (
        <div className="match-discipline__list">
          {cards.map((card, index) => (
            <div key={`${label}-${index}`} className="match-discipline__row">
              <FormSelect value={card.playerId} onChange={(event) => patch(index, { playerId: event.target.value })}>
                <option value="">Jugador</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </FormSelect>
              <MinuteInput
                value={card.minute}
                label={`Minuto de ${label.toLowerCase()} ${index + 1}`}
                onChange={(minute) => patch(index, { minute })}
              />
              <button
                type="button"
                className="match-discipline__remove"
                aria-label={`Quitar ${label.toLowerCase()}`}
                onClick={() => onChange(cards.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Minuto opcional del evento (1–150); vacío = sin minuto. */
function MinuteInput({
  value,
  label,
  onChange,
}: {
  value: number | null;
  label: string;
  onChange: (minute: number | null) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      className="match-minute-input"
      placeholder="Min."
      aria-label={label}
      value={value == null ? "" : String(value)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
        const minute = digits ? Math.min(Number(digits), MINUTE_MAX) : null;
        onChange(minute === 0 ? null : minute);
      }}
    />
  );
}

function pad(rows: GoalRow[], count: number): GoalRow[] {
  const next = rows.slice(0, count);
  while (next.length < count) next.push({ scorerId: "", assistId: "", isPenalty: false, isOwnGoal: false, minute: null });
  return next;
}
