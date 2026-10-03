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
import { platformStoragePath } from "../../../shared/paths";
import {
  replaceHeroImages,
  saveCoverText,
  saveHeader,
  saveSocial,
} from "../../../domains/platform/platformCommands";
import { uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import type { PlatformCover } from "../../../shared/types";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
  PLATFORM_NAME,
} from "../../../domains/clubs/clubDefaults";
import Field from "../Field";
import { invalidatePlatformBanner } from "../../shell/usePlatformBanner";
import { invalidatePlatformChrome } from "../../shell/usePlatformChrome";
import {
  C,
  FormInput,
  FormTextarea,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../../../shared/ui";

interface Props {
  config?: PlatformCover | null;
  onSaved?: () => void;
}

const LIMIT = {
  name: 20,
  motto: 30,
  headline: 35,
  tagline: 120,
  instagram: 150,
  facebook: 150,
  x: 150,
  youtube: 150,
  whatsapp: 20,
} as const;

function clip(value: string, max: number) {
  return value.slice(0, max);
}

export default function HeroAdmin({ config, onSaved }: Props) {
  const savedImages = config?.heroImages || [];
  const [name, setName] = useState(clip(config?.name || PLATFORM_NAME, LIMIT.name));
  const [motto, setMotto] = useState(clip(config?.motto || "", LIMIT.motto));
  const [logoUrl, setLogoUrl] = useState(config?.logoUrl || "");
  const [headline, setHeadline] = useState(
    clip(config?.headline || PLATFORM_HEADLINE, LIMIT.headline),
  );
  const [tagline, setTagline] = useState(
    clip(config?.tagline || PLATFORM_DESCRIPTION, LIMIT.tagline),
  );
  const [instagram, setInstagram] = useState(
    clip(config?.social?.instagram || "", LIMIT.instagram),
  );
  const [facebook, setFacebook] = useState(
    clip(config?.social?.facebook || "", LIMIT.facebook),
  );
  const [x, setX] = useState(clip(config?.social?.x || "", LIMIT.x));
  const [youtube, setYoutube] = useState(
    clip(config?.social?.youtube || "", LIMIT.youtube),
  );
  const [whatsapp, setWhatsapp] = useState(
    clip(config?.social?.whatsapp || "", LIMIT.whatsapp),
  );
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    area: "header" | "cover" | "social";
    text: string;
    ok: boolean;
  } | null>(null);

  useEffect(() => {
    setName(clip(config?.name || PLATFORM_NAME, LIMIT.name));
    setMotto(clip(config?.motto || "", LIMIT.motto));
    setLogoUrl(config?.logoUrl || "");
    setHeadline(clip(config?.headline || PLATFORM_HEADLINE, LIMIT.headline));
    setTagline(clip(config?.tagline || PLATFORM_DESCRIPTION, LIMIT.tagline));
    setInstagram(clip(config?.social?.instagram || "", LIMIT.instagram));
    setFacebook(clip(config?.social?.facebook || "", LIMIT.facebook));
    setX(clip(config?.social?.x || "", LIMIT.x));
    setYoutube(clip(config?.social?.youtube || "", LIMIT.youtube));
    setWhatsapp(clip(config?.social?.whatsapp || "", LIMIT.whatsapp));
  }, [
    config?.name,
    config?.motto,
    config?.logoUrl,
    config?.headline,
    config?.tagline,
    config?.social?.instagram,
    config?.social?.facebook,
    config?.social?.x,
    config?.social?.youtube,
    config?.social?.whatsapp,
  ]);

  const flash = (
    area: "header" | "cover" | "social",
    text: string,
    ok = true,
  ) => {
    setNotice({ area, text, ok });
    window.setTimeout(() => setNotice(null), 2500);
  };

  const afterSave = () => {
    invalidatePlatformChrome();
    invalidatePlatformBanner();
    onSaved?.();
  };

  const fail = (area: "header" | "cover" | "social", err: unknown) => {
    console.error(err);
    const text = err instanceof Error && err.message ? err.message : "No se pudo guardar.";
    flash(area, text, false);
  };

  const saveImages = async (next: string[]) => {
    await replaceHeroImages(next);
    afterSave();
  };

  const saveHeaderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveHeader(
        clip(name.trim() || PLATFORM_NAME, LIMIT.name),
        clip(motto.trim(), LIMIT.motto),
        logoUrl.trim(),
      );
      afterSave();
      flash("header", "Header guardado.");
    } catch (err) {
      fail("header", err);
    }
  };

  const saveCover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCoverText(
        clip(headline.trim() || PLATFORM_HEADLINE, LIMIT.headline),
        clip(tagline.trim() || PLATFORM_DESCRIPTION, LIMIT.tagline),
      );
      afterSave();
      flash("cover", "Portada guardada.");
    } catch (err) {
      fail("cover", err);
    }
  };

  const addUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim();
    if (!clean) return;
    try {
      await saveImages([...savedImages, clean]);
      setUrl("");
      flash("cover", "Imagen añadida.");
    } catch (err) {
      fail("cover", err);
    }
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
        await saveHeader(
          clip(name.trim() || PLATFORM_NAME, LIMIT.name),
          clip(motto.trim(), LIMIT.motto),
          download,
        );
        afterSave();
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
    try {
      await saveImages(copy);
    } catch (err) {
      fail("cover", err);
    }
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
          onSubmit={saveHeaderForm}
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
              maxLength={LIMIT.name}
              onChange={(e) => setName(clip(e.target.value, LIMIT.name))}
              placeholder={PLATFORM_NAME}
            />
          </Field>
          <Field label="Lema">
            <FormInput
              value={motto}
              maxLength={LIMIT.motto}
              onChange={(e) => setMotto(clip(e.target.value, LIMIT.motto))}
              placeholder="Pasión por el fútbol, comunidad en cada partido."
            />
          </Field>
          {notice?.area === "header" && (
            <p style={{ margin: 0, color: notice.ok ? C.green : C.red, fontSize: "0.8rem" }}>
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
              maxLength={LIMIT.headline}
              onChange={(e) => setHeadline(clip(e.target.value, LIMIT.headline))}
              placeholder={PLATFORM_HEADLINE}
            />
          </Field>
          <Field label="Texto debajo del título">
            <FormTextarea
              rows={3}
              value={tagline}
              maxLength={LIMIT.tagline}
              onChange={(e) => setTagline(clip(e.target.value, LIMIT.tagline))}
              placeholder={PLATFORM_DESCRIPTION}
            />
          </Field>
          {notice?.area === "cover" && (
            <p style={{ margin: 0, color: notice.ok ? C.green : C.red, fontSize: "0.8rem" }}>
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
                    onClick={() => {
                      void saveImages(savedImages.filter((_, idx) => idx !== i)).catch((err) =>
                        fail("cover", err),
                      );
                    }}
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
            onClick={() => {
              void saveImages([...DEFAULT_PLATFORM_HERO_IMAGES]).catch((err) =>
                fail("cover", err),
              );
            }}
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
            try {
              await saveSocial({
                instagram: clip(instagram.trim(), LIMIT.instagram),
                facebook: clip(facebook.trim(), LIMIT.facebook),
                x: clip(x.trim(), LIMIT.x),
                youtube: clip(youtube.trim(), LIMIT.youtube),
                whatsapp: clip(whatsapp.trim(), LIMIT.whatsapp),
              });
              afterSave();
              flash("social", "Redes guardadas.");
            } catch (err) {
              fail("social", err);
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <Field label="Instagram" hint="Usuario o URL. Ej. @orinco o https://instagram.com/orinco">
            <FormInput
              value={instagram}
              maxLength={LIMIT.instagram}
              onChange={(e) => setInstagram(clip(e.target.value, LIMIT.instagram))}
              placeholder="@usuario"
            />
          </Field>
          <Field label="Facebook" hint="Página o URL.">
            <FormInput
              value={facebook}
              maxLength={LIMIT.facebook}
              onChange={(e) => setFacebook(clip(e.target.value, LIMIT.facebook))}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="X" hint="Usuario o URL. Ej. @orinco o https://x.com/orinco">
            <FormInput
              value={x}
              maxLength={LIMIT.x}
              onChange={(e) => setX(clip(e.target.value, LIMIT.x))}
              placeholder="https://x.com/..."
            />
          </Field>
          <Field label="YouTube" hint="Canal o URL. Ej. @orinco o https://youtube.com/@orinco">
            <FormInput
              value={youtube}
              maxLength={LIMIT.youtube}
              onChange={(e) => setYoutube(clip(e.target.value, LIMIT.youtube))}
              placeholder="https://youtube.com/@..."
            />
          </Field>
          <Field label="WhatsApp" hint="Número de la empresa. Ej. 622 123 4567">
            <FormInput
              value={whatsapp}
              maxLength={LIMIT.whatsapp}
              onChange={(e) => setWhatsapp(clip(e.target.value, LIMIT.whatsapp))}
              placeholder="622 123 4567"
            />
          </Field>
          {notice?.area === "social" && (
            <p style={{ margin: 0, color: notice.ok ? C.green : C.red, fontSize: "0.8rem" }}>
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
