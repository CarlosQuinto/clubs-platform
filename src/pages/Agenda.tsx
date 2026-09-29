import React, { useMemo, useState } from "react";
import {
  Trophy,
  Target,
  Handshake,
  CalendarDays,
  History,
  CalendarX,
  Archive,
  Layers,
} from "lucide-react";
import { addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { useClub } from "../context/ClubContext";
import { matchRef } from "../lib/paths";
import OfficialMatchCard from "../components/agenda/OfficialMatchCard";
import { C, StatBox, SectionCard } from "../components/ui";
import { useAgendaData } from "../hooks/useAgendaData";

// ── COMPONENTES GENERALES ──
import {
  AttendanceModal,
  LineupModal,
  LightboxModal,
} from "../components/AppComponents";

// ── MÓDULOS EXTRAÍDOS DE AGENDA ──
import EventForm from "../components/agenda/EventForm";
import HistoryCard from "../components/agenda/HistoryCard";
import AlbumModal from "../components/agenda/AlbumModal";
import StatsModal from "../components/agenda/StatsModal";

export default function Agenda({
  events,
  officialEvents = [],
  players,
  clubInfo,
  perms,
  highlightedEventId = null,
}: any) {
  const { clubId, col, item, clubRef } = useClub();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"Partido" | "Entrenamiento">(
    "Partido",
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventRoutine, setEventRoutine] = useState<any[]>([]);
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [eventTime, setEventTime] = useState("20:00");
  const [eventLocation, setEventLocation] = useState("");

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null,
  );

  const [attendanceModalEvent, setAttendanceModalEvent] = useState<any | null>(
    null,
  );
  const [lineupModalEvent, setLineupModalEvent] = useState<any | null>(null);
  const [statsModalEvent, setStatsModalEvent] = useState<any | null>(null);
  const [albumModalEvent, setAlbumModalEvent] = useState<any | null>(null);
  const [lightboxData, setLightboxData] = useState<{
    urls: string[];
    initialIndex: number;
    caption?: string;
  } | null>(null);

  // Los partidos oficiales (torneos) se mezclan con los eventos propios del club.
  const agendaEvents = useMemo(
    () => [...events, ...officialEvents],
    [events, officialEvents],
  );
  const { statsClub, nextEvents, pastEvents } = useAgendaData(agendaEvents);

  /** Guarda datos del lado del club en un partido oficial (matches/{id}.sides.{clubId}). */
  const saveOfficialSide = async (ev: any, patch: Record<string, any>) => {
    const updates: Record<string, any> = {};
    Object.entries(patch).forEach(([k, v]) => {
      updates[`sides.${clubId}.${k}`] = v;
    });
    await updateDoc(matchRef(ev.matchId), updates);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      eventType,
      // Los clubes solo organizan entrenamientos y amistosos; lo oficial viene de torneos.
      matchType: eventType === "Partido" ? "Amistoso" : null,
      title: eventTitle,
      routine: eventType === "Entrenamiento" ? eventRoutine : [],
      eventDate,
      eventTime,
      location: eventLocation || "Por definir",
    };
    if (editingEventId) {
      await updateDoc(item("events", editingEventId), data);
      setEditingEventId(null);
    } else {
      await addDoc(col("events"), {
        ...data,
        attendees: [],
        timestamp: new Date().toISOString(),
      });
    }
    setEventTitle("");
    setEventLocation("");
    setEventRoutine([]);
  };

  const handleStartEdit = (ev: any) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title);
    setEventType(ev.eventType);
    setEventDate(ev.eventDate);
    setEventTime(ev.eventTime);
    setEventLocation(ev.location);
    if (typeof ev.routine === "string" && ev.routine) {
      setEventRoutine([
        {
          type: "phase",
          id: Date.now().toString(),
          title: "Rutina Guardada",
          exercises: [{ id: "1", name: ev.routine, duration: "", link: "" }],
        },
      ]);
    } else {
      setEventRoutine(ev.routine || []);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este evento?")) {
      await deleteDoc(item("events", id));
      await deleteDoc(item("transactions", `arb_${id}`)).catch(() => {});
    }
  };

  const handleUpdateScore = async (eventId: string) => {
    const input = window.prompt(
      "Ingresa el marcador final (Nosotros - Rival)\nEjemplo: 3-1",
    );
    if (!input) return;
    const parts = input.split("-");
    if (
      parts.length === 2 &&
      !isNaN(parseInt(parts[0])) &&
      !isNaN(parseInt(parts[1]))
    ) {
      const scoreOurs = parseInt(parts[0]);
      const scoreTheirs = parseInt(parts[1]);
      let penaltiesOurs = null;
      let penaltiesTheirs = null;

      // 👇 SI HAY EMPATE, PREGUNTAMOS POR LOS PENALES 👇
      if (scoreOurs === scoreTheirs) {
        const penInput = window.prompt(
          "¡Empate! Si hubo tanda de penales, ingresa el marcador (Nosotros - Rival).\nSi no hubo, déjalo en blanco y da Aceptar.",
        );
        if (penInput) {
          const penParts = penInput.split("-");
          if (
            penParts.length === 2 &&
            !isNaN(parseInt(penParts[0])) &&
            !isNaN(parseInt(penParts[1]))
          ) {
            penaltiesOurs = parseInt(penParts[0]);
            penaltiesTheirs = parseInt(penParts[1]);
          }
        }
      }

      await updateDoc(item("events", eventId), {
        scoreOurs,
        scoreTheirs,
        penaltiesOurs,
        penaltiesTheirs,
      });
    } else alert("Formato incorrecto.");
  };

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
        onCancel={() => {
          setEditingEventId(null);
          setEventTitle("");
          setEventLocation("");
          setEventRoutine([]);
        }}
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
            nextEvents.map((ev: any) => (
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
            ))
          )}
        </div>
      </SectionCard>

      {/* ── 4. HISTORIAL DE RESULTADOS ── */}
      <SectionCard title="Historial de Resultados" icon={<History size={16} />}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
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
            pastEvents
              .sort(
                (a: any, b: any) =>
                  new Date(b.eventDate + "T" + b.eventTime).getTime() -
                  new Date(a.eventDate + "T" + a.eventTime).getTime(),
              )
              .map((ev: any) =>
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
              )
          )}
        </div>
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
              await saveOfficialSide(attendanceModalEvent, { attendees: att });
            } else {
              await updateDoc(item("events", id), { attendees: att });
            }
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
              await saveOfficialSide(lineupModalEvent, { lineup });
            } else {
              await updateDoc(item("events", id), { lineup });
            }
            setLineupModalEvent(null);
          }}
          onSaveBase={async (mode: string, lineup: any) => {
            await setDoc(
              clubRef,
              {
                defaultLineups: { ...clubInfo.defaultLineups, [mode]: lineup },
              },
              { merge: true },
            );
            alert("Alineación base guardada.");
          }}
        />
      )}

      {albumModalEvent && (
        <AlbumModal
          ev={albumModalEvent}
          onClose={() => setAlbumModalEvent(null)}
          onSave={async (cleanUrls: string[]) => {
            await updateDoc(item("events", albumModalEvent.id), {
              photoUrls: cleanUrls,
              photoUrl: cleanUrls.length > 0 ? cleanUrls[0] : null,
            });
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
            await updateDoc(item("events", statsModalEvent.id), statsData);
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
