import { useCallback, useEffect, useState } from "react";
import { sessionUserId } from "../../infrastructure/auth";
import {
  dataConnect,
  type MemberRole,
  myMemberships,
  mySpaces,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { ROLE_LABELS, type Role } from "./roles";

/** Un espacio del selector: el panel de la plataforma o un club con rol. */
export type Space = {
  kind: "admin" | "club";
  path: string;
  title: string;
  subtitle: string;
  logoUrl?: string;
  slug?: string;
  role?: Role;
};

export const ROLE_FROM_SQL: Record<MemberRole, Role> = {
  ADMIN: "admin",
  DT: "dt",
  PRENSA: "prensa",
  TESORERO: "tesorero",
};

export const ADMIN_SPACE: Space = {
  kind: "admin",
  path: "/admin",
  title: "Panel de administración",
  subtitle: "Clubes, competición y portada",
};

/** Admin primero y luego los clubes por nombre. */
export function sortSpaces(spaces: Space[]) {
  return [...spaces].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "admin" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

type MemberRow = {
  role: MemberRole;
  club: { id: string; slug: string; name: string; logoUrl?: string | null };
};

/**
 * Filas de club_members de la sesión. Si `mySpaces` falla (p. ej. base desactualizada),
 * recurre a `myMemberships`, que también filtra por la sesión en el servidor.
 */
async function myMemberRows(): Promise<MemberRow[]> {
  const fresh = { fetchPolicy: QueryFetchPolicy.SERVER_ONLY };
  try {
    const result = await mySpaces(dataConnect, fresh);
    return result.data.clubMembers;
  } catch (err) {
    console.warn("MySpaces falló; se usa MyMemberships:", err);
    const result = await myMemberships(dataConnect, { userId: sessionUserId() }, fresh);
    return result.data.clubMembers;
  }
}

/** Clubes donde la sesión tiene rol. Solo lectura. */
export async function listMyClubSpaces(): Promise<Space[]> {
  const rows = await myMemberRows();
  return sortSpaces(
    rows.map((member) => {
      const role = ROLE_FROM_SQL[member.role];
      const slug = member.club.slug || member.club.id;
      return {
        kind: "club" as const,
        path: `/${slug}`,
        title: member.club.name,
        subtitle: ROLE_LABELS[role] || "Administración",
        logoUrl: member.club.logoUrl || undefined,
        slug,
        role,
      };
    }),
  );
}

type Cache = { uid: string; clubs: Space[] };

let cached: Cache | null = null;
let pending: { uid: string; promise: Promise<Space[]> } | null = null;
const listeners = new Set<(next: Cache) => void>();

function publish(next: Cache) {
  cached = next;
  listeners.forEach((listener) => listener(next));
}

function loadClubs(uid: string): Promise<Space[]> {
  if (pending?.uid === uid) return pending.promise;
  const promise = listMyClubSpaces()
    .then((clubs) => {
      // Una siembra o una consulta más nueva ya la reemplazó: no publicar datos viejos.
      if (pending?.promise !== promise) return cached?.uid === uid ? cached.clubs : clubs;
      pending = null;
      publish({ uid, clubs });
      return clubs;
    })
    .catch((err: unknown) => {
      if (pending?.promise === promise) pending = null;
      throw err;
    });
  pending = { uid, promise };
  return promise;
}

/** Guarda una lista ya consultada (p. ej. tras aceptar invitaciones al entrar). */
export function seedMySpaces(uid: string, clubs: Space[]) {
  pending = null;
  publish({ uid, clubs: clubs.filter((space) => space.kind === "club") });
}

/** Vuelve a consultar si hay una lista en memoria; los cambios llegan a los selectores montados. */
export function invalidateMySpaces() {
  if (!cached) return;
  pending = null;
  void loadClubs(cached.uid).catch((err: unknown) => {
    console.error("No se pudieron recargar tus clubes:", err);
  });
}

/** Clubes de la sesión con caché compartida entre cabeceras. `refresh` vuelve a consultar mostrando lo último conocido. */
export function useMyClubSpaces(uid: string | null) {
  const initial = uid && cached?.uid === uid ? cached.clubs : null;
  const [clubs, setClubs] = useState<Space[] | null>(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uid) {
      cached = null;
      pending = null;
      setClubs(null);
      setFailed(false);
      return;
    }
    let alive = true;
    setClubs(cached?.uid === uid ? cached.clubs : null);
    const listener = (next: Cache) => {
      if (!alive || next.uid !== uid) return;
      setClubs(next.clubs);
      setFailed(false);
    };
    listeners.add(listener);
    if (cached?.uid !== uid) {
      loadClubs(uid).catch((err: unknown) => {
        console.error("No se pudieron cargar tus clubes:", err);
        if (alive) setFailed(true);
      });
    }
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, [uid]);

  const refresh = useCallback(() => {
    if (!uid) return;
    setFailed(false);
    loadClubs(uid).catch((err: unknown) => {
      console.error("No se pudieron cargar tus clubes:", err);
      setFailed(true);
    });
  }, [uid]);

  return { clubs, failed, refresh };
}
