export const getPlayerName = (idOrName: string, players: any[]) => {
  if (!idOrName) return '';
  if (idOrName.startsWith('guest-')) return idOrName.replace('guest-', '');
  const p = players.find(pl => pl.id === idOrName);
  if (p) return p.name;
  const pByName = players.find(pl => pl.name === idOrName);
  if (pByName) return pByName.name;
  if (idOrName.length > 15 && !idOrName.includes(' ')) return 'Jugador Eliminado';
  return idOrName;
};

export const formatFriendlyDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  let formatted = dateObj.toLocaleDateString('es-ES', options);
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return formatted.replace(/ de (\d{4})/, ' del $1');
};

export const formatFriendlyTime = (timeString: string) => {
  if (!timeString) return '';
  const [hourStr, minuteStr] = timeString.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const formattedHour = hour < 10 ? '0' + hour : hour;
  return `${formattedHour}:${minute} ${ampm}`;
};

const SHORT_MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

/** Fecha corta: 29 SEP 2026 */
export const formatShortDate = (dateString: string) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${day} ${SHORT_MONTHS[month - 1] || ""} ${year}`;
};

export const calculateAge = (dob: string) => {
  if (!dob) return '';
  const diffMs = Date.now() - new Date(dob).getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

export const isBirthdayToday = (dateString: string) => {
  if (!dateString) return false;
  const parts = dateString.split("-");
  if (parts.length !== 3) return false;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const today = new Date();
  return month === today.getMonth() + 1 && day === today.getDate();
};

export function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Suma meses a una fecha ISO (YYYY-MM-DD) conservando el día cuando se puede. */
export function addMonthsIso(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1 + months, d);
  return isoDate(dt);
}