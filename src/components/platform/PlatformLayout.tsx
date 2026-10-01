import { useEffect, useState, type ReactNode } from "react";
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
  ) => (
    <Link
      to={to}
      onClick={closeMenu}
      className={active ? "platform-nav__link is-on" : "platform-nav__link"}
    >
      {icon}
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
        )}
        {navLink(
          "/partidos",
          "Partidos",
          <Calendar size={16} />,
          pathname === "/partidos",
        )}
        {navLink(
          "/equipos",
          "Equipos",
          <Shield size={16} />,
          pathname === "/equipos",
        )}
        {platformConfig?.courtsEnabled &&
          navLink(
            "/canchas",
            "Canchas",
            <MapPin size={16} />,
            pathname === "/canchas",
          )}
        {navLink(
          "/contacto",
          "Contacto",
          <Mail size={16} />,
          pathname === "/contacto",
        )}
        {navLink(
          "/registrar-equipo",
          "Registrar equipo",
          <UserPlus size={16} />,
          pathname === "/registrar-equipo",
        )}

        {isSuperAdmin && (
          <div className="platform-sidebar__group">
            <div className="platform-sidebar__label">Administración</div>
            {navLink(
              "/admin",
              "Clubes",
              <Shield size={16} />,
              pathname === "/admin" && adminTab === "clubs",
            )}
            {navLink(
              "/admin?tab=competition",
              "Competición",
              <Trophy size={16} />,
              pathname === "/admin" && adminTab === "competition",
            )}
            {navLink(
              "/admin?tab=cover",
              "Portada",
              <ImageIcon size={16} />,
              pathname === "/admin" && adminTab === "cover",
            )}
            {navLink(
              "/admin?tab=ads",
              "Publicidad",
              <Megaphone size={16} />,
              pathname === "/admin" && adminTab === "ads",
            )}
            {navLink(
              "/admin?tab=inbox",
              "Solicitudes",
              <Inbox size={16} />,
              pathname === "/admin" && adminTab === "inbox",
            )}
            {navLink(
              "/admin?tab=courts",
              "Canchas",
              <MapPin size={16} />,
              pathname === "/admin" && adminTab === "courts",
            )}
            {navLink(
              "/admin?tab=admins",
              "Administradores",
              <Crown size={16} />,
              pathname === "/admin" && adminTab === "admins",
            )}
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
              <Link to="/" onClick={closeMenu}>
                Inicio
              </Link>
              <Link to="/equipos" onClick={closeMenu}>
                Equipos
              </Link>
              <Link to="/torneos" onClick={closeMenu}>
                Torneos
              </Link>
              <Link to="/partidos" onClick={closeMenu}>
                Partidos
              </Link>
              <Link to="/contacto#formulario" onClick={closeMenu}>
                Contacto
              </Link>
              <Link to="/registrar-equipo#formulario" onClick={closeMenu}>
                Registrar equipo
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
