import { RESERVED_SLUGS } from "../../shared/paths";
import {
  isCellPhone,
  isClubName,
  isLocalityLabel,
  isNeighborhood,
  isPublicSlug,
  isRegisterEmail,
  titleCase,
} from "../../shared/textLimits";

export interface NewClubDraft {
  name: string;
  slug: string;
  localityId: string;
  location: string;
  adminEmail: string;
  presidentPhone: string;
}

export interface NewClubPayload {
  name: string;
  slug: string;
  localityId: string;
  location: string;
  adminEmail: string;
  presidentPhone: string;
}

function tidy(value: string) {
  return value.trim().replace(/ {2,}/g, " ");
}

export function validateNewClub(draft: NewClubDraft, localityName: string): string | NewClubPayload {
  // Title Case, como lo guarda create_club (initcap)
  const name = titleCase(tidy(draft.name));
  const slug = draft.slug.replace(/^-+|-+$/g, "");
  const location = tidy(draft.location);
  const email = draft.adminEmail.trim().toLowerCase();
  const phone = draft.presidentPhone.trim();
  if (!isClubName(name)) return "Escribe el nombre del club.";
  if (!isPublicSlug(slug)) return "Escribe la URL.";
  if (RESERVED_SLUGS.includes(slug)) return "Esa URL está reservada.";
  if (!draft.localityId) return "Selecciona la localidad.";
  if (!isNeighborhood(location)) return "El barrio no es válido.";
  if (email && !isRegisterEmail(email)) return "El correo del presidente no es válido.";
  if (phone && !isCellPhone(phone)) return "El teléfono no es válido.";
  return {
    name,
    slug,
    localityId: draft.localityId,
    location: location || localityName.trim(),
    presidentPhone: phone,
    adminEmail: email,
  };
}

export function validateLocality(value: string): string | { name: string } {
  const name = tidy(value);
  if (!isLocalityLabel(name)) return "Escribe la localidad.";
  return { name };
}

