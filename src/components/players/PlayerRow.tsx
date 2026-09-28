import { Edit, Trash2, LayoutTemplate } from "lucide-react";
import { C, RADIUS, Badge } from "../../components/ui";
import { isBirthdayToday } from "../../utils/helpers";

interface PlayerRowProps {
  player: any;
  canEditAll: boolean;
  isPressOnly: boolean;
  onSelect: (player: any) => void;
  onEdit: (player: any) => void;
  onDelete: (id: string) => void;
}

export default function PlayerRow({
  player,
  canEditAll,
  isPressOnly,
  onSelect,
  onEdit,
  onDelete,
}: PlayerRowProps) {
  const isBday = isBirthdayToday(player.birthDate);
  const isActive = player.active !== false;

  // Color sutil para el indicador de posición
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

  return (
    <div
      onClick={() => onSelect(player)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.875rem 1rem",
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.md,
        backgroundColor: !isActive ? C.gray50 : C.white,
        opacity: isActive ? 1 : 0.6,
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* ── FOTO SIMPLE CON BADGE PEQUEÑO ── */}
        <div style={{ position: "relative", display: "inline-flex" }}>
          <img
            src={
              player.imageUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                player.name,
              )}&background=102a43&color=fff&size=100`
            }
            alt={player.name}
            loading="lazy"
            decoding="async"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              objectFit: "cover",
              filter: isActive ? "none" : "grayscale(100%)",
            }}
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                player.name,
              )}&background=102a43&color=fff`;
            }}
          />

          {player.isDT && (
            <div
              title="Cuerpo Técnico"
              style={{
                position: "absolute",
                top: "-2px",
                right: "-4px",
                backgroundColor: C.navy900,
                borderRadius: "50%",
                padding: "2px",
                border: `2px solid ${C.white}`,
              }}
            >
              <LayoutTemplate size={10} color={C.amber} />
            </div>
          )}
        </div>

        {/* ── INFO CLARA Y ORDENADA ── */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: "700",
              fontSize: "0.95rem",
              color: isActive ? C.navy900 : C.gray500,
            }}
          >
            {player.name}{" "}
            {isBday && isActive && <span title="¡Cumpleaños!">🎂</span>}
          </p>

          <div
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              color: C.gray500,
              fontWeight: "500",
            }}
          >
            {!isActive && (
              <Badge
                color="red"
                style={{ fontSize: "0.6rem", padding: "1px 4px" }}
              >
                Baja
              </Badge>
            )}

            {player.isDT ? (
              <span style={{ color: C.navy600, fontWeight: "600" }}>
                Cuerpo Técnico
              </span>
            ) : (
              <>
                <span style={{ fontWeight: "700", color: C.navy700 }}>
                  #{player.number !== "S/N" ? player.number : "-"}
                </span>
                <span>•</span>

                {/* Indicador de posición limpio (Puntito + Texto) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: positionColor,
                    }}
                  />
                  <span>{player.position}</span>
                </div>

                {player.variant && (
                  <>
                    <span>•</span>
                    <span>{player.variant}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ACCIONES DISCRETAS ── */}
      {(canEditAll || isPressOnly) && (
        <div
          style={{ display: "flex", gap: "0.75rem" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(player)}
            aria-label={`Editar a ${player.name}`}
            title="Editar"
            style={{
              background: "none",
              border: "none",
              color: C.gray400,
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <Edit size={16} />
          </button>

          {canEditAll && (
            <button
              onClick={() => onDelete(player.id)}
              aria-label={`Eliminar a ${player.name}`}
              title="Eliminar"
              style={{
                background: "none",
                border: "none",
                color: C.gray400,
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
