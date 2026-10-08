import type { MatchNoShow } from "../../infrastructure/api/types";

/** Explica un W.O.: quién no se presentó, o el 3-0 por ingreso tardío al torneo si nadie faltó. */
export function walkoverNote(
  walkover: boolean | undefined,
  noShow: MatchNoShow | null | undefined,
  homeName: string,
  awayName: string,
): string | null {
  if (!walkover) return null;
  if (noShow === "BOTH") return "No se presentó ninguno";
  if (noShow === "HOME") return `No se presentó ${homeName}`;
  if (noShow === "AWAY") return `No se presentó ${awayName}`;
  return "3-0 por ingreso tardío";
}
