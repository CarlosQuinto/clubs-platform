// EventForm.tsx
import React from "react";
import { Calendar, Target, Handshake } from "lucide-react";
import {
  SectionCard,
  SegmentedControl,
  FormInput,
  PrimaryButton,
  SecondaryButton,
  FormError,
  C
} from "../../../shared/ui";
import { isoDate } from "../../../shared/helpers";
import { eventText } from "../../../shared/textLimits";

import RoutineBuilder from "./RoutineBuilder";

interface EventFormProps {
  perms: any;
  editingEventId: string | null;
  eventType: "Partido" | "Entrenamiento";
  setEventType: (val: "Partido" | "Entrenamiento") => void;
  eventTitle: string;
  setEventTitle: (val: string) => void;
  eventRoutine: any[];
  setEventRoutine: (val: any[]) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  eventTime: string;
  setEventTime: (val: string) => void;
  eventLocation: string;
  setEventLocation: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  /** Motivo por el que no se pudo agendar (vacío si no hay). */
  error: string;
  saving: boolean;
  /** Fecha guardada del evento que se edita: puede quedarse aunque ya haya pasado. */
  originalDate: string | null;
}

export default function EventForm({
  perms,
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
  onSubmit,
  onCancel,
  error,
  saving,
  originalDate,
}: EventFormProps) {
  if (!perms.canEditAgenda) return null;
  const today = isoDate();
  const minDate = originalDate && originalDate < today ? originalDate : today;

  return (
    <SectionCard
      className="compact-form-card"
      title={editingEventId ? "Editar Evento" : "Programar Evento"}
      icon={<Calendar size={14} />}
    >
      <form
        onSubmit={onSubmit}
        className="event-form compact-form"
        style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}
        >
          <label
            style={{ fontSize: "0.7rem", fontWeight: "700", color: C.navy900 }}
          >
            Tipo de Evento
          </label>
          <SegmentedControl
            options={[
              {
                label: "Amistoso",
                value: "Partido",
                icon: <Handshake size={12} />,
              },
              {
                label: "Entrenamiento",
                value: "Entrenamiento",
                icon: <Target size={12} />,
              },
            ]}
            value={eventType}
            onChange={(v: any) => {
              setEventType(v);
              if (v === "Partido") setEventRoutine([]);
            }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}
        >
          <label
            style={{ fontSize: "0.7rem", fontWeight: "700", color: C.navy900 }}
          >
            {eventType === "Partido"
              ? "Nombre del Rival"
              : "Título del Entrenamiento"}
          </label>
          <FormInput
            required
            value={eventTitle}
            maxLength={30}
            onChange={(e) => setEventTitle(eventText(e.target.value))}
            placeholder={
              eventType === "Partido"
                ? "Ej. Deportivo Vecinos FC"
                : "Ej. Activación Física"
            }
          />
        </div>

        {eventType === "Entrenamiento" && (
          <RoutineBuilder routine={eventRoutine} onChange={setEventRoutine} />
        )}

        <div className="event-when">
          <div className="event-when__field">
            <label
              style={{
                fontSize: "0.7rem",
                fontWeight: "700",
                color: C.navy900,
              }}
            >
              Fecha
            </label>
            <FormInput
              type="date"
              required
              min={minDate}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="event-when__field">
            <label
              style={{
                fontSize: "0.7rem",
                fontWeight: "700",
                color: C.navy900,
              }}
            >
              Hora
            </label>
            <FormInput
              type="time"
              required
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}
        >
          <label
            style={{ fontSize: "0.7rem", fontWeight: "700", color: C.navy900 }}
          >
            Lugar o Campo
          </label>
          <FormInput
            value={eventLocation}
            maxLength={30}
            onChange={(e) => setEventLocation(eventText(e.target.value))}
            placeholder="Ej. Cancha 1, Unidad Deportiva"
          />
        </div>

        <FormError>{error}</FormError>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <PrimaryButton type="submit" disabled={saving} style={{ flex: 1, padding: "0.55rem" }}>
            {saving ? "Guardando…" : editingEventId ? "Guardar Cambios" : "Agendar Evento"}
          </PrimaryButton>
          {editingEventId && (
            <SecondaryButton
              type="button"
              onClick={onCancel}
              style={{ flex: 1, padding: "0.55rem" }}
            >
              Cancelar
            </SecondaryButton>
          )}
        </div>
      </form>
    </SectionCard>
  );
}
