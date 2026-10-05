import { Link, useParams } from "react-router-dom";
import { Shield, X, Edit2, UploadCloud, LogIn, ArrowLeft, AlertTriangle } from "lucide-react";
import { useClubModel, ClubModelProvider } from "./useClubScreen";
import StatsScopeBar from "./StatsScopeBar";
import AvailabilityPanel from "./AvailabilityPanel";
import { useAuth } from "../../domains/auth/AuthContext";
import { ClubProvider } from "../../domains/clubs/ClubContext";
import { normalizeSlug } from "../../shared/paths";
import { DEFAULT_CLUB_NAME, DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton, SecondaryButton, SectionCard } from "../../shared/ui";
import Home from "./home/Home";
import Agenda from "./agenda/Agenda";
import Players from "./players/Players";
import Finances from "./finances/Finances";
import Inventory from "./inventory/Inventory";
import { MembersPanel } from "./MembersModal";
import AdSlot from "../shell/AdSlot";
import SpaceSwitcher from "../shell/SpaceSwitcher";
import PlatformFooter from "../shell/PlatformFooter";
import { markScrollTopAfterNav } from "../shell/scrollAfterNav";
import { useClubShell } from "./useClubShell";


/** Resuelve el slug de la URL al uid del documento y monta el contexto del club. */
export default function ClubPage() {
  const { slug: raw = "" } = useParams();
  const slug = normalizeSlug(raw);
  const { user } = useAuth();
  const screen = useClubModel(slug, user?.uid || null);
  const clubId = screen.model?.clubInfo?.id || null;

  if (!slug || (screen.model && !screen.model.exists)) return <ClubNotFound slug={raw} />;
  if (!clubId) return null;

  return (
    <ClubModelProvider value={screen}>
      <ClubProvider key={clubId} clubId={clubId}>
        <ClubShell />
      </ClubProvider>
    </ClubModelProvider>
  );
}

function ClubNotFound({ slug }: { slug: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: C.gray50,
        color: C.gray800,
      }}
    >
      <Shield size={48} color={C.gray300} />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900 }}>
        Club no encontrado
      </h1>
      <p style={{ margin: 0, color: C.gray500 }}>
        No existe ningún club en <code>/{slug}</code>.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          color: C.navy900,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} /> Ir a la liga
      </Link>
    </div>
  );
}

function SectionPending() {
  return (
    <p
      style={{
        textAlign: "center",
        color: C.gray500,
        fontWeight: 600,
        padding: "3rem 1rem",
      }}
    >
      Cargando…
    </p>
  );
}

function ClubShell() {
  const {
    routeSlug,
    clubId,
    user,
    screenModel,
    role,
    activeTab,
    visited,
    hallSeen,
    albumsSeen,
    markHallSeen,
    markAlbumsSeen,
    clubInfo,
    clubExists,
    transactions,
    players,
    inventory,
    events,
    gallery,
    goals,
    ready,
    loading,
    seasons,
    categories,
    seasonName,
    categoryName,
    scope,
    setScope,
    officialEvents,
    statsEvents,
    teamRecord,
    trophies,
    scopeLabel,
    isMobile,
    isUltraSmall,
    navContainerRef,
    sliderRef,
    showEditClub,
    editClubName,
    setEditClubName,
    editClubLogo,
    setEditClubLogo,
    editClubPhone,
    setEditClubPhone,
    isUploadingLogo,
    handleOpenEditClub,
    handleLogoUpload,
    handleCancelEditClub,
    handleSaveClub,
    goToLogin,
    perms,
    roleLabel,
    hasAccess,
    navItems,
    activeIndex,
    handleTabChange,
    sectionReady,
  } = useClubShell();

  if (clubExists === false) {
    return <ClubNotFound slug={normalizeSlug(routeSlug)} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.gray50,
        color: C.gray800,
      }}
    >
      <header
        style={{
          background: `linear-gradient(135deg, ${C.navy900} 0%, #0a1120 100%)`,
          color: C.white,
          // 👇 En móviles reducimos el padding para darle más cancha al texto
          padding: isMobile ? "1rem" : "1.25rem 1.5rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: isMobile ? "0.5rem" : "1rem", // 👇 Menos hueco al centro en móviles
          }}
        >
          {/* ── IZQUIERDA: ESCUDO E INFO ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "0.5rem" : "0.875rem", // 👇 Escudo y texto más juntos en móviles
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* CONTENEDOR DEL LOGO CON LÁPIZ TIPO "BADGE" */}
            <div
              style={{ position: "relative", display: "flex", flexShrink: 0 }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "#121212",
                  border: `1.5px solid ${C.amber}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={clubInfo?.logoUrl || DEFAULT_CLUB_LOGO}
                  alt="Escudo del Club"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scale(1.5)",
                  }}
                />
              </div>

              {perms.isAdmin && (
                <button
                  onClick={handleOpenEditClub}
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-4px",
                    backgroundColor: C.navy900,
                    border: `1px solid ${C.amber}`,
                    color: C.amber,
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                    transition: "transform 0.2s ease",
                  }}
                  title="Editar información del club"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <Edit2 size={10} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* 👇 CONTENEDOR DEL TÍTULO (Restaurado a 1 sola línea) 👇 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <h1
                style={{
                  // 👇 Reducción de tamaño estricta basada en el ancho de la pantalla
                  fontSize: isUltraSmall
                    ? "0.8rem"
                    : isMobile
                      ? "0.95rem"
                      : "1.25rem",
                  fontWeight: "800",
                  margin: 0,
                  letterSpacing: "-0.02em",
                  color: C.white,
                  whiteSpace: "nowrap", // 👈 PROHIBIDO saltar a segunda línea
                  overflow: "hidden",
                  textOverflow: "clip", // 👈 Corta al ras si es necesario, sin puntos suspensivos
                }}
              >
                {clubInfo?.name || DEFAULT_CLUB_NAME}
              </h1>
            </div>
          </div>

          {/* ── DERECHA: SELECTOR DE ESPACIOS O LOGIN ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexShrink: 0,
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {user ? (
                <SpaceSwitcher
                  variant="club"
                  club={{
                    name: clubInfo?.name || DEFAULT_CLUB_NAME,
                    logoUrl: clubInfo?.logoUrl || undefined,
                    role,
                    roleLabel,
                    hasAccess,
                  }}
                />
              ) : (
                // Mismas clases que «Entrar» de la cabecera de la plataforma.
                <div className="platform-topbar__auth">
                  <button
                    type="button"
                    className="platform-auth-btn is-in"
                    onClick={goToLogin}
                  >
                    <LogIn size={14} /> Entrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {clubInfo?.active === false && (
        <div
          role="status"
          style={{
            backgroundColor: C.amberLight,
            borderBottom: `1px solid ${C.amber}`,
            padding: isMobile ? "0.75rem 1rem" : "0.9rem 1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              display: "flex",
              gap: "0.65rem",
              alignItems: "flex-start",
              fontSize: "0.85rem",
              color: C.gray700,
              lineHeight: 1.45,
            }}
          >
            <AlertTriangle size={18} color={C.amber} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
              <strong style={{ color: C.gray900 }}>Este club está deshabilitado.</strong>
              {clubInfo.disabledReason ? (
                <span style={{ overflowWrap: "anywhere" }}>Motivo: {clubInfo.disabledReason}</span>
              ) : null}
              <span>
                Si crees que es un error,{" "}
                <Link
                  to="/contacto#formulario"
                  style={{ color: C.navy900, fontWeight: 700 }}
                >
                  comunícate con la administración de la plataforma
                </Link>
                .
              </span>
            </div>
          </div>
        </div>
      )}

      <AdSlot placement="club" layout="club" />

      {/* ── MODAL EDITAR INFO DEL CLUB ── */}
      {showEditClub && (
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
          onClick={handleCancelEditClub}
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
                onClick={handleCancelEditClub}
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
              onSubmit={handleSaveClub}
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
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
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
                  value={editClubPhone}
                  onChange={(e) => setEditClubPhone(e.target.value)}
                  placeholder="Ej. 622 123 4567"
                  maxLength={29}
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
                      editClubLogo ||
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
                        cursor: isUploadingLogo ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        opacity: isUploadingLogo ? 0.6 : 1,
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <UploadCloud size={14} color={C.amber} />
                      {isUploadingLogo ? "Subiendo..." : "Cambiar Imagen"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLogoUpload(e.target.files[0]);
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
                      Recomendado: PNG o JPG (Max. 2MB)
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
                  value={editClubLogo}
                  onChange={(e) => setEditClubLogo(e.target.value)}
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
                  onClick={handleCancelEditClub}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  style={{ flex: 1, opacity: isUploadingLogo ? 0.7 : 1 }}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? "Guardando..." : "Guardar Cambios"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NAVIGATION (SWIPEABLE & AUTO-CENTERED TABS) ── */}
      <nav
        style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.gray200}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: SHADOWS.sm,
        }}
      >
        <div
          ref={navContainerRef}
          className="hide-scroll"
          style={{
            display: "flex",
            gap: "0.25rem",
            maxWidth: "800px",
            margin: "0 auto",
            justifyContent: "flex-start",
            overflowX: "auto",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            padding: "0 0.5rem",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.875rem 1rem",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.8125rem",
                backgroundColor: "transparent",
                color: activeTab === item.key ? C.navy900 : C.gray500,
                borderBottom:
                  activeTab === item.key
                    ? `2px solid ${C.navy900}`
                    : "2px solid transparent",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN CONTENT (DYNAMIC SLIDER CONTAINER) ── */}
      <main
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          overflow: "hidden",
          minHeight: "calc(100vh - 140px)",
          backgroundColor: "#f8fafc",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 2rem",
              minHeight: "50vh",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: `3px solid ${C.gray200}`,
                borderTop: `3px solid ${C.amber}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            />
            <p
              style={{
                color: C.gray500,
                fontWeight: "600",
                fontSize: "0.9rem",
                letterSpacing: "0.02em",
              }}
            >
              Sincronizando el vestuario...
            </p>
          </div>
        ) : (
          <div
            ref={sliderRef}
            style={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
              transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
              willChange: "transform",
            }}
          >
            {navItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.key}
                  className={isActive ? "club-tab-pane" : undefined}
                  style={{
                    width: "100%",
                    flexShrink: 0,
                    boxSizing: "border-box",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.4s ease",
                    visibility: isActive ? "visible" : "hidden",
                    pointerEvents: isActive ? "auto" : "none",
                    height: isActive ? "auto" : "0px",
                    overflow: "hidden",
                  }}
                >
                  {item.key === "inicio" &&
                    (sectionReady("inicio") ? (
                    <Home
                      clubInfo={clubInfo}
                      players={players}
                      events={statsEvents}
                      clubEvents={events}
                      gallery={gallery}
                      eventsReady={ready.events}
                      galleryReady={ready.gallery}
                      hallSeen={hallSeen}
                      albumsSeen={albumsSeen}
                      onHallSeen={markHallSeen}
                      onAlbumsSeen={markAlbumsSeen}
                      perms={perms}
                      teamRecord={teamRecord}
                      scopeLabel={scopeLabel}
                      trophies={trophies}
                      seasonName={seasonName}
                      categoryName={categoryName}
                      scope={scope}
                      onScopeChange={setScope}
                      seasons={seasons}
                      categories={categories}
                    />
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "agenda" &&
                    visited.agenda &&
                    (sectionReady("agenda") ? (
                    <>
                    {perms.canEditAgenda && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <AvailabilityPanel clubId={clubId} windows={screenModel?.windows || []} />
                      </div>
                    )}
                    <Agenda
                      events={events}
                      officialEvents={officialEvents}
                      players={players}
                      clubInfo={clubInfo}
                      perms={perms}
                    />
                    </>
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "jugadores" && visited.jugadores && (
                    sectionReady("jugadores") ? (
                    <>
                    <StatsScopeBar
                      scope={scope}
                      onChange={setScope}
                      seasons={seasons}
                      categories={categories}
                    />
                    <Players
                      players={players}
                      events={statsEvents}
                      perms={perms}
                      goals={goals}
                    />
                    </>
                    ) : (
                      <SectionPending />
                    )
                  )}
                  {item.key === "finanzas" &&
                    visited.finanzas &&
                    (sectionReady("finanzas") ? (
                    <Finances
                      transactions={transactions as any}
                      players={players as any}
                      goals={goals as any}
                      perms={perms}
                    />
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "inventario" &&
                    visited.inventario &&
                    (sectionReady("inventario") ? (
                    <Inventory inventory={inventory} perms={perms} />
                    ) : (
                      <SectionPending />
                    ))}
                  {item.key === "administradores" && visited.administradores && (
                    <SectionCard className="compact-form">
                      <MembersPanel clubName={clubInfo?.name || DEFAULT_CLUB_NAME} />
                    </SectionCard>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Los destinos del pie son páginas de plataforma: llegan arriba, salvo los formularios. */}
      <PlatformFooter
        onLinkClick={(to) => {
          if (!to.includes("#")) markScrollTopAfterNav();
        }}
      />
    </div>
  );
}
