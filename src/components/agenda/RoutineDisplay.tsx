import { useState } from "react";
import {
  Droplet,
  Clock,
  ListChecks,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { C, RADIUS, SHADOWS } from "../../components/ui";

export default function RoutineDisplay({ routine }: { routine: any }) {
  const [isMainExpanded, setIsMainExpanded] = useState(false);
  const [collapsedPhases, setCollapsedPhases] = useState<
    Record<string, boolean>
  >({});

  // ✅ CORRECCIÓN: togglePhase ahora usa el valor por defecto (true) al alternar
  const togglePhase = (id: string) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true), // si no existe, se toma como colapsado (true)
    }));
  };

  if (!routine || routine.length === 0) return null;

  // Compatibilidad con rutinas antiguas (texto plano)
  if (typeof routine === "string") {
    return (
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.md,
          border: `1px solid ${C.gray200}`,
          marginTop: "1rem",
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setIsMainExpanded(!isMainExpanded)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            backgroundColor: C.navy50,
            border: "none",
            borderBottom: isMainExpanded ? `1px solid ${C.gray200}` : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontWeight: "700",
            color: C.navy900,
            fontSize: "0.8125rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ListChecks size={16} color={C.amber} /> Plan de Entrenamiento
          </div>
          {isMainExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isMainExpanded && (
          <div style={{ padding: "1rem", animation: "fadeIn 0.2s ease" }}>
            <p
              style={{
                whiteSpace: "pre-wrap",
                color: C.gray600,
                fontSize: "0.8125rem",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {routine}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Nuevo formato (Array de bloques)
  return (
    <div
      style={{
        backgroundColor: C.white,
        borderRadius: RADIUS.md,
        border: `1px solid ${C.gray200}`,
        marginTop: "1rem",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setIsMainExpanded(!isMainExpanded)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          backgroundColor: C.navy50,
          border: "none",
          borderBottom: isMainExpanded ? `1px solid ${C.gray200}` : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontWeight: "700",
          color: C.navy900,
          fontSize: "0.8125rem",
          transition: "background-color 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ListChecks size={16} color={C.amber} />
          Ver Plan de Entrenamiento
        </div>
        {isMainExpanded ? (
          <ChevronUp size={16} color={C.navy600} />
        ) : (
          <ChevronDown size={16} color={C.navy600} />
        )}
      </button>

      {isMainExpanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            padding: "1rem",
            backgroundColor: C.gray50,
            animation: "fadeIn 0.2s ease",
          }}
        >
          {routine.map((block: any, idx: number) => {
            if (block.type === "hydration") {
              return (
                <div
                  key={block.id}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "0.25rem 0",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "#e0f2fe",
                      color: "#0284c7",
                      padding: "0.4rem 1rem",
                      borderRadius: RADIUS.full,
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      boxShadow: SHADOWS.sm,
                    }}
                  >
                    <Droplet size={14} /> Pausa de Hidratación{" "}
                    {block.duration ? `(${block.duration} min)` : ""}
                  </span>
                </div>
              );
            }

            if (block.type === "phase") {
              // ✅ Fallback por si exercises no es un array
              const exercises = block.exercises || [];
              const totalMins = exercises.reduce(
                (sum: number, ex: any) => sum + (Number(ex.duration) || 0),
                0,
              );

              // ✅ Ahora el valor por defecto es true (colapsado)
              const isCollapsed = collapsedPhases[block.id] ?? true;

              return (
                <div
                  key={block.id}
                  style={{
                    backgroundColor: C.white,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${C.gray200}`,
                    overflow: "hidden",
                    boxShadow: SHADOWS.sm,
                  }}
                >
                  <div
                    onClick={() => togglePhase(block.id)}
                    style={{
                      backgroundColor: C.white,
                      padding: "0.6rem 1rem",
                      borderBottom: isCollapsed
                        ? "none"
                        : `1px solid ${C.gray100}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {isCollapsed ? (
                        <ChevronDown size={14} color={C.gray400} />
                      ) : (
                        <ChevronUp size={14} color={C.gray400} />
                      )}
                      <span
                        style={{
                          fontWeight: "700",
                          color: C.navy800,
                          fontSize: "0.8125rem",
                        }}
                      >
                        {block.title || `Fase ${idx + 1}`}
                      </span>
                    </div>
                    {totalMins > 0 && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: C.gray500,
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        <Clock size={12} /> {totalMins} min
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {exercises.length === 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: C.gray400,
                            fontStyle: "italic",
                          }}
                        >
                          Sin ejercicios asignados.
                        </span>
                      )}

                      {exercises.map((ex: any) => {
                        const ytMatch = ex.link?.match(
                          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/,
                        );
                        return (
                          <div
                            key={ex.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.4rem",
                              borderBottom: `1px dashed ${C.gray100}`,
                              paddingBottom: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  color: C.navy800,
                                  fontWeight: "500",
                                }}
                              >
                                <span
                                  style={{
                                    color: C.amber,
                                    marginRight: "0.4rem",
                                    fontWeight: "800",
                                  }}
                                >
                                  •
                                </span>
                                {ex.name}
                              </span>
                              {ex.duration && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: C.gray500,
                                    backgroundColor: C.gray100,
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: RADIUS.sm,
                                    whiteSpace: "nowrap",
                                    marginLeft: "0.5rem",
                                  }}
                                >
                                  {ex.duration} min
                                </span>
                              )}
                            </div>

                            {ytMatch ? (
                              <div
                                style={{
                                  marginTop: "0.25rem",
                                  borderRadius: RADIUS.sm,
                                  overflow: "hidden",
                                  border: `1px solid ${C.gray200}`,
                                }}
                              >
                                <iframe
                                  width="100%"
                                  height="180"
                                  src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              </div>
                            ) : ex.link ? (
                              <a
                                href={ex.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.7rem",
                                  color: C.white,
                                  backgroundColor: C.navy900,
                                  padding: "0.35rem 0.75rem",
                                  borderRadius: RADIUS.full,
                                  textDecoration: "none",
                                  fontWeight: "600",
                                  alignSelf: "flex-start",
                                  marginLeft: "0.8rem",
                                }}
                              >
                                <ExternalLink size={12} /> Abrir Referencia
                              </a>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
