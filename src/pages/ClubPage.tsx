import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Home as HomeIcon,
  Calendar,
  Users,
  Wallet,
  Package,
  Shield,
  Camera,
  LayoutTemplate,
  X,
  Edit2,
  UploadCloud,
  Lock,
  LogOut,
  UserCog,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { useClubData, type ClubSlice } from "../hooks/useClubData";
import { useModalLock } from "../hooks/useModalLock";
import { useMembership } from "../hooks/useMembership";
import {
  defaultSeasonId,
  useClubScopedMatches,
  usePlatformCatalog,
} from "../hooks/usePlatformCatalog";
import StatsScopeBar from "../components/club/StatsScopeBar";
import AvailabilityPanel from "../components/club/AvailabilityPanel";
import {
  applyScope,
  calendarStatus,
  clubTrophies,
  computeTeamRecord,
  isPlayed,
  matchToClubEvent,
} from "../lib/stats";
import type { StatsScope } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { ClubProvider, useClub } from "../context/ClubContext";
import { buildPerms, ROLE_LABELS } from "../lib/roles";
import { findClubBySlug, normalizeSlug } from "../lib/paths";
import { DEFAULT_CLUB_NAME, DEFAULT_CLUB_LOGO } from "../lib/clubDefaults";
import {
  C,
  RADIUS,
  SHADOWS,
  FormInput,
  PrimaryButton,
  SecondaryButton,
} from "../components/ui";
import Home from "./Home";
import Agenda from "./Agenda";
import Players from "./Players";
import Finances from "./Finances";
import Inventory from "./Inventory";
import MembersModal from "../components/club/MembersModal";
import AdSlot from "../components/platform/AdSlot";
import { updateDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { uploadImageFile } from "../lib/uploadImage";

// ── CUSTOM HOOK PARA RESIZE Y RESPONSIVIDAD ──
// Soluciona el problema de window.innerWidth no reactivo al rotar la pantalla
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    // Ejecuta inmediatamente para sincronizar con el tamaño inicial
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

/** Resuelve el slug de la URL al uid del documento y monta el contexto del club. */
export default function ClubPage() {
  const { slug: raw = "" } = useParams();
  const slug = normalizeSlug(raw);
  const [clubId, setClubId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!slug) {
      setClubId(null);
      setMissing(true);
      return;
    }
    let cancelled = false;
    setClubId(null);
    setMissing(false);
    findClubBySlug(slug)
      .then((snap) => {
        if (cancelled) return;
        if (!snap) setMissing(true);
        else setClubId(snap.id);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug || missing) return <ClubNotFound slug={raw} />;
  if (!clubId) return null;

  return (
    <ClubProvider key={clubId} clubId={clubId}>
      <ClubShell />
    </ClubProvider>
  );
}

function ClubNotFound({ slug }: { slug: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: C.gray50,
        color: C.gray800,
      }}
    >
      <Shield size={48} color={C.gray300} />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900 }}>
        Club no encontrado
      </h1>
      <p style={{ margin: 0, color: C.gray500 }}>
        No existe ningún club en <code>/{slug}</code>.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          color: C.navy900,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} /> Ver todos los clubes
      </Link>
    </div>
  );
}

function SectionPending() {
  return (
    <p
      style={{
        textAlign: "center",
        color: C.gray500,
        fontWeight: 600,
        padding: "3rem 1rem",
      }}
    >
      Cargando…
    </p>
  );
}

function ClubShell() {
  const { slug: routeSlug = "" } = useParams();
  const { clubId, clubRef, storagePath } = useClub();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout } = useAuth();
  const { role } = useMembership(clubId);
  const [activeTab, setActiveTab] = useState<
    "inicio" | "agenda" | "jugadores" | "finanzas" | "inventario"
  >("inicio");
  const [visitState, setVisitState] = useState({
    clubId,
    tabs: {
      inicio: true,
      agenda: false,
      jugadores: false,
      finanzas: false,
      inventario: false,
    },
  });
  const [zoneState, setZoneState] = useState({
    clubId,
    hall: false,
    albums: false,
  });
  if (visitState.clubId !== clubId) {
    setActiveTab("inicio");
    setVisitState({
      clubId,
      tabs: {
        inicio: true,
        agenda: false,
        jugadores: false,
        finanzas: false,
        inventario: false,
      },
    });
  }
  if (zoneState.clubId !== clubId) {
    setZoneState({ clubId, hall: false, albums: false });
  }
  const visited =
    visitState.clubId === clubId
      ? visitState.tabs
      : {
          inicio: true,
          agenda: false,
          jugadores: false,
          finanzas: false,
          inventario: false,
        };

  const hallSeen = zoneState.clubId === clubId && zoneState.hall;
  const albumsSeen = zoneState.clubId === clubId && zoneState.albums;
  const markHallSeen = useCallback(() => {
    setZoneState((prev) => (prev.hall ? prev : { ...prev, hall: true }));
  }, []);
  const markAlbumsSeen = useCallback(() => {
    setZoneState((prev) => (prev.albums ? prev : { ...prev, albums: true }));
  }, []);

  const slices = useMemo(() => {
    const need = new Set<ClubSlice>();
    if (visited.inicio || visited.agenda || visited.jugadores || visited.finanzas) {
      need.add("players");
    }
    if (visited.agenda || hallSeen || albumsSeen) need.add("events");
    if (albumsSeen) need.add("gallery");
    if (visited.jugadores) need.add("goals");
    if (visited.finanzas) need.add("transactions");
    if (visited.inventario) need.add("inventory");
    return [...need];
  }, [visited, hallSeen, albumsSeen]);

  const {
    clubInfo,
    clubExists,
    transactions,
    players,
    inventory,
    events,
    gallery,
    goals,
    ready,
    loading,
  } = useClubData(clubId, slices);
  const [showMembers, setShowMembers] = useState(false);

  // ── Competición: partidos oficiales del club y catálogo de la plataforma ──
  const { seasons, categories, tournaments, clubNames, tournamentsById, seasonName, categoryName, loading: catalogLoading } =
    usePlatformCatalog();
  const [scope, setScope] = useState<StatsScope>({});
  const [scopeReady, setScopeReady] = useState(false);
  const { matches } = useClubScopedMatches(clubId, scopeReady ? scope : null);

  useEffect(() => {
    if (catalogLoading || scopeReady) return;
    const seasonId = defaultSeasonId(seasons);
    setScope(seasonId ? { seasonId } : {});
    setScopeReady(true);
  }, [catalogLoading, scopeReady, seasons]);

  /** Todos los partidos oficiales (programados y jugados) en forma de evento, para la agenda. */
  const officialEvents = useMemo(
    () =>
      matches
        .filter((m) => calendarStatus(m) !== "unscheduled")
        .map((m) =>
          matchToClubEvent(m, clubId, clubNames, tournamentsById[m.tournamentId]?.name),
        ),
    [matches, clubId, clubNames, tournamentsById],
  );
  /** Partidos jugados dentro del filtro, para estadísticas de jugadores y del equipo. */
  const scopedPlayedMatches = useMemo(
    () => applyScope(matches.filter(isPlayed), scope),
    [matches, scope],
  );
  const statsEvents = useMemo(
    () => [
      ...events,
      ...scopedPlayedMatches.map((m) =>
        matchToClubEvent(m, clubId, clubNames, tournamentsById[m.tournamentId]?.name),
      ),
    ],
    [events, scopedPlayedMatches, clubId, clubNames, tournamentsById],
  );
  const teamRecord = useMemo(
    () => computeTeamRecord(scopedPlayedMatches, clubId),
    [scopedPlayedMatches, clubId],
  );
  const trophies = useMemo(
    () =>
      clubTrophies(
        tournaments.filter(
          (t) =>
            (!scope.seasonId || t.seasonId === scope.seasonId) &&
            (!scope.categoryId || t.categoryId === scope.categoryId),
        ),
        clubId,
      ),
    [tournaments, clubId, scope],
  );
  const scopeLabel = useMemo(() => {
    const parts = [
      scope.seasonId ? seasonName[scope.seasonId] : "Histórico",
      scope.categoryId ? categoryName[scope.categoryId] : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [scope, seasonName, categoryName]);

  // Uso del hook de responsividad
  const { width } = useWindowSize();
  const isMobile = width < 500;
  const isUltraSmall = width < 400;

  const navContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [showEditClub, setShowEditClub] = useState(false);
  const [editClubName, setEditClubName] = useState("");
  const [editClubLogo, setEditClubLogo] = useState("");
  const [editClubPhone, setEditClubPhone] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [newlyUploadedLogos, setNewlyUploadedLogos] = useState<string[]>([]);

  const handleOpenEditClub = () => {
    setEditClubName(clubInfo?.name || DEFAULT_CLUB_NAME);
    setEditClubLogo(clubInfo?.logoUrl || DEFAULT_CLUB_LOGO);
    setEditClubPhone(clubInfo?.presidentPhone || "");
    setNewlyUploadedLogos([]);
    setShowEditClub(true);
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const url = await uploadImageFile(
        storagePath("logos", `logo_${Date.now()}.jpg`),
        file,
        options,
      );
      setNewlyUploadedLogos((prev) => [...prev, url]);
      setEditClubLogo(url);
    } catch (error) {
      console.error("Error subiendo logo:", error);
      alert("Error al subir el escudo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCancelEditClub = async () => {
    if (newlyUploadedLogos.length > 0) {
      const storage = getStorage();
      for (const urlToDelete of newlyUploadedLogos) {
        try {
          const fileRef = ref(storage, urlToDelete);
          await deleteObject(fileRef);
          console.log("Logo cancelado, eliminado con éxito:", urlToDelete);
        } catch (error) {
          console.error("No se pudo eliminar el logo cancelado:", error);
        }
      }
    }
    setNewlyUploadedLogos([]);
    setShowEditClub(false);
  };

  useModalLock(showEditClub ? () => { void handleCancelEditClub(); } : null);

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const storage = getStorage();
      const oldLogo = clubInfo?.logoUrl;
      if (
        oldLogo &&
        oldLogo !== editClubLogo &&
        oldLogo.includes("firebasestorage.googleapis.com")
      ) {
        try {
          const fileRef = ref(storage, oldLogo);
          await deleteObject(fileRef);
        } catch (e) {}
      }
      const orphanedNewLogos = newlyUploadedLogos.filter(
        (url) => url !== editClubLogo,
      );
      for (const url of orphanedNewLogos) {
        try {
          const fileRef = ref(storage, url);
          await deleteObject(fileRef);
        } catch (e) {}
      }
      await updateDoc(clubRef, {
        name: editClubName,
        logoUrl: editClubLogo,
        presidentPhone: editClubPhone.trim(),
      });
      setNewlyUploadedLogos([]);
      setShowEditClub(false);
    } catch (error) {
      console.error("Error al actualizar el club:", error);
      alert("Hubo un problema al guardar los cambios.");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("¿Cerrar sesión?")) {
      await logout();
    }
  };

  const goToLogin = () => {
    navigate(`/login?next=${encodeURIComponent(`/${clubInfo?.slug || clubId}`)}`);
  };

  const perms = useMemo(
    () => buildPerms(role, isSuperAdmin),
    [role, isSuperAdmin],
  );

  const roleLabel = isSuperAdmin
    ? "Superadmin"
    : role
      ? ROLE_LABELS[role]
      : user
        ? "Visitante"
        : "Plantilla";
  const hasAccess = !!user && (isSuperAdmin || !!role);

  const navItems = [
    { key: "inicio", label: "Inicio", icon: <HomeIcon size={16} /> },
    { key: "agenda", label: "Agenda", icon: <Calendar size={16} /> },
    { key: "jugadores", label: "Jugadores", icon: <Users size={16} /> },
    { key: "finanzas", label: "Finanzas", icon: <Wallet size={16} /> },
    { key: "inventario", label: "Inventario", icon: <Package size={16} /> },
  ] as const;

  const activeIndex = useMemo(() => {
    return navItems.findIndex((item) => item.key === activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (navContainerRef.current) {
      const container = navContainerRef.current;
      const activeTabElement = container.children[activeIndex] as HTMLElement;

      if (activeTabElement) {
        const containerCenter = container.clientWidth / 2;
        const tabCenter = activeTabElement.clientWidth / 2;
        const scrollPos =
          activeTabElement.offsetLeft - containerCenter + tabCenter;

        container.scrollTo({
          left: scrollPos,
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    if (window.location.hash !== "#disponibilidad") return;
    setActiveTab("agenda");
    setVisitState((prev) =>
      prev.tabs.agenda
        ? prev
        : { ...prev, tabs: { ...prev.tabs, agenda: true } },
    );
  }, [clubId]);

  useEffect(() => {
    if (activeTab !== "agenda" || window.location.hash !== "#disponibilidad") return;
    const node = document.getElementById("disponibilidad");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab, clubId]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setVisitState((prev) =>
      prev.tabs[tab]
        ? prev
        : { ...prev, tabs: { ...prev.tabs, [tab]: true } },
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionReady = (key: typeof activeTab) => {
    if (key === "inicio") return ready.players;
    if (key === "agenda") return ready.players && ready.events;
    if (key === "jugadores") return ready.players && ready.goals;
    if (key === "finanzas") return ready.players && ready.transactions;
    return ready.inventory;
  };

  if (clubExists === false) {
    return <ClubNotFound slug={normalizeSlug(routeSlug)} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.gray50,
        color: C.gray800,
      }}
    >
      <header
        style={{
          background: `linear-gradient(135deg, ${C.navy900} 0%, #0a1120 100%)`,
          color: C.white,
          // 👇 En móviles reducimos el padding para darle más cancha al texto
          padding: isMobile ? "1rem" : "1.25rem 1.5rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: isMobile ? "0.5rem" : "1rem", // 👇 Menos hueco al centro en móviles
          }}
        >
          {/* ── IZQUIERDA: ESCUDO E INFO ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "0.5rem" : "0.875rem", // 👇 Escudo y texto más juntos en móviles
              flex: 1,
              minWidth: 0,
            }}
          >
            <Link
              to="/"
              title="Todos los clubes"
              style={{
                display: "flex",
                alignItems: "center",
                color: C.gray400,
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={16} />
            </Link>

            {/* CONTENEDOR DEL LOGO CON LÁPIZ TIPO "BADGE" */}
            <div
              style={{ position: "relative", display: "flex", flexShrink: 0 }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "#121212",
                  border: `1.5px solid ${C.amber}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={clubInfo?.logoUrl || DEFAULT_CLUB_LOGO}
                  alt="Escudo del Club"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scale(1.5)",
                  }}
                />
              </div>

              {perms.isAdmin && (
                <button
                  onClick={handleOpenEditClub}
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-4px",
                    backgroundColor: C.navy900,
                    border: `1px solid ${C.amber}`,
                    color: C.amber,
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                    transition: "transform 0.2s ease",
                  }}
                  title="Editar información del club"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <Edit2 size={10} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* 👇 CONTENEDOR DEL TÍTULO (Restaurado a 1 sola línea) 👇 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <h1
                style={{
                  // 👇 Reducción de tamaño estricta basada en el ancho de la pantalla
                  fontSize: isUltraSmall
                    ? "0.8rem"
                    : isMobile
                      ? "0.95rem"
                      : "1.25rem",
                  fontWeight: "800",
                  margin: 0,
                  letterSpacing: "-0.02em",
                  color: C.white,
                  whiteSpace: "nowrap", // 👈 PROHIBIDO saltar a segunda línea
                  overflow: "hidden",
                  textOverflow: "clip", // 👈 Corta al ras si es necesario, sin puntos suspensivos
                  transition: "font-size 0.2s ease", // Suaviza el cambio al girar el celular
                }}
              >
                {clubInfo?.name || DEFAULT_CLUB_NAME}
              </h1>
            </div>
          </div>

          {/* ── DERECHA: ESTADO, ROL Y ACCIONES ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexShrink: 0,
            }}
          >
            <div
              title={
                loading
                  ? "Sincronizando con la nube..."
                  : "Base de datos sincronizada"
              }
              style={{
                display: isUltraSmall ? "none" : "flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: "rgba(0,0,0,0.3)",
                padding: "4px 8px",
                borderRadius: RADIUS.full,
                border: `1px solid rgba(255,255,255,0.05)`,
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: loading ? C.amber : C.green,
                  boxShadow: `0 0 6px ${loading ? C.amber : C.green}`,
                }}
              />
              <span
                style={{
                  fontSize: "0.6rem",
                  color: C.gray300,
                  fontWeight: "800",
                  letterSpacing: "0.05em",
                }}
              >
                {loading ? "SYNC" : "LIVE"}
              </span>
            </div>

            <div
              style={{
                width: "1px",
                height: "16px",
                backgroundColor: "rgba(255,255,255,0.15)",
                display: isUltraSmall ? "none" : "block",
              }}
            />

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                title={user?.email || undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  backgroundColor: hasAccess
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(255,255,255,0.1)",
                  padding: "4px 10px",
                  borderRadius: RADIUS.full,
                  fontSize: "0.65rem",
                  fontWeight: "800",
                  color: hasAccess ? C.amber : C.gray300,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                {isSuperAdmin ? (
                  <Crown size={10} />
                ) : role === "admin" ? (
                  <Shield size={10} />
                ) : role === "dt" ? (
                  <LayoutTemplate size={10} />
                ) : role === "tesorero" ? (
                  <Wallet size={10} />
                ) : role === "prensa" ? (
                  <Camera size={10} />
                ) : null}
                {roleLabel}
              </div>

              {perms.canManageMembers && (
                <button
                  onClick={() => setShowMembers(true)}
                  title="Gestionar administradores del club"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: `1px solid rgba(255,255,255,0.15)`,
                    borderRadius: RADIUS.md,
                    color: C.white,
                    cursor: "pointer",
                    padding: "0.35rem 0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                  }}
                >
                  <UserCog size={12} />
                  <span style={{ display: isMobile ? "none" : "inline" }}>
                    Administradores
                  </span>
                </button>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: `1px solid rgba(239, 68, 68, 0.3)`,
                    borderRadius: RADIUS.md,
                    color: C.red || "#ef4444",
                    cursor: "pointer",
                    padding: "0.35rem 0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                  }}
                >
                  <LogOut size={12} />
                  <span style={{ display: isMobile ? "none" : "inline" }}>
                    Salir
                  </span>
                </button>
              ) : (
                <button
                  onClick={goToLogin}
                  title="Acceso Directiva"
                  style={{
                    background: C.white,
                    border: "none",
                    borderRadius: RADIUS.md,
                    color: C.navy900,
                    cursor: "pointer",
                    padding: "0.35rem 0.6rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <Lock size={12} />
                  <span style={{ display: isMobile ? "none" : "inline" }}>
                    Login
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AdSlot placement="club" layout="club" />

      {/* ── MODAL EDITAR INFO DEL CLUB ── */}
      {showEditClub && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 41, 0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={handleCancelEditClub}
        >
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: RADIUS.xl,
              width: "100%",
              maxWidth: "420px",
              boxShadow: SHADOWS.xl,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: C.gray50,
                borderBottom: `1px solid ${C.gray200}`,
                padding: "1.25rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: C.navy900,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    padding: "6px",
                    borderRadius: "50%",
                    display: "flex",
                  }}
                >
                  <Edit2 size={16} color={C.amber} />
                </div>
                Ajustes del Club
              </h3>
              <button
                onClick={handleCancelEditClub}
                style={{
                  background: C.white,
                  border: `1px solid ${C.gray200}`,
                  borderRadius: "50%",
                  color: C.gray500,
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveClub}
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: C.gray500,
                    marginBottom: "0.4rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Nombre del Equipo
                </label>
                <FormInput
                  type="text"
                  required
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
                  placeholder={`Ej. ${DEFAULT_CLUB_NAME}`}
                  style={{
                    width: "100%",
                    fontSize: "1rem",
                    fontWeight: "600",
                    padding: "0.75rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: C.gray500,
                    marginBottom: "0.4rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Teléfono del presidente
                </label>
                <FormInput
                  type="tel"
                  value={editClubPhone}
                  onChange={(e) => setEditClubPhone(e.target.value)}
                  placeholder="Ej. 622 123 4567"
                  maxLength={29}
                  style={{
                    width: "100%",
                    fontSize: "1rem",
                    fontWeight: "600",
                    padding: "0.75rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: C.gray500,
                    marginBottom: "0.5rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Escudo del Club (Logo)
                </label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "1rem",
                    backgroundColor: C.gray50,
                    borderRadius: RADIUS.lg,
                    border: `1px solid ${C.gray100}`,
                  }}
                >
                  <img
                    src={
                      editClubLogo ||
                      "https://ui-avatars.com/api/?name=Club&background=f1f5f9&color=94a3b8"
                    }
                    alt="Vista previa"
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `2px solid ${C.gray200}`,
                      boxShadow: SHADOWS.sm,
                      backgroundColor: C.white,
                      flexShrink: 0,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        backgroundColor: C.white,
                        border: `1px solid ${C.gray200}`,
                        color: C.navy900,
                        padding: "0.4rem 0.875rem",
                        borderRadius: RADIUS.full,
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: isUploadingLogo ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        opacity: isUploadingLogo ? 0.6 : 1,
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <UploadCloud size={14} color={C.amber} />
                      {isUploadingLogo ? "Subiendo..." : "Cambiar Imagen"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLogoUpload(e.target.files[0]);
                          }
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: C.gray400,
                        fontWeight: "500",
                      }}
                    >
                      Recomendado: PNG o JPG (Max. 2MB)
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      backgroundColor: C.gray200,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: C.gray400,
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                    }}
                  >
                    O PEGAR URL
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      backgroundColor: C.gray200,
                    }}
                  />
                </div>

                <FormInput
                  type="url"
                  value={editClubLogo}
                  onChange={(e) => setEditClubLogo(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                  style={{
                    width: "100%",
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: C.gray600,
                  }}
                />
              </div>

              <div
                style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}
              >
                <SecondaryButton
                  type="button"
                  onClick={handleCancelEditClub}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  style={{ flex: 1, opacity: isUploadingLogo ? 0.7 : 1 }}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? "Guardando..." : "Guardar Cambios"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE MIEMBROS (ADMIN / SUPERADMIN) ── */}
      {showMembers && (
        <MembersModal
          clubName={clubInfo?.name || DEFAULT_CLUB_NAME}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* ── NAVIGATION (SWIPEABLE & AUTO-CENTERED TABS) ── */}
      <nav
        style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.gray200}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: SHADOWS.sm,
        }}
      >
        <div
          ref={navContainerRef}
          className="hide-scroll"
          style={{
            display: "flex",
            gap: "0.25rem",
            maxWidth: "800px",
            margin: "0 auto",
            justifyContent: "flex-start",
            overflowX: "auto",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            padding: "0 0.5rem",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.875rem 1rem",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8125rem",
                backgroundColor: "transparent",
                color: activeTab === item.key ? C.navy900 : C.gray500,
                borderBottom:
                  activeTab === item.key
                    ? `2px solid ${C.navy900}`
                    : "2px solid transparent",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN CONTENT (DYNAMIC SLIDER CONTAINER) ── */}
      <main
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          overflow: "hidden",
          minHeight: "calc(100vh - 140px)",
          backgroundColor: "#f8fafc",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 2rem",
              minHeight: "50vh",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: `3px solid ${C.gray200}`,
                borderTop: `3px solid ${C.amber}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            />
            <p
              style={{
                color: C.gray500,
                fontWeight: "600",
                fontSize: "0.9rem",
                letterSpacing: "0.02em",
              }}
            >
              Sincronizando el vestuario...
            </p>
          </div>
        ) : (
          <div
            ref={sliderRef}
            style={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
              transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
              willChange: "transform",
            }}
          >
            {navItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.key}
                  className={isActive ? "club-tab-pane" : undefined}
                  style={{
                    width: "100%",
                    flexShrink: 0,
                    boxSizing: "border-box",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.4s ease",
                    visibility: isActive ? "visible" : "hidden",
                    pointerEvents: isActive ? "auto" : "none",
                    height: isActive ? "auto" : "0px",
                    overflow: "hidden",
                  }}
                >
                  {item.key === "inicio" &&
                    (sectionReady("inicio") ? (
                    <Home
                      clubInfo={clubInfo}
                      players={players}
                      events={statsEvents}
                      clubEvents={events}
                      gallery={gallery}
                      eventsReady={ready.events}
                      galleryReady={ready.gallery}
                      hallSeen={hallSeen}
                      albumsSeen={albumsSeen}
                      onHallSeen={markHallSeen}
                      onAlbumsSeen={markAlbumsSeen}
                      perms={perms}
                      teamRecord={teamRecord}
                      scopeLabel={scopeLabel}
                      trophies={trophies}
                      seasonName={seasonName}
                      categoryName={categoryName}
                      scope={scope}
                      onScopeChange={setScope}
                      seasons={seasons}
                      categories={categories}
                    />
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "agenda" &&
                    visited.agenda &&
                    (sectionReady("agenda") ? (
                    <>
                    {perms.canEditAgenda && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <AvailabilityPanel clubId={clubId} />
                      </div>
                    )}
                    <Agenda
                      events={events}
                      officialEvents={officialEvents}
                      players={players}
                      clubInfo={clubInfo}
                      perms={perms}
                    />
                    </>
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "jugadores" && visited.jugadores && (
                    sectionReady("jugadores") ? (
                    <>
                    <StatsScopeBar
                      scope={scope}
                      onChange={setScope}
                      seasons={seasons}
                      categories={categories}
                    />
                    <Players
                      players={players}
                      events={statsEvents}
                      perms={perms}
                      goals={goals}
                    />
                    </>
                    ) : (
                      <SectionPending />
                    )
                  )}
                  {item.key === "finanzas" &&
                    visited.finanzas &&
                    (sectionReady("finanzas") ? (
                    <Finances
                      transactions={transactions as any}
                      players={players as any}
                      perms={perms}
                    />
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "inventario" &&
                    visited.inventario &&
                    (sectionReady("inventario") ? (
                    <Inventory inventory={inventory} perms={perms} />
                    ) : (
                      <SectionPending />
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
