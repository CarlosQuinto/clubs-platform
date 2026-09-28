import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Trophy,
  Star,
  Goal,
  Shield,
  TrendingUp,
  Hand,
  Target,
} from "lucide-react";
import { C, RADIUS, SHADOWS } from "../../components/ui";
import { calculateAge } from "../../utils/helpers";
import TrophyCase, { Achievement } from "./TrophyCase";

interface PlayerModalProps {
  player: any;
  pStats: any;
  achievements: Achievement[];
  onClose: () => void;
}

export default function PlayerModal({
  player,
  pStats,
  achievements,
  onClose,
}: PlayerModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!player || !pStats) return null;

  const isDT = Boolean(player.isDT);
  const isGoalkeeper = player.position?.trim().toLowerCase() === "portero";
  const isActive = player.active !== false;

  const {
    goals = 0,
    assists = 0,
    matchesAttended = 0,
    trainingsAttended = 0,
    cleanSheets = 0,
    goalsConceded = 0,
    saves = 0,
    mvps = 0,
    yellowCards = 0,
    redCards = 0,
    matchesManaged = 0,
    winsManaged = 0,
  } = pStats || {};

  const positionColor =
    player.position === "Portero"
      ? C.amber
      : player.position === "Defensa"
        ? "#3b82f6"
        : player.position === "Medio"
          ? C.green
          : player.position === "Delantero"
            ? C.red || "#ef4444"
            : C.gray500;

  const PremiumStatBox = ({
    icon,
    label,
    value,
    valueColor = C.navy900,
  }: any) => (
    <div
      style={{
        backgroundColor: C.gray50,
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.lg,
        padding: "0.875rem 0.25rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ color: C.gray500, marginBottom: "0.4rem" }}>{icon}</div>
      <span
        style={{
          fontSize: "1.35rem",
          fontWeight: "900",
          color: isActive ? valueColor : C.gray500,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "0.55rem",
          fontWeight: "800",
          color: C.gray500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginTop: "0.3rem",
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-player-name"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.90)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start", // 👈 Corrección clave: Permite alinear desde arriba y scrollear el fondo
        overflowY: "auto", // 👈 El scroll general vive aquí para evitar cortes en la parte superior
        padding: "2rem 1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "420px",
          width: "100%",
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          display: "flex",
          flexDirection: "column",
          boxShadow: SHADOWS.xl,
          margin: "auto", // Centra de forma inteligente si hay espacio, o fluye hacia abajo si es más alto
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── CABECERA PREMIUM (BANNER OSCURO) ── */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.navy900} 0%, #0f172a 100%)`,
            height: "100px",
            width: "100%",
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            position: "relative",
          }}
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              color: C.white,
              cursor: "pointer",
              padding: "0.4rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── INFO DEL JUGADOR (AVATAR MONTADO) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 1.5rem",
            marginTop: "-55px",
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={
                player.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=102a43&color=fff&size=200&bold=true`
              }
              alt={player.name}
              loading="lazy"
              decoding="async"
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                objectFit: "cover",
                border: `4px solid ${C.white}`,
                boxShadow: SHADOWS.md,
                backgroundColor: C.white,
                filter: isActive ? "none" : "grayscale(100%)",
              }}
            />
            {isActive && !isDT && (
              <div
                style={{
                  position: "absolute",
                  inset: "-2px",
                  borderRadius: "50%",
                  border: `2px solid ${positionColor}`,
                  zIndex: -1,
                }}
              />
            )}
            {isDT && (
              <span
                title="Director Técnico"
                style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "0px",
                  width: "28px",
                  height: "28px",
                  backgroundColor: C.amber,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  border: "2px solid white",
                  boxShadow: SHADOWS.sm,
                }}
              >
                📋
              </span>
            )}
          </div>

          <h2
            id="modal-player-name"
            style={{
              margin: "0.75rem 0 0.25rem 0",
              fontSize: "1.5rem",
              fontWeight: "900",
              color: isActive ? C.navy900 : C.gray500,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            {player.name}
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.25rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {!isActive && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  color: C.red,
                  backgroundColor: "rgba(239,68,68,0.1)",
                  padding: "2px 8px",
                  borderRadius: RADIUS.full,
                }}
              >
                BAJA
              </span>
            )}

            {!isDT && (
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "900",
                  color: C.navy900,
                }}
              >
                #{player.number}
              </span>
            )}
            {!isDT && <span style={{ color: C.gray300 }}>•</span>}

            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: isDT ? C.amber : positionColor,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {isDT ? "Cuerpo Técnico" : player.position}{" "}
              {player.variant && `- ${player.variant}`}
            </span>

            {player.birthDate && (
              <>
                <span style={{ color: C.gray300 }}>•</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: C.gray500,
                  }}
                >
                  {calculateAge(player.birthDate)} años
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── RENDIMIENTO HISTÓRICO ── */}
        <div style={{ padding: "1.5rem", width: "100%" }}>
          <p
            style={{
              margin: "0 0 1rem 0",
              textAlign: "center",
              fontWeight: "800",
              color: C.gray400,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "0.6875rem",
            }}
          >
            Rendimiento Histórico
          </p>

          {isDT ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <PremiumStatBox
                icon={<span style={{ fontSize: "18px" }}>📋</span>}
                label="Partidos Dirigidos"
                value={matchesManaged}
              />
              <PremiumStatBox
                icon={<span style={{ fontSize: "18px" }}>🏆</span>}
                label="Victorias"
                value={winsManaged}
                valueColor={C.amber}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  // 👇 4 columnas para porteros, 3 para jugadores de campo 👇
                  gridTemplateColumns: isGoalkeeper
                    ? "repeat(4, 1fr)"
                    : "repeat(3, 1fr)",
                  gap: "0.75rem",
                }}
              >
                <PremiumStatBox
                  icon={<Trophy size={18} />}
                  label="Partidos"
                  value={matchesAttended}
                />
                {isGoalkeeper ? (
                  <>
                    <PremiumStatBox
                      icon={<Goal size={18} />}
                      label="Goles Recib."
                      value={goalsConceded}
                    />
                    {/* 👇 NUEVA CAJA DE ATAJADAS 👇 */}
                    <PremiumStatBox
                      icon={<Hand size={18} color="#3b82f6" />}
                      label="Atajadas"
                      value={saves}
                      valueColor="#3b82f6" // Azul brillante para destacar
                    />
                    <PremiumStatBox
                      icon={<Shield size={18} />}
                      label="Arcos Cero"
                      value={cleanSheets}
                    />
                  </>
                ) : (
                  <>
                    <PremiumStatBox
                      icon={<Goal size={18} />}
                      label="Goles"
                      value={goals}
                    />
                    <PremiumStatBox
                      icon={<TrendingUp size={18} />}
                      label="Asistencias"
                      value={assists}
                    />
                  </>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "0.5rem",
                }}
              >
                <PremiumStatBox
                  icon={<Target size={16} />}
                  label="Prácticas"
                  value={trainingsAttended}
                />
                <PremiumStatBox
                  icon={<Star size={16} fill={C.amber} color={C.amber} />}
                  label="MVPs"
                  value={mvps}
                  valueColor={C.amber}
                />
                <PremiumStatBox
                  icon={<span style={{ fontSize: "14px" }}>🟨</span>}
                  label="Amarillas"
                  value={yellowCards}
                />
                <PremiumStatBox
                  icon={<span style={{ fontSize: "14px" }}>🟥</span>}
                  label="Rojas"
                  value={redCards}
                  valueColor={C.red}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── VITRINA DE TROFEOS ── */}
        {!isDT && (
          <div style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>
            <TrophyCase achievements={achievements} />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
