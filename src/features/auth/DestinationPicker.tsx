import { Crown, Shield } from "lucide-react";
import { useModalLock } from "../../shared/useModalLock";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import type { LoginDestination } from "../../domains/auth/destinations";
import { C, RADIUS, SHADOWS } from "../../shared/ui";

export default function DestinationPicker({
  destinations,
  onPick,
  onHome,
}: {
  destinations: LoginDestination[];
  onPick: (path: string) => void;
  onHome: () => void;
}) {
  useModalLock(onHome);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dest-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        backgroundColor: "rgba(20, 18, 15, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          border: `1px solid ${C.gray200}`,
          boxShadow: SHADOWS.xl,
          padding: "1.25rem 1.2rem 1rem",
        }}
      >
        <h2
          id="dest-title"
          style={{
            margin: 0,
            fontSize: "1.1rem",
            fontWeight: 900,
            color: C.navy900,
          }}
        >
          ¿A dónde quieres ir?
        </h2>
        <p
          style={{
            margin: "0.4rem 0 0.9rem",
            fontSize: "0.82rem",
            color: C.gray500,
            lineHeight: 1.4,
          }}
        >
          Tienes acceso a más de un espacio. Elige club o el panel de la
          plataforma.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {destinations.map((dest) => (
            <button
              key={dest.path}
              type="button"
              onClick={() => onPick(dest.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                width: "100%",
                textAlign: "left",
                padding: "0.7rem 0.75rem",
                borderRadius: RADIUS.lg,
                border: `1px solid ${C.gray200}`,
                background: C.gray50,
                cursor: "pointer",
              }}
            >
              {dest.kind === "admin" ? (
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: C.navy900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Crown size={16} color={C.amber} />
                </span>
              ) : (
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: C.navy900,
                    border: `1.5px solid ${C.amber}`,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={dest.logoUrl || DEFAULT_CLUB_LOGO}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </span>
              )}
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontWeight: 800,
                    fontSize: "0.88rem",
                    color: C.navy900,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {dest.title}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    color: C.gray500,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {dest.subtitle}
                </span>
              </span>
              {dest.kind === "club" && (
                <Shield size={14} color={C.gray400} style={{ flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onHome}
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.85rem",
            background: "none",
            border: "none",
            color: C.gray500,
            fontWeight: 700,
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
