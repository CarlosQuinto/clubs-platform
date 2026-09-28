import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Crown,
  MapPin,
  Plus,
  Shield,
  UserCog,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import MembersModal from "../components/club/MembersModal";
import { ClubProvider } from "../context/ClubContext";
import { useAuth } from "../context/AuthContext";
import {
  clubDocRef,
  clubItemRef,
  clubsCol,
  emailKey,
  localitiesCol,
  normalizeSlug,
  RESERVED_SLUGS,
} from "../lib/paths";
import {
  DEFAULT_CLUB_DESCRIPTION,
  DEFAULT_HERO_IMAGE,
} from "../lib/clubDefaults";
import {
  C,
  RADIUS,
  Badge,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "../components/ui";

interface Locality {
  id: string;
  name: string;
}

interface ClubRow {
  id: string;
  slug: string;
  name: string;
  localityId?: string;
  location?: string;
  active: boolean;
}

export default function SuperAdmin() {
  const { user, loading, isSuperAdmin, platformConfig } = useAuth();
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [membersClub, setMembersClub] = useState<ClubRow | null>(null);

  // Formulario de localidad
  const [newLocality, setNewLocality] = useState("");

  // Formulario de club
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [localityId, setLocalityId] = useState("");
  const [location, setLocation] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsubLoc = onSnapshot(localitiesCol(), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Locality);
      list.sort((a, b) => a.name.localeCompare(b.name));
      setLocalities(list);
    });
    const unsubClubs = onSnapshot(clubsCol(), (snap) => {
      const list = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            slug: d.data().slug || d.id,
            name: d.data().name || d.id,
            localityId: d.data().localityId,
            location: d.data().location,
            active: d.data().active !== false,
          }) as ClubRow,
      );
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClubs(list);
    });
    return () => {
      unsubLoc();
      unsubClubs();
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!slugTouched) setSlug(normalizeSlug(name));
  }, [name, slugTouched]);

  const localityName = useMemo(
    () => localities.find((l) => l.id === localityId)?.name || "",
    [localities, localityId],
  );

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
        <SectionCard title="Acceso restringido" icon={<Crown size={16} color={C.amber} />}>
          <p style={{ margin: 0, color: C.gray600, fontSize: "0.9rem" }}>
            Esta sección es solo para super administradores de la plataforma.
          </p>
          <Link to="/" style={{ display: "inline-block", marginTop: "1rem", color: C.navy900, fontWeight: 700 }}>
            ← Volver al inicio
          </Link>
        </SectionCard>
      </PlatformLayout>
    );
  }

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

    const cleanName = name.trim();
    const cleanSlug = normalizeSlug(slug);
    if (!cleanName) return setError("El nombre es obligatorio.");
    if (cleanSlug.length < 3) return setError("La URL debe tener al menos 3 caracteres.");
    if (RESERVED_SLUGS.includes(cleanSlug)) return setError("Esa URL está reservada.");
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
        description: DEFAULT_CLUB_DESCRIPTION,
        heroImages: [DEFAULT_HERO_IMAGE],
        defaultLineups: {},
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      if (cleanEmail) {
        await setDoc(clubItemRef(cleanSlug, "invites", emailKey(cleanEmail)), {
          email: cleanEmail,
          role: "admin",
          invitedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      setSuccess(
        `Club creado en /${cleanSlug}${cleanEmail ? `. Invitación de administrador enviada a ${cleanEmail}.` : "."}`,
      );
      setName("");
      setSlug("");
      setSlugTouched(false);
      setLocation("");
      setAdminEmail("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el club.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (club: ClubRow) => {
    await updateDoc(clubDocRef(club.id), { active: !club.active });
  };

  return (
    <PlatformLayout>
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "1.5rem",
          fontWeight: 900,
          color: C.navy900,
          margin: "0 0 1.5rem",
          letterSpacing: "-0.02em",
        }}
      >
        <Crown size={22} color={C.amber} /> Administración de la plataforma
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <SectionCard title="Nuevo club" icon={<Shield size={16} color={C.amber} />}>
          <form onSubmit={handleCreateClub} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Field label="Nombre del club">
              <FormInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Joga Bonito FC"
                required
              />
            </Field>
            <Field label="URL pública" hint={slug ? `${window.location.origin}/${slug}` : ""}>
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
            <Field label="Ubicación mostrada (opcional)">
              <FormInput
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={localityName || "Ciudad, Estado"}
              />
            </Field>
            <Field
              label="Correo del administrador del club (opcional)"
              hint="Recibirá el rol Presidente al iniciar sesión con este correo."
            >
              <FormInput
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="presidente@club.com"
              />
            </Field>

            {error && <p style={{ margin: 0, color: C.red, fontSize: "0.8rem" }}>{error}</p>}
            {success && <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>{success}</p>}

            <PrimaryButton type="submit" disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <Plus size={14} /> {busy ? "Creando..." : "Crear club"}
            </PrimaryButton>
          </form>
        </SectionCard>

        <SectionCard title="Localidades" icon={<MapPin size={16} color={C.amber} />}>
          <form onSubmit={handleAddLocality} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <FormInput
              value={newLocality}
              onChange={(e) => setNewLocality(e.target.value)}
              placeholder="Ej. Guaymas, Sonora"
            />
            <SecondaryButton type="submit" style={{ whiteSpace: "nowrap" }}>
              Añadir
            </SecondaryButton>
          </form>
          {localities.length === 0 && (
            <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
              Añade al menos una localidad para poder crear clubes.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
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
        title={`Clubes (${clubs.length})`}
        icon={<Shield size={16} color={C.amber} />}
        style={{ marginTop: "1.5rem" }}
      >
        {clubs.length === 0 && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
            Todavía no hay clubes.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {clubs.map((club) => (
            <div
              key={club.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: RADIUS.md,
                border: `1px solid ${C.gray200}`,
                backgroundColor: club.active ? C.gray50 : C.gray100,
                opacity: club.active ? 1 : 0.7,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "180px" }}>
                <div style={{ fontWeight: 800, color: C.gray800 }}>{club.name}</div>
                <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
                  /{club.slug} ·{" "}
                  {localities.find((l) => l.id === club.localityId)?.name ||
                    club.location ||
                    "Sin localidad"}
                </div>
              </div>
              <Badge color={club.active ? "green" : "gray"}>
                {club.active ? "Publicado" : "Oculto"}
              </Badge>
              <SecondaryButton
                onClick={() => setMembersClub(club)}
                style={{ padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <UserCog size={14} /> Miembros
              </SecondaryButton>
              <SecondaryButton
                onClick={() => toggleActive(club)}
                title={club.active ? "Ocultar de la landing" : "Publicar en la landing"}
                style={{ padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                {club.active ? <EyeOff size={14} /> : <Eye size={14} />}
              </SecondaryButton>
              <Link
                to={`/${club.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: C.navy900,
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  textDecoration: "none",
                }}
              >
                Abrir <ExternalLink size={14} />
              </Link>
            </div>
          ))}
        </div>
      </SectionCard>

      {membersClub && (
        <ClubProvider clubId={membersClub.id}>
          <MembersModal clubName={membersClub.name} onClose={() => setMembersClub(null)} />
        </ClubProvider>
      )}
    </PlatformLayout>
  );
}

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color: C.gray500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
    {children}
    {hint && <span style={{ fontSize: "0.7rem", color: C.gray400 }}>{hint}</span>}
  </label>
);
