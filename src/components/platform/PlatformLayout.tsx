import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Crown,
  Image as ImageIcon,
  Inbox,
  Megaphone,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Calendar,
  MapPin,
  Shield,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModalLock } from "../../hooks/useModalLock";
import { C } from "../ui";
import { PLATFORM_NAME } from "../../lib/clubDefaults";
import { hasAnySocial } from "../../lib/social";
import SocialLinks from "./SocialLinks";

type AdminTab = "clubs" | "competition" | "cover" | "ads" | "inbox" | "admins" | "courts";

/** Sobrevive al remonte del layout al cambiar de ruta. */
let scrollTopAfterNav = false;

/** Cabecera + contenedor común para las páginas de plataforma (landing, login, admin). */
export default function PlatformLayout({
  children,
  maxWidth,
  landing,
  flush,
}: {
  children: ReactNode;
  maxWidth?: string;
  landing?: boolean;
  flush?: boolean;
}) {
  const { user, isSuperAdmin, logout, platformConfig } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const brandName = platformConfig?.name?.trim() || PLATFORM_NAME;
  const logoUrl = platformConfig?.logoUrl?.trim();
  const adminTab = ((): AdminTab => {
    const tab = new URLSearchParams(search).get("tab");
    return tab === "competition" ||
      tab === "cover" ||
      tab === "ads" ||
      tab === "inbox" ||
      tab === "admins" ||
      tab === "courts"
      ? tab
      : "clubs";
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
    if (!scrollTopAfterNav) return;
    scrollWindowTop();
  }, [pathname]);

  useEffect(() => {
    if (!scrollTopAfterNav) return;
    scrollTopAfterNav = false;
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
    scrollTopAfterNav = true;
  };

  const renderAuthButton = () =>
    user ? (
      <button
        type="button"
        className="platform-auth-btn is-out"
        title={user.email || ""}
        onClick={() => {
          closeMenu();
          void logout();
        }}
      >
        <LogOut size={14} /> Salir
      </button>
    ) : (
      <button
        type="button"
        className="platform-auth-btn is-in"
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
        {platformConfig?.courtsEnabled &&
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
                "Equipos",
                <Shield size={16} />,
                pathname === "/admin" && adminTab === "clubs",
                true,
              )}
              {navLink(
                "/admin?tab=competition",
                "Competición",
                <Trophy size={16} />,
                pathname === "/admin" && adminTab === "competition",
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
                "/admin?tab=inbox",
                "Solicitudes",
                <Inbox size={16} />,
                pathname === "/admin" && adminTab === "inbox",
                true,
              )}
            </div>
            <div className="platform-sidebar__section">
              <div className="platform-sidebar__section-label">Contenido</div>
              {navLink(
                "/admin?tab=ads",
                "Publicidad",
                <Megaphone size={16} />,
                pathname === "/admin" && adminTab === "ads",
                true,
              )}
              {navLink(
                "/admin?tab=cover",
                "Portada",
                <ImageIcon size={16} />,
                pathname === "/admin" && adminTab === "cover",
                true,
              )}
            </div>
            <div className="platform-sidebar__section">
              <div className="platform-sidebar__section-label">Configuración</div>
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

      <div className="platform-sidebar__foot">
        {renderAuthButton()}
      </div>
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
        <header className="platform-topbar">
          <button
            type="button"
            className="platform-topbar__menu"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link to="/" className="platform-topbar__brand" onClick={closeMenu}>
            {logoUrl ? (
              <img src={logoUrl} alt="" />
            ) : (
              <Shield className="platform-topbar__mark" color={C.amber} />
            )}
            <span>{brandName}</span>
          </Link>
          <div className="platform-topbar__auth">{renderAuthButton()}</div>
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
        <footer className="platform-footer">
          <div className="platform-footer__inner">
            <div className="platform-footer__brand">
              <Link to="/" className="platform-footer__logo" onClick={closeMenu}>
                {logoUrl ? (
                  <img src={logoUrl} alt="" />
                ) : (
                  <Shield size={22} color={C.amber} />
                )}
                <span>{brandName}</span>
              </Link>
            </div>
            <nav className="platform-footer__nav" aria-label="Enlaces del pie">
              <Link to="/" onClick={() => onDestinationClick("/")}>
                Inicio
              </Link>
              <Link to="/equipos" onClick={() => onDestinationClick("/equipos")}>
                Equipos
              </Link>
              <Link to="/torneos" onClick={() => onDestinationClick("/torneos")}>
                Torneos
              </Link>
              <Link to="/partidos" onClick={() => onDestinationClick("/partidos")}>
                Partidos
              </Link>
              <Link
                to="/contacto#formulario"
                onClick={() => onDestinationClick("/contacto#formulario")}
              >
                Contacto
              </Link>
              <Link
                to="/registrar-equipo#formulario"
                onClick={() => onDestinationClick("/registrar-equipo#formulario")}
              >
                Registra tu equipo
              </Link>
            </nav>
            {hasAnySocial(platformConfig?.social) && (
              <div className="platform-footer__social">
                <span>Síguenos</span>
                <SocialLinks social={platformConfig?.social} tone="dark" compact />
              </div>
            )}
          </div>
          <div className="platform-footer__bar">
            <span>
              © {new Date().getFullYear()} {brandName}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
