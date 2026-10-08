import React, { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  ArrowRightLeft,
  Trophy,
  Target,
  Search,
  Shield,
  Goal,
  X,
  TrendingUp,
  Star,
} from "lucide-react";
import { dataConnect, deletePlayer, savePlayer } from "../../../infrastructure/dataconnect";
import { requestClubRefresh } from "../useClubScreen";
import { savedRow } from "../../../shared/saved";
import { useClub } from "../../../domains/clubs/ClubContext";
import { useModalLock } from "../../../shared/useModalLock";
import { C, RADIUS, SHADOWS, SectionCard, FormInput } from "../../../shared/ui";
import { CompareModal } from "../ClubComponents";

import PlayerForm, { playerFormError } from "./PlayerForm";
import { titleCase } from "../../../shared/textLimits";
import PlayerRow from "./PlayerRow";
import PlayerModal from "./PlayerModal";
import { usePlayerStats } from "./usePlayerStats";

// 👇 COMPONENTE AUXILIAR PARA EL CARRUSEL (CALIBRADO PARA DESKTOP Y MÓVIL) 👇
const PlayersCarouselModal = ({ position, playersStats, onClose }: any) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  useModalLock(onClose);

  // Filtramos solo a los jugadores activos de la posición seleccionada
  const carouselPlayers = playersStats.filter(
    (p: any) => p.position === position && p.active !== false,
  );

  // ── LÓGICA DE INTERACCIÓN DEL CARRUSEL ──
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;

    // Calculamos el centro exacto de la pantalla
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child: any, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const child = container.children[index] as HTMLElement;

    if (child) {
      const containerCenter = container.clientWidth / 2;
      const childCenter = child.offsetWidth / 2;
      // offsetLeft nos da la posición real del elemento dentro del contenedor
      const scrollPos = child.offsetLeft - containerCenter + childCenter;

      container.scrollTo({
        left: scrollPos,
        behavior: "smooth",
      });
    }
  };
  // ─────────────────────────────────────────

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.95)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      {/* Botón flotante para cerrar */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "50%",
          padding: "0.5rem",
          color: C.white,
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        <X size={24} />
      </button>

      <h3
        style={{
          color: C.white,
          marginBottom: "1rem",
          fontWeight: "800",
          fontSize: "1.25rem",
        }}
      >
        Galería de {position}s
      </h3>

      {/* Contenedor del Carrusel */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="hide-scroll"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          width: "100vw", // Obligamos a que tome el ancho total de la pantalla
          // 👇 MAGIA CSS: Relleno dinámico para centrar siempre la primera y última carta 👇
          padding: "2rem max(7.5vw, calc(50vw - 160px))",
          gap: "1.5rem",
          alignItems: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {carouselPlayers.map((p: any, i: number) => {
          const isGoalkeeper = p.position === "Portero";
          const isCentered = activeIndex === i;

          return (
            <div
              key={p.id}
              onClick={() => scrollToCard(i)}
              style={{
                flex: "0 0 auto",
                width: "85vw",
                maxWidth: "320px", // Tope máximo para escritorio
                scrollSnapAlign: "center",
                backgroundColor: C.white,
                borderRadius: RADIUS.xl,
                overflow: "hidden",
                boxShadow: isCentered
                  ? `0 0 20px rgba(245, 158, 11, 0.4)`
                  : SHADOWS.xl,
                position: "relative",
                transform: isCentered ? "scale(1)" : "scale(0.92)",
                opacity: isCentered ? 1 : 0.5,
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                cursor: "pointer",
              }}
            >
              {/* Mitad Superior Oscura */}
              <div
                style={{
                  backgroundColor: C.navy900,
                  height: "80px",
                  width: "100%",
                }}
              />

              {/* Foto del Jugador superpuesta */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "-45px",
                }}
              >
                <img
                  src={
                    p.imageUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=102a43&color=fff&size=150`
                  }
                  alt={p.name}
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    border: `4px solid ${C.white}`,
                    backgroundColor: C.navy900,
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Información y Estadísticas */}
              <div
                style={{
                  padding: "1rem 1.5rem 1.5rem 1.5rem",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    color: C.navy900,
                  }}
                >
                  {p.name}
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0 1rem 0",
                    fontSize: "0.8125rem",
                    color: C.gray500,
                    fontWeight: "600",
                  }}
                >
                  <span style={{ color: C.amber, fontWeight: "800" }}>
                    #{p.number}
                  </span>{" "}
                  • {p.position}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                  }}
                >
                  <MiniStat
                    icon={<Trophy size={16} />}
                    label="Partidos"
                    value={p.matchesAttended}
                  />

                  {isGoalkeeper ? (
                    <>
                      <MiniStat
                        icon={<Shield size={16} />}
                        label="Arcos Cero"
                        value={p.cleanSheets || 0}
                      />
                    </>
                  ) : (
                    <>
                      <MiniStat
                        icon={<Goal size={16} />}
                        label="Goles"
                        value={p.goals}
                      />
                      <MiniStat
                        icon={<TrendingUp size={16} />}
                        label="Asistencias"
                        value={p.assists}
                      />
                    </>
                  )}

                  <MiniStat
                    icon={<Target size={16} />}
                    label="Prácticas"
                    value={p.trainingsAttended}
                  />
                  <MiniStat
                    icon={<Star size={16} color={C.amber} fill={C.amber} />}
                    label="MVPs"
                    value={p.mvps}
                    color={C.amber}
                  />

                  {/* Tarjetas combinadas */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: C.gray50,
                      padding: "0.5rem",
                      borderRadius: RADIUS.md,
                      border: `1px solid ${C.gray200}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        marginBottom: "0.15rem",
                      }}
                    >
                      <span style={{ fontSize: "12px" }}>🟨</span>
                      <span style={{ fontSize: "12px" }}>🟥</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.4rem",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "800",
                          color: C.navy900,
                        }}
                      >
                        {p.yellowCards}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: C.gray300 }}>
                        |
                      </span>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "800",
                          color: C.red,
                        }}
                      >
                        {p.redCards}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: "700",
                        color: C.gray500,
                        textTransform: "uppercase",
                      }}
                    >
                      Tarjetas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 👇 PUNTOS INTERACTIVOS 👇 */}
      <div
        style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        {carouselPlayers.map((_: any, i: number) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            style={{
              width: activeIndex === i ? "24px" : "8px",
              height: "8px",
              borderRadius: RADIUS.full,
              backgroundColor:
                activeIndex === i ? C.amber : "rgba(255,255,255,0.3)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
            aria-label={`Ver jugador ${i + 1}`}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
};

// Mini componente para los cuadritos de estadística del carrusel
const MiniStat = ({ icon, label, value, color = C.navy900 }: any) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: C.gray50,
      padding: "0.5rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray200}`,
    }}
  >
    <div style={{ marginBottom: "0.15rem", color: C.gray500 }}>{icon}</div>
    <span style={{ fontSize: "1rem", fontWeight: "800", color }}>{value}</span>
    <span
      style={{
        fontSize: "0.55rem",
        fontWeight: "700",
        color: C.gray500,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  </div>
);

// 👆 ========================================= 👆

export default function Players({ players: allPlayers, events, perms, goals }: any) {
  const { clubId } = useClub();
  // Los eliminados (borrado lógico) no salen en la plantilla, ni siquiera en «Inactivos»
  const players = useMemo(() => allPlayers.filter((p: any) => !p.deleted), [allPlayers]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [playerPosition, setPlayerPosition] = useState("Delantero");
  const [playerVariant, setPlayerVariant] = useState("");
  const [playerBirthDate, setPlayerBirthDate] = useState("");
  const [playerImageUrl, setPlayerImageUrl] = useState("");
  const [playerActive, setPlayerActive] = useState(true);
  const [playerError, setPlayerError] = useState("");
  const [savingPlayer, setSavingPlayer] = useState(false);
  const savingPlayerRef = useRef(false);

  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("Todos");

  // 👇 NUEVO ESTADO PARA EL CARRUSEL 👇
  const [carouselPosition, setCarouselPosition] = useState<string | null>(null);

  const canEditAll = perms?.canEditJugadores;
  const isPressOnly =
    !canEditAll && (perms?.canEditPortada || perms?.canEditPrensa);

  /** true si se guardó: el formulario solo limpia fotos huérfanas cuando el fichaje quedó guardado. */
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPlayerRef.current) return false;
    const problem = playerFormError(playerName, playerNumber, playerVariant, playerBirthDate);
    setPlayerError(problem);
    if (problem) return false;

    const payload = {
      id: editingPlayerId || crypto.randomUUID(),
      clubId,
      name: titleCase(playerName),
      shirtNumber: playerNumber,
      position: playerPosition,
      isCoach: false,
      active: playerActive,
      detail: {
        variant: playerVariant.trim(),
        birthDate: playerBirthDate || "",
        imageUrl: playerImageUrl.trim(),
      },
    };
    savingPlayerRef.current = true;
    setSavingPlayer(true);
    try {
      const saved = await savePlayer(dataConnect, payload);
      savedRow(saved.data.player);
      requestClubRefresh();
      handleCancelEdit();
      return true;
    } catch (err) {
      console.error(err);
      setPlayerError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
      return false;
    } finally {
      savingPlayerRef.current = false;
      setSavingPlayer(false);
    }
  };

  const handleCancelEdit = () => {
    setPlayerError("");
    setEditingPlayerId(null);
    setPlayerName("");
    setPlayerNumber("");
    setPlayerPosition("Delantero");
    setPlayerVariant("");
    setPlayerBirthDate("");
    setPlayerImageUrl("");
    setPlayerActive(true);
  };

  const handleEdit = (p: any) => {
    setEditingPlayerId(p.id);
    setPlayerName(p.name);
    setPlayerNumber(p.number === "S/N" ? "" : p.number);
    setPlayerPosition(p.position);
    setPlayerVariant(p.variant || "");
    setPlayerBirthDate(p.birthDate || "");
    setPlayerImageUrl(p.imageUrl || "");
    setPlayerActive(p.active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Eliminar a este jugador? Saldrá de la plantilla, pero sus goles, tarjetas, asistencias y aportaciones se conservan.",
      )
    )
      try {
        const removed = await deletePlayer(dataConnect, { id, clubId });
        savedRow(removed.data.deleted);
        // Si estaba abierto en el formulario o en su ficha, se cierra: ya no se puede editar
        if (id === editingPlayerId) handleCancelEdit();
        if (selectedPlayer?.id === id) setSelectedPlayer(null);
        requestClubRefresh();
      } catch (err) {
        console.error(err);
        alert("No se pudo guardar.");
      }
  };

  const { clubPlayerStats, selectedPlayerAchievements } = usePlayerStats(
    players,
    events,
    selectedPlayer,
    goals,
  );

  const activePlayersCount = useMemo(
    () => players.filter((p: any) => p.active !== false).length,
    [players],
  );
  const inactivePlayersCount = useMemo(
    () => players.filter((p: any) => p.active === false).length,
    [players],
  );

  const positionCounts = useMemo(() => {
    const counts = { Portero: 0, Defensa: 0, Medio: 0, Delantero: 0 };
    players.forEach((p: any) => {
      if (p.active === false) return;
      if (counts[p.position as keyof typeof counts] !== undefined) {
        counts[p.position as keyof typeof counts]++;
      } else {
        counts.Delantero++;
      }
    });
    return counts;
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player: any) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.number.toString().includes(searchTerm);

      const isActive = player.active !== false;

      if (positionFilter === "Inactivos") {
        return matchesSearch && !isActive;
      }

      const matchesPosition =
        positionFilter === "Todos" || player.position === positionFilter;
      return matchesSearch && matchesPosition && isActive;
    });
  }, [players, searchTerm, positionFilter]);

  const filterOptions = [
    { label: "Todos", count: activePlayersCount },
    { label: "Portero", count: positionCounts.Portero },
    { label: "Defensa", count: positionCounts.Defensa },
    { label: "Medio", count: positionCounts.Medio },
    { label: "Delantero", count: positionCounts.Delantero },
    { label: "Inactivos", count: inactivePlayersCount },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* ── PLANTILLA ACTIVA (RESUMEN TÁCTICO MINIMALISTA) ── */}
      <SectionCard title="Plantilla Activa" icon={<Users size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: C.gray500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Distribución de Plantilla
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: "800",
                color: C.navy900,
              }}
            >
              {activePlayersCount} Registrados
            </span>
          </div>

          {/* Barra de Proporción Limpia */}
          <div
            style={{
              display: "flex",
              height: "8px",
              borderRadius: RADIUS.full,
              overflow: "hidden",
              backgroundColor: C.gray100,
            }}
          >
            {activePlayersCount > 0 ? (
              <>
                <div
                  style={{
                    flex: positionCounts.Portero,
                    backgroundColor: C.amber,
                  }}
                  title={`Porteros: ${positionCounts.Portero}`}
                />
                <div
                  style={{
                    flex: positionCounts.Defensa,
                    backgroundColor: "#3b82f6",
                  }}
                  title={`Defensas: ${positionCounts.Defensa}`}
                />
                <div
                  style={{
                    flex: positionCounts.Medio,
                    backgroundColor: C.green,
                  }}
                  title={`Medios: ${positionCounts.Medio}`}
                />
                <div
                  style={{
                    flex: positionCounts.Delantero,
                    backgroundColor: C.red || "#ef4444",
                  }}
                  title={`Delanteros: ${positionCounts.Delantero}`}
                />
              </>
            ) : (
              <div style={{ flex: 1, backgroundColor: C.gray200 }} />
            )}
          </div>

          {/* Estadísticas en Línea (AHORA SON BOTONES) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.5rem",
              textAlign: "center",
              paddingTop: "0.25rem",
            }}
          >
            <button
              onClick={() =>
                positionCounts.Portero > 0 && setCarouselPosition("Portero")
              }
              style={{
                backgroundColor: C.gray50,
                padding: "0.5rem",
                borderRadius: RADIUS.sm,
                border: `1px solid ${C.gray200}`,
                cursor: positionCounts.Portero > 0 ? "pointer" : "default",
                transition: "all 0.2s ease",
                opacity: positionCounts.Portero > 0 ? 1 : 0.6,
              }}
              onMouseOver={(e) =>
                positionCounts.Portero > 0 &&
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: C.gray500,
                  textTransform: "uppercase",
                }}
              >
                Porteros
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: C.navy900,
                }}
              >
                {positionCounts.Portero}
              </span>
            </button>

            <button
              onClick={() =>
                positionCounts.Defensa > 0 && setCarouselPosition("Defensa")
              }
              style={{
                backgroundColor: C.gray50,
                padding: "0.5rem",
                borderRadius: RADIUS.sm,
                border: `1px solid ${C.gray200}`,
                cursor: positionCounts.Defensa > 0 ? "pointer" : "default",
                transition: "all 0.2s ease",
                opacity: positionCounts.Defensa > 0 ? 1 : 0.6,
              }}
              onMouseOver={(e) =>
                positionCounts.Defensa > 0 &&
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: C.gray500,
                  textTransform: "uppercase",
                }}
              >
                Defensas
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: C.navy900,
                }}
              >
                {positionCounts.Defensa}
              </span>
            </button>

            <button
              onClick={() =>
                positionCounts.Medio > 0 && setCarouselPosition("Medio")
              }
              style={{
                backgroundColor: C.gray50,
                padding: "0.5rem",
                borderRadius: RADIUS.sm,
                border: `1px solid ${C.gray200}`,
                cursor: positionCounts.Medio > 0 ? "pointer" : "default",
                transition: "all 0.2s ease",
                opacity: positionCounts.Medio > 0 ? 1 : 0.6,
              }}
              onMouseOver={(e) =>
                positionCounts.Medio > 0 &&
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: C.gray500,
                  textTransform: "uppercase",
                }}
              >
                Medios
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: C.navy900,
                }}
              >
                {positionCounts.Medio}
              </span>
            </button>

            <button
              onClick={() =>
                positionCounts.Delantero > 0 && setCarouselPosition("Delantero")
              }
              style={{
                backgroundColor: C.gray50,
                padding: "0.5rem",
                borderRadius: RADIUS.sm,
                border: `1px solid ${C.gray200}`,
                cursor: positionCounts.Delantero > 0 ? "pointer" : "default",
                transition: "all 0.2s ease",
                opacity: positionCounts.Delantero > 0 ? 1 : 0.6,
              }}
              onMouseOver={(e) =>
                positionCounts.Delantero > 0 &&
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: C.gray500,
                  textTransform: "uppercase",
                }}
              >
                Delantes
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: C.navy900,
                }}
              >
                {positionCounts.Delantero}
              </span>
            </button>
          </div>
        </div>
      </SectionCard>

      {(canEditAll || (isPressOnly && editingPlayerId)) && (
        <PlayerForm
          isPressOnly={isPressOnly}
          editingPlayerId={editingPlayerId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerNumber={playerNumber}
          setPlayerNumber={setPlayerNumber}
          playerPosition={playerPosition}
          setPlayerPosition={setPlayerPosition}
          playerVariant={playerVariant}
          setPlayerVariant={setPlayerVariant}
          playerBirthDate={playerBirthDate}
          setPlayerBirthDate={setPlayerBirthDate}
          playerImageUrl={playerImageUrl}
          setPlayerImageUrl={setPlayerImageUrl}
          playerActive={playerActive}
          setPlayerActive={setPlayerActive}
          onSubmit={handleSavePlayer}
          onCancel={handleCancelEdit}
          error={playerError}
          saving={savingPlayer}
        />
      )}

      {/* ── PLANTILLA OFICIAL ── */}
      <SectionCard title="Plantilla Oficial" icon={<Trophy size={16} />}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* BÚSQUEDA + COMPARAR */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search
                size={16}
                color={C.gray400}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "0.75rem",
                  transform: "translateY(-50%)",
                }}
              />
              <FormInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o dorsal..."
                style={{ paddingLeft: "2.25rem", width: "100%" }}
              />
            </div>

            {activePlayersCount > 1 && (
              <button
                onClick={() => setShowCompareModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0 1rem",
                  backgroundColor: C.blueAccent,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.md,
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  boxShadow: SHADOWS.sm,
                  whiteSpace: "nowrap",
                  height: "36px",
                }}
              >
                <ArrowRightLeft size={14} /> Comparar
              </button>
            )}
          </div>

          {/* FILTROS TIPO CHIP LIMPIOS */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
              marginTop: "0.25rem",
            }}
          >
            {filterOptions.map(({ label, count }) => {
              const isSelected = positionFilter === label;
              const isInactiveBtn = label === "Inactivos";

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPositionFilter(label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: RADIUS.full,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: `1px solid ${isSelected ? (isInactiveBtn ? C.red : C.navy900) : C.gray200}`,
                    backgroundColor: isSelected
                      ? isInactiveBtn
                        ? C.red
                        : C.navy900
                      : C.white,
                    color: isSelected ? C.white : C.gray600,
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                  <span
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.2)"
                        : C.gray100,
                      color: isSelected ? C.white : C.gray500,
                      padding: "1px 5px",
                      borderRadius: RADIUS.full,
                      fontSize: "0.6rem",
                      fontWeight: "700",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: C.gray400,
              fontStyle: "italic",
              padding: "1.5rem 0",
            }}
          >
            No se encontraron jugadores con ese filtro.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {filteredPlayers.map((player: any) => (
              <PlayerRow
                key={player.id}
                player={player}
                canEditAll={canEditAll}
                isPressOnly={isPressOnly}
                onSelect={() => setSelectedPlayer(player)}
                onEdit={() => handleEdit(player)}
                onDelete={() => handleDelete(player.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* MODALES ADICIONALES */}
      {showCompareModal && (
        <CompareModal
          playersStats={clubPlayerStats}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          pStats={clubPlayerStats.find((p: any) => p.id === selectedPlayer.id)}
          achievements={selectedPlayerAchievements}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* 👇 NUEVO: RENDERIZADO DEL CARRUSEL 👇 */}
      {carouselPosition && (
        <PlayersCarouselModal
          position={carouselPosition}
          playersStats={clubPlayerStats}
          onClose={() => setCarouselPosition(null)}
        />
      )}
    </div>
  );
}
