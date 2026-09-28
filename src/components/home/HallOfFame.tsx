import { useState, useMemo, useRef } from "react";
import {
  Medal,
  Goal,
  TrendingUp,
  Award,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { C, RADIUS, SHADOWS } from "../ui";

interface HallOfFameProps {
  topScorers: any[];
  topAssists: any[];
  topMVPs: any[];
  topIronMen: any[];
}

// Función auxiliar para calcular rankings con empates
const calculateRanks = (list: any[], scoreKey: string) => {
  let currentRank = 1;
  let currentScore = -1;
  let itemsAtCurrentRank = 0;

  return list.map((item, index) => {
    const itemScore = item[scoreKey];

    if (index === 0) {
      currentScore = itemScore;
      itemsAtCurrentRank = 1;
    } else if (itemScore === currentScore) {
      itemsAtCurrentRank++;
    } else {
      currentRank += itemsAtCurrentRank;
      currentScore = itemScore;
      itemsAtCurrentRank = 1;
    }

    return { ...item, rank: currentRank };
  });
};

export default function HallOfFame({
  topScorers,
  topAssists,
  topMVPs,
  topIronMen,
}: HallOfFameProps) {
  // ── Estado para el carrusel ──
  const [hofIndex, setHofIndex] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const hallRef = useRef<HTMLDivElement>(null);

  // Límite de jugadores a mostrar por defecto (TOP 5)
  const LIMIT = 5;

  // ── Calcular Rankings con Empates ──
  const rankedScorers = useMemo(
    () => calculateRanks(topScorers, "goals"),
    [topScorers],
  );
  const rankedAssists = useMemo(
    () => calculateRanks(topAssists, "assists"),
    [topAssists],
  );
  const rankedMVPs = useMemo(() => calculateRanks(topMVPs, "mvps"), [topMVPs]);
  const rankedIronMen = useMemo(
    () => calculateRanks(topIronMen, "totalAttendance"),
    [topIronMen],
  );

  // ── Construir y ordenar las categorías dinámicamente ──
  const categories = useMemo(() => {
    const allCategories = [
      {
        key: "scorers",
        title: "El Pichichi",
        subtitle: "Máximos Goleadores",
        icon: <Goal size={18} />,
        iconBg: "rgba(16, 185, 129, 0.1)",
        iconColor: C.green,
        accent: C.amber,
        list: rankedScorers,
        scoreText: (p: any) => `${p.goals} goles`,
      },
      {
        key: "assists",
        title: "El Maestro",
        subtitle: "Más Asistencias",
        icon: <TrendingUp size={18} />,
        iconBg: "rgba(56, 189, 248, 0.1)",
        iconColor: C.blueAccent,
        accent: C.blueAccent,
        list: rankedAssists,
        scoreText: (p: any) => `${p.assists} asistencias`,
      },
      {
        key: "mvps",
        title: "El Galáctico",
        subtitle: "Premios MVP",
        icon: <Award size={18} />,
        iconBg: "rgba(245, 158, 11, 0.1)",
        iconColor: C.amber,
        accent: C.amber,
        list: rankedMVPs,
        scoreText: (p: any) => `${p.mvps} MVPs`,
      },
      {
        key: "ironmen",
        title: "El de Hierro",
        subtitle: "Más Presencias",
        icon: <Shield size={18} />,
        iconBg: "rgba(100, 116, 139, 0.1)",
        iconColor: C.navy500,
        accent: C.navy500,
        list: rankedIronMen,
        scoreText: (p: any) => `${p.totalAttendance} presencias`,
      },
    ];

    return allCategories
      .filter((cat) => cat.list.length > 0)
      .sort((a, b) => b.list.length - a.list.length);
  }, [rankedScorers, rankedAssists, rankedMVPs, rankedIronMen]);

  // ── Scroll personalizado: más suave y con offset hacia arriba ──
  const scrollToHall = () => {
    if (!hallRef.current) return;
    const OFFSET = 60; // píxeles adicionales para subir más arriba
    const top =
      hallRef.current.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({
      top,
      behavior: "smooth",
    });
  };

  const nextHof = () => {
    setExpanded({});
    setHofIndex((prev) => (prev + 1) % categories.length);
    scrollToHall();
  };
  const prevHof = () => {
    setExpanded({});
    setHofIndex((prev) => (prev - 1 + categories.length) % categories.length);
    scrollToHall();
  };
  const goToSlide = (idx: number) => {
    setExpanded({});
    setHofIndex(idx);
    scrollToHall();
  };

  const toggleExpand = (catKey: string) => {
    setExpanded((prev) => {
      const newExpanded = { ...prev, [catKey]: !prev[catKey] };
      setTimeout(() => {
        scrollToHall();
      }, 100);
      return newExpanded;
    });
  };

  const renderSeeAllButton = (catKey: string, totalItems: number) => {
    if (totalItems <= LIMIT) return null;
    const isExpanded = !!expanded[catKey];

    return (
      <button
        onClick={() => toggleExpand(catKey)}
        style={{
          width: "100%",
          padding: "0.75rem",
          marginTop: "0.75rem",
          backgroundColor: C.gray50,
          color: C.navy900,
          border: `1px solid ${C.gray200}`,
          borderRadius: RADIUS.md,
          fontSize: "0.8125rem",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = C.gray100;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = C.gray50;
        }}
      >
        {isExpanded ? "Ocultar tabla ↑" : "Ver más ↓"}
      </button>
    );
  };

  const getRankStyles = (rank: number, accentColor: string) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    const rankBg = isGold
      ? "#FEF08A"
      : isSilver
        ? "#E2E8F0"
        : isBronze
          ? "#FED7AA"
          : "#F1F5F9";
    const rankColor = isGold
      ? "#B45309"
      : isSilver
        ? "#475569"
        : isBronze
          ? "#9A3412"
          : "#64748B";
    const rowBg = isGold ? "rgba(245, 158, 11, 0.08)" : "transparent";
    const rowBorder = isGold
      ? `1px solid rgba(245, 158, 11, 0.3)`
      : "1px solid transparent";
    const avatarBorder = isGold
      ? `2px solid ${accentColor}`
      : `1px solid ${C.gray200}`;
    const avatarSize = isGold ? "38px" : "32px";
    const nameSize = isGold ? "0.9rem" : "0.8125rem";
    const nameWeight = isGold ? "800" : "600";

    return {
      rankBg,
      rankColor,
      rowBg,
      rowBorder,
      avatarBorder,
      avatarSize,
      nameSize,
      nameWeight,
    };
  };

  if (categories.length === 0) {
    return (
      <div
        style={{
          backgroundColor: C.navy900,
          borderRadius: RADIUS.lg,
          padding: "1.5rem",
          boxShadow: SHADOWS.lg,
          color: C.white,
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: "800",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            justifyContent: "center",
            letterSpacing: "-0.01em",
          }}
        >
          <Medal size={20} color={C.amber} /> Muro de la Fama
        </h2>
        <p style={{ marginTop: "1rem", color: C.gray300, fontSize: "0.9rem" }}>
          Aún no hay estadísticas para mostrar.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={hallRef}
      style={{
        backgroundColor: C.navy900,
        borderRadius: RADIUS.lg,
        padding: "1.5rem",
        boxShadow: SHADOWS.lg,
        color: C.white,
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
      }}
    >
      {/* Cabecera con Botones de Navegación */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: "800",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            letterSpacing: "-0.01em",
          }}
        >
          <Medal size={20} color={C.amber} /> Muro de la Fama
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={prevHof}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,0.2)`,
              backgroundColor: "rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: C.white,
              transition: "all 0.2s",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextHof}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,0.2)`,
              backgroundColor: "rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: C.white,
              transition: "all 0.2s",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL CARRUSEL ANIMADO */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
          borderRadius: RADIUS.lg,
        }}
      >
        <div
          style={{
            display: "flex",
            transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
            transform: `translateX(-${hofIndex * 100}%)`,
          }}
        >
          {categories.map((cat) => (
            <div key={cat.key} style={{ flex: "0 0 100%", width: "100%" }}>
              <div
                style={{
                  backgroundColor: C.white,
                  borderRadius: RADIUS.lg,
                  padding: "1.25rem",
                  color: C.navy900,
                  boxShadow: SHADOWS.md,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Encabezado de categoría */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    paddingBottom: "0.75rem",
                    borderBottom: `1px dashed ${C.gray200}`,
                  }}
                >
                  <div
                    style={{
                      padding: "0.4rem",
                      backgroundColor: cat.iconBg,
                      color: cat.iconColor,
                      borderRadius: RADIUS.md,
                    }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        fontWeight: "800",
                        color: C.navy900,
                        lineHeight: "1.2",
                      }}
                    >
                      {cat.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: C.gray500,
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {cat.subtitle}
                    </span>
                  </div>
                </div>

                {/* Lista de jugadores */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    flex: 1,
                  }}
                >
                  {(expanded[cat.key]
                    ? cat.list
                    : cat.list.slice(0, LIMIT)
                  ).map((p: any) => {
                    const styles = getRankStyles(p.rank, cat.accent);
                    const isActive = p.active !== false; // 👈 NUEVA VALIDACIÓN

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.5rem",
                          borderRadius: RADIUS.md,
                          backgroundColor: styles.rowBg,
                          border: styles.rowBorder,
                          opacity: isActive ? 1 : 0.6, // 👈 Atenuado si es baja
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            backgroundColor: styles.rankBg,
                            color: styles.rankColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: "800",
                            flexShrink: 0,
                          }}
                        >
                          {p.rank}
                        </div>
                        <img
                          src={
                            p.imageUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              p.name,
                            )}&background=102a43&color=fff&size=50`
                          }
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: styles.avatarSize,
                            height: styles.avatarSize,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: styles.avatarBorder,
                            filter: isActive ? "none" : "grayscale(100%)", // 👈 B/N si es baja
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: styles.nameSize,
                              fontWeight: styles.nameWeight,
                              color: isActive ? C.navy900 : C.gray600, // 👈 Gris oscuro si es baja
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            {p.name}
                            {!isActive && (
                              <span
                                style={{
                                  backgroundColor: "#ef4444",
                                  color: "white",
                                  fontSize: "0.55rem",
                                  padding: "1px 4px",
                                  borderRadius: "4px",
                                  fontWeight: "bold",
                                }}
                              >
                                BAJA
                              </span>
                            )}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              color: cat.iconColor,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            {cat.scoreText(p)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {renderSeeAllButton(cat.key, cat.list.length)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PUNTITOS INDICADORES DE NAVEGACIÓN */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.4rem",
          marginTop: "1rem",
        }}
      >
        {categories.map((cat, idx) => (
          <div
            key={cat.key}
            onClick={() => goToSlide(idx)}
            style={{
              width: hofIndex === idx ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              backgroundColor:
                hofIndex === idx ? C.amber : "rgba(255,255,255,0.3)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}
