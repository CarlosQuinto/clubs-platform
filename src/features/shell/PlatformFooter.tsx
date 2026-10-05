import { Link } from "react-router-dom";
import { Calendar, Mail, MapPin, Shield, Trophy, UserPlus } from "lucide-react";
import { C } from "../../shared/ui";
import { usePlatformChrome } from "./usePlatformChrome";
import { hasAnySocial } from "../../domains/platform/social";
import SocialLinks from "./SocialLinks";

/** Pie común de la plataforma (páginas de plataforma y página del club). */
export default function PlatformFooter({
  onLinkClick,
}: {
  /** Recibe el destino de cada enlace para decidir el scroll tras navegar. */
  onLinkClick: (to: string) => void;
}) {
  const chrome = usePlatformChrome(true);
  const brandName = chrome.brandName;
  const logoUrl = chrome.logoUrl || "";
  const motto = chrome.motto;
  const social = chrome.social;

  return (
    <footer className="platform-footer">
      <div className="platform-footer__inner">
        <div className="platform-footer__brand">
          <Link to="/" className="platform-footer__logo" onClick={() => onLinkClick("/")} aria-label={brandName}>
            {logoUrl ? (
              <img src={logoUrl} alt="" />
            ) : (
              <Shield size={22} color={C.amber} />
            )}
          </Link>
          <div className="platform-footer__identity">
            <Link to="/" className="platform-footer__name" onClick={() => onLinkClick("/")}>
              {brandName}
            </Link>
            {motto ? <p className="platform-footer__motto">{motto}</p> : null}
          </div>
        </div>
        <nav className="platform-footer__nav" aria-label="Enlaces del pie">
          <p className="platform-footer__label">Navegación</p>
          <Link to="/torneos" onClick={() => onLinkClick("/torneos")}>
            <Trophy size={16} /> Torneos
          </Link>
          <Link to="/partidos" onClick={() => onLinkClick("/partidos")}>
            <Calendar size={16} /> Partidos
          </Link>
          <Link to="/equipos" onClick={() => onLinkClick("/equipos")}>
            <Shield size={16} /> Equipos
          </Link>
          {chrome.courtsEnabled && (
            <Link to="/canchas" onClick={() => onLinkClick("/canchas")}>
              <MapPin size={16} /> Renta una cancha
            </Link>
          )}
          <Link
            to="/registrar-equipo#formulario"
            onClick={() => onLinkClick("/registrar-equipo#formulario")}
          >
            <UserPlus size={16} /> Registra tu equipo
          </Link>
          <Link
            to="/contacto#formulario"
            onClick={() => onLinkClick("/contacto#formulario")}
          >
            <Mail size={16} /> Contacto
          </Link>
        </nav>
        {hasAnySocial(social) && (
          <div className="platform-footer__social">
            <p className="platform-footer__label">Síguenos</p>
            <SocialLinks social={social} tone="dark" />
          </div>
        )}
      </div>
      <div className="platform-footer__bar">
        <span>
          © {new Date().getFullYear()} {brandName}. Todos los derechos
          reservados.
        </span>
        <nav className="platform-footer__legal" aria-label="Información legal">
          <Link
            to="/terminos"
            onClick={() => onLinkClick("/terminos")}
          >
            Términos de uso
          </Link>
          <span aria-hidden="true">|</span>
          <Link
            to="/aviso-de-privacidad"
            onClick={() => onLinkClick("/aviso-de-privacidad")}
          >
            Aviso de privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
