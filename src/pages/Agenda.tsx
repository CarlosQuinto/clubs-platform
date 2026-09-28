import React, { useState } from "react";
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  History,
  CalendarX,
  Archive,
} from "lucide-react";
import { addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { useClub } from "../context/ClubContext";
import { C, StatBox, SectionCard, RADIUS } from "../components/ui";
import { useAgendaData } from "../hooks/useAgendaData";

// ── COMPONENTES GENERALES ──
import {
  EventCard,
  AttendanceModal,
  LineupModal,
  LightboxModal,
} from "../components/AppComponents";

// ── MÓDULOS EXTRAÍDOS DE AGENDA ──
import EventForm from "../components/agenda/EventForm";
import HistoryCard from "../components/agenda/HistoryCard";
import AlbumModal from "../components/agenda/AlbumModal";
import ArbitrationModal from "../components/agenda/ArbitrationModal";
import StatsModal from "../components/agenda/StatsModal";

export default function Agenda({
  events,
  players,
  clubInfo,
  perms,
  highlightedEventId = null,
}: any) {
  const { col, item, clubRef } = useClub();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"Partido" | "Entrenamiento">(
    "Partido",
  );
  // 👇 NUEVO ESTADO: Controla si es Oficial o Amistoso 👇
  const [matchType, setMatchType] = useState<"Oficial" | "Amistoso">("Oficial");
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
  const [arbitrationModalEvent, setArbitrationModalEvent] = useState<
    any | null
  >(null);
  const [lightboxData, setLightboxData] = useState<{
    urls: string[];
    initialIndex: number;
    caption?: string;
  } | null>(null);

  const canEditArbitration = perms?.canEditAgenda || perms?.canEditFinanzas;
  const { statsClub, nextEvents, pastEvents } = useAgendaData(events);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      eventType,
      // 👇 Lo guardamos en Firestore (Solo si es Partido) 👇
      matchType: eventType === "Partido" ? matchType : null,
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
    setMatchType("Oficial"); // Reiniciamos el estado por defecto
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
      <SectionCard title="Récord Oficial del Club" icon={<Trophy size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Cuadrícula de Estadísticas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatBox
              icon={<Trophy size={18} color={C.navy600} />}
              label="Jugados"
              value={statsClub.jugados}
            />
            <StatBox
              icon={<TrendingUp size={18} color={C.green} />}
              label="Ganados"
              value={statsClub.ganados}
              valueColor={C.green}
            />
            <StatBox
              icon={<TrendingDown size={18} color={C.red} />}
              label="Perdidos"
              value={statsClub.perdidos}
              valueColor={C.red}
            />
            <StatBox
              icon={<Target size={18} color={C.navy600} />}
              label="Entrenamientos"
              value={statsClub.entrenamientos}
            />
          </div>

          {/* 👇 NOTA ACLARATORIA DE AMISTOSOS (ELEGANTE Y SUTIL) 👇 */}
          <div
            style={{
              backgroundColor: C.gray50,
              border: `1px dashed ${C.gray300}`,
              borderRadius: RADIUS.md,
              padding: "0.6rem 0.8rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "14px" }}>🤝</span>
            <span
              style={{
                fontSize: "0.7rem",
                color: C.gray500,
                fontWeight: "600",
                letterSpacing: "0.02em",
                textAlign: "center",
              }}
            >
              El historial oficial <strong>contabiliza</strong> los partidos de
              carácter amistoso como entrenamientos.
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. FORMULARIO DE EVENTOS ── */}
      <EventForm
        perms={perms}
        editingEventId={editingEventId}
        eventType={eventType}
        setEventType={setEventType}
        matchType={matchType} // 👈 Pasamos el estado
        setMatchType={setMatchType} // 👈 Pasamos el setter
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
          setMatchType("Oficial"); // Reiniciar al cancelar
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
              <EventCard
                key={ev.id}
                ev={ev}
                players={players}
                perms={perms}
                isHighlighted={highlightedEventId === ev.id}
                onDelete={() => handleDelete(ev.id)}
                onEdit={() => {
                  setEditingEventId(ev.id);
                  setEventTitle(ev.title);
                  setEventType(ev.eventType);
                  // 👇 Recuperamos si era Oficial o Amistoso (Por defecto Oficial para eventos viejos) 👇
                  setMatchType(ev.matchType || "Oficial");
                  setEventDate(ev.eventDate);
                  setEventTime(ev.eventTime);
                  setEventLocation(ev.location);
                  if (typeof ev.routine === "string" && ev.routine) {
                    setEventRoutine([
                      {
                        type: "phase",
                        id: Date.now().toString(),
                        title: "Rutina Guardada",
                        exercises: [
                          { id: "1", name: ev.routine, duration: "", link: "" },
                        ],
                      },
                    ]);
                  } else {
                    setEventRoutine(ev.routine || []);
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onOpenAttendance={() => setAttendanceModalEvent(ev)}
                onOpenLineup={() => setLineupModalEvent(ev)}
                onImageClick={(data: any) => setLightboxData(data)}
                onEditPhoto={(id: string) =>
                  setAlbumModalEvent(events.find((e: any) => e.id === id))
                }
                onOpenArbitration={() => setArbitrationModalEvent(ev)}
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
              .map((ev: any) => (
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
                  onEdit={() => {
                    setEditingEventId(ev.id);
                    setEventTitle(ev.title);
                    setEventType(ev.eventType);
                    setMatchType(ev.matchType || "Oficial");
                    setEventDate(ev.eventDate);
                    setEventTime(ev.eventTime);
                    setEventLocation(ev.location);
                    if (typeof ev.routine === "string" && ev.routine) {
                      setEventRoutine([
                        {
                          type: "phase",
                          id: Date.now().toString(),
                          title: "Rutina Guardada",
                          exercises: [
                            {
                              id: "1",
                              name: ev.routine,
                              duration: "",
                              link: "",
                            },
                          ],
                        },
                      ]);
                    } else {
                      setEventRoutine(ev.routine || []);
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" }); // 👈 Sube al formulario
                  }}
                  onUpdateScore={handleUpdateScore}
                  onOpenStats={(ev: any) => setStatsModalEvent(ev)}
                  onOpenArbitration={(ev: any) => setArbitrationModalEvent(ev)}
                  onOpenLineup={(ev: any) => setLineupModalEvent(ev)}
                  onOpenAlbum={(id: string) =>
                    setAlbumModalEvent(events.find((e: any) => e.id === id))
                  }
                  onImageClick={(data: any) => setLightboxData(data)}
                  onOpenAttendance={(ev: any) => setAttendanceModalEvent(ev)}
                />
              ))
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
            await updateDoc(item("events", id), { attendees: att });
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
            await updateDoc(item("events", id), { lineup });
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

      {arbitrationModalEvent && (
        <ArbitrationModal
          ev={arbitrationModalEvent}
          players={players}
          canEditArbitration={canEditArbitration}
          onClose={() => setArbitrationModalEvent(null)}
          onSave={async (cleanPayments: any[]) => {
            await updateDoc(item("events", arbitrationModalEvent.id), {
              arbitrationPayments: cleanPayments,
            });

            const totalArbitraje = cleanPayments.reduce(
              (sum, p) => sum + (Number(p.amount || p.monto || p.pagado) || 0),
              0,
            );

            const transRef = item(
              "transactions",
              `arb_${arbitrationModalEvent.id}`,
            );
            if (totalArbitraje > 0) {
              await setDoc(
                transRef,
                {
                  type: "ingreso",
                  category: "Cuotas",
                  description: `Recaudación Arbitraje: ${arbitrationModalEvent.title}`,
                  amount: totalArbitraje,
                  date: arbitrationModalEvent.eventDate,
                  timestamp: new Date().toISOString(),
                },
                { merge: true },
              );
            } else {
              await deleteDoc(transRef).catch(() => {});
            }
            setArbitrationModalEvent(null);
          }}
        />
      )}

      {statsModalEvent && (
        <StatsModal
          ev={statsModalEvent}
          players={players}
          onClose={() => setStatsModalEvent(null)}
          onSave={async (statsData: any) => {
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
