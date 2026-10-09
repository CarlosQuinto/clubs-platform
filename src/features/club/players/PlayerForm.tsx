import React, { useState, useEffect, useRef } from "react";
import { Users, UploadCloud, Camera, Link as LinkIcon } from "lucide-react";
import {
  SectionCard,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  RADIUS,
  SHADOWS,
  C,
  FormError,
} from "../../../shared/ui";
import { isoDate } from "../../../shared/helpers";
import {
  playerFullName,
  playerVariant as playerVariantText,
  shirtNumber,
} from "../../../shared/textLimits";

// 👇 IMPORTACIONES DE STORAGE Y COMPRESIÓN 👇
import { useClub } from "../../../domains/clubs/ClubContext";
import { deleteStoredImage, isStoredImageUrl, uploadImageFile } from "../../../infrastructure/storage/uploadImage";

import { BIRTH_MIN } from "../../../domains/players/playerRules";

// ── COMPONENTE SWITCH (SLIDER) PERSONALIZADO ──
const ToggleSwitch = ({
  checked,
  onChange,
  disabled,
  activeColor = C.green,
}: any) => (
  <div
    onClick={() => !disabled && onChange(!checked)}
    style={{
      width: "46px",
      height: "26px",
      backgroundColor: checked ? activeColor : C.gray300,
      borderRadius: RADIUS.full,
      position: "relative",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background-color 0.25s ease",
      opacity: disabled ? 0.6 : 1,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: "22px",
        height: "22px",
        backgroundColor: C.white,
        borderRadius: "50%",
        position: "absolute",
        top: "2px",
        left: checked ? "22px" : "2px",
        transition: "left 0.25s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    />
  </div>
);

interface PlayerFormProps {
  isPressOnly: boolean;
  editingPlayerId: string | null;
  playerName: string;
  setPlayerName: (val: string) => void;
  playerNumber: string;
  setPlayerNumber: (val: string) => void;
  playerPosition: string;
  setPlayerPosition: (val: string) => void;
  playerVariant: string;
  setPlayerVariant: (val: string) => void;
  playerBirthDate: string;
  setPlayerBirthDate: (val: string) => void;
  playerImageUrl: string;
  setPlayerImageUrl: (val: string) => void;
  playerActive: boolean;
  setPlayerActive: (val: boolean) => void;
  /** Resuelve true si el fichaje quedó guardado. */
  onSubmit: (e: React.FormEvent) => Promise<boolean>;
  onCancel: () => void;
  /** Motivo por el que no se pudo guardar (vacío si no hay). */
  error: string;
  saving: boolean;
  /** Jugador que ya existe en la liga (0010): solo se eligen dorsal, posición y variante; restoring = estuvo aquí. */
  linkedPlayer?: { restoring: boolean } | null;
  /** Otros clubes del jugador que se edita: nombre, foto y nacimiento se ven también ahí. */
  sharedWith?: string[];
}

export default function PlayerForm({
  isPressOnly,
  editingPlayerId,
  playerName,
  setPlayerName,
  playerNumber,
  setPlayerNumber,
  playerPosition,
  setPlayerPosition,
  playerVariant,
  setPlayerVariant,
  playerBirthDate,
  setPlayerBirthDate,
  playerImageUrl,
  setPlayerImageUrl,
  playerActive,
  setPlayerActive,
  onSubmit,
  onCancel,
  error,
  saving,
  linkedPlayer = null,
  sharedWith = [],
}: PlayerFormProps) {
  const title = linkedPlayer
    ? linkedPlayer.restoring
      ? "Restaurar en la Plantilla"
      : "Agregar a la Plantilla"
    : editingPlayerId
      ? isPressOnly
        ? "Actualizar Foto"
        : "Editar Jugador"
      : "Fichar Jugador";
  // Los datos de la persona (nombre, nacimiento, foto) no se tocan al sumar a alguien que ya existe
  const personLocked = isPressOnly || Boolean(linkedPlayer);
  const photoLocked = Boolean(linkedPlayer);

  const { storagePath } = useClub();
  const [isUploading, setIsUploading] = useState(false);
  const [newlyUploadedPhotos, setNewlyUploadedPhotos] = useState<string[]>([]);
  const originalImageRef = useRef<string>("");

  useEffect(() => {
    originalImageRef.current = playerImageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPlayerId]);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploading(true);

      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.8,
      };

      const url = await uploadImageFile(
        storagePath("players", `profile_${Date.now()}.jpg`),
        file,
        options,
      );

      setNewlyUploadedPhotos((prev) => [...prev, url]);
      setPlayerImageUrl(url);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("Error al subir la imagen. Verifica tu conexión.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelWithCleanup = async () => {
    if (newlyUploadedPhotos.length > 0) {
      for (const url of newlyUploadedPhotos) {
        try {
          await deleteStoredImage(url);
        } catch (e) {}
      }
    }
    setNewlyUploadedPhotos([]);
    onCancel();
  };

  const handleSubmitWithCleanup = async (e: React.FormEvent) => {
    e.preventDefault();

    const orphanedPhotos = newlyUploadedPhotos.filter(
      (url) => url !== playerImageUrl,
    );

    const cleanUpTask = async () => {

      for (const url of orphanedPhotos) {
        try {
          await deleteStoredImage(url);
        } catch (err) {}
      }

      const oldImage = originalImageRef.current;
      if (
        oldImage &&
        oldImage !== playerImageUrl &&
        isStoredImageUrl(oldImage)
      ) {
        try {
          await deleteStoredImage(oldImage);
        } catch (err) {}
      }
    };

    // Las fotos solo se limpian si el fichaje se guardó: si no, el formulario sigue con ellas
    if (!(await onSubmit(e))) return;
    cleanUpTask();
    setNewlyUploadedPhotos([]);
  };

  return (
    <SectionCard className="compact-form-card" title={title} icon={<Users size={14} />}>
      <form
        onSubmit={handleSubmitWithCleanup}
        className="player-form compact-form"
        style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}
      >
        <FormInput
          required
          disabled={personLocked}
          value={playerName}
          maxLength={50}
          onChange={(e) => setPlayerName(playerFullName(e.target.value))}
          placeholder="Nombre completo"
        />

        <div className="player-form-grid player-form-grid--meta">
          <FormInput
            type="text"
            inputMode="numeric"
            required
            disabled={isPressOnly}
            value={playerNumber}
            maxLength={2}
            onChange={(e) => setPlayerNumber(shirtNumber(e.target.value))}
            placeholder="Dorsal (1-99)"
          />
          <FormSelect
            disabled={isPressOnly}
            value={playerPosition}
            onChange={(e) => setPlayerPosition(e.target.value)}
            aria-label="Posición"
          >
            <option value="Portero">Portero</option>
            <option value="Defensa">Defensa</option>
            <option value="Medio">Medio</option>
            <option value="Delantero">Delantero</option>
          </FormSelect>
        </div>

        <div className="player-form-grid player-form-grid--meta">
          <FormInput
            disabled={isPressOnly}
            value={playerVariant}
            maxLength={30}
            onChange={(e) => setPlayerVariant(playerVariantText(e.target.value))}
            placeholder="Variante, ej. Extremo"
          />
          <FormInput
            type="date"
            disabled={personLocked}
            min={BIRTH_MIN}
            max={isoDate()}
            value={playerBirthDate}
            onChange={(e) => setPlayerBirthDate(e.target.value)}
            placeholder="Nacimiento"
            aria-label="Fecha de nacimiento"
          />
        </div>

        {/* ── ZONA DE FOTO ── */}
        <div className="player-photo-row">
          {/* Avatar Circular Grande */}
          <div
            style={{
              position: "relative",
              width: "48px",
              height: "48px",
              backgroundColor: C.white,
              borderRadius: "50%",
              color: C.gray300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              border: `2px solid ${playerImageUrl ? C.green : C.gray200}`,
              boxShadow: SHADOWS.sm,
            }}
          >
            <Camera size={18} style={{ position: "absolute", zIndex: 0 }} />
            {playerImageUrl && (
              <img
                src={playerImageUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  position: "relative",
                  zIndex: 1,
                  backgroundColor: C.white,
                }}
              />
            )}
          </div>

          <div className="player-photo-row__fields">
            <label
              className="player-photo-row__upload"
              style={{
                cursor: isUploading || photoLocked ? "not-allowed" : "pointer",
                opacity: isUploading || photoLocked ? 0.7 : 1,
              }}
            >
              <UploadCloud size={14} color={C.amber} />
              {isUploading ? "Optimizando…" : "Subir desde galería"}
              <input
                type="file"
                accept="image/*"
                disabled={isUploading || photoLocked}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoUpload(e.target.files[0]);
                  }
                }}
                style={{ display: "none" }}
              />
            </label>

            <div className="player-photo-row__url">
              <LinkIcon size={12} color={C.gray400} />
              <input
                type="url"
                value={playerImageUrl}
                disabled={photoLocked}
                onChange={(e) => setPlayerImageUrl(e.target.value)}
                placeholder="O pega un enlace…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  borderBottom: `1px solid ${C.gray300}`,
                  outline: "none",
                  fontSize: "0.75rem",
                  color: C.gray600,
                  backgroundColor: "transparent",
                  padding: "0.2rem 0",
                }}
              />
            </div>
          </div>
        </div>

        {(linkedPlayer || sharedWith.length > 0) && (
          <p style={{ margin: 0, fontSize: "0.72rem", color: C.gray500, lineHeight: 1.4 }}>
            {linkedPlayer
              ? "Nombre, foto y nacimiento son de la persona y se ven en todos sus clubes; aquí solo eliges su dorsal, posición y variante."
              : `Nombre, foto y nacimiento se ven también en ${sharedWith.join(", ")}.`}
          </p>
        )}

        {/* ── AJUSTES DEL JUGADOR (SLIDERS) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          {editingPlayerId && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: playerActive
                  ? "rgba(16,185,129,0.05)"
                  : "rgba(239,68,68,0.05)",
                borderRadius: RADIUS.md,
                border: `1px solid ${playerActive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: playerActive ? C.green : C.red,
                  }}
                >
                  {playerActive ? "Jugador Activo" : "Baja Temporal"}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: C.gray500,
                    lineHeight: 1.3,
                  }}
                >
                  {playerActive
                    ? "Está disponible para convocatorias y eventos."
                    : "No aparecerá en listas para pasar asistencia."}
                </span>
              </div>
              <ToggleSwitch
                checked={playerActive}
                onChange={setPlayerActive}
                disabled={isPressOnly}
                activeColor={C.green}
              />
            </div>
          )}
        </div>

        <FormError>{error}</FormError>
        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <PrimaryButton
            type="submit"
            style={{
              flex: 1,
              opacity: isUploading ? 0.7 : 1,
              padding: "0.55rem",
            }}
            disabled={isUploading || saving}
          >
            {isUploading
              ? "Cargando..."
              : saving
                ? "Guardando…"
                : linkedPlayer
                  ? linkedPlayer.restoring
                    ? "Restaurar"
                    : "Agregar a la Plantilla"
                  : editingPlayerId
                    ? "Guardar Cambios"
                    : "Confirmar Fichaje"}
          </PrimaryButton>

          {(editingPlayerId || linkedPlayer) && (
            <SecondaryButton
              type="button"
              onClick={handleCancelWithCleanup}
              style={{ flex: 1 }}
            >
              Cancelar
            </SecondaryButton>
          )}
        </div>
      </form>
    </SectionCard>
  );
}
