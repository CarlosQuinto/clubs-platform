import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, UserPlus } from "lucide-react";
import { authErrorMessage, useAuth } from "../context/AuthContext";
import PlatformLayout from "../components/platform/PlatformLayout";
import { C, RADIUS, SHADOWS, FormInput, PrimaryButton } from "../components/ui";

type Mode = "login" | "register" | "reset";

export default function Login() {
  const { user, loading, login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true });
  }, [user, loading, next, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else if (mode === "register") {
        await register(email.trim(), password, name);
      } else {
        await resetPassword(email.trim());
        setInfo("Te enviamos un correo para restablecer la contraseña.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login"
      ? "Iniciar sesión"
      : mode === "register"
        ? "Crear cuenta"
        : "Recuperar contraseña";

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
          {mode === "register" ? (
            <UserPlus size={26} color={C.amber} />
          ) : mode === "reset" ? (
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
          {title}
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
          {mode === "register"
            ? "Crea tu cuenta con el correo al que te invitaron. Tus permisos se activan automáticamente."
            : mode === "reset"
              ? "Escribe tu correo y te enviaremos un enlace."
              : "Accede con el correo con el que fuiste invitado a tu club."}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}
        >
          {mode === "register" && (
            <FormInput
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          )}

          {error && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: C.red }}>{error}</p>
          )}
          {info && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: C.green }}>{info}</p>
          )}

          <PrimaryButton
            type="submit"
            disabled={busy}
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.25rem" }}
          >
            {busy
              ? "Un momento..."
              : mode === "login"
                ? "Entrar"
                : mode === "register"
                  ? "Crear cuenta"
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
          {mode !== "register" && (
            <LinkButton onClick={() => setMode("register")}>Crear cuenta</LinkButton>
          )}
          {mode !== "reset" && (
            <LinkButton onClick={() => setMode("reset")}>Olvidé mi contraseña</LinkButton>
          )}
        </div>
      </div>
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
