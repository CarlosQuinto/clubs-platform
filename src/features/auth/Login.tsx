import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { authErrorMessage, useAuth } from "../../domains/auth/AuthContext";
import { usePostLoginRedirect } from "./usePostLoginRedirect";
import PlatformLayout from "../shell/PlatformLayout";
import DestinationPicker from "./DestinationPicker";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton } from "../../shared/ui";

type Mode = "login" | "reset";

export default function Login() {
  const { user, loading, login, resetPassword, platformUnclaimed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const passwordJustReset = Boolean(
    (location.state as { passwordReset?: boolean } | null)?.passwordReset,
  );
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const { choices, resolving, go } = usePostLoginRedirect({
    enabled: !!user && !loading && mode === "login",
    fallback: next,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        try {
          await resetPassword(email.trim());
        } catch (err) {
          const code = (err as { code?: string }).code || "";
          if (code.includes("invalid-argument")) {
            setError("El correo no es válido.");
            return;
          }
          if (code.includes("unavailable") || code.includes("internal")) {
            setError("No se pudo completar. Inténtalo de nuevo.");
            return;
          }
        }
        setInfo(
          "Si hay una cuenta con ese correo, te enviaremos el enlace para restablecer la contraseña.",
        );
      }
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
          {mode === "reset" ? (
            <Mail size={26} color={C.amber} />
          ) : (
            <Lock size={26} color={C.amber} />
          )}
        </div>

        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 900,
            color: C.navy900,
            margin: "0 0 0.25rem",
          }}
        >
          {mode === "reset" ? "Recuperar contraseña" : "Iniciar sesión"}
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
          {mode === "reset"
            ? "Escribe tu correo y te enviaremos un enlace."
            : platformUnclaimed
              ? "Crea la primera cuenta para tomar la plataforma, o entra si ya la tienes."
              : "Accede con el correo con el que fuiste invitado."}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}
        >
          <FormInput
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
          {mode !== "reset" && (
            <FormInput
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          )}

          {passwordJustReset && !error && !info && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: C.green }}>
              Contraseña actualizada. Ya puedes entrar.
            </p>
          )}
          {error && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: C.red }}>{error}</p>
          )}
          {info && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: C.green }}>{info}</p>
          )}

          <PrimaryButton
            type="submit"
            disabled={busy || resolving}
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.25rem" }}
          >
            {busy
              ? "Un momento..."
              : resolving
                ? "Revisando tus accesos..."
                : mode === "login"
                  ? "Entrar"
                  : "Enviar enlace"}
          </PrimaryButton>
        </form>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1.25rem",
            fontSize: "0.8rem",
            color: C.gray500,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {mode !== "login" && (
            <LinkButton onClick={() => setMode("login")}>Ya tengo cuenta</LinkButton>
          )}
          {mode === "login" && platformUnclaimed && (
            <LinkButton onClick={() => navigate("/registro")}>Crear cuenta</LinkButton>
          )}
          {mode !== "reset" && (
            <LinkButton onClick={() => setMode("reset")}>Olvidé mi contraseña</LinkButton>
          )}
        </div>
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

const LinkButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    type="button"
    style={{
      background: "none",
      border: "none",
      color: C.navy900,
      fontWeight: 700,
      cursor: "pointer",
      padding: 0,
      fontSize: "inherit",
    }}
  />
);
