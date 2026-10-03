import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Calendar,
  Users,
  Edit,
  Camera,
  Images,
  Award,
  Goal,
  LayoutTemplate,
  Trash2,
} from "lucide-react";
import { Badge, C, RADIUS, SHADOWS } from "../../../shared/ui";
import {
  formatFriendlyDate,
  formatFriendlyTime,
  getPlayerName,
} from "../../../shared/helpers";
import RoutineDisplay from "./RoutineDisplay";

interface HistoryCardProps {
  ev: any;
  players: any[];
  perms: any;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateScore: (id: string) => void;
  onOpenStats: (ev: any) => void;
  onOpenLineup: (ev: any) => void;
  onOpenAlbum: (eventId: string) => void;
  onImageClick: (data: any) => void;
  onOpenAttendance: (ev: any) => void;
}

export default function HistoryCard({
  ev,
  players,
  perms,
  isExpanded,
  onToggle,
  onEdit, // 👈 Y LAS RECIBIMOS AQUÍ
  onDelete,
  onUpdateScore,
  onOpenStats,
  onOpenLineup,
  onOpenAlbum,
  onImageClick,
  onOpenAttendance,
}: HistoryCardProps) {
  const hasLineup =
    ev.lineup && Object.keys(ev.lineup.positions || {}).length > 0;

  const photos =
    ev.photoUrls && ev.photoUrls.length > 0
      ? ev.photoUrls
      : ev.photoUrl
        ? [ev.photoUrl]
        : [];
  const hasPhotos = photos.length > 0;

  const attendeesCount = ev.attendees?.length || 0;
  const played = ev.scoreOurs !== undefined && ev.scoreTheirs !== undefined;
  const opponent = String(ev.title || "").replace(/^vs\s+/i, "");
  const metaIcon = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  } as const;

  return (
    <div
      id={`history-card-${ev.id}`}
      style={{
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.lg,
        backgroundColor: C.white,
        overflow: "hidden",
        boxShadow: SHADOWS.sm,
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          cursor: "pointer",
          backgroundColor: isExpanded ? C.gray50 : C.white,
          transition: "background-color 0.2s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <Badge color="green">Amistoso</Badge>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            {perms.canEditAgenda && (
              <div
                style={{ display: "flex", gap: "0.15rem" }}
                onClick={(e) => e.stopPropagation()}
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
            {isExpanded ? (
              <ChevronUp size={18} color={C.gray400} />
            ) : (
              <ChevronDown size={18} color={C.gray400} />
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: C.navy900,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}
            >
              vs {opponent}
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.85rem",
                fontSize: "0.75rem",
                color: C.gray500,
                flexWrap: "wrap",
                marginTop: "0.35rem",
              }}
            >
              <span style={metaIcon}>
                <Calendar size={12} /> {formatFriendlyDate(ev.eventDate)}
              </span>
              <span style={metaIcon}>
                <Clock size={12} /> {formatFriendlyTime(ev.eventTime)}
              </span>
            </div>
            {ev.location && (
              <div
                style={{
                  ...metaIcon,
                  fontSize: "0.75rem",
                  color: C.gray500,
                  marginTop: "0.3rem",
                }}
              >
                <MapPin size={12} /> {ev.location}
              </div>
            )}
          </div>
          {played && (
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 900,
                color:
                  ev.scoreOurs > ev.scoreTheirs
                    ? C.green
                    : ev.scoreOurs < ev.scoreTheirs
                      ? C.red
                      : C.gray600,
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
            >
              {ev.scoreOurs} - {ev.scoreTheirs}
            </div>
          )}
        </div>

        <div
          onClick={(e) => {
            if (!perms.canEditAgenda) return;
            e.stopPropagation();
            onOpenAttendance(ev);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: attendeesCount > 0 ? C.green : C.gray400,
            alignSelf: "flex-start",
            cursor: perms.canEditAgenda ? "pointer" : "default",
          }}
        >
          <Users size={13} /> {attendeesCount}{" "}
          {attendeesCount === 1 ? "asistente" : "asistentes"}
          {perms.canEditAgenda && <Edit size={11} color={C.navy600} />}
        </div>
      </div>

      {/* ── CONTENIDO EXPANDIDO ── */}
      {isExpanded && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: `1px solid ${C.gray200}`,
            backgroundColor: C.gray50,
            fontSize: "0.875rem",
            color: C.gray600,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {/* MARCADOR FINAL */}
          {ev.eventType === "Partido" && (
            <div
              style={{
                marginBottom: "1.25rem",
                padding: "1.25rem",
                backgroundColor: C.navy900,
                borderRadius: RADIUS.md,
                color: C.white,
                textAlign: "center",
                boxShadow: SHADOWS.md,
              }}
            >
              <p
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: C.navy300,
                  fontWeight: "600",
                }}
              >
                Marcador Final
              </p>

              {/* NÚMEROS PRINCIPALES */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1.5rem",
                  fontSize: "2.5rem",
                  fontWeight: "800",
                  fontFamily: "'Inter', monospace",
                }}
              >
                {/* NOSOTROS */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      // 👇 SE PINTA VERDE SI GANAMOS EN TIEMPO REGULAR O EN PENALES 👇
                      color:
                        ev.scoreOurs > ev.scoreTheirs ||
                        (ev.scoreOurs === ev.scoreTheirs &&
                          ev.penaltiesOurs > ev.penaltiesTheirs)
                          ? "#34d399"
                          : C.white,
                    }}
                  >
                    {ev.scoreOurs ?? "-"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: C.navy300,
                      letterSpacing: "0.05em",
                      fontWeight: "600",
                    }}
                  >
                    NOSOTROS
                  </span>
                </div>

                <span style={{ fontSize: "1rem", color: C.navy400 }}>VS</span>

                {/* RIVAL */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      // 👇 SE PINTA ROJO SI PERDIMOS EN TIEMPO REGULAR O EN PENALES 👇
                      color:
                        ev.scoreTheirs > ev.scoreOurs ||
                        (ev.scoreOurs === ev.scoreTheirs &&
                          ev.penaltiesTheirs > ev.penaltiesOurs)
                          ? "#f87171"
                          : C.white,
                    }}
                  >
                    {ev.scoreTheirs ?? "-"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: C.navy300,
                      letterSpacing: "0.05em",
                      fontWeight: "600",
                    }}
                  >
                    RIVAL
                  </span>
                </div>
              </div>

              {/* 👇 RESULTADO DE LA TANDA DE PENALES 👇 */}
              {ev.penaltiesOurs != null && ev.penaltiesTheirs != null && (
                <div
                  style={{
                    marginTop: "1rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    border: `1px solid rgba(245, 158, 11, 0.3)`,
                    padding: "0.3rem 0.8rem",
                    borderRadius: RADIUS.full,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: C.amber,
                      fontWeight: "800",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PENALES:
                  </span>
                  <span
                    style={{
                      fontSize: "1rem",
                      color: C.white,
                      fontWeight: "900",
                      fontFamily: "'Inter', monospace",
                    }}
                  >
                    {ev.penaltiesOurs} - {ev.penaltiesTheirs}
                  </span>
                </div>
              )}

              {/* ESTADÍSTICAS DEL PARTIDO (MVP, Goles, Asistencias, Tarjetas) */}
              {(ev.mvp ||
                (ev.stats && ev.stats.some((s: any) => s.scorer || s.assist)) ||
                (ev.yellowCards && ev.yellowCards.length > 0) ||
                (ev.redCards && ev.redCards.length > 0)) && (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: RADIUS.md,
                    padding: "0.75rem",
                    marginTop: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    textAlign: "left",
                  }}
                >
                  {ev.mvp && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Award size={14} color={C.amber} />
                      <span style={{ color: C.white, fontSize: "0.8125rem" }}>
                        <strong>MVP:</strong> {getPlayerName(ev.mvp, players)}
                      </span>
                    </div>
                  )}

                  {ev.stats &&
                    ev.stats.length > 0 &&
                    (() => {
                      const goalsByPlayer: { [key: string]: number } = {};
                      ev.stats.forEach((stat: any) => {
                        if (stat.scorer)
                          goalsByPlayer[stat.scorer] =
                            (goalsByPlayer[stat.scorer] || 0) + 1;
                      });
                      const scorerEntries = Object.entries(goalsByPlayer);
                      if (scorerEntries.length === 0) return null;
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.4rem",
                          }}
                        >
                          <Goal
                            size={14}
                            color={C.amber}
                            style={{ flexShrink: 0, marginTop: "2px" }}
                          />
                          <span
                            style={{ color: C.white, fontSize: "0.8125rem" }}
                          >
                            <strong>Goles:</strong>{" "}
                            {scorerEntries.map(([id, count], index) => {
                              const name = getPlayerName(id, players);
                              const parts = name.split(" ");
                              let shortName = parts[0];
                              if (parts.length > 1)
                                shortName += " " + parts[1].charAt(0) + ".";
                              return (
                                <span key={id}>
                                  {index > 0 && ", "} {shortName}{" "}
                                  {count > 1 ? `(${count})` : ""}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      );
                    })()}

                  {/* BLOQUE DE ASISTENCIAS */}
                  {ev.stats &&
                    ev.stats.length > 0 &&
                    (() => {
                      const assistsByPlayer: { [key: string]: number } = {};
                      ev.stats.forEach((stat: any) => {
                        if (stat.assist)
                          assistsByPlayer[stat.assist] =
                            (assistsByPlayer[stat.assist] || 0) + 1;
                      });
                      const assistEntries = Object.entries(assistsByPlayer);
                      if (assistEntries.length === 0) return null;
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.4rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              marginTop: "2px",
                              flexShrink: 0,
                            }}
                          >
                            👟
                          </span>
                          <span
                            style={{ color: C.white, fontSize: "0.8125rem" }}
                          >
                            <strong>Asistencias:</strong>{" "}
                            {assistEntries.map(([id, count], index) => {
                              const name = getPlayerName(id, players);
                              const parts = name.split(" ");
                              let shortName = parts[0];
                              if (parts.length > 1)
                                shortName += " " + parts[1].charAt(0) + ".";
                              return (
                                <span key={id}>
                                  {index > 0 && ", "} {shortName}{" "}
                                  {count > 1 ? `(${count})` : ""}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      );
                    })()}

                  {ev.yellowCards && ev.yellowCards.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.4rem",
                      }}
                    >
                      <span style={{ fontSize: "12px", marginTop: "2px" }}>
                        🟨
                      </span>
                      <span style={{ color: C.navy100, fontSize: "0.8125rem" }}>
                        <strong>Amarillas:</strong>{" "}
                        {ev.yellowCards
                          .map((yc: string) => getPlayerName(yc, players))
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {ev.redCards && ev.redCards.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.4rem",
                      }}
                    >
                      <span style={{ fontSize: "12px", marginTop: "2px" }}>
                        🟥
                      </span>
                      <span style={{ color: C.navy100, fontSize: "0.8125rem" }}>
                        <strong>Rojas:</strong>{" "}
                        {ev.redCards
                          .map((rc: string) => getPlayerName(rc, players))
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BOTONES DE ACCIÓN PARA EL PARTIDO */}
          {ev.eventType === "Partido" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "1rem",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
              }}
            >
              {perms.canEditAgenda && (
                <button
                  onClick={() => onUpdateScore(ev.id)}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.gray300}`,
                    borderRadius: RADIUS.md,
                    color: C.navy600,
                    cursor: "pointer",
                    padding: "0.6rem 0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    boxShadow: SHADOWS.sm,
                    flex: "1 1 140px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  {ev.scoreOurs !== undefined
                    ? "Editar Marcador"
                    : "Registrar Marcador"}
                </button>
              )}
              {perms.canEditAgenda &&
                ev.scoreOurs !== undefined &&
                ev.scoreTheirs !== undefined && (
                  <button
                    onClick={() => onOpenStats(ev)}
                    style={{
                      background: C.blueAccent,
                      border: "none",
                      borderRadius: RADIUS.md,
                      color: C.navy900,
                      cursor: "pointer",
                      padding: "0.6rem 0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      boxShadow: SHADOWS.sm,
                      flex: "1 1 140px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    Editar Estadísticas
                  </button>
                )}
              {(perms.canEditAgenda || hasLineup) && (
                <button
                  onClick={() => onOpenLineup(ev)}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.gray300}`,
                    borderRadius: RADIUS.md,
                    color: C.navy600,
                    cursor: "pointer",
                    padding: "0.6rem 0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    boxShadow: SHADOWS.sm,
                    flex: "1 1 140px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.3rem",
                    textAlign: "center",
                  }}
                >
                  <LayoutTemplate size={14} /> Alineación
                </button>
              )}
            </div>
          )}

          {/* ─── RENDER DE LA RUTINA EN EL HISTORIAL ─── */}
          {ev.eventType === "Entrenamiento" && ev.routine && (
            <RoutineDisplay routine={ev.routine} />
          )}

          {/* INFO DE LUGAR Y HORA Y ASISTENCIA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "1rem",
              marginTop: ev.eventType === "Entrenamiento" ? "1rem" : "0",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <MapPin size={14} /> <strong>Lugar:</strong>{" "}
              {ev.location || "No especificado"}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Clock size={14} /> <strong>Hora:</strong>{" "}
              {formatFriendlyTime(ev.eventTime)}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <Users size={14} style={{ marginTop: "3px", flexShrink: 0 }} />
                <span>
                  <strong>Asistentes:</strong>{" "}
                  {ev.attendees?.length > 0
                    ? ev.attendees
                        .map((id: string) => getPlayerName(id, players))
                        .join(", ")
                    : "Ninguno"}
                </span>
              </div>

              {/* 👇 BOTÓN PARA EDITAR ASISTENCIA EN EL HISTORIAL 👇 */}
              {perms.canEditAgenda && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAttendance(ev);
                  }}
                  style={{
                    alignSelf: "flex-start",
                    background: C.white,
                    border: `1px solid ${C.gray300}`,
                    borderRadius: RADIUS.md,
                    color: C.navy600,
                    cursor: "pointer",
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    boxShadow: SHADOWS.sm,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    marginLeft: "1.3rem",
                    marginTop: "0.2rem",
                  }}
                >
                  <Edit size={12} /> Asistencia
                </button>
              )}
            </div>
          </div>

          {/* FOTO DEL EVENTO */}
          {hasPhotos ? (
            <div style={{ marginTop: "1rem", position: "relative" }}>
              <img
                src={photos[0]}
                alt={`Foto de ${ev.title}`}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: RADIUS.md,
                  cursor: "pointer",
                  boxShadow: SHADOWS.sm,
                }}
                onClick={() =>
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
                  onClick={() => onOpenAlbum(ev.id)}
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
          ) : perms.canEditPortada || perms.canEditAgenda ? (
            <button
              onClick={() => onOpenAlbum(ev.id)}
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
                marginTop: "0.5rem",
              }}
            >
              <Camera size={16} /> Crear Álbum del Evento
            </button>
          ) : (
            <p
              style={{
                textAlign: "center",
                color: C.gray400,
                fontStyle: "italic",
                margin: 0,
                marginTop: "1rem",
              }}
            >
              Sin foto del evento
            </p>
          )}
        </div>
      )}
    </div>
  );
}
