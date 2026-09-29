import { Link } from "react-router-dom";
import { Trophy, Medal, Award } from "lucide-react";
import { C, RADIUS, SectionCard } from "../ui";
import { positionLabel } from "../../lib/stats";
import type { Tournament } from "../../lib/types";
import { footballTypeLabel } from "../../lib/types";

interface Props {
  trophies: { tournament: Tournament; position: number }[];
  seasonName: Record<string, string>;
  categoryName: Record<string, string>;
}

const medalColor = (pos: number) =>
  pos === 1 ? "#d4af37" : pos === 2 ? "#a8a9ad" : pos === 3 ? "#b08d57" : C.gray400;

/** Vitrina de trofeos del club: torneos donde terminó en el podio. */
export default function ClubTrophyCase({ trophies, seasonName, categoryName }: Props) {
  return (
    <SectionCard title="Vitrina de trofeos" icon={<Trophy size={16} />}>
      {trophies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: C.gray400 }}>
          <Trophy size={32} color={C.gray300} />
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", fontWeight: 600 }}>
            La vitrina está esperando su primer trofeo.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {trophies.map(({ tournament, position }) => (
            <Link
              key={tournament.id}
              to={`/torneos/${tournament.id}`}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.35rem",
                padding: "1rem 0.75rem",
                borderRadius: RADIUS.lg,
                border: `1px solid ${C.gray200}`,
                background: `linear-gradient(180deg, ${C.white} 0%, ${C.gray50} 100%)`,
                textAlign: "center",
              }}
            >
              {position === 1 ? (
                <Trophy size={32} color={medalColor(position)} />
              ) : position <= 3 ? (
                <Medal size={32} color={medalColor(position)} />
              ) : (
                <Award size={32} color={medalColor(position)} />
              )}
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: medalColor(position), textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {positionLabel(position)}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: C.gray800, lineHeight: 1.2 }}>
                {tournament.name}
              </span>
              <span style={{ fontSize: "0.7rem", color: C.gray500 }}>
                {[
                  seasonName[tournament.seasonId],
                  categoryName[tournament.categoryId],
                  footballTypeLabel(tournament.footballType),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
