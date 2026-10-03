import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { authErrorMessage, useAuth } from "../context/AuthContext";
import { usePostLoginRedirect } from "../hooks/usePostLoginRedirect";
import PlatformLayout from "../components/platform/PlatformLayout";
import DestinationPicker from "../components/platform/DestinationPicker";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton } from "../components/ui";
import { emailKey } from "../lib/paths";
import { signupInviteExists } from "../features/admin/commands";

export default function Registro() {
  const { user, loading, register, platformUnclaimed } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invitedEmail = (params.get("email") || "").trim().toLowerCase();
  const configReady = platformUnclaimed !== null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const next = params.get("next") || "/";
  const { choices, resolving, go } = usePostLoginRedirect({
    enabled: done,
    fallback: next,
  });

  useEffect(() => {
    if (invitedEmail) setEmail(invitedEmail);
  }, [invitedEmail]);

  useEffect(() => {
    if (!loading && user && !done) navigate("/", { replace: true });
  }, [user, loading, done, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = email.trim().toLowerCase();
    setBusy(true);
    try {
      if (!configReady) {
        setError("Un momento, estamos comprobando la plataforma.");
        return;
      }
      if (!platformUnclaimed) {
        const invited = await signupInviteExists(emailKey(clean));
        if (!invited) {
          setError("No hay una invitación para este correo. Pide el acceso a un administrador.");
          return;
        }
      }
      await register(clean, password, name);
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err));
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
          <UserPlus size={26} color={C.amber} />
        </div>

        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 900,
            color: C.navy900,
            margin: "0 0 0.25rem",
          }}
        >
          Crear cuenta
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
          {platformUnclaimed
            ? "Crea la primera cuenta. En el inicio podrás reclamar la administración de la plataforma."
            : "Usa el correo al que te invitaron. El rol de club o de administrador se activa al entrar."}
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}
        >
          <FormInput
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
          <FormInput
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            readOnly={!!invitedEmail}
          />
          <FormInput
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {error && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: C.red }}>{error}</p>
          )}

          <PrimaryButton
            type="submit"
            disabled={busy || resolving || !configReady}
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.25rem" }}
          >
            {busy || resolving ? "Un momento..." : "Crear cuenta"}
          </PrimaryButton>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            marginTop: "1.25rem",
            background: "none",
            border: "none",
            color: C.navy900,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Ya tengo cuenta
        </button>
      </div>
      {choices && choices.length > 1 && (
        <DestinationPicker
          destinations={choices}
          onPick={go}
          onHome={() => go("/")}
        />
      )}
    </PlatformLayout>
  );
}
