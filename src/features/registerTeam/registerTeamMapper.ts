import { isCellPhone, isClubName, isPersonName, isRegisterEmail, titleCase } from "../../shared/textLimits";

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
