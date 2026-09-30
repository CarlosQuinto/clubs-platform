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
  stats: any[];
}

type HallKey = "scorers" | "assists" | "mvps" | "ironmen";

function rankCategory(stats: any[], key: HallKey) {
  if (key === "scorers") {
    return calculateRanks(
      stats
        .filter((p) => p.goals > 0)
        .sort(
          (a, b) =>
            b.goals - a.goals ||
            b.assists - a.assists ||
            a.name.localeCompare(b.name),
        ),
      "goals",
    );
  }
  if (key === "assists") {
    return calculateRanks(
      stats
        .filter((p) => p.assists > 0)
        .sort(
          (a, b) =>
            b.assists - a.assists ||
            b.goals - a.goals ||
            a.name.localeCompare(b.name),
        ),
      "assists",
    );
  }
  if (key === "mvps") {
    return calculateRanks(
      stats
        .filter((p) => p.mvps > 0)
        .sort(
          (a, b) =>
            b.mvps - a.mvps || b.goals - a.goals || a.name.localeCompare(b.name),
        ),
      "mvps",
    );
  }
  return calculateRanks(
    stats
      .filter((p) => p.totalAttendance > 0)
      .sort(
        (a, b) =>
          b.totalAttendance - a.totalAttendance ||
          b.goals - a.goals ||
          a.name.localeCompare(b.name),
      ),
    "totalAttendance",
  );
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

export default function HallOfFame({ stats }: HallOfFameProps) {
  const [hofIndex, setHofIndex] = useState(0);
  const [shown, setShown] = useState<Record<string, number>>({});
  const hallRef = useRef<HTMLDivElement>(null);
  const rankedRef = useRef<{ source: any[]; lists: Partial<Record<HallKey, any[]>> }>({
    source: stats,
    lists: {},
  });
  if (rankedRef.current.source !== stats) {
    rankedRef.current = { source: stats, lists: {} };
  }

  const LIMIT = 5;

  const counts = useMemo(() => {
    const tally = { scorers: 0, assists: 0, mvps: 0, ironmen: 0 };
    for (const player of stats) {
      if (player.goals > 0) tally.scorers += 1;
      if (player.assists > 0) tally.assists += 1;
      if (player.mvps > 0) tally.mvps += 1;
      if (player.totalAttendance > 0) tally.ironmen += 1;
    }
    return tally;
  }, [stats]);

  const categories = useMemo(() => {
    const allCategories = [
      {
        key: "scorers" as HallKey,
        title: "El Pichichi",
        subtitle: "Máximos Goleadores",
        icon: <Goal size={18} />,
        iconBg: "rgba(16, 185, 129, 0.1)",
        iconColor: C.green,
        accent: C.amber,
        scoreText: (p: any) => `${p.goals} goles`,
      },
      {
        key: "assists" as HallKey,
        title: "El Maestro",
        subtitle: "Más Asistencias",
        icon: <TrendingUp size={18} />,
        iconBg: "rgba(56, 189, 248, 0.1)",
        iconColor: C.blueAccent,
        accent: C.blueAccent,
        scoreText: (p: any) => `${p.assists} asistencias`,
      },
      {
        key: "mvps" as HallKey,
        title: "El Galáctico",
        subtitle: "Premios MVP",
        icon: <Award size={18} />,
        iconBg: "rgba(245, 158, 11, 0.1)",
        iconColor: C.amber,
        accent: C.amber,
        scoreText: (p: any) => `${p.mvps} MVPs`,
      },
      {
        key: "ironmen" as HallKey,
        title: "El de Hierro",
        subtitle: "Más Presencias",
        icon: <Shield size={18} />,
        iconBg: "rgba(100, 116, 139, 0.1)",
        iconColor: C.navy500,
        accent: C.navy500,
        scoreText: (p: any) => `${p.totalAttendance} presencias`,
      },
    ];

    return allCategories
      .filter((cat) => counts[cat.key] > 0)
      .sort((a, b) => counts[b.key] - counts[a.key]);
  }, [counts]);

  const active = categories[hofIndex] ?? categories[0];
  if (active && !rankedRef.current.lists[active.key]) {
    rankedRef.current.lists[active.key] = rankCategory(stats, active.key);
  }
  const activeList = active ? rankedRef.current.lists[active.key] || [] : [];

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
    setHofIndex((prev) => (prev + 1) % categories.length);
    scrollToHall();
  };
  const prevHof = () => {
    setHofIndex((prev) => (prev - 1 + categories.length) % categories.length);
    scrollToHall();
  };
  const goToSlide = (idx: number) => {
    setHofIndex(idx);
    scrollToHall();
  };

  const renderSeeAllButton = (catKey: string, totalItems: number) => {
    const visible = shown[catKey] ?? LIMIT;
    if (visible >= totalItems) return null;

    return (
      <button
        onClick={() =>
          setShown((prev) => ({
            ...prev,
            [catKey]: Math.min((prev[catKey] ?? LIMIT) + LIMIT, totalItems),
          }))
        }
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
        Ver más ↓
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

  const cat = {
    ...(categories[hofIndex] ?? categories[0]),
    list: activeList,
  };
  const visiblePlayers = cat.list.slice(0, shown[cat.key] ?? LIMIT);

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
        <div>
          <div key={cat.key}>
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
                  {visiblePlayers.map((p: any) => {
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
