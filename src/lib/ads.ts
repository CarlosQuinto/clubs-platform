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

/** Enlace vacío, o http(s). Cualquier otro esquema se descarta. */
export function safeAdHref(href: string) {
  const clean = href.trim();
  if (!clean) return "";
  try {
    const url = new URL(clean);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
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
