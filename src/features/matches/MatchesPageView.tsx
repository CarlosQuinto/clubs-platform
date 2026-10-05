import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Search } from "lucide-react";
import { PageTitle } from "../shell/ArchiveUI";
import PlatformLayout from "../shell/PlatformLayout";
import { usePlatformChrome } from "../shell/usePlatformChrome";
import { C, FormInput, FormSelect, RADIUS } from "../../shared/ui";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { useAuth } from "../../domains/auth/AuthContext";
import {
  dataConnect,
  QueryFetchPolicy,
  scheduleCourts,
  scheduleOfficialMatch,
} from "../../infrastructure/dataconnect";
import { useMatchesPage } from "./useMatchesPage";
import type { UpcomingMatchView } from "./matchesViewState";

export default function MatchesPageView() {
  const screen = useMatchesPage();
  const { isSuperAdmin } = useAuth();
  const { courtsEnabled } = usePlatformChrome(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    void scheduleCourts(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => setCourts(result.data.courts))
      .catch((err: unknown) => console.error(err));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (screen.loading || !screen.hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) screen.onMore();
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [screen.loading, screen.hasMore, screen.onMore, screen.matches.length]);

  return (
    <PlatformLayout>
      <PageTitle
        icon={<Calendar size={22} color="#cd9a40" />}
        subtitle="Próximos partidos de torneos vigentes."
      >
        Partidos
      </PageTitle>
      {screen.error ? (
        <p style={{ color: C.red, fontSize: "0.9rem" }}>
          {screen.error}{" "}
          <button type="button" onClick={screen.onRefresh} style={retryButton}>
            Reintentar
          </button>
        </p>
      ) : null}
      {screen.loading && screen.matches.length === 0 && screen.tournaments.length === 0 ? (
        <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando partidos…</p>
      ) : (
        <>
          <div className="matches-filter-bar">
            <FormSelect
              value={screen.tournamentId}
              onChange={(event) => screen.onTournamentChange(event.target.value)}
              aria-label="Torneo"
            >
              <option value="">Todos los torneos</option>
              {screen.tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.label}
                </option>
              ))}
            </FormSelect>
            <label className="matches-filter-bar__search">
              <Search size={14} color={C.gray400} />
              <FormInput
                value={screen.query}
                onChange={(event) => screen.onSearch(event.target.value)}
                maxLength={30}
                placeholder="Buscar por equipo"
                aria-label="Buscar por equipo"
              />
            </label>
          </div>
          {screen.matches.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "1.5rem",
                textAlign: "center",
                color: C.gray400,
                backgroundColor: C.white,
                border: `1px dashed ${C.gray300}`,
                borderRadius: RADIUS.lg,
                fontSize: "0.85rem",
              }}
            >
              No hay partidos con esos filtros.
            </p>
          ) : (
            <>
              <div className="match-list">
                <div className="match-list__grid">
                  {screen.matches.map((match, index) => (
                    <MatchCard
                      key={match.id || `${match.tournamentHref}-${index}`}
                      match={match}
                      admin={isSuperAdmin}
                      courts={courts}
                      courtsEnabled={courtsEnabled}
                      onScheduled={screen.onRefresh}
                    />
                  ))}
                </div>
              </div>
              {screen.hasMore ? <div ref={sentinelRef} style={{ height: 1 }} /> : null}
            </>
          )}
        </>
      )}
    </PlatformLayout>
  );
}

function MatchCard({
  match,
  admin,
  courts,
  courtsEnabled,
  onScheduled,
}: {
  match: UpcomingMatchView;
  admin: boolean;
  courts: { id: string; name: string }[];
  /** Con la renta de canchas activa, la sede es la cancha elegida y no se escribe «Lugar». */
  courtsEnabled: boolean;
  onScheduled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(match.isoDate);
  const [time, setTime] = useState("19:00");
  const [venue, setVenue] = useState(match.venue || "");
  const [courtId, setCourtId] = useState(match.courtId || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!date || !time) return;
    try {
      setBusy(true);
      const result = await scheduleOfficialMatch(dataConnect, {
        id: match.id,
        matchDate: date,
        startTime: time,
        venue: courtsEnabled ? courts.find((court) => court.id === courtId)?.name || "" : venue,
        courtId: courtId || null,
      });
      if (!result.data.match) {
        window.alert("No se pudo programar el partido.");
        return;
      }
      setOpen(false);
      onScheduled();
    } catch (err) {
      console.error(err);
      window.alert("No se pudo programar el partido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="match-card">
      <Link to={match.tournamentHref} className="match-card" style={{ display: "contents" }}>
        <time className="match-card__date" dateTime={match.isoDate} aria-label={match.dateLabel}>
          <span className="match-card__day">{match.day}</span>
          <span className="match-card__month">{match.month}</span>
          <span className="match-card__year">{match.year}</span>
        </time>
        <div className="match-card__body">
          <Side name={match.homeName} logo={match.homeLogo} />
          <Side name={match.awayName} logo={match.awayLogo} />
          {match.subtitle ? <div className="match-card__comp">{match.subtitle}</div> : null}
          {(match.timeLabel || match.venue) && (
            <div className="match-card__when">
              {match.timeLabel ? (
                <span className="match-card__time">
                  <span className="match-card__dot" aria-hidden />
                  {match.timeLabel}
                </span>
              ) : null}
              {match.venue ? <span className="match-card__venue">{match.venue}</span> : null}
            </div>
          )}
        </div>
      </Link>
      {admin && match.id ? (
        <div style={{ padding: "0 0.75rem 0.75rem" }}>
          <button type="button" onClick={() => setOpen((value) => !value)} style={scheduleButton}>
            Programar
          </button>
          {open ? (
            <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.45rem" }}>
              <FormInput type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Fecha" />
              <FormInput type="time" value={time} onChange={(event) => setTime(event.target.value)} aria-label="Hora" />
              {courtsEnabled ? null : (
                <FormInput value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Lugar" aria-label="Lugar" />
              )}
              <FormSelect value={courtId} onChange={(event) => setCourtId(event.target.value)} aria-label="Cancha">
                <option value="">Sin cancha</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </FormSelect>
              <button type="button" disabled={busy} onClick={() => void save()} style={scheduleButton}>
                {busy ? "Guardando..." : "Guardar horario"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Side({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="match-card__side">
      <span className="match-card__crest">
        <img src={logo || DEFAULT_CLUB_LOGO} alt="" />
      </span>
      <span className="match-card__club" title={name}>
        {name}
      </span>
    </div>
  );
}

const scheduleButton = {
  border: "none",
  background: "transparent",
  color: C.navy900,
  fontWeight: 800,
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: 0,
} as const;

const retryButton = {
  color: C.navy900,
  fontWeight: 700,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
} as const;
