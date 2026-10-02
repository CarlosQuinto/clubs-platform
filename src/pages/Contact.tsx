import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { Mail, MessageCircle, Phone, Sparkles, User } from "lucide-react";
import PlatformLayout, {
  markScrollTopAfterNav,
} from "../components/platform/PlatformLayout";
import PageHeroBanner from "../components/platform/PageHeroBanner";
import PublicFormBand from "../components/platform/PublicFormBand";
import { useAuth } from "../context/AuthContext";
import { inquiriesCol } from "../lib/paths";
import { EMAIL_RE } from "../lib/social";
import WhatsAppCard from "../components/platform/WhatsAppCard";

const TOPICS = [
  { value: "torneos", label: "Torneos y ligas" },
  { value: "renta", label: "Renta de cancha" },
  { value: "disponibilidad", label: "Consulta de disponibilidad" },
  { value: "otro", label: "Otro" },
];

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="contact-field__icon" aria-hidden="true">
      {children}
    </span>
  );
}

export default function Contact() {
  const { platformConfig } = useAuth();
  const whatsapp = platformConfig?.social?.whatsapp?.trim() || "";
  const [name, setName] = useState("");
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
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanTopic = TOPICS.find((t) => t.value === topic)?.label || "";
    const cleanMessage = message.trim();
    if (cleanName.length < 2) return setError("Escribe tu nombre.");
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
        <div className="contact-intro">
          <span className="contact-intro__mark" aria-hidden="true">
            <MessageCircle size={22} strokeWidth={2.25} />
            <Sparkles className="contact-intro__spark" size={14} />
          </span>
          <div>
            <h1>¿Tienes alguna duda?</h1>
            <p>
              Solicita información sobre los torneos,{" "}
              <Link
                to="/canchas"
                className="contact-intro__link"
                onClick={() => window.scrollTo(0, 0)}
              >
                renta de canchas
              </Link>{" "}
              y disponibilidad.
            </p>
            <span className="contact-intro__rule" />
          </div>
        </div>
        {sent ? (
          <p className="public-form-ok">
            Mensaje enviado. Te contactamos pronto.
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                maxLength={119}
                autoComplete="email"
              />
            </label>
            <label className="contact-field">
              <FieldIcon>
                <MessageCircle size={16} />
              </FieldIcon>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              >
                <option value="">Tema</option>
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="contact-field">
              <FieldIcon>
                <MessageCircle size={16} />
              </FieldIcon>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensaje"
                required
                maxLength={1999}
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
                uso de mis datos para dar seguimiento a esta solicitud.
              </span>
            </label>
            {error && <p className="public-form-error">{error}</p>}
            <button type="submit" className="public-submit" disabled={busy}>
              {busy ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}
        {whatsapp ? <WhatsAppCard phone={whatsapp} /> : null}
      </PublicFormBand>
    </PlatformLayout>
  );
}
