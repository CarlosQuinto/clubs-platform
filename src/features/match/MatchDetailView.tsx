import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock, History, ListOrdered, MapPin, Share2, Shirt, Trash2, TrendingUp, Trophy, Users } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import ConfirmModal from "../../shared/ConfirmModal";
import { C, SectionCard, SegmentedControl } from "../../shared/ui";
import { useAuth } from "../../domains/auth/AuthContext";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { removeLiveCard, removeLiveGoal } from "../../domains/matches/liveMatchCommands";
import LiveScorePanel from "./LiveScorePanel";
import { BallIcon, CardIcon } from "./MatchIcons";
import { useMatchDetail } from "./useMatchDetail";
import type {
  FormPillView,
  LineupTokenView,
  MatchDetailView,
  MatchHeaderView,
  MatchPreviewView,
  MatchTeamView,
  SquadPlayerView,
  StatRowView,
  TeamLineupView,
  TimelineEventView,
} from "./matchDetailViewState";

type Tab = "resumen" | "alineaciones" | "previa";

const TABS: { label: string; value: Tab }[] = [
  { label: "Resumen", value: "resumen" },
  { label: "Alineaciones", value: "alineaciones" },
  { label: "Previa", value: "previa" },
];

export default function MatchDetailPage() {
  const { id = "" } = useParams();
  const { isSuperAdmin } = useAuth();
  const { loading, missing, error, view, preview, refresh } = useMatchDetail(id);
  const [tab, setTab] = useState<Tab | null>(null);

  if (missing) {
    return (
      <PlatformLayout>
        <BackLink />
        <p style={{ color: C.gray500 }}>Partido no encontrado.</p>
      </PlatformLayout>
    );
  }

  if (!view) {
    return (
      <PlatformLayout>
        <BackLink />
        {loading ? (
          <p style={{ color: C.gray500 }}>Cargando partido…</p>
        ) : (
          <p style={{ color: C.red }}>
            {error || "No se pudo cargar el partido."}{" "}
            <button type="button" onClick={refresh} className="match-page__retry">
              Reintentar
            </button>
          </p>
        )}
      </PlatformLayout>
    );
  }

  const before = view.header.phase === "upcoming" || view.header.phase === "unscheduled";
  const current: Tab = tab ?? (before ? "previa" : "resumen");

  return (
    <PlatformLayout>
      <div className="match-page">
        <BackLink />
        <MatchHero header={view.header} shareText={view.shareText} />
        <div className="match-page__tabs">
          <SegmentedControl options={TABS} value={current} onChange={(value) => setTab(value as Tab)} />
        </div>
        {current === "resumen" ? (
          <SummaryTab view={view} admin={isSuperAdmin} onChanged={refresh} />
        ) : current === "alineaciones" ? (
          <LineupsTab view={view} />
        ) : (
          <PreviewTab view={view} preview={preview} />
        )}
      </div>
      {isSuperAdmin && view.liveEditable ? <LiveScorePanel view={view} onSaved={refresh} /> : null}
    </PlatformLayout>
  );
}

function BackLink() {
  return (
    <Link to="/partidos" className="match-page__back">
      ← Partidos
    </Link>
  );
}

// ── Cabecera ──

function MatchHero({ header, shareText }: { header: MatchHeaderView; shareText: string }) {
  const live = header.phase === "live";
  const showScore = header.home.score != null && header.away.score != null;
  return (
    <section
      className={`match-hero match-hero--${header.phase}`}
      style={header.courtImage ? { backgroundImage: `url("${header.courtImage}")` } : undefined}
    >
      <div className="match-hero__shade">
        <div className="match-hero__top">
          <Link to={header.tournamentHref} className="match-hero__tournament">
            <Trophy size={13} />
            {[header.tournamentName, header.category].filter(Boolean).join(" · ")}
          </Link>
          <ShareButton text={shareText} />
        </div>
        <div className="match-hero__board">
          <HeroTeam team={header.home} />
          <div className="match-hero__center">
            <span className={`match-hero__status${live ? " is-live" : ""}`}>
              {live ? <span className="live-card__pulse" aria-hidden /> : null}
              {header.statusLabel}
              {header.minuteLabel ? <span className="match-hero__minute">{header.minuteLabel}</span> : null}
            </span>
            {showScore ? (
              <div className="match-hero__score" aria-label={`${header.home.score} a ${header.away.score}`}>
                <span>{header.home.score}</span>
                <span className="match-hero__dash">–</span>
                <span>{header.away.score}</span>
              </div>
            ) : (
              <div className="match-hero__kickoff">{header.timeLabel || "vs"}</div>
            )}
            {header.penaltiesLabel ? <span className="match-hero__note">{header.penaltiesLabel}</span> : null}
            {header.walkover ? <span className="match-hero__note">3-0 por ingreso tardío</span> : null}
            {header.phase === "pending" ? (
              <span className="match-hero__note">El resultado aún no es oficial</span>
            ) : null}
          </div>
          <HeroTeam team={header.away} />
        </div>
        <div className="match-hero__chips">
          {header.round ? <span className="match-hero__chip">{header.round}</span> : null}
          {header.dateLabel ? (
            <span className="match-hero__chip">
              <CalendarDays size={12} /> {header.dateLabel}
            </span>
          ) : null}
          {header.timeLabel && showScore ? (
            <span className="match-hero__chip">
              <Clock size={12} /> {header.timeLabel}
            </span>
          ) : null}
          {header.venue ? (
            <span className="match-hero__chip">
              <MapPin size={12} /> {header.venue}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HeroTeam({ team }: { team: MatchTeamView }) {
  return (
    <Link to={team.href} className="match-hero__team">
      <span className="match-hero__crest">
        <img src={team.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
      </span>
      <span className="match-hero__name">{team.name}</span>
    </Link>
  );
}

function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Cancelar el menú de compartir no es un error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
    }
  };
  return (
    <button type="button" className="match-hero__share" onClick={() => void share()}>
      <Share2 size={14} />
      {copied ? "Enlace copiado" : "Compartir"}
    </button>
  );
}

// ── Resumen ──

function SummaryTab({ view, admin, onChanged }: { view: MatchDetailView; admin: boolean; onChanged: () => void }) {
  const [removing, setRemoving] = useState<TimelineEventView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editable = admin && view.liveEditable;

  const remove = async () => {
    if (!removing || busy) return;
    setBusy(true);
    setError("");
    try {
      if (removing.source === "goal") await removeLiveGoal(view.id, removing.id);
      else await removeLiveCard(view.id, removing.id);
      setRemoving(null);
      onChanged();
    } catch (err) {
      console.error(err);
      setError("No se pudo borrar. Si el partido ya se finalizó, recarga la página.");
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const hasEvents = view.timeline.length > 0;
  const showStats = view.stats.some((row) => row.home > 0 || row.away > 0);

  return (
    <>
      <SectionCard title="Cronología" icon={<ListOrdered size={16} color={C.amber} />}>
        {hasEvents ? (
          <ol className="match-timeline">
            {view.timeline.map((event) => (
              <TimelineRow
                key={`${event.source}-${event.id}`}
                event={event}
                onRemove={editable ? () => setRemoving(event) : undefined}
              />
            ))}
          </ol>
        ) : (
          <p className="match-page__empty">
            {view.header.phase === "upcoming" || view.header.phase === "unscheduled"
              ? "El partido aún no empieza."
              : "Aún no hay goles ni tarjetas."}
          </p>
        )}
        {error ? <p className="match-page__error">{error}</p> : null}
      </SectionCard>
      {showStats ? (
        <SectionCard title="Estadísticas" icon={<TrendingUp size={16} color={C.amber} />} style={{ marginTop: "1rem" }}>
          <div className="stat-bars">
            <div className="stat-bars__teams">
              <span>{view.header.home.name}</span>
              <span>{view.header.away.name}</span>
            </div>
            {view.stats.map((row) => (
              <StatBar key={row.label} row={row} />
            ))}
          </div>
          {view.mvp ? (
            <p className="match-page__mvp">
              <Trophy size={14} color={C.amber} /> Jugador del partido: <strong>{view.mvp}</strong>
            </p>
          ) : null}
        </SectionCard>
      ) : null}
      <ConfirmModal
        open={removing != null}
        title={removing?.source === "goal" ? "Borrar gol" : "Borrar tarjeta"}
        message={
          removing
            ? `${removing.minuteLabel ? `${removing.minuteLabel} · ` : ""}${removing.playerName}. ${
                removing.source === "goal" ? "El marcador se recalcula al borrarlo." : ""
              }`
            : ""
        }
        confirmLabel="Borrar"
        danger
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

function TimelineRow({ event, onRemove }: { event: TimelineEventView; onRemove?: () => void }) {
  const icon =
    event.kind === "yellow" || event.kind === "red" ? (
      <CardIcon color={event.kind} />
    ) : (
      <BallIcon size={16} own={event.kind === "ownGoal"} />
    );
  return (
    <li className={`match-timeline__item match-timeline__item--${event.side}`}>
      <span className="match-timeline__minute">{event.minuteLabel ?? "–"}</span>
      <div className="match-timeline__event">
        <span className="match-timeline__icon">{icon}</span>
        <div className="match-timeline__text">
          <span className="match-timeline__player">{event.playerName}</span>
          {event.detail ? <span className="match-timeline__detail">{event.detail}</span> : null}
        </div>
        {event.scoreAfter ? <span className="match-timeline__score">{event.scoreAfter}</span> : null}
        {onRemove ? (
          <button type="button" className="match-timeline__remove" aria-label="Borrar evento" onClick={onRemove}>
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function StatBar({ row }: { row: StatRowView }) {
  const total = row.home + row.away;
  const home = total === 0 ? 50 : (row.home / total) * 100;
  return (
    <div className="stat-bar">
      <div className="stat-bar__values">
        <strong>{row.home}</strong>
        <span>{row.label}</span>
        <strong>{row.away}</strong>
      </div>
      <div className="stat-bar__track" aria-hidden>
        <span className="stat-bar__home" style={{ width: `${home}%` }} />
        <span className="stat-bar__away" style={{ width: `${100 - home}%` }} />
      </div>
    </div>
  );
}

// ── Alineaciones ──

function LineupsTab({ view }: { view: MatchDetailView }) {
  const { home, away } = view.lineups;
  const hasPitch = home.starters.length > 0 || away.starters.length > 0;
  return (
    <>
      <SectionCard title="Alineaciones" icon={<Shirt size={16} color={C.amber} />}>
        {hasPitch ? (
          <>
            <div className="match-pitch__legend">
              <TeamTag lineup={away} />
              <TeamTag lineup={home} />
            </div>
            <div className="match-pitch" role="img" aria-label="Alineaciones en la cancha">
              <span className="match-pitch__half" aria-hidden />
              <span className="match-pitch__circle" aria-hidden />
              <span className="match-pitch__box match-pitch__box--top" aria-hidden />
              <span className="match-pitch__box match-pitch__box--bottom" aria-hidden />
              {[...away.starters, ...home.starters].map((token) => (
                <PitchToken key={token.key} token={token} away={token.key.startsWith("away")} />
              ))}
              {away.starters.length === 0 ? <span className="match-pitch__missing is-top">Sin alineación</span> : null}
              {home.starters.length === 0 ? <span className="match-pitch__missing is-bottom">Sin alineación</span> : null}
            </div>
          </>
        ) : (
          <p className="match-page__empty">Ningún equipo ha publicado su alineación.</p>
        )}
      </SectionCard>
      <div className="match-squads">
        <SquadCard lineup={home} />
        <SquadCard lineup={away} />
      </div>
    </>
  );
}

function TeamTag({ lineup }: { lineup: TeamLineupView }) {
  return (
    <span className={`match-pitch__tag match-pitch__tag--${lineup.side}`}>
      <img src={lineup.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
      {lineup.name}
      {lineup.formation ? <em>{lineup.formation}</em> : null}
    </span>
  );
}

function PitchToken({ token, away }: { token: LineupTokenView; away: boolean }) {
  return (
    <div className="pitch-token" style={{ top: `${token.top}%`, left: `${token.left}%` }} title={token.name}>
      <span className={`pitch-token__shirt${away ? " is-away" : ""}`}>
        {token.imageUrl ? <img src={token.imageUrl} alt="" /> : token.shirtNumber ?? ""}
      </span>
      <span className="pitch-token__name">{token.shortName}</span>
      {token.goals + token.ownGoals + token.yellow + token.red > 0 ? (
        <span className="pitch-token__marks">
          {Array.from({ length: token.goals }, (_, index) => (
            <BallIcon key={`g${index}`} size={11} />
          ))}
          {Array.from({ length: token.ownGoals }, (_, index) => (
            <BallIcon key={`o${index}`} size={11} own />
          ))}
          {token.yellow > 0 ? <CardIcon color="yellow" /> : null}
          {token.red > 0 ? <CardIcon color="red" /> : null}
        </span>
      ) : null}
    </div>
  );
}

function SquadCard({ lineup }: { lineup: TeamLineupView }) {
  const title = lineup.starters.length > 0 ? "Suplentes" : lineup.benchIsSquad ? "Plantilla" : "Convocados";
  return (
    <SectionCard title={`${title} · ${lineup.name}`} icon={<Users size={16} color={C.amber} />}>
      {lineup.bench.length > 0 ? (
        <SquadList players={lineup.bench} />
      ) : (
        <p className="match-page__empty">Sin jugadores.</p>
      )}
    </SectionCard>
  );
}

function SquadList({ players }: { players: SquadPlayerView[] }) {
  return (
    <ul className="match-squad">
      {players.map((player) => (
        <li key={player.id}>
          <span className="match-squad__number">{player.shirtNumber ?? "–"}</span>
          <span className="match-squad__name">{player.name}</span>
          <span className="match-squad__marks">
            {Array.from({ length: player.goals }, (_, index) => (
              <BallIcon key={index} size={12} />
            ))}
            {player.yellow > 0 ? <CardIcon color="yellow" /> : null}
            {player.red > 0 ? <CardIcon color="red" /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Previa ──

function PreviewTab({ view, preview }: { view: MatchDetailView; preview: MatchPreviewView | null }) {
  const { home, away } = view.header;
  if (!preview) {
    return (
      <SectionCard title="Previa" icon={<TrendingUp size={16} color={C.amber} />}>
        <p className="match-page__empty">Cargando previa…</p>
      </SectionCard>
    );
  }
  const h2h = preview.headToHead;
  return (
    <div className="match-preview">
      <SectionCard title="Posición en la tabla" icon={<ListOrdered size={16} color={C.amber} />}>
        {preview.standings.ready ? (
          <div className="match-preview__pair">
            <PreviewTeam team={home}>{preview.standings.home.label ?? "Sin partidos jugados"}</PreviewTeam>
            <PreviewTeam team={away}>{preview.standings.away.label ?? "Sin partidos jugados"}</PreviewTeam>
          </div>
        ) : (
          <p className="match-page__empty">Aún no hay tabla: no se ha jugado ningún partido del torneo.</p>
        )}
      </SectionCard>

      <SectionCard title="Forma reciente" icon={<TrendingUp size={16} color={C.amber} />}>
        <div className="match-preview__pair">
          <PreviewTeam team={home}>
            <FormPills pills={preview.form.home} />
          </PreviewTeam>
          <PreviewTeam team={away}>
            <FormPills pills={preview.form.away} />
          </PreviewTeam>
        </div>
      </SectionCard>

      <SectionCard title="Historial entre ambos" icon={<History size={16} color={C.amber} />}>
        {h2h.items.length > 0 ? (
          <>
            <div className="h2h-summary">
              <div>
                <strong>{h2h.homeWins}</strong>
                <span>{home.name}</span>
              </div>
              <div>
                <strong>{h2h.draws}</strong>
                <span>Empates</span>
              </div>
              <div>
                <strong>{h2h.awayWins}</strong>
                <span>{away.name}</span>
              </div>
            </div>
            <ul className="h2h-list">
              {h2h.items.map((item) => (
                <li key={item.id}>
                  <Link to={item.href}>
                    <span className="h2h-list__date">{item.dateLabel}</span>
                    <span className="h2h-list__line">{item.line}</span>
                    <span className="h2h-list__tournament">{item.tournament}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="match-page__empty">Es la primera vez que se enfrentan.</p>
        )}
      </SectionCard>

      <SectionCard title="Convocados" icon={<Users size={16} color={C.amber} />}>
        <div className="match-preview__pair match-preview__pair--top">
          <PreviewTeam team={home}>
            {view.convocados.home.length > 0 ? (
              <SquadList players={view.convocados.home} />
            ) : (
              <span className="match-page__muted">Aún sin convocatoria.</span>
            )}
          </PreviewTeam>
          <PreviewTeam team={away}>
            {view.convocados.away.length > 0 ? (
              <SquadList players={view.convocados.away} />
            ) : (
              <span className="match-page__muted">Aún sin convocatoria.</span>
            )}
          </PreviewTeam>
        </div>
      </SectionCard>
    </div>
  );
}

function PreviewTeam({ team, children }: { team: MatchTeamView; children: ReactNode }) {
  return (
    <div className="match-preview__team">
      <div className="match-preview__name">
        <img src={team.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
        {team.name}
      </div>
      <div className="match-preview__value">{children}</div>
    </div>
  );
}

function FormPills({ pills }: { pills: FormPillView[] }) {
  if (pills.length === 0) return <span className="match-page__muted">Sin partidos en este torneo.</span>;
  return (
    <span className="form-pills">
      {pills.map((pill) => (
        <span key={pill.id} className={`form-pill form-pill--${pill.result}`} title={pill.title}>
          {pill.result}
        </span>
      ))}
    </span>
  );
}
