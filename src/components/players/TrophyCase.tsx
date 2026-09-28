import React, { useState } from "react";
import { Medal, ChevronDown, ChevronUp } from "lucide-react";
import { C, RADIUS, SHADOWS } from "../../components/ui";

export interface Achievement {
  id: number;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

interface TrophyCaseProps {
  achievements: Achievement[];
}

export default function TrophyCase({ achievements }: TrophyCaseProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ width: "100%", padding: "0.5rem 0" }}>
      {/* ── BOTÓN PREMIUM CON BARRA DE PROGRESO ── */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.white,
          border: `1px solid ${C.gray200}`,
          padding: "0.875rem",
          borderRadius: RADIUS.lg,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: isOpen ? SHADOWS.sm : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                padding: "6px",
                borderRadius: RADIUS.full,
              }}
            >
              <Medal size={20} color={C.amber} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontWeight: "800",
                  color: C.navy900,
                  fontSize: "0.875rem",
                }}
              >
                Vitrina de Trofeos
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: C.gray500,
                  fontWeight: "600",
                }}
              >
                {unlockedCount} de {totalCount} desbloqueados
              </span>
            </div>
          </div>
          {isOpen ? (
            <ChevronUp size={20} color={C.gray400} />
          ) : (
            <ChevronDown size={20} color={C.gray400} />
          )}
        </div>

        <div
          style={{
            width: "100%",
            height: "4px",
            backgroundColor: C.gray100,
            borderRadius: RADIUS.full,
            marginTop: "0.75rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: C.amber,
              transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </button>

      {/* ── INTERIOR DE LA VITRINA (SIN CONTENEDORES INDIVIDUALES) ── */}
      {isOpen && (
        <div style={{ animation: "fadeIn 0.3s ease", marginTop: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "1rem 0.75rem",
              padding: "0.5rem 0.25rem",
            }}
          >
            {achievements.map((ach) => (
              <div
                key={ach.id}
                style={{
                  opacity: ach.unlocked ? 1 : 0.4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {/* ÍCONO DEL TROFEO */}
                <div
                  style={{
                    fontSize: "2rem",
                    marginBottom: "0.35rem",
                    filter: ach.unlocked
                      ? "drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4))"
                      : "grayscale(100%)",
                  }}
                >
                  {ach.unlocked ? ach.icon : "🔒"}
                </div>

                {/* TÍTULO */}
                <div
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: "800",
                    color: ach.unlocked ? C.amber : C.navy900,
                    lineHeight: "1.2",
                    textTransform: "uppercase",
                    marginBottom: "0.2rem",
                  }}
                >
                  {ach.title}
                </div>

                {/* CONDICIÓN / DESCRIPCIÓN */}
                <div
                  style={{
                    fontSize: "0.5rem",
                    color: C.gray500,
                    lineHeight: "1.2",
                  }}
                >
                  {ach.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
