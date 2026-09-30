import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { adRef, adsCol, platformStoragePath } from "../../lib/paths";
import { uploadImageFile } from "../../lib/uploadImage";
import {
  AD_PLACEMENTS,
  addDaysIso,
  placementLabel,
  safeAdHref,
  todayIso,
  type Ad,
  type AdPlacement,
} from "../../lib/ads";
import { useAds } from "../../hooks/useAds";
import Field from "./Field";
import {
  Badge,
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../ui";

interface Draft {
  id?: string;
  brand: string;
  imageUrl: string;
  href: string;
  placements: AdPlacement[];
  startsAt: string;
  endsAt: string;
  active: boolean;
  order: number;
}

function emptyDraft(order: number): Draft {
  return {
    brand: "",
    imageUrl: "",
    href: "",
    placements: AD_PLACEMENTS.map((item) => item.id),
    startsAt: todayIso(),
    endsAt: addDaysIso(30),
    active: true,
    order,
  };
}

function formatRange(start: string, end: string) {
  const fmt = (value: string) => {
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start || end || "Sin fechas";
}

export default function AdsAdmin() {
  const { ads } = useAds();
  const ordered = useMemo(
    () => [...ads].sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand)),
    [ads],
  );
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(0));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const editing = Boolean(draft.id);

  const togglePlacement = (id: AdPlacement) => {
    setDraft((current) => {
      const has = current.placements.includes(id);
      return {
        ...current,
        placements: has
          ? current.placements.filter((item) => item !== id)
          : [...current.placements, id],
      };
    });
  };

  const upload = async (file: File) => {
    try {
      setUploading(true);
      setError("");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const download = await uploadImageFile(
        platformStoragePath("ads", `${Date.now()}.${ext}`),
        file,
        { maxSizeMB: 0.8, maxWidthOrHeight: 1600 },
      );
      setDraft((current) => ({ ...current, imageUrl: download }));
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Revisa que hayas iniciado sesión.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const brand = draft.brand.trim();
    const imageUrl = draft.imageUrl.trim();
    const hrefInput = draft.href.trim();
    const href = hrefInput ? safeAdHref(hrefInput) : "";
    if (!brand) {
      setError("Escribe el nombre de la marca.");
      return;
    }
    if (!imageUrl) {
      setError("Sube una imagen o pega su URL.");
      return;
    }
    if (hrefInput && !href) {
      setError("El enlace debe empezar por http:// o https://.");
      return;
    }
    if (draft.placements.length === 0) {
      setError("Elige al menos una ubicación.");
      return;
    }
    if (!draft.startsAt || !draft.endsAt || draft.endsAt < draft.startsAt) {
      setError("La fecha de fin tiene que ser igual o posterior al inicio.");
      return;
    }
    const payload = {
      brand,
      imageUrl,
      href,
      placements: draft.placements,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      active: draft.active,
    };
    try {
      setBusy(true);
      setError("");
      if (draft.id) {
        await updateDoc(adRef(draft.id), payload);
        flash("Anuncio actualizado.");
      } else {
        const order =
          ordered.reduce((max, ad) => Math.max(max, ad.order), -1) + 1;
        await addDoc(adsCol(), {
          ...payload,
          order,
          createdAt: serverTimestamp(),
        });
        setDraft(emptyDraft(ordered.length + 1));
        flash("Anuncio creado.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (ad: Ad) => {
    setError("");
    setDraft({
      id: ad.id,
      brand: ad.brand,
      imageUrl: ad.imageUrl,
      href: ad.href,
      placements: ad.placements,
      startsAt: ad.startsAt,
      endsAt: ad.endsAt,
      active: ad.active,
      order: ad.order,
    });
  };

  const remove = async (ad: Ad) => {
    if (!window.confirm(`¿Eliminar el anuncio de ${ad.brand}?`)) return;
    await deleteDoc(adRef(ad.id));
    if (draft.id === ad.id) setDraft(emptyDraft(ordered.length));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= ordered.length) return;
    const copy = [...ordered];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    const batch = writeBatch(db);
    copy.forEach((ad, i) => batch.update(adRef(ad.id), { order: i }));
    await batch.commit();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <SectionCard
        title={editing ? "Editar anuncio" : "Nuevo anuncio"}
        icon={<Megaphone size={16} color={C.amber} />}
      >
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Imagen ancha, cerca de 1200×300. Actívala cuando el acuerdo esté
          vigente; el cobro se lleva fuera de la plataforma.
        </p>
        <form
          onSubmit={(e) => void save(e)}
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <Field label="Marca">
            <FormInput
              value={draft.brand}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="Nombre de la marca"
              required
            />
          </Field>
          <div className="seasons-form__dates">
            <Field label="Inicio">
              <FormInput
                type="date"
                value={draft.startsAt}
                onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                required
              />
            </Field>
            <Field label="Fin">
              <FormInput
                type="date"
                value={draft.endsAt}
                onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Enlace" hint="Opcional. Solo http o https. Se abre en otra pestaña.">
            <FormInput
              value={draft.href}
              onChange={(e) => setDraft({ ...draft, href: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Dónde se muestra">
            <div className="ad-placements">
              {AD_PLACEMENTS.map((item) => (
                <label key={item.id} className="ad-placements__item">
                  <input
                    type="checkbox"
                    checked={draft.placements.includes(item.id)}
                    onChange={() => togglePlacement(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </Field>
          <label className="ad-placements__item">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
            Activo
          </label>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {draft.imageUrl ? (
              <img
                src={draft.imageUrl}
                alt=""
                style={{
                  width: 180,
                  height: 56,
                  objectFit: "cover",
                  borderRadius: RADIUS.md,
                  border: `1px solid ${C.gray200}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 56,
                  borderRadius: RADIUS.md,
                  border: `1px dashed ${C.gray300}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.gray400,
                  fontSize: "0.75rem",
                }}
              >
                Sin imagen
              </div>
            )}
            <label className="cover-add-row__upload" style={{ width: "auto" }}>
              <UploadCloud size={14} /> {uploading ? "Subiendo..." : "Subir imagen"}
              <input
                type="file"
                accept="image/*"
                disabled={busy || uploading}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <Field label="O pega la URL de la imagen">
            <FormInput
              value={draft.imageUrl}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          {error && (
            <p style={{ margin: 0, color: C.red, fontSize: "0.8rem" }}>{error}</p>
          )}
          {notice && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>{notice}</p>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <PrimaryButton type="submit" disabled={busy}>
              {editing ? "Guardar cambios" : "Crear anuncio"}
            </PrimaryButton>
            {editing && (
              <SecondaryButton
                type="button"
                onClick={() => {
                  setError("");
                  setDraft(emptyDraft(ordered.length));
                }}
              >
                Cancelar
              </SecondaryButton>
            )}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Inventario" icon={<Megaphone size={16} color={C.amber} />}>
        {ordered.length === 0 && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
            Todavía no hay anuncios.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {ordered.map((ad, index) => (
            <div
              key={ad.id}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
                padding: "0.75rem 0.85rem",
                border: `1px solid ${C.gray200}`,
                borderRadius: RADIUS.md,
                backgroundColor: ad.active ? C.gray50 : C.gray100,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <SecondaryButton
                  type="button"
                  aria-label={`Subir ${ad.brand}`}
                  disabled={index === 0}
                  onClick={() => void move(index, -1)}
                  style={{ padding: "0.3rem 0.45rem" }}
                >
                  <ChevronUp size={14} />
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  aria-label={`Bajar ${ad.brand}`}
                  disabled={index === ordered.length - 1}
                  onClick={() => void move(index, 1)}
                  style={{ padding: "0.3rem 0.45rem" }}
                >
                  <ChevronDown size={14} />
                </SecondaryButton>
              </div>
              <img
                src={ad.imageUrl}
                alt=""
                style={{
                  width: 96,
                  height: 36,
                  objectFit: "cover",
                  borderRadius: RADIUS.sm,
                  flexShrink: 0,
                  background: C.gray200,
                }}
              />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 800, color: C.navy900 }}>{ad.brand}</div>
                <div style={{ fontSize: "0.75rem", color: C.gray500 }}>
                  {formatRange(ad.startsAt, ad.endsAt)}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.3rem",
                    marginTop: "0.35rem",
                  }}
                >
                  {ad.placements.map((id) => (
                    <Badge key={id} color="gray">
                      {placementLabel(id)}
                    </Badge>
                  ))}
                  <Badge color={ad.active ? "green" : "gray"}>
                    {ad.active ? "Activo" : "Pausado"}
                  </Badge>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                <SecondaryButton type="button" onClick={() => startEdit(ad)}>
                  Editar
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() =>
                    void updateDoc(adRef(ad.id), { active: !ad.active })
                  }
                >
                  {ad.active ? "Pausar" : "Activar"}
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  aria-label={`Eliminar ${ad.brand}`}
                  onClick={() => void remove(ad)}
                  style={{ padding: "0.45rem 0.55rem" }}
                >
                  <Trash2 size={14} />
                </SecondaryButton>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
