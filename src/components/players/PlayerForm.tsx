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
} from "../../components/ui";

// 👇 IMPORTACIONES DE STORAGE Y COMPRESIÓN 👇
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { useClub } from "../../context/ClubContext";

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
  isDT: boolean;
  setIsDT: (val: boolean) => void;
  playerActive: boolean;
  setPlayerActive: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
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
  isDT,
  setIsDT,
  playerActive,
  setPlayerActive,
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  const title = editingPlayerId
    ? isPressOnly
      ? "Actualizar Foto"
      : "Editar Jugador"
    : "Fichar Jugador";

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

      const compressedFile = await imageCompression(file, options);
      const storage = getStorage();
      const fileRef = ref(
        storage,
        storagePath("players", `profile_${Date.now()}_${compressedFile.name}`),
      );

      await uploadBytes(fileRef, compressedFile);
      const url = await getDownloadURL(fileRef);

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
      const storage = getStorage();
      for (const url of newlyUploadedPhotos) {
        try {
          await deleteObject(ref(storage, url));
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
      const storage = getStorage();

      for (const url of orphanedPhotos) {
        try {
          await deleteObject(ref(storage, url));
        } catch (err) {}
      }

      const oldImage = originalImageRef.current;
      if (
        oldImage &&
        oldImage !== playerImageUrl &&
        oldImage.includes("firebasestorage.googleapis.com")
      ) {
        try {
          await deleteObject(ref(storage, oldImage));
        } catch (err) {}
      }
    };

    cleanUpTask();

    onSubmit(e);
    setNewlyUploadedPhotos([]);
  };

  return (
    <SectionCard title={title} icon={<Users size={16} />}>
      <form
        onSubmit={handleSubmitWithCleanup}
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        {/* FILA 1: NOMBRE Y DORSAL */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <FormInput
            required
            disabled={isPressOnly}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Nombre completo"
            style={{ flex: "1 1 200px" }}
          />
          <FormInput
            type="number"
            required
            disabled={isPressOnly}
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value)}
            placeholder="Dorsal"
            style={{ width: "90px", flexShrink: 0 }}
          />
        </div>

        {/* FILA 2: POSICIÓN, VARIANTE Y FECHA */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <FormSelect
            disabled={isPressOnly}
            value={playerPosition}
            onChange={(e) => setPlayerPosition(e.target.value)}
            style={{ flex: "1 1 120px" }}
          >
            <option value="Portero">Portero</option>
            <option value="Defensa">Defensa</option>
            <option value="Medio">Medio</option>
            <option value="Delantero">Delantero</option>
          </FormSelect>

          <FormInput
            disabled={isPressOnly}
            value={playerVariant}
            onChange={(e) => setPlayerVariant(e.target.value)}
            placeholder="Variante (Ej. Extremo)"
            style={{ flex: "1 1 140px" }}
          />

          <FormInput
            type="date"
            disabled={isPressOnly}
            value={playerBirthDate}
            onChange={(e) => setPlayerBirthDate(e.target.value)}
            placeholder="Nacimiento"
            style={{ flex: "1 1 140px" }}
          />
        </div>

        {/* ── ZONA DE FOTO ── */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            backgroundColor: C.gray50,
            padding: "1rem",
            borderRadius: RADIUS.md,
            border: `1px dashed ${C.gray300}`,
            marginTop: "0.25rem",
          }}
        >
          {/* Avatar Circular Grande */}
          <div
            style={{
              position: "relative",
              width: "60px",
              height: "60px",
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
            <Camera size={24} style={{ position: "absolute", zIndex: 0 }} />
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

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: C.white,
                border: `1px solid ${C.gray200}`,
                padding: "0.4rem 0.75rem",
                borderRadius: RADIUS.md,
                color: C.navy900,
                fontSize: "0.8125rem",
                fontWeight: "700",
                cursor: isUploading ? "not-allowed" : "pointer",
                width: "fit-content",
                boxShadow: SHADOWS.sm,
                transition: "all 0.2s",
              }}
            >
              <UploadCloud size={16} color={C.amber} />
              {isUploading ? "Optimizando imagen..." : "Subir desde galería"}
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoUpload(e.target.files[0]);
                  }
                }}
                style={{ display: "none" }}
              />
            </label>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <LinkIcon size={12} color={C.gray400} />
              <input
                type="url"
                value={playerImageUrl}
                onChange={(e) => setPlayerImageUrl(e.target.value)}
                placeholder="O pega un enlace de internet aquí..."
                style={{
                  flex: 1,
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

        {/* ── AJUSTES DEL JUGADOR (SLIDERS) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          {/* SWITCH CUERPO TÉCNICO */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem",
              backgroundColor: C.gray50,
              borderRadius: RADIUS.md,
              border: `1px solid ${C.gray200}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  color: C.navy900,
                }}
              >
                Cuerpo Técnico
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: C.gray500,
                  lineHeight: 1.3,
                }}
              >
                Este integrante forma parte del staff técnico (DT, Auxiliar).
              </span>
            </div>
            <ToggleSwitch
              checked={isDT}
              onChange={setIsDT}
              disabled={isPressOnly}
              activeColor={C.navy900}
            />
          </div>

          {/* 👇 SWITCH ESTADO ACTIVO (SOLO EN MODO EDICIÓN) 👇 */}
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

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <PrimaryButton
            type="submit"
            style={{
              flex: 1,
              opacity: isUploading ? 0.7 : 1,
              padding: "0.875rem",
            }}
            disabled={isUploading}
          >
            {isUploading
              ? "Cargando..."
              : editingPlayerId
                ? "Guardar Cambios"
                : "Confirmar Fichaje"}
          </PrimaryButton>

          {editingPlayerId && (
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
