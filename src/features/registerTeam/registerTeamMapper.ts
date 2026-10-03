import type { RegisterTeamPageData } from "../../../dataconnect/generated";
import { EMAIL_RE } from "../../lib/social";
import type { ClubCardView } from "../teams/teamsViewState";

export interface RegisterTeamDraft {
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  teamName: string;
  consent: boolean;
}

export interface RegisterTeamPayload {
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  teamName: string;
}

export function toRegisterTeamClubs(data: RegisterTeamPageData): ClubCardView[] {
  return data.clubs.map((club) => {
    const phone = club.presidentPhone.trim();
    const locality = club.locality?.name?.trim() || club.location.trim() || `/${club.slug}`;
    return {
      href: club.slug.trim() ? `/${club.slug.trim()}` : "/",
      name: club.name,
      locality,
      logoUrl: club.logoUrl?.trim() || null,
      phoneLabel: phone ? `Presidente: ${phone}` : null,
      phoneHref: phone ? `tel:${phone.replace(/\s+/g, "")}` : null,
    };
  });
}

export function validateRegisterTeam(draft: RegisterTeamDraft): string | RegisterTeamPayload {
  const captainName = draft.captainName.trim();
  const captainEmail = draft.captainEmail.trim().toLowerCase();
  const captainPhone = draft.captainPhone.trim();
  const teamName = draft.teamName.trim();
  if (captainName.length < 2) return "Escribe el nombre completo.";
  if (!EMAIL_RE.test(captainEmail)) return "El correo no es válido.";
  if (captainPhone.replace(/\D/g, "").length < 7) return "El teléfono no es válido.";
  if (teamName.length < 2) return "Escribe el nombre del equipo.";
  if (!draft.consent) return "Debes aceptar los términos y la política de privacidad.";
  return { captainName, captainEmail, captainPhone, teamName };
}
