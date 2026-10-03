import React, { useState, useEffect, useRef } from "react";
import {
  Edit,
  MapPin,
  Users,
  Plus,
  Trash2,
  Camera,
  UploadCloud,
  Link as LinkIcon,
  LayoutTemplate,
} from "lucide-react";
import {
  clearClubHeroes,
  dataConnect,
  insertClubHeroes,
  saveClubPortada,
} from "../../../infrastructure/dataconnect";
import { requestClubRefresh } from "../useClubScreen";
import { useClub } from "../../../domains/clubs/ClubContext";
import { deleteStoredImage, uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import {
  DEFAULT_CLUB_NAME,
  DEFAULT_CLUB_LOCATION,
  DEFAULT_HERO_IMAGE,
} from "../../../domains/clubs/clubDefaults";
import {
  C,
  RADIUS,
  SHADOWS,
  FormInput,
  FormTextarea,
  PrimaryButton,
  SecondaryButton,
} from "../../../shared/ui";

interface HeroSectionProps {
  clubInfo: any;
  players: any[];
  perms: any;
  setLightboxData: (data: any) => void;
}

export default function HeroSection({
  clubInfo,
  players,
  perms,
  setLightboxData,
}: HeroSectionProps) {
  const { storagePath } = useClub();
  const [isEditingClubInfo, setIsEditingClubInfo] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editClubName, setEditClubName] = useState(clubInfo.name || "");
  const [editClubDesc, setEditClubDesc] = useState(clubInfo.description || "");

  const [editLocation, setEditLocation] = useState(
    clubInfo.location || DEFAULT_CLUB_LOCATION,
  );

  const [editHeroImages, setEditHeroImages] = useState<string[]>(
    clubInfo.heroImages?.length > 0 ? clubInfo.heroImages : [""],
  );

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [newlyUploadedImages, setNewlyUploadedImages] = useState<string[]>([]);

  const heroTouchStartX = useRef<number | null>(null);
  const heroTouchEndX = useRef<number | null>(null);

  const activePlayersCount = players
    ? players.filter((p: any) => p.active !== false).length
    : 0;

  // Auto-slide del carrusel
  useEffect(() => {
    if (
      !clubInfo.heroImages ||
      clubInfo.heroImages.length <= 1 ||
      isEditingClubInfo
    )
      return;
    const timer = setTimeout(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % clubInfo.heroImages.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [clubInfo.heroImages, isEditingClubInfo, currentHeroIndex]);

  // Gestos táctiles
  const handleHeroTouchStart = (e: React.TouchEvent) => {
    heroTouchEndX.current = null;
    heroTouchStartX.current = e.targetTouches[0].clientX;
  };
  const handleHeroTouchMove = (e: React.TouchEvent) => {
    heroTouchEndX.current = e.targetTouches[0].clientX;
  };
  const handleHeroTouchEnd = () => {
    if (
      heroTouchStartX.current === null ||
      heroTouchEndX.current === null ||
      !clubInfo.heroImages
    )
      return;
    const distance = heroTouchStartX.current - heroTouchEndX.current;
    if (distance > 50)
      setCurrentHeroIndex((prev) => (prev + 1) % clubInfo.heroImages.length);
    else if (distance < -50)
      setCurrentHeroIndex(
        (prev) =>
          (prev - 1 + clubInfo.heroImages.length) % clubInfo.heroImages.length,
      );
  };

  const handleHeroClick = () => {
    if (heroTouchStartX.current !== null && heroTouchEndX.current !== null) {
      if (Math.abs(heroTouchStartX.current - heroTouchEndX.current) > 10)
        return;
    }
    setLightboxData({
      urls: clubInfo.heroImages,
      initialIndex: currentHeroIndex,
      caption: clubInfo.name,
    });
  };

  const handleUpdateImage = (index: number, value: string) => {
    const newImages = [...editHeroImages];
    newImages[index] = value;
    setEditHeroImages(newImages);
  };

  const handleAddImageField = () => {
    setEditHeroImages([...editHeroImages, ""]);
  };

  const handleRemoveImageField = (index: number) => {
    setEditHeroImages(editHeroImages.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    try {
      setUploadingIndex(index);

      const options = {
        maxSizeMB: 0.2, // 200 KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.8, // Calidad un poco mejor para la portada
      };

      const url = await uploadImageFile(
        storagePath("portada", `hero_${Date.now()}.jpg`),
        file,
        options,
      );

      setNewlyUploadedImages((prev) => [...prev, url]);

      const newImages = [...editHeroImages];
      newImages[index] = url;
      setEditHeroImages(newImages);
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      alert("Error al subir la imagen. Verifica tu conexión.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleCancelEdit = async () => {
    if (newlyUploadedImages.length > 0) {
      for (const urlToDelete of newlyUploadedImages) {
        try {
          await deleteStoredImage(urlToDelete);
          console.log("Archivo cancelado eliminado con éxito:", urlToDelete);
        } catch (error) {
          console.error("No se pudo eliminar el archivo cancelado:", error);
        }
      }
    }
    setNewlyUploadedImages([]);
    setIsEditingClubInfo(false);
  };

  const handleSaveClubInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");

    const validImages = editHeroImages
      .map((url) => url.trim())
      .filter((url) => url !== "");
    const images = validImages.length > 0 ? validImages : [DEFAULT_HERO_IMAGE];

    setSaving(true);
    try {
      const result = await saveClubPortada(dataConnect, {
        id: clubInfo.id,
        name: editClubName.trim().slice(0, 160),
        description: editClubDesc.trim(),
        location: editLocation.trim().slice(0, 160),
      });
      if (result.data.club == null) {
        setSaveError("No se pudo guardar la portada.");
        return;
      }
      await clearClubHeroes(dataConnect, { id: clubInfo.id });
      const heroes = await insertClubHeroes(dataConnect, { id: clubInfo.id, urls: images });
      if (heroes.data.hero == null) {
        setSaveError("No se pudo guardar la portada.");
        return;
      }

      const oldImages = clubInfo.heroImages || [];
      const allTrackedImages = [...oldImages, ...newlyUploadedImages];
      const imagesToDelete = allTrackedImages.filter((trackedUrl: string) => {
        return (
          !images.includes(trackedUrl) &&
          trackedUrl.includes("firebasestorage.googleapis.com")
        );
      });
      if (imagesToDelete.length > 0) {
        for (const urlToDelete of imagesToDelete) {
          try {
            await deleteStoredImage(urlToDelete);
          } catch (error) {
            console.error("No se pudo eliminar el archivo huérfano:", error);
          }
        }
      }

      requestClubRefresh();
      setNewlyUploadedImages([]);
      setCurrentHeroIndex(0);
      setIsEditingClubInfo(false);
    } catch (error) {
      console.error(error);
      setSaveError("No se pudo guardar la portada.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: C.white,
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        boxShadow: SHADOWS.lg,
        border: `1px solid ${C.gray200}`,
        position: "relative",
      }}
    >
      {/* ── BOTÓN FLOTANTE EDITAR (VISTA NORMAL) ── */}
      {perms.canEditPortada && !isEditingClubInfo && (
        <button
          onClick={() => {
            setEditClubName(clubInfo.name || "");
            setEditClubDesc(clubInfo.description || "");
            setEditLocation(clubInfo.location || DEFAULT_CLUB_LOCATION);
            setEditHeroImages(
              clubInfo.heroImages?.length > 0 ? clubInfo.heroImages : [""],
            );
            setNewlyUploadedImages([]);
            setIsEditingClubInfo(true);
          }}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
            border: `1px solid rgba(255,255,255,0.4)`,
            borderRadius: RADIUS.full,
            padding: "0.5rem 1rem",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            color: C.navy900,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Edit size={14} color={C.amber} /> Ajustar Portada
        </button>
      )}

      {/* ── PANEL DE EDICIÓN PREMIUM ── */}
      {isEditingClubInfo ? (
        <div className="cover-editor compact-form-card" style={{ backgroundColor: C.gray50 }}>
          <div
            className="cover-editor__head"
            style={{
              padding: "0.65rem 0.85rem",
              backgroundColor: C.white,
              borderBottom: `1px solid ${C.gray200}`,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                padding: "5px",
                borderRadius: "50%",
                display: "flex",
              }}
            >
              <LayoutTemplate size={14} color={C.amber} />
            </div>
            <h3
              style={{
                fontSize: "0.78rem",
                fontWeight: "800",
                color: C.navy900,
                margin: 0,
              }}
            >
              Editor de Portada
            </h3>
          </div>

          <form
            onSubmit={handleSaveClubInfo}
            className="compact-form cover-editor__form"
            style={{
              padding: "0.75rem 0.85rem 0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.7rem",
            }}
          >
            <div className="cover-editor-meta">
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.62rem",
                    fontWeight: "700",
                    color: C.gray500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.22rem",
                  }}
                >
                  Nombre del Club
                </label>
                <FormInput
                  type="text"
                  required
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
                  placeholder={`Ej. ${DEFAULT_CLUB_NAME}`}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.62rem",
                    fontWeight: "700",
                    color: C.gray500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.22rem",
                  }}
                >
                  Barrio / Escuela
                </label>
                <FormInput
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Ej. Col. Centro, CETIS 4"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.62rem",
                    fontWeight: "700",
                    color: C.gray500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.22rem",
                  }}
                >
                  Lema o Historia Breve
                </label>
                <FormTextarea
                  required
                  value={editClubDesc}
                  onChange={(e) => setEditClubDesc(e.target.value)}
                  placeholder="Descripción breve que motive al equipo..."
                  rows={2}
                  style={{ width: "100%" }}
                />
              </div>

            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${C.gray200}`,
                margin: "0",
              }}
            />

            {/* Bloque de Imágenes del Carrusel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.1rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    color: C.navy900,
                  }}
                >
                  Imágenes del Carrusel
                </label>
                <span style={{ fontSize: "0.65rem", color: C.gray500 }}>
                  La primera imagen es la principal.
                </span>
              </div>

              {editHeroImages.map((url, index) => {
                const isCover = index === 0;
                return (
                  <div
                    key={index}
                    className="cover-slide"
                    style={{
                      display: "flex",
                      gap: "0.55rem",
                      alignItems: "center",
                      padding: "0.5rem 0.55rem",
                      backgroundColor: C.white,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${isCover ? C.amber : C.gray200}`,
                      boxShadow: isCover
                        ? "0 2px 8px rgba(245, 158, 11, 0.1)"
                        : SHADOWS.sm,
                      position: "relative",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isCover && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          left: "0.65rem",
                          backgroundColor: C.amber,
                          color: C.navy900,
                          fontSize: "0.55rem",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "1px 6px",
                          borderRadius: RADIUS.full,
                          boxShadow: SHADOWS.sm,
                          border: `1px solid ${C.white}`,
                        }}
                      >
                        Principal
                      </div>
                    )}

                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: RADIUS.sm,
                        backgroundColor: C.gray50,
                        border: `1px solid ${C.gray200}`,
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {url.trim() ? (
                        <img
                          src={url}
                          alt={`Preview ${index}`}
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
                        <Camera size={16} color={C.gray300} />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            backgroundColor: C.gray50,
                            border: `1px solid ${C.gray200}`,
                            color: C.navy900,
                            padding: "0.22rem 0.55rem",
                            borderRadius: RADIUS.full,
                            fontSize: "0.65rem",
                            fontWeight: "700",
                            cursor:
                              uploadingIndex !== null
                                ? "not-allowed"
                                : "pointer",
                            opacity: uploadingIndex === index ? 0.6 : 1,
                          }}
                        >
                          <UploadCloud size={12} color={C.amber} />
                          {uploadingIndex === index
                            ? "Subiendo..."
                            : "Cargar"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(index, e.target.files[0]);
                              }
                            }}
                            style={{ display: "none" }}
                          />
                        </label>

                        {editHeroImages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageField(index)}
                            style={{
                              color: C.red || "#ef4444",
                              background: "rgba(239, 68, 68, 0.05)",
                              border: `1px solid rgba(239, 68, 68, 0.2)`,
                              borderRadius: RADIUS.sm,
                              cursor: "pointer",
                              padding: "3px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                            title="Eliminar foto"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          minWidth: 0,
                        }}
                      >
                        <LinkIcon size={11} color={C.gray400} />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) =>
                            handleUpdateImage(index, e.target.value)
                          }
                          placeholder="Pega URL..."
                          required={index === 0 && !url}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: "0.7rem",
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

              <button
                type="button"
                onClick={handleAddImageField}
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  border: `1px dashed ${C.gray300}`,
                  borderRadius: RADIUS.md,
                  backgroundColor: C.white,
                  color: C.navy900,
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.35rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = C.gray50;
                  e.currentTarget.style.borderColor = C.amber;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = C.white;
                  e.currentTarget.style.borderColor = C.gray300;
                }}
              >
                <Plus size={13} color={C.amber} />
                Añadir imagen
              </button>
            </div>

            {saveError ? (
              <p style={{ margin: 0, color: C.red, fontSize: "0.75rem", fontWeight: 700 }}>
                {saveError}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <SecondaryButton
                type="button"
                onClick={handleCancelEdit}
                style={{ flex: 1, padding: "0.5rem", fontSize: "0.75rem" }}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  opacity: uploadingIndex !== null ? 0.7 : 1,
                }}
                disabled={uploadingIndex !== null || saving}
              >
                {uploadingIndex !== null || saving ? "Procesando..." : "Guardar Cambios"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      ) : (
        /* ── VISTA NORMAL (CARRUSEL E INFO) ── */
        <>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              backgroundColor: C.navy900, // Fondo base oscuro
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={handleHeroClick}
            onTouchStart={handleHeroTouchStart}
            onTouchMove={handleHeroTouchMove}
            onTouchEnd={handleHeroTouchEnd}
          >
            {clubInfo.heroImages?.map((url: string, idx: number) => (
              <img
                key={idx}
                src={url}
                alt={clubInfo.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // Se cambió a cover para llenar todo el espacio como un verdadero banner
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: idx === currentHeroIndex ? 1 : 0,
                  transition: "opacity 0.8s ease-in-out, transform 5s linear", // Ligero efecto Ken Burns (si se agrega transform: scale(1.05))
                  transform:
                    idx === currentHeroIndex ? "scale(1.02)" : "scale(1)",
                }}
              />
            ))}

            {/* Gradiente Oscuro Mejorado */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "50%",
                background:
                  "linear-gradient(to top, rgba(10,25,41,0.9) 0%, rgba(10,25,41,0.4) 50%, transparent 100%)",
                pointerEvents: "none",
              }}
            />

            {/* Cápsulas del Carrusel (Estilo iOS) */}
            {clubInfo.heroImages?.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "1.25rem",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.3rem",
                  zIndex: 20,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {clubInfo.heroImages.map((_: any, idx: number) => {
                  const isActive = idx === currentHeroIndex;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentHeroIndex(idx);
                      }}
                      style={{
                        width: isActive ? "20px" : "6px", // Se expande a pastilla si está activo
                        height: "6px",
                        borderRadius: "10px",
                        backgroundColor: isActive
                          ? C.amber
                          : "rgba(255,255,255,0.4)",
                        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Textos y Etiquetas */}
          <div
            style={{
              padding: "1.75rem 1.5rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: C.white,
            }}
          >
            <h1
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.75rem",
                fontWeight: "900",
                color: C.navy900,
                letterSpacing: "-0.03em",
                lineHeight: "1.1",
              }}
            >
              {clubInfo.name}
            </h1>

            <p
              style={{
                margin: "0 0 1.25rem 0",
                color: C.gray500,
                fontSize: "0.9rem",
                lineHeight: "1.6",
                maxWidth: "320px",
                fontWeight: "500",
              }}
            >
              {clubInfo.description}
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  backgroundColor: C.gray50,
                  border: `1px solid ${C.gray200}`,
                  color: C.navy700,
                  padding: "0.35rem 0.875rem",
                  borderRadius: RADIUS.full,
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                <MapPin size={12} color={C.amber} />{" "}
                {clubInfo.location || DEFAULT_CLUB_LOCATION}
              </span>

              {activePlayersCount > 0 && (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    color: C.green,
                    padding: "0.35rem 0.875rem",
                    borderRadius: RADIUS.full,
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  <Users size={12} /> {activePlayersCount} Plantilla
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
