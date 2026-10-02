import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type TransitionEvent,
} from "react";
import { Link } from "react-router-dom";
import { Calendar, Crown, Pencil, Trophy } from "lucide-react";
import PlatformLayout, { markScrollTopAfterNav } from "../components/platform/PlatformLayout";
import AdSlot from "../components/platform/AdSlot";
import HeroCarousel from "../components/platform/HeroCarousel";
import MatchList from "../components/platform/MatchList";
import { useAuth } from "../context/AuthContext";
import {
  usePlatformCatalog,
  usePlayedTournamentIds,
  useUpcomingMatches,
} from "../hooks/usePlatformCatalog";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../lib/clubDefaults";
import { sortByDate } from "../lib/stats";
import type { ClubSummary, Match } from "../lib/types";
import { C, PrimaryButton, RADIUS, SHADOWS } from "../components/ui";
import {
  ArchiveSection,
  TournamentCard,
  TournamentGrid,
} from "../components/platform/ArchiveUI";

const LANDING_MATCH_LIMIT = 6;
const DESKTOP_QUERY = "(min-width: 900px)";
const SLIDE_INTERVAL_MS = 6000;
const SLIDE_DURATION_MS = 500;

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

function chunkMatches(matches: Match[], size: number) {
  const pages: Match[][] = [];
  for (let i = 0; i < matches.length; i += size) {
    pages.push(matches.slice(i, i + size));
  }
  return pages;
}

function LandingMatchRotator({
  matches,
  clubNames,
  clubsById,
  subtitleOf,
}: {
  matches: Match[];
  clubNames: Record<string, string>;
  clubsById: Record<string, ClubSummary>;
  subtitleOf: (match: Match) => string;
}) {
  const pages = useMemo(
    () => chunkMatches(matches, LANDING_MATCH_LIMIT),
    [matches],
  );
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
  const list = (page: Match[]) => (
    <MatchList
      matches={page}
      clubNames={clubNames}
      clubsById={clubsById}
      subtitleOf={subtitleOf}
    />
  );

  return (
    <div className="landing-match-rotator">
      <div
        className="landing-match-rotator__track"
        style={{
          transform: phase === "sliding" ? "translateX(-50%)" : "translateX(0)",
          transition:
            phase === "idle" ? "none" : `transform ${SLIDE_DURATION_MS}ms ease`,
        }}
        onTransitionEnd={onTransitionEnd}
      >
        <div className="landing-match-rotator__page">{list(current)}</div>
        <div className="landing-match-rotator__page" aria-hidden={phase !== "sliding"}>
          {list(next)}
        </div>
      </div>
    </div>
  );
}

function useVisibleOnce() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);
  return [ref, visible] as const;
}

export default function Landing() {
  const { user, platformConfig, isSuperAdmin, claimPlatformAdmin } = useAuth();
  const [matchesRef, matchesOn] = useVisibleOnce();
  const [tournamentsRef, tournamentsOn] = useVisibleOnce();
  const {
    categories,
    seasons,
    tournaments,
    clubNames,
    clubsById,
    categoryName,
    seasonName,
    tournamentsById,
    partsLoading,
  } = usePlatformCatalog({
    categories: matchesOn || tournamentsOn,
    seasons: tournamentsOn,
    tournaments: tournamentsOn,
    clubs: matchesOn,
    localities: false,
  });
  const { matches, loading: matchesLoading } = useUpcomingMatches(matchesOn);
  const playedTournamentIds = usePlayedTournamentIds(isSuperAdmin && tournamentsOn);
  const [claiming, setClaiming] = useState(false);
  const heroImages =
    platformConfig?.heroImages && platformConfig.heroImages.length > 0
      ? platformConfig.heroImages
      : DEFAULT_PLATFORM_HERO_IMAGES;
  const headline = platformConfig?.headline?.trim() || PLATFORM_HEADLINE;
  const tagline = platformConfig?.tagline?.trim() || PLATFORM_DESCRIPTION;

  const liveTournaments = useMemo(
    () => tournaments.filter((t) => t.status === "active" || t.status === "upcoming"),
    [tournaments],
  );
  const { activeTournaments, upcomingTournaments } = useMemo(() => {
    const byName = (a: (typeof liveTournaments)[0], b: (typeof liveTournaments)[0]) =>
      a.name.localeCompare(b.name);
    return {
      activeTournaments: liveTournaments
        .filter((t) => t.status === "active")
        .sort(byName),
      upcomingTournaments: liveTournaments
        .filter((t) => t.status === "upcoming")
        .sort(byName),
    };
  }, [liveTournaments]);

  const tournamentCard = (t: (typeof liveTournaments)[0]) => (
    <TournamentCard
      key={t.id}
      tournament={t}
      seasonName={seasonName[t.seasonId]}
      categoryName={categoryName[t.categoryId]}
      categoryOrder={categories.find((c) => c.id === t.categoryId)?.order ?? 1}
      startDate={seasons.find((s) => s.id === t.seasonId)?.startDate}
      canDelete={playedTournamentIds != null && !playedTournamentIds.has(t.id)}
    />
  );

  const upcomingMatches = useMemo(
    () => sortByDate(matches.filter((m) => m.status !== "played" && m.date)),
    [matches],
  );
  const visibleMatches = upcomingMatches.slice(0, LANDING_MATCH_LIMIT);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const rotateMatches =
    desktop && !reduceMotion && upcomingMatches.length > LANDING_MATCH_LIMIT;
  const subtitleOf = (match: Match) => {
    const tournament = tournamentsById[match.tournamentId];
    const category =
      categoryName[tournament?.categoryId || match.categoryId] || "";
    return [category, tournament?.name].filter(Boolean).join(" · ");
  };
  const matchesPending =
    !matchesOn ||
    matchesLoading ||
    partsLoading.clubs ||
    partsLoading.categories;
  const tournamentsPending =
    !tournamentsOn ||
    partsLoading.tournaments ||
    partsLoading.seasons ||
    partsLoading.categories;

  const platformUnclaimed = platformConfig === undefined;

  const handleClaim = async () => {
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
      alert("No se pudo reclamar la administración. Quizá alguien ya lo hizo.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <PlatformLayout landing>
      <div className="landing-hero">
        {isSuperAdmin && (
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
        )}
        <HeroCarousel images={heroImages} variant="full" arrows={false}>
          <div className="landing-hero__copy">
            <h1>{headline}</h1>
            <p>{tagline}</p>
            <div className="landing-hero__actions">
              <Link to="/contacto#formulario" className="landing-hero__btn">
                Inscríbete a una liga
              </Link>
              <Link to="/registrar-equipo#formulario" className="landing-hero__btn">
                Registra tu equipo
              </Link>
              {platformConfig?.courtsEnabled === true && (
                <Link to="/canchas" className="landing-hero__btn landing-hero__btn--rent">
                  Renta una cancha
                </Link>
              )}
            </div>
          </div>
        </HeroCarousel>
      </div>

      <div className="landing-body">
      <AdSlot placement="home" layout="band" />
      <Section
        ref={matchesRef}
        title="Próximos partidos"
        icon={<Calendar size={15} color={C.amber} />}
        id="encuentros"
        tone="plain"
        action={
          <Link
            to="/partidos"
            className="landing-band__all"
            onClick={markScrollTopAfterNav}
          >
            Ver todos →
          </Link>
        }
      >
        {platformUnclaimed && user && (
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
            <div
              style={{
                flex: 1,
                minWidth: 200,
                fontSize: "0.85rem",
                color: C.gray700,
              }}
            >
              La plataforma todavía no tiene administrador. Como primer usuario,
              puedes reclamar ese rol para crear categorías, temporadas y clubes.
            </div>
            <PrimaryButton onClick={handleClaim} disabled={claiming}>
              {claiming ? "Reclamando..." : "Reclamar administración"}
            </PrimaryButton>
          </div>
        )}

        {platformUnclaimed && !user && (
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
        )}

        {matchesPending ? (
          <Pending />
        ) : visibleMatches.length === 0 ? (
          <Empty>No hay partidos próximos en torneos vigentes.</Empty>
        ) : rotateMatches ? (
          <LandingMatchRotator
            matches={upcomingMatches}
            clubNames={clubNames}
            clubsById={clubsById}
            subtitleOf={subtitleOf}
          />
        ) : (
          <MatchList
            matches={visibleMatches}
            clubNames={clubNames}
            clubsById={clubsById}
            subtitleOf={subtitleOf}
          />
        )}
      </Section>

      <Section
        ref={tournamentsRef}
        title="Torneos"
        icon={<Trophy size={15} color={C.amber} />}
        id="torneos"
        tone="alt"
      >
        {tournamentsPending ? (
          <Pending />
        ) : liveTournaments.length === 0 ? (
          <Empty>
            No hay torneos publicados.
            {isSuperAdmin && (
              <>
                {" "}
                <Link to="/admin" style={{ color: C.navy900, fontWeight: 700 }}>
                  Crear uno
                </Link>
              </>
            )}
          </Empty>
        ) : (
          <>
            {activeTournaments.length > 0 && (
              <ArchiveSection title="En curso" count={activeTournaments.length}>
                <TournamentGrid>{activeTournaments.map(tournamentCard)}</TournamentGrid>
              </ArchiveSection>
            )}
            {upcomingTournaments.length > 0 && (
              <ArchiveSection title="Próximos" count={upcomingTournaments.length}>
                <TournamentGrid>{upcomingTournaments.map(tournamentCard)}</TournamentGrid>
              </ArchiveSection>
            )}
          </>
        )}
      </Section>
      </div>
    </PlatformLayout>
  );
}

const Section = forwardRef(function Section(
  {
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
  },
  ref: Ref<HTMLElement>,
) {
  return (
    <section ref={ref} id={id} className={`landing-band landing-band--${tone}`}>
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
});

const Pending = () => (
  <p style={{ margin: 0, color: C.gray500, fontWeight: 600, fontSize: "0.85rem" }}>
    Cargando…
  </p>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
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
