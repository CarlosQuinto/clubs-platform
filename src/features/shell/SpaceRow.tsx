import type { ReactNode } from "react";
import { Camera, Check, Crown, LayoutTemplate, Shield, Wallet } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import type { Role } from "../../domains/auth/roles";
import type { Space } from "../../domains/auth/mySpaces";
import { C, RADIUS } from "../../shared/ui";

/** Icono del rol en el club; el superadmin lleva corona. */
export function roleIcon(role: Role | null | undefined, isSuperAdmin: boolean, size: number) {
  if (isSuperAdmin) return <Crown size={size} />;
  if (role === "admin") return <Shield size={size} />;
  if (role === "dt") return <LayoutTemplate size={size} />;
  if (role === "tesorero") return <Wallet size={size} />;
  if (role === "prensa") return <Camera size={size} />;
  return null;
}

/** Avatar de un espacio: corona para el panel, escudo para un club. */
export function SpaceAvatar({
  kind,
  logoUrl,
  size = 36,
}: {
  kind: Space["kind"] | "league";
  logoUrl?: string;
  size?: number;
}) {
  if (kind === "admin") {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          background: C.navy900,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Crown size={Math.round(size * 0.45)} color={C.amber} />
      </span>
    );
  }
  if (kind === "league" && !logoUrl) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: C.navy900,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Shield size={Math.round(size * 0.45)} color={C.amber} />
      </span>
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: C.navy900,
        border: `1.5px solid ${C.amber}`,
        flexShrink: 0,
        display: "inline-block",
      }}
    >
      <img
        src={logoUrl || DEFAULT_CLUB_LOGO}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </span>
  );
}

/** Fila de un espacio: avatar, nombre y rol. Se usa en el selector de la cabecera y tras el login. */
export default function SpaceRow({
  avatar,
  title,
  subtitle,
  active = false,
  trailing,
  onClick,
}: {
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  active?: boolean;
  trailing?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={active ? "space-row is-active" : "space-row"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        width: "100%",
        textAlign: "left",
        padding: "0.7rem 0.75rem",
        borderRadius: RADIUS.lg,
        border: `1px solid ${active ? "rgba(205, 154, 64, 0.45)" : C.gray200}`,
        background: active ? "rgba(245, 158, 11, 0.12)" : C.gray50,
        cursor: "pointer",
      }}
    >
      {avatar}
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
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              display: "block",
              fontSize: "0.72rem",
              color: C.gray500,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </span>
      {active ? (
        <Check size={16} color={C.amber} strokeWidth={3} style={{ flexShrink: 0 }} />
      ) : (
        trailing
      )}
    </button>
  );
}
