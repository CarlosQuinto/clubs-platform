import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Crown,
  Image as ImageIcon,
  Inbox,
  Wallet,
  LogIn,
  Calendar,
  Mail,
  MapPin,
  Menu,
  Shield,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../domains/auth/AuthContext";
import { useModalLock } from "../../shared/useModalLock";
import { C } from "../../shared/ui";
import { usePlatformChrome } from "./usePlatformChrome";
import PlatformFooter from "./PlatformFooter";
import SpaceSwitcher from "./SpaceSwitcher";
import {
  clearScrollTopAfterNav,
  markScrollTopAfterNav,
  shouldScrollTopAfterNav,
} from "./scrollAfterNav";

type AdminTab = "inbox" | "players" | "content" | "admins" | "courts" | "finances";

export { markScrollTopAfterNav };

/**
 * Cabecera + contenedor común para las páginas de plataforma (landing, login, admin).
 * La página del club pasa `topbarCenter` (escudo y nombre en lugar de los enlaces)
 * y `topbarActions` (lo que va a la derecha en lugar del selector de la liga).
 */
export default function PlatformLayout({
  children,
  maxWidth,
  landing,
  flush,
  topbarCenter,
  topbarActions,
}: {
  children: ReactNode;
  maxWidth?: string;
  landing?: boolean;
  flush?: boolean;
  topbarCenter?: ReactNode;
  topbarActions?: ReactNode;
}) {
  const { user, isSuperAdmin } = useAuth();
  const chrome = usePlatformChrome(true);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const brandName = chrome.brandName;
  const logoUrl = chrome.logoUrl || "";
  const showCourts = chrome.courtsEnabled;
  const adminTab = ((): AdminTab => {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "cover" || tab === "ads") return "content";
    return tab === "players" ||
      tab === "content" ||
      tab === "admins" ||
      tab === "courts" ||
      tab === "finances"
      ? tab
      : "inbox";
  })();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, search]);

  useModalLock(menuOpen ? () => setMenuOpen(false) : null);

  const closeMenu = () => setMenuOpen(false);

  const scrollWindowTop = () => window.scrollTo(0, 0);

  // useLayoutEffect evita el destello; useEffect corre después de que el
  // menú suelta el bloqueo y restaura el scroll anterior.
  useLayoutEffect(() => {
    if (!shouldScrollTopAfterNav()) return;
    scrollWindowTop();
  }, [pathname]);

  useEffect(() => {
    if (!shouldScrollTopAfterNav()) return;
    clearScrollTopAfterNav();
    scrollWindowTop();
  }, [pathname]);

  /** Footer, Secciones y Administración: al tope, salvo Contacto y Registra tu equipo. */
  const onDestinationClick = (to: string) => {
    closeMenu();
    const hash = to.includes("#") ? to.slice(to.indexOf("#")) : "";
    const path = to.split("#")[0].split("?")[0];

    if (hash === "#formulario") {
      if (pathname === path && window.location.hash === "#formulario") {
        window.setTimeout(() => {
          document.getElementById("formulario")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 0);
      }
      return;
    }

    if (pathname === path) {
      scrollWindowTop();
      window.setTimeout(scrollWindowTop, 0);
      return;
    }
    markScrollTopAfterNav();
  };

  // Con sesión, el selector de espacios ya incluye «Cerrar sesión».
  const loginButton = (
    <button
      type="button"
      className="platform-auth-btn is-in platform-topbar__login"
      onClick={() => {
        closeMenu();
        navigate("/login");
      }}
    >
      <LogIn size={14} /> Entrar
    </button>
  );

  const navLink = (
    to: string,
    label: string,
    icon: ReactNode,
    active: boolean,
    scrollToDest = false,
  ) => (
    <Link
      to={to}
      onClick={() => (scrollToDest ? onDestinationClick(to) : closeMenu())}
      className={active ? "platform-nav__link is-on" : "platform-nav__link"}
    >
      <span className="platform-nav__icon">{icon}</span>
      {label}
    </Link>
  );

  // Enlaces visibles en la barra superior desde escritorio; el cajón sigue para móvil y administración.
  const topLinks: { to: string; label: string; active: boolean }[] = [
    { to: "/", label: "Inicio", active: pathname === "/" },
    {
      to: "/torneos",
      label: "Torneos",
      active: pathname === "/torneos" || pathname.startsWith("/torneos/"),
    },
    {
      to: "/partidos",
      label: "Partidos",
      active: pathname === "/partidos" || pathname.startsWith("/partido/"),
    },
    { to: "/equipos", label: "Equipos", active: pathname === "/equipos" },
    // Con el módulo de canchas apagado, su lugar lo ocupa Contacto
    showCourts
      ? { to: "/canchas", label: "Canchas", active: pathname === "/canchas" }
      : { to: "/contacto", label: "Contacto", active: pathname === "/contacto" },
  ];

  const sidebar = (
    <aside className={menuOpen ? "platform-sidebar is-open" : "platform-sidebar"}>
      <div className="platform-sidebar__head">
        <Link to="/" className="platform-sidebar__brand" onClick={closeMenu}>
          {logoUrl ? (
            <img src={logoUrl} alt="" />
          ) : (
            <Shield size={20} color={C.amber} />
          )}
          <span>{brandName}</span>
        </Link>
        <button
          type="button"
          className="platform-sidebar__close"
          aria-label="Cerrar menú"
          onClick={closeMenu}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="platform-sidebar__nav">
        <div className="platform-sidebar__label platform-sidebar__label--sections">
          Secciones
        </div>
        {navLink(
          "/torneos",
          "Torneos",
          <Trophy size={16} />,
          pathname === "/torneos" || pathname.startsWith("/torneos/"),
          true,
        )}
        {navLink(
          "/partidos",
          "Partidos",
          <Calendar size={16} />,
          pathname === "/partidos",
          true,
        )}
        {navLink(
          "/equipos",
          "Equipos",
          <Shield size={16} />,
          pathname === "/equipos",
          true,
        )}
        {showCourts &&
          navLink(
            "/canchas",
            "Renta una cancha",
            <MapPin size={16} />,
            pathname === "/canchas",
            true,
          )}
        {navLink(
          "/registrar-equipo#formulario",
          "Registra tu equipo",
          <UserPlus size={16} />,
          pathname === "/registrar-equipo",
          true,
        )}
        {navLink(
          "/contacto#formulario",
          "Contacto",
          <Mail size={16} />,
          pathname === "/contacto",
          true,
        )}

        {isSuperAdmin && (
          <div className="platform-sidebar__group">
            <div className="platform-sidebar__label">Administración</div>
            <div className="platform-sidebar__section">
              <div className="platform-sidebar__section-label">Operación</div>
              {navLink(
                "/admin",
                "Solicitudes",
                <Inbox size={16} />,
                pathname === "/admin" && adminTab === "inbox",
                true,
              )}
              {navLink(
                "/admin?tab=players",
                "Jugadores",
                <Users size={16} />,
                pathname === "/admin" && adminTab === "players",
                true,
              )}
              {navLink(
                "/admin?tab=courts",
                "Canchas",
                <MapPin size={16} />,
                pathname === "/admin" && adminTab === "courts",
                true,
              )}
              {navLink(
                "/admin?tab=finances",
                "Finanzas",
                <Wallet size={16} />,
                pathname === "/admin" && adminTab === "finances",
                true,
              )}
            </div>
            <div className="platform-sidebar__section">
              <div className="platform-sidebar__section-label">Plataforma</div>
              {navLink(
                "/admin?tab=content",
                "Contenido",
                <ImageIcon size={16} />,
                pathname === "/admin" && adminTab === "content",
                true,
              )}
              {navLink(
                "/admin?tab=admins",
                "Administradores",
                <Crown size={16} />,
                pathname === "/admin" && adminTab === "admins",
                true,
              )}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );

  return (
    <div className="platform-shell">
      {menuOpen && (
        <button
          type="button"
          className="platform-scrim"
          aria-label="Cerrar menú"
          onClick={closeMenu}
        />
      )}
      {sidebar}
      <div className="platform-body">
        <header className={topbarCenter ? "platform-topbar platform-topbar--club" : "platform-topbar"}>
          <button
            type="button"
            className="platform-topbar__menu"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {/* En la página del club la cabecera es del club: sin logo ni nombre de la plataforma */}
          {topbarCenter ? null : (
            <Link to="/" className="platform-topbar__brand" onClick={closeMenu}>
              {logoUrl ? (
                <img src={logoUrl} alt="" />
              ) : (
                <span className="platform-topbar__mark">
                  <Shield color={C.amber} />
                </span>
              )}
              <span>{brandName}</span>
            </Link>
          )}
          {topbarCenter ? (
            <div className="platform-topbar__center">{topbarCenter}</div>
          ) : (
            <nav className="platform-topbar__nav" aria-label="Secciones">
              {topLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={link.active ? "page" : undefined}
                  className={link.active ? "is-on" : undefined}
                  onClick={() => onDestinationClick(link.to)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          {topbarActions ? (
            <div className="platform-topbar__space">{topbarActions}</div>
          ) : user ? (
            <div className="platform-topbar__space">
              <SpaceSwitcher variant="topbar" />
            </div>
          ) : (
            <div className="platform-topbar__auth">{loginButton}</div>
          )}
        </header>
        <main
          className={[
            "platform-main",
            maxWidth ? "platform-main--narrow" : "",
            landing || flush ? "platform-main--flush" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={maxWidth ? { maxWidth } : undefined}
        >
          {children}
        </main>
        <PlatformFooter onLinkClick={onDestinationClick} />
      </div>
    </div>
  );
}
