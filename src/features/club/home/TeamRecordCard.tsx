import { BarChart3, TrendingUp, TrendingDown, Minus, Goal, Shield } from "lucide-react";
import { C, SectionCard, StatBox } from "../../../shared/ui";
import type { StandingRow } from "../../../shared/types";

interface Props {
  record: StandingRow;
  scopeLabel: string;
}

/** Récord oficial del equipo (partidos de torneo) según el filtro activo. */
export default function TeamRecordCard({ record, scopeLabel }: Props) {
  const effectiveness =
    record.pj > 0 ? Math.round((record.pts / (record.pj * 3)) * 100) : 0;

  return (
    <SectionCard
      title={`Récord oficial · ${scopeLabel}`}
      icon={<BarChart3 size={16} />}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <StatBox icon={<Shield size={18} color={C.navy600} />} label="Jugados" value={record.pj} />
        <StatBox
          icon={<TrendingUp size={18} color={C.green} />}
          label="Ganados"
          value={record.g}
          valueColor={C.green}
        />
        <StatBox icon={<Minus size={18} color={C.gray500} />} label="Empatados" value={record.e} />
        <StatBox
          icon={<TrendingDown size={18} color={C.red} />}
          label="Perdidos"
          value={record.p}
          valueColor={C.red}
        />
        <StatBox
          icon={<Goal size={18} color={C.navy600} />}
          label="Goles (GF-GC)"
          value={`${record.gf}-${record.gc}`}
        />
        <StatBox
          icon={<BarChart3 size={18} color={C.amber} />}
          label="Efectividad"
          value={`${effectiveness}%`}
          valueColor={C.amber}
        />
      </div>
      {record.pj === 0 && (
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.75rem", color: C.gray400, textAlign: "center" }}>
          Sin partidos oficiales registrados en este periodo.
        </p>
      )}
    </SectionCard>
  );
}
