import { Trophy, Target, Handshake, CalendarDays, History, CalendarX, Archive, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { dataConnect, replaceClubEventAlbum, replaceClubEventAttendees, replaceClubEventStats, replaceMatchAttendees, saveClubDefaultLineup, setClubEventLineup, setMatchClubLineup } from "../../../infrastructure/dataconnect";
import { savedRow } from "../../../shared/saved";
import OfficialMatchCard from "./OfficialMatchCard";
import { C, StatBox, SectionCard } from "../../../shared/ui";
import { AttendanceModal, LineupModal, LightboxModal } from "../ClubComponents";
import EventForm from "./EventForm";
import HistoryCard from "./HistoryCard";
import AlbumModal from "./AlbumModal";
import StatsModal from "./StatsModal";
import { useAgenda } from "./useAgenda";

export default function Agenda(props: any) {
  const {
    clubId,
    editingEventId,
    eventType,
    setEventType,
    eventTitle,
    setEventTitle,
    eventRoutine,
    setEventRoutine,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    eventLocation,
    setEventLocation,
    expandedHistoryId,
    setExpandedHistoryId,
    attendanceModalEvent,
    setAttendanceModalEvent,
    lineupModalEvent,
    setLineupModalEvent,
    statsModalEvent,
    setStatsModalEvent,
    albumModalEvent,
    setAlbumModalEvent,
    lightboxData,
    setLightboxData,
    statsClub,
    nextEvents,
    pastEvents,
    NEXT_STEP,
    historyOpen,
    setHistoryOpen,
    historyCount,
    nextCount,
    setNextCount,
    historySentinel,
    pastSorted,
    visibleNext,
    visiblePast,
    refresh,
    handleSaveEvent,
    handleCancelEdit,
    eventError,
    savingEvent,
    originalDate,
    handleStartEdit,
    handleDelete,
    handleUpdateScore,
    events,
    players,
    clubInfo,
    perms,
    highlightedEventId,
  } = useAgenda(props);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* ── 1. BALANCE DE TEMPORADA ── */}
      <SectionCard title="Historial de Eventos" icon={<History size={16} />}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.55rem",
          }}
        >
          <StatBox
            icon={<Target size={16} color={C.blue} />}
            label="Entrenamientos"
            value={statsClub.entrenamientos}
            valueColor={C.blue}
          />
          <StatBox
            icon={<Handshake size={16} color={C.green} />}
            label="Amistosos"
            value={statsClub.amistosos}
            valueColor={C.green}
          />
          <StatBox
            icon={<Trophy size={16} color={C.amber} />}
            label="Oficiales"
            value={statsClub.oficiales}
            valueColor={C.amber}
          />
          <StatBox
            icon={<Layers size={16} color={C.navy600} />}
            label="Total de eventos"
            value={statsClub.total}
          />
        </div>
      </SectionCard>

      {/* ── 2. FORMULARIO DE EVENTOS ── */}
      <EventForm
        perms={perms}
        editingEventId={editingEventId}
        eventType={eventType}
        setEventType={setEventType}
        eventTitle={eventTitle}
        setEventTitle={setEventTitle}
        eventRoutine={eventRoutine}
        setEventRoutine={setEventRoutine}
        eventDate={eventDate}
        setEventDate={setEventDate}
        eventTime={eventTime}
        setEventTime={setEventTime}
        eventLocation={eventLocation}
        setEventLocation={setEventLocation}
        onSubmit={handleSaveEvent}
        onCancel={handleCancelEdit}
        error={eventError}
        saving={savingEvent}
        originalDate={originalDate}
      />

      {/* ── 3. PRÓXIMOS COMPROMISOS ── */}
      <SectionCard
        title="Próximos Compromisos"
        icon={<CalendarDays size={16} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {nextEvents.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "2rem 0",
                opacity: 0.5,
              }}
            >
              <CalendarX
                size={36}
                color={C.gray400}
                style={{ marginBottom: "0.5rem" }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.gray500,
                  margin: 0,
                  fontWeight: "500",
                }}
              >
                No hay partidos ni entrenamientos en puerta.
              </p>
            </div>
          ) : (
            <>
              {visibleNext.map((ev: any) => (
              <OfficialMatchCard
                key={ev.id}
                ev={ev}
                players={players}
                perms={perms}
                isHighlighted={highlightedEventId === ev.id}
                onOpenAttendance={() => setAttendanceModalEvent(ev)}
                onOpenLineup={() => setLineupModalEvent(ev)}
                onEdit={() => handleStartEdit(ev)}
                onDelete={() => handleDelete(ev.id)}
                onImageClick={(data: any) => setLightboxData(data)}
                onEditPhoto={(id: string) =>
                  setAlbumModalEvent(events.find((e: any) => e.id === id))
                }
              />
              ))}
              {nextCount < nextEvents.length && (
                <button
                  type="button"
                  onClick={() => setNextCount((count) => count + NEXT_STEP)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: C.gray50,
                    color: C.navy900,
                    border: `1px solid ${C.gray200}`,
                    borderRadius: "0.75rem",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ver más
                </button>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {/* ── 4. HISTORIAL DE RESULTADOS ── */}
      <SectionCard>
        <button
          type="button"
          onClick={() => setHistoryOpen((open) => !open)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: 0,
            margin: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: C.navy900,
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            textAlign: "left",
          }}
        >
          <History size={16} />
          <span style={{ flex: 1 }}>Historial de Resultados</span>
          <span style={{ color: C.gray500, fontWeight: 600 }}>{pastEvents.length}</span>
          {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {historyOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginTop: "1.25rem",
          }}
        >
          {pastEvents.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "2rem 0",
                opacity: 0.5,
              }}
            >
              <Archive
                size={36}
                color={C.gray400}
                style={{ marginBottom: "0.5rem" }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: C.gray500,
                  margin: 0,
                  fontWeight: "500",
                }}
              >
                Aún no hay eventos pasados registrados.
              </p>
            </div>
          ) : (
            <>
            {visiblePast.map((ev: any) =>
                ev.isOfficial || ev.eventType === "Entrenamiento" ? (
                  <OfficialMatchCard
                    key={ev.id}
                    ev={ev}
                    players={players}
                    perms={perms}
                    isPast
                    onOpenAttendance={() => {
                      if (!perms?.canEditAgenda) return;
                      setAttendanceModalEvent(ev);
                    }}
                    onOpenLineup={() => setLineupModalEvent(ev)}
                    onEdit={() => handleStartEdit(ev)}
                    onDelete={() => handleDelete(ev.id)}
                    onImageClick={(data: any) => setLightboxData(data)}
                    onEditPhoto={(id: string) =>
                      setAlbumModalEvent(events.find((e: any) => e.id === id))
                    }
                  />
                ) : (
                <HistoryCard
                  key={ev.id}
                  ev={ev}
                  players={players}
                  perms={perms}
                  isExpanded={expandedHistoryId === ev.id}
                  onToggle={() => {
                    const willExpand = expandedHistoryId !== ev.id;
                    setExpandedHistoryId(willExpand ? ev.id : null);
                    if (willExpand) {
                      setTimeout(() => {
                        document
                          .getElementById(`history-card-${ev.id}`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }, 100);
                    }
                  }}
                  onDelete={() => handleDelete(ev.id)}
                  onEdit={() => handleStartEdit(ev)}
                  onUpdateScore={handleUpdateScore}
                  onOpenStats={(ev: any) => setStatsModalEvent(ev)}
                  onOpenLineup={(ev: any) => setLineupModalEvent(ev)}
                  onOpenAlbum={(id: string) =>
                    setAlbumModalEvent(events.find((e: any) => e.id === id))
                  }
                  onImageClick={(data: any) => setLightboxData(data)}
                  onOpenAttendance={(ev: any) => {
                    if (!perms?.canEditAgenda) return;
                    setAttendanceModalEvent(ev);
                  }}
                />
                ),
              )}
              {historyCount < pastSorted.length && (
                <div ref={historySentinel} style={{ height: 1 }} />
              )}
            </>
          )}
        </div>
        )}
      </SectionCard>

      {/* ── MODALES (Sin cambios) ── */}
      {attendanceModalEvent && (
        <AttendanceModal
          ev={attendanceModalEvent}
          players={players}
          perms={perms}
          onClose={() => setAttendanceModalEvent(null)}
          onSave={async (id: string, att: string[]) => {
            if (attendanceModalEvent.isOfficial) {
              const saved = await replaceMatchAttendees(dataConnect, {
                matchId: attendanceModalEvent.matchId,
                clubId,
                labels: att,
              });
              savedRow(saved.data.report);
            } else {
              const saved = await replaceClubEventAttendees(dataConnect, {
                id,
                clubId,
                labels: att,
              });
              savedRow(saved.data.event);
            }
            refresh();
            setAttendanceModalEvent(null);
          }}
        />
      )}

      {lineupModalEvent && (
        <LineupModal
          ev={lineupModalEvent}
          players={players}
          clubInfo={clubInfo}
          perms={perms}
          onClose={() => setLineupModalEvent(null)}
          onSave={async (id: string, lineup: any) => {
            if (lineupModalEvent.isOfficial) {
              const saved = await setMatchClubLineup(dataConnect, {
                matchId: lineupModalEvent.matchId,
                clubId,
                lineup,
              });
              savedRow(saved.data.report);
            } else {
              const saved = await setClubEventLineup(dataConnect, { id, clubId, lineup });
              savedRow(saved.data.event);
            }
            refresh();
            setLineupModalEvent(null);
          }}
          onSaveBase={async (mode: string, lineup: any) => {
            const saved = await saveClubDefaultLineup(dataConnect, { clubId, mode, lineup });
            savedRow(saved.data.lineup);
            refresh();
            alert("Alineación base guardada.");
          }}
        />
      )}

      {albumModalEvent && (
        <AlbumModal
          ev={albumModalEvent}
          onClose={() => setAlbumModalEvent(null)}
          onSave={async (cleanUrls: string[]) => {
            const saved = await replaceClubEventAlbum(dataConnect, {
              id: albumModalEvent.id,
              clubId,
              urls: cleanUrls,
            });
            savedRow(saved.data.event);
            refresh();
            setAlbumModalEvent(null);
          }}
        />
      )}

      {statsModalEvent && (
        <StatsModal
          ev={statsModalEvent}
          players={players}
          onClose={() => setStatsModalEvent(null)}
          onSave={async (statsData: any) => {
            if (statsModalEvent.isOfficial) {
              setStatsModalEvent(null);
              return;
            }
            const saved = await replaceClubEventStats(dataConnect, {
              id: statsModalEvent.id,
              clubId,
              // El MVP no se elige: el servidor lo calcula de los goles (club_event_mvps)
              stats: {
                goals: statsData.stats || [],
                yellowCards: statsData.yellowCards || [],
                redCards: statsData.redCards || [],
                goalkeepers: statsData.goalkeepers || [],
              },
            });
            savedRow(saved.data.event);
            refresh();
            setStatsModalEvent(null);
          }}
        />
      )}

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
