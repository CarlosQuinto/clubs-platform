/** Inventario de publicidad. El cobro vive fuera de la app. */

export const AD_PLACEMENTS = [
  { id: "home", label: "Inicio, franja al final de la portada" },
  { id: "tournament", label: "Ficha de torneo" },
  { id: "club", label: "Página del club" },
  { id: "teams", label: "Página de equipos" },
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number]["id"];

const PLACEMENT_IDS = new Set<string>(AD_PLACEMENTS.map((item) => item.id));

export const AD_STATUSES = ["PROGRAMADO", "EN_CURSO", "PAUSADO", "EXPIRADO"] as const;

export type AdStatus = (typeof AD_STATUSES)[number];

export const AD_STATUS_LABEL: Record<AdStatus, string> = {
  PROGRAMADO: "Programado",
  EN_CURSO: "En curso",
  PAUSADO: "Pausado",
  EXPIRADO: "Expirado",
};

export interface Ad {
  id: string;
  brand: string;
  imageUrl: string;
  href: string;
  placements: AdPlacement[];
  startsAt: string;
  endsAt: string;
  status: AdStatus;
  order: number;
  /** El documento guardaba una ubicación que la app ya no ofrece. */
  hasLegacyPlacement: boolean;
}

/** Ubicaciones conocidas, sin duplicados, en el orden del inventario. */
export function canonicalPlacements(ids: readonly AdPlacement[]): AdPlacement[] {
  const selected = new Set(ids);
  return AD_PLACEMENTS.map((item) => item.id).filter((id) => selected.has(id));
}

/** Fecha de calendario YYYY-MM-DD, aunque el valor traiga hora. */
export function calendarDay(value: string) {
  return value.slice(0, 10);
}

/** Estado que marcan las fechas. Pausado no sale de aquí. */
export function statusFromDates(
  startsAt: string,
  endsAt: string,
  today = todayIso(),
): Exclude<AdStatus, "PAUSADO"> {
  const start = calendarDay(startsAt);
  const end = calendarDay(endsAt);
  if (end && today > end) return "EXPIRADO";
  if (start && today < start) return "PROGRAMADO";
  return "EN_CURSO";
}

/** Al crear o guardar fechas, un pausado vigente sigue pausado. */
export function statusForSave(
  startsAt: string,
  endsAt: string,
  current: AdStatus | null,
  today = todayIso(),
): AdStatus {
  const fromDates = statusFromDates(startsAt, endsAt, today);
  if (current === "PAUSADO" && fromDates === "EN_CURSO") return "PAUSADO";
  return fromDates;
}

/**
 * Al abrir el inventario, un programado ya iniciado pasa a en curso
 * y uno cuyo fin ya pasó pasa a expirado. Null si no hay que escribir.
 */
export function statusOnOpen(
  ad: Pick<Ad, "status" | "startsAt" | "endsAt">,
  today = todayIso(),
): AdStatus | null {
  const end = calendarDay(ad.endsAt);
  const start = calendarDay(ad.startsAt);
  if (end && today > end && ad.status !== "EXPIRADO") return "EXPIRADO";
  if (ad.status === "PROGRAMADO" && start <= today && today <= end) return "EN_CURSO";
  return null;
}

export function isAdPlacement(value: unknown): value is AdPlacement {
  return typeof value === "string" && PLACEMENT_IDS.has(value);
}

export function placementLabel(id: AdPlacement) {
  return AD_PLACEMENTS.find((item) => item.id === id)?.label || id;
}

/** Fecha local YYYY-MM-DD. La vigencia se compara con el calendario del visitante. */
export function todayIso(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(days: number, date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return todayIso(next);
}

function httpUrl(value: string, maxLength: number) {
  const clean = value.trim();
  if (!clean || clean.length > maxLength) return "";
  try {
    const url = new URL(clean);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const canonical = url.toString();
    if (canonical.length > maxLength) return "";
    return canonical;
  } catch {
    return "";
  }
}

/** Enlace vacío, o http(s) de menos de 500 caracteres. */
export function safeAdHref(href: string) {
  return httpUrl(href, 499);
}

/** Imagen http(s) de 9 a 1999 caracteres. */
export function safeAdImageUrl(value: string) {
  const canonical = httpUrl(value, 1999);
  if (canonical.length < 9) return "";
  return canonical;
}

/** URL de una imagen subida por este inventario, en platform/ads/. */
export function isPlatformAdImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("firebasestorage.googleapis.com")) return false;
    return decodeURIComponent(parsed.pathname).includes("/platform/ads/");
  } catch {
    return false;
  }
}

/** Las fechas deciden la vigencia; «Pausado» es el único freno manual. Misma regla que `LiveAds`. */
export function isAdLive(ad: Ad, placement: AdPlacement, today = todayIso()) {
  const start = calendarDay(ad.startsAt);
  const end = calendarDay(ad.endsAt);
  return (
    ad.status !== "PAUSADO" &&
    ad.placements.includes(placement) &&
    ad.imageUrl.trim().length > 0 &&
    start <= today &&
    today <= end
  );
}

export function liveAdsFor(
  ads: Ad[],
  placement: AdPlacement,
  today = todayIso(),
) {
  return ads
    .filter((ad) => isAdLive(ad, placement, today))
    .sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand));
}
