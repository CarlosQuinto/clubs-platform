import { isIsoDate } from "../../domains/courts/courts";
import { isTournamentName, isTournamentPrize } from "../../shared/textLimits";
import {
  FOOTBALL_TYPES,
  MATCH_DURATIONS,
  type Category,
  type FootballType,
  type MatchDurationMinutes,
  type Season,
} from "../../shared/types";

type CompetitionRows = {
  seasons: {
    id: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
    active: boolean;
  }[];
  categories: { id: string; name: string; sortOrder: number }[];
};

export interface NewTournamentDraft {
  name: string;
  seasonId: string;
  categoryIds: string[];
  footballType: FootballType;
  duration: MatchDurationMinutes;
  startDate: string;
  prize: string;
}

export interface NewTournamentPayload {
  name: string;
  seasonId: string;
  categoryIds: string[];
  footballType: "FUT_7" | "FUT_9" | "FUT_11";
  durationMinutes: MatchDurationMinutes;
  startDate: string;
  prize: string;
}

/** Temporadas activas y categorías para el alta, con los mismos tipos que /admin. */
export function toCompetitionOptions(data: CompetitionRows): {
  seasons: Season[];
  categories: Category[];
} {
  return {
    seasons: data.seasons
      .filter((season) => season.active)
      .map((season) => ({
        id: season.id,
        name: season.name,
        startDate: season.startDate || undefined,
        endDate: season.endDate || undefined,
        active: season.active,
      })),
    categories: data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      order: category.sortOrder,
    })),
  };
}

export function outsideSeason(startDate: string, season: Season | undefined) {
  if (!season || !isIsoDate(startDate)) return false;
  return Boolean(
    (season.startDate && startDate < season.startDate) ||
      (season.endDate && startDate > season.endDate),
  );
}

/** Mismas reglas que «Nuevo torneo» en /admin: devuelve el primer aviso o los datos limpios. */
export function validateNewTournament(
  draft: NewTournamentDraft,
  season: Season | undefined,
): string | NewTournamentPayload {
  const name = draft.name.trim();
  const prize = draft.prize.trim();
  if (!isTournamentName(name)) return "Escribe el nombre del torneo (3 a 50 caracteres).";
  if (!season) return "Elige la temporada.";
  if (!isIsoDate(draft.startDate)) return "Elige la fecha de inicio.";
  if (outsideSeason(draft.startDate, season)) {
    return "La fecha de inicio tiene que estar dentro de la temporada.";
  }
  if (draft.categoryIds.length === 0) return "Elige al menos una categoría.";
  if (!isTournamentPrize(prize)) {
    return "Revisa el premio: solo letras, números y $ , . + / ( ) -.";
  }
  if (!FOOTBALL_TYPES.includes(draft.footballType)) return "Elige el tipo de fútbol.";
  if (!MATCH_DURATIONS.includes(draft.duration)) return "Elige la duración del partido.";
  return {
    name,
    seasonId: season.id,
    categoryIds: draft.categoryIds,
    footballType: draft.footballType === 7 ? "FUT_7" : draft.footballType === 9 ? "FUT_9" : "FUT_11",
    durationMinutes: draft.duration,
    startDate: draft.startDate,
    prize,
  };
}
