import type { PlatformSocial } from "./types";

export function hasAnySocial(social?: PlatformSocial | null) {
  return Boolean(
    social?.instagram?.trim() ||
      social?.facebook?.trim() ||
      social?.whatsapp?.trim(),
  );
}

export function instagramUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export function facebookUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://facebook.com/${v.replace(/^@/, "")}`;
}

/** Enlace a WhatsApp. Acepta número o URL. México (52) si no trae lada. */
export function whatsappUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const withCountry =
    digits.startsWith("52") || digits.startsWith("1") ? digits : `52${digits}`;
  return `https://wa.me/${withCountry}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
