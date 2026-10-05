/**
 * Rutas de Storage y claves de URL.
 *
 * El `clubId` es el id del club. La URL pública es su `slug`
 * (p. ej. /aguilas-guaymas), no el id.
 */

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

/** Página pública de un partido. */
export const matchPath = (matchId: string) => `/partido/${encodeURIComponent(matchId)}`;

/** Clave `email_key` de invitaciones y administradores. Debe coincidir con la de las Functions y con las filas guardadas. */
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
  "canchas",
  "api",
  "partido",
  "partidos",
];
