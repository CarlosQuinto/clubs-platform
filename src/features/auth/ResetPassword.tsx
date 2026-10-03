import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { applyNewPassword, checkResetCode } from "../../infrastructure/auth";
import PlatformLayout from "../shell/PlatformLayout";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton } from "../../shared/ui";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oobCode = params.get("oobCode") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setError("Este enlace no es válido. Pide uno nuevo desde iniciar sesión.");
      setChecking(false);
      return;
    }
    let cancelled = false;
    void checkResetCode(oobCode)
      .then((accountEmail) => {
        if (cancelled) return;
        setEmail(accountEmail);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Este enlace venció o ya se usó. Pide uno nuevo desde iniciar sesión.");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await applyNewPassword(oobCode, password);
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      if (code.includes("weak-password")) {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else if (code.includes("expired") || code.includes("invalid")) {
        setError("Este enlace venció o ya se usó. Pide uno nuevo desde iniciar sesión.");
        setReady(false);
      } else {
        setError("No se pudo cambiar la contraseña. Inténtalo de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlatformLayout maxWidth="480px">
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          padding: "2rem",
          boxShadow: SHADOWS.lg,
          border: `1px solid ${C.gray200}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <Lock size={26} color={C.amber} />
        </div>
        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 900,
            color: C.navy900,
            margin: "0 0 0.25rem",
            textAlign: "center",
          }}
        >
          Nueva contraseña
        </h1>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "0.85rem",
            color: C.gray500,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {email
            ? `Elige una contraseña para ${email}.`
            : "Elige una contraseña nueva para tu cuenta."}
        </p>

        {checking && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: C.gray500 }}>Revisando el enlace...</p>
        )}

        {ready && (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}
          >
            <FormInput
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
            />
            <FormInput
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {error && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: C.red }}>{error}</p>
            )}
            <PrimaryButton
              type="submit"
              disabled={busy}
              style={{ width: "100%", padding: "0.85rem", marginTop: "0.25rem" }}
            >
              {busy ? "Guardando..." : "Guardar contraseña"}
            </PrimaryButton>
          </form>
        )}

        {!checking && !ready && error && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: C.red, textAlign: "center" }}>
            {error}
          </p>
        )}

        <Link
          to="/login"
          style={{
            marginTop: "1.25rem",
            fontSize: "0.8rem",
            color: C.navy900,
            fontWeight: 700,
          }}
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </PlatformLayout>
  );
}
