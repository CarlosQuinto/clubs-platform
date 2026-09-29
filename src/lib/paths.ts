import { collection, doc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Rutas de Firestore y Storage con alcance por club.
 *
 * Estructura:
 *   clubs/{clubId}                         → información pública del club
 *   clubs/{clubId}/members/{uid}           → rol de cada usuario en el club
 *   clubs/{clubId}/invites/{emailKey}      → invitaciones pendientes por email
 *   clubs/{clubId}/{players|events|...}    → datos del club
 *   localities/{id}                        → catálogo de localidades
 *   platform/config                        → super administradores
 *   users/{uid}                            → perfil básico del usuario
 *
 * El `clubId` es el slug de la URL en minúsculas (p. ej. /JogaBonitoFC → "jogabonitofc").
 */

export type ClubCollection =
  | "players"
  | "events"
  | "transactions"
  | "inventory"
  | "gallery"
  | "goals"
  | "members"
  | "invites";

export const clubsCol = () => collection(db, "clubs");
export const clubDocRef = (clubId: string) => doc(db, "clubs", clubId);
export const clubCol = (clubId: string, name: ClubCollection) =>
  collection(db, "clubs", clubId, name);
export const clubItemRef = (clubId: string, name: ClubCollection, id: string) =>
  doc(db, "clubs", clubId, name, id);

export const localitiesCol = () => collection(db, "localities");
export const platformConfigRef = () => doc(db, "platform", "config");
export const platformInvitesCol = () =>
  collection(db, "platform", "config", "invites");
export const platformInviteRef = (inviteKey: string) =>
  doc(db, "platform", "config", "invites", inviteKey);
export const userDocRef = (uid: string) => doc(db, "users", uid);

// ── Competición (gestionada por el super administrador) ──
//   categories/{id}   → divisiones (Primera, Segunda, ...)
//   seasons/{id}      → temporadas
//   tournaments/{id}  → torneos (seasonId + categoryId + clubIds; la categoría es del torneo)
//   matches/{id}      → partidos oficiales (tournamentId, home/away, sides por club)
export const categoriesCol = () => collection(db, "categories");
export const categoryRef = (id: string) => doc(db, "categories", id);
export const seasonsCol = () => collection(db, "seasons");
export const seasonRef = (id: string) => doc(db, "seasons", id);
export const tournamentsCol = () => collection(db, "tournaments");
export const tournamentRef = (id: string) => doc(db, "tournaments", id);
export const matchesCol = () => collection(db, "matches");
export const matchRef = (id: string) => doc(db, "matches", id);
export const inquiriesCol = () => collection(db, "inquiries");
export const inquiryRef = (id: string) => doc(db, "inquiries", id);
export const teamApplicationsCol = () => collection(db, "teamApplications");
export const teamApplicationRef = (id: string) =>
  doc(db, "teamApplications", id);

/** Ruta de Storage para recursos de la plataforma (carrusel de la landing). */
export const platformStoragePath = (folder: string, filename: string) =>
  `platform/${folder}/${filename}`;

/** Ruta de Storage aislada por club: clubs/{clubId}/{folder}/{filename} */
export const clubStoragePath = (
  clubId: string,
  folder: string,
  filename: string,
) => `clubs/${clubId}/${folder}/${filename}`;

/** Convierte "Joga Bonito FC" o "JogaBonitoFC" en un id válido de URL. */
export const normalizeSlug = (input: string) =>
  input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Clave de documento para invitaciones por email (Firestore no admite "/" ni "." con seguridad). */
export const emailKey = (email: string) =>
  email.trim().toLowerCase().replace(/\./g, ",");

export const RESERVED_SLUGS = [
  "admin",
  "login",
  "registro",
  "invitar",
  "registrar-equipo",
  "contacto",
  "solicitudes",
  "clubes",
  "equipos",
  "torneos",
  "temporadas",
  "categorias",
  "api",
];
