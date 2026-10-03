import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Phone, Sparkles, User } from "lucide-react";
import PlatformLayout, { markScrollTopAfterNav } from "../shell/PlatformLayout";
import PageHeroBanner from "../shell/PageHeroBanner";
import PublicFormBand from "../shell/PublicFormBand";
import WhatsAppCard from "../shell/WhatsAppCard";
import { useContact } from "./useContact";

export default function ContactView() {
  const form = useContact();

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
              <Link to="/canchas" className="contact-intro__link" onClick={() => window.scrollTo(0, 0)}>
                renta de canchas
              </Link>{" "}
              y disponibilidad.
            </p>
            <span className="contact-intro__rule" />
          </div>
        </div>
        {form.sent ? (
          <p className="public-form-ok">Mensaje enviado. Te contactamos pronto.</p>
        ) : (
          <form className="public-stack-form contact-form" onSubmit={form.onSubmit}>
            <Field icon={<User size={16} />}>
              <input
                value={form.name}
                onChange={(event) => form.onName(event.target.value)}
                placeholder="Nombre"
                required
                maxLength={119}
                autoComplete="name"
              />
            </Field>
            <Field icon={<Phone size={16} />}>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => form.onPhone(event.target.value)}
                placeholder="Teléfono"
                required
                maxLength={29}
                autoComplete="tel"
              />
            </Field>
            <Field icon={<Mail size={16} />}>
              <input
                type="email"
                value={form.email}
                onChange={(event) => form.onEmail(event.target.value)}
                placeholder="Email"
                required
                maxLength={119}
                autoComplete="email"
              />
            </Field>
            <Field icon={<MessageCircle size={16} />}>
              <select
                value={form.topic}
                onChange={(event) => form.onTopic(event.target.value)}
                required
              >
                <option value="">Tema</option>
                {form.topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field icon={<MessageCircle size={16} />}>
              <textarea
                rows={5}
                value={form.message}
                onChange={(event) => form.onMessage(event.target.value)}
                placeholder="Mensaje"
                required
                maxLength={1999}
              />
            </Field>
            <label className="public-consent">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => form.onConsent(event.target.checked)}
                required
              />
              <span>
                He leído y acepto los{" "}
                <Link to="/terminos" onClick={(event) => { event.stopPropagation(); markScrollTopAfterNav(); }}>
                  términos, condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  to="/aviso-de-privacidad"
                  onClick={(event) => { event.stopPropagation(); markScrollTopAfterNav(); }}
                >
                  política de privacidad
                </Link>{" "}
                para el tratamiento de mis datos personales.
              </span>
            </label>
            {form.error ? <p className="public-form-error">{form.error}</p> : null}
            <button type="submit" className="public-submit" disabled={form.busy}>
              {form.busy ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}
        {form.whatsapp ? <WhatsAppCard phone={form.whatsapp} /> : null}
      </PublicFormBand>
    </PlatformLayout>
  );
}

function Field({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <label className="contact-field">
      <span className="contact-field__icon" aria-hidden="true">
        {icon}
      </span>
      {children}
    </label>
  );
}
