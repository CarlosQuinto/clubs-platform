import { Link } from "react-router-dom";
import { ChevronRight, Phone, Shield } from "lucide-react";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import type { ClubSummary } from "../../shared/types";
import { C, RADIUS, SecondaryButton } from "../../shared/ui";

export const CLUB_PAGE_SIZE = 5;

const moreBtnStyle = {
  padding: "0.4rem 0.9rem",
  fontSize: "0.78rem",
  fontWeight: 800,
} as const;

export function LoadMoreButton({
  onClick,
  to,
  label = "Ver más",
}: {
  onClick?: () => void;
  to?: string;
  label?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "0.85rem" }}>
      {to ? (
        <Link
          to={to}
          style={{
            ...moreBtnStyle,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${C.gray300}`,
            borderRadius: RADIUS.md,
            color: C.navy900,
            textDecoration: "none",
            background: C.white,
          }}
        >
          {label}
        </Link>
      ) : (
        <SecondaryButton type="button" onClick={onClick} style={moreBtnStyle}>
          {label}
        </SecondaryButton>
      )}
    </div>
  );
}

function DirectoryCard({
  club,
  localityName,
  clone,
}: {
  club: ClubSummary;
  localityName: (club: ClubSummary) => string;
  clone?: boolean;
}) {
  const phone = club.presidentPhone?.trim() || "";
  return (
    <article className="club-dir-card">
      <Link
        to={`/${club.slug || club.id}`}
        className="club-dir-card__main"
        tabIndex={clone ? -1 : undefined}
      >
        <div className="club-dir-card__logo">
          <img src={club.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
        </div>
        <div className="club-dir-card__copy">
          <div className="club-dir-card__name">{club.name}</div>
          <div className="club-dir-card__meta">
            {localityName(club) || `/${club.slug}`}
          </div>
        </div>
        <ChevronRight size={16} color={C.gray400} />
      </Link>
      {phone ? (
        <a
          className="club-dir-card__phone"
          href={`tel:${phone.replace(/\s+/g, "")}`}
          tabIndex={clone ? -1 : undefined}
        >
          <Phone size={13} />
          Presidente: {phone}
        </a>
      ) : null}
    </article>
  );
}

export default function ClubDirectoryList({
  clubs,
  localityName,
  hasMore,
  onMore,
  moreTo,
  emptyLabel,
  marquee,
}: {
  clubs: ClubSummary[];
  localityName: (club: ClubSummary) => string;
  hasMore?: boolean;
  onMore?: () => void;
  moreTo?: string;
  emptyLabel?: string;
  marquee?: boolean;
}) {
  if (clubs.length === 0) {
    return (
      <div className="club-dir-empty">
        <Shield size={32} color={C.gray300} />
        <div>{emptyLabel || "Todavía no hay clubes publicados."}</div>
      </div>
    );
  }

  const cards = (clone: boolean) =>
    clubs.map((club) => (
      <DirectoryCard
        key={`${club.id}-${clone ? "b" : "a"}`}
        club={club}
        localityName={localityName}
        clone={clone}
      />
    ));

  if (marquee) {
    return (
      <div className="club-dir-marquee">
        <div className="club-dir-grid is-marquee">
          <div className="club-dir-marquee__set">{cards(false)}</div>
          <div className="club-dir-marquee__set" aria-hidden="true">
            {cards(true)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="club-dir-grid">{cards(false)}</div>
      {hasMore && (moreTo || onMore) ? (
        <LoadMoreButton onClick={onMore} to={moreTo} />
      ) : null}
    </>
  );
}
