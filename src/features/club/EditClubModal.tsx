import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, UploadCloud, X } from "lucide-react";
import { invalidateMySpaces } from "../../domains/auth/mySpaces";
import { DEFAULT_CLUB_LOGO, DEFAULT_CLUB_NAME } from "../../domains/clubs/clubDefaults";
import { dataConnect, saveClubProfile } from "../../infrastructure/dataconnect";
import { deleteStoredImage, isStoredImageUrl, uploadImageFile } from "../../infrastructure/storage/uploadImage";
import { clubStoragePath } from "../../shared/paths";
import { savedRow } from "../../shared/saved";
import { cellPhone, clubName, isCellPhone, isClubName, titleCase } from "../../shared/textLimits";
import { C, FormInput, PrimaryButton, RADIUS, SecondaryButton, SHADOWS } from "../../shared/ui";
import { useModalLock } from "../../shared/useModalLock";

export type EditableClub = { id: string; name: string; logoUrl?: string | null; presidentPhone?: string | null };

/**
 * «Ajustes del Club»: nombre, escudo (subir o pegar URL) y teléfono del presidente, con save_club_profile
 * (presidente del club o superadmin). Lo abren el lápiz del escudo en /:slug y «Editar información» del
 * menú «⋯» de cada tarjeta en /equipos. Al cancelar borra los escudos que subió y no se usaron; al guardar,
 * el escudo anterior si era nuestro.
 */
export default function EditClubModal({
  club,
  onClose,
  onSaved,
}: {
  club: EditableClub;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(club.name || DEFAULT_CLUB_NAME);
  const [logo, setLogo] = useState(club.logoUrl || DEFAULT_CLUB_LOGO);
  const [phone, setPhone] = useState(club.presidentPhone || "");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const uploadLogo = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const url = await uploadImageFile(
        clubStoragePath(club.id, "logos", `logo_${Date.now()}.jpg`),
        file,
        options,
      );
      setUploaded((prev) => [...prev, url]);
      setLogo(url);
    } catch (error) {
      console.error("Error subiendo logo:", error);
      alert("Error al subir el escudo.");
    } finally {
      setUploading(false);
    }
  };

  const cancel = async () => {
    for (const url of uploaded) {
      try {
        await deleteStoredImage(url);
      } catch (error) {
        console.error("No se pudo eliminar el logo cancelado:", error);
      }
    }
    onClose();
  };

  useModalLock(() => {
    void cancel();
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mismas reglas que el alta de club (create_club / save_club_profile): nombre en Title Case y teléfono de 10 a 15 dígitos
    const cleanName = titleCase(name.trim().replace(/ {2,}/g, " "));
    const cleanPhone = phone.trim();
    if (!isClubName(cleanName)) {
      alert("El nombre del club debe tener de 3 a 30 letras o números.");
      return;
    }
    if (cleanPhone && !isCellPhone(cleanPhone)) {
      alert("El teléfono debe tener de 10 a 15 dígitos.");
      return;
    }
    try {
      const oldLogo = club.logoUrl;
      if (oldLogo && oldLogo !== logo && isStoredImageUrl(oldLogo)) {
        try {
          await deleteStoredImage(oldLogo);
        } catch (e) {}
      }
      for (const url of uploaded.filter((url) => url !== logo)) {
        try {
          await deleteStoredImage(url);
        } catch (e) {}
      }
      const saved = await saveClubProfile(dataConnect, {
        id: club.id,
        name: cleanName,
        logoUrl: logo,
        presidentPhone: cleanPhone,
      });
      savedRow(saved.data.club);
      invalidateMySpaces();
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error al actualizar el club:", error);
      alert("Hubo un problema al guardar los cambios.");
    }
  };

  // Portal al body para que la cabecera (backdrop-filter) no recorte el `position: fixed`.
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={() => void cancel()}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          width: "100%",
          maxWidth: "420px",
          boxShadow: SHADOWS.xl,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            backgroundColor: C.gray50,
            borderBottom: `1px solid ${C.gray200}`,
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "800",
              color: C.navy900,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                padding: "6px",
                borderRadius: "50%",
                display: "flex",
              }}
            >
              <Edit2 size={16} color={C.amber} />
            </div>
            Ajustes del Club
          </h3>
          <button
            onClick={cancel}
            style={{
              background: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: "50%",
              color: C.gray500,
              cursor: "pointer",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={save}
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: C.gray500,
                marginBottom: "0.4rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Nombre del Equipo
            </label>
            <FormInput
              type="text"
              required
              value={name}
              maxLength={30}
              onChange={(e) => setName(clubName(e.target.value))}
              placeholder={`Ej. ${DEFAULT_CLUB_NAME}`}
              style={{
                width: "100%",
                fontSize: "1rem",
                fontWeight: "600",
                padding: "0.75rem",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: C.gray500,
                marginBottom: "0.4rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Teléfono del presidente
            </label>
            <FormInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(cellPhone(e.target.value))}
              placeholder="Ej. 6221234567"
              maxLength={16}
              style={{
                width: "100%",
                fontSize: "1rem",
                fontWeight: "600",
                padding: "0.75rem",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: C.gray500,
                marginBottom: "0.5rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Escudo del Club (Logo)
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1rem",
                backgroundColor: C.gray50,
                borderRadius: RADIUS.lg,
                border: `1px solid ${C.gray100}`,
              }}
            >
              <img
                src={
                  logo ||
                  "https://ui-avatars.com/api/?name=Club&background=f1f5f9&color=94a3b8"
                }
                alt="Vista previa"
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${C.gray200}`,
                  boxShadow: SHADOWS.sm,
                  backgroundColor: C.white,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: C.white,
                    border: `1px solid ${C.gray200}`,
                    color: C.navy900,
                    padding: "0.4rem 0.875rem",
                    borderRadius: RADIUS.full,
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: uploading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    opacity: uploading ? 0.6 : 1,
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <UploadCloud size={14} color={C.amber} />
                  {uploading ? "Subiendo..." : "Cambiar Imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        uploadLogo(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: C.gray400,
                    fontWeight: "500",
                  }}
                >
                  JPG, PNG o WEBP de hasta 5 MB
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: C.gray200,
                }}
              />
              <span
                style={{
                  fontSize: "0.65rem",
                  color: C.gray400,
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                }}
              >
                O PEGAR URL
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: C.gray200,
                }}
              />
            </div>

            <FormInput
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              style={{
                width: "100%",
                marginTop: "0.75rem",
                fontSize: "0.85rem",
                color: C.gray600,
              }}
            />
          </div>

          <div
            style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}
          >
            <SecondaryButton
              type="button"
              onClick={cancel}
              style={{ flex: 1 }}
            >
              Cancelar
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              style={{ flex: 1, opacity: uploading ? 0.7 : 1 }}
              disabled={uploading}
            >
              {uploading ? "Guardando..." : "Guardar Cambios"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
