// EventForm.tsx
import React from "react";
import { Calendar, Trophy, Target, Medal, Handshake } from "lucide-react";
import {
  SectionCard,
  SegmentedControl,
  FormInput,
  PrimaryButton,
  SecondaryButton,
  C
} from "../../components/ui";

import RoutineBuilder from "./RoutineBuilder";

interface EventFormProps {
  perms: any;
  editingEventId: string | null;
  eventType: "Partido" | "Entrenamiento";
  setEventType: (val: "Partido" | "Entrenamiento") => void;
  // 👇 NUEVO: Estado para el tipo de partido
  matchType: "Oficial" | "Amistoso";
  setMatchType: (val: "Oficial" | "Amistoso") => void;
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
  matchType, // 👈 Agregado
  setMatchType, // 👈 Agregado
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
      title={editingEventId ? "Editar Evento" : "Programar Evento"}
      icon={<Calendar size={16} />}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            style={{ fontSize: "0.8rem", fontWeight: "700", color: C.navy900 }}
          >
            Tipo de Evento
          </label>
          <SegmentedControl
            options={[
              {
                label: "Partido",
                value: "Partido",
                icon: <Trophy size={14} />,
              },
              {
                label: "Entrenamiento",
                value: "Entrenamiento",
                icon: <Target size={14} />,
              },
            ]}
            value={eventType}
            onChange={(v: any) => {
              setEventType(v);
              if (v === "Partido") {
                setEventRoutine([]);
                setMatchType("Oficial"); // Valor por defecto al cambiar a partido
              }
            }}
          />
        </div>

        {/* 👇 NUEVO: Selector de Oficial/Amistoso (Solo visible si es Partido) 👇 */}
        {eventType === "Partido" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: "700",
                color: C.navy900,
              }}
            >
              Carácter del Partido
            </label>
            <SegmentedControl
              options={[
                {
                  label: "Oficial",
                  value: "Oficial",
                  icon: <Medal size={14} />,
                },
                {
                  label: "Amistoso",
                  value: "Amistoso",
                  icon: <Handshake size={14} />,
                },
              ]}
              value={matchType}
              onChange={(v: any) => setMatchType(v)}
            />
          </div>
        )}

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            style={{ fontSize: "0.8rem", fontWeight: "700", color: C.navy900 }}
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
                ? "Ej. Real Madrid FC"
                : "Ej. Activación Física"
            }
          />
        </div>

        {eventType === "Entrenamiento" && (
          <RoutineBuilder routine={eventRoutine} onChange={setEventRoutine} />
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                fontSize: "0.8rem",
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
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                fontSize: "0.8rem",
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
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            style={{ fontSize: "0.8rem", fontWeight: "700", color: C.navy900 }}
          >
            Lugar o Campo
          </label>
          <FormInput
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Ej. Cancha 1, Unidad Deportiva"
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <PrimaryButton type="submit" style={{ flex: 1, padding: "0.875rem" }}>
            {editingEventId ? "Guardar Cambios" : "Agendar Evento"}
          </PrimaryButton>
          {editingEventId && (
            <SecondaryButton
              type="button"
              onClick={onCancel}
              style={{ flex: 1 }}
            >
              Cancelar
            </SecondaryButton>
          )}
        </div>
      </form>
    </SectionCard>
  );
}
