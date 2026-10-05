import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { Link } from "react-router-dom";
import { Calendar, Crown, Pencil, Radio, Trash2, Trophy } from "lucide-react";
import { useTournamentEdit } from "../tournament/TournamentEditModal";
import { ArchiveSection, TournamentGrid } from "../shell/ArchiveUI";
import ConfirmModal from "../../shared/ConfirmModal";
import HeroCarousel from "../shell/HeroCarousel";
import PlatformLayout, { markScrollTopAfterNav } from "../shell/PlatformLayout";
import { C, PrimaryButton, RADIUS, SHADOWS } from "../../shared/ui";
import { dataConnect, deleteUnplayedTournament } from "../../infrastructure/dataconnect";
import { useAuth } from "../../domains/auth/AuthContext";
import {
  DEFAULT_CLUB_LOGO,
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../../domains/clubs/clubDefaults";
import type { UpcomingMatchView } from "../matches/matchesViewState";
import { useHomePage } from "./useHomePage";
import { useLiveMatches } from "./useLiveMatches";
import type { HomeAdView, HomeTournamentCard, LiveMatchView } from "./homeViewState";

const MATCH_PAGE = 6;
const DESKTOP_QUERY = "(min-width: 900px)";
const SLIDE_INTERVAL_MS = 6000;
const SLIDE_DURATION_MS = 500;
const AD_ROTATE_MS = 5000;

const DIVISION_TONE = [
  { bg: C.amberLight, text: C.navy900, border: C.amber },
  { bg: C.navy100, text: C.navy900, border: C.navy400 },
  { bg: C.greenLight, text: C.green, border: C.greenBorder },
  { bg: C.gray100, text: C.gray800, border: C.gray300 },
];

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

export default function HomePageView() {
  const home = useHomePage();
  const live = useLiveMatches();
  const { user, isSuperAdmin, platformUnclaimed, claimPlatformAdmin } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const hero = home.view?.hero ?? {
    images: DEFAULT_PLATFORM_HERO_IMAGES,
    headline: PLATFORM_HEADLINE,
    tagline: PLATFORM_DESCRIPTION,
    courtsEnabled: false,
  };
  const matches = home.view?.matches ?? [];
  const shown = desktop ? matches : matches.slice(0, MATCH_PAGE);
  const rotate = desktop && !reduceMotion && shown.length > MATCH_PAGE;
  const unclaimed = platformUnclaimed === true;

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
      <div className="landing-hero">
        {isSuperAdmin ? (
          <Link
            to="/admin?tab=cover"
            className="landing-hero__edit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.75rem",
              borderRadius: RADIUS.full,
              backgroundColor: "rgba(255,255,255,0.92)",
              border: `1px solid ${C.gray200}`,
              color: C.navy900,
              fontSize: "0.75rem",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: SHADOWS.sm,
            }}
          >
            <Pencil size={12} /> Editar portada
          </Link>
        ) : null}
        <HeroCarousel images={hero.images} variant="full" arrows={false}>
          <div className="landing-hero__copy">
            <h1>{hero.headline}</h1>
            <p>{hero.tagline}</p>
            <div className="landing-hero__actions">
              <Link to="/contacto#formulario" className="landing-hero__btn">
                Inscríbete a una liga
              </Link>
              <Link to="/registrar-equipo#formulario" className="landing-hero__btn">
                Registra tu equipo
              </Link>
              {hero.courtsEnabled ? (
                <Link to="/canchas" className="landing-hero__btn landing-hero__btn--rent">
                  Renta una cancha
                </Link>
              ) : null}
            </div>
          </div>
        </HeroCarousel>
      </div>

      <div className="landing-body">
        {home.view && home.view.ads.length > 0 ? <AdBand ads={home.view.ads} /> : null}
        {home.error ? (
          <p style={{ color: C.red, fontSize: "0.9rem", margin: "1rem 0 0" }}>
            {home.error}{" "}
            <button type="button" onClick={home.onRefresh} style={retryButton}>
              Reintentar
            </button>
          </p>
        ) : null}

        {live.length > 0 ? <LiveSection matches={live} /> : null}

        <Section
          title="Próximos partidos"
          icon={<Calendar size={15} color={C.amber} />}
          id="encuentros"
          tone="plain"
          action={
            <Link to="/partidos" className="landing-band__all" onClick={markScrollTopAfterNav}>
              Ver todos →
            </Link>
          }
        >
          {unclaimed && user ? (
            <div
              style={{
                backgroundColor: C.amberLight,
                border: `1px solid ${C.amber}`,
                borderRadius: RADIUS.lg,
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
                borderRadius: RADIUS.lg,
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
            <MatchRotator matches={shown} />
          ) : (
            <MatchGrid matches={shown} />
          )}
        </Section>

        <Section
          title="Torneos"
          icon={<Trophy size={15} color={C.amber} />}
          id="torneos"
          tone="alt"
          action={
            <Link to="/torneos" className="landing-band__all" onClick={markScrollTopAfterNav}>
              Ver todos →
            </Link>
          }
        >
          {home.loading && !home.view ? (
            <Pending />
          ) : !home.view ||
            (home.view.activeTournaments.length === 0 &&
              home.view.upcomingTournaments.length === 0) ? (
            <Empty>No hay torneos publicados.</Empty>
          ) : (
            <>
              {home.view.activeTournaments.length > 0 ? (
                <ArchiveSection title="En curso" count={home.view.activeTournaments.length}>
                  <TournamentGrid>
                    {home.view.activeTournaments.map((card) => (
                      <TournamentCard
                        key={card.href}
                        card={card}
                        admin={isSuperAdmin}
                        onDeleted={home.onRefresh}
                      />
                    ))}
                  </TournamentGrid>
                </ArchiveSection>
              ) : null}
              {home.view.upcomingTournaments.length > 0 ? (
                <ArchiveSection title="Próximos" count={home.view.upcomingTournaments.length}>
                  <TournamentGrid>
                    {home.view.upcomingTournaments.map((card) => (
                      <TournamentCard
                        key={card.href}
                        card={card}
                        admin={isSuperAdmin}
                        onDeleted={home.onRefresh}
                      />
                    ))}
                  </TournamentGrid>
                </ArchiveSection>
              ) : null}
            </>
          )}
        </Section>
      </div>
    </PlatformLayout>
  );
}

function AdBand({ ads }: { ads: HomeAdView[] }) {
  const [index, setIndex] = useState(0);
  const signature = ads.map((ad) => ad.imageUrl).join("|");

  useEffect(() => {
    setIndex(0);
  }, [signature]);

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ads.length);
    }, AD_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [signature, ads.length]);

  const ad = ads[index] ?? ads[0];
  if (!ad) return null;
  const image = <img src={ad.imageUrl} alt={ad.brand} className="ad-slot__image" />;
  return (
    <section className="ad-slot-band">
      <div className="landing-band__inner">
        <div className="ad-slot__card">
          {ad.href ? (
            <a href={ad.href} target="_blank" rel="noopener noreferrer" className="ad-slot__frame">
              {image}
            </a>
          ) : (
            <div className="ad-slot__frame">{image}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function MatchRotator({ matches }: { matches: UpcomingMatchView[] }) {
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
      if (sliding.current || phaseRef.current !== "idle") return;
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
    <div className="landing-match-rotator">
      <div
        className="landing-match-rotator__track"
        style={{
          transform: phase === "sliding" ? "translateX(-50%)" : "translateX(0)",
          transition: phase === "idle" ? "none" : `transform ${SLIDE_DURATION_MS}ms ease`,
        }}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="landing-match-rotator__page">
          <MatchGrid matches={current} />
        </div>
        <div className="landing-match-rotator__page" aria-hidden={phase !== "sliding"}>
          <MatchGrid matches={next} />
        </div>
      </div>
    </div>
  );
}

function MatchGrid({ matches }: { matches: UpcomingMatchView[] }) {
  return (
    <div className="match-list">
      <div className="match-list__grid">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: UpcomingMatchView }) {
  return (
    <Link to={match.href} className="match-card">
      <time className="match-card__date" dateTime={match.isoDate} aria-label={match.dateLabel}>
        <span className="match-card__day">{match.day}</span>
        <span className="match-card__month">{match.month}</span>
        <span className="match-card__year">{match.year}</span>
      </time>
      <div className="match-card__body">
        <Side name={match.homeName} logo={match.homeLogo} />
        <Side name={match.awayName} logo={match.awayLogo} />
        {match.subtitle ? <div className="match-card__comp">{match.subtitle}</div> : null}
        {(match.timeLabel || match.venue) && (
          <div className="match-card__when">
            {match.timeLabel ? (
              <span className="match-card__time">
                <span className="match-card__dot" aria-hidden />
                {match.timeLabel}
              </span>
            ) : null}
            {match.venue ? <span className="match-card__venue">{match.venue}</span> : null}
          </div>
        )}
      </div>
    </Link>
  );
}

function LiveSection({ matches }: { matches: LiveMatchView[] }) {
  const playing = matches.some((match) => match.phase === "live");
  return (
    <Section
      title={playing ? "En vivo" : "Resultados de hoy"}
      icon={<Radio size={15} color={playing ? C.red : C.amber} />}
      id="en-vivo"
      tone="plain"
    >
      <div className="match-list">
        <div className="match-list__grid">
          {matches.map((match) => (
            <LiveMatchCard key={match.id} match={match} />
          ))}
        </div>
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
  const label = live ? "En vivo" : match.pending ? "Por confirmar" : "Terminado";
  return (
    <Link
      to={match.href}
      className="match-card live-card"
      aria-label={`${match.homeName} ${home}, ${match.awayName} ${away}. ${label}.`}
    >
      <div className={`live-card__status ${live ? "is-live" : "is-finished"}`}>
        {live ? <span className="live-card__pulse" aria-hidden /> : null}
        <span className="live-card__label">{label}</span>
        <span className="live-card__time">{match.timeLabel}</span>
      </div>
      <div className="match-card__body">
        <div className="live-card__row">
          <Side name={match.homeName} logo={match.homeLogo} />
          <span className="live-card__score">{home}</span>
        </div>
        <div className="live-card__row">
          <Side name={match.awayName} logo={match.awayLogo} />
          <span className="live-card__score">{away}</span>
        </div>
        {match.subtitle ? <div className="match-card__comp">{match.subtitle}</div> : null}
        {note || match.venue ? (
          <div className="match-card__when">
            {note ? <span className="match-card__time">{note}</span> : null}
            {match.venue ? <span className="match-card__venue">{match.venue}</span> : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function Side({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="match-card__side">
      <span className="match-card__crest">
        <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
      </span>
      <span className="match-card__club" title={name}>
        {name}
      </span>
    </div>
  );
}

function TournamentCard({
  card,
  admin,
  onDeleted,
}: {
  card: HomeTournamentCard;
  admin: boolean;
  onDeleted: () => void;
}) {
  const tone = DIVISION_TONE[card.toneIndex] ?? DIVISION_TONE[0];
  const { openEdit } = useTournamentEdit();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const canDelete = admin && card.playedMatches === 0;

  const confirmDelete = async () => {
    try {
      setBusy(true);
      const result = await deleteUnplayedTournament(dataConnect, { id: card.id });
      if (!result.data.tournament) {
        window.alert("No se puede eliminar: ya tiene partidos jugados.");
        setConfirmOpen(false);
        return;
      }
      setConfirmOpen(false);
      onDeleted();
    } catch (err) {
      console.error(err);
      window.alert("No se pudo eliminar el torneo.");
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="tour-card">
      <Link className="tour-card__main" to={card.href} onClick={markScrollTopAfterNav}>
        <span className="tour-card__copy">
          <strong>{card.name}</strong>
          <span className="tour-card__meta">{card.meta}</span>
          {card.startLabel ? <span className="tour-card__start">{card.startLabel}</span> : null}
        </span>
      </Link>
      {card.categoryName ? (
        <div className="tour-card__row">
          <span
            className="tour-card__division"
            style={{ background: tone.bg, color: tone.text, borderColor: tone.border }}
          >
            {card.categoryName}
          </span>
        </div>
      ) : null}
      {admin ? (
        <div className="tour-card__actions">
          <button type="button" onClick={() => openEdit(card.id)}>
            <Pencil size={16} />
            Editar
          </button>
          {canDelete ? (
            <button type="button" className="is-danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={16} />
              Eliminar
            </button>
          ) : null}
        </div>
      ) : null}
      {!admin && card.joinHref ? (
        <a className="tour-card__join" href={card.joinHref} target="_blank" rel="noreferrer">
          Quiero participar
        </a>
      ) : null}
      <ConfirmModal
        open={confirmOpen}
        title={`Eliminar ${card.name}`}
        message={`Se eliminará ${card.name}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </article>
  );
}

function Section({
  title,
  icon,
  id,
  action,
  children,
  tone = "plain",
}: {
  title: string;
  icon: ReactNode;
  id?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: "plain" | "alt";
}) {
  return (
    <section id={id} className={`landing-band landing-band--${tone}`}>
      <div className="landing-band__inner">
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            fontSize: "1.05rem",
            justifyContent: "space-between",
            fontWeight: 900,
            color: C.navy900,
            margin: "0 0 0.85rem",
            width: "100%",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            {icon} {title}
          </span>
          {action}
        </h2>
        {children}
      </div>
    </section>
  );
}

const Pending = () => (
  <p style={{ margin: 0, color: C.gray500, fontWeight: 600, fontSize: "0.85rem" }}>Cargando…</p>
);

const Empty = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      padding: "1.5rem",
      textAlign: "center",
      color: C.gray400,
      backgroundColor: C.white,
      border: `1px dashed ${C.gray300}`,
      borderRadius: RADIUS.lg,
      fontSize: "0.85rem",
    }}
  >
    {children}
  </div>
);

const retryButton = {
  color: C.navy900,
  fontWeight: 700,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
} as const;
