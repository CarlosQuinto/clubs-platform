import { useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCog,
} from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import MembersModal from "../club/MembersModal";
import CoverAdminView from "./cover/CoverAdminView";
import AdsAdmin from "./ads/AdsAdmin";
import InboxAdmin from "./inbox/InboxAdmin";
import SuperAdminsAdmin from "./admins/SuperAdminsAdmin";
import CompetitionAdminView from "./competition/CompetitionAdminView";
import CourtsAdmin from "./courts/CourtsAdmin";
import Field from "./Field";
import InviteSignupLink from "../shell/InviteSignupLink";
import ConfirmModal from "../../shared/ConfirmModal";
import { ClubProvider } from "../../domains/clubs/ClubContext";
import { useAuth } from "../../domains/auth/AuthContext";
import { normalizeSlug, RESERVED_SLUGS } from "../../shared/paths";
import { digitsOnly, isEmail, lettersAndNumbers } from "../../shared/textLimits";
import {
  addClub,
  addLocality,
  loadClubs,
  removeClub,
  setClubVisible,
} from "../../domains/clubs/clubCommands";
import { useAdminQuery } from "./useAdminQuery";
import {
  DEFAULT_CLUB_DESCRIPTION,
  DEFAULT_HERO_IMAGE,
} from "../../domains/clubs/clubDefaults";
import type { ClubSummary } from "../../shared/types";
import {
  Badge,
  C,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "../../shared/ui";

type Tab = "clubs" | "competition" | "cover" | "ads" | "inbox" | "admins" | "courts";

export default function SuperAdmin() {
  const { user, loading, isSuperAdmin, sqlAdmin } = useAuth();
  const [params] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab =
    tabParam === "competition" ||
    tabParam === "cover" ||
    tabParam === "ads" ||
    tabParam === "inbox" ||
    tabParam === "admins" ||
    tabParam === "courts"
      ? tabParam
      : "clubs";
  const [membersClub, setMembersClub] = useState<ClubSummary | null>(null);

  if (loading || (user && sqlAdmin === null)) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Cargando...</p>
      </PlatformLayout>
    );
  }
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (!isSuperAdmin) {
    return (
      <PlatformLayout maxWidth="560px">
        <SectionCard
          title="Acceso restringido"
          icon={<Crown size={16} color={C.amber} />}
        >
          <p style={{ margin: 0, color: C.gray600, fontSize: "0.9rem" }}>
            Esta sección es solo para super administradores de la plataforma.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              color: C.navy900,
              fontWeight: 700,
            }}
          >
            ← Volver al inicio
          </Link>
        </SectionCard>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="admin-page-head">
        <h1>
          <Crown size={16} color={C.amber} />
          Administración de la plataforma
        </h1>
      </div>

      {tab === "cover" && <CoverAdminView />}

      {tab === "ads" && <AdsAdmin />}

      {tab === "inbox" && <InboxAdmin />}

      {tab === "admins" && <SuperAdminsAdmin />}

      {tab === "courts" && <CourtsAdmin />}

      {tab === "competition" && <CompetitionAdminView />}

      {tab === "clubs" && <ClubsAdmin onMembers={setMembersClub} />}

      {membersClub && (
        <ClubProvider clubId={membersClub.id}>
          <MembersModal
            clubName={membersClub.name}
            onClose={() => setMembersClub(null)}
          />
        </ClubProvider>
      )}
    </PlatformLayout>
  );
}

const CLUB_PAGE_SIZE = 10;

function ClubsAdmin({
  onMembers,
}: {
  onMembers: (club: ClubSummary) => void;
}) {
  const screen = useAdminQuery(loadClubs);
  const localities = screen.data?.localities ?? [];
  const clubs: ClubSummary[] = (screen.data?.clubs ?? []).map((club) => ({
    id: club.id,
    slug: club.slug,
    name: club.name,
    localityId: club.locality?.id,
    active: club.active,
  }));
  const [newLocality, setNewLocality] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [localityId, setLocalityId] = useState("");
  const [location, setLocation] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [presidentPhone, setPresidentPhone] = useState("");
  const [lastSignupEmail, setLastSignupEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [clubAction, setClubAction] = useState<
    null | { type: "hide" | "show" | "delete"; club: ClubSummary }
  >(null);
  const [deleteSlug, setDeleteSlug] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [clubQuery, setClubQuery] = useState("");
  const [clubPage, setClubPage] = useState(0);

  const localityName =
    localities.find((l) => l.id === localityId)?.name || "";

  const filteredClubs = useMemo(() => {
    const q = clubQuery.trim().toLowerCase();
    const list = [...clubs].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug || "").toLowerCase().includes(q),
    );
  }, [clubs, clubQuery]);

  const clubPageCount = Math.max(1, Math.ceil(filteredClubs.length / CLUB_PAGE_SIZE));
  const safeClubPage = Math.min(clubPage, clubPageCount - 1);
  const pagedClubs = filteredClubs.slice(
    safeClubPage * CLUB_PAGE_SIZE,
    (safeClubPage + 1) * CLUB_PAGE_SIZE,
  );

  const handleName = (value: string) => {
    const next = lettersAndNumbers(value, 30);
    setName(next);
    setError("");
    if (!slugTouched) setSlug(normalizeSlug(next));
  };

  const missingClubHint = () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push("el nombre");
    if (normalizeSlug(slug).length < 3) missing.push("la URL");
    if (!localityId) missing.push("la localidad");
    if (missing.length === 0) return "";
    if (missing.length === 1) {
      return missing[0] === "la localidad"
        ? "Selecciona la localidad."
        : `Escribe ${missing[0]}.`;
    }
    const last = missing[missing.length - 1];
    const head = missing.slice(0, -1).join(", ");
    return `Escribe ${head} y ${last === "la localidad" ? "selecciona la localidad" : last}.`;
  };

  const handleAddLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLocality.trim().slice(0, 30);
    if (!clean) return;
    await addLocality(clean);
    screen.reload();
    setNewLocality("");
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLastSignupEmail("");
    const cleanName = name.trim();
    const cleanSlug = normalizeSlug(slug);
    const hint = missingClubHint();
    if (hint) return setError(hint);
    if (RESERVED_SLUGS.includes(cleanSlug))
      return setError("Esa URL está reservada.");
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (cleanEmail && !isEmail(cleanEmail)) {
      return setError("El correo del administrador no es válido.");
    }
    try {
      setBusy(true);
      if (clubs.some((club) => club.slug === cleanSlug)) {
        setError(`Ya existe un club en /${cleanSlug}.`);
        return;
      }
      await addClub({
        slug: cleanSlug,
        name: cleanName,
        localityId,
        location: location.trim() || localityName,
        presidentPhone: presidentPhone.trim(),
        description: DEFAULT_CLUB_DESCRIPTION,
        heroUrl: DEFAULT_HERO_IMAGE,
        adminEmail: cleanEmail,
      });
      if (cleanEmail) setLastSignupEmail(cleanEmail);
      screen.reload();
      setSuccess(
        cleanEmail
          ? `Club creado en /${cleanSlug}. Envíale al presidente la URL para crear su cuenta.`
          : `Club creado en /${cleanSlug}.`,
      );
      setName("");
      setSlug("");
      setSlugTouched(false);
      setLocation("");
      setAdminEmail("");
      setPresidentPhone("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el club.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (club: ClubSummary) => {
    setClubAction({ type: club.active ? "hide" : "show", club });
  };

  const handleDelete = (club: ClubSummary) => {
    setDeleteSlug("");
    setClubAction({ type: "delete", club });
  };

  const closeClubAction = () => {
    if (actionBusy) return;
    setClubAction(null);
    setDeleteSlug("");
  };

  const confirmClubAction = async () => {
    if (!clubAction) return;
    if (clubAction.type === "delete" && deleteSlug !== clubAction.club.slug) {
      return;
    }
    try {
      setActionBusy(true);
      if (clubAction.type === "delete") {
        await removeClub(clubAction.club.id);
      } else {
        await setClubVisible(clubAction.club.id, clubAction.type === "show");
      }
      screen.reload();
      setClubAction(null);
      setDeleteSlug("");
    } catch (err) {
      console.error(err);
      alert("No se pudo completar la acción.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        <SectionCard
          className="compact-form-card"
          title="Nuevo club"
          icon={<Shield size={14} color={C.amber} />}
        >
          <form
            onSubmit={handleCreateClub}
            className="compact-form admin-club-form"
          >
            <div className="admin-club-form-grid">
              <Field label="Nombre del club">
                <FormInput
                  value={name}
                  maxLength={30}
                  onChange={(e) => handleName(e.target.value)}
                  placeholder="Ej. Joga Bonito FC"
                />
              </Field>
              <Field
                label="URL pública"
                hint={slug ? `/${slug}` : ""}
              >
                <FormInput
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                    setError("");
                  }}
                  onBlur={() => setSlug(normalizeSlug(slug))}
                  placeholder="jogabonitofc"
                />
              </Field>
              <Field label="Localidad">
                <FormSelect
                  value={localityId}
                  onChange={(e) => {
                    setLocalityId(e.target.value);
                    setError("");
                  }}
                >
                  <option value="">Selecciona...</option>
                  {localities.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </FormSelect>
              </Field>
              <Field label="Barrio / escuela (opcional)">
                <FormInput
                  value={location}
                  maxLength={30}
                  onChange={(e) => setLocation(lettersAndNumbers(e.target.value, 30))}
                  placeholder="Ej. Col. Centro, CETIS 4"
                />
              </Field>
            </div>
            <Field
              label="Correo del presidente (opcional)"
              hint="Recibe el rol Presidente al crear su cuenta con este correo."
            >
              <FormInput
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="presidente@club.com"
              />
            </Field>
            <Field
              label="Teléfono del presidente (opcional)"
              hint="Se muestra en el directorio público de equipos."
            >
              <FormInput
                type="tel"
                value={presidentPhone}
                maxLength={15}
                onChange={(e) => setPresidentPhone(digitsOnly(e.target.value, 15))}
                placeholder="Ej. 6221234567"
              />
            </Field>
            {error && (
              <p style={{ margin: 0, color: C.red, fontSize: "0.72rem" }}>
                {error}
              </p>
            )}
            {success && (
              <p style={{ margin: 0, color: C.green, fontSize: "0.72rem" }}>
                {success}
              </p>
            )}
            {lastSignupEmail && <InviteSignupLink email={lastSignupEmail} />}
            <PrimaryButton
              type="submit"
              disabled={busy}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
                padding: "0.5rem",
              }}
            >
              <Plus size={13} /> {busy ? "Creando..." : "Crear club"}
            </PrimaryButton>
          </form>
        </SectionCard>

        <SectionCard
          className="compact-form-card"
          title="Localidades"
          icon={<MapPin size={14} color={C.amber} />}
        >
          <form
            onSubmit={handleAddLocality}
            className="compact-form"
            style={{
              display: "flex",
              gap: "0.4rem",
              marginBottom: "0.65rem",
            }}
          >
            <FormInput
              value={newLocality}
              maxLength={30}
              onChange={(e) => setNewLocality(e.target.value.slice(0, 30))}
              placeholder="Ej. Guaymas, Sonora"
            />
            <SecondaryButton
              type="submit"
              style={{ whiteSpace: "nowrap", padding: "0.4rem 0.7rem" }}
            >
              Añadir
            </SecondaryButton>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {localities.map((l) => (
              <Badge key={l.id} color="gray">
                <MapPin size={10} /> {l.name}{" "}
                <span style={{ color: C.gray400, fontWeight: 600 }}>
                  ({clubs.filter((c) => c.localityId === l.id).length})
                </span>
              </Badge>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        className="compact-form-card"
        title={`Clubes (${filteredClubs.length})`}
        icon={<Shield size={14} color={C.amber} />}
      >
        {clubs.length === 0 ? (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
            Todavía no hay clubes.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              maxWidth: 280,
              marginBottom: "0.75rem",
            }}
          >
            <Search size={14} color={C.gray400} style={{ flexShrink: 0 }} />
            <FormInput
              type="search"
              value={clubQuery}
              onChange={(e) => {
                setClubQuery(e.target.value);
                setClubPage(0);
              }}
              placeholder="Buscar por nombre"
            />
          </div>
        )}
        {clubs.length > 0 && filteredClubs.length === 0 && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
            Ningún club coincide con “{clubQuery.trim()}”.
          </p>
        )}
        <div className="admin-club-list">
          {pagedClubs.map((club) => (
            <div key={club.id} className="admin-club-item">
              <div className="admin-club-item__info">
                <div className="admin-club-item__title">
                  <span>{club.name}</span>
                  <Badge color={club.active ? "green" : "gray"}>
                    {club.active ? "Activo" : "Oculto"}
                  </Badge>
                </div>
                <div className="admin-club-item__meta">
                  /{club.slug} ·{" "}
                  {localities.find((l) => l.id === club.localityId)?.name ||
                    club.location ||
                    "Sin localidad"}
                </div>
              </div>
              <div className="admin-club-item__actions">
                <SecondaryButton
                  onClick={() => onMembers(club)}
                  className="admin-club-item__admins"
                  style={{
                    padding: "0.35rem 0.55rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    fontSize: "0.7rem",
                  }}
                >
                  <UserCog size={13} /> Admins
                </SecondaryButton>
                <Link to={`/${club.slug}`} className="admin-club-item__open">
                  Abrir <ExternalLink size={12} />
                </Link>
                <SecondaryButton
                  onClick={() => toggleActive(club)}
                  title={club.active ? "Desactivar" : "Activar"}
                  style={{ padding: "0.35rem 0.45rem" }}
                >
                  {club.active ? <EyeOff size={13} /> : <Eye size={13} />}
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => handleDelete(club)}
                  title="Eliminar club"
                  style={{ padding: "0.35rem 0.45rem", color: C.red }}
                >
                  <Trash2 size={13} />
                </SecondaryButton>
              </div>
            </div>
          ))}
        </div>
        {filteredClubs.length > CLUB_PAGE_SIZE && (
          <ClubListPager
            page={safeClubPage}
            pageCount={clubPageCount}
            total={filteredClubs.length}
            onPage={setClubPage}
          />
        )}
      </SectionCard>

      <ConfirmModal
        open={Boolean(clubAction)}
        title={
          clubAction?.type === "delete"
            ? `Eliminar ${clubAction.club.name}`
            : clubAction?.type === "hide"
              ? `Desactivar ${clubAction.club.name}`
              : `Activar ${clubAction?.club.name || ""}`
        }
        message={
          clubAction?.type === "delete"
            ? `Se elimina el documento de ${clubAction.club.name} (/${clubAction.club.slug}). Los datos internos (jugadores, agenda…) dejarán de ser accesibles. Esta acción no se puede deshacer.`
            : clubAction?.type === "hide"
              ? `${clubAction.club.name} dejará de aparecer como equipo activo y no se podrá inscribir en torneos nuevos. Puedes volver a activarlo después.`
              : `${clubAction?.club.name || ""} volverá a aparecer como equipo activo.`
        }
        confirmLabel={
          clubAction?.type === "delete"
            ? "Eliminar club"
            : clubAction?.type === "hide"
              ? "Desactivar"
              : "Activar"
        }
        danger={clubAction?.type !== "show"}
        busy={actionBusy}
        confirmDisabled={
          clubAction?.type === "delete" && deleteSlug !== clubAction.club.slug
        }
        onCancel={closeClubAction}
        onConfirm={() => void confirmClubAction()}
      >
        {clubAction?.type === "delete" && (
          <Field label={`Escribe "${clubAction.club.slug}" para confirmar`}>
            <FormInput
              value={deleteSlug}
              onChange={(e) => setDeleteSlug(e.target.value)}
              placeholder={clubAction.club.slug}
              autoComplete="off"
            />
          </Field>
        )}
      </ConfirmModal>
    </div>
  );
}

function ClubListPager({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const from = page * CLUB_PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * CLUB_PAGE_SIZE);
  const buttons = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.65rem",
        flexWrap: "wrap",
        marginTop: "0.75rem",
      }}
    >
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.gray500 }}>
        {from}–{to} de {total}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <PagerBtn disabled={page <= 0} onClick={() => onPage(page - 1)}>
          ‹
        </PagerBtn>
        {buttons.map((i) => (
          <PagerBtn key={i} active={i === page} onClick={() => onPage(i)}>
            {i + 1}
          </PagerBtn>
        ))}
        <PagerBtn disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}>
          ›
        </PagerBtn>
      </div>
    </div>
  );
}

function PagerBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minWidth: 28,
        height: 28,
        padding: "0 0.4rem",
        borderRadius: 7,
        border: `1px solid ${active ? C.navy900 : C.gray300}`,
        background: active ? C.navy900 : C.white,
        color: active ? C.white : C.navy900,
        fontSize: "0.72rem",
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
