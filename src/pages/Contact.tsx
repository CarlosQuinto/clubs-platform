import { useState } from "react";
import { addDoc, serverTimestamp } from "firebase/firestore";
import PlatformLayout from "../components/platform/PlatformLayout";
import PageHeroBanner from "../components/platform/PageHeroBanner";
import PublicFormBand from "../components/platform/PublicFormBand";
import { useAuth } from "../context/AuthContext";
import { inquiriesCol } from "../lib/paths";
import { EMAIL_RE, whatsappUrl } from "../lib/social";

const TOPICS = [
  { value: "torneos", label: "Torneos y ligas" },
  { value: "renta", label: "Renta de cancha" },
  { value: "disponibilidad", label: "Consulta de disponibilidad" },
  { value: "otro", label: "Otro" },
];

export default function Contact() {
  const { platformConfig } = useAuth();
  const whatsapp = platformConfig?.social?.whatsapp?.trim() || "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanName = `${cleanFirst} ${cleanLast}`.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanTopic = TOPICS.find((t) => t.value === topic)?.label || "";
    const cleanMessage = message.trim();
    if (cleanFirst.length < 2) return setError("Escribe tu nombre.");
    if (cleanLast.length < 2) return setError("Escribe tu apellido.");
    if (cleanPhone.replace(/\D/g, "").length < 7) {
      return setError("El teléfono no es válido.");
    }
    if (!EMAIL_RE.test(cleanEmail)) return setError("El correo no es válido.");
    if (!cleanTopic) return setError("Selecciona un tema.");
    if (cleanMessage.length < 3) return setError("Escribe un mensaje.");
    if (!consent) return setError("Debes aceptar el aviso de privacidad.");
    try {
      setBusy(true);
      await addDoc(inquiriesCol(), {
        name: cleanName.slice(0, 119),
        email: cleanEmail,
        phone: cleanPhone,
        topic: cleanTopic,
        message: cleanMessage,
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlatformLayout flush>
      <PageHeroBanner size="short" />
      <PublicFormBand>
        <h1>
          Pide información sobre los torneos, renta una cancha o consulta
          disponibilidad.
        </h1>
        {sent ? (
          <p className="public-form-ok">
            Mensaje enviado. Te contactamos pronto.
          </p>
        ) : (
          <form className="public-stack-form" onSubmit={handleSubmit}>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nombre"
              required
              maxLength={59}
              autoComplete="given-name"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Apellido"
              required
              maxLength={59}
              autoComplete="family-name"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono"
              required
              maxLength={29}
              autoComplete="tel"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              maxLength={119}
              autoComplete="email"
            />
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            >
              <option value="">Tema de la consulta</option>
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensaje"
              required
              maxLength={1999}
            />
            <label className="public-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                He leído y acepto el uso de mis datos para dar seguimiento a
                esta solicitud.
              </span>
            </label>
            {error && <p className="public-form-error">{error}</p>}
            <button type="submit" className="public-submit" disabled={busy}>
              {busy ? "Enviando..." : "Envía"}
            </button>
          </form>
        )}
        {whatsapp ? (
          <p className="public-form-whatsapp">
            O escríbenos al WhatsApp{" "}
            <a href={whatsappUrl(whatsapp)} target="_blank" rel="noreferrer">
              {whatsapp}
            </a>
          </p>
        ) : null}
      </PublicFormBand>
    </PlatformLayout>
  );
}
