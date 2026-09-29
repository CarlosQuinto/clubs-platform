import { useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  addDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
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
import PlatformLayout from "../components/platform/PlatformLayout";
import MembersModal from "../components/club/MembersModal";
import HeroAdmin from "../components/admin/HeroAdmin";
import InboxAdmin from "../components/admin/InboxAdmin";
import SuperAdminsAdmin from "../components/admin/SuperAdminsAdmin";
import SeasonsAdmin from "../components/admin/SeasonsAdmin";
import TournamentsAdmin from "../components/admin/TournamentsAdmin";
import Field from "../components/admin/Field";
import InviteSignupLink from "../components/platform/InviteSignupLink";
import ConfirmModal from "../components/ConfirmModal";
import { ClubProvider } from "../context/ClubContext";
import { useAuth } from "../context/AuthContext";
import { usePlatformCatalog } from "../hooks/usePlatformCatalog";
import {
  clubDocRef,
  clubItemRef,
  emailKey,
  localitiesCol,
  normalizeSlug,
  RESERVED_SLUGS,
} from "../lib/paths";
import { markSignupInvite } from "../lib/signupInvite";
import {
  DEFAULT_CLUB_DESCRIPTION,
  DEFAULT_HERO_IMAGE,
} from "../lib/clubDefaults";
import type { ClubSummary } from "../lib/types";
import {
  Badge,
  C,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "../components/ui";

type Tab = "clubs" | "competition" | "cover" | "inbox" | "admins";

export default function SuperAdmin() {
  const { user, loading, isSuperAdmin, platformConfig } = useAuth();
  const catalog = usePlatformCatalog();
  const [params] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab =
    tabParam === "competition" ||
    tabParam === "cover" ||
    tabParam === "inbox" ||
    tabParam === "admins"
      ? tabParam
      : "clubs";
  const [membersClub, setMembersClub] = useState<ClubSummary | null>(null);

  if (loading || platformConfig === null) {
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

      {tab === "cover" && <HeroAdmin config={platformConfig} />}

      {tab === "inbox" && <InboxAdmin />}

      {tab === "admins" && <SuperAdminsAdmin />}

      {tab === "competition" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SeasonsAdmin
            seasons={catalog.seasons}
            tournaments={catalog.tournaments}
          />
          <TournamentsAdmin
            seasons={catalog.seasons}
            categories={catalog.categories}
          />
        </div>
      )}

      {tab === "clubs" && (
        <ClubsAdmin
          catalog={catalog}
          userId={user.uid}
          onMembers={setMembersClub}
        />
      )}

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
  catalog,
  userId,
  onMembers,
}: {
  catalog: ReturnType<typeof usePlatformCatalog>;
  userId: string;
  onMembers: (club: ClubSummary) => void;
}) {
  const { clubs, localities } = catalog;
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
    setName(value);
    if (!slugTouched) setSlug(normalizeSlug(value));
  };

  const handleAddLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLocality.trim();
    if (!clean) return;
    await addDoc(localitiesCol(), { name: clean, createdAt: serverTimestamp() });
    setNewLocality("");
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLastSignupEmail("");
    const cleanName = name.trim();
    const cleanSlug = normalizeSlug(slug);
    if (!cleanName) return setError("El nombre es obligatorio.");
    if (cleanSlug.length < 3)
      return setError("La URL debe tener al menos 3 caracteres.");
    if (RESERVED_SLUGS.includes(cleanSlug))
      return setError("Esa URL está reservada.");
    if (!localityId) return setError("Selecciona una localidad.");
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return setError("El correo del administrador no es válido.");
    }
    try {
      setBusy(true);
      const ref = clubDocRef(cleanSlug);
      if ((await getDoc(ref)).exists()) {
        setError(`Ya existe un club en /${cleanSlug}.`);
        return;
      }
      await setDoc(ref, {
        slug: cleanSlug,
        name: cleanName,
        localityId,
        location: location.trim() || localityName,
        presidentPhone: presidentPhone.trim(),
        description: DEFAULT_CLUB_DESCRIPTION,
        heroImages: [DEFAULT_HERO_IMAGE],
        defaultLineups: {},
        active: true,
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
      if (cleanEmail) {
        await setDoc(clubItemRef(cleanSlug, "invites", emailKey(cleanEmail)), {
          email: cleanEmail,
          role: "admin",
          invitedBy: userId,
          createdAt: serverTimestamp(),
        });
        await markSignupInvite(cleanEmail, { clubId: cleanSlug });
        setLastSignupEmail(cleanEmail);
      }
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
        await deleteDoc(clubDocRef(clubAction.club.id));
      } else {
        await updateDoc(clubDocRef(clubAction.club.id), {
          active: clubAction.type === "show",
        });
      }
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
                  onChange={(e) => handleName(e.target.value)}
                  placeholder="Ej. Joga Bonito FC"
                  required
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
                  }}
                  onBlur={() => setSlug(normalizeSlug(slug))}
                  placeholder="jogabonitofc"
                  required
                />
              </Field>
              <Field label="Localidad">
                <FormSelect
                  value={localityId}
                  onChange={(e) => setLocalityId(e.target.value)}
                  required
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
                  onChange={(e) => setLocation(e.target.value)}
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
                onChange={(e) => setPresidentPhone(e.target.value)}
                placeholder="Ej. 622 123 4567"
                maxLength={29}
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
              onChange={(e) => setNewLocality(e.target.value)}
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
