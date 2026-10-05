import type { PlatformSocial } from "../../shared/types";

export function hasAnySocial(social?: PlatformSocial | null) {
  return Boolean(
    social?.instagram?.trim() ||
      social?.facebook?.trim() ||
      social?.x?.trim() ||
      social?.youtube?.trim() ||
      social?.whatsapp?.trim(),
  );
}

/** URL completa, o el dominio de la red sin esquema (p. ej. "facebook.com/pagina"). */
function linkFrom(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(?:www\.|m\.)?(?:instagram|facebook|x|twitter|youtube)\.com\//i.test(value)) {
    return `https://${value}`;
  }
  return "";
}

export function instagramUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  const link = linkFrom(v);
  if (link) return link;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export function facebookUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  const link = linkFrom(v);
  if (link) return link;
  return `https://facebook.com/${v.replace(/^@/, "")}`;
}

export function xUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  const link = linkFrom(v);
  if (link) return link;
  return `https://x.com/${v.replace(/^@/, "")}`;
}

export function youtubeUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  const link = linkFrom(v);
  if (link) return link;
  return `https://youtube.com/@${v.replace(/^@/, "")}`;
}

/** Enlace a WhatsApp. Acepta número o URL. México (52) si no trae lada. */
export function whatsappUrl(value: string, text?: string) {
  const v = value.trim();
  if (!v) return "";
  let url = v;
  if (!/^https?:\/\//i.test(v)) {
    const digits = v.replace(/\D/g, "");
    if (!digits) return "";
    const withCountry =
      digits.startsWith("52") || digits.startsWith("1") ? digits : `52${digits}`;
    url = `https://wa.me/${withCountry}`;
  }
  if (!text?.trim()) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}text=${encodeURIComponent(text.trim())}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
