import { Droplet, Plus, Trash2, X, ListChecks } from "lucide-react";
import { C, RADIUS, FormInput, SecondaryButton } from "../../components/ui";

export default function RoutineBuilder({
  routine,
  onChange,
}: {
  routine: any[];
  onChange: (r: any[]) => void;
}) {
  const addPhase = () =>
    onChange([
      ...routine,
      {
        type: "phase",
        id: Date.now().toString(),
        title: `Fase ${routine.filter((b) => b.type === "phase").length + 1}`,
        exercises: [],
      },
    ]);
  const addHydration = () =>
    onChange([
      ...routine,
      { type: "hydration", id: Date.now().toString(), duration: "2" },
    ]);

  const updateBlock = (id: string, updates: any) =>
    onChange(routine.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  const removeBlock = (id: string) =>
    onChange(routine.filter((b) => b.id !== id));

  const addExercise = (phaseId: string) => {
    onChange(
      routine.map((b) =>
        b.type === "phase" && b.id === phaseId
          ? {
              ...b,
              exercises: [
                ...b.exercises,
                { id: Date.now().toString(), name: "", duration: "", link: "" },
              ],
            }
          : b,
      ),
    );
  };

  const updateExercise = (
    phaseId: string,
    exId: string,
    field: string,
    value: string,
  ) => {
    onChange(
      routine.map((b) =>
        b.type === "phase" && b.id === phaseId
          ? {
              ...b,
              exercises: b.exercises.map((ex: any) =>
                ex.id === exId ? { ...ex, [field]: value } : ex,
              ),
            }
          : b,
      ),
    );
  };

  const removeExercise = (phaseId: string, exId: string) => {
    onChange(
      routine.map((b) =>
        b.type === "phase" && b.id === phaseId
          ? { ...b, exercises: b.exercises.filter((ex: any) => ex.id !== exId) }
          : b,
      ),
    );
  };

  return (
    <div
      style={{
        backgroundColor: C.gray50,
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.md,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <p
        style={{
          margin: 0,
          fontWeight: "700",
          color: C.navy900,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.875rem",
        }}
      >
        <ListChecks size={16} color={C.amber} /> Estructura del Entrenamiento
      </p>

      {!routine || routine.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            color: C.gray400,
            fontSize: "0.8125rem",
            fontStyle: "italic",
            margin: "1rem 0",
          }}
        >
          Agrega fases o pausas para estructurar tu sesión.
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {routine.map((block) => (
            <div
              key={block.id}
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              {block.type === "hydration" ? (
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#e0f2fe",
                    border: "1px solid #bae6fd",
                    borderRadius: RADIUS.md,
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Droplet size={16} color="#0284c7" />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "#0284c7",
                      fontWeight: "600",
                    }}
                  >
                    Pausa (min):
                  </span>
                  <FormInput
                    type="number"
                    min="1"
                    value={block.duration}
                    onChange={(e) =>
                      updateBlock(block.id, { duration: e.target.value })
                    }
                    style={{ width: "60px", padding: "0.2rem 0.5rem" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    backgroundColor: C.white,
                    border: `1px solid ${C.gray200}`,
                    borderRadius: RADIUS.md,
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <FormInput
                    value={block.title}
                    onChange={(e) =>
                      updateBlock(block.id, { title: e.target.value })
                    }
                    placeholder="Nombre de la Fase (Ej. Calentamiento)"
                    style={{ fontWeight: "700", backgroundColor: C.gray50 }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {block.exercises.map((ex: any) => (
                      <div
                        key={ex.id}
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                          alignItems: "center",
                          backgroundColor: C.gray50,
                          padding: "0.4rem",
                          borderRadius: RADIUS.sm,
                        }}
                      >
                        <FormInput
                          value={ex.name}
                          onChange={(e) =>
                            updateExercise(
                              block.id,
                              ex.id,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="Descripción del ejercicio..."
                          style={{ flex: "1 1 120px", fontSize: "0.75rem" }}
                        />
                        <FormInput
                          type="number"
                          value={ex.duration}
                          onChange={(e) =>
                            updateExercise(
                              block.id,
                              ex.id,
                              "duration",
                              e.target.value,
                            )
                          }
                          placeholder="Min"
                          style={{ width: "60px", fontSize: "0.75rem" }}
                        />
                        <FormInput
                          type="url"
                          value={ex.link}
                          onChange={(e) =>
                            updateExercise(
                              block.id,
                              ex.id,
                              "link",
                              e.target.value,
                            )
                          }
                          placeholder="URL Video / Info"
                          style={{ flex: "1 1 100px", fontSize: "0.75rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(block.id, ex.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.red,
                            cursor: "pointer",
                            padding: "0.2rem",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addExercise(block.id)}
                    style={{
                      background: "none",
                      border: `1px dashed ${C.gray300}`,
                      color: C.navy600,
                      padding: "0.4rem",
                      borderRadius: RADIUS.sm,
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      gap: "0.3rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <Plus size={14} /> Añadir Ejercicio
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.gray400,
                  cursor: "pointer",
                  padding: "0.5rem 0.2rem",
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 👇 AQUÍ ESTÁ LA MAGIA RESPONSIVA DE LOS BOTONES 👇 */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <SecondaryButton
          type="button"
          onClick={addPhase}
          style={{
            flex: "1 1 130px", // 👈 Clave para que se apilen en celulares muy pequeños
            display: "flex",
            gap: "0.4rem",
            justifyContent: "center",
            alignItems: "center", // 👈 Alinea el ícono y el texto perfectamente
            padding: "0.75rem",
            whiteSpace: "nowrap",
          }}
        >
          <ListChecks size={16} /> + Fase
        </SecondaryButton>
        <SecondaryButton
          type="button"
          onClick={addHydration}
          style={{
            flex: "1 1 130px", // 👈 Clave para el Responsive
            display: "flex",
            gap: "0.4rem",
            justifyContent: "center",
            alignItems: "center",
            padding: "0.75rem",
            color: "#0284c7",
            backgroundColor: "#f0f9ff", // 👈 Fondo azulito muy suave para que destaque
            borderColor: "#bae6fd",
            whiteSpace: "nowrap",
          }}
        >
          <Droplet size={16} /> + Hidratación
        </SecondaryButton>
      </div>
    </div>
  );
}
