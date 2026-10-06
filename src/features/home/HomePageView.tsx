import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Crown,
  MapPin,
  Megaphone,
  Pencil,
  Radio,
  Shield,
  Trophy,
} from "lucide-react";
import TournamentTile from "../tournament/TournamentTile";
import PlatformLayout, { markScrollTopAfterNav } from "../shell/PlatformLayout";
import { C, PrimaryButton, RADIUS } from "../../shared/ui";
import { useAuth } from "../../domains/auth/AuthContext";
import {
  DEFAULT_CLUB_LOGO,
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../../domains/clubs/clubDefaults";
import { useHomePage } from "./useHomePage";
import { useLiveMatches } from "./useLiveMatches";
import type {
  HomeAdView,
  HomeHeroView,
  HomeTournamentCard,
  LiveMatchView,
} from "./homeViewState";
import FixtureCard from "../matches/FixtureCard";
import type { UpcomingMatchView } from "../matches/matchesViewState";

const MATCH_PAGE = 6;
const DESKTOP_QUERY = "(min-width: 900px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SLIDE_INTERVAL_MS = 6000;
const SLIDE_DURATION_MS = 500;
const HERO_ROTATE_MS = 6000;
const AD_ROTATE_MS = 5000;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Índice que avanza cada `ms` mientras haya más de un elemento; vuelve a 0 si cambia la lista. */
function useRotation(count: number, ms: number, signature: string) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [signature]);
  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), ms);
    return () => window.clearInterval(timer);
  }, [count, ms, signature]);
  return count > 0 ? index % count : 0;
}

export default function HomePageView() {
  const home = useHomePage();
  const live = useLiveMatches();
  const { user, isSuperAdmin, platformUnclaimed, claimPlatformAdmin } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const hero: HomeHeroView = home.view?.hero ?? {
    images: DEFAULT_PLATFORM_HERO_IMAGES,
    headline: PLATFORM_HEADLINE,
    tagline: PLATFORM_DESCRIPTION,
    courtsEnabled: false,
    seasonLabel: null,
    stats: [],
  };
  const matches = home.view?.matches ?? [];
  const shown = desktop ? matches : matches.slice(0, MATCH_PAGE);
  const rotate = desktop && !reduceMotion && shown.length > MATCH_PAGE;
  const unclaimed = platformUnclaimed === true;
  const [editingId, setEditingId] = useState<string | null>(null);
  const fixtures: FixtureActions = {
    admin: isSuperAdmin,
    editingId,
    onEdit: setEditingId,
    onSaved: home.onRefresh,
  };

  const claim = async () => {
    if (
      !window.confirm(
        "Te convertirás en el super administrador de la plataforma. ¿Continuar?",
      )
    )
      return;
    try {
      setClaiming(true);
      await claimPlatformAdmin();
    } catch (err) {
      console.error(err);
      window.alert("No se pudo reclamar la administración. Quizá alguien ya lo hizo.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <PlatformLayout landing>
      <HomeHero hero={hero} editable={isSuperAdmin} />

      <div className="home">
        {home.error ? (
          <div className="home-inner">
            <p className="home-error">
              {home.error}{" "}
              <button type="button" onClick={home.onRefresh}>
                Reintentar
              </button>
            </p>
          </div>
        ) : null}

        {live.length > 0 ? <LiveSection matches={live} /> : null}

        <Section
          id="encuentros"
          tone="card"
          icon={<CalendarDays size={22} />}
          title="Próximos partidos"
          subtitle="Rol de juegos y sedes"
          action={<SeeAll to="/partidos" />}
        >
          {unclaimed && user ? (
            <div
              style={{
                backgroundColor: C.amberLight,
                border: `1px solid ${C.amber}`,
                borderRadius: RADIUS.xl,
                padding: "1rem 1.25rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <Crown size={20} color={C.amber} />
              <div style={{ flex: 1, minWidth: 200, fontSize: "0.85rem", color: C.gray700 }}>
                La plataforma todavía no tiene administrador. Como primer usuario, puedes reclamar
                ese rol para crear categorías, temporadas y clubes.
              </div>
              <PrimaryButton onClick={claim} disabled={claiming}>
                {claiming ? "Reclamando..." : "Reclamar administración"}
              </PrimaryButton>
            </div>
          ) : null}
          {unclaimed && !user ? (
            <div
              style={{
                backgroundColor: C.white,
                border: `1px solid ${C.gray200}`,
                borderRadius: RADIUS.xl,
                padding: "1rem 1.25rem",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
                color: C.gray600,
              }}
            >
              Plataforma nueva sin configurar.{" "}
              <Link to="/registro" style={{ color: C.navy900, fontWeight: 700 }}>
                Crea la primera cuenta
              </Link>{" "}
              para convertirte en administrador.
            </div>
          ) : null}
          {home.loading && !home.view ? (
            <Pending />
          ) : shown.length === 0 ? (
            <Empty>No hay partidos próximos en torneos vigentes.</Empty>
          ) : rotate ? (
            <MatchRotator matches={shown} actions={fixtures} />
          ) : (
            <MatchGrid matches={shown} actions={fixtures} />
          )}
        </Section>

        <TournamentsSection
          loading={home.loading && !home.view}
          active={home.view?.activeTournaments ?? []}
          upcoming={home.view?.upcomingTournaments ?? []}
          admin={isSuperAdmin}
          onDeleted={home.onRefresh}
        />

        {home.view ? (
          <PromoSection
            ads={home.view.ads}
            courtsEnabled={hero.courtsEnabled}
            admin={isSuperAdmin}
          />
        ) : null}
      </div>
    </PlatformLayout>
  );
}

function HomeHero({ hero, editable }: { hero: HomeHeroView; editable: boolean }) {
  const index = useRotation(hero.images.length, HERO_ROTATE_MS, hero.images.join("|"));
  return (
    <section className="home-hero">
      <div className="home-hero__media" aria-hidden>
        {hero.images.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt="" className={i === index ? "is-on" : undefined} />
        ))}
      </div>
      <div className="home-hero__scrim" aria-hidden />
      {editable ? (
        <Link to="/admin?tab=cover" className="home-hero__edit">
          <Pencil size={12} /> Editar portada
        </Link>
      ) : null}
      <div className="home-inner home-hero__inner">
        <div className="home-hero__content">
          {hero.seasonLabel ? (
            <span className="home-hero__pill">
              <span className="home-hero__pill-dot" aria-hidden />
              {hero.seasonLabel}
            </span>
          ) : null}
          <h1>{hero.headline}</h1>
          <p>{hero.tagline}</p>
          <div className="home-hero__actions">
            <Link to="/contacto#formulario" className="home-btn home-btn--gold home-btn--lg">
              <Trophy size={18} aria-hidden />
              Inscríbete a una liga
            </Link>
            <Link to="/registrar-equipo#formulario" className="home-btn home-btn--glass home-btn--lg">
              <Shield size={18} aria-hidden />
              Registra tu equipo
            </Link>
            {hero.courtsEnabled ? (
              <Link to="/canchas" className="home-btn home-btn--glass home-btn--lg">
                <MapPin size={18} aria-hidden />
                Renta una cancha
              </Link>
            ) : null}
          </div>
          {hero.stats.length > 0 ? (
            <dl className="home-hero__stats">
              {hero.stats.map((stat) => (
                <div key={stat.label} className="home-hero__stat">
                  <dd>{stat.value.toLocaleString("es-MX")}</dd>
                  <dt>{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Section({
  id,
  tone,
  icon,
  title,
  subtitle,
  live,
  action,
  children,
}: {
  id?: string;
  tone: "card" | "low";
  icon: ReactNode;
  title: string;
  subtitle: string;
  live?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`home-section home-section--${tone}`}>
      <div className="home-inner">
        <header className="home-section__head">
          <div className="home-section__title">
            <span className="home-section__icon" aria-hidden>
              {icon}
            </span>
            <div>
              <h2>
                {live ? <span className="home-live-dot" aria-hidden /> : null}
                {title}
              </h2>
              <p>{subtitle}</p>
            </div>
          </div>
          {action ? <div className="home-section__action">{action}</div> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

function SeeAll({ to }: { to: string }) {
  return (
    <Link to={to} className="home-see-all" onClick={markScrollTopAfterNav}>
      Ver todos
      <ArrowRight size={18} aria-hidden />
    </Link>
  );
}

function LiveSection({ matches }: { matches: LiveMatchView[] }) {
  const playing = matches.some((match) => match.phase === "live");
  return (
    <Section
      id="en-vivo"
      tone="low"
      icon={<Radio size={22} />}
      title={playing ? "En vivo" : "Resultados de hoy"}
      subtitle={playing ? "Marcadores oficiales en tiempo real" : "Marcadores de la jornada"}
      live={playing}
    >
      <div className="home-grid">
        {matches.map((match) => (
          <LiveMatchCard key={match.id} match={match} />
        ))}
      </div>
    </Section>
  );
}

function LiveMatchCard({ match }: { match: LiveMatchView }) {
  const live = match.phase === "live";
  const scored = match.homeScore != null && match.awayScore != null;
  const home = scored ? String(match.homeScore) : live ? "0" : "–";
  const away = scored ? String(match.awayScore) : live ? "0" : "–";
  const note = [match.walkover ? "W.O." : null, match.penaltiesLabel].filter(Boolean).join(" · ");
  const label = live
    ? ["En vivo", match.minuteLabel].filter(Boolean).join(" ")
    : match.pending
      ? "Por confirmar"
      : "Terminado";
  const place = [match.timeLabel, match.venue].filter(Boolean).join(" · ");
  return (
    <Link
      to={match.href}
      className="home-card home-live"
      aria-label={`${match.homeName} ${home}, ${match.awayName} ${away}. ${label}.`}
    >
      <div className="home-live__top">
        <span className={`home-status ${live ? "is-live" : match.pending ? "is-pending" : "is-done"}`}>
          {live ? <span className="home-status__dot" aria-hidden /> : null}
          {label}
        </span>
        {match.subtitle ? (
          <span className="home-chip" title={match.subtitle}>
            {match.subtitle}
          </span>
        ) : null}
      </div>
      <div className="home-live__face">
        <TeamFace name={match.homeName} logo={match.homeLogo} role="Local" />
        <div className="home-score">
          <span>{home}</span>
          <span className="home-score__sep" aria-hidden>
            :
          </span>
          <span>{away}</span>
        </div>
        <TeamFace name={match.awayName} logo={match.awayLogo} role="Visita" />
      </div>
      {note ? <p className="home-live__note">{note}</p> : null}
      {place ? (
        <div className="home-card__foot">
          <MapPin size={15} aria-hidden />
          <span>{place}</span>
        </div>
      ) : null}
    </Link>
  );
}

function TeamFace({ name, logo, role }: { name: string; logo: string | null; role: string }) {
  return (
    <div className="home-team-face">
      <span className="home-crest home-crest--lg">
        <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
      </span>
      <span className="home-team-face__name" title={name}>
        {name}
      </span>
      <span className="home-team-face__role">{role}</span>
    </div>
  );
}

interface FixtureActions {
  admin: boolean;
  /** Partido con el formulario de programar abierto; mientras haya uno, el rotador no avanza. */
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onSaved: () => void;
}

function MatchRotator({ matches, actions }: { matches: UpcomingMatchView[]; actions: FixtureActions }) {
  const pages = useMemo(() => {
    const chunks: UpcomingMatchView[][] = [];
    for (let i = 0; i < matches.length; i += MATCH_PAGE) chunks.push(matches.slice(i, i + MATCH_PAGE));
    return chunks;
  }, [matches]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "armed" | "sliding">("idle");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const sliding = useRef(false);
  const commitRef = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  pausedRef.current = actions.editingId != null;

  useEffect(() => {
    if (phase !== "armed") return;
    const frame = window.requestAnimationFrame(() => setPhase("sliding"));
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    setIndex(0);
    setPhase("idle");
    sliding.current = false;
    if (pages.length < 2) return;
    let fallback = 0;
    const commit = () => {
      if (!sliding.current) return;
      sliding.current = false;
      window.clearTimeout(fallback);
      setPhase("idle");
      setIndex((current) => (current + 1) % pages.length);
    };
    const interval = window.setInterval(() => {
      if (pausedRef.current || sliding.current || phaseRef.current !== "idle") return;
      sliding.current = true;
      setPhase("armed");
      fallback = window.setTimeout(commit, SLIDE_DURATION_MS + 120);
    }, SLIDE_INTERVAL_MS);
    commitRef.current = commit;
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fallback);
      sliding.current = false;
      commitRef.current = () => {};
    };
  }, [pages.length]);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "transform") return;
    commitRef.current();
  };

  const pageCount = pages.length;
  const current = pages[index % pageCount] ?? [];
  const next = pages[(index + 1) % pageCount] ?? [];

  return (
    <div className="home-rotator">
      <div
        className="home-rotator__track"
        style={{
          transform: phase === "sliding" ? "translateX(-50%)" : "translateX(0)",
          transition: phase === "idle" ? "none" : `transform ${SLIDE_DURATION_MS}ms ease`,
        }}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="home-rotator__page">
          <MatchGrid matches={current} actions={actions} />
        </div>
        <div className="home-rotator__page" aria-hidden={phase !== "sliding"}>
          <MatchGrid matches={next} actions={actions} inert={phase !== "sliding"} />
        </div>
      </div>
    </div>
  );
}

function MatchGrid({
  matches,
  actions,
  inert = false,
}: {
  matches: UpcomingMatchView[];
  actions: FixtureActions;
  /** Página oculta del rotador: tarjetas sin formulario, para no duplicarlo. */
  inert?: boolean;
}) {
  return (
    <div className="home-grid">
      {matches.map((match) => (
        <FixtureCard
          key={match.id}
          match={match}
          admin={actions.admin && !inert}
          editing={actions.editingId === match.id}
          onEdit={actions.onEdit}
          onSaved={actions.onSaved}
        />
      ))}
    </div>
  );
}

function TournamentsSection({
  loading,
  active,
  upcoming,
  admin,
  onDeleted,
}: {
  loading: boolean;
  active: HomeTournamentCard[];
  upcoming: HomeTournamentCard[];
  admin: boolean;
  onDeleted: () => void;
}) {
  const [tab, setTab] = useState<"active" | "upcoming" | null>(null);
  const both = active.length > 0 && upcoming.length > 0;
  const current = tab === "upcoming" && upcoming.length > 0 ? "upcoming" : active.length > 0 ? "active" : "upcoming";
  const cards = current === "active" ? active : upcoming;
  const tabs = both ? (
    <div className="home-tabs" role="tablist" aria-label="Torneos">
      <button
        type="button"
        role="tab"
        aria-selected={current === "active"}
        className={current === "active" ? "is-on" : undefined}
        onClick={() => setTab("active")}
      >
        En curso <span>{active.length}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={current === "upcoming"}
        className={current === "upcoming" ? "is-on" : undefined}
        onClick={() => setTab("upcoming")}
      >
        Próximos <span>{upcoming.length}</span>
      </button>
    </div>
  ) : null;

  return (
    <Section
      id="torneos"
      tone="low"
      icon={<Trophy size={22} />}
      title="Torneos"
      subtitle="Ligas y copas vigentes"
      action={
        <>
          {tabs}
          <SeeAll to="/torneos" />
        </>
      }
    >
      {loading ? (
        <Pending />
      ) : cards.length === 0 ? (
        <Empty>No hay torneos publicados.</Empty>
      ) : (
        <div className="home-grid">
          {cards.map((card) => (
            <TournamentTile key={card.href} card={card} admin={admin} onDeleted={onDeleted} />
          ))}
        </div>
      )}
    </Section>
  );
}

/**
 * Final de la portada. Con anuncios vigentes es una franja negra de lado a lado con el anuncio
 * a todo el ancho del contenido (sin caja alrededor, para que se vea más); sin anuncios, la caja
 * oscura con la invitación a ligas y canchas.
 */
function PromoSection({
  ads,
  courtsEnabled,
  admin,
}: {
  ads: HomeAdView[];
  courtsEnabled: boolean;
  admin: boolean;
}) {
  const index = useRotation(ads.length, AD_ROTATE_MS, ads.map((ad) => ad.imageUrl).join("|"));
  const ad = ads[index];
  const manage = admin ? (
    <Link to="/admin?tab=ads" className="home-promo__manage">
      <Megaphone size={14} aria-hidden /> Gestionar publicidad
    </Link>
  ) : null;

  if (ad) {
    const image = <img src={ad.imageUrl} alt={ad.brand} />;
    return (
      <section className="home-section home-section--promo-ads" aria-label="Publicidad">
        <div className="home-promo__glow" aria-hidden />
        <div className="home-inner">
          <div className="home-promo__ads">
            <div className="home-promo__ads-head">
              <span className="home-promo__pill">Publicidad</span>
              <span className="home-promo__brand">{ad.brand}</span>
              {ads.length > 1 ? (
                <span className="home-promo__dots" aria-hidden>
                  {ads.map((item, i) => (
                    <span key={`${item.imageUrl}-${i}`} className={i === index ? "is-on" : undefined} />
                  ))}
                </span>
              ) : null}
              {manage}
            </div>
            {ad.href ? (
              <a href={ad.href} target="_blank" rel="noopener noreferrer" className="home-promo__frame">
                {image}
              </a>
            ) : (
              <div className="home-promo__frame">{image}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-section home-section--card home-section--promo" aria-label="Publicidad">
      <div className="home-inner">
        <div className="home-promo">
          <div className="home-promo__glow" aria-hidden />
          <div className="home-promo__cta">
            <div className="home-promo__copy">
              <span className="home-promo__pill">Gestión integral deportiva</span>
              <h2>¿Administras una liga o eres dueño de canchas?</h2>
              <p>
                Lleva tu torneo con calendario, resultados en vivo, tabla de posiciones y
                goleadores en un solo lugar.
              </p>
              {manage}
            </div>
            <div className="home-promo__actions">
              <Link to="/contacto#formulario" className="home-btn home-btn--gold home-btn--lg">
                Registrar mi liga
              </Link>
              {courtsEnabled ? (
                <Link to="/canchas" className="home-btn home-btn--glass home-btn--lg">
                  Renta una cancha
                </Link>
              ) : (
                <Link to="/registrar-equipo#formulario" className="home-btn home-btn--glass home-btn--lg">
                  Registra tu equipo
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Pending = () => <p className="home-pending">Cargando…</p>;

const Empty = ({ children }: { children: ReactNode }) => <div className="home-empty">{children}</div>;
