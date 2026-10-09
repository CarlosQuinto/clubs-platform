export interface ProfileStatView {
  key: string;
  label: string;
  value: string;
}

export interface ProfileClubView {
  id: string;
  name: string;
  logo: string | null;
  href: string | null;
  /** «#9 · Delantero» o «Cuerpo técnico» */
  detail: string;
  /** «De baja» si sigue en la plantilla pero no juega. */
  badge: string | null;
}

/** Un torneo jugado con un club. */
export interface ProfileRowView {
  key: string;
  tournamentName: string;
  tournamentHref: string;
  category: string | null;
  clubName: string;
  clubLogo: string | null;
  clubHref: string | null;
  matches: string;
  goals: string;
  assists: string;
  mvps: string;
  yellow: string;
  red: string;
  /** «1 de penal · 1 autogol» */
  note: string | null;
}

export interface ProfileSeasonView {
  id: string;
  name: string;
  /** Resumen público de la temporada si ya se cerró. */
  href: string | null;
  /** «3 partidos · 2 goles · 1 asistencia» */
  summary: string;
  rows: ProfileRowView[];
}

export interface PlayerProfileView {
  id: string;
  name: string;
  imageUrl: string | null;
  /** «27 años · Delantero» */
  subtitle: string;
  shareText: string;
  currentClubs: ProfileClubView[];
  formerClubs: ProfileClubView[];
  stats: ProfileStatView[];
  seasons: ProfileSeasonView[];
}
