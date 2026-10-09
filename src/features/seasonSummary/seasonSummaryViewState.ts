import type { PodiumSlotView } from "../tournament/tournamentViewState";

export interface SeasonChampionView {
  id: string;
  name: string;
  href: string;
  /** «Primera Fuerza · Premio: $20,000 MXN» */
  detail: string;
  hasPodium: boolean;
  slots: PodiumSlotView[];
}

export interface SeasonStatView {
  key: string;
  label: string;
  value: string;
}

export interface AwardEntryView {
  key: string;
  name: string;
  /** Ficha del jugador; null si ya no existe. */
  href: string | null;
  imageUrl: string | null;
  clubName: string | null;
  clubLogo: string | null;
  value: string;
  unit: string;
  detail: string | null;
}

export interface AwardGroupView {
  key: "scorers" | "assists" | "mvps" | "keepers";
  title: string;
  subtitle: string;
  entries: AwardEntryView[];
}

export interface RecordView {
  key: string;
  label: string;
  headline: string;
  detail: string;
  href: string | null;
  logos: (string | null)[];
}

export interface SeasonSummaryView {
  title: string;
  rangeLabel: string;
  shareText: string;
  champions: SeasonChampionView[];
  stats: SeasonStatView[];
  awards: AwardGroupView[];
  records: RecordView[];
}
