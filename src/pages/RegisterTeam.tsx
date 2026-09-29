import { useMemo, useState } from "react";
import { addDoc, serverTimestamp } from "firebase/firestore";
import PlatformLayout from "../components/platform/PlatformLayout";
import PageHeroBanner from "../components/platform/PageHeroBanner";
import PublicFormBand from "../components/platform/PublicFormBand";
import ClubDirectoryList, {
  CLUB_PAGE_SIZE,
} from "../components/platform/ClubDirectoryList";
import { usePlatformCatalog } from "../hooks/usePlatformCatalog";
import { teamApplicationsCol } from "../lib/paths";
import { EMAIL_RE } from "../lib/social";

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
    if (name.length < 2) return setError("Escribe el nombre del capitán.");
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
        <h1>Registrar equipo</h1>
        <p>
          La solicitud queda pendiente de aprobación. Te avisamos cuando el
          equipo quede registrado.
        </p>
        {sent ? (
          <p className="public-form-ok">
            Solicitud enviada. Queda pendiente de aprobación.
          </p>
        ) : (
          <form className="public-stack-form" onSubmit={handleSubmit}>
            <input
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Nombre completo del capitán"
              required
              maxLength={119}
              autoComplete="name"
            />
            <input
              type="email"
              value={captainEmail}
              onChange={(e) => setCaptainEmail(e.target.value)}
              placeholder="Email del capitán"
              required
              maxLength={119}
              autoComplete="email"
            />
            <input
              type="tel"
              value={captainPhone}
              onChange={(e) => setCaptainPhone(e.target.value)}
              placeholder="Teléfono celular del capitán"
              required
              maxLength={29}
              autoComplete="tel"
            />
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del equipo"
              required
              maxLength={79}
            />
            <label className="public-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                He leído y acepto el uso de mis datos para registrar al equipo.
              </span>
            </label>
            {error && <p className="public-form-error">{error}</p>}
            <button type="submit" className="public-submit" disabled={busy}>
              {busy ? "Enviando..." : "Envía"}
            </button>
          </form>
        )}
      </PublicFormBand>
      <section className="public-clubs-band">
        <h2>Únete a un equipo</h2>
        <ClubDirectoryList
          clubs={visibleClubs.slice(0, CLUB_PAGE_SIZE)}
          localityName={(club) =>
            localities.find((l) => l.id === club.localityId)?.name ||
            club.location ||
            ""
          }
          hasMore={visibleClubs.length > CLUB_PAGE_SIZE}
          moreTo="/equipos"
        />
      </section>
    </PlatformLayout>
  );
}
