import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { authErrorMessage, useAuth } from "../../domains/auth/AuthContext";
import { usePostLoginRedirect } from "./usePostLoginRedirect";
import PlatformLayout from "../shell/PlatformLayout";
import DestinationPicker from "./DestinationPicker";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton } from "../../shared/ui";
import { emailText, isRegisterEmail } from "../../shared/textLimits";

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
  const [showPassword, setShowPassword] = useState(false);
  const [emailSeen, setEmailSeen] = useState(false);
  const [passwordSeen, setPasswordSeen] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const { choices, resolving, go } = usePostLoginRedirect({
    enabled: !!user && !loading && mode === "login",
    fallback: next,
  });

  const emailOk = isRegisterEmail(email);
  // La contraseña va tal cual: sin trim ni límite de caracteres.
  const passwordOk = mode === "reset" || password.length > 0;
  const emailTip = !emailSeen
    ? ""
    : !email
      ? "Escribe tu correo."
      : !emailOk
        ? "Escribe un correo válido, como usuario@dominio.com."
        : "";
  const passwordTip = passwordSeen && !password ? "Escribe tu contraseña." : "";
  const canSubmit = emailOk && passwordOk && !busy && !resolving;

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setInfo("");
    setPasswordSeen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setEmailSeen(true);
      setPasswordSeen(true);
      return;
    }
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        try {
          await resetPassword(email);
        } catch (err) {
          const code = (err as { code?: string }).code || "";
          if (code.includes("invalid-argument")) {
            setError("El correo no es válido.");
            return;
          }
          if (code.includes("resource-exhausted")) {
            setError("Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.");
            return;
          }
          if (code.includes("unavailable") || code.includes("internal")) {
            setError("No se pudo completar. Inténtalo de nuevo.");
            return;
          }
        }
        setInfo(
          "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
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
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}
        >
          <span className={emailTip ? "field-tip-anchor is-invalid" : "field-tip-anchor"}>
            <FormInput
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(emailText(e.target.value))}
              onBlur={() => setEmailSeen(true)}
              required
              maxLength={320}
              autoComplete="email"
              aria-invalid={!!emailTip}
              autoFocus
            />
            {emailTip ? (
              <span className="field-tip" role="tooltip">
                {emailTip}
              </span>
            ) : null}
          </span>
          {mode !== "reset" && (
            <span className={passwordTip ? "field-tip-anchor is-invalid" : "field-tip-anchor"}>
              <FormInput
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordSeen(true)}
                required
                autoComplete="current-password"
                aria-invalid={!!passwordTip}
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "0.5rem",
                  transform: "translateY(-50%)",
                  display: "flex",
                  padding: "0.25rem",
                  background: "none",
                  border: "none",
                  color: C.gray500,
                  cursor: "pointer",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {passwordTip ? (
                <span className="field-tip" role="tooltip">
                  {passwordTip}
                </span>
              ) : null}
            </span>
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
            disabled={!canSubmit}
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.25rem" }}
          >
            {busy
              ? mode === "login"
                ? "Entrando..."
                : "Enviando..."
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
            <LinkButton onClick={() => switchMode("login")}>Ya tengo cuenta</LinkButton>
          )}
          {mode === "login" && platformUnclaimed && (
            <LinkButton onClick={() => navigate("/registro")}>Crear cuenta</LinkButton>
          )}
          {mode !== "reset" && (
            <LinkButton onClick={() => switchMode("reset")}>Olvidé mi contraseña</LinkButton>
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
