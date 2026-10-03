export type Role = "admin" | "dt" | "prensa" | "tesorero";

export const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Presidente",
    description: "Acceso total al club, incluida la gestión de miembros.",
  },
  {
    value: "dt",
    label: "D. Técnico",
    description: "Agenda, jugadores e inventario.",
  },
  {
    value: "tesorero",
    label: "Tesorero",
    description: "Finanzas e inventario.",
  },
  {
    value: "prensa",
    label: "Prensa",
    description: "Portada y galería.",
  },
];

export const ROLE_LABELS: Record<Role, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
) as Record<Role, string>;

export interface Permissions {
  isAdmin: boolean;
  canEditInventory: boolean;
  canEditAgenda: boolean;
  canEditJugadores: boolean;
  canEditFinanzas: boolean;
  canEditPortada: boolean;
  canManageMembers: boolean;
  [key: string]: boolean;
}

/**
 * Matriz de permisos. Debe mantenerse en sincronía con los filtros por rol de
 * `club_members` en las mutaciones del conector, que aplican las mismas reglas en el servidor.
 */
export function buildPerms(
  role: Role | null,
  isSuperAdmin: boolean,
): Permissions {
  const admin = isSuperAdmin || role === "admin";
  return {
    isAdmin: admin,
    canEditInventory:
      admin || role === "dt" || role === "tesorero",
    canEditAgenda: admin || role === "dt",
    canEditJugadores: admin || role === "dt",
    canEditFinanzas: admin || role === "tesorero",
    canEditPortada: admin || role === "prensa",
    canManageMembers: admin,
  };
}

export const NO_PERMS = buildPerms(null, false);
