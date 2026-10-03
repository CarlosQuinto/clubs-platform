import React, { useMemo, useState, useEffect, useRef } from "react";
import { dataConnect, deleteClubEvent, saveClubEvent, setClubEventScore } from "../../../infrastructure/dataconnect";
import { requestClubRefresh } from "../useClubScreen";
import { savedRow } from "../../../shared/saved";
import { useClub } from "../../../domains/clubs/ClubContext";
import { useAgendaData } from "./useAgendaData";

export function useAgenda({
  events,
  officialEvents = [],
  players,
  clubInfo,
  perms,
  highlightedEventId = null,
}: any) {
  const { clubId } = useClub();
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
  const HISTORY_STEP = 5;
  const NEXT_STEP = 3;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(HISTORY_STEP);
  const [nextCount, setNextCount] = useState(NEXT_STEP);
  const historySentinel = useRef<HTMLDivElement | null>(null);

  const pastSorted = useMemo(
    () =>
      [...pastEvents].sort(
        (a: any, b: any) =>
          new Date(b.eventDate + "T" + b.eventTime).getTime() -
          new Date(a.eventDate + "T" + a.eventTime).getTime(),
      ),
    [pastEvents],
  );
  const visibleNext = nextEvents.slice(0, nextCount);
  const visiblePast = pastSorted.slice(0, historyCount);

  useEffect(() => {
    if (!historyOpen || historyCount >= pastSorted.length) return;
    const node = historySentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHistoryCount((count) =>
            Math.min(count + HISTORY_STEP, pastSorted.length),
          );
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [historyOpen, historyCount, pastSorted.length]);

  const refresh = () => requestClubRefresh();

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    const saved = await saveClubEvent(dataConnect, {
      id: editingEventId || crypto.randomUUID(),
      clubId,
      eventType: eventType === "Entrenamiento" ? "ENTRENAMIENTO" : "PARTIDO",
      matchType: eventType === "Partido" ? "AMISTOSO" : null,
      title: eventTitle,
      eventDate,
      eventTime,
      detail: {
        location: eventLocation || "Por definir",
        routine: eventType === "Entrenamiento" ? eventRoutine : [],
      },
    });
    savedRow(saved.data.event);
    requestClubRefresh();
    if (editingEventId) setEditingEventId(null);
    setEventTitle("");
    setEventLocation("");
    setEventRoutine([]);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar.");
    }
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
      const removed = await deleteClubEvent(dataConnect, { id, clubId });
      savedRow(removed.data.deleted);
      requestClubRefresh();
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

      const scored = await setClubEventScore(dataConnect, {
        id: eventId,
        clubId,
        scoreOurs,
        scoreTheirs,
        penaltiesOurs,
        penaltiesTheirs,
      });
      savedRow(scored.data.event);
      refresh();
    } else alert("Formato incorrecto.");
  };

  return {
    clubId,
    editingEventId,
    setEditingEventId,
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
    handleStartEdit,
    handleDelete,
    handleUpdateScore,
    events,
    players,
    clubInfo,
    perms,
    highlightedEventId,
  };
}
