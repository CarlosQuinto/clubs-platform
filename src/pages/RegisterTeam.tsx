import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { Mail, Phone, Shield, Sparkles, User } from "lucide-react";
import PlatformLayout, {
  markScrollTopAfterNav,
} from "../components/platform/PlatformLayout";
import PageHeroBanner from "../components/platform/PageHeroBanner";
import PublicFormBand from "../components/platform/PublicFormBand";
import ClubDirectoryList from "../components/platform/ClubDirectoryList";
import { usePlatformCatalog } from "../hooks/usePlatformCatalog";
import { teamApplicationsCol } from "../lib/paths";
import { EMAIL_RE } from "../lib/social";

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="contact-field__icon" aria-hidden="true">
      {children}
    </span>
  );
}

export default function RegisterTeam() {
  const { clubs, localities } = usePlatformCatalog();
  const [captainName, setCaptainName] = useState("");
  const [captainEmail, setCaptainEmail] = useState("");
  const [captainPhone, setCaptainPhone] = useState("");
  const [teamName, setTeamName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const visibleClubs = useMemo(
    () => clubs.filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name)),
    [clubs],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const name = captainName.trim();
    const email = captainEmail.trim().toLowerCase();
    const phone = captainPhone.trim();
    const team = teamName.trim();
    if (name.length < 2) return setError("Escribe el nombre completo.");
    if (!EMAIL_RE.test(email)) return setError("El correo no es válido.");
    if (phone.replace(/\D/g, "").length < 7) {
      return setError("El teléfono no es válido.");
    }
    if (team.length < 2) return setError("Escribe el nombre del equipo.");
    if (!consent) return setError("Debes aceptar el aviso de privacidad.");
    try {
      setBusy(true);
      await addDoc(teamApplicationsCol(), {
        captainName: name,
        captainEmail: email,
        captainPhone: phone,
        teamName: team,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlatformLayout flush>
      <PageHeroBanner size="short" />
      <PublicFormBand>
        <div className="contact-intro">
          <span className="contact-intro__mark" aria-hidden="true">
            <Shield size={22} strokeWidth={2.25} />
            <Sparkles className="contact-intro__spark" size={14} />
          </span>
          <div>
            <h1>Registra tu equipo</h1>
            <p>
              Completa el formulario para solicitar la inscripción de tu equipo.
              Te notificaremos una vez que sea aprobada.
            </p>
            <span className="contact-intro__rule" />
          </div>
        </div>
        {sent ? (
          <p className="public-form-ok">
            Solicitud enviada. Queda pendiente de aprobación.
          </p>
        ) : (
          <form
            className="public-stack-form contact-form"
            onSubmit={handleSubmit}
          >
            <label className="contact-field">
              <FieldIcon>
                <User size={16} />
              </FieldIcon>
              <input
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Nombre completo"
                required
                maxLength={119}
                autoComplete="name"
              />
            </label>
            <label className="contact-field">
              <FieldIcon>
                <Phone size={16} />
              </FieldIcon>
              <input
                type="tel"
                value={captainPhone}
                onChange={(e) => setCaptainPhone(e.target.value)}
                placeholder="Teléfono celular"
                required
                maxLength={29}
                autoComplete="tel"
              />
            </label>
            <label className="contact-field">
              <FieldIcon>
                <Mail size={16} />
              </FieldIcon>
              <input
                type="email"
                value={captainEmail}
                onChange={(e) => setCaptainEmail(e.target.value)}
                placeholder="Correo electrónico"
                required
                maxLength={119}
                autoComplete="email"
              />
            </label>
            <label className="contact-field">
              <FieldIcon>
                <Shield size={16} />
              </FieldIcon>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nombre del equipo"
                required
                maxLength={79}
              />
            </label>
            <label className="public-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                He leído y acepto el{" "}
                <Link
                  to="/aviso-de-privacidad"
                  onClick={(e) => {
                    e.stopPropagation();
                    markScrollTopAfterNav();
                  }}
                >
                  aviso de privacidad
                </Link>{" "}
                y el
                uso de mis datos para registrar al equipo.
              </span>
            </label>
            {error && <p className="public-form-error">{error}</p>}
            <button type="submit" className="public-submit" disabled={busy}>
              {busy ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}
      </PublicFormBand>
      {visibleClubs.length > 0 && (
        <section className="public-clubs-band">
          <div className="public-clubs-band__head">
            <h2>Únete a un equipo</h2>
            <Link to="/equipos" className="public-clubs-band__all">
              Ver todos →
            </Link>
          </div>
          <ClubDirectoryList
            marquee
            clubs={visibleClubs.slice(0, 10)}
            localityName={(club) =>
              localities.find((l) => l.id === club.localityId)?.name ||
              club.location ||
              ""
            }
          />
        </section>
      )}
    </PlatformLayout>
  );
}
