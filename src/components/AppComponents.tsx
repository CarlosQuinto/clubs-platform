import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  AlertTriangle,
  Plus,
  LayoutTemplate,
  ArrowRightLeft,
  Trophy,
  Target,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Camera,
  Award,
  Images,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Wallet,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Check,
  Goal,
  Shield,
  Activity,
} from "lucide-react";
import {
  C,
  RADIUS,
  SHADOWS,
  Badge,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
} from "./ui";
import {
  getPlayerName,
  formatFriendlyDate,
  formatFriendlyTime,
} from "../utils/helpers";
import RoutineDisplay from "./agenda/RoutineDisplay";

export const AttendanceModal = ({
  ev,
  players,
  perms,
  onClose,
  onSave,
}: any) => {
  const activePlayers = useMemo(
    () => players.filter((p: any) => p.active !== false),
    [players],
  );

  const initialAttendees = (ev.attendees || []).map((att: string) => {
    const p = players.find((pl: any) => pl.name === att || pl.id === att);
    if (p) return p.id;
    if (att.startsWith("guest-")) return att;
    return `guest-${att}`;
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [adminAttendees, setAdminAttendees] =
    useState<string[]>(initialAttendees);
  const [newGuest, setNewGuest] = useState("");

  const isAttending = adminAttendees.includes(selectedPlayerId);

  const allUniqueIds = useMemo(() => {
    const ids = activePlayers.map((p: any) => p.id);
    adminAttendees.forEach((att) => {
      if (!ids.includes(att)) ids.push(att);
    });
    return ids;
  }, [activePlayers, adminAttendees]);

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.85)", // Fondo Premium difuminado
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          width: "100%",
          maxWidth: "420px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: SHADOWS.xl,
          overflow: "hidden", // Para respetar las esquinas de la cabecera
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── CABECERA DEL MODAL ── */}
        <div
          style={{
            backgroundColor: C.gray50,
            borderBottom: `1px solid ${C.gray200}`,
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "800",
              color: C.navy900,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                padding: "6px",
                borderRadius: "50%",
                display: "flex",
              }}
            >
              <Users size={18} color={C.green} />
            </div>
            {perms.canEditAgenda
              ? "Gestionar Asistencias"
              : "Confirmar Asistencia"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: "50%",
              color: C.gray500,
              cursor: "pointer",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <div style={{ padding: "1.5rem", overflowY: "auto" }}>
          {perms.canEditAgenda ? (
            /* 👇 VISTA DEL DIRECTIVO 👇 */
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "1rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: C.navy900,
                    margin: 0,
                  }}
                >
                  Lista de Convocados
                </p>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: C.gray500,
                    fontWeight: "700",
                    backgroundColor: C.gray100,
                    padding: "2px 8px",
                    borderRadius: RADIUS.full,
                  }}
                >
                  {adminAttendees.length} Confirmados
                </span>
              </div>

              {/* Lista scrolleable de jugadores */}
              <div
                className="hide-scroll"
                style={{
                  maxHeight: "40vh",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  marginBottom: "1.25rem",
                  paddingRight: "0.2rem",
                }}
              >
                {allUniqueIds.map((id: string) => {
                  const attending = adminAttendees.includes(id);
                  const isGuest = id.startsWith("guest-");
                  const displayName = getPlayerName(id, players);

                  return (
                    <div
                      key={id}
                      onClick={() => {
                        if (attending)
                          setAdminAttendees(
                            adminAttendees.filter((n) => n !== id),
                          );
                        else setAdminAttendees([...adminAttendees, id]);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: RADIUS.lg,
                        backgroundColor: attending
                          ? "rgba(16, 185, 129, 0.05)"
                          : C.white,
                        border: `1px solid ${attending ? "rgba(16, 185, 129, 0.3)" : C.gray200}`,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: attending ? "700" : "500",
                          color: attending ? C.green : C.navy900,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {displayName}
                        {isGuest && (
                          <Badge
                            color="amber"
                            style={{ fontSize: "0.6rem", padding: "2px 6px" }}
                          >
                            Invitado
                          </Badge>
                        )}
                      </span>

                      {/* Checkbox Circular Custom (Estilo iOS) */}
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: attending ? "none" : `2px solid ${C.gray300}`,
                          backgroundColor: attending ? C.green : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {attending && (
                          <Check size={12} color={C.white} strokeWidth={4} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agregar Invitado */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                  borderTop: `1px dashed ${C.gray200}`,
                  paddingTop: "1.25rem",
                }}
              >
                <FormInput
                  value={newGuest}
                  onChange={(e) => setNewGuest(e.target.value)}
                  placeholder="Nombre del invitado..."
                  style={{ flex: 1, fontSize: "0.85rem" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = newGuest.trim();
                      if (trimmed) {
                        const guestId = `guest-${trimmed}`;
                        if (!adminAttendees.includes(guestId)) {
                          setAdminAttendees([...adminAttendees, guestId]);
                          setNewGuest("");
                        }
                      }
                    }
                  }}
                />
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    const trimmed = newGuest.trim();
                    if (trimmed) {
                      const guestId = `guest-${trimmed}`;
                      if (!adminAttendees.includes(guestId)) {
                        setAdminAttendees([...adminAttendees, guestId]);
                        setNewGuest("");
                      }
                    }
                  }}
                  style={{
                    padding: "0 1rem",
                    display: "flex",
                    gap: "0.3rem",
                    alignItems: "center",
                  }}
                >
                  <UserPlus size={16} /> Añadir
                </SecondaryButton>
              </div>

              <PrimaryButton
                onClick={() => onSave(ev.id, adminAttendees)}
                style={{ width: "100%", padding: "1rem", fontSize: "0.9rem" }}
              >
                Guardar Lista Oficial
              </PrimaryButton>
            </div>
          ) : (
            /* 👇 VISTA DEL JUGADOR 👇 */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  backgroundColor: C.gray50,
                  padding: "1.25rem",
                  borderRadius: RADIUS.lg,
                  border: `1px solid ${C.gray200}`,
                }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    color: C.navy900,
                    display: "block",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  ¿Quién eres?
                </label>
                <FormSelect
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "0.9rem",
                    padding: "0.75rem",
                  }}
                >
                  <option value="">
                    Selecciona tu nombre de la plantilla...
                  </option>
                  {activePlayers.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {selectedPlayerId && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {isAttending ? (
                    <button
                      onClick={() =>
                        onSave(
                          ev.id,
                          adminAttendees.filter(
                            (id: string) => id !== selectedPlayerId,
                          ),
                        )
                      }
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: C.red,
                        border: `1px solid rgba(239, 68, 68, 0.3)`,
                        borderRadius: RADIUS.md,
                        padding: "1rem",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <UserX size={18} /> Cancelar mi asistencia
                    </button>
                  ) : (
                    <PrimaryButton
                      variant="green"
                      onClick={() =>
                        onSave(ev.id, [...adminAttendees, selectedPlayerId])
                      }
                      style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <UserCheck size={18} /> Confirmar Asistencia
                    </PrimaryButton>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ── Pizarra Táctica y Formaciones (Múltiples Modalidades) ──
const FORMATIONS: Record<
  string,
  Record<
    string,
    { desc: string; nodes: { id: string; top: string; left: string }[] }
  >
> = {
  "Fut-11": {
    "4-4-2": {
      desc: "El clásico por excelencia. Muy equilibrado, ofrece dos líneas de cuatro sólidas y dos delanteros.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "15%" },
        { id: "df2", top: "75%", left: "38%" },
        { id: "df3", top: "75%", left: "62%" },
        { id: "df4", top: "75%", left: "85%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "50%", left: "38%" },
        { id: "md3", top: "50%", left: "62%" },
        { id: "md4", top: "50%", left: "85%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "4-3-3": {
      desc: "Orientado al ataque. Excelente para dominar la posesión en el mediocampo y atacar con extremos abiertos.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "15%" },
        { id: "df2", top: "75%", left: "38%" },
        { id: "df3", top: "75%", left: "62%" },
        { id: "df4", top: "75%", left: "85%" },
        { id: "md1", top: "50%", left: "25%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "75%" },
        { id: "fw1", top: "22%", left: "20%" },
        { id: "fw2", top: "22%", left: "50%" },
        { id: "fw3", top: "22%", left: "80%" },
      ],
    },
    "4-2-3-1": {
      desc: "Moderno y flexible. Utiliza un doble pivote defensivo con un mediapunta creativo jugando libre detrás del único delantero.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "15%" },
        { id: "df2", top: "75%", left: "38%" },
        { id: "df3", top: "75%", left: "62%" },
        { id: "df4", top: "75%", left: "85%" },
        { id: "cdm1", top: "60%", left: "35%" },
        { id: "cdm2", top: "60%", left: "65%" },
        { id: "cam1", top: "40%", left: "20%" },
        { id: "cam2", top: "40%", left: "50%" },
        { id: "cam3", top: "40%", left: "80%" },
        { id: "fw1", top: "20%", left: "50%" },
      ],
    },
    "3-5-2": {
      desc: "Control total del centro del campo. Requiere carrileros por las bandas con una enorme resistencia física para atacar y defender.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "55%", left: "35%" },
        { id: "md3", top: "40%", left: "50%" },
        { id: "md4", top: "55%", left: "65%" },
        { id: "md5", top: "50%", left: "85%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "5-3-2": {
      desc: "Enfoque defensivo. Cierra espacios atrás con tres centrales y dos laterales, buscando ofender mediante el contragolpe rápido.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "10%" },
        { id: "df2", top: "75%", left: "30%" },
        { id: "df3", top: "75%", left: "50%" },
        { id: "df4", top: "75%", left: "70%" },
        { id: "df5", top: "75%", left: "90%" },
        { id: "md1", top: "50%", left: "25%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "75%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
  },
  "Fut-9": {
    "3-3-2": {
      desc: "Muy balanceado. Tres defensas, tres medios y dos puntas para asegurar transiciones estructuradas.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "50%", left: "20%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "80%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "3-2-3": {
      desc: "Agresivo al frente. Deja solo dos medios, pero ejerce mucha presión alta con tres atacantes.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "55%", left: "35%" },
        { id: "md2", top: "55%", left: "65%" },
        { id: "fw1", top: "25%", left: "20%" },
        { id: "fw2", top: "25%", left: "50%" },
        { id: "fw3", top: "25%", left: "80%" },
      ],
    },
    "2-4-2": {
      desc: "Dominio de la posesión. Los cuatro mediocampistas acaparan el centro del campo y generan superioridad numérica.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "35%" },
        { id: "df2", top: "75%", left: "65%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "50%", left: "38%" },
        { id: "md3", top: "50%", left: "62%" },
        { id: "md4", top: "50%", left: "85%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "2-3-3": {
      desc: "Ultra ofensivo. Ideal si el rival se encierra mucho, pero requiere defensas muy rápidos al quedar expuestos.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "35%" },
        { id: "df2", top: "75%", left: "65%" },
        { id: "md1", top: "50%", left: "25%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "75%" },
        { id: "fw1", top: "25%", left: "20%" },
        { id: "fw2", top: "25%", left: "50%" },
        { id: "fw3", top: "25%", left: "80%" },
      ],
    },
    "3-4-1": {
      desc: "Control y solidez. Se defiende en bloque con líneas muy juntas y se busca a un solo delantero referente (poste) para desahogar.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "50%", left: "38%" },
        { id: "md3", top: "50%", left: "62%" },
        { id: "md4", top: "50%", left: "85%" },
        { id: "fw1", top: "22%", left: "50%" },
      ],
    },
  },
  "Fut-7": {
    "2-3-1": {
      desc: "El más popular. Forma un rombo en el medio que da mucho apoyo tanto a los defensas como al delantero.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "30%" },
        { id: "df2", top: "75%", left: "70%" },
        { id: "md1", top: "48%", left: "20%" },
        { id: "md2", top: "48%", left: "50%" },
        { id: "md3", top: "48%", left: "80%" },
        { id: "fw1", top: "22%", left: "50%" },
      ],
    },
    "3-2-1": {
      desc: 'Muy conservador (el "árbol"). Cierra la puerta atrás, ideal para proteger un resultado o jugar al contraataque.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "48%", left: "35%" },
        { id: "md2", top: "48%", left: "65%" },
        { id: "fw1", top: "22%", left: "50%" },
      ],
    },
    "2-1-3": {
      desc: "Altamente ofensivo. Un solo medio de contención (muy exigedido) y tres delanteros asfixiando la salida rival.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "30%" },
        { id: "df2", top: "75%", left: "70%" },
        { id: "cdm1", top: "55%", left: "50%" },
        { id: "fw1", top: "25%", left: "20%" },
        { id: "fw2", top: "25%", left: "50%" },
        { id: "fw3", top: "25%", left: "80%" },
      ],
    },
    "2-2-2": {
      desc: 'El "cuadrado". Distribuye a los jugadores en parejas, es fácil de entender y ayuda a no perder el orden.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "30%" },
        { id: "df2", top: "75%", left: "70%" },
        { id: "md1", top: "50%", left: "30%" },
        { id: "md2", top: "50%", left: "70%" },
        { id: "fw1", top: "25%", left: "30%" },
        { id: "fw2", top: "25%", left: "70%" },
      ],
    },
    "1-3-2": {
      desc: "Riesgoso atrás, pero con mucho volumen de ataque. Requiere un líbero rápido y con excelente lectura de juego.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "50%" },
        { id: "md1", top: "50%", left: "20%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "80%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
  },
  "Fut-5": {
    "2-2": {
      desc: 'El "cuadrado". Dos defienden y dos atacan, la forma más sencilla y directa de estructurar al equipo en espacios reducidos.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "65%", left: "30%" },
        { id: "df2", top: "65%", left: "70%" },
        { id: "fw1", top: "30%", left: "30%" },
        { id: "fw2", top: "30%", left: "70%" },
      ],
    },
    "1-2-1": {
      desc: 'El "rombo". Un cierre, dos alas y un pívot. Es el sistema más dinámico y versátil del futsal.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "70%", left: "50%" },
        { id: "md1", top: "45%", left: "25%" },
        { id: "md2", top: "45%", left: "75%" },
        { id: "fw1", top: "20%", left: "50%" },
      ],
    },
    "3-1": {
      desc: 'El "cerrojo" o la pirámide. Tres atrás y un atacante aislado. Perfecto para aguantar marcadores y obligar a disparos lejanos.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "65%", left: "20%" },
        { id: "df2", top: "65%", left: "50%" },
        { id: "df3", top: "65%", left: "80%" },
        { id: "fw1", top: "25%", left: "50%" },
      ],
    },
    "1-1-2": {
      desc: 'La "Y". Un defensa, un medio creador y dois atacantes. Se usa mucho como recurso de emergencia si necesitas goles rápidos.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "50%" },
        { id: "md1", top: "50%", left: "50%" },
        { id: "fw1", top: "25%", left: "30%" },
        { id: "fw2", top: "25%", left: "70%" },
      ],
    },
    "2-1-1": {
      desc: 'La "Y" invertida. Dos defensas, un medio y un punta. Da solidez defensiva con un mediocampista que sirve de bisagra.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "70%", left: "30%" },
        { id: "df2", top: "70%", left: "70%" },
        { id: "md1", top: "48%", left: "50%" },
        { id: "fw1", top: "25%", left: "50%" },
      ],
    },
  },
};

export const LineupModal = ({
  ev,
  players,
  clubInfo,
  perms,
  onClose,
  onSave,
  onSaveBase,
}: any) => {
  const initialMode = ev.lineup?.mode || "Fut-7";
  const initialForm = ev.lineup?.formation || "2-3-1";

  // Normalizar posiciones previas
  const normalizedPositions: Record<string, string> = {};
  Object.entries(ev.lineup?.positions || {}).forEach(([pos, val]: any) => {
    const p = players.find((pl: any) => pl.name === val || pl.id === val);
    normalizedPositions[pos] = p
      ? p.id
      : val.startsWith("guest-")
        ? val
        : `guest-${val}`;
  });

  const [mode, setMode] = useState(initialMode);
  const [formation, setFormation] = useState(initialForm);
  const [positions, setPositions] =
    useState<Record<string, string>>(normalizedPositions);

  // Ahora selectedPlayer puede ser alguien de la banca O de la cancha
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // ── 1. MANTENER JUGADORES AL CAMBIAR FORMACIÓN ──
  const reassignPlayersToNewFormation = (newMode: string, newForm: string) => {
    const newNodes = FORMATIONS[newMode][newForm].nodes;
    const currentlyPlayingIds = Object.values(positions);
    const newPos: Record<string, string> = {};

    // Asignamos los jugadores actuales a los nuevos nodos en orden
    currentlyPlayingIds.forEach((playerId, index) => {
      if (index < newNodes.length) {
        newPos[newNodes[index].id] = playerId;
      }
    });
    return newPos;
  };

  const handleModeChange = (newMode: string) => {
    const newForm = Object.keys(FORMATIONS[newMode])[0];
    const newPos = reassignPlayersToNewFormation(newMode, newForm);
    setMode(newMode);
    setFormation(newForm);
    setPositions(newPos);
    setSelectedPlayerId(null);
  };

  const handleFormationChange = (newForm: string) => {
    const newPos = reassignPlayersToNewFormation(mode, newForm);
    setFormation(newForm);
    setPositions(newPos);
    setSelectedPlayerId(null);
  };

  const handleLoadBase = () => {
    const base = clubInfo.defaultLineups?.[mode];
    if (base) {
      setFormation(base.formation);
      const normalizedBase: Record<string, string> = {};
      Object.entries(base.positions || {}).forEach(([pos, val]: any) => {
        const p = players.find((pl: any) => pl.name === val || pl.id === val);
        normalizedBase[pos] = p
          ? p.id
          : val.startsWith("guest-")
            ? val
            : `guest-${val}`;
      });
      setPositions(normalizedBase);
      setSelectedPlayerId(null);
    } else {
      alert("Aún no hay táctica base guardada para esta modalidad.");
    }
  };

  // ── 2. LÓGICA DE INTERCAMBIO (SWAP) PARA DRAG & DROP ──
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    if (!perms.canEditAgenda) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("playerId", playerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropToNode = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    if (!perms.canEditAgenda) return;

    const draggedPlayerId = e.dataTransfer.getData("playerId");
    if (!draggedPlayerId) return;

    executeSwap(draggedPlayerId, targetNodeId);
  };

  const handleDropToBench = (e: React.DragEvent) => {
    e.preventDefault();
    if (!perms.canEditAgenda) return;

    const draggedPlayerId = e.dataTransfer.getData("playerId");
    if (!draggedPlayerId) return;

    sendToBench(draggedPlayerId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // ── 3. LÓGICA DE INTERCAMBIO (SWAP) PARA CLICS (MÓVILES) ──
  const executeSwap = (originPlayerId: string, targetNodeId: string) => {
    const newPos = { ...positions };

    // Buscar dónde estaba el jugador original
    const oldNodeId = Object.keys(newPos).find(
      (k) => newPos[k] === originPlayerId,
    );

    // Ver quién ocupa el lugar destino
    const targetPlayerId = newPos[targetNodeId];

    // Quitar al original de su puesto antiguo
    if (oldNodeId) delete newPos[oldNodeId];

    // Colocar al original en el nuevo puesto
    newPos[targetNodeId] = originPlayerId;

    // Si había alguien en el puesto nuevo, lo mandamos al puesto viejo (Swap)
    if (targetPlayerId && targetPlayerId !== originPlayerId) {
      if (oldNodeId) {
        newPos[oldNodeId] = targetPlayerId;
      }
      // Si oldNodeId no existe, significa que el original venía de la banca,
      // por lo que el targetPlayerId se queda fuera (se va a la banca).
    }

    setPositions(newPos);
    setSelectedPlayerId(null);
  };

  const sendToBench = (playerId: string) => {
    const newPos = { ...positions };
    const oldNodeId = Object.keys(newPos).find((k) => newPos[k] === playerId);
    if (oldNodeId) {
      delete newPos[oldNodeId];
      setPositions(newPos);
    }
    setSelectedPlayerId(null);
  };

  // Clic en un círculo de la cancha
  const handleNodeClick = (nodeId: string) => {
    if (!perms.canEditAgenda) return;

    const targetPlayerId = positions[nodeId];

    if (selectedPlayerId) {
      // Si teníamos a alguien seleccionado, ejecutamos el intercambio
      executeSwap(selectedPlayerId, nodeId);
    } else {
      // Si no hay nadie seleccionado y tocamos a un jugador, lo seleccionamos
      if (targetPlayerId) {
        setSelectedPlayerId(targetPlayerId);
      }
    }
  };

  // Clic en la zona general de la banca (para mandar a un jugador a sentarse)
  const handleBenchZoneClick = () => {
    if (!perms.canEditAgenda || !selectedPlayerId) return;
    sendToBench(selectedPlayerId);
  };

  // Clic específico sobre un jugador que ya está sentado en la banca
  const handleBenchPlayerClick = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation(); // Evita que se dispare handleBenchZoneClick
    if (!perms.canEditAgenda) return;

    if (selectedPlayerId === playerId) {
      // Deseleccionar si se toca de nuevo
      setSelectedPlayerId(null);
    } else if (selectedPlayerId) {
      // Si teníamos a alguien del campo seleccionado y tocamos a alguien de la banca: INTERCAMBIO
      const oldNodeId = Object.keys(positions).find(
        (k) => positions[k] === selectedPlayerId,
      );
      if (oldNodeId) {
        const newPos = { ...positions };
        newPos[oldNodeId] = playerId; // El de la banca entra al campo
        setPositions(newPos); // El seleccionado original se va a la banca
      }
      setSelectedPlayerId(null);
    } else {
      // Seleccionar al de la banca
      setSelectedPlayerId(playerId);
    }
  };

  // Listas de jugadores
  const attendeesIds = (ev.attendees || []).map((att: string) => {
    const p = players.find((pl: any) => pl.name === att || pl.id === att);
    return p ? p.id : att.startsWith("guest-") ? att : `guest-${att}`;
  });

  const benchPlayers = attendeesIds.filter(
    (id: string) => !Object.values(positions).includes(id),
  );

  const currentFormationData = FORMATIONS[mode][formation];
  const currentNodes = currentFormationData.nodes;

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.95)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.navy900,
          borderRadius: RADIUS.xl,
          width: "100%",
          maxWidth: "480px",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: SHADOWS.xl,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div
          style={{
            padding: "1.25rem 1.25rem 0.5rem 1.25rem",
            borderBottom: `1px solid ${C.navy800}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "800",
                color: C.white,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <LayoutTemplate size={20} color={C.amber} /> Pizarra Táctica
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.navy300,
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {perms.canEditAgenda && (
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <FormSelect
                value={mode}
                onChange={(e) => handleModeChange(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: C.white,
                  border: "none",
                }}
              >
                {Object.keys(FORMATIONS).map((m) => (
                  <option key={m} value={m} style={{ color: C.gray800 }}>
                    {m}
                  </option>
                ))}
              </FormSelect>
              <FormSelect
                value={formation}
                onChange={(e) => handleFormationChange(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: C.white,
                  border: "none",
                }}
              >
                {Object.keys(FORMATIONS[mode]).map((f) => (
                  <option key={f} value={f} style={{ color: C.gray800 }}>
                    {f}
                  </option>
                ))}
              </FormSelect>
            </div>
          )}
        </div>

        {/* CONTENEDOR CENTRAL: LA CANCHA */}
        <div
          style={{
            position: "relative",
            width: "100%",
            padding: "1rem",
            backgroundColor: C.navy900,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "450px",
              borderRadius: RADIUS.md,
              border: "2px solid rgba(255,255,255,0.4)",
              overflow: "hidden",
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)",
              background:
                "repeating-linear-gradient(0deg, #166534, #166534 10%, #14532d 10%, #14532d 20%)",
            }}
          >
            {/* LÍNEAS DEL CAMPO */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "rgba(255,255,255,0.4)",
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "90px",
                height: "90px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "8px",
                height: "8px",
                backgroundColor: "rgba(255,255,255,0.6)",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: "16%",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTop: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "20%",
                right: "20%",
                height: "16%",
                border: "2px solid rgba(255,255,255,0.4)",
                borderBottom: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "12%",
                left: "50%",
                width: "60px",
                height: "60px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "50%",
                transform: "translate(-50%, 0)",
                clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "12%",
                left: "50%",
                width: "60px",
                height: "60px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "50%",
                transform: "translate(-50%, 0)",
                clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
              }}
            />

            {/* NODOS (POSICIONES) */}
            {currentNodes.map((pos) => {
              const playerId = positions[pos.id];
              const isSelectedNode =
                selectedPlayerId !== null && selectedPlayerId !== playerId;
              const isThisPlayerSelected = selectedPlayerId === playerId;

              return (
                <div
                  key={pos.id}
                  onClick={() => handleNodeClick(pos.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropToNode(e, pos.id)}
                  style={{
                    position: "absolute",
                    top: pos.top,
                    left: pos.left,
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: perms.canEditAgenda ? "pointer" : "default",
                    transition:
                      "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    zIndex: playerId ? 10 : 5,
                  }}
                >
                  {playerId ? (
                    <div
                      draggable={perms.canEditAgenda}
                      onDragStart={(e) => handleDragStart(e, playerId)}
                      style={{
                        transform: isThisPlayerSelected
                          ? "scale(1.1) translateY(-4px)"
                          : "scale(1)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <PlayerToken
                        playerId={playerId}
                        players={players}
                        isSelected={isThisPlayerSelected}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: isSelectedNode
                          ? `2px dashed ${C.amber}`
                          : "2px dashed rgba(255,255,255,0.3)",
                        backgroundColor: isSelectedNode
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: isSelectedNode
                          ? "pulse 1.5s infinite"
                          : "none",
                      }}
                    >
                      <Plus
                        size={16}
                        color={
                          isSelectedNode ? C.amber : "rgba(255,255,255,0.3)"
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 👇 EL BANQUILLO INTELIGENTE 👇 */}
        {perms.canEditAgenda && (
          <div
            onClick={handleBenchZoneClick}
            onDragOver={handleDragOver}
            onDrop={handleDropToBench}
            style={{
              backgroundColor: C.navy800,
              padding: "1rem",
              borderTop: `1px solid ${C.navy700}`,
              cursor: selectedPlayerId ? "pointer" : "default", // Da la pista de que puedes hacer clic para sentarlo
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: C.navy300,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Banquillo ({benchPlayers.length})
              </span>
              <span style={{ fontSize: "0.65rem", color: C.gray400 }}>
                {selectedPlayerId
                  ? "👆 Toca una posición o aquí para sentarlo"
                  : "👆 Toca o Arrastra un jugador"}
              </span>
            </div>

            <div
              className="hide-scroll"
              style={{
                display: "flex",
                gap: "0.75rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
                minHeight: "60px",
              }}
            >
              {benchPlayers.length === 0 ? (
                <p
                  style={{
                    color: C.gray500,
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    margin: "0.5rem 0",
                    width: "100%",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  (Toca o arrastra jugadores aquí para mandarlos a la banca)
                </p>
              ) : (
                benchPlayers.map((attId: string) => {
                  const isSelected = selectedPlayerId === attId;
                  return (
                    <div
                      key={attId}
                      draggable={perms.canEditAgenda}
                      onDragStart={(e) => handleDragStart(e, attId)}
                      onClick={(e) => handleBenchPlayerClick(e, attId)}
                      style={{
                        transform: isSelected
                          ? "scale(1.1) translateY(-4px)"
                          : "scale(1)",
                        transition: "all 0.2s ease",
                        cursor: "grab",
                        display: "inline-block", // 👈 CRUCIAL: Esto aísla el elemento para que el "fantasma" del Drag & Drop no arrastre a los demás
                      }}
                    >
                      <PlayerToken
                        playerId={attId}
                        players={players}
                        isSelected={isSelected}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PIE DEL MODAL: BOTONES DE GUARDAR */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: C.navy900,
            display: "flex",
            gap: "0.5rem",
            borderTop: `1px solid ${C.navy800}`,
          }}
        >
          {perms.canEditAgenda && (
            <>
              <SecondaryButton
                onClick={handleLoadBase}
                style={{ flex: 1, fontSize: "0.75rem", padding: "0.75rem" }}
              >
                Cargar Base
              </SecondaryButton>
              <PrimaryButton
                onClick={() => onSave(ev.id, { mode, formation, positions })}
                style={{ flex: 2, fontSize: "0.85rem", padding: "0.75rem" }}
              >
                Guardar Táctica
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ── COMPONENTE AUXILIAR PARA LA FICHA DEL JUGADOR (TOKEN) ──
const PlayerToken = ({
  playerId,
  players,
  isSelected = false,
}: {
  playerId: string;
  players: any[];
  isSelected?: boolean;
}) => {
  const playerInfo = players.find((pl: any) => pl.id === playerId);
  const isGuest = playerId.startsWith("guest-");
  const displayName = playerInfo
    ? playerInfo.name
    : playerId.replace("guest-", "");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "48px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: isSelected
            ? `3px solid ${C.amber}`
            : isGuest
              ? `2px dashed ${C.gray400}`
              : `2px solid ${C.white}`,
          boxShadow: isSelected ? `0 0 15px ${C.amber}80` : SHADOWS.md,
          overflow: "visible",
        }}
      >
        <img
          src={
            playerInfo?.imageUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${isGuest ? "475569" : "102a43"}&color=fff&size=50`
          }
          alt={displayName}
          draggable="false"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
            backgroundColor: C.navy900,
          }}
        />

        {!isGuest && playerInfo?.position && (
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: C.navy900,
              color: C.white,
              fontSize: "0.5rem",
              fontWeight: "900",
              padding: "1px 4px",
              borderRadius: RADIUS.sm,
              border: `1px solid ${C.navy700}`,
              whiteSpace: "nowrap",
            }}
          >
            {playerInfo.position.substring(0, 3).toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "8px", width: "100%" }}>
        <span
          style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            color: C.white,
            fontSize: "0.6rem",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: "700",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "inline-block",
            maxWidth: "100%",
          }}
        >
          {displayName.split(" ")[0]}
        </span>
      </div>
    </div>
  );
};

// ── Comparador de Jugadores Modal (ESTILO PREMIUM) ──
export const CompareModal = ({
  playersStats,
  onClose,
}: {
  playersStats: any[];
  onClose: () => void;
}) => {
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");

  const activePlayersStats = useMemo(
    () => playersStats.filter((p: any) => p.active !== false),
    [playersStats],
  );

  const pA = activePlayersStats.find((p) => p.id === playerAId);
  const pB = activePlayersStats.find((p) => p.id === playerBId);

  // 👇 NUEVO RENDER DE FILAS CON ÍCONOS Y PÍLDORAS 👇
  const renderRow = (
    label: string,
    icon: React.ReactNode,
    valA: number,
    valB: number,
    reverse: boolean = false,
  ) => {
    const isTie = valA === valB;
    const aIsBetter = !isTie && (reverse ? valA < valB : valA > valB);
    const bIsBetter = !isTie && (reverse ? valB < valA : valB > valA);

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 0",
          borderBottom: `1px solid ${C.gray100}`,
          transition: "background-color 0.2s ease",
        }}
      >
        {/* VALOR JUGADOR A */}
        <div
          style={{ width: "25%", display: "flex", justifyContent: "center" }}
        >
          <span
            style={{
              backgroundColor: aIsBetter ? C.green : "transparent",
              color: aIsBetter ? C.white : isTie ? C.navy900 : C.gray400,
              padding: aIsBetter ? "4px 16px" : "4px",
              borderRadius: RADIUS.full,
              fontWeight: aIsBetter ? "900" : "700",
              fontSize: "1.1rem",
              boxShadow: aIsBetter ? SHADOWS.sm : "none",
              transition: "all 0.2s ease",
            }}
          >
            {valA}
          </span>
        </div>

        {/* ETIQUETA E ÍCONO (CENTRO) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <div style={{ color: C.navy300, opacity: 0.8 }}>{icon}</div>
          <span
            style={{
              fontWeight: "800",
              color: C.navy900,
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </span>
        </div>

        {/* VALOR JUGADOR B */}
        <div
          style={{ width: "25%", display: "flex", justifyContent: "center" }}
        >
          <span
            style={{
              backgroundColor: bIsBetter ? C.green : "transparent",
              color: bIsBetter ? C.white : isTie ? C.navy900 : C.gray400,
              padding: bIsBetter ? "4px 16px" : "4px",
              borderRadius: RADIUS.full,
              fontWeight: bIsBetter ? "900" : "700",
              fontSize: "1.1rem",
              boxShadow: bIsBetter ? SHADOWS.sm : "none",
              transition: "all 0.2s ease",
            }}
          >
            {valB}
          </span>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.90)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          width: "100%",
          maxWidth: "450px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: SHADOWS.xl,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        className="hide-scroll"
      >
        {/* ENCABEZADO Y ÁREA DE FOTOS CON FONDO SUTIL */}
        <div
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
            padding: "1.5rem",
            borderBottom: `1px solid ${C.gray200}`,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "900",
                color: C.navy900,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <ArrowRightLeft size={20} color={C.blueAccent} /> Cara a Cara
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "none",
                borderRadius: "50%",
                color: C.gray600,
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* SELECTORES DE JUGADORES */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <FormSelect
              value={playerAId}
              onChange={(e) => setPlayerAId(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: C.white,
                fontWeight: "600",
                fontSize: "0.8125rem",
              }}
            >
              <option value="">Jugador A</option>
              {activePlayersStats.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === playerBId}>
                  {p.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              value={playerBId}
              onChange={(e) => setPlayerBId(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: C.white,
                fontWeight: "600",
                fontSize: "0.8125rem",
              }}
            >
              <option value="">Jugador B</option>
              {activePlayersStats.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === playerAId}>
                  {p.name}
                </option>
              ))}
            </FormSelect>
          </div>

          {/* LAS FOTOS Y EL "VS" */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              height: "90px",
            }}
          >
            {/* Jugador A */}
            <div
              style={{
                width: "90px",
                height: "90px",
                backgroundColor: C.white,
                borderRadius: "50%",
                border: `4px solid ${C.white}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: SHADOWS.md,
                position: "absolute",
                left: "15%",
                zIndex: 2,
              }}
            >
              {pA ? (
                <img
                  src={
                    pA.imageUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(pA.name)}&background=102a43&color=fff&size=100`
                  }
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "2.5rem", opacity: 0.1 }}>👤</span>
              )}
            </div>

            {/* Escudo VS Central */}
            <div
              style={{
                backgroundColor: C.amber,
                color: C.white,
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "0.85rem",
                boxShadow: "0 4px 10px rgba(245, 158, 11, 0.4)",
                zIndex: 3,
                border: `3px solid ${C.white}`,
              }}
            >
              VS
            </div>

            {/* Jugador B */}
            <div
              style={{
                width: "90px",
                height: "90px",
                backgroundColor: C.white,
                borderRadius: "50%",
                border: `4px solid ${C.white}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: SHADOWS.md,
                position: "absolute",
                right: "15%",
                zIndex: 1,
              }}
            >
              {pB ? (
                <img
                  src={
                    pB.imageUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(pB.name)}&background=102a43&color=fff&size=100`
                  }
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "2.5rem", opacity: 0.1 }}>👤</span>
              )}
            </div>
          </div>
        </div>

        {/* ÁREA DE ESTADÍSTICAS */}
        <div style={{ padding: "1.5rem" }}>
          {pA && pB ? (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              {renderRow("Goles", <Goal size={16} />, pA.goals, pB.goals)}
              {renderRow(
                "Asistencias",
                <Users size={16} />,
                pA.assists,
                pB.assists,
              )}
              {renderRow(
                "Partidos",
                <Calendar size={16} />,
                pA.matchesAttended,
                pB.matchesAttended,
              )}
              {renderRow(
                "Prácticas",
                <Activity size={16} />,
                pA.trainingsAttended,
                pB.trainingsAttended,
              )}
              {renderRow("Premios MVP", <Award size={16} />, pA.mvps, pB.mvps)}

              {(pA.position === "Portero" || pB.position === "Portero") &&
                renderRow(
                  "Goles Recibidos",
                  <Target size={16} />,
                  pA.goalsConceded,
                  pB.goalsConceded,
                  true,
                )}
              {(pA.position === "Portero" || pB.position === "Portero") &&
                renderRow(
                  "Arcos en Cero",
                  <Shield size={16} />,
                  pA.cleanSheets,
                  pB.cleanSheets,
                )}

              {renderRow(
                "Amarillas",
                <AlertTriangle size={16} />,
                pA.yellowCards,
                pB.yellowCards,
                true,
              )}
              {renderRow(
                "Rojas",
                <AlertTriangle size={16} />,
                pA.redCards,
                pB.redCards,
                true,
              )}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                opacity: 0.5,
              }}
            >
              <ArrowRightLeft
                size={48}
                color={C.gray400}
                style={{ marginBottom: "1rem" }}
              />
              <p
                style={{
                  color: C.gray600,
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                Selecciona a dos jugadores en la parte superior para comenzar la
                comparación.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ── Nuevo Lightbox Carrusel Global (Scroll Matemático Centrado) ──
export const LightboxModal = ({
  urls,
  initialIndex = 0,
  caption,
  onClose,
}: any) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thumbnailsRef.current && urls.length > 1) {
      const container = thumbnailsRef.current;
      const activeThumb = container.children[currentIndex] as HTMLElement;

      if (activeThumb) {
        const containerCenter = container.clientWidth / 2;
        const thumbCenter = activeThumb.clientWidth / 2;
        const scrollPos =
          activeThumb.offsetLeft - containerCenter + thumbCenter;

        container.scrollTo({
          left: scrollPos,
          behavior: "smooth",
        });
      }
    }
  }, [currentIndex, urls.length]);

  const handlePrev = (e: any) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };
  const handleNext = (e: any) => {
    e.stopPropagation();
    if (currentIndex < urls.length - 1) setCurrentIndex(currentIndex + 1);
  };

  if (!urls || urls.length === 0) return null;

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.95)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s",
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          zIndex: 20,
          padding: "0.5rem",
        }}
      >
        <X size={32} />
      </button>

      {caption && (
        <div
          style={{
            position: "absolute",
            top: "2rem",
            left: "1.5rem",
            right: "4.5rem",
            color: "#fff",
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {caption}
            <span
              style={{
                opacity: 0.7,
                fontSize: "0.8rem",
                marginLeft: "0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              ({currentIndex + 1} / {urls.length})
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 0",
        }}
      >
        <img
          src={urls[currentIndex]}
          style={{
            maxWidth: "100%",
            maxHeight: "75vh",
            objectFit: "contain",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            transition: "opacity 0.2s",
          }}
          alt={`Img ${currentIndex}`}
        />

        {currentIndex > 0 && (
          <div
            onClick={handlePrev}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "40%",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              paddingLeft: "0.5rem",
            }}
          >
            <ChevronLeft
              size={36}
              color="rgba(255, 255, 255, 0.4)"
              style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.8))" }}
            />
          </div>
        )}

        {currentIndex < urls.length - 1 && (
          <div
            onClick={handleNext}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "40%",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "0.5rem",
            }}
          >
            <ChevronRight
              size={36}
              color="rgba(255, 255, 255, 0.4)"
              style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.8))" }}
            />
          </div>
        )}
      </div>

      {urls.length > 1 && (
        <div
          ref={thumbnailsRef}
          className="hide-scroll"
          style={{
            width: "100%",
            padding: "1.5rem 1rem",
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            justifyContent: urls.length > 5 ? "flex-start" : "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            zIndex: 20,
            scrollBehavior: "smooth",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {urls.map((url: string, idx: number) => (
            <img
              key={idx}
              src={url}
              loading="lazy"
              decoding="async"
              onClick={() => setCurrentIndex(idx)}
              style={{
                flexShrink: 0,
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "4px",
                cursor: "pointer",
                border:
                  currentIndex === idx
                    ? `2px solid ${C.amber}`
                    : "2px solid transparent",
                opacity: currentIndex === idx ? 1 : 0.4,
                transition: "all 0.2s",
                boxShadow:
                  currentIndex === idx ? `0 0 10px ${C.amber}` : "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ── Event card ──
export const EventCard = ({
  ev,
  players,
  onDelete,
  onEdit,
  onOpenAttendance,
  onOpenLineup,
  perms,
  isHighlighted,
  onImageClick,
  onEditPhoto,
  onOpenArbitration,
}: any) => {
  const isMatch = ev.eventType === "Partido";
  const attendeesCount = (ev.attendees || []).length;
  const hasLineup =
    ev.lineup && Object.keys(ev.lineup.positions || {}).length > 0;

  const photos =
    ev.photoUrls && ev.photoUrls.length > 0
      ? ev.photoUrls
      : ev.photoUrl
        ? [ev.photoUrl]
        : [];
  const hasPhotos = photos.length > 0;

  // Estado: Controla si la tarjeta entera del evento está abierta o colapsada
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      id={`event-card-${ev.id}`}
      className={isHighlighted ? "highlighted-event" : ""}
      style={{
        border: isHighlighted
          ? `2px solid ${C.amber}`
          : `1px solid ${C.gray200}`,
        borderRadius: RADIUS.lg,
        padding: "1.25rem 1.5rem",
        backgroundColor: C.white,
        transition: "all 0.3s ease",
        boxShadow: SHADOWS.sm,
      }}
    >
      {/* ENCABEZADO CLICABLE PARA COLAPSAR LA TARJETA */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: isExpanded ? "1rem" : "0",
          cursor: "pointer",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
        >
          {/* Ícono indicador de expansión */}
          <div style={{ marginTop: "0.25rem" }}>
            {isExpanded ? (
              <ChevronUp size={20} color={C.gray400} />
            ) : (
              <ChevronDown size={20} color={C.gray400} />
            )}
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                flexWrap: "wrap",
              }}
            >
              <Badge color={isMatch ? "green" : "blue"}>
                {isMatch ? <Trophy size={11} /> : <Target size={11} />}
                {isMatch ? "Partido" : "Entrenamiento"}
              </Badge>

              {/* 👇 NUEVO: INDICADOR OFICIAL / AMISTOSO 👇 */}
              {isMatch && (
                <span
                  style={{
                    backgroundColor:
                      ev.matchType === "Amistoso"
                        ? "rgba(59, 130, 246, 0.1)" // Azul tenue para Amistoso
                        : "rgba(245, 158, 11, 0.1)", // Dorado tenue para Oficial
                    color: ev.matchType === "Amistoso" ? "#3b82f6" : C.amber,
                    border: `1px solid ${
                      ev.matchType === "Amistoso"
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(245, 158, 11, 0.3)"
                    }`,
                    padding: "2px 8px",
                    borderRadius: RADIUS.full,
                    fontSize: "0.6rem",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {ev.matchType === "Amistoso" ? "Amistoso" : "Oficial"}
                </span>
              )}
            </div>

            <h3
              style={{
                margin: "0.5rem 0 0 0",
                fontSize: "1.0625rem",
                fontWeight: "700",
                color: C.navy900,
                letterSpacing: "-0.01em",
              }}
            >
              {ev.title}
            </h3>
          </div>
        </div>

        {perms.canEditAgenda && (
          <div
            style={{ display: "flex", gap: "0.25rem" }}
            onClick={(e) => e.stopPropagation()} // Evita colapsar al hacer clic en Editar/Borrar
          >
            <button
              onClick={onEdit}
              style={{
                background: "none",
                border: "none",
                color: C.navy600,
                cursor: "pointer",
                padding: "4px",
                opacity: 0.6,
              }}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              style={{
                background: "none",
                border: "none",
                color: C.red,
                cursor: "pointer",
                padding: "4px",
                opacity: 0.6,
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ENVOLVEMOS EL RESTO EN LA CONDICIÓN isExpanded */}
      {isExpanded && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {!isMatch && ev.routine && <RoutineDisplay routine={ev.routine} />}

          <div
            style={{
              fontSize: "0.8125rem",
              color: C.gray500,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "1rem",
              marginTop: "1rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Calendar size={14} /> {formatFriendlyDate(ev.eventDate)}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Clock size={14} /> {formatFriendlyTime(ev.eventTime)}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <MapPin size={14} /> {ev.location}
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${C.gray200}`,
              paddingTop: "0.875rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: attendeesCount > 0 ? C.green : C.gray400,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Users size={14} /> {attendeesCount} confirmados
              </p>
              {attendeesCount > 0 && (
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.75rem",
                    color: C.gray400,
                  }}
                >
                  {(ev.attendees || [])
                    .map((id: string) => getPlayerName(id, players))
                    .join(", ")}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {isMatch && (perms.canEditAgenda || hasLineup) && (
                <SecondaryButton
                  onClick={onOpenLineup}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.5rem 0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    borderColor: C.amber,
                    color: C.amber,
                    backgroundColor: C.amberLight,
                  }}
                >
                  <LayoutTemplate size={14} />{" "}
                  {perms.canEditAgenda
                    ? hasLineup
                      ? "Editar Alineación"
                      : "Armar Alineación"
                    : "Ver Alineación"}
                </SecondaryButton>
              )}
              {isMatch && perms.canEditAgenda && (
                <SecondaryButton
                  onClick={onOpenArbitration}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.5rem 0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Wallet size={14} /> Pagos Arbitraje
                </SecondaryButton>
              )}
              <SecondaryButton
                onClick={onOpenAttendance}
                style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}
              >
                Confirmar / Cambiar
              </SecondaryButton>
            </div>
          </div>

          {hasPhotos ? (
            <div style={{ marginTop: "1rem", position: "relative" }}>
              <img
                src={photos[0]}
                alt={`Foto de ${ev.title}`}
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: RADIUS.md,
                  cursor: "pointer",
                  boxShadow: SHADOWS.sm,
                }}
                onClick={() =>
                  onImageClick &&
                  onImageClick({
                    urls: photos,
                    initialIndex: 0,
                    caption: `${ev.title} - ${formatFriendlyDate(ev.eventDate)}`,
                  })
                }
              />
              {photos.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    left: "0.5rem",
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    color: C.white,
                    padding: "0.3rem 0.6rem",
                    borderRadius: RADIUS.full,
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    pointerEvents: "none",
                  }}
                >
                  <Images size={14} /> 1 / {photos.length}
                </div>
              )}
              {(perms.canEditPortada || perms.canEditAgenda) && (
                <button
                  onClick={() => onEditPhoto && onEditPhoto(ev.id)}
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background: "rgba(255,255,255,0.95)",
                    border: `1px solid ${C.gray200}`,
                    borderRadius: RADIUS.md,
                    padding: "0.4rem 0.6rem",
                    cursor: "pointer",
                    boxShadow: SHADOWS.sm,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: C.navy900,
                  }}
                >
                  <Edit size={12} />{" "}
                  {photos.length > 1 ? "Editar Álbum" : "Cambiar Foto"}
                </button>
              )}
            </div>
          ) : (
            (perms.canEditPortada || perms.canEditAgenda) && (
              <button
                onClick={() => onEditPhoto && onEditPhoto(ev.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px dashed ${C.gray300}`,
                  borderRadius: RADIUS.md,
                  backgroundColor: C.white,
                  color: C.navy600,
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "1rem",
                }}
              >
                <Camera size={16} /> Crear Álbum del Evento
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
