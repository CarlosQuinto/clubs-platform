import { useEffect, useRef, useState } from "react";
import { Camera, UploadCloud, UserPlus, UserPen } from "lucide-react";
import {
  BIRTH_MIN,
  clubPlayerFieldsError,
  PLAYER_POSITIONS,
  playerPersonError,
} from "../../../domains/players/playerRules";
import { findAdminPlayers, playerErrorMessage, saveAdminPlayer } from "../../../domains/players/playerCommands";
import type { AdminPlayerHit } from "../../../infrastructure/dataconnect";
import { deleteStoredImage, isStoredImageUrl, uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import { isoDate } from "../../../shared/helpers";
import { platformStoragePath } from "../../../shared/paths";
import { isPlayerFullName, playerFullName, playerVariant, shirtNumber } from "../../../shared/textLimits";
import { C, FormError, FormInput, FormSelect, PrimaryButton, SecondaryButton, SectionCard } from "../../../shared/ui";
import Field from "../Field";

export interface AdminPlayerFormInitial {
  id: string;
  name: string;
  birthDate: string;
  imageUrl: string;
}

/**
 * Alta o edición de un jugador desde /admin. Al crear, el club es opcional (sin él queda libre y los clubes lo
 * encuentran con «¿Ya juega en otro club?»); al editar solo cambian nombre, nacimiento y foto, que se ven en todos
 * sus clubes. Avisa si ya hay alguien con un nombre parecido para no crear duplicados.
 */
export default function AdminPlayerForm({
  initial,
  clubs,
  onSaved,
  onCancel,
  onOpenPlayer,
}: {
  /** null = jugador nuevo. */
  initial: AdminPlayerFormInitial | null;
  /** Clubes vivos para el alta (vacío al editar). */
  clubs: { id: string; name: string }[];
  onSaved: (id: string) => void;
  onCancel: () => void;
  onOpenPlayer?: (id: string) => void;
}) {
  const editing = Boolean(initial);
  const [id] = useState(() => initial?.id ?? crypto.randomUUID());
  const [name, setName] = useState(initial?.name ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [clubId, setClubId] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState<string>("Delantero");
  const [variant, setVariant] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [similar, setSimilar] = useState<AdminPlayerHit[]>([]);
  const sending = useRef(false);
  const uploaded = useRef<string[]>([]);

  // Posibles duplicados mientras se escribe el nombre de un jugador nuevo
  useEffect(() => {
    if (editing || !isPlayerFullName(name)) {
      setSimilar([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void findAdminPlayers(name.trim(), false)
        .then((hits) => {
          if (!cancelled) setSimilar(hits.slice(0, 5));
        })
        .catch(() => {
          if (!cancelled) setSimilar([]);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [editing, name]);

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImageFile(platformStoragePath("players", `${id}_${Date.now()}.jpg`), file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        initialQuality: 0.8,
      });
      uploaded.current.push(url);
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la foto. Revisa tu conexión.");
    } finally {
      setUploading(false);
    }
  };

  /** Borra las fotos subidas que no quedaron guardadas (y la anterior si se reemplazó). */
  const cleanPhotos = (kept: string, previous: string) => {
    const orphans = uploaded.current.filter((url) => url !== kept);
    if (previous && previous !== kept && isStoredImageUrl(previous)) orphans.push(previous);
    uploaded.current = [];
    for (const url of orphans) void deleteStoredImage(url).catch(() => undefined);
  };

  const cancel = () => {
    cleanPhotos(initial?.imageUrl ?? "", "");
    onCancel();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending.current) return;
    const problem = playerPersonError(name, birthDate) || (clubId ? clubPlayerFieldsError(number, variant) : "");
    if (problem) {
      setError(problem);
      return;
    }
    sending.current = true;
    setSaving(true);
    setError("");
    try {
      await saveAdminPlayer({
        id,
        name: name.trim(),
        birthDate,
        imageUrl,
        ...(clubId ? { clubId, shirtNumber: number, position, variant: variant.trim() } : {}),
      });
      cleanPhotos(imageUrl, initial?.imageUrl ?? "");
      onSaved(id);
    } catch (err) {
      console.error(err);
      setError(playerErrorMessage(err, "No se pudo guardar el jugador."));
    } finally {
      sending.current = false;
      setSaving(false);
    }
  };

  return (
    <SectionCard
      className="compact-form-card"
      title={editing ? "Editar jugador" : "Nuevo jugador"}
      icon={editing ? <UserPen size={14} color={C.amber} /> : <UserPlus size={14} color={C.amber} />}
    >
      <form onSubmit={submit} className="compact-form admin-player-form">
        <Field label="Nombre completo">
          <FormInput
            required
            value={name}
            maxLength={50}
            onChange={(e) => {
              setName(playerFullName(e.target.value));
              setError("");
            }}
            placeholder="Nombre y apellidos"
            autoComplete="off"
          />
        </Field>
        {similar.length > 0 ? (
          <div className="admin-player-form__similar" role="status">
            <strong>¿Ya existe?</strong> Hay jugadores con un nombre parecido:
            <ul>
              {similar.map((hit) => (
                <li key={hit.id}>
                  {onOpenPlayer ? (
                    <button type="button" onClick={() => onOpenPlayer(hit.id)}>
                      {hit.name}
                    </button>
                  ) : (
                    hit.name
                  )}
                  <span>
                    {hit.clubs_on_player.length > 0 ? hit.clubs_on_player.map((c) => c.name).join(", ") : "Sin club"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="admin-player-form__grid">
          <Field label="Nacimiento (opcional)">
            <FormInput
              type="date"
              min={BIRTH_MIN}
              max={isoDate()}
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setError("");
              }}
            />
          </Field>
          {/* No va dentro de Field: el selector de archivo ya es un <label> */}
          <div className="admin-player-form__photo-field">
            <span className="admin-player-form__caption">Foto (opcional)</span>
            <label className="admin-player-form__photo">
              {imageUrl ? <img src={imageUrl} alt="" /> : <Camera size={16} aria-hidden />}
              <span>{uploading ? "Subiendo…" : imageUrl ? "Cambiar foto" : "Subir foto"}</span>
              <UploadCloud size={14} aria-hidden />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={uploading}
                onChange={(e) => {
                  void handlePhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {imageUrl ? (
              <button type="button" className="admin-player-form__link" onClick={() => setImageUrl("")}>
                Quitar foto
              </button>
            ) : null}
          </div>
        </div>

        {!editing ? (
          <>
            <Field label="Club (opcional)" hint="Sin club queda libre: cualquier club lo puede sumar desde su plantilla.">
              <FormSelect value={clubId} onChange={(e) => setClubId(e.target.value)}>
                <option value="">Sin club (jugador libre)</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
            {clubId ? (
              <div className="admin-player-form__grid admin-player-form__grid--3">
                <Field label="Dorsal">
                  <FormInput
                    inputMode="numeric"
                    required
                    value={number}
                    maxLength={2}
                    onChange={(e) => setNumber(shirtNumber(e.target.value))}
                    placeholder="1-99"
                  />
                </Field>
                <Field label="Posición">
                  <FormSelect value={position} onChange={(e) => setPosition(e.target.value)}>
                    {PLAYER_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </FormSelect>
                </Field>
                <Field label="Variante">
                  <FormInput
                    value={variant}
                    maxLength={30}
                    onChange={(e) => setVariant(playerVariant(e.target.value))}
                    placeholder="Ej. Extremo"
                  />
                </Field>
              </div>
            ) : null}
          </>
        ) : null}

        {error ? <FormError>{error}</FormError> : null}
        <div className="admin-player-form__actions">
          <SecondaryButton type="button" onClick={cancel} disabled={saving}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving || uploading}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear jugador"}
          </PrimaryButton>
        </div>
      </form>
    </SectionCard>
  );
}
