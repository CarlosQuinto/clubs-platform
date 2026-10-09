import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Handshake,
  History,
  IdCard,
  ListOrdered,
  MapPin,
  Shirt,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import ShareButton from "../shell/ShareButton";
import ConfirmModal from "../../shared/ConfirmModal";
import { useAuth } from "../../domains/auth/AuthContext";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { removeLiveCard, removeLiveGoal } from "../../domains/matches/liveMatchCommands";
import LiveScorePanel from "./LiveScorePanel";
import { BallIcon, CardIcon } from "./MatchIcons";
import { useMatchDetail } from "./useMatchDetail";
import type {
  FormPillView,
  HeadToHeadSideView,
  LineupTokenView,
  MatchDetailView,
  MatchHeaderView,
  MatchPreviewView,
  MatchSide,
  MatchTeamView,
  SquadPlayerView,
  StandingSummaryView,
  StatRowView,
  TeamLineupView,
  TimelineEventView,
  TimelineKind,
} from "./matchDetailViewState";

type Tab = "resumen" | "alineaciones" | "previa";

const TABS: { label: string; value: Tab }[] = [
  { label: "Resumen", value: "resumen" },
  { label: "Alineaciones", value: "alineaciones" },
  { label: "Previa", value: "previa" },
];

/** Etiqueta corta del tipo de evento en la cronología. */
const KIND_LABEL: Record<TimelineKind, string> = {
  goal: "Gol",
  penalty: "Penal",
  ownGoal: "Autogol",
  yellow: "Amarilla",
  red: "Roja",
};

export default function MatchDetailPage() {
  const { id = "" } = useParams();
  const { isSuperAdmin } = useAuth();
  const { loading, missing, error, view, preview, refresh } = useMatchDetail(id);
  const [tab, setTab] = useState<Tab | null>(null);

  if (missing) {
    return (
      <PlatformLayout>
        <BackLink />
        <p className="match-page__empty">Partido no encontrado.</p>
      </PlatformLayout>
    );
  }

  if (!view) {
    return (
      <PlatformLayout>
        <BackLink />
        {loading ? (
          <p className="match-page__empty">Cargando partido…</p>
        ) : (
          <p className="match-page__error">
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
        <MatchTabs value={current} onChange={setTab} />
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

// ── Piezas de presentación ──

/** Tarjeta blanca con tile de icono dorado; `tone` pinta el tile con el color del equipo. */
function Panel({
  title,
  subtitle,
  icon,
  aside,
  tone,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  aside?: ReactNode;
  tone?: MatchSide;
  children: ReactNode;
}) {
  return (
    <section className={`match-panel${tone ? ` match-panel--${tone}` : ""}`}>
      <header className="match-panel__head">
        <h2 className="match-panel__title">
          <span className="match-panel__icon">{icon}</span>
          <span className="match-panel__heading">
            {title}
            {subtitle ? <span className="match-panel__subtitle">{subtitle}</span> : null}
          </span>
        </h2>
        {aside ? <div className="match-panel__aside">{aside}</div> : null}
      </header>
      <div className="match-panel__body">{children}</div>
    </section>
  );
}

function MatchTabs({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div className="match-tabs" role="tablist" aria-label="Secciones del partido">
      {TABS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className="match-tab"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ── Cabecera ──

function MatchHero({ header, shareText }: { header: MatchHeaderView; shareText: string }) {
  const live = header.phase === "live";
  const upcoming = header.phase === "upcoming" || header.phase === "unscheduled";
  const showScore = header.home.score != null && header.away.score != null;
  const statusClass = `match-hero__status${live ? " is-live" : upcoming ? " is-upcoming" : ""}`;
  return (
    <section className="match-hero">
      {header.courtImage ? (
        <span className="match-hero__photo" style={{ backgroundImage: `url("${header.courtImage}")` }} aria-hidden />
      ) : null}
      <span className="match-hero__veil" aria-hidden />
      <span className="match-hero__glow" aria-hidden />
      <div className="match-hero__inner">
        <div className="match-hero__rail">
          <Link to={header.tournamentHref} className="match-hero__tournament">
            <Trophy size={16} />
            <span>{[header.tournamentName, header.category].filter(Boolean).join(" • ")}</span>
          </Link>
          <ShareButton text={shareText} iconOnly />
        </div>
        <span className={statusClass}>
          {live ? <span className="match-hero__dot" aria-hidden /> : null}
          {header.statusLabel}
          {header.minuteLabel ? <span className="match-hero__minute">{header.minuteLabel}</span> : null}
        </span>
        <div className="match-hero__board">
          <HeroTeam team={header.home} />
          <div className="match-hero__center">
            {showScore ? (
              <div className="match-hero__score" aria-label={`${header.home.score} a ${header.away.score}`}>
                <span>{header.home.score}</span>
                <span className="match-hero__dash">–</span>
                <span>{header.away.score}</span>
              </div>
            ) : (
              <div className="match-hero__kickoff">VS</div>
            )}
            {header.penaltiesLabel ? <span className="match-hero__note">{header.penaltiesLabel}</span> : null}
            {header.walkoverNote ? <span className="match-hero__note">{header.walkoverNote}</span> : null}
            {header.phase === "pending" ? (
              <span className="match-hero__note">El resultado aún no es oficial</span>
            ) : null}
          </div>
          <HeroTeam team={header.away} />
        </div>
        {header.whenLabel || header.venue ? (
          <div className="match-hero__info">
            {header.whenLabel ? <p className="match-hero__when">{header.whenLabel}</p> : null}
            {header.venue ? (
              <p className="match-hero__venue">
                <MapPin size={15} aria-hidden />
                <span>{header.venue}</span>
              </p>
            ) : null}
          </div>
        ) : null}
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
      <Panel title="Cronología" icon={<ListOrdered size={16} />}>
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
      </Panel>
      {showStats ? (
        <Panel
          title="Estadísticas"
          icon={<TrendingUp size={16} />}
          aside={
            <span className="stat-legend">
              <span className="stat-legend__item stat-legend__item--home">{view.header.home.name}</span>
              <span className="stat-legend__item stat-legend__item--away">{view.header.away.name}</span>
            </span>
          }
        >
          <div className="stat-bars">
            {view.stats.map((row) => (
              <StatBar key={row.label} row={row} />
            ))}
          </div>
          {view.mvp ? (
            <div className="match-mvp">
              <span className="match-mvp__star" aria-hidden>
                <Star size={22} />
              </span>
              <p className="match-mvp__text">
                <span className="match-mvp__kicker">Jugador del partido</span>
                <strong className="match-mvp__name">{view.mvp}</strong>
              </p>
            </div>
          ) : null}
        </Panel>
      ) : null}
      <ConfirmModal
        open={removing != null}
        title={removing?.source === "goal" ? "Borrar gol" : "Borrar tarjeta"}
        message={
          removing
            ? `${removing.minuteLabel ? `${removing.minuteLabel} · ` : ""}${removing.fullName}. ${
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
      <BallIcon size={18} own={event.kind === "ownGoal"} />
    );
  return (
    <li className={`match-timeline__item match-timeline__item--${event.side}`}>
      <span className="match-timeline__minute">{event.minuteLabel ?? "–"}</span>
      <div className="match-timeline__event">
        <span className={`match-timeline__icon is-${event.kind}`}>{icon}</span>
        <div className="match-timeline__text">
          <span className="match-timeline__head">
            <span className={`match-timeline__badge is-${event.kind}`}>{KIND_LABEL[event.kind]}</span>
            <span className="match-timeline__player" title={event.fullName}>
              {event.playerName}
            </span>
          </span>
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
      <div className={`stat-bar__track${total === 0 ? " is-empty" : ""}`} aria-hidden>
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
      <Panel
        title="Alineaciones"
        icon={<Shirt size={16} />}
        aside={
          hasPitch ? (
            <div className="match-pitch__legend">
              <TeamTag lineup={home} />
              <TeamTag lineup={away} />
            </div>
          ) : undefined
        }
      >
        {hasPitch ? (
          <div className="match-pitch" role="img" aria-label="Alineaciones en la cancha">
            <span className="match-pitch__light" aria-hidden />
            <PitchLines />
            {[...away.starters, ...home.starters].map((token) => (
              <PitchToken key={token.key} token={token} away={token.key.startsWith("away")} />
            ))}
            {away.starters.length === 0 ? <span className="match-pitch__missing is-top">Sin alineación</span> : null}
            {home.starters.length === 0 ? <span className="match-pitch__missing is-bottom">Sin alineación</span> : null}
          </div>
        ) : (
          <p className="match-page__empty">Ningún equipo ha publicado su alineación.</p>
        )}
      </Panel>
      <div className="match-squads">
        <SquadCard lineup={home} />
        <SquadCard lineup={away} />
      </div>
    </>
  );
}

/** Marcas de la cancha: la línea media queda al 50 %, igual que el reparto de mitades de las fichas. */
function PitchLines() {
  const stroke = "rgba(255,255,255,0.75)";
  const spot = "rgba(255,255,255,0.9)";
  return (
    <svg className="match-pitch__lines" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden>
      <rect x="2" y="2" width="396" height="596" rx="4" fill="none" stroke={stroke} strokeWidth="2" />
      <line x1="2" y1="300" x2="398" y2="300" stroke={stroke} strokeWidth="2" />
      <circle cx="200" cy="300" r="50" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="200" cy="300" r="3" fill={spot} />
      <rect x="90" y="2" width="220" height="96" fill="none" stroke={stroke} strokeWidth="2" />
      <rect x="140" y="2" width="120" height="38" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="200" cy="70" r="2.5" fill={spot} />
      <path d="M 160 98 A 45 45 0 0 0 240 98" fill="none" stroke={stroke} strokeWidth="2" />
      <rect x="90" y="502" width="220" height="96" fill="none" stroke={stroke} strokeWidth="2" />
      <rect x="140" y="560" width="120" height="38" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="200" cy="530" r="2.5" fill={spot} />
      <path d="M 160 502 A 45 45 0 0 1 240 502" fill="none" stroke={stroke} strokeWidth="2" />
      <path d="M 2 16 A 14 14 0 0 0 16 2" fill="none" stroke={stroke} strokeWidth="2" />
      <path d="M 384 2 A 14 14 0 0 0 398 16" fill="none" stroke={stroke} strokeWidth="2" />
      <path d="M 2 584 A 14 14 0 0 1 16 598" fill="none" stroke={stroke} strokeWidth="2" />
      <path d="M 384 598 A 14 14 0 0 1 398 584" fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
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
  const count = lineup.bench.length;
  const countLabel =
    lineup.starters.length > 0
      ? `${count} disponible${count === 1 ? "" : "s"}`
      : `${count} jugador${count === 1 ? "" : "es"}`;
  return (
    <Panel
      title={title}
      subtitle={lineup.name}
      icon={<Users size={16} />}
      tone={lineup.side}
      aside={count > 0 ? <span className="match-panel__count">{countLabel}</span> : undefined}
    >
      {count > 0 ? <SquadList players={lineup.bench} /> : <p className="match-page__empty">Sin jugadores.</p>}
      {lineup.coach ? (
        <p className="match-squad__coach">
          <IdCard size={18} aria-hidden />
          <strong>Director Técnico:</strong>
          <span>{lineup.coach}</span>
        </p>
      ) : null}
    </Panel>
  );
}

function SquadList({ players }: { players: SquadPlayerView[] }) {
  return (
    <ul className="match-squad">
      {players.map((player) => (
        <li key={player.id}>
          <span className="match-squad__number">{player.shirtNumber ?? "–"}</span>
          <span className="match-squad__name">{player.name}</span>
          {player.goals > 0 || player.yellow > 0 || player.red > 0 ? (
            <span className="match-squad__marks">
              {Array.from({ length: player.goals }, (_, index) => (
                <BallIcon key={index} size={12} />
              ))}
              {player.yellow > 0 ? <CardIcon color="yellow" /> : null}
              {player.red > 0 ? <CardIcon color="red" /> : null}
            </span>
          ) : null}
          {player.position ? <span className="match-squad__position">{player.position}</span> : null}
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
      <Panel title="Previa" icon={<TrendingUp size={16} />}>
        <p className="match-page__empty">Cargando previa…</p>
      </Panel>
    );
  }
  const h2h = preview.headToHead;
  return (
    <div className="match-preview">
      <Panel title="Posición en la tabla" icon={<ListOrdered size={16} />}>
        {preview.standings.ready ? (
          <div className="match-preview__pair match-preview__pair--top">
            <StandingTile side="home" team={home} standing={preview.standings.home} />
            <StandingTile side="away" team={away} standing={preview.standings.away} />
          </div>
        ) : (
          <p className="match-page__empty">Aún no hay tabla: no se ha jugado ningún partido del torneo.</p>
        )}
      </Panel>

      <Panel title="Últimos partidos" icon={<TrendingUp size={16} />}>
        <div className="match-preview__pair">
          <PreviewTeam team={home}>
            <FormPills pills={preview.form.home} />
          </PreviewTeam>
          <PreviewTeam team={away}>
            <FormPills pills={preview.form.away} />
          </PreviewTeam>
        </div>
      </Panel>

      <Panel title="Historial entre ambos" icon={<History size={16} />}>
        {h2h.items.length > 0 ? (
          <>
            <div className="h2h-summary">
              <div className="h2h-summary__home">
                <span className="h2h-summary__label">Victorias</span>
                <span className="h2h-summary__top">
                  <span className="h2h-summary__crest">
                    <img src={home.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
                  </span>
                  <strong>{h2h.homeWins}</strong>
                </span>
                <span className="h2h-summary__name">{home.name}</span>
              </div>
              <div className="h2h-summary__draws">
                <span className="h2h-summary__label">Empates</span>
                <span className="h2h-summary__top">
                  <span className="h2h-summary__crest" aria-hidden>
                    <Handshake size={20} />
                  </span>
                  <strong>{h2h.draws}</strong>
                </span>
              </div>
              <div className="h2h-summary__away">
                <span className="h2h-summary__label">Victorias</span>
                <span className="h2h-summary__top">
                  <span className="h2h-summary__crest">
                    <img src={away.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
                  </span>
                  <strong>{h2h.awayWins}</strong>
                </span>
                <span className="h2h-summary__name">{away.name}</span>
              </div>
            </div>
            <ul className="h2h-list">
              {h2h.items.map((item) => (
                <li key={item.id}>
                  <Link to={item.href}>
                    <span className="h2h-list__date">
                      <CalendarDays size={16} aria-hidden />
                      {item.dateLabel}
                    </span>
                    <HeadToHeadTeam side={item.home} home={home} away={away} />
                    <span className="h2h-list__score">
                      {item.home.score} - {item.away.score}
                    </span>
                    <HeadToHeadTeam side={item.away} home={home} away={away} />
                    <ChevronRight size={20} className="h2h-list__go" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="match-page__empty">Es la primera vez que se enfrentan.</p>
        )}
      </Panel>

      <Panel title="Convocados" icon={<Users size={16} />}>
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
      </Panel>
    </div>
  );
}

function StandingTile({
  side,
  team,
  standing,
}: {
  side: MatchSide;
  team: MatchTeamView;
  standing: StandingSummaryView;
}) {
  return (
    <div className={`standing-tile standing-tile--${side}`}>
      <div className="standing-tile__head">
        <span className="standing-tile__crest">
          <img src={team.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
        </span>
        <span className="standing-tile__text">
          <span className="standing-tile__name">{team.name}</span>
          <span className="standing-tile__value">{standing.rankLabel ?? "Sin partidos jugados"}</span>
        </span>
        {standing.points != null ? (
          <span className="standing-tile__points">
            <strong>{standing.points}</strong>
            <span>pts</span>
          </span>
        ) : null}
      </div>
      {standing.breakdown.length > 0 ? (
        <dl className="standing-tile__breakdown">
          {standing.breakdown.map((cell) => (
            <div key={cell.label} className={cell.label === "DG" ? "is-diff" : undefined}>
              <dt>{cell.label}</dt>
              <dd>{cell.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** Escudo y nombre de un lado del enfrentamiento; el escudo sale de la cabecera, porque solo juegan estos dos clubes. */
function HeadToHeadTeam({ side, home, away }: { side: HeadToHeadSideView; home: MatchTeamView; away: MatchTeamView }) {
  const logo = side.clubId === home.id ? home.logoUrl : side.clubId === away.id ? away.logoUrl : null;
  return (
    <span className="h2h-list__team">
      <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
      <span>{side.name}</span>
    </span>
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
