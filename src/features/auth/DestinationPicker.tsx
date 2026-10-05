import { Shield } from "lucide-react";
import { useModalLock } from "../../shared/useModalLock";
import type { LoginDestination } from "../../domains/auth/destinations";
import SpaceRow, { SpaceAvatar } from "../shell/SpaceRow";
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
            <SpaceRow
              key={dest.path}
              avatar={<SpaceAvatar kind={dest.kind} logoUrl={dest.logoUrl} />}
              title={dest.title}
              subtitle={dest.subtitle}
              trailing={
                dest.kind === "club" ? (
                  <Shield size={14} color={C.gray400} style={{ flexShrink: 0 }} />
                ) : undefined
              }
              onClick={() => onPick(dest.path)}
            />
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
