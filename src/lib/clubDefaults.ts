/** Nombre de la plataforma (landing, panel de administración, manifiesto PWA). */
export const PLATFORM_NAME = "Clubs Platform";
export const PLATFORM_SHORT_NAME = "Clubs";
export const PLATFORM_DESCRIPTION =
  "Plataforma para la gestión de clubes deportivos por localidad: agenda, jugadores, finanzas, inventario y galería.";

/**
 * Valores por defecto de un club.
 *
 * Se usan como respaldo cuando un club recién creado todavía no tiene
 * descripción, ubicación, escudo o imágenes de portada. Cada club los
 * sobreescribe desde su propia página.
 */
export const DEFAULT_CLUB_NAME = "Mi Club FC";
export const DEFAULT_CLUB_SHORT_NAME = "Mi Club";
export const DEFAULT_CLUB_DESCRIPTION =
  "Club conformado por auténticos amantes del fútbol. Más que un equipo, una familia en la cancha.";
export const DEFAULT_CLUB_LOCATION = "Ciudad, País";

/** Escudo genérico. Reemplázalo subiendo un logo desde la app o cambiando `public/icon.svg`. */
export const DEFAULT_CLUB_LOGO = "/icon.svg";

/** Imagen de portada genérica (Unsplash). */
export const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
