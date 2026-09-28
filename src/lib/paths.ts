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
export const userDocRef = (uid: string) => doc(db, "users", uid);

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

export const RESERVED_SLUGS = ["admin", "login", "registro", "clubes", "api"];
