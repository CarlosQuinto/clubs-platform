const LATIN_LETTERS = "A-Za-zÀ-ÖØ-öø-ÿ";
const MESSAGE_CHARS = `${LATIN_LETTERS}0-9,.?¿!¡' `;
const PERSON_NAME_RE = new RegExp(`^[${LATIN_LETTERS}]+(?: [${LATIN_LETTERS}]+)*$`);
const TEAM_NAME_RE = new RegExp(`^[${LATIN_LETTERS}0-9.'"-]+(?: [${LATIN_LETTERS}0-9.'"-]+)*$`);
const CLUB_NAME_RE = new RegExp(`^[${LATIN_LETTERS}0-9.-]+(?: [${LATIN_LETTERS}0-9.-]+)*$`);
const NEIGHBORHOOD_RE = new RegExp(`^[${LATIN_LETTERS}0-9,.]+(?: [${LATIN_LETTERS}0-9,.]+)*$`);
const LOCALITY_RE = new RegExp(`^[${LATIN_LETTERS}0-9,]+(?: [${LATIN_LETTERS}0-9,]+)*$`);
const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTACT_MESSAGE_RE = new RegExp(`^[${MESSAGE_CHARS}\\n-]+$`);
const CELL_PHONE_RE = /^\+?[0-9]{10,15}$/;
const REGISTER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/;
const SEASON_NAME_RE = /^[0-9]+(?:-[0-9]+)*$/;
const SPACED_LABEL_RE = new RegExp(`^[${LATIN_LETTERS}0-9]+(?: [${LATIN_LETTERS}0-9]+)*$`);
const TOURNAMENT_NOTE_RE = new RegExp(
  `^[${LATIN_LETTERS}0-9.,¡!¿?-]+(?: [${LATIN_LETTERS}0-9.,¡!¿?-]+)*$`,
);

function singleSpaces(value: string) {
  return value.replace(/ {2,}/g, " ").replace(/^ +/, "");
}

export function seasonLabel(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 11);
}

export function isSeasonLabel(value: string) {
  return value.length >= 4 && value.length <= 11 && SEASON_NAME_RE.test(value);
}

function spacedLabel(value: string, max: number) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9 ]`, "g"), "")).slice(0, max);
}

function isSpacedLabel(value: string, min: number, max: number) {
  const clean = value.trim();
  return clean.length >= min && clean.length <= max && SPACED_LABEL_RE.test(clean);
}

export function tournamentName(value: string, max = 50) {
  return spacedLabel(value, max);
}

export function isTournamentName(value: string) {
  return isSpacedLabel(value, 3, 50);
}

export function categoryName(value: string, max = 40) {
  return spacedLabel(value, max);
}

export function isCategoryName(value: string) {
  return isSpacedLabel(value, 3, 40);
}

export function tournamentNote(value: string, max = 100) {
  return singleSpaces(
    value.replace(new RegExp(`[^${LATIN_LETTERS}0-9.,¡!¿?\\- ]`, "g"), ""),
  ).slice(0, max);
}

export function isTournamentNote(value: string) {
  const clean = value.trim();
  if (!clean) return true;
  return clean.length <= 100 && TOURNAMENT_NOTE_RE.test(clean);
}

const COURT_NOTE_RE = new RegExp(`^[${LATIN_LETTERS}0-9.,-]+(?: [${LATIN_LETTERS}0-9.,-]+)*$`);

export function courtName(value: string, max = 15) {
  return spacedLabel(value, max);
}

export function isCourtName(value: string) {
  return isSpacedLabel(value, 3, 15);
}

export function courtNote(value: string, max = 15) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9.,\\- ]`, "g"), "")).slice(0, max);
}

export function isCourtNote(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 15 && COURT_NOTE_RE.test(clean);
}

/** Costo en texto plano: dígitos y un punto, 8 enteros y 2 decimales como máximo. */
export function moneyText(value: string) {
  const raw = value.replace(/[^0-9.]/g, "");
  const dot = raw.indexOf(".");
  const whole = (dot < 0 ? raw : raw.slice(0, dot)).replace(/^0+(?=\d)/, "").slice(0, 8);
  if (dot < 0) return whole;
  const cents = raw.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return `${whole || "0"}.${cents}`;
}

export function isMoneyText(value: string) {
  return /^[0-9]{1,8}(?:\.[0-9]{0,2})?$/.test(value);
}

/** Pone comas de miles a un costo en texto plano. */
export function moneyLabel(value: string) {
  if (!value) return "";
  const [whole, cents] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return cents === undefined ? grouped : `${grouped}.${cents}`;
}

export function lettersAndNumbers(value: string, max: number) {
  return spacedLabel(value, max);
}

export function digitsOnly(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export function personName(value: string, max = 40) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS} ]`, "g"), "")).slice(0, max);
}

export function cellPhone(value: string, maxDigits = 15) {
  const plus = value.startsWith("+");
  const digits = value.replace(/\D/g, "").slice(0, maxDigits);
  return `${plus ? "+" : ""}${digits}`;
}

export function emailText(value: string, max = 320) {
  return value.replace(/\s/g, "").toLowerCase().slice(0, max);
}

export function teamLabel(value: string, max = 30) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9 .'\"-]`, "g"), "")).slice(0, max);
}

export function clubName(value: string, max = 30) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9. -]`, "g"), "")).slice(0, max);
}

export function publicSlug(value: string, max = 40) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, max);
}

export function neighborhood(value: string, max = 50) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9,. ]`, "g"), "")).slice(0, max);
}

export function localityLabel(value: string, max = 50) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9, ]`, "g"), "")).slice(0, max);
}

export function adminClubQuery(value: string, max = 30) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9 ]`, "g"), "")).slice(0, max);
}

export function contactMessage(value: string, max = 200) {
  return singleSpaces(value.replace(new RegExp(`[^${MESSAGE_CHARS}\\n-]`, "g"), "")).slice(0, max);
}

export function isPersonName(value: string) {
  return value.length >= 3 && value.length <= 40 && PERSON_NAME_RE.test(value);
}

export function isCellPhone(value: string) {
  return CELL_PHONE_RE.test(value);
}

export function isRegisterEmail(value: string) {
  return value.length <= 320 && value === value.toLowerCase() && REGISTER_EMAIL_RE.test(value);
}

export function isTeamLabel(value: string) {
  return value.length >= 3 && value.length <= 30 && TEAM_NAME_RE.test(value);
}

export function isClubName(value: string) {
  return value.length >= 3 && value.length <= 30 && CLUB_NAME_RE.test(value);
}

export function isPublicSlug(value: string) {
  return value.length >= 3 && value.length <= 40 && PUBLIC_SLUG_RE.test(value);
}

export function isNeighborhood(value: string) {
  if (!value) return true;
  return value.length >= 3 && value.length <= 50 && NEIGHBORHOOD_RE.test(value);
}

export function isLocalityLabel(value: string) {
  return value.length >= 3 && value.length <= 50 && LOCALITY_RE.test(value);
}

export function isContactMessage(value: string) {
  return (
    value.length >= 10 &&
    value.length <= 200 &&
    value === value.trim() &&
    !value.includes("  ") &&
    CONTACT_MESSAGE_RE.test(value)
  );
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
