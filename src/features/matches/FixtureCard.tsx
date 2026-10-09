import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Trophy, X } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import MatchScheduleForm from "./MatchScheduleForm";
import type { UpcomingMatchView } from "./matchesViewState";

/** Tarjeta «Carbón y Oro» de próximo partido (portada y /partidos); el superadmin la programa ahí mismo. */
export default function FixtureCard({
  match,
  admin = false,
  editing = false,
  onEdit,
  onSaved,
  actions,
}: {
  match: UpcomingMatchView;
  admin?: boolean;
  /** El padre decide cuál está abierta: solo un formulario a la vez. */
  editing?: boolean;
  onEdit?: (id: string | null) => void;
  onSaved?: () => void;
  /** Botones extra del superadmin (p. ej. «Marcador» en la ficha de torneo), junto a «Programar». */
  actions?: ReactNode;
}) {
  const canEdit = admin && Boolean(match.id) && Boolean(onEdit);
  const open = canEdit && editing;
  return (
    <article className="home-card home-fixture">
      <Link to={match.href} className="home-fixture__link">
        <div className="home-fixture__head">
          {match.isoDate ? (
            <time className="home-fixture__date" dateTime={match.isoDate} aria-label={match.dateLabel}>
              <span className="home-fixture__day">{match.day}</span>
              <span className="home-fixture__month">{match.month}</span>
            </time>
          ) : (
            <span className="home-fixture__date is-tbd" aria-label="Fecha por definir">
              <span className="home-fixture__month">Por</span>
              <span className="home-fixture__month">definir</span>
            </span>
          )}
          <div className="home-fixture__when">
            <strong className={match.timeLabel ? undefined : "is-tbd"}>
              {match.timeLabel || "Hora por definir"}
            </strong>
            <span title={match.venue || undefined}>{match.venue || "Sede por definir"}</span>
          </div>
          {match.categoryName ? (
            <span className="home-chip" title={match.categoryName}>
              {match.categoryName}
            </span>
          ) : null}
        </div>
        <div className="home-fixture__teams">
          <FixtureTeam name={match.homeName} logo={match.homeLogo} role="Local" />
          <FixtureTeam name={match.awayName} logo={match.awayLogo} role="Visita" />
        </div>
        {match.tournamentName ? (
          <div className="home-card__foot">
            <Trophy size={14} aria-hidden />
            <span>{match.tournamentName}</span>
          </div>
        ) : null}
      </Link>
      {canEdit || actions ? (
        <div className="home-fixture__admin">
          {canEdit ? (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onEdit?.(open ? null : match.id)}
            >
              {open ? <X size={16} aria-hidden /> : <CalendarClock size={16} aria-hidden />}
              {open ? "Cerrar" : match.time ? "Reprogramar" : "Programar"}
            </button>
          ) : null}
          {actions}
        </div>
      ) : null}
      {open ? (
        <MatchScheduleForm
          match={{
            id: match.id,
            isoDate: match.isoDate,
            time: match.time,
            venue: match.venueText,
            courtId: match.courtId,
            homeClubId: match.homeClubId,
            awayClubId: match.awayClubId,
          }}
          durationMinutes={match.durationMinutes}
          startDate={match.tournamentStartDate}
          onCancel={() => onEdit?.(null)}
          onSaved={() => {
            onEdit?.(null);
            onSaved?.();
          }}
        />
      ) : null}
    </article>
  );
}

function FixtureTeam({ name, logo, role }: { name: string; logo: string | null; role: string }) {
  return (
    <div className="home-fixture__team">
      <span className="home-crest">
        <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
      </span>
      <span className="home-fixture__name" title={name}>
        {name}
      </span>
      <span className="home-fixture__role">{role}</span>
    </div>
  );
}
