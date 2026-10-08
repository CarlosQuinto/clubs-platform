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
const TOURNAMENT_PRIZE_RE = new RegExp(
  `^[${LATIN_LETTERS}0-9.,+$/()-]+(?: [${LATIN_LETTERS}0-9.,+$/()-]+)*$`,
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

/** Premio al campeón: opcional, hasta 60 caracteres («$25,000 MXN», «Trofeo + uniformes»). */
export function tournamentPrize(value: string, max = 60) {
  return singleSpaces(
    value.replace(new RegExp(`[^${LATIN_LETTERS}0-9.,+$/()\\- ]`, "g"), ""),
  ).slice(0, max);
}

export function isTournamentPrize(value: string) {
  const clean = value.trim();
  if (!clean) return true;
  return clean.length <= 60 && TOURNAMENT_PRIZE_RE.test(clean);
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

const COURT_LOCATION_RE = new RegExp(`^[${LATIN_LETTERS}0-9.,#/-]+(?: [${LATIN_LETTERS}0-9.,#/-]+)*$`);

/** Ubicación de la cancha: opcional, 3 a 60 caracteres («Col. Centro, Calle 5 #12»). */
export function courtLocation(value: string, max = 60) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9.,#/\\- ]`, "g"), "")).slice(0, max);
}

export function isCourtLocation(value: string) {
  const clean = value.trim();
  if (!clean) return true;
  return clean.length >= 3 && clean.length <= 60 && COURT_LOCATION_RE.test(clean);
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

export function emailText(value: string, max = 100) {
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
  return value.length <= 100 && value === value.toLowerCase() && REGISTER_EMAIL_RE.test(value);
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

// El guion va escapado: holdNote agrega un espacio detrás y "?- " sería un rango inválido.
const HOLD_NOTE_CHARS = `${LATIN_LETTERS}0-9.,¡!¿?\\-`;
const HOLD_NOTE_RE = new RegExp(`^[${HOLD_NOTE_CHARS}]+(?: [${HOLD_NOTE_CHARS}]+)*$`);
const BOOKING_EMAIL_RE = /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)+[a-z]{2,10}$/;

/** Quien aparta una cancha: letras y un espacio entre palabras, 30 como máximo. */
export function holdName(value: string) {
  return personName(value, 30);
}

export function isHoldName(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 30 && PERSON_NAME_RE.test(clean);
}

/** Title Case, como lo guarda el SQL. */
export function titleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(new RegExp(`(^|[^${LATIN_LETTERS}])([${LATIN_LETTERS}])`, "g"), (_, lead, first) => lead + first.toUpperCase());
}

export function holdNote(value: string) {
  return singleSpaces(value.replace(new RegExp(`[^${HOLD_NOTE_CHARS} ]`, "g"), "")).slice(0, 50);
}

export function isHoldNote(value: string) {
  const clean = value.trim();
  if (!clean) return true;
  return clean.length <= 50 && HOLD_NOTE_RE.test(clean);
}

/** Correo de apartado: sin espacios, minúsculas y dominio con extensión de 2 a 10 letras. */
export function isBookingEmail(value: string) {
  return value.length <= 100 && BOOKING_EMAIL_RE.test(value);
}

/** Marca de un anuncio: letras, números y un espacio entre palabras, de 2 a 50. */
export function brandName(value: string) {
  return spacedLabel(value, 50);
}

export function isBrandName(value: string) {
  return isSpacedLabel(value, 2, 50);
}

/** Nombre de la plataforma en la barra superior: de 2 a 30. */
export function platformName(value: string) {
  return spacedLabel(value, 30);
}

export function isPlatformName(value: string) {
  return isSpacedLabel(value, 2, 30);
}

// Textos públicos de la plataforma: puntuación básica y nunca < > que pudieran armar HTML.
// El guion va escapado (\\-): copyText agrega un espacio detrás y "- " sería un rango inválido.
const COPY_CHARS = `${LATIN_LETTERS}0-9.,:;¡!¿?()'"\\-`;
const COPY_RE = new RegExp(`^[${COPY_CHARS}]+(?: [${COPY_CHARS}]+)*$`);

function copyText(value: string, max: number) {
  return singleSpaces(value.replace(/\s/g, " ").replace(new RegExp(`[^${COPY_CHARS} ]`, "g"), "")).slice(0, max);
}

function isCopyText(value: string, max: number) {
  const clean = value.trim();
  if (!clean) return true;
  return clean.length <= max && COPY_RE.test(clean);
}

export function platformMotto(value: string) {
  return copyText(value, 50);
}

export function isPlatformMotto(value: string) {
  return isCopyText(value, 50);
}

/** Motivo para desactivar un club: obligatorio, de 5 a 100, con la puntuación de los textos públicos. */
export function disableReason(value: string) {
  return copyText(value, 100);
}

export function isDisableReason(value: string) {
  const clean = value.trim();
  return clean.length >= 5 && clean.length <= 100 && COPY_RE.test(clean);
}

export function coverHeadline(value: string) {
  return copyText(value, 35);
}

export function isCoverHeadline(value: string) {
  return isCopyText(value, 35);
}

export function coverTagline(value: string) {
  return copyText(value, 120);
}

export function isCoverTagline(value: string) {
  return isCopyText(value, 120);
}

// http(s), dominio con extensión (o localhost, donde corre el stack en desarrollo) y nada de espacios ni < > " '.
// El SQL es más laxo (^https?://[^[:space:]<>"']+$): lo que pasa aquí pasa allá.
const WEB_URL_RE = /^https?:\/\/(?:localhost|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::[0-9]{1,5})?(?:[/?#][^\s<>"']*)?$/i;

/** URL sin espacios en ningún lado. */
export function webUrl(value: string, max: number) {
  return value.replace(/\s/g, "").slice(0, max);
}

export function isWebUrl(value: string, max: number) {
  if (value.length > max || !WEB_URL_RE.test(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Esquema y dominio en minúsculas; la ruta se respeta porque las imágenes la distinguen. */
export function canonicalWebUrl(value: string) {
  const match = /^([a-z]+:\/\/[^/?#]+)(.*)$/i.exec(value.trim());
  return match ? match[1].toLowerCase() + match[2] : value.trim();
}

/** Usuario o URL de una red: sin espacios y en minúsculas, salvo el id de canal de YouTube. */
export function socialHandle(value: string, max = 150) {
  const clean = value.replace(/\s/g, "").slice(0, max);
  const channel = /^(.*\/channel\/)(.*)$/i.exec(clean);
  return channel ? channel[1].toLowerCase() + channel[2] : clean.toLowerCase();
}

const SCHEME = "(?:https?://)?";
const INSTAGRAM_RE = new RegExp(
  `^(?:@?[a-z0-9._]{1,30}|${SCHEME}(?:www\.)?instagram\.com/[a-z0-9._]{1,30}/?)$`,
);
const FACEBOOK_RE = new RegExp(
  `^(?:@?[a-z0-9.]{1,50}|${SCHEME}(?:www\.|m\.)?facebook\.com/[a-z0-9._/?=&-]{1,120})$`,
);
const X_RE = new RegExp(`^(?:@?[a-z0-9_]{1,15}|${SCHEME}(?:www\.)?(?:x|twitter)\.com/[a-z0-9_]{1,15}/?)$`);
const YOUTUBE_RE = new RegExp(
  `^(?:@?[a-z0-9._-]{3,30}|${SCHEME}(?:www\.|m\.)?youtube\.com/(?:@[a-z0-9._-]{3,30}|c/[a-z0-9._-]{1,100}|user/[a-z0-9._-]{1,100}|channel/[A-Za-z0-9_-]{10,40})/?)$`,
);

export function isInstagram(value: string) {
  return !value || INSTAGRAM_RE.test(value);
}

export function isFacebook(value: string) {
  return !value || FACEBOOK_RE.test(value);
}

export function isX(value: string) {
  return !value || X_RE.test(value);
}

export function isYoutube(value: string) {
  return !value || YOUTUBE_RE.test(value);
}

/** WhatsApp: dígitos y espacios para leerlo mejor, 13 caracteres como máximo. */
export function whatsappText(value: string) {
  return singleSpaces(value.replace(/[^0-9 ]/g, "")).slice(0, 13);
}

export function isWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  return !value.trim() || (digits.length >= 10 && digits.length <= 13);
}

// ---------- Página de club: las mismas reglas que las funciones de db/migrations/1011_fn_club.sql ----------

const WORDS_RE = new RegExp(`^[${LATIN_LETTERS}0-9]+(?: [${LATIN_LETTERS}0-9]+)*$`);
const LETTER_WORDS_RE = new RegExp(`^[${LATIN_LETTERS}]+(?: [${LATIN_LETTERS}]+)*$`);
const EVENT_TEXT_RE = new RegExp(`^[${LATIN_LETTERS}0-9.\-]+(?: [${LATIN_LETTERS}0-9.\-]+)*$`);
const COVER_NAME_RE = new RegExp(`^[${LATIN_LETTERS}0-9.]+(?: [${LATIN_LETTERS}0-9.]+)*$`);
const COVER_PLACE_RE = new RegExp(
  `^[${LATIN_LETTERS}0-9]+(?: [${LATIN_LETTERS}0-9]+)*(?:, ?[${LATIN_LETTERS}0-9]+(?: [${LATIN_LETTERS}0-9]+)*)?$`,
);
const COMMA_TEXT_RE = new RegExp(`^[${LATIN_LETTERS}0-9][${LATIN_LETTERS}0-9,]*(?: [${LATIN_LETTERS}0-9,]+)*$`);

/** Primera letra en mayúscula y el resto tal cual, como api_capitalize_first en SQL. */
export function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function commaText(value: string, max: number) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9, ]`, "g"), ""))
    .replace(/,{2,}/g, ",")
    .replace(/^,+/, "")
    .slice(0, max);
}

function isCommaText(value: string, min: number, max: number) {
  const clean = value.trim();
  return clean.length >= min && clean.length <= max && COMMA_TEXT_RE.test(clean) && !clean.includes(",,");
}

/** Nombre de álbum: letras y números con un espacio entre palabras, de 3 a 30. */
export function albumName(value: string) {
  return spacedLabel(value, 30);
}

export function isAlbumName(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 30 && WORDS_RE.test(clean);
}

/** Nombre del club en la portada: letras, números y puntos, de 3 a 30. */
export function coverClubName(value: string) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9. ]`, "g"), "")).slice(0, 30);
}

export function isCoverClubName(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 30 && COVER_NAME_RE.test(clean);
}

/** Barrio o escuela: letras, números y una coma como mucho, de 3 a 30. */
export function coverPlace(value: string) {
  const clean = singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9, ]`, "g"), "")).replace(/^,+/, "");
  const comma = clean.indexOf(",");
  const once = comma < 0 ? clean : clean.slice(0, comma + 1) + clean.slice(comma + 1).replace(/,/g, "");
  return once.slice(0, 30);
}

export function isCoverPlace(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 30 && COVER_PLACE_RE.test(clean);
}

/** Lema de la portada: cualquier carácter imprimible en una línea, hasta 100. */
export function coverMotto(value: string) {
  return singleSpaces(value.replace(/[\u0000-\u001f\u007f]/g, " ")).slice(0, 100);
}

export function isCoverMotto(value: string) {
  const clean = value.trim();
  return clean.length >= 1 && clean.length <= 100 && !clean.includes("  ") && !/[\u0000-\u001f\u007f]/.test(clean);
}

/** Título del evento (entrenamiento o rival) y lugar: letras, números, guiones y puntos, de 3 a 30. */
export function eventText(value: string) {
  return singleSpaces(value.replace(new RegExp(`[^${LATIN_LETTERS}0-9.\- ]`, "g"), "")).slice(0, 30);
}

export function isEventText(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 30 && EVENT_TEXT_RE.test(clean);
}

/** Nombre completo del jugador: solo letras, de 3 a 50. Se guarda en Title Case. */
export function playerFullName(value: string) {
  return personName(value, 50);
}

export function isPlayerFullName(value: string) {
  const clean = value.trim();
  return clean.length >= 3 && clean.length <= 50 && LETTER_WORDS_RE.test(clean);
}

/** Dorsal: del 1 al 99. */
export function shirtNumber(value: string) {
  return digitsOnly(value, 2).replace(/^0+/, "");
}

export function isShirtNumber(value: string) {
  return /^[1-9][0-9]?$/.test(value);
}

/** Variante del jugador (Extremo, Lateral…): solo letras, opcional, hasta 30. */
export function playerVariant(value: string) {
  return personName(value, 30);
}

export function isPlayerVariant(value: string) {
  const clean = value.trim();
  return !clean || (clean.length <= 30 && LETTER_WORDS_RE.test(clean));
}

/** Título de una meta y concepto de un movimiento: letras, números y comas sueltas, de 3 a 30. */
export function financeText(value: string) {
  return commaText(value, 30);
}

export function isFinanceText(value: string) {
  return isCommaText(value, 3, 30);
}

/** Nombre de un artículo del inventario: letras y números con un espacio entre palabras, de 2 a 20. */
export function inventoryItemName(value: string) {
  return spacedLabel(value, 20);
}

export function isInventoryItemName(value: string) {
  const clean = value.trim();
  return clean.length >= 2 && clean.length <= 20 && WORDS_RE.test(clean);
}

// ---------- Finanzas de la liga: las mismas reglas que db/migrations/1015_fn_finance.sql ----------

/** Deudor externo de un cargo (anunciante, quien renta): letras, números y comas, de 3 a 50. */
export function payerName(value: string) {
  return commaText(value, 50);
}

export function isPayerName(value: string) {
  return isCommaText(value, 3, 50);
}

/** Contacto del deudor externo (teléfono o correo), hasta 100. */
export function payerContact(value: string) {
  return singleSpaces(value.replace(/[^A-Za-z0-9@._+ -]/g, "")).slice(0, 100);
}

export function isPayerContact(value: string) {
  const clean = value.trim();
  return clean.length <= 100 && /^[A-Za-z0-9@._+ -]*$/.test(clean);
}

/** Nota opcional de un abono o motivo de condonar: vacía o como financeText. */
export function isFinanceNote(value: string) {
  return value.trim() === "" || isFinanceText(value);
}
