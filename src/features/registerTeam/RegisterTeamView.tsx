import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, Shield, Sparkles, User } from "lucide-react";
import PlatformLayout, { markScrollTopAfterNav } from "../shell/PlatformLayout";
import PageHeroBanner from "../shell/PageHeroBanner";
import PublicFormBand from "../shell/PublicFormBand";
import { C } from "../../shared/ui";
import { DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { useRegisterTeam } from "./useRegisterTeam";
import type { ClubCardView } from "../teams/teamsViewState";

export default function RegisterTeamView() {
  const form = useRegisterTeam();

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
        {form.sent ? (
          <p className="public-form-ok" role="status" style={{ marginBottom: "0.85rem" }}>
            Solicitud enviada. Queda pendiente de aprobación.
          </p>
        ) : null}
        <form className="public-stack-form contact-form" onSubmit={form.onSubmit}>
            <Field icon={<User size={16} />}>
              <input
                value={form.captainName}
                onChange={(event) => form.onCaptainName(event.target.value)}
                placeholder="Nombre completo"
                required
                maxLength={40}
                autoComplete="name"
              />
            </Field>
            <Field icon={<Phone size={16} />}>
              <input
                type="tel"
                value={form.captainPhone}
                onChange={(event) => form.onCaptainPhone(event.target.value)}
                placeholder="Teléfono celular"
                required
                maxLength={16}
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
            <Field icon={<Mail size={16} />}>
              <input
                type="email"
                value={form.captainEmail}
                onChange={(event) => form.onCaptainEmail(event.target.value)}
                placeholder="Correo electrónico"
                required
                maxLength={320}
                autoComplete="email"
              />
            </Field>
            <Field icon={<Shield size={16} />}>
              <input
                value={form.teamName}
                onChange={(event) => form.onTeamName(event.target.value)}
                placeholder="Nombre del equipo"
                required
                maxLength={30}
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
            <button type="submit" className="public-submit" disabled={!form.ready || form.busy}>
              {form.busy ? "Enviando..." : "Enviar"}
            </button>
          </form>
      </PublicFormBand>
      {form.clubs.length > 0 ? (
        <section className="public-clubs-band">
          <div className="public-clubs-band__head">
            <h2>Únete a un equipo</h2>
            <Link to="/equipos" className="public-clubs-band__all">
              Ver todos →
            </Link>
          </div>
          <ClubMarquee clubs={form.clubs} />
        </section>
      ) : null}
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

function ClubMarquee({ clubs }: { clubs: ClubCardView[] }) {
  const cards = (clone: boolean) =>
    clubs.map((club) => (
      <article key={`${club.href}-${clone ? "b" : "a"}`} className="club-dir-card">
        <Link to={club.href} className="club-dir-card__main" tabIndex={clone ? -1 : undefined}>
          <div className="club-dir-card__logo">
            <img src={club.logoUrl || DEFAULT_CLUB_LOGO} alt="" />
          </div>
          <div className="club-dir-card__copy">
            <div className="club-dir-card__name">{club.name}</div>
            <div className="club-dir-card__meta">{club.locality}</div>
          </div>
          <ChevronRight size={16} color={C.gray400} />
        </Link>
      </article>
    ));

  return (
    <div className="club-dir-marquee">
      <div className="club-dir-grid is-marquee">
        <div className="club-dir-marquee__set">{cards(false)}</div>
        <div className="club-dir-marquee__set" aria-hidden="true">
          {cards(true)}
        </div>
      </div>
    </div>
  );
}
