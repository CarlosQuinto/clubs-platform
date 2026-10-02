import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Share2,
  Shield,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { setDoc } from "firebase/firestore";
import { platformConfigRef, platformStoragePath } from "../../lib/paths";
import { uploadImageFile } from "../../lib/uploadImage";
import type { PlatformConfig } from "../../context/AuthContext";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
  PLATFORM_NAME,
} from "../../lib/clubDefaults";
import Field from "./Field";
import {
  C,
  FormInput,
  FormTextarea,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../ui";

interface Props {
  config?: PlatformConfig | null;
}

export default function HeroAdmin({ config }: Props) {
  const savedImages = config?.heroImages || [];
  const [name, setName] = useState(config?.name || PLATFORM_NAME);
  const [motto, setMotto] = useState(config?.motto || "");
  const [logoUrl, setLogoUrl] = useState(config?.logoUrl || "");
  const [headline, setHeadline] = useState(
    config?.headline || PLATFORM_HEADLINE,
  );
  const [tagline, setTagline] = useState(
    config?.tagline || PLATFORM_DESCRIPTION,
  );
  const [instagram, setInstagram] = useState(config?.social?.instagram || "");
  const [facebook, setFacebook] = useState(config?.social?.facebook || "");
  const [whatsapp, setWhatsapp] = useState(config?.social?.whatsapp || "");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    area: "header" | "cover" | "social";
    text: string;
  } | null>(null);

  useEffect(() => {
    setName(config?.name || PLATFORM_NAME);
    setMotto(config?.motto || "");
    setLogoUrl(config?.logoUrl || "");
    setHeadline(config?.headline || PLATFORM_HEADLINE);
    setTagline(config?.tagline || PLATFORM_DESCRIPTION);
    setInstagram(config?.social?.instagram || "");
    setFacebook(config?.social?.facebook || "");
    setWhatsapp(config?.social?.whatsapp || "");
  }, [
    config?.name,
    config?.motto,
    config?.logoUrl,
    config?.headline,
    config?.tagline,
    config?.social?.instagram,
    config?.social?.facebook,
    config?.social?.whatsapp,
  ]);

  const flash = (area: "header" | "cover" | "social", text: string) => {
    setNotice({ area, text });
    window.setTimeout(() => setNotice(null), 2500);
  };

  const saveImages = async (next: string[]) => {
    await setDoc(platformConfigRef(), { heroImages: next }, { merge: true });
  };

  const saveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    await setDoc(
      platformConfigRef(),
      {
        name: name.trim() || PLATFORM_NAME,
        motto: motto.trim(),
        logoUrl: logoUrl.trim(),
      },
      { merge: true },
    );
    flash("header", "Header guardado.");
  };

  const saveCover = async (e: React.FormEvent) => {
    e.preventDefault();
    await setDoc(
      platformConfigRef(),
      {
        headline: headline.trim() || PLATFORM_HEADLINE,
        tagline: tagline.trim() || PLATFORM_DESCRIPTION,
      },
      { merge: true },
    );
    flash("cover", "Portada guardada.");
  };

  const addUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim();
    if (!clean) return;
    await saveImages([...savedImages, clean]);
    setUrl("");
  };

  const upload = async (file: File, kind: "carousel" | "logo") => {
    try {
      setBusy(true);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const download = await uploadImageFile(
        platformStoragePath(kind, `${Date.now()}.${ext}`),
        file,
        {
          maxSizeMB: kind === "logo" ? 0.2 : 0.8,
          maxWidthOrHeight: kind === "logo" ? 512 : 1920,
        },
      );
      if (kind === "logo") {
        setLogoUrl(download);
        await setDoc(platformConfigRef(), { logoUrl: download }, { merge: true });
      } else {
        await saveImages([...savedImages, download]);
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo subir la imagen. Revisa que hayas iniciado sesión.");
    } finally {
      setBusy(false);
    }
  };

  const moveImage = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= savedImages.length) return;
    const copy = [...savedImages];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    await saveImages(copy);
  };

  const displayImages =
    savedImages.length > 0 ? savedImages : DEFAULT_PLATFORM_HERO_IMAGES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <SectionCard title="Header" icon={<Shield size={16} color={C.amber} />}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Logo y nombre de la barra superior, en todas las páginas.
        </p>
        <form
          onSubmit={saveHeader}
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <div className="header-brand-row">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: RADIUS.lg,
                border: `1px solid ${C.gray200}`,
                overflow: "hidden",
                backgroundColor: C.navy900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: C.amber, fontWeight: 800 }}>Logo</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Field label="Logo">
                <FormInput
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="URL del logo o súbelo"
                />
              </Field>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  width: "fit-content",
                  padding: "0.4rem 0.8rem",
                  borderRadius: RADIUS.md,
                  border: `1px solid ${C.gray300}`,
                  backgroundColor: C.white,
                  color: C.gray600,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                <UploadCloud size={14} /> {busy ? "Subiendo..." : "Subir logo"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file, "logo");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <Field label="Nombre">
            <FormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={PLATFORM_NAME}
            />
          </Field>
          <Field label="Lema">
            <FormInput
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Pasión por el fútbol, comunidad en cada partido."
              maxLength={120}
            />
          </Field>
          {notice?.area === "header" && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>
              {notice.text}
            </p>
          )}
          <PrimaryButton type="submit" style={{ width: "fit-content" }}>
            Guardar header
          </PrimaryButton>
        </form>
      </SectionCard>

      <SectionCard title="Portada" icon={<ImageIcon size={16} color={C.amber} />}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Carrusel, título y texto de la página de inicio.
        </p>
        <form
          onSubmit={saveCover}
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <Field label="Título">
            <FormInput
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={PLATFORM_HEADLINE}
            />
          </Field>
          <Field label="Texto debajo del título">
            <FormTextarea
              rows={3}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={PLATFORM_DESCRIPTION}
            />
          </Field>
          {notice?.area === "cover" && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>
              {notice.text}
            </p>
          )}
          <PrimaryButton type="submit" style={{ width: "fit-content" }}>
            Guardar textos
          </PrimaryButton>
        </form>

        <div
          style={{
            margin: "1.25rem 0 0.75rem",
            fontSize: "0.7rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Fotos del carrusel
        </div>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.8rem", color: C.gray500 }}>
          Agrega, quita u ordena. Si la lista queda vacía se usan imágenes
          genéricas.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {displayImages.map((src, i) => (
            <div
              key={`${src}-${i}`}
              style={{
                position: "relative",
                borderRadius: RADIUS.lg,
                overflow: "hidden",
                border: `1px solid ${C.gray200}`,
                aspectRatio: "16 / 9",
              }}
            >
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {savedImages.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <OrderBtn
                      label="Subir"
                      disabled={i === 0}
                      onClick={() => void moveImage(i, -1)}
                    >
                      <ChevronUp size={14} />
                    </OrderBtn>
                    <OrderBtn
                      label="Bajar"
                      disabled={i === savedImages.length - 1}
                      onClick={() => void moveImage(i, 1)}
                    >
                      <ChevronDown size={14} />
                    </OrderBtn>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void saveImages(savedImages.filter((_, idx) => idx !== i))
                    }
                    title="Quitar"
                    style={{
                      border: "none",
                      background: "rgba(0,0,0,0.55)",
                      color: C.white,
                      borderRadius: RADIUS.full,
                      width: 28,
                      height: 28,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {savedImages.length === 0 && (
          <SecondaryButton
            type="button"
            onClick={() => void saveImages([...DEFAULT_PLATFORM_HERO_IMAGES])}
            style={{ marginBottom: "0.85rem", width: "fit-content" }}
          >
            Empezar con las fotos genéricas
          </SecondaryButton>
        )}
        <form onSubmit={addUrl} className="cover-add-row">
          <Field label="Añadir por URL">
            <FormInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <PrimaryButton type="submit" className="cover-add-row__btn">
            Añadir
          </PrimaryButton>
          <label className="cover-add-row__upload">
            <UploadCloud size={14} /> {busy ? "Subiendo..." : "Subir archivo"}
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, "carousel");
                e.target.value = "";
              }}
            />
          </label>
        </form>
      </SectionCard>

      <SectionCard
        title="Redes sociales"
        icon={<Share2 size={16} color={C.amber} />}
      >
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Aparecen al pie de la página: «Nos puedes encontrar también en».
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await setDoc(
              platformConfigRef(),
              {
                social: {
                  instagram: instagram.trim(),
                  facebook: facebook.trim(),
                  whatsapp: whatsapp.trim(),
                },
              },
              { merge: true },
            );
            flash("social", "Redes guardadas.");
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <Field label="Instagram" hint="Usuario o URL. Ej. @orinco o https://instagram.com/orinco">
            <FormInput
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@usuario"
            />
          </Field>
          <Field label="Facebook" hint="Página o URL.">
            <FormInput
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="WhatsApp" hint="Número de la empresa. Ej. 622 123 4567">
            <FormInput
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="622 123 4567"
            />
          </Field>
          {notice?.area === "social" && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>
              {notice.text}
            </p>
          )}
          <PrimaryButton type="submit" style={{ width: "fit-content" }}>
            Guardar redes
          </PrimaryButton>
        </form>
      </SectionCard>
    </div>
  );
}

function OrderBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 26,
        height: 22,
        border: "none",
        borderRadius: RADIUS.sm,
        background: "rgba(0,0,0,0.55)",
        color: C.white,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
