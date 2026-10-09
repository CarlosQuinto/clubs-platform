import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import type { LiveMatchView } from "./matchesViewState";

/** Tarjeta «Carbón y Oro» de marcador (portada «En vivo» y ficha de torneo); `actions` queda fuera del enlace. */
export default function ResultCard({ match, actions }: { match: LiveMatchView; actions?: ReactNode }) {
  const live = match.phase === "live";
  const scored = match.homeScore != null && match.awayScore != null;
  const home = scored ? String(match.homeScore) : live ? "0" : "–";
  const away = scored ? String(match.awayScore) : live ? "0" : "–";
  const note = [match.walkover ? "W.O." : null, match.walkoverNote, match.penaltiesLabel].filter(Boolean).join(" · ");
  const label = live
    ? ["En vivo", match.minuteLabel].filter(Boolean).join(" ")
    : match.pending
      ? "Por confirmar"
      : "Terminado";
  // En vivo la píldora solo lleva el punto y el minuto («En vivo» queda para el lector de pantalla)
  const shown = live ? match.minuteLabel || "En vivo" : label;
  const place = [match.timeLabel, match.venue].filter(Boolean).join(" · ");
  return (
    <article className="home-card home-live">
      <Link
        to={match.href}
        className="home-fixture__link"
        aria-label={`${match.homeName} ${home}, ${match.awayName} ${away}. ${label}.`}
      >
        {/* Categoría y torneo a la izquierda; estado (o punto y minuto) a la derecha */}
        <div className="home-live__top">
          {match.subtitle ? (
            <span className="home-chip" title={match.subtitle}>
              {match.subtitle}
            </span>
          ) : null}
          <span className={`home-status ${live ? "is-live" : match.pending ? "is-pending" : "is-done"}`}>
            {live ? <span className="home-status__dot" aria-hidden /> : null}
            {shown}
          </span>
        </div>
        <div className="home-live__face">
          <TeamFace name={match.homeName} logo={match.homeLogo} role="Local" />
          <div className="home-score">
            <span>{home}</span>
            <span className="home-score__sep" aria-hidden>
              :
            </span>
            <span>{away}</span>
          </div>
          <TeamFace name={match.awayName} logo={match.awayLogo} role="Visita" />
        </div>
        {note ? <p className="home-live__note">{note}</p> : null}
        {place ? (
          <div className="home-card__foot">
            <MapPin size={15} aria-hidden />
            <span>{place}</span>
          </div>
        ) : null}
      </Link>
      {actions ? <div className="home-fixture__admin">{actions}</div> : null}
    </article>
  );
}

function TeamFace({ name, logo, role }: { name: string; logo: string | null; role: string }) {
  return (
    <div className="home-team-face">
      <span className="home-crest home-crest--lg">
        <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
      </span>
      <span className="home-team-face__name" title={name}>
        {name}
      </span>
      <span className="home-team-face__role">{role}</span>
    </div>
  );
}
