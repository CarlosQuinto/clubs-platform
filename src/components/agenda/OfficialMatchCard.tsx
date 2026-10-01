import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  ClipboardList,
  Goal,
  ExternalLink,
  Edit,
  Trash2,
  Camera,
  Images,
} from "lucide-react";
import { Badge, C, RADIUS, SHADOWS, SecondaryButton } from "../ui";
import ConfirmModal from "../ConfirmModal";
import { formatFriendlyDate, formatFriendlyTime } from "../../utils/helpers";
import RoutineDisplay from "./RoutineDisplay";

interface Props {
  ev: any;
  players: any[];
  perms: any;
  onOpenAttendance: () => void;
  onOpenLineup: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onImageClick?: (data: any) => void;
  onEditPhoto?: (id: string) => void;
  isHighlighted?: boolean;
  isPast?: boolean;
}

/**
 * Tarjeta de partido (oficial de torneo o amistoso del club).
 * El layout de rival / fecha / hora / sede es el mismo; lo oficial
 * añade liga, jornada y local/visitante.
 */
export default function OfficialMatchCard({
  ev,
  players,
  perms,
  onOpenAttendance,
  onOpenLineup,
  onEdit,
  onDelete,
  onImageClick,
  onEditPhoto,
  isHighlighted,
  isPast = false,
}: Props) {
  const isOfficial = !!ev.isOfficial;
  const isTraining = !isOfficial && ev.eventType === "Entrenamiento";
  const isMatch = isOfficial || !isTraining;
  const played = ev.scoreOurs !== undefined && ev.scoreTheirs !== undefined;
  const result = played
    ? ev.scoreOurs > ev.scoreTheirs
      ? "win"
      : ev.scoreOurs < ev.scoreTheirs
        ? "loss"
        : "draw"
    : null;
  const resultColor =
    result === "win" ? C.green : result === "loss" ? C.red : C.gray600;
  const nameOf = (id: string) =>
    players.find((p: any) => p.id === id || p.name === id)?.name ||
    (id?.startsWith("guest-") ? id.replace("guest-", "") : id);

  const scorers = (ev.stats || [])
    .filter((s: any) => s.scorer)
    .map((s: any) => nameOf(s.scorer));

  const attendeesCount = (ev.attendees || []).length;
  const hasLineup =
    ev.lineup && Object.keys(ev.lineup.positions || {}).length > 0;
  const opponent = String(ev.title || "").replace(/^vs\s+/i, "");
  const canEdit = !!perms?.canEditAgenda;
  const showAttendanceButton = !isPast && (!isOfficial || canEdit);
  const showLineup = !isPast && isMatch && (canEdit || (!isOfficial && hasLineup));

  const navigate = useNavigate();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const photos =
    ev.photoUrls && ev.photoUrls.length > 0
      ? ev.photoUrls
      : ev.photoUrl
        ? [ev.photoUrl]
        : [];
  const hasPhotos = photos.length > 0;

  const metaIcon = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  } as const;

  return (
    <div
      id={isOfficial ? `history-card-${ev.id}` : `event-card-${ev.id}`}
      className={isHighlighted ? "highlighted-event" : ""}
      style={{
        border: isHighlighted
          ? `2px solid ${C.amber}`
          : `1px solid ${C.gray200}`,
        borderRadius: RADIUS.lg,
        backgroundColor: C.white,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: isPast ? "0.4rem" : "0.55rem",
        boxShadow: SHADOWS.sm,
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
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {isOfficial ? (
              <Badge color="amber">Oficial</Badge>
            ) : isTraining ? (
              <Badge color="blue">Entrenamiento</Badge>
            ) : (
              <Badge color="green">Amistoso</Badge>
            )}
          </div>
        </div>
        {!isOfficial && canEdit && (
          <div
            style={{
              display: "flex",
              gap: "0.15rem",
              flexShrink: 0,
            }}
          >
            {onEdit && (
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
                aria-label="Editar evento"
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
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
                aria-label="Eliminar evento"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
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
            {isMatch ? `vs ${opponent}` : opponent}
          </div>
          {isOfficial && (
            <div
              style={{
                fontSize: "0.72rem",
                color: C.gray500,
                fontWeight: 600,
                marginTop: "0.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.12rem",
              }}
            >
              {ev.tournamentName && (
                <button
                  type="button"
                  onClick={() => setLeaveOpen(true)}
                  style={{
                    color: C.navy900,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    width: "fit-content",
                    padding: 0,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    font: "inherit",
                    fontWeight: 700,
                  }}
                >
                  {ev.tournamentName} <ExternalLink size={10} />
                </button>
              )}
              <span>
                {[
                  ev.round ? `Jornada ${ev.round}` : null,
                  ev.isHome ? "Local" : "Visitante",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )}
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
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 900,
                color: resultColor,
                letterSpacing: "-0.02em",
              }}
            >
              {ev.scoreOurs} - {ev.scoreTheirs}
            </div>
            {ev.penaltiesOurs != null && ev.penaltiesTheirs != null && (
              <div style={{ fontSize: "0.7rem", color: C.gray500 }}>
                Penales {ev.penaltiesOurs}-{ev.penaltiesTheirs}
              </div>
            )}
          </div>
        )}
      </div>

      {isPast && (
        <div
          onClick={canEdit ? onOpenAttendance : undefined}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: attendeesCount > 0 ? C.green : C.gray400,
            cursor: canEdit ? "pointer" : "default",
            alignSelf: "flex-start",
          }}
        >
          <Users size={13} /> {attendeesCount}{" "}
          {attendeesCount === 1 ? "asistente" : "asistentes"}
          {canEdit && <Edit size={11} color={C.navy600} />}
        </div>
      )}

      {isTraining && ev.routine && (
        <RoutineDisplay routine={ev.routine} compact />
      )}

      {!isPast && scorers.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            color: C.gray600,
            flexWrap: "wrap",
          }}
        >
          <Goal size={13} color={C.green} />
          {scorers.join(", ")}
        </div>
      )}

      {(showAttendanceButton || showLineup) && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {showAttendanceButton && (
            <SecondaryButton
              onClick={onOpenAttendance}
              style={{
                padding: "0.4rem 0.7rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.75rem",
              }}
            >
              <Users size={13} /> Asistencia ({attendeesCount})
            </SecondaryButton>
          )}
          {showLineup && (
            <SecondaryButton
              onClick={onOpenLineup}
              style={{
                padding: "0.4rem 0.7rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.75rem",
              }}
            >
              <ClipboardList size={13} /> Alineación
            </SecondaryButton>
          )}
        </div>
      )}

      {!isPast &&
        !isOfficial &&
        (hasPhotos ? (
          <div style={{ position: "relative" }}>
            <img
              src={photos[0]}
              alt={`Foto de ${opponent}`}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                maxHeight: "220px",
                objectFit: "cover",
                borderRadius: RADIUS.md,
                cursor: onImageClick ? "pointer" : "default",
                boxShadow: SHADOWS.sm,
              }}
              onClick={() =>
                onImageClick &&
                onImageClick({
                  urls: photos,
                  initialIndex: 0,
                  caption: `${opponent} - ${formatFriendlyDate(ev.eventDate)}`,
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
                  color: C.white,
                  padding: "0.3rem 0.6rem",
                  borderRadius: RADIUS.full,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  pointerEvents: "none",
                }}
              >
                <Images size={14} /> 1 / {photos.length}
              </div>
            )}
            {(perms?.canEditPortada || canEdit) && onEditPhoto && (
              <button
                onClick={() => onEditPhoto(ev.id)}
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
                  fontWeight: 600,
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
          (perms?.canEditPortada || canEdit) &&
          onEditPhoto && (
            <button
              onClick={() => onEditPhoto(ev.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.65rem",
                border: `1px dashed ${C.gray300}`,
                borderRadius: RADIUS.md,
                backgroundColor: C.white,
                color: C.navy600,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              <Camera size={16} /> Crear Álbum del Evento
            </button>
          )
        ))}
      {createPortal(
        <ConfirmModal
          open={leaveOpen}
          title="Salir del club"
          message={`Estás por salir de la página del club para ir a la página del torneo ${ev.tournamentName}. ¿Deseas continuar?`}
          confirmLabel="Continuar"
          cancelLabel="Cancelar"
          onConfirm={() => {
            setLeaveOpen(false);
            navigate(`/torneos/${ev.tournamentId}`);
          }}
          onCancel={() => setLeaveOpen(false)}
        />,
        document.body,
      )}
    </div>
  );
}
