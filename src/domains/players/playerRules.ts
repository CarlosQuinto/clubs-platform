// Reglas del formulario de jugador: las mismas que save_player y admin_save_player en SQL.
import { isoDate } from "../../shared/helpers";
import { isPlayerFullName, isPlayerVariant, isShirtNumber } from "../../shared/textLimits";

/** Fecha de nacimiento más antigua que se acepta (la misma que save_player). */
export const BIRTH_MIN = "1940-01-01";

/** Posiciones de club_player_fields_error. */
export const PLAYER_POSITIONS = ["Portero", "Defensa", "Medio", "Delantero"] as const;

/** Datos de la persona (nombre y nacimiento); vacío si cumplen. */
export function playerPersonError(name: string, birthDate: string) {
  if (!isPlayerFullName(name)) return "El nombre lleva de 3 a 50 letras, sin números ni símbolos.";
  if (birthDate && (birthDate < BIRTH_MIN || birthDate > isoDate())) {
    return "La fecha de nacimiento va de 1940 a hoy.";
  }
  return "";
}

/** Datos de su ficha en un club (dorsal y variante); vacío si cumplen. */
export function clubPlayerFieldsError(number: string, variant: string) {
  if (!isShirtNumber(number)) return "El dorsal va del 1 al 99.";
  if (!isPlayerVariant(variant)) return "La variante lleva solo letras, hasta 30.";
  return "";
}

/** Motivo por el que no se puede fichar; vacío si todo cumple (las reglas de save_player). */
export function playerFormError(name: string, number: string, variant: string, birthDate: string) {
  if (!isPlayerFullName(name)) return playerPersonError(name, birthDate);
  return clubPlayerFieldsError(number, variant) || playerPersonError(name, birthDate);
}
