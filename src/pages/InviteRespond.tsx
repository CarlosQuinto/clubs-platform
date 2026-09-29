import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Shield, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PlatformLayout from "../components/platform/PlatformLayout";
import {
  C,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SHADOWS,
} from "../components/ui";
import { getClubInvite, respondClubInvite } from "../lib/clubInvite";
import { ROLE_LABELS, type Role } from "../lib/roles";

export default function InviteRespond() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const clubId = params.get("c") || "";
  const emailKey = params.get("e") || "";
  const token = params.get("t") || "";
  const autoDecline = params.get("accion") === "rechazar";

  const [info, setInfo] = useState<{
    clubName: string;
    email: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"accept" | "decline" | null>(null);
  const autoDeclineStarted = useRef(false);

  useEffect(() => {
    if (!clubId || !emailKey || !token) {
      setError("Esta invitación no es válida.");
      return;
    }
    let cancelled = false;
    void getClubInvite({ clubId, emailKey, token })
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setError("La invitación no es válida o ya no está pendiente.");
      });
    return () => {
      cancelled = true;
    };
  }, [clubId, emailKey, token]);

  useEffect(() => {
    if (!autoDecline || !info || done || busy || autoDeclineStarted.current) return;
    autoDeclineStarted.current = true;
    void handleRespond("decline");
    // handleRespond is stable enough for this one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDecline, info]);

  const handleRespond = async (action: "accept" | "decline") => {
    setError("");
    setBusy(true);
    try {
      await respondClubInvite({ clubId, emailKey, token, action });
      setDone(action);
      if (action === "accept") {
        window.setTimeout(() => navigate(`/${clubId}`, { replace: true }), 900);
      }
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      if (code.includes("unauthenticated")) {
        navigate(
          `/login?next=${encodeURIComponent(`/invitar?c=${clubId}&e=${emailKey}&t=${token}`)}`,
          { replace: true },
        );
        return;
      }
      if (code.includes("permission-denied")) {
        setError(
          `Entra con ${info?.email || "el correo invitado"} para aceptar.`,
        );
        return;
      }
      setError("No se pudo completar la acción. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const roleName = info ? ROLE_LABELS[info.role as Role] || info.role : "";
  const sameEmail =
    !!user?.email && !!info?.email && user.email.toLowerCase() === info.email.toLowerCase();

  return (
    <PlatformLayout maxWidth="480px">
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          padding: "2rem",
          boxShadow: SHADOWS.lg,
          border: `1px solid ${C.gray200}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {done === "decline" ? (
            <X size={26} color={C.red} />
          ) : (
            <Shield size={26} color={C.amber} />
          )}
        </div>
        <h1
          style={{
            margin: "0 0 0.4rem",
            fontSize: "1.3rem",
            fontWeight: 900,
            color: C.navy900,
          }}
        >
          {done === "accept"
            ? "Rol aceptado"
            : done === "decline"
              ? "Invitación rechazada"
              : "Invitación al club"}
        </h1>
        {info && !done && (
          <p style={{ margin: "0 0 1.25rem", color: C.gray500, fontSize: "0.88rem", lineHeight: 1.45 }}>
            Te invitaron a <strong style={{ color: C.navy900 }}>{info.clubName}</strong> como{" "}
            <strong style={{ color: C.navy900 }}>{roleName}</strong>.
          </p>
        )}
        {done === "accept" && (
          <p style={{ margin: 0, color: C.gray500, fontSize: "0.88rem" }}>
            Entrando a {info?.clubName || "el club"}…
          </p>
        )}
        {done === "decline" && (
          <p style={{ margin: 0, color: C.gray500, fontSize: "0.88rem" }}>
            No se te asignó el rol.
          </p>
        )}
        {!info && !error && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.88rem" }}>
            Cargando invitación…
          </p>
        )}
        {error && (
          <p style={{ margin: "0 0 1rem", color: C.red, fontSize: "0.85rem" }}>{error}</p>
        )}

        {info && !done && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {!user && !authLoading && (
              <PrimaryButton
                type="button"
                style={{ width: "100%", padding: "0.8rem" }}
                onClick={() =>
                  navigate(
                    `/login?next=${encodeURIComponent(`/invitar?c=${clubId}&e=${emailKey}&t=${token}`)}`,
                  )
                }
              >
                Iniciar sesión para aceptar
              </PrimaryButton>
            )}
            {user && !sameEmail && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
                Estás en {user.email}. Entra con {info.email} para aceptar.
              </p>
            )}
            {(!user || sameEmail) && (
              <PrimaryButton
                type="button"
                disabled={busy || (!!user && !sameEmail)}
                onClick={() => void handleRespond("accept")}
                style={{ width: "100%", padding: "0.8rem" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Check size={16} /> {busy ? "Un momento..." : "Aceptar rol"}
                </span>
              </PrimaryButton>
            )}
            <SecondaryButton
              type="button"
              disabled={busy}
              onClick={() => void handleRespond("decline")}
              style={{ width: "100%", padding: "0.75rem" }}
            >
              Rechazar
            </SecondaryButton>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
