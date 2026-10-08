import React, { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Trash2,
  Images,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderPlus,
  UploadCloud,
  X,
  Star,
} from "lucide-react";
import {
  dataConnect,
  deleteGalleryAlbum,
  deleteGalleryPhoto,
  promoteGalleryPhoto,
  saveGalleryPhoto,
  swapGalleryPhotos,
} from "../../../infrastructure/dataconnect";
import { requestClubRefresh } from "../useClubScreen";
import { savedRow } from "../../../shared/saved";
import { useClub } from "../../../domains/clubs/ClubContext";
import { deleteStoredImage, isStoredImageUrl, uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import {
  C,
  RADIUS,
  SHADOWS,
  SectionCard,
  FormInput,
  PrimaryButton,
  SecondaryButton,
  FormError,
} from "../../../shared/ui";
import { formatFriendlyDate } from "../../../shared/helpers";
import { albumName as albumNameText, capitalizeFirst, isAlbumName } from "../../../shared/textLimits";
import { useModalLock } from "../../../shared/useModalLock";

interface GallerySectionProps {
  gallery: any[];
  events: any[];
  perms: any;
  setLightboxData: (data: any) => void;
}

export default function GallerySection({
  gallery,
  events,
  perms,
  setLightboxData,
}: GallerySectionProps) {
  const { clubId, storagePath } = useClub();
  const savePhoto = async (
    albumName: string,
    url: string,
    caption: string,
    takenAt: string,
  ) => {
    const existing = gallery.find(
      (photo) => (photo.albumName || "📸 Galería General") === albumName,
    );
    const saved = await saveGalleryPhoto(dataConnect, {
      albumId: existing?.albumId || crypto.randomUUID(),
      clubId,
      albumName,
      photoId: crypto.randomUUID(),
      url,
      caption,
      takenAt,
    });
    savedRow(saved.data.photo);
  };
  // ── ESTADOS DEL ÁREA DE PREPARACIÓN PRINCIPAL ──
  const [albumName, setAlbumName] = useState("");
  const [albumError, setAlbumError] = useState("");
  const [savingAlbum, setSavingAlbum] = useState(false);
  const savingAlbumRef = useRef(false);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [stagingPhotos, setStagingPhotos] = useState<
    { url: string; caption: string }[]
  >([]);

  // 👇 ESTADO PARA SUBIDA EN LA SECCIÓN PRINCIPAL 👇
  const [isUploadingMain, setIsUploadingMain] = useState(false);

  // ── ESTADOS DEL MODAL ──
  const [modalAlbumName, setModalAlbumName] = useState<string | null>(null);
  const [modalPhotosList, setModalPhotosList] = useState([
    { url: "", caption: "" },
  ]);

  // 👇 ESTADOS PARA SUBIDA Y LIMPIEZA EN EL MODAL 👇
  const [uploadingModalIndex, setUploadingModalIndex] = useState<number | null>(
    null,
  );
  const [newlyUploadedModal, setNewlyUploadedModal] = useState<string[]>([]);

  const albumsRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // LÓGICA PRINCIPAL (NUEVOS ÁLBUMES)
  // ==========================================
  const handleAddStaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.includes(" ") || newUrl.includes("\n")) {
      const links = newUrl
        .split(/[\n\s,]+/)
        .filter((l) => l.startsWith("http"));
      if (links.length > 0) {
        const multiPhotos = links.map((l) => ({
          url: l,
          caption: newCaption.trim(),
        }));
        setStagingPhotos((prev) => [...prev, ...multiPhotos]);
        setNewUrl("");
        setNewCaption("");
        return;
      }
    }
    if (!newUrl.trim()) return;
    setStagingPhotos((prev) => [
      ...prev,
      { url: newUrl.trim(), caption: newCaption.trim() },
    ]);
    setNewUrl("");
    setNewCaption("");
  };

  // 👇 NUEVO: Subir foto en la sección principal 👇
  const handleMainFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingMain(true);
      const options = {
        maxSizeMB: 0.2, // Máximo 200kb
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.8,
      };

      const url = await uploadImageFile(
        storagePath("gallery", `photo_${Date.now()}.jpg`),
        file,
        options,
      );

      // Lo agregamos automáticamente al área de "staging"
      setStagingPhotos((prev) => [
        ...prev,
        { url, caption: newCaption.trim() },
      ]);
      setNewCaption(""); // Limpiamos el texto para la siguiente
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("Error al subir la imagen.");
    } finally {
      setIsUploadingMain(false);
    }
  };

  // 👇 MODIFICADO: Si borras de la lista de preparación, se elimina de Storage 👇
  const removeStagingPhoto = async (idx: number) => {
    const photoUrl = stagingPhotos[idx].url;

    if (isStoredImageUrl(photoUrl)) {
      try {
        await deleteStoredImage(photoUrl);
      } catch (e) {
        console.error("Error al borrar foto de preparación", e);
      }
    }
    setStagingPhotos(stagingPhotos.filter((_, i) => i !== idx));
  };

  const handleSaveMainAlbum = async () => {
    if (stagingPhotos.length === 0 || savingAlbumRef.current) return;
    const typed = albumName.trim();
    const isExisting = typed !== "" && gallery.some((g) => g.albumName === typed);
    if (typed && !isExisting && !isAlbumName(typed)) {
      setAlbumError("El nombre lleva de 3 a 30 letras o números, sin símbolos.");
      return;
    }
    // Sin nombre va a la galería general; la de antes conserva su nombre con emoji
    const general = gallery.some((g) => g.albumName === "📸 Galería General")
      ? "📸 Galería General"
      : "Galería General";
    const finalAlbumName = !typed ? general : isExisting ? typed : capitalizeFirst(typed);
    savingAlbumRef.current = true;
    setSavingAlbum(true);
    setAlbumError("");
    const existingPhotos = gallery.filter(
      (g) => (g.albumName || "📸 Galería General") === finalAlbumName,
    );
    let baseTime = Date.now();
    if (existingPhotos.length > 0) {
      const oldestTime = Math.min(
        ...existingPhotos.map((p) => new Date(p.timestamp).getTime()),
      );
      baseTime = oldestTime - 1000;
    }

    let done = 0;
    try {
      for (let i = 0; i < stagingPhotos.length; i++) {
        const p = stagingPhotos[i];
        const d = new Date(baseTime - i * 1000);
        await savePhoto(finalAlbumName, p.url, p.caption, d.toISOString());
        done = i + 1;
      }
      setStagingPhotos([]);
      setAlbumName("");
    } catch (e) {
      // Las que ya se guardaron salen de la preparación para no duplicarlas al reintentar
      setStagingPhotos((prev) => prev.slice(done));
      console.error("Error al guardar el álbum", e);
      setAlbumError("No se pudo guardar el álbum. Revisa el nombre e inténtalo de nuevo.");
    } finally {
      requestClubRefresh();
      savingAlbumRef.current = false;
      setSavingAlbum(false);
    }
  };

  // ==========================================
  // LÓGICA DEL MODAL (AÑADIR A EXISTENTES)
  // ==========================================
  const handleOpenModal = (aName: string) => {
    setModalAlbumName(aName);
    setModalPhotosList([{ url: "", caption: "" }]);
    setNewlyUploadedModal([]);
  };

  // 👇 MODIFICADO: El botón cancelar del Modal borra la basura 👇
  const handleCloseModal = async () => {
    if (newlyUploadedModal.length > 0) {
      for (const url of newlyUploadedModal) {
        try {
          await deleteStoredImage(url);
        } catch (e) {
          console.error("Error borrando foto cancelada", e);
        }
      }
    }
    setNewlyUploadedModal([]);
    setModalAlbumName(null);
    setModalPhotosList([{ url: "", caption: "" }]);
  };

  useModalLock(modalAlbumName ? () => { void handleCloseModal(); } : null);

  const updateModalPhoto = (
    idx: number,
    field: "url" | "caption",
    val: string,
  ) => {
    const newList = [...modalPhotosList];
    newList[idx][field] = val;
    setModalPhotosList(newList);
  };

  // 👇 MODIFICADO: Si borra una fila del modal, limpia Storage 👇
  const removeModalPhotoRow = async (idx: number) => {
    const photoUrl = modalPhotosList[idx].url;
    if (photoUrl && newlyUploadedModal.includes(photoUrl)) {
      try {
        await deleteStoredImage(photoUrl);
        setNewlyUploadedModal((prev) => prev.filter((u) => u !== photoUrl));
      } catch (e) {}
    }
    setModalPhotosList(modalPhotosList.filter((_, i) => i !== idx));
  };

  // 👇 NUEVO: Subir foto dentro del modal 👇
  const handleModalFileUpload = async (index: number, file: File) => {
    if (!file) return;
    try {
      setUploadingModalIndex(index);

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const url = await uploadImageFile(
        storagePath("gallery", `photo_${Date.now()}.jpg`),
        file,
        options,
      );

      updateModalPhoto(index, "url", url);
      setNewlyUploadedModal((prev) => [...prev, url]); // La rastreamos como basura potencial
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("Error al subir la imagen.");
    } finally {
      setUploadingModalIndex(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAlbumName) return;

    const validPhotos = modalPhotosList.filter((p) => p.url.trim() !== "");
    if (validPhotos.length === 0) return;

    const existingPhotos = gallery.filter(
      (g) => (g.albumName || "📸 Galería General") === modalAlbumName,
    );
    let baseTime = Date.now();
    if (existingPhotos.length > 0) {
      const oldestTime = Math.min(
        ...existingPhotos.map((p) => new Date(p.timestamp).getTime()),
      );
      baseTime = oldestTime - 1000;
    }

    try {
      for (let i = 0; i < validPhotos.length; i++) {
        const p = validPhotos[i];
        const d = new Date(baseTime - i * 1000);
        await savePhoto(modalAlbumName, p.url.trim(), p.caption.trim(), d.toISOString());
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar.");
      return;
    }
    requestClubRefresh();

    // Como sí guardó, vaciamos el rastreador para que NO las borre al cerrar
    setNewlyUploadedModal([]);

    setModalAlbumName(null);
    setModalPhotosList([{ url: "", caption: "" }]);
  };

  // ==========================================
  // REORDENAMIENTO Y EDICIÓN DE FOTOS
  // ==========================================
  // 👇 MODIFICADO: Ahora si borras la foto de la app, también se borra de Storage 👇
  const handleDeletePhoto = async (
    collectionName: string,
    id: string,
    photoUrl?: string,
  ) => {
    if (
      window.confirm("¿Seguro que deseas eliminar esta foto de la galería?")
    ) {
      const removed = await deleteGalleryPhoto(dataConnect, { clubId, photoId: id });
      savedRow(removed.data.deleted);
      requestClubRefresh();

      // Borrar de Storage si es un archivo nuestro
      if (photoUrl && isStoredImageUrl(photoUrl)) {
        try {
          await deleteStoredImage(photoUrl);
        } catch (e) {
          console.error("Error borrando foto física", e);
        }
      }
    }
  };

  // 👇 MODIFICADO: Al borrar un álbum, aniquila todas las fotos de Storage 👇
  const handleDeleteAlbum = async (aName: string, photos: any[]) => {
    if (
      window.confirm(
        `¿Seguro que deseas eliminar el álbum "${aName}" y TODAS sus fotos (${photos.length})? Esta acción no se puede deshacer.`,
      )
    ) {
      const removed = await deleteGalleryAlbum(dataConnect, { clubId, albumName: aName });
      savedRow(removed.data.deleted);
      requestClubRefresh();
      await Promise.all(
        photos.map(async (p) => {
          if (isStoredImageUrl(p.url)) {
            try {
              await deleteStoredImage(p.url);
            } catch (e) {}
          }
        }),
      );
    }
  };

  const handleMovePhoto = async (
    photos: any[],
    index: number,
    direction: "left" | "right",
  ) => {
    if (direction === "left" && index > 0) {
      const current = photos[index];
      const previous = photos[index - 1];
      const swapped = await swapGalleryPhotos(dataConnect, {
        clubId,
        firstId: current.id,
        secondId: previous.id,
      });
      savedRow(swapped.data.swapped);
      requestClubRefresh();
    } else if (direction === "right" && index < photos.length - 1) {
      const current = photos[index];
      const next = photos[index + 1];
      const swapped = await swapGalleryPhotos(dataConnect, {
        clubId,
        firstId: current.id,
        secondId: next.id,
      });
      savedRow(swapped.data.swapped);
      requestClubRefresh();
    }
  };

  const handleMakeCover = async (photos: any[], index: number) => {
    if (index === 0) return;
    const saved = await promoteGalleryPhoto(dataConnect, { clubId, photoId: photos[index].id });
    savedRow(saved.data.photo);
    requestClubRefresh();
  };

  const scrollAlbums = (direction: "left" | "right") => {
    if (albumsRef.current) {
      albumsRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  // ── LÓGICA DE ÁLBUMES TIPO HIGHLIGHTS ──
  const groupedAlbums = useMemo(() => {
    const albums: any[] = [];
    const eventsWithPhotos = events.filter(
      (e: any) => (e.photoUrls && e.photoUrls.length > 0) || e.photoUrl,
    );

    eventsWithPhotos.forEach((e: any) => {
      const urls =
        e.photoUrls && e.photoUrls.length > 0 ? e.photoUrls : [e.photoUrl];
      const eventTime = e.eventTime || "00:00";
      const timestampMs = new Date(`${e.eventDate}T${eventTime}`).getTime();

      albums.push({
        id: e.id,
        title: `${e.eventType === "Partido" ? "🏆" : "🎯"} ${e.title}`,
        date: formatFriendlyDate(e.eventDate),
        timestampMs,
        photos: urls.map((url: string) => ({ id: url, url, caption: "" })),
      });
    });

    if (gallery && gallery.length > 0) {
      const manualAlbumsMap: Record<string, any[]> = {};
      gallery.forEach((g: any) => {
        const aName = g.albumName || "📸 Galería General";
        if (!manualAlbumsMap[aName]) manualAlbumsMap[aName] = [];
        manualAlbumsMap[aName].push(g);
      });

      Object.entries(manualAlbumsMap).forEach(([name, photos]) => {
        const sortedPhotos = photos.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        const timestampMs = new Date(sortedPhotos[0].timestamp).getTime();
        const friendlyDate = formatFriendlyDate(
          new Date(sortedPhotos[0].timestamp).toISOString().split("T")[0],
        );

        albums.push({
          id: `manual-album-${name}`,
          title: name,
          date: friendlyDate,
          timestampMs,
          photos: sortedPhotos.map((g: any) => ({
            id: g.id,
            url: g.url,
            caption: g.caption,
            timestamp: g.timestamp,
          })),
        });
      });
    }

    return albums.sort((a, b) => b.timestampMs - a.timestampMs);
  }, [gallery, events]);

  const existingAlbumNames = useMemo(() => {
    const names = new Set<string>();
    gallery.forEach((g) => {
      if (g.albumName && g.albumName !== "📸 Galería General")
        names.add(g.albumName);
    });
    return Array.from(names);
  }, [gallery]);

  // ==========================================
  // RENDER DEL MODAL DE ADICIÓN
  // ==========================================
  const renderAppendModal = () => {
    if (!modalAlbumName) return null;

    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(10, 25, 41, 0.90)",
          zIndex: 99999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
        }}
        onClick={handleCloseModal} // 👈 Click fuera limpia huérfanos
      >
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: RADIUS.xl,
            padding: "2rem",
            width: "100%",
            maxWidth: "550px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: SHADOWS.xl,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "800",
                color: C.navy900,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FolderPlus size={20} color={C.blueAccent} /> Añadir fotos a:{" "}
              {modalAlbumName}
            </h3>
            <button
              onClick={handleCloseModal} // 👈 Click aquí limpia huérfanos
              style={{
                background: "none",
                border: "none",
                color: C.gray400,
                cursor: "pointer",
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={handleModalSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {modalPhotosList.map((photo, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    padding: "1rem",
                    backgroundColor: C.gray50,
                    border: `1px solid ${C.gray200}`,
                    borderRadius: RADIUS.md,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "48px",
                        backgroundColor: C.white,
                        borderRadius: RADIUS.sm,
                        color: C.gray300,
                        marginTop: "0.2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: `1px solid ${C.gray200}`,
                      }}
                    >
                      <Camera
                        size={20}
                        style={{ position: "absolute", zIndex: 0 }}
                      />
                      {photo.url && (
                        <img
                          src={photo.url}
                          alt="Vista previa"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            position: "relative",
                            zIndex: 1,
                            backgroundColor: C.white,
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          onLoad={(e) => {
                            e.currentTarget.style.display = "block";
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
                      {/* 👇 MODIFICADO: Input + Botón Subir en el Modal 👇 */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.4rem",
                        }}
                      >
                        <input
                          type="url"
                          placeholder="Link de la imagen (O sube una abajo 👇)"
                          value={photo.url}
                          onChange={(e) =>
                            updateModalPhoto(idx, "url", e.target.value)
                          }
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            fontSize: "0.8125rem",
                            color: C.navy900,
                            backgroundColor: "transparent",
                          }}
                          required={idx === 0 && !photo.url}
                        />
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            color: C.amber,
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            width: "fit-content",
                          }}
                        >
                          <UploadCloud size={14} />
                          {uploadingModalIndex === idx
                            ? "Subiendo foto..."
                            : "Subir foto del dispositivo"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingModalIndex !== null}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleModalFileUpload(idx, e.target.files[0]);
                              }
                            }}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>

                      <div
                        style={{
                          borderTop: `1px dashed ${C.gray300}`,
                          width: "100%",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Descripción (Opcional)"
                        value={photo.caption}
                        onChange={(e) =>
                          updateModalPhoto(idx, "caption", e.target.value)
                        }
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          fontSize: "0.75rem",
                          color: C.gray500,
                          backgroundColor: "transparent",
                        }}
                      />
                    </div>

                    {modalPhotosList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModalPhotoRow(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.red,
                          cursor: "pointer",
                          padding: "0.5rem",
                          marginTop: "0.2rem",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setModalPhotosList([
                  ...modalPhotosList,
                  { url: "", caption: "" },
                ])
              }
              style={{
                background: "none",
                border: `1px dashed ${C.gray300}`,
                borderRadius: RADIUS.md,
                padding: "0.75rem",
                color: C.gray600,
                fontWeight: "600",
                fontSize: "0.8125rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                gap: "0.4rem",
                alignItems: "center",
              }}
            >
              <Plus size={16} /> Añadir otra foto a este álbum
            </button>

            <PrimaryButton
              type="submit"
              disabled={uploadingModalIndex !== null}
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.4rem",
                alignItems: "center",
                marginTop: "0.5rem",
                opacity: uploadingModalIndex !== null ? 0.7 : 1,
              }}
            >
              <UploadCloud size={18} />{" "}
              {uploadingModalIndex !== null ? "Procesando..." : "Guardar Fotos"}
            </PrimaryButton>
          </form>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div>
      {renderAppendModal()}

      {/* ADMIN GALERÍA (Creación de Nuevos Álbumes) */}
      {perms.canEditPortada && (
        <SectionCard
          className="compact-form-card"
          title="Crear Nuevo Álbum"
          icon={<Camera size={14} color={C.navy600} />}
          style={{
            border: `2px dashed ${C.navy200}`,
            backgroundColor: C.navy50,
            marginBottom: "1.25rem",
          }}
        >
          <form
            onSubmit={handleAddStaging}
            className="compact-form"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <datalist id="album-names">
              {existingAlbumNames.map((name, idx) => (
                <option key={idx} value={name} />
              ))}
            </datalist>

            <FormInput
              type="text"
              list="album-names"
              value={albumName}
              maxLength={30}
              aria-invalid={albumError ? true : undefined}
              onChange={(e) => {
                const v = e.target.value;
                // Un álbum que ya existe se elige tal cual aunque su nombre sea de antes de la regla
                setAlbumName(existingAlbumNames.includes(v) ? v : albumNameText(v));
                setAlbumError("");
              }}
              placeholder="Nombre del álbum (Ej. Convivio 2026)"
            />
            <FormError>{albumError}</FormError>

            <div
              style={{
                backgroundColor: C.white,
                padding: "0.6rem",
                borderRadius: RADIUS.md,
                border: `1px solid ${C.gray200}`,
              }}
            >
              <p
                style={{
                  margin: "0 0 0.35rem 0",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: C.navy900,
                }}
              >
                Añadir foto
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <FormInput
                  type="text"
                  placeholder="Pega un link de imagen"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: C.amber,
                    fontSize: "0.68rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    width: "fit-content",
                  }}
                >
                  <UploadCloud size={13} />
                  {isUploadingMain
                    ? "Comprimiendo y subiendo foto..."
                    : "O súbela desde tu dispositivo"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingMain}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleMainFileUpload(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </label>

                <div className="album-add-row">
                  <FormInput
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                  />
                  <SecondaryButton
                    type="submit"
                    disabled={!newUrl.trim() || isUploadingMain}
                    style={{
                      whiteSpace: "nowrap",
                      padding: "0.38rem 0.55rem",
                      fontSize: "0.7rem",
                    }}
                  >
                    <Plus size={13} /> Añadir
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </form>

          <div
            style={{
              marginTop: "0.55rem",
              padding: stagingPhotos.length > 0 ? "0.55rem" : "0.4rem 0.55rem",
              backgroundColor:
                stagingPhotos.length > 0 ? C.white : "transparent",
              border:
                stagingPhotos.length > 0
                  ? `2px solid ${C.amber}`
                  : `1px dashed ${C.gray300}`,
              borderRadius: RADIUS.md,
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: stagingPhotos.length > 0 ? "0.45rem" : 0,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: stagingPhotos.length > 0 ? C.navy900 : C.gray400,
                }}
              >
                {stagingPhotos.length > 0
                  ? `Fotos listas (${stagingPhotos.length})`
                  : "Vista previa"}
              </h4>
            </div>

            {stagingPhotos.length > 0 && (
              <>
                <div
                  className="hide-scroll"
                  style={{
                    display: "flex",
                    gap: "0.45rem",
                    overflowX: "auto",
                    paddingBottom: "0.4rem",
                  }}
                >
                  {stagingPhotos.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        flexShrink: 0,
                        width: "64px",
                        height: "64px",
                        borderRadius: RADIUS.md,
                        overflow: "hidden",
                        boxShadow: SHADOWS.sm,
                        border: `2px solid ${idx === 0 ? C.amber : C.gray200}`,
                      }}
                    >
                      {idx === 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: "rgba(245, 158, 11, 0.9)",
                            color: C.white,
                            fontSize: "0.55rem",
                            fontWeight: "800",
                            textAlign: "center",
                            padding: "2px 0",
                            zIndex: 10,
                          }}
                        >
                          PORTADA
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: C.gray50,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 0,
                        }}
                      >
                        <Camera size={20} color={C.gray300} />
                      </div>
                      <img
                        src={p.url}
                        style={{
                          position: "relative",
                          zIndex: 1,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = "block";
                        }}
                      />
                      <button
                        onClick={() => removeStagingPhoto(idx)}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background: "rgba(255,255,255,0.9)",
                          color: C.red,
                          border: "none",
                          padding: "4px",
                          borderBottomLeftRadius: RADIUS.sm,
                          cursor: "pointer",
                          zIndex: 10,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <PrimaryButton
                  type="button"
                  onClick={handleSaveMainAlbum}
                  disabled={savingAlbum}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.3rem",
                    alignItems: "center",
                    marginTop: "0.35rem",
                    padding: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <UploadCloud size={14} />{" "}
                  {savingAlbum ? "Guardando…" : `Guardar Álbum (${stagingPhotos.length})`}
                </PrimaryButton>
              </>
            )}
          </div>

          {/* ── SECCIÓN DE GESTIÓN DE ÁLBUMES EXISTENTES (CON REORDENAMIENTO) ── */}
          {groupedAlbums.some((a) => a.id.startsWith("manual")) && (
            <div
              style={{
                marginTop: "2rem",
                borderTop: `1px solid ${C.gray200}`,
                paddingTop: "1rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: C.gray600,
                  margin: "0 0 1rem 0",
                }}
              >
                Gestión de álbumes existentes:
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {groupedAlbums
                  .filter((a) => a.id.startsWith("manual"))
                  .map((album) => (
                    <div
                      key={album.id}
                      style={{
                        backgroundColor: C.white,
                        padding: "0.75rem",
                        borderRadius: RADIUS.md,
                        border: `1px solid ${C.gray200}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8125rem",
                            fontWeight: "800",
                            color: C.navy900,
                          }}
                        >
                          {album.title}
                        </p>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(album.title)}
                            style={{
                              background: "none",
                              border: "none",
                              color: C.amber,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              fontSize: "0.7rem",
                              fontWeight: "700",
                            }}
                          >
                            <Plus size={14} /> Añadir
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAlbum(album.title, album.photos)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: C.red,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              fontSize: "0.7rem",
                              fontWeight: "700",
                            }}
                          >
                            <Trash2 size={14} /> Borrar Álbum
                          </button>
                        </div>
                      </div>

                      <div
                        className="hide-scroll"
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          overflowX: "auto",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        {album.photos.map((g: any, idx: number) => (
                          <div
                            key={g.id}
                            style={{
                              position: "relative",
                              width: "80px",
                              height: "80px",
                              flexShrink: 0,
                              borderRadius: RADIUS.sm,
                              overflow: "hidden",
                              border:
                                idx === 0
                                  ? `2px solid ${C.amber}`
                                  : `1px solid ${C.gray200}`,
                            }}
                          >
                            {/* Insignia de Portada */}
                            {idx === 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  backgroundColor: "rgba(245, 158, 11, 0.9)",
                                  color: C.white,
                                  fontSize: "0.55rem",
                                  fontWeight: "800",
                                  textAlign: "center",
                                  padding: "2px 0",
                                  zIndex: 10,
                                }}
                              >
                                PORTADA
                              </div>
                            )}

                            <img
                              src={g.url}
                              loading="lazy"
                              decoding="async"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />

                            {/* Botón Borrar */}
                            <button
                              onClick={() =>
                                handleDeletePhoto("gallery", g.id, g.url)
                              }
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: "rgba(255,255,255,0.9)",
                                color: C.red,
                                border: "none",
                                padding: "4px",
                                borderBottomLeftRadius: RADIUS.sm,
                                cursor: "pointer",
                                zIndex: 10,
                              }}
                              title="Eliminar foto"
                            >
                              <Trash2 size={12} />
                            </button>

                            {/* Botón Hacer Portada (Estrella) */}
                            {idx !== 0 && (
                              <button
                                onClick={() =>
                                  handleMakeCover(album.photos, idx)
                                }
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  background: "rgba(255,255,255,0.9)",
                                  color: C.amber,
                                  border: "none",
                                  padding: "4px",
                                  borderBottomRightRadius: RADIUS.sm,
                                  cursor: "pointer",
                                  zIndex: 10,
                                }}
                                title="Hacer Portada"
                              >
                                <Star size={12} fill={C.amber} />
                              </button>
                            )}

                            {/* Botones de Mover < > */}
                            {idx > 0 && (
                              <button
                                onClick={() =>
                                  handleMovePhoto(album.photos, idx, "left")
                                }
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: 0,
                                  transform: "translateY(-50%)",
                                  background: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  border: "none",
                                  padding: "2px",
                                  cursor: "pointer",
                                  zIndex: 10,
                                }}
                              >
                                <ChevronLeft size={16} />
                              </button>
                            )}
                            {idx < album.photos.length - 1 && (
                              <button
                                onClick={() =>
                                  handleMovePhoto(album.photos, idx, "right")
                                }
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  right: 0,
                                  transform: "translateY(-50%)",
                                  background: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  border: "none",
                                  padding: "2px",
                                  cursor: "pointer",
                                  zIndex: 10,
                                }}
                              >
                                <ChevronRight size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* GALERÍA GLOBAL (ÁLBUMES HIGHLIGHTS) */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "800",
              color: C.navy900,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              margin: 0,
            }}
          >
            <Images size={20} color={C.navy600} /> Álbumes del Equipo
          </h3>
          {groupedAlbums.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => scrollAlbums("left")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: `1px solid ${C.gray200}`,
                  backgroundColor: C.white,
                  cursor: "pointer",
                  color: C.navy700,
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollAlbums("right")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: `1px solid ${C.gray200}`,
                  backgroundColor: C.white,
                  cursor: "pointer",
                  color: C.navy700,
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {groupedAlbums.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: C.gray400,
              fontStyle: "italic",
              padding: "2rem 0",
            }}
          >
            Aún no hay álbumes registrados.
          </p>
        ) : (
          <div
            ref={albumsRef}
            className="hide-scroll"
            style={{
              display: "flex",
              overflowX: "auto",
              gap: "1rem",
              paddingBottom: "1rem",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
            }}
          >
            {groupedAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() =>
                  setLightboxData({
                    urls: album.photos.map((p: any) => p.url),
                    initialIndex: 0,
                    caption: album.title,
                  })
                }
                style={{
                  flex: "0 0 auto",
                  width: "220px",
                  height: "300px",
                  borderRadius: RADIUS.lg,
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: SHADOWS.md,
                  scrollSnapAlign: "start",
                  border: `1px solid ${C.gray200}`,
                }}
              >
                <img
                  src={album.photos[0].url}
                  alt={album.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(10,25,41,0.95) 0%, rgba(10,25,41,0) 60%)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    color: C.white,
                    padding: "0.3rem 0.6rem",
                    borderRadius: RADIUS.full,
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Images size={14} /> {album.photos.length}
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "1rem",
                    left: "1rem",
                    right: "1rem",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.3rem 0",
                      color: C.white,
                      fontSize: "1rem",
                      fontWeight: "800",
                      lineHeight: "1.2",
                      textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {album.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: C.gray300,
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    {album.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
