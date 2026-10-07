import { whatsappUrl } from "../../domains/platform/social";
import { type RegisterTeamPageData } from "../../infrastructure/dataconnect";
import { isCellPhone, isClubName, isPersonName, isRegisterEmail, titleCase } from "../../shared/textLimits";
import { clubInitials } from "../teams/teamsMapper";
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
      initials: clubInitials(club.name),
      locality,
      logoUrl: club.logoUrl?.trim() || null,
      phoneLabel: phone ? `Presidente: ${phone}` : null,
      phoneHref: phone ? whatsappUrl(phone) : null,
    };
  });
}

export function validateRegisterTeam(draft: RegisterTeamDraft): string | RegisterTeamPayload {
  const captainName = draft.captainName.trim();
  const captainEmail = draft.captainEmail.trim().toLowerCase();
  const captainPhone = draft.captainPhone.trim();
  // Misma regla y Title Case que el alta de club: así la solicitud se aprueba sin cambios
  const teamName = titleCase(draft.teamName.trim());
  if (!isPersonName(captainName)) return "Escribe el nombre completo.";
  if (!isCellPhone(captainPhone)) return "El teléfono no es válido.";
  if (!isRegisterEmail(captainEmail)) return "El correo no es válido.";
  if (!isClubName(teamName)) return "Escribe el nombre del equipo.";
  if (!draft.consent) return "Debes aceptar los términos y la política de privacidad.";
  return { captainName, captainEmail, captainPhone, teamName };
}
