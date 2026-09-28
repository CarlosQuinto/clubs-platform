import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onSnapshot, query, where } from "firebase/firestore";
import { MapPin, Search, Shield, ChevronRight, Crown } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import { useAuth } from "../context/AuthContext";
import { clubsCol, localitiesCol } from "../lib/paths";
import { DEFAULT_CLUB_LOGO, PLATFORM_DESCRIPTION } from "../lib/clubDefaults";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton } from "../components/ui";

interface ClubSummary {
  id: string;
  slug: string;
  name: string;
  description?: string;
  location?: string;
  localityId?: string;
  logoUrl?: string;
}

interface Locality {
  id: string;
  name: string;
}

export default function Landing() {
  const { user, platformConfig, isSuperAdmin, claimPlatformAdmin } = useAuth();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [search, setSearch] = useState("");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const unsubClubs = onSnapshot(
      query(clubsCol(), where("active", "==", true)),
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as ClubSummary,
        );
        list.sort((a, b) => a.name.localeCompare(b.name));
        setClubs(list);
      },
      (err) => console.error("Error cargando clubes:", err),
    );
    const unsubLoc = onSnapshot(
      localitiesCol(),
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Locality,
        );
        list.sort((a, b) => a.name.localeCompare(b.name));
        setLocalities(list);
      },
      (err) => console.error("Error cargando localidades:", err),
    );
    return () => {
      unsubClubs();
      unsubLoc();
    };
  }, []);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? clubs.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            (c.location || "").toLowerCase().includes(term),
        )
      : clubs;

    const byLocality = new Map<string, ClubSummary[]>();
    for (const club of filtered) {
      const loc =
        localities.find((l) => l.id === club.localityId)?.name ||
        club.location ||
        "Sin localidad";
      if (!byLocality.has(loc)) byLocality.set(loc, []);
      byLocality.get(loc)!.push(club);
    }
    return [...byLocality.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [clubs, localities, search]);

  const platformUnclaimed = platformConfig === undefined;

  const handleClaim = async () => {
    if (
      !window.confirm(
        "Te convertirás en el super administrador de la plataforma. ¿Continuar?",
      )
    )
      return;
    try {
      setClaiming(true);
      await claimPlatformAdmin();
    } catch (err) {
      console.error(err);
      alert("No se pudo reclamar la administración. Quizá alguien ya lo hizo.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <PlatformLayout>
      <section style={{ textAlign: "center", margin: "1rem 0 2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: C.navy900,
            margin: "0 0 0.5rem",
          }}
        >
          Clubes por localidad
        </h1>
        <p style={{ color: C.gray500, margin: "0 auto 1.5rem", maxWidth: "560px" }}>
          {PLATFORM_DESCRIPTION}
        </p>
        <div style={{ position: "relative", maxWidth: "420px", margin: "0 auto" }}>
          <Search
            size={16}
            color={C.gray400}
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
          />
          <FormInput
            placeholder="Buscar club o localidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      </section>

      {platformUnclaimed && user && (
        <div
          style={{
            backgroundColor: C.amberLight,
            border: `1px solid ${C.amber}`,
            borderRadius: RADIUS.lg,
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Crown size={20} color={C.amber} />
          <div style={{ flex: 1, minWidth: "200px", fontSize: "0.85rem", color: C.gray700 }}>
            La plataforma todavía no tiene administrador. Como primer usuario,
            puedes reclamar ese rol para crear clubes.
          </div>
          <PrimaryButton onClick={handleClaim} disabled={claiming}>
            {claiming ? "Reclamando..." : "Reclamar administración"}
          </PrimaryButton>
        </div>
      )}

      {platformUnclaimed && !user && (
        <div
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.gray200}`,
            borderRadius: RADIUS.lg,
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            color: C.gray600,
          }}
        >
          Plataforma nueva sin configurar.{" "}
          <Link to="/login" style={{ color: C.navy900, fontWeight: 700 }}>
            Crea la primera cuenta
          </Link>{" "}
          para convertirte en administrador.
        </div>
      )}

      {clubs.length === 0 && !!platformConfig && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: C.gray400,
            backgroundColor: C.white,
            borderRadius: RADIUS.lg,
            border: `1px dashed ${C.gray300}`,
          }}
        >
          <Shield size={40} color={C.gray300} />
          <p style={{ margin: "0.75rem 0 0", fontWeight: 600 }}>
            Todavía no hay clubes publicados.
          </p>
          {isSuperAdmin && (
            <Link to="/admin" style={{ color: C.navy900, fontWeight: 700, fontSize: "0.85rem" }}>
              Crear el primer club →
            </Link>
          )}
        </div>
      )}

      {grouped.map(([localityName, list]) => (
        <section key={localityName} style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8rem",
              fontWeight: 800,
              color: C.gray500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 0.75rem",
            }}
          >
            <MapPin size={14} color={C.amber} /> {localityName}
            <span style={{ color: C.gray400, fontWeight: 600 }}>({list.length})</span>
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {list.map((club) => (
              <Link
                key={club.id}
                to={`/${club.slug || club.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  padding: "0.9rem 1rem",
                  backgroundColor: C.white,
                  border: `1px solid ${C.gray200}`,
                  borderRadius: RADIUS.lg,
                  boxShadow: SHADOWS.sm,
                  textDecoration: "none",
                  color: C.gray800,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = SHADOWS.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = SHADOWS.sm;
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    backgroundColor: C.navy900,
                    border: `1.5px solid ${C.amber}`,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={club.logoUrl || DEFAULT_CLUB_LOGO}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {club.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
                    /{club.slug || club.id}
                  </div>
                </div>
                <ChevronRight size={16} color={C.gray400} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </PlatformLayout>
  );
}
