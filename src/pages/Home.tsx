import { useState, useMemo } from "react";
import { LightboxModal } from "../components/AppComponents";

// ── Importamos nuestros nuevos módulos limpios ──
import BirthdayBanner from "../components/home/BirthdayBanner";
import HeroSection from "../components/home/HeroSection";
import HallOfFame from "../components/home/HallOfFame";
import GallerySection from "../components/home/GallerySection";
import TeamRecordCard from "../components/home/TeamRecordCard";
import ClubTrophyCase from "../components/home/ClubTrophyCase";
import StatsScopeBar from "../components/club/StatsScopeBar";

export default function Home({
  clubInfo,
  players,
  events,
  clubEvents,
  gallery,
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
  const clubPlayerStats = useMemo(() => {
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
  }, [players, events]);

  const topScorers = [...clubPlayerStats]
    .filter((p: any) => p.goals > 0)
    .sort(
      (a: any, b: any) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        a.name.localeCompare(b.name),
    );

  const topAssists = [...clubPlayerStats]
    .filter((p: any) => p.assists > 0)
    .sort(
      (a: any, b: any) =>
        b.assists - a.assists ||
        b.goals - a.goals ||
        a.name.localeCompare(b.name),
    );

  const topMVPs = [...clubPlayerStats]
    .filter((p: any) => p.mvps > 0)
    .sort(
      (a: any, b: any) =>
        b.mvps - a.mvps || b.goals - a.goals || a.name.localeCompare(b.name),
    );

  const topIronMen = [...clubPlayerStats]
    .filter((p: any) => p.totalAttendance > 0)
    .sort(
      (a: any, b: any) =>
        b.totalAttendance - a.totalAttendance ||
        b.goals - a.goals ||
        a.name.localeCompare(b.name),
    );

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

      {/* MURO DE LA FAMA (Ya viene purificado de amistosos) */}
      <HallOfFame
        topScorers={topScorers}
        topAssists={topAssists}
        topMVPs={topMVPs}
        topIronMen={topIronMen}
      />

      <GallerySection
        gallery={gallery}
        events={clubEvents || events}
        perms={perms}
        setLightboxData={setLightboxData}
      />

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
