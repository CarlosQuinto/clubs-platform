/** Inventario de publicidad. El cobro vive fuera de la app. */

export const AD_PLACEMENTS = [
  { id: "home", label: "Inicio, bajo la portada" },
  { id: "tournament", label: "Ficha de torneo" },
  { id: "club", label: "Página del club" },
  { id: "teams", label: "Página de equipos" },
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number]["id"];

const PLACEMENT_IDS = new Set<string>(AD_PLACEMENTS.map((item) => item.id));

export interface Ad {
  id: string;
  brand: string;
  imageUrl: string;
  href: string;
  placements: AdPlacement[];
  startsAt: string;
  endsAt: string;
  active: boolean;
  order: number;
  /** El documento guardaba una ubicación que la app ya no ofrece. */
  hasLegacyPlacement: boolean;
}

export type AdWindow = "scheduled" | "current" | "ended";

/** Ubicaciones conocidas, sin duplicados, en el orden del inventario. */
export function canonicalPlacements(ids: readonly AdPlacement[]): AdPlacement[] {
  const selected = new Set(ids);
  return AD_PLACEMENTS.map((item) => item.id).filter((id) => selected.has(id));
}

export function adWindow(
  ad: Pick<Ad, "startsAt" | "endsAt">,
  today = todayIso(),
): AdWindow {
  if (ad.startsAt && today < ad.startsAt) return "scheduled";
  if (ad.endsAt && today > ad.endsAt) return "ended";
  return "current";
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

export function isAdLive(ad: Ad, placement: AdPlacement, today = todayIso()) {
  return (
    ad.active &&
    ad.placements.includes(placement) &&
    ad.imageUrl.trim().length > 0 &&
    ad.startsAt <= today &&
    today <= ad.endsAt
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
