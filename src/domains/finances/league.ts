import type {
  LeagueChargeStatus,
  LeagueExpenseCategory,
  LeagueFee,
  LeagueFeeKind,
  LeaguePaymentMethod,
} from "../../infrastructure/api/types";

/** Nombre de cada tipo de cobro; el mismo que league_kind_label en 1015_fn_finance.sql. */
export const FEE_KIND_LABEL: Record<LeagueFeeKind, string> = {
  CLUB_REGISTRATION: "Registro del club en la plataforma",
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
  OTHER: "Otro cobro",
};

/** Cuándo se registra cada cobro, para la pantalla de tarifas (1015_fn_finance.sql). */
export const FEE_KIND_HINT: Partial<Record<LeagueFeeKind, string>> = {
  MATCH_REFEREE: "A cada club cuando el partido queda jugado (no en un W.O.).",
  MATCH_COURT: "Se cobra solo: el costo por hora de la cancha del partido × la duración del partido. No lleva precio.",
  WALKOVER: "Al club que no se presentó (a los dos si faltaron ambos).",
  CARD_YELLOW: "Por cada amarilla, cuando el partido queda jugado.",
  CARD_RED: "Por cada roja, cuando el partido queda jugado.",
  TOURNAMENT_ENROLLMENT: "Al inscribir un club a un torneo.",
  CLUB_REGISTRATION: "Un solo pago por club, cuando se da de alta en la plataforma.",
  COURT_RENTAL: "Se registra sola, ya pagada, cada vez que se aparta una cancha. Usa el costo por hora de la cancha.",
  AD: "Se cobra sola al anunciante cuando un anuncio tiene precio (Publicidad).",
};

export const FEE_GROUPS: { title: string; kinds: LeagueFeeKind[] }[] = [
  { title: "Partidos", kinds: ["MATCH_REFEREE", "MATCH_COURT", "WALKOVER"] },
  { title: "Tarjetas", kinds: ["CARD_YELLOW", "CARD_RED"] },
  { title: "Registro e inscripción", kinds: ["CLUB_REGISTRATION", "TOURNAMENT_ENROLLMENT"] },
  { title: "Canchas y publicidad", kinds: ["COURT_RENTAL", "AD"] },
];

export const ALL_FEE_KINDS: LeagueFeeKind[] = FEE_GROUPS.flatMap((group) => group.kinds);

/** Cobros cuyo monto sale del propio registro (cancha o anuncio): se cobran solos y la tarifa solo los apaga. */
export const AMOUNT_FROM_SOURCE: LeagueFeeKind[] = ["MATCH_COURT", "COURT_RENTAL", "AD"];

/** Tipos que se ven en los filtros: los de las tarifas y «Otro cobro» (el único que se crea a mano). */
export const CHARGE_KINDS: LeagueFeeKind[] = [...ALL_FEE_KINDS, "OTHER"];

/** Tarifa sin guardar: así se comporta el SQL (league_fee_on). */
export function defaultFee(kind: LeagueFeeKind): LeagueFee {
  return {
    kind,
    enabled: AMOUNT_FROM_SOURCE.includes(kind),
    amount: 0,
    period: "ONCE",
    splitMode: kind === "MATCH_COURT" ? "HALF" : "EACH",
    includesRegistration: false,
  };
}

/** Una renta se paga al apartar: no se marca ni desmarca a mano. */
export function isPaidOnBooking(charge: { kind: LeagueFeeKind; automatic?: boolean }) {
  return charge.kind === "COURT_RENTAL" && charge.automatic !== false;
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
