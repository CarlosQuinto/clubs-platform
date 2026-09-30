import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { Link } from "react-router-dom";
import { Calendar, Crown, Pencil, Trophy } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import AdSlot from "../components/platform/AdSlot";
import HeroCarousel from "../components/platform/HeroCarousel";
import MatchList from "../components/platform/MatchList";
import { useAuth } from "../context/AuthContext";
import {
  usePlatformCatalog,
  useUpcomingMatches,
} from "../hooks/usePlatformCatalog";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../lib/clubDefaults";
import { sortByDate } from "../lib/stats";
import { C, PrimaryButton, RADIUS, SHADOWS } from "../components/ui";
import {
  ArchiveSection,
  TournamentCard,
  TournamentGrid,
} from "../components/platform/ArchiveUI";

const LANDING_MATCH_LIMIT = 6;

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
    />
  );

  const upcomingMatches = useMemo(
    () => sortByDate(matches.filter((m) => m.status !== "played" && m.date)),
    [matches],
  );
  const visibleMatches = upcomingMatches.slice(0, LANDING_MATCH_LIMIT);
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
                Apúntate a una liga
              </Link>
              <Link to="/registrar-equipo#formulario" className="landing-hero__btn">
                Registrar equipo
              </Link>
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
        ) : (
          <>
          <MatchList
            matches={visibleMatches}
            clubNames={clubNames}
            clubsById={clubsById}
            subtitleOf={(m) => {
              const tournament = tournamentsById[m.tournamentId];
              const category =
                categoryName[tournament?.categoryId || m.categoryId] || "";
              return [category, tournament?.name].filter(Boolean).join(" · ");
            }}
          />
          {upcomingMatches.length > LANDING_MATCH_LIMIT && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "0.85rem" }}>
              <Link
                to="/partidos"
                style={{
                  padding: "0.4rem 0.9rem",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  border: `1px solid ${C.gray300}`,
                  borderRadius: RADIUS.md,
                  color: C.navy900,
                  textDecoration: "none",
                  background: C.white,
                }}
              >
                Ver más
              </Link>
            </div>
          )}
          </>
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
