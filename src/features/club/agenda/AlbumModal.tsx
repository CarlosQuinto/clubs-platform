import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Images,
  X,
  Plus,
  Camera,
  Trash2,
  ChevronUp,
  UploadCloud,
  Link as LinkIcon,
} from "lucide-react";
import { useClub } from "../../../domains/clubs/ClubContext";
import { useModalLock } from "../../../shared/useModalLock";
import { C, RADIUS, SHADOWS, PrimaryButton } from "../../../shared/ui";

// 👇 IMPORTACIONES DE STORAGE Y COMPRESIÓN 👇
import { deleteStoredImage, isStoredImageUrl, uploadImageFile } from "../../../infrastructure/storage/uploadImage";

interface AlbumModalProps {
  ev: any;
  onClose: () => void;
  onSave: (cleanUrls: string[]) => void;
}

export default function AlbumModal({ ev, onClose, onSave }: AlbumModalProps) {
  const { storagePath } = useClub();
  const [albumUrls, setAlbumUrls] = useState<string[]>([]);

  // 👇 ESTADOS PARA SUBIDA Y BASURA 👇
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [newlyUploadedPhotos, setNewlyUploadedPhotos] = useState<string[]>([]);
  useModalLock(onClose);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (ev) {
      const initialUrls =
        ev.photoUrls && ev.photoUrls.length > 0
          ? ev.photoUrls
          : ev.photoUrl
            ? [ev.photoUrl]
            : [];
      setAlbumUrls(initialUrls.length > 0 ? initialUrls : [""]);
      setNewlyUploadedPhotos([]); // Reiniciamos el rastreador al abrir
    }
  }, [ev]);

  const movePhotoUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...albumUrls];
    const temp = newUrls[index - 1];
    newUrls[index - 1] = newUrls[index];
    newUrls[index] = temp;
    setAlbumUrls(newUrls);
  };

  // 👇 FUNCION: Subir foto comprimida al Storage 👇
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    try {
      setUploadingIndex(index);

      const options = {
        maxSizeMB: 0.2, // 200 KB máximo
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.8,
      };

      const url = await uploadImageFile(
        storagePath("events", `album_${Date.now()}.jpg`),
        file,
        options,
      );

      setNewlyUploadedPhotos((prev) => [...prev, url]);

      const newUrls = [...albumUrls];
      newUrls[index] = url;
      setAlbumUrls(newUrls);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("Error al subir la imagen. Verifica tu conexión.");
    } finally {
      setUploadingIndex(null);
    }
  };

  // 👇 LIMPIEZA AL CANCELAR 👇
  const handleCloseWithCleanup = async () => {
    if (newlyUploadedPhotos.length > 0) {
      for (const url of newlyUploadedPhotos) {
        try {
          await deleteStoredImage(url);
        } catch (e) {
          console.error("Error borrando foto cancelada", e);
        }
      }
    }
    setNewlyUploadedPhotos([]);
    onClose();
  };

  // 👇 LIMPIEZA AL GUARDAR 👇
  const handleSaveWithCleanup = async () => {
    const cleanUrls = albumUrls
      .map((url) => url.trim())
      .filter((url) => url !== "");


    // 1. Borrar fotos nuevas que subió y luego quitó antes de guardar
    const orphanedNew = newlyUploadedPhotos.filter(
      (url) => !cleanUrls.includes(url),
    );

    // 2. Borrar fotos viejas que estaban en la base de datos y decidió quitar del álbum
    const oldUrls =
      ev.photoUrls && ev.photoUrls.length > 0
        ? ev.photoUrls
        : ev.photoUrl
          ? [ev.photoUrl]
          : [];

    const orphanedOld = oldUrls.filter(
      (oldUrl: string) =>
        !cleanUrls.includes(oldUrl) &&
        isStoredImageUrl(oldUrl),
    );

    // Unimos toda la basura y la destruimos en Storage
    const urlsToDelete = [...orphanedNew, ...orphanedOld];
    for (const url of urlsToDelete) {
      try {
        await deleteStoredImage(url);
      } catch (error) {
        console.error("Error limpiando foto", error);
      }
    }

    setNewlyUploadedPhotos([]);
    onSave(cleanUrls);
  };

  if (!ev) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.85)", // Fondo oscuro difuminado
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={handleCloseWithCleanup}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          width: "100%",
          maxWidth: "520px", // Un poco más de aire
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: SHADOWS.xl,
          overflow: "hidden", // Para mantener bordes redondeados
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── CABECERA DEL MODAL ── */}
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
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                padding: "6px",
                borderRadius: "50%",
                display: "flex",
              }}
            >
              <Images size={16} color="#3b82f6" />
            </div>
            Álbum del Evento
          </h3>
          <button
            onClick={handleCloseWithCleanup}
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

        {/* ── CONTENIDO SCROLLEABLE ── */}
        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: C.navy900,
                margin: 0,
              }}
            >
              Gestor de Imágenes
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: C.gray500,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Sube fotos directo de tu dispositivo o pega los links.
              <strong style={{ color: C.amber }}>
                {" "}
                La primera imagen será la portada oficial.
              </strong>
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            {albumUrls.map((url, i) => {
              const isCover = i === 0;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                    padding: "1rem",
                    backgroundColor: C.white,
                    borderRadius: RADIUS.lg,
                    border: `1px solid ${isCover ? C.amber : C.gray200}`,
                    boxShadow: isCover
                      ? "0 4px 12px rgba(245, 158, 11, 0.15)"
                      : SHADOWS.sm,
                    position: "relative",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Etiqueta Flotante de Portada */}
                  {isCover && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        left: "1rem",
                        backgroundColor: C.amber,
                        color: C.navy900,
                        fontSize: "0.6rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 8px",
                        borderRadius: RADIUS.full,
                        boxShadow: SHADOWS.sm,
                        border: `1px solid ${C.white}`,
                      }}
                    >
                      Portada
                    </div>
                  )}

                  {/* ── Miniatura de Foto ── */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: RADIUS.md,
                      backgroundColor: C.gray50,
                      border: `1px solid ${C.gray200}`,
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: isCover ? "0.2rem" : "0", // Ajuste por la etiqueta
                    }}
                  >
                    {url.trim() ? (
                      <img
                        src={url}
                        alt={`Preview ${i}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                        onLoad={(e) =>
                          (e.currentTarget.style.display = "block")
                        }
                      />
                    ) : (
                      <Camera size={24} color={C.gray300} />
                    )}
                  </div>

                  {/* ── Controles de Fila ── */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                      marginTop: isCover ? "0.2rem" : "0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Botón Principal de Subida */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          backgroundColor: C.gray50,
                          border: `1px solid ${C.gray200}`,
                          color: C.navy900,
                          padding: "0.4rem 0.875rem",
                          borderRadius: RADIUS.full,
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor:
                            uploadingIndex !== null ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          opacity: uploadingIndex === i ? 0.6 : 1,
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <UploadCloud size={14} color={C.amber} />
                        {uploadingIndex === i
                          ? "Subiendo..."
                          : "Seleccionar Archivo"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingIndex !== null}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(i, e.target.files[0]);
                            }
                          }}
                          style={{ display: "none" }}
                        />
                      </label>

                      {/* Botones de Acción (Subir de nivel / Borrar) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          backgroundColor: C.gray50,
                          padding: "2px",
                          borderRadius: RADIUS.md,
                          border: `1px solid ${C.gray100}`,
                        }}
                      >
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => movePhotoUp(i)}
                            style={{
                              color: C.gray500,
                              background: C.white,
                              border: `1px solid ${C.gray200}`,
                              borderRadius: RADIUS.sm,
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            }}
                            title="Subir de nivel (Acercar a portada)"
                          >
                            <ChevronUp size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const n = [...albumUrls];
                            n.splice(i, 1);
                            setAlbumUrls(n);
                          }}
                          style={{
                            color: C.red || "#ef4444",
                            background: "rgba(239, 68, 68, 0.05)",
                            border: `1px solid rgba(239, 68, 68, 0.2)`,
                            borderRadius: RADIUS.sm,
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Eliminar foto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Input de URL sutil */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        borderTop: `1px dashed ${C.gray200}`,
                        paddingTop: "0.5rem",
                      }}
                    >
                      <LinkIcon size={12} color={C.gray400} />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const n = [...albumUrls];
                          n[i] = e.target.value;
                          setAlbumUrls(n);
                        }}
                        placeholder="O pega una URL externa aquí..."
                        style={{
                          flex: 1,
                          fontSize: "0.75rem",
                          border: "none",
                          background: "transparent",
                          color: C.gray600,
                          outline: "none",
                          padding: 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── BOTÓN AÑADIR NUEVO SLOT ── */}
            <button
              type="button"
              onClick={() => setAlbumUrls([...albumUrls, ""])}
              style={{
                width: "100%",
                padding: "1rem",
                marginTop: "0.25rem",
                border: `2px dashed ${C.gray300}`,
                borderRadius: RADIUS.lg,
                backgroundColor: C.gray50,
                color: C.navy900,
                fontSize: "0.85rem",
                fontWeight: "700",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.gray100;
                e.currentTarget.style.borderColor = C.amber;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = C.gray50;
                e.currentTarget.style.borderColor = C.gray300;
              }}
            >
              <div
                style={{
                  backgroundColor: C.white,
                  padding: "4px",
                  borderRadius: "50%",
                  boxShadow: SHADOWS.sm,
                }}
              >
                <Plus size={16} color={C.amber} />
              </div>
              Añadir otra foto al álbum
            </button>
          </div>
        </div>

        {/* ── FOOTER / GUARDAR ── */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderTop: `1px solid ${C.gray200}`,
            backgroundColor: C.gray50,
          }}
        >
          <PrimaryButton
            onClick={handleSaveWithCleanup}
            style={{
              width: "100%",
              opacity: uploadingIndex !== null ? 0.7 : 1,
              padding: "1rem",
            }}
            disabled={uploadingIndex !== null}
          >
            {uploadingIndex !== null
              ? "Procesando imágenes..."
              : "Guardar Álbum"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
