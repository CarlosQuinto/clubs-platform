import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { LightboxModal } from "../components/AppComponents";
import { C } from "../components/ui";

// ── Importamos nuestros nuevos módulos limpios ──
import BirthdayBanner from "../components/home/BirthdayBanner";
import HeroSection from "../components/home/HeroSection";
import HallOfFame from "../components/home/HallOfFame";
import GallerySection from "../components/home/GallerySection";
import TeamRecordCard from "../components/home/TeamRecordCard";
import ClubTrophyCase from "../components/home/ClubTrophyCase";
import StatsScopeBar from "../components/club/StatsScopeBar";

const noop = () => {};

function useVisibleOnce(enabled: boolean, onVisible: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        onVisible();
        observer.disconnect();
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onVisible]);
  return ref;
}

function DeferredSection({
  title,
  loading,
  sectionRef,
}: {
  title: string;
  loading: boolean;
  sectionRef: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={sectionRef} style={{ minHeight: 160 }}>
      <h2
        style={{
          margin: 0,
          fontSize: "1.125rem",
          fontWeight: 800,
          color: C.navy900,
        }}
      >
        {title}
      </h2>
      {loading && (
        <p style={{ margin: "1rem 0 0", color: C.gray500, fontWeight: 600 }}>
          Cargando…
        </p>
      )}
    </div>
  );
}

export default function Home({
  clubInfo,
  players,
  events,
  clubEvents,
  gallery,
  eventsReady = false,
  galleryReady = false,
  hallSeen = false,
  albumsSeen = false,
  onHallSeen,
  onAlbumsSeen,
  perms,
  teamRecord,
  scopeLabel,
  trophies,
  seasonName,
  categoryName,
  scope,
  onScopeChange,
  seasons,
  categories,
}: any) {
  // ── Estado global para el visor de fotos (Lightbox) ──
  const [lightboxData, setLightboxData] = useState<{
    urls: string[];
    initialIndex: number;
    caption?: string;
  } | null>(null);

  // Filtramos a los jugadores activos para no celebrar cumpleaños de exjugadores
  const activePlayers = useMemo(() => {
    return players.filter((p: any) => p.active !== false);
  }, [players]);

  // ── CÁLCULO DE ESTADÍSTICAS PARA EL MURO DE LA FAMA ──
  // (Las leyendas inactivas SÍ entran a este cálculo para respetar su historia)
  const hallRef = useVisibleOnce(!hallSeen, onHallSeen ?? noop);
  const albumsRef = useVisibleOnce(!albumsSeen, onAlbumsSeen ?? noop);
  const showHall = hallSeen && eventsReady;
  const showAlbums = albumsSeen && eventsReady && galleryReady;

  const clubPlayerStats = useMemo(() => {
    if (!showHall) return [];
    return players.map((p: any) => {
      let goals = 0,
        assists = 0,
        matchesAttended = 0,
        trainingsAttended = 0,
        mvps = 0;

      events
        .filter(
          (e: any) => new Date(e.eventDate + "T" + e.eventTime) < new Date(),
        )
        .forEach((ev: any) => {
          const attended = (ev.attendees || []).some(
            (att: string) => att === p.id || att === p.name,
          );

          if (ev.eventType === "Entrenamiento" && attended) {
            trainingsAttended++;
          }

          if (ev.eventType === "Partido") {
            if (attended) {
              if (ev.matchType === "Amistoso") trainingsAttended++;
              else matchesAttended++;
            }

            if (ev.matchType !== "Amistoso") {
              ev.stats?.forEach((s: any) => {
                if (s.isOwnGoal) return;
                if (s.scorer === p.id || s.scorer === p.name) goals++;
                if (s.assist === p.id || s.assist === p.name) assists++;
              });

              if (ev.mvp === p.id || ev.mvp === p.name) mvps++;
            }
          }
        });

      return {
        ...p,
        goals,
        assists,
        matchesAttended,
        trainingsAttended,
        mvps,
        totalAttendance: matchesAttended + trainingsAttended,
      };
    });
  }, [players, events, showHall]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* PASAMOS SOLO LOS ACTIVOS AL BANNER DE CUMPLEAÑOS */}
      <BirthdayBanner players={activePlayers} />

      <HeroSection
        clubInfo={clubInfo}
        players={players}
        perms={perms}
        setLightboxData={setLightboxData}
      />

      <div
        className="home-record-block"
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <StatsScopeBar
          scope={scope}
          onChange={onScopeChange}
          seasons={seasons || []}
          categories={categories || []}
        />
        {teamRecord && (
          <TeamRecordCard
            record={teamRecord}
            scopeLabel={scopeLabel || "Histórico"}
          />
        )}
      </div>

      <ClubTrophyCase
        trophies={trophies || []}
        seasonName={seasonName || {}}
        categoryName={categoryName || {}}
      />

      {showHall ? (
        <HallOfFame stats={clubPlayerStats} />
      ) : (
        <DeferredSection
          title="Muro de la Fama"
          loading={hallSeen}
          sectionRef={hallRef}
        />
      )}

      {showAlbums ? (
        <GallerySection
          gallery={gallery}
          events={clubEvents || events}
          perms={perms}
          setLightboxData={setLightboxData}
        />
      ) : (
        <DeferredSection
          title="Álbumes del Equipo"
          loading={albumsSeen}
          sectionRef={albumsRef}
        />
      )}

      {/* VISOR DE FOTOS GLOBAL (LIGHTBOX) */}
      {lightboxData && (
        <LightboxModal
          urls={lightboxData.urls}
          initialIndex={lightboxData.initialIndex}
          caption={lightboxData.caption}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
}
