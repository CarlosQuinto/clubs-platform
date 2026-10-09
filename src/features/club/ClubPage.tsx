import { Link, useParams } from "react-router-dom";
import { Shield, Edit2, LogIn, ArrowLeft, AlertTriangle } from "lucide-react";
import { useClubModel, ClubModelProvider, requestClubRefresh } from "./useClubScreen";
import StatsScopeBar from "./StatsScopeBar";
import AvailabilityPanel from "./AvailabilityPanel";
import { useAuth } from "../../domains/auth/AuthContext";
import { ClubProvider } from "../../domains/clubs/ClubContext";
import { normalizeSlug } from "../../shared/paths";
import { DEFAULT_CLUB_NAME, DEFAULT_CLUB_LOGO } from "../../domains/clubs/clubDefaults";
import { C, SHADOWS, SectionCard } from "../../shared/ui";
import Home from "./home/Home";
import Agenda from "./agenda/Agenda";
import Players from "./players/Players";
import Finances from "./finances/Finances";
import Inventory from "./inventory/Inventory";
import { MembersPanel } from "./MembersModal";
import EditClubModal from "./EditClubModal";
import AdSlot from "../shell/AdSlot";
import SpaceSwitcher from "../shell/SpaceSwitcher";
import PlatformLayout from "../shell/PlatformLayout";
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
    navContainerRef,
    sliderRef,
    editingClub,
    setEditingClub,
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

  // Lo que el club pone en la cabecera de la plataforma: escudo y nombre al centro.
  const topbarCenter = (
    <div className="club-topbar">
      <div className="club-topbar__logo">
        <div className="club-topbar__crest">
          <img src={clubInfo?.logoUrl || DEFAULT_CLUB_LOGO} alt="Escudo del Club" />
        </div>
        {perms.isAdmin && (
          <button
            type="button"
            className="club-topbar__edit"
            onClick={() => setEditingClub(true)}
            title="Editar información del club"
            aria-label="Editar información del club"
          >
            <Edit2 size={10} strokeWidth={3} />
          </button>
        )}
      </div>
      <h1 className="club-topbar__name">{clubInfo?.name || DEFAULT_CLUB_NAME}</h1>
    </div>
  );

  // A la derecha: menú del superadmin y selector de espacios, o «Entrar» sin sesión.
  const topbarActions = (
    <div className="club-topbar__actions">
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
        <button
          type="button"
          className="platform-auth-btn is-in platform-topbar__login club-topbar__login"
          onClick={goToLogin}
          aria-label="Entrar"
          title="Entrar"
        >
          <LogIn size={14} /> <span className="club-topbar__login-label">Entrar</span>
        </button>
      )}
    </div>
  );

  return (
    <PlatformLayout flush topbarCenter={topbarCenter} topbarActions={topbarActions}>

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
      {editingClub && clubInfo ? (
        <EditClubModal club={clubInfo} onClose={() => setEditingClub(false)} onSaved={requestClubRefresh} />
      ) : null}

      {/* ── NAVIGATION (SWIPEABLE & AUTO-CENTERED TABS) ── */}
      <nav
        className="club-tabs"
        style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.gray200}`,
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
      <div
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
      </div>
    </PlatformLayout>
  );
}
