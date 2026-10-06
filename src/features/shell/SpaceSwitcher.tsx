import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, RotateCw } from "lucide-react";
import { useAuth } from "../../domains/auth/AuthContext";
import { ADMIN_SPACE, useMyClubSpaces } from "../../domains/auth/mySpaces";
import type { Role } from "../../domains/auth/roles";
import ConfirmModal from "../../shared/ConfirmModal";
import { normalizeSlug } from "../../shared/paths";
import { C } from "../../shared/ui";
import { markScrollTopAfterNav } from "./scrollAfterNav";
import SpaceRow, { roleIcon, SpaceAvatar } from "./SpaceRow";
import { usePlatformChrome } from "./usePlatformChrome";

/** Club que se está viendo, para pintar el disparador dentro de su cabecera. */
export type SwitcherClub = {
  name: string;
  logoUrl?: string;
  role: Role | null;
  roleLabel: string;
  hasAccess: boolean;
};

/**
 * Selector de espacios de la cabecera: la liga, el panel de la plataforma
 * (superadmin) y los clubes donde la sesión tiene rol. El espacio activo
 * sale de la URL. Solo se monta con sesión.
 */
export default function SpaceSwitcher({
  variant,
  club,
}: {
  variant: "topbar" | "club";
  club?: SwitcherClub;
}) {
  const { user, isSuperAdmin, logout } = useAuth();
  const chrome = usePlatformChrome(true);
  const { clubs, failed, refresh } = useMyClubSpaces(user?.uid ?? null);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const routeSlug = normalizeSlug(pathname.split("/")[1] || "");
  const activeClubPath =
    variant === "club" ? clubs?.find((space) => space.slug === routeSlug)?.path ?? null : null;
  const adminActive = variant === "topbar" && pathname === "/admin";
  const leagueActive = variant === "topbar" && !adminActive;

  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  const placePanel = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({
      top: Math.round(rect.bottom + 8),
      right: Math.max(8, Math.round(window.innerWidth - rect.right)),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const toggle = () => {
    if (!open) refresh();
    setOpen((v) => !v);
  };

  const go = (path: string) => {
    setOpen(false);
    if (pathname === path && !search) {
      window.scrollTo(0, 0);
      return;
    }
    // La cabecera del club no usa PlatformLayout: el destino arranca arriba en ambos casos.
    markScrollTopAfterNav();
    navigate(path);
    window.setTimeout(() => window.scrollTo(0, 0), 0);
  };

  const askLogout = () => {
    setOpen(false);
    setConfirmLogout(true);
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  const leagueName = chrome.brandName || "Liga";
  const currentClub = activeClubPath ? clubs?.find((space) => space.path === activeClubPath) : null;
  const triggerLabel =
    variant === "club"
      ? `Cambiar de espacio (actual: ${club?.name || currentClub?.title || "club"})`
      : `Cambiar de espacio (actual: ${adminActive ? ADMIN_SPACE.title : leagueName})`;

  const trigger =
    variant === "club" ? (
      <button
        ref={triggerRef}
        type="button"
        className="space-switcher__trigger space-switcher__trigger--club"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={triggerLabel}
        title={user.email || undefined}
        onClick={toggle}
        style={{
          backgroundColor: club?.hasAccess ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.1)",
          color: club?.hasAccess ? C.amber : C.gray300,
        }}
      >
        {roleIcon(club?.role, isSuperAdmin, 11)}
        <span className="space-switcher__role">{club?.roleLabel}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
    ) : (
      <button
        ref={triggerRef}
        type="button"
        className="space-switcher__trigger space-switcher__trigger--topbar"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={triggerLabel}
        title={user.email || undefined}
        onClick={toggle}
      >
        {adminActive ? (
          <SpaceAvatar kind="admin" size={30} />
        ) : (
          <SpaceAvatar kind="league" logoUrl={chrome.logoUrl || undefined} size={30} />
        )}
        <span className="space-switcher__name">{adminActive ? "Administración" : "Mis espacios"}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    );

  const panelStyle = {
    "--sw-top": `${anchor.top}px`,
    "--sw-right": `${anchor.right}px`,
  } as CSSProperties;

  const panel = open
    ? createPortal(
        <>
          <div className="space-switcher__scrim" aria-hidden="true" />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Cambiar de espacio"
            className="space-switcher__menu"
            style={panelStyle}
          >
            <span className="space-switcher__grip" aria-hidden="true" />
            <p className="space-switcher__email">{user.email}</p>

            <div className="space-switcher__list">
              <SpaceRow
                avatar={<SpaceAvatar kind="league" logoUrl={chrome.logoUrl || undefined} />}
                title={leagueName}
                subtitle="Inicio · torneos y partidos"
                active={leagueActive}
                onClick={() => go("/")}
              />
              {isSuperAdmin && (
                <SpaceRow
                  avatar={<SpaceAvatar kind="admin" />}
                  title={ADMIN_SPACE.title}
                  subtitle={ADMIN_SPACE.subtitle}
                  active={adminActive}
                  onClick={() => go(ADMIN_SPACE.path)}
                />
              )}
            </div>

            <p className="space-switcher__label">Mis clubes</p>
            <div className="space-switcher__list">
              {clubs === null && !failed && (
                <>
                  <span className="space-switcher__skeleton" />
                  <span className="space-switcher__skeleton" />
                </>
              )}
              {clubs === null && failed && (
                <div className="space-switcher__notice">
                  No se pudieron cargar tus clubes.
                  <button type="button" onClick={refresh}>
                    <RotateCw size={12} /> Reintentar
                  </button>
                </div>
              )}
              {clubs?.length === 0 && (
                <p className="space-switcher__notice">Aún no tienes un rol en ningún club.</p>
              )}
              {clubs?.map((space) => (
                <SpaceRow
                  key={space.path}
                  avatar={<SpaceAvatar kind="club" logoUrl={space.logoUrl} />}
                  title={space.title}
                  subtitle={space.subtitle}
                  active={space.path === activeClubPath}
                  onClick={() => go(space.path)}
                />
              ))}
            </div>

            <button type="button" className="space-switcher__logout" onClick={askLogout}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger}
      {panel}
      <ConfirmModal
        open={confirmLogout}
        title="¿Cerrar sesión?"
        message={user.email ? `Saldrás de ${user.email} en este dispositivo.` : undefined}
        confirmLabel="Cerrar sesión"
        danger
        busy={loggingOut}
        onConfirm={() => void doLogout()}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
