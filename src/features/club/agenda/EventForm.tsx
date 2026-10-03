// EventForm.tsx
import React from "react";
import { Calendar, Target, Handshake } from "lucide-react";
import {
  SectionCard,
  SegmentedControl,
  FormInput,
  PrimaryButton,
  SecondaryButton,
  C
} from "../../../shared/ui";

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
}: EventFormProps) {
  if (!perms.canEditAgenda) return null;

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
            onChange={(e) => setEventTitle(e.target.value)}
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
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Ej. Cancha 1, Unidad Deportiva"
          />
        </div>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <PrimaryButton type="submit" style={{ flex: 1, padding: "0.55rem" }}>
            {editingEventId ? "Guardar Cambios" : "Agendar Evento"}
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
