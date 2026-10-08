import type {
  LeagueChargeStatus,
  LeagueExpenseCategory,
  LeagueFee,
  LeagueFeeKind,
  LeaguePaymentMethod,
} from "../../infrastructure/api/types";

/** Nombre de cada tipo de cobro; el mismo que league_kind_label en 1015_fn_finance.sql. */
export const FEE_KIND_LABEL: Record<LeagueFeeKind, string> = {
  CLUB_REGISTRATION: "Registro del club",
  CLUB_PAGE: "Página del club",
  SEASON_ENROLLMENT: "Inscripción a la temporada",
  TOURNAMENT_ENROLLMENT: "Inscripción al torneo",
  DEPOSIT: "Fianza",
  MATCH_REFEREE: "Arbitraje",
  MATCH_COURT: "Uso de cancha",
  COURT_RENTAL: "Renta de cancha",
  CARD_YELLOW: "Tarjeta amarilla",
  CARD_RED: "Tarjeta roja",
  WALKOVER: "No presentarse",
  PROTEST: "Protesta",
  RESCHEDULE: "Reprogramación",
  PLAYER_CARD: "Credencial de jugador",
  LATE_SIGNING: "Fichaje tardío",
  AD: "Publicidad",
  SPONSORSHIP: "Patrocinio",
  OTHER: "Otro",
};

/** Cuándo se genera cada cobro, para la pantalla de tarifas. */
export const FEE_KIND_HINT: Record<LeagueFeeKind, string> = {
  CLUB_REGISTRATION: "Una vez por temporada: con «Generar cobros de temporada» o al inscribirse al primer torneo.",
  CLUB_PAGE: "Mantener la página activa: por mes («Generar mensualidad») o por temporada.",
  SEASON_ENROLLMENT: "Con «Generar cobros de temporada», a cada club activo.",
  TOURNAMENT_ENROLLMENT: "Al inscribir un club a un torneo.",
  DEPOSIT: "Al inscribir un club a un torneo. Si se devuelve, anótalo como devolución en Gastos.",
  MATCH_REFEREE: "A cada club cuando el partido queda jugado (no en un W.O.).",
  MATCH_COURT: "A cada club cuando el partido queda jugado (no en un W.O.).",
  COURT_RENTAL: "Usa el costo por hora de cada cancha. Se cobra al apartar una cancha desde Canchas.",
  CARD_YELLOW: "Por cada amarilla, cuando el partido queda jugado.",
  CARD_RED: "Por cada roja, cuando el partido queda jugado.",
  WALKOVER: "Al club que no se presentó (a los dos si faltaron ambos).",
  PROTEST: "Cargo manual. El precio se propone al crearlo.",
  RESCHEDULE: "Cargo manual. El precio se propone al crearlo.",
  PLAYER_CARD: "Cargo manual. El precio se propone al crearlo.",
  LATE_SIGNING: "Cargo manual. El precio se propone al crearlo.",
  AD: "Usa el precio de cada anuncio (Publicidad).",
  SPONSORSHIP: "Cargo manual al patrocinador, ligado a un torneo si quieres.",
  OTHER: "Cargo manual.",
};

export const FEE_GROUPS: { title: string; kinds: LeagueFeeKind[] }[] = [
  { title: "Partidos y canchas", kinds: ["MATCH_REFEREE", "MATCH_COURT", "COURT_RENTAL"] },
  {
    title: "Registro e inscripción",
    kinds: ["CLUB_REGISTRATION", "CLUB_PAGE", "SEASON_ENROLLMENT", "TOURNAMENT_ENROLLMENT", "DEPOSIT"],
  },
  { title: "Multas", kinds: ["CARD_YELLOW", "CARD_RED", "WALKOVER", "PROTEST", "RESCHEDULE"] },
  { title: "Jugadores", kinds: ["PLAYER_CARD", "LATE_SIGNING"] },
  { title: "Publicidad y patrocinios", kinds: ["AD", "SPONSORSHIP"] },
  { title: "Otros", kinds: ["OTHER"] },
];

export const ALL_FEE_KINDS: LeagueFeeKind[] = FEE_GROUPS.flatMap((group) => group.kinds);

/** Cobros cuyo monto sale del propio registro (cancha o anuncio): la tarifa solo los activa. */
export const AMOUNT_FROM_SOURCE: LeagueFeeKind[] = ["COURT_RENTAL", "AD"];

export function defaultFee(kind: LeagueFeeKind): LeagueFee {
  return {
    kind,
    enabled: false,
    amount: 0,
    period: kind === "CLUB_PAGE" ? "SEASON" : "ONCE",
    splitMode: "EACH",
    includesRegistration: false,
  };
}

export const CHARGE_STATUS_LABEL: Record<LeagueChargeStatus, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  PAGADO: "Pagado",
  CONDONADO: "Condonado",
  CANCELADO: "Cancelado",
};

export const CHARGE_STATUS_COLOR: Record<LeagueChargeStatus, "red" | "amber" | "green" | "gray" | "blue"> = {
  PENDIENTE: "red",
  PARCIAL: "amber",
  PAGADO: "green",
  CONDONADO: "blue",
  CANCELADO: "gray",
};

export const PAYMENT_METHOD_LABEL: Record<LeaguePaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

export const EXPENSE_CATEGORIES: { id: LeagueExpenseCategory; label: string; loss: boolean }[] = [
  { id: "ARBITROS", label: "Árbitros", loss: false },
  { id: "PREMIOS", label: "Premios y trofeos", loss: false },
  { id: "MANTENIMIENTO", label: "Mantenimiento de canchas", loss: false },
  { id: "SERVICIOS", label: "Servicios (luz, agua)", loss: false },
  { id: "MATERIAL", label: "Material (balones, redes)", loss: false },
  { id: "SERVIDOR", label: "Servidor y dominio", loss: false },
  { id: "PUBLICIDAD", label: "Publicidad propia", loss: false },
  { id: "OTRO", label: "Otro gasto", loss: false },
  { id: "DEVOLUCION", label: "Devolución (fianza, protesta, reserva)", loss: true },
  { id: "DANOS", label: "Daños y robos", loss: true },
];

export const EXPENSE_CATEGORY_LABEL = Object.fromEntries(
  EXPENSE_CATEGORIES.map((category) => [category.id, category.label]),
) as Record<LeagueExpenseCategory, string>;

/** Deudor de un cargo: el club o el externo. */
export function payerLabel(charge: { club?: { name: string } | null; payerName: string }) {
  return charge.club?.name || charge.payerName || "Sin deudor";
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function monthName(month: number) {
  return MONTHS[month - 1] ?? "";
}
