import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getDocs } from "firebase/firestore";
import { ChevronRight, Goal, Trophy } from "lucide-react";
import { clubCol } from "../../lib/paths";
import type { ClubSummary, ScorerRow, StandingRow } from "../../lib/types";
import { DEFAULT_CLUB_LOGO } from "../../lib/clubDefaults";
import { C, RADIUS, SHADOWS, SectionCard } from "../ui";
import { LoadMoreButton } from "./ClubDirectoryList";

const STAT_HEADERS = ["PJ", "G", "E", "P", "GF", "GC", "DG", "Pts"] as const;

export function StandingsTable({
  standings,
  clubsById,
  clubNames,
  loading,
  title = "Tabla de posiciones",
  pageSize,
}: {
  standings: StandingRow[];
  clubsById: Record<string, ClubSummary>;
  clubNames: Record<string, string>;
  loading: boolean;
  title?: string;
  pageSize?: number;
}) {
  const [visible, setVisible] = useState(pageSize ?? standings.length);
  const standingsKey = standings.map((r) => r.clubId).join("|");

  useEffect(() => {
    setVisible(pageSize ?? standings.length);
  }, [pageSize, standingsKey, standings.length]);

  const rows = pageSize ? standings.slice(0, visible) : standings;
  const hasMore = Boolean(pageSize && standings.length > visible);

  return (
    <SectionCard
      title={title}
      icon={<Trophy size={16} />}
      style={{ marginBottom: "1.25rem" }}
    >
      {loading ? (
        <p style={{ color: C.gray400, margin: 0 }}>Cargando...</p>
      ) : standings.length === 0 ? (
        <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
          Sin partidos oficiales en este filtro.
        </p>
      ) : (
        <>
        <HScrollHint>
          <table
            style={{
              width: "100%",
              minWidth: 560,
              borderCollapse: "collapse",
              tableLayout: "fixed",
              fontSize: "0.8rem",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <colgroup>
              <col style={{ width: 36 }} />
              <col />
              {STAT_HEADERS.map((h) => (
                <col key={h} style={{ width: 44 }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "center" }}>#</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Club</th>
                {STAT_HEADERS.map((h) => (
                  <th key={h} style={{ ...thStyle, textAlign: "center" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const club = clubsById[row.clubId];
                const stats = [
                  row.pj,
                  row.g,
                  row.e,
                  row.p,
                  row.gf,
                  row.gc,
                  row.dg,
                  row.pts,
                ];
                return (
                  <tr key={row.clubId} style={{ borderTop: `1px solid ${C.gray100}` }}>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 800, color: C.gray500 }}>
                      {i + 1}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {club ? (
                        <Link
                          to={`/${club.slug}`}
                          style={{
                            color: C.navy900,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 0,
                          }}
                        >
                          <img
                            src={club.logoUrl || DEFAULT_CLUB_LOGO}
                            alt=""
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {club.name}
                          </span>
                        </Link>
                      ) : (
                        clubNames[row.clubId] || row.clubId
                      )}
                    </td>
                    {stats.map((n, idx) => (
                      <td
                        key={STAT_HEADERS[idx]}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          fontWeight: idx === stats.length - 1 ? 800 : 600,
                          color: idx === stats.length - 1 ? C.navy900 : C.gray700,
                        }}
                      >
                        {n}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </HScrollHint>
        {hasMore && pageSize ? (
          <LoadMoreButton onClick={() => setVisible((n) => n + pageSize)} />
        ) : null}
        </>
      )}
    </SectionCard>
  );
}

export function ScorersTable({
  scorers,
  clubsById,
  clubNames,
}: {
  scorers: ScorerRow[];
  clubsById: Record<string, ClubSummary>;
  clubNames: Record<string, string>;
}) {
  const top = scorers.slice(0, 5);
  const photos = usePlayerPhotos(top);

  return (
    <SectionCard
      title="Goleadores"
      icon={<Goal size={16} />}
      style={{ marginBottom: "1.25rem" }}
    >
      {top.length === 0 ? (
        <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
          Sin goles registrados todavía.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {top.map((s, i) => {
            const club = clubsById[s.clubId];
            const key = `${s.clubId}:${s.playerId}`;
            const photo = photos[key];
            const gold = i === 0;
            return (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "22px 36px minmax(0, 1fr) 3.25rem",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.5rem 0.55rem",
                  borderRadius: RADIUS.md,
                  border: `1px solid ${gold ? C.amber : C.gray200}`,
                  backgroundColor: gold ? C.amberLight : C.gray50,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    color: gold ? C.amber : C.gray500,
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </div>
                <img
                  src={playerPhotoSrc(s.name, photo)}
                  alt=""
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: gold ? `2px solid ${C.amber}` : `1px solid ${C.gray200}`,
                    backgroundColor: C.white,
                  }}
                  onError={(e) => {
                    e.currentTarget.src = avatarFallback(s.name);
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      color: C.navy900,
                      lineHeight: 1.25,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.72rem",
                      color: C.gray500,
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    <img
                      src={club?.logoUrl || DEFAULT_CLUB_LOGO}
                      alt=""
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <span>{club?.name || clubNames[s.clubId] || s.clubId}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "1rem",
                      color: C.navy900,
                      lineHeight: 1.1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.goals}
                  </div>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, color: C.gray500 }}>
                    {s.goals === 1 ? "gol" : "goles"}
                  </div>
                  {s.assists ? (
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: C.gray400 }}>
                      {s.assists} asist.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          {scorers.length > 5 ? (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: C.gray400 }}>
              Top 5 de {scorers.length} jugadores con gol o asistencia.
            </p>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

const thStyle: CSSProperties = {
  padding: "0.45rem 0.25rem",
  fontSize: "0.68rem",
  fontWeight: 800,
  color: C.gray500,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "0.55rem 0.25rem",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

function HScrollHint({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const overflow = max > 8;
      setMore({
        left: overflow && el.scrollLeft > 6,
        right: overflow && el.scrollLeft < max - 6,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={ref}
        title={more.right || more.left ? "Desliza para ver más columnas" : undefined}
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
        }}
      >
        {children}
      </div>
      {more.left && (
        <div
          aria-hidden
          style={{
            ...edgeFade,
            left: 0,
            background: `linear-gradient(to right, ${C.white}, transparent)`,
          }}
        />
      )}
      {more.right && (
        <div
          aria-hidden
          style={{
            ...edgeFade,
            right: 0,
            width: 40,
            background: `linear-gradient(to left, ${C.white} 35%, transparent)`,
            justifyContent: "flex-end",
            paddingRight: 4,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              boxShadow: SHADOWS.sm,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={14} color={C.navy900} strokeWidth={2.5} />
          </span>
        </div>
      )}
    </div>
  );
}

const edgeFade: CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 28,
  display: "flex",
  alignItems: "center",
};

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Jugador")}&background=121212&color=fff&size=80`;
}

function playerPhotoSrc(name: string, imageUrl?: string) {
  return imageUrl || avatarFallback(name);
}

function usePlayerPhotos(rows: ScorerRow[]) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const keys = rows.map((r) => `${r.clubId}:${r.playerId}`).join("|");

  useEffect(() => {
    if (rows.length === 0) {
      setPhotos({});
      return;
    }
    let cancelled = false;
    const clubIds = [...new Set(rows.map((r) => r.clubId))];
    void Promise.all(
      clubIds.map(async (clubId) => {
        const snap = await getDocs(clubCol(clubId, "players"));
        return snap.docs.map((d) => {
          const data = d.data() as { name?: string; imageUrl?: string };
          return {
            clubId,
            id: d.id,
            name: data.name || "",
            imageUrl: data.imageUrl || "",
          };
        });
      }),
    )
      .then((groups) => {
        if (cancelled) return;
        const players = groups.flat();
        const next: Record<string, string> = {};
        for (const r of rows) {
          const key = `${r.clubId}:${r.playerId}`;
          const found =
            players.find((p) => p.clubId === r.clubId && p.id === r.playerId) ||
            players.find(
              (p) =>
                p.clubId === r.clubId &&
                p.name.toLowerCase() === r.name.toLowerCase(),
            ) ||
            players.find(
              (p) =>
                p.clubId === r.clubId &&
                p.name.toLowerCase() === r.playerId.toLowerCase(),
            );
          next[key] = found?.imageUrl || "";
        }
        setPhotos(next);
      })
      .catch(() => {
        if (!cancelled) setPhotos({});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return photos;
}
