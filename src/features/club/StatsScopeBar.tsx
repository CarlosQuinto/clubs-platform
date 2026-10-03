import { Filter } from "lucide-react";
import { FormSelect } from "../../shared/ui";
import type { Category, Season, StatsScope } from "../../shared/types";

interface Props {
  scope: StatsScope;
  onChange: (scope: StatsScope) => void;
  seasons: Season[];
  categories: Category[];
}

/** Filtro de estadísticas: histórico o por temporada / categoría. */
export default function StatsScopeBar({ scope, onChange, seasons, categories }: Props) {
  return (
    <div className="stats-scope-bar">
      <span className="stats-scope-bar__label">
        <Filter size={12} /> Estadísticas
      </span>
      <FormSelect
        value={scope.seasonId || ""}
        onChange={(e) => onChange({ ...scope, seasonId: e.target.value || undefined })}
        aria-label="Temporada"
      >
        <option value="">Histórico (todas las temporadas)</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        value={scope.categoryId || ""}
        onChange={(e) => onChange({ ...scope, categoryId: e.target.value || undefined })}
        aria-label="Categoría"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}
