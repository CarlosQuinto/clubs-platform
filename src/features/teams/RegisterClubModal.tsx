import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { CheckCircle2, Home, Link2, Mail, MapPin, Phone, Plus, Shield, X } from "lucide-react";
import InviteSignupLink from "../shell/InviteSignupLink";
import NewLocalityInline from "./NewLocalityInline";
import { validateNewClub } from "../admin/clubsAdminMapper";
import { addClub, DATA_REVIEW_MESSAGE, loadClubs } from "../../domains/clubs/clubCommands";
import { DEFAULT_CLUB_DESCRIPTION, DEFAULT_HERO_IMAGE } from "../../domains/clubs/clubDefaults";
import { normalizeSlug } from "../../shared/paths";
import { cellPhone, clubName, emailText, neighborhood, publicSlug } from "../../shared/textLimits";
import { FormInput, FormSelect, PrimaryButton } from "../../shared/ui";
import { useModalLock } from "../../shared/useModalLock";

type Option = { id: string; name: string };
type Created = { slug: string; email: string };

/**
 * Alta de club (solo superadmin). Lo abren «Registrar equipo» en /equipos y en /admin → Equipos.
 * `embedded`: abierto desde otro modal (Editar torneo): queda encima, sin «Ver club» y, sin correo
 * del presidente que compartir, se cierra solo al crear.
 */
export default function RegisterClubModal({
  onClose,
  onCreated,
  initialName = "",
  embedded = false,
}: {
  onClose: () => void;
  onCreated: (club: { id: string; name: string }) => void;
  initialName?: string;
  embedded?: boolean;
}) {
  const [localities, setLocalities] = useState<Option[]>([]);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState(() => clubName(initialName));
  const [slug, setSlug] = useState(() => normalizeSlug(clubName(initialName)));
  const [localityId, setLocalityId] = useState("");
  const [location, setLocation] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [presidentPhone, setPresidentPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const slugEdited = useRef(false);
  const creating = useRef(false);
  const request = useRef(0);

  const close = useCallback(() => {
    if (!creating.current) onClose();
  }, [onClose]);
  useModalLock(close);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setLoadError("");
    void loadClubs()
      .then((data) => {
        if (ticket !== request.current) return;
        setLocalities(data.localities.map((item) => ({ id: item.id, name: item.name })));
        setSlugs(data.clubs.map((club) => club.slug));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket === request.current) setLoadError("No se pudieron cargar las localidades.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      request.current += 1;
    };
  }, [load]);

  const localityName = localities.find((item) => item.id === localityId)?.name || "";
  const draft = { name, slug, localityId, location, adminEmail, presidentPhone };
  const checked = validateNewClub(draft, localityName);
  const touched = Boolean(name || slug || localityId || location || adminEmail || presidentPhone);
  const duplicate =
    typeof checked !== "string" && slugs.includes(checked.slug)
      ? `Ya existe un club en /${checked.slug}.`
      : "";
  const missing = typeof checked === "string" ? checked : duplicate;
  const saveHint = error || (touched ? missing : "");
  const ready = !missing && !busy && !loading && !loadError;

  const edit = (apply: () => void) => {
    apply();
    setError("");
  };

  const handleName = (value: string) =>
    edit(() => {
      const next = clubName(value);
      setName(next);
      if (!slugEdited.current) setSlug(normalizeSlug(next));
    });

  const handleSlug = (value: string, field: EventTarget | null) => {
    if (field !== document.activeElement) return;
    slugEdited.current = true;
    edit(() => setSlug(publicSlug(value)));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (creating.current || !ready || typeof checked === "string") return;
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      const id = await addClub({
        slug: checked.slug,
        name: checked.name,
        localityId: checked.localityId,
        location: checked.location,
        presidentPhone: checked.presidentPhone,
        description: DEFAULT_CLUB_DESCRIPTION,
        heroUrl: DEFAULT_HERO_IMAGE,
        adminEmail: checked.adminEmail,
      });
      onCreated({ id, name: checked.name });
      if (embedded && !checked.adminEmail) {
        creating.current = false;
        onClose();
        return;
      }
      setCreated({ slug: checked.slug, email: checked.adminEmail });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.message === DATA_REVIEW_MESSAGE
          ? `${DATA_REVIEW_MESSAGE} Esa URL puede estar en uso por un club eliminado.`
          : "No se pudo crear el club.",
      );
    } finally {
      creating.current = false;
      setBusy(false);
    }
  };

  // Portal al body para que la cabecera (backdrop-filter) no recorte el `position: fixed`.
  return createPortal(
    <div
      className="court-form club-form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-form-title"
      onClick={close}
      // Por encima del modal que lo abre (Editar torneo usa 90; .court-form, 80)
      style={embedded ? { zIndex: 100 } : undefined}
    >
      <form
        className="court-form__panel"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        noValidate
      >
        <header className="court-form__head">
          <span className="club-form__icon" aria-hidden="true">
            <Shield size={20} />
          </span>
          <div>
            <h3 id="club-form-title">Registrar equipo</h3>
            <p>
              {created
                ? "El club ya aparece en el directorio de equipos."
                : "Completa los datos para dar de alta un club en la liga."}
            </p>
          </div>
          <button
            type="button"
            className="court-form__close"
            aria-label="Cerrar"
            disabled={busy}
            onClick={close}
          >
            <X size={18} />
          </button>
        </header>

        {created ? (
          <div className="court-form__body">
            <div className="club-form__done">
              <CheckCircle2 size={22} />
              <div>
                <strong>Club creado en /{created.slug}.</strong>
                {created.email ? (
                  <span>Envíale al presidente la URL para crear su cuenta.</span>
                ) : null}
              </div>
            </div>
            {created.email ? <InviteSignupLink email={created.email} /> : null}
          </div>
        ) : loading ? (
          <div className="court-form__body">
            <p className="club-form__note">Cargando localidades…</p>
          </div>
        ) : loadError ? (
          <div className="court-form__body">
            <p className="club-form__note is-error">
              {loadError}{" "}
              <button type="button" className="club-form__retry" onClick={load}>
                Reintentar
              </button>
            </p>
          </div>
        ) : (
          <div className="court-form__body club-form__grid">
            <label className="court-form__label">
              Nombre del club
              <span className="court-form__field">
                <Shield size={16} aria-hidden="true" />
                <FormInput
                  value={name}
                  autoFocus
                  disabled={busy}
                  maxLength={30}
                  placeholder="Ej. Joga Bonito FC"
                  onChange={(event) => handleName(event.target.value)}
                />
              </span>
            </label>
            <label className="court-form__label">
              URL pública
              <span className="court-form__field">
                <Link2 size={16} aria-hidden="true" />
                <FormInput
                  value={slug}
                  disabled={busy}
                  maxLength={40}
                  placeholder="joga-bonito-fc"
                  onChange={(event) => handleSlug(event.target.value, event.target)}
                />
              </span>
            </label>
            <label className="court-form__label">
              Localidad
              <span className="court-form__field">
                <MapPin size={16} aria-hidden="true" />
                <FormSelect
                  value={localityId}
                  disabled={busy}
                  onChange={(event) => edit(() => setLocalityId(event.target.value))}
                >
                  <option value="">Selecciona...</option>
                  {localities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </FormSelect>
              </span>
              <NewLocalityInline
                localities={localities}
                disabled={busy}
                onCreated={(locality) => {
                  setLocalities((current) =>
                    [...current, locality].sort((a, b) => a.name.localeCompare(b.name, "es")),
                  );
                  edit(() => setLocalityId(locality.id));
                }}
              />
            </label>
            <label className="court-form__label">
              Barrio / escuela (opcional)
              <span className="court-form__field">
                <Home size={16} aria-hidden="true" />
                <FormInput
                  value={location}
                  disabled={busy}
                  maxLength={50}
                  placeholder="Ej. Col. Centro, CETIS 4"
                  onChange={(event) => edit(() => setLocation(neighborhood(event.target.value)))}
                />
              </span>
            </label>
            <label className="court-form__label">
              Correo del presidente (opcional)
              <span className="court-form__field">
                <Mail size={16} aria-hidden="true" />
                <FormInput
                  type="email"
                  value={adminEmail}
                  disabled={busy}
                  maxLength={100}
                  placeholder="presidente@club.com"
                  onChange={(event) => edit(() => setAdminEmail(emailText(event.target.value)))}
                />
              </span>
              <small className="club-form__hint">Recibe el rol Presidente al crear su cuenta.</small>
            </label>
            <label className="court-form__label">
              Teléfono del presidente (opcional)
              <span className="court-form__field">
                <Phone size={16} aria-hidden="true" />
                <FormInput
                  type="tel"
                  value={presidentPhone}
                  disabled={busy}
                  maxLength={16}
                  placeholder="Ej. 7821234567"
                  onChange={(event) => edit(() => setPresidentPhone(cellPhone(event.target.value)))}
                />
              </span>
              <small className="club-form__hint">Se muestra en el directorio de equipos.</small>
            </label>
          </div>
        )}

        <footer className="court-form__foot">
          <span />
          {created ? (
            <div className="court-form__actions">
              {embedded ? null : (
                <Link to={`/${created.slug}`} className="court-form__ghost club-form__link">
                  Ver club
                </Link>
              )}
              <PrimaryButton type="button" onClick={onClose}>
                Cerrar
              </PrimaryButton>
            </div>
          ) : (
            <div className="court-form__actions">
              <button type="button" className="court-form__ghost" disabled={busy} onClick={close}>
                Cancelar
              </button>
              <span className="court-form__save">
                {saveHint ? (
                  <span className="court-form__hint" role="tooltip">
                    {saveHint}
                  </span>
                ) : null}
                <PrimaryButton type="submit" variant="green" disabled={!ready}>
                  <Plus size={15} />
                  {busy ? "Creando..." : "Crear club"}
                </PrimaryButton>
              </span>
            </div>
          )}
        </footer>
      </form>
    </div>,
    document.body,
  );
}
