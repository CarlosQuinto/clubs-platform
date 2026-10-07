import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Home as HomeIcon, Calendar, Users, Wallet, Package, UserCog } from "lucide-react";
import { useClubModelContext } from "./useClubScreen";
import { useModalLock } from "../../shared/useModalLock";
import { acceptClubInvite, dataConnect, myOpenClubInvites, QueryFetchPolicy, saveClubProfile } from "../../infrastructure/dataconnect";
import { emailKey } from "../../shared/paths";
import { applyScope, calendarStatus, clubTrophies, computeTeamRecord, defaultSeasonId, isPlayed, matchToClubEvent } from "../../domains/competition/stats";
import type { StatsScope } from "../../shared/types";
import { useAuth } from "../../domains/auth/AuthContext";
import { useClub } from "../../domains/clubs/ClubContext";
import { buildPerms, ROLE_LABELS } from "../../domains/auth/roles";
import { invalidateMySpaces } from "../../domains/auth/mySpaces";
import { DEFAULT_CLUB_NAME, DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { requestClubRefresh } from "./useClubScreen";
import { deleteStoredImage, isStoredImageUrl, uploadImageFile } from "../../infrastructure/storage/uploadImage";
import { savedRow } from "../../shared/saved";
import { isCellPhone, isClubName, titleCase } from "../../shared/textLimits";

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

type ClubTab = "inicio" | "agenda" | "jugadores" | "finanzas" | "inventario" | "administradores";

function tabFromSearch(params: URLSearchParams): ClubTab {
  const value = params.get("seccion");
  if (
    value === "agenda" ||
    value === "jugadores" ||
    value === "finanzas" ||
    value === "inventario" ||
    value === "administradores"
  ) {
    return value;
  }
  return "inicio";
}

function visitedTabs(active: ClubTab) {
  return {
    inicio: true,
    agenda: active === "agenda",
    jugadores: active === "jugadores",
    finanzas: active === "finanzas",
    inventario: active === "inventario",
    administradores: active === "administradores",
  };
}

export function useClubShell() {
  const { slug: routeSlug = "" } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const section = tabFromSearch(searchParams);
  const { clubId, storagePath } = useClub();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { role: sqlRole } = useClubModelContext().model || { role: null };
  const screenModel = useClubModelContext().model;
  const role = sqlRole;
  const claimTried = useRef(false);
  useEffect(() => {
    if (!user?.email || !clubId || sqlRole || !screenModel?.exists || claimTried.current) return;
    claimTried.current = true;
    const email = user.email;
    void (async () => {
      const invites = await myOpenClubInvites(
        dataConnect,
        { emailKey: emailKey(email) },
        { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
      );
      const invite = invites.data.clubInvites.find((item) => item.club.id === clubId && item.token);
      if (!invite?.token) return;
      const result = await acceptClubInvite(dataConnect, {
        clubId,
        emailKey: emailKey(email),
        token: invite.token,
        displayName: user.displayName || "",
      });
      if (result.data.member == null) return;
      requestClubRefresh();
      invalidateMySpaces();
    })().catch((err: unknown) => {
      console.error("No se pudo reclamar la invitación:", err);
    });
  }, [user, clubId, sqlRole, screenModel?.exists]);
  const [activeTab, setActiveTab] = useState<ClubTab>(section);
  const [visitState, setVisitState] = useState({
    clubId,
    tabs: visitedTabs(section),
  });
  const [zoneState, setZoneState] = useState({
    clubId,
    hall: false,
    albums: false,
  });
  if (visitState.clubId !== clubId) {
    setActiveTab(section);
    setVisitState({
      clubId,
      tabs: visitedTabs(section),
    });
  }
  if (zoneState.clubId !== clubId) {
    setZoneState({ clubId, hall: false, albums: false });
  }
  const visited =
    visitState.clubId === clubId ? visitState.tabs : visitedTabs(section);

  const hallSeen = zoneState.clubId === clubId && zoneState.hall;
  const albumsSeen = zoneState.clubId === clubId && zoneState.albums;
  const markHallSeen = useCallback(() => {
    setZoneState((prev) => (prev.hall ? prev : { ...prev, hall: true }));
  }, []);
  const markAlbumsSeen = useCallback(() => {
    setZoneState((prev) => (prev.albums ? prev : { ...prev, albums: true }));
  }, []);

  const model = screenModel;
  const clubInfo = model?.clubInfo ?? null;
  const clubExists = model ? model.exists : null;
  const transactions = model?.transactions ?? [];
  const players = model?.players ?? [];
  const inventory = model?.inventory ?? [];
  const events = model?.events ?? [];
  const gallery = model?.gallery ?? [];
  const goals = model?.goals ?? [];
  const ready = {
    players: true,
    events: true,
    transactions: true,
    inventory: true,
    gallery: true,
    goals: true,
  };
  const loading = false;
  const seasons = model?.seasons ?? [];
  const categories = model?.categories ?? [];
  const tournaments = model?.tournaments ?? [];
  const clubNames = model?.clubNames ?? {};
  const tournamentsById = model?.tournamentsById ?? {};
  const seasonName = model?.seasonName ?? {};
  const categoryName = model?.categoryName ?? {};
  const catalogLoading = false;
  const [scope, setScope] = useState<StatsScope>({});
  const [scopeReady, setScopeReady] = useState(false);
  const matches = model?.matches ?? [];

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
        .filter((m) => calendarStatus(m) !== "unscheduled" && !m.walkover)
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
      for (const urlToDelete of newlyUploadedLogos) {
        try {
          await deleteStoredImage(urlToDelete);
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
    // Mismas reglas que el alta de club (create_club / save_club_profile): nombre en Title Case y teléfono de 10 a 15 dígitos
    const name = titleCase(editClubName.trim().replace(/ {2,}/g, " "));
    const phone = editClubPhone.trim();
    if (!isClubName(name)) {
      alert("El nombre del club debe tener de 3 a 30 letras o números.");
      return;
    }
    if (phone && !isCellPhone(phone)) {
      alert("El teléfono debe tener de 10 a 15 dígitos.");
      return;
    }
    try {
      const oldLogo = clubInfo?.logoUrl;
      if (
        oldLogo &&
        oldLogo !== editClubLogo &&
        isStoredImageUrl(oldLogo)
      ) {
        try {
          await deleteStoredImage(oldLogo);
        } catch (e) {}
      }
      const orphanedNewLogos = newlyUploadedLogos.filter(
        (url) => url !== editClubLogo,
      );
      for (const url of orphanedNewLogos) {
        try {
          await deleteStoredImage(url);
        } catch (e) {}
      }
      const saved = await saveClubProfile(dataConnect, {
        id: clubId,
        name,
        logoUrl: editClubLogo,
        presidentPhone: phone,
      });
      savedRow(saved.data.club);
      requestClubRefresh();
      invalidateMySpaces();
      setNewlyUploadedLogos([]);
      setShowEditClub(false);
    } catch (error) {
      console.error("Error al actualizar el club:", error);
      alert("Hubo un problema al guardar los cambios.");
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
      : "Visitante";
  const hasAccess = !!user && (isSuperAdmin || !!role);

  const navItems: { key: ClubTab; label: string; icon: React.ReactNode }[] = [
    { key: "inicio", label: "Inicio", icon: <HomeIcon size={16} /> },
    { key: "agenda", label: "Agenda", icon: <Calendar size={16} /> },
    { key: "jugadores", label: "Jugadores", icon: <Users size={16} /> },
    { key: "finanzas", label: "Finanzas", icon: <Wallet size={16} /> },
    { key: "inventario", label: "Inventario", icon: <Package size={16} /> },
    ...(perms.canManageMembers
      ? [{ key: "administradores" as const, label: "Administradores", icon: <UserCog size={16} /> }]
      : []),
  ];

  // Sin permiso (o con el rol aún cargando) la pestaña de administradores cae en Inicio.
  const shownTab: ClubTab =
    activeTab === "administradores" && !perms.canManageMembers ? "inicio" : activeTab;

  const activeIndex = Math.max(0, navItems.findIndex((item) => item.key === shownTab));

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
    setActiveTab(section);
    setVisitState((prev) => {
      if (prev.clubId !== clubId || prev.tabs[section]) return prev;
      return { ...prev, tabs: { ...prev.tabs, [section]: true } };
    });
  }, [section, clubId]);

  useEffect(() => {
    if (location.hash !== "#disponibilidad") return;
    setActiveTab("agenda");
    setVisitState((prev) =>
      prev.tabs.agenda
        ? prev
        : { ...prev, tabs: { ...prev.tabs, agenda: true } },
    );
    if (searchParams.get("seccion") === "agenda") return;
    const next = new URLSearchParams(searchParams);
    next.set("seccion", "agenda");
    navigate(
      {
        pathname: location.pathname,
        search: `?${next.toString()}`,
        hash: "#disponibilidad",
      },
      { replace: true },
    );
  }, [location.hash, location.pathname, searchParams, navigate]);

  useEffect(() => {
    if (activeTab !== "agenda" || location.hash !== "#disponibilidad") return;
    const node = document.getElementById("disponibilidad");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab, clubId, location.hash]);

  const handleTabChange = (tab: ClubTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "inicio") next.delete("seccion");
    else next.set("seccion", tab);
    const search = next.toString();
    const hash = tab === "agenda" ? location.hash : "";
    if (search !== searchParams.toString() || hash !== location.hash) {
      navigate({
        pathname: location.pathname,
        search: search ? `?${search}` : "",
        hash,
      });
    }
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
    if (key === "administradores") return true;
    return ready.inventory;
  };

  return {
    routeSlug,
    clubId,
    user,
    isSuperAdmin,
    screenModel,
    role,
    activeTab: shownTab,
    visited,
    hallSeen,
    albumsSeen,
    markHallSeen,
    markAlbumsSeen,
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
    seasons,
    categories,
    seasonName,
    categoryName,
    scope,
    setScope,
    officialEvents,
    statsEvents,
    teamRecord,
    trophies,
    scopeLabel,
    isMobile,
    isUltraSmall,
    navContainerRef,
    sliderRef,
    showEditClub,
    editClubName,
    setEditClubName,
    editClubLogo,
    setEditClubLogo,
    editClubPhone,
    setEditClubPhone,
    isUploadingLogo,
    handleOpenEditClub,
    handleLogoUpload,
    handleCancelEditClub,
    handleSaveClub,
    goToLogin,
    perms,
    roleLabel,
    hasAccess,
    navItems,
    activeIndex,
    handleTabChange,
    sectionReady,
  };
}
