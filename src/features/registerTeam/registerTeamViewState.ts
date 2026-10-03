import type { ClubCardView } from "../teams/teamsViewState";

export interface RegisterTeamFormView {
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  teamName: string;
  consent: boolean;
  busy: boolean;
  sent: boolean;
  error: string | null;
  clubs: ClubCardView[];
}
