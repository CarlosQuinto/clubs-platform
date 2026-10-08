import { Link } from "react-router-dom";
import { Medal, Trophy } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import type { PodiumSlotView } from "./tournamentViewState";

/** Clase de cada escalón del podio, en el orden en que se pinta: subcampeón, campeón, tercero. */
const PODIUM_TONE = ["is-second", "is-first", "is-third"] as const;

/** Podio «Carbón y Oro» con escudos (ficha de torneo y resumen de temporada). */
export default function Podium({ slots }: { slots: PodiumSlotView[] }) {
  return (
    <ol className="tour-podium">
      {slots.map((slot, index) => {
        const tone = PODIUM_TONE[index] ?? "is-third";
        const Icon = tone === "is-first" ? Trophy : Medal;
        return (
          <li key={slot.placeLabel} className={`tour-podium__step ${tone}`}>
            <span className="home-crest home-crest--lg">
              <img src={slot.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
            </span>
            <span className="tour-podium__place">
              <Icon size={14} aria-hidden />
              {slot.placeLabel}
            </span>
            {slot.clubName && slot.clubHref ? (
              <Link to={slot.clubHref} className="tour-podium__club">
                {slot.clubName}
              </Link>
            ) : (
              <span className="tour-podium__club is-empty">{slot.clubName || "—"}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
