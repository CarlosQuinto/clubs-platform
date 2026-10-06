export interface CourtCardView {
  id: string;
  name: string;
  description: string | null;
  /** Dirección o referencia; null si la cancha no la tiene. */
  location: string | null;
  priceLabel: string;
  imageUrl: string | null;
  selected: boolean;
}

export interface TimeSlotView {
  minutes: number;
  label: string;
  selected: boolean;
}

export interface DurationOptionView {
  minutes: number;
  label: string;
}

export interface BookingSummaryView {
  imageUrl: string | null;
  name: string;
  dateLabel: string;
  rangeLabel: string;
  priceLabel: string;
  whatsappHref: string | null;
}

export type CourtsAvailability = "ready" | "disabled" | "no-hours" | "no-courts";

export interface CourtsPageView {
  availability: CourtsAvailability;
  whatsappMissing: boolean;
  courts: CourtCardView[];
  date: string;
  slots: TimeSlotView[];
  dayClosed: boolean;
  fullyBooked: boolean;
  durations: DurationOptionView[];
  duration: string;
  summary: BookingSummaryView | null;
}
