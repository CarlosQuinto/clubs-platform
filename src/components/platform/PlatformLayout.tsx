import { Link, useNavigate } from "react-router-dom";
import { Crown, LogIn, LogOut, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { C, RADIUS } from "../ui";
import { PLATFORM_NAME } from "../../lib/clubDefaults";

/** Cabecera + contenedor común para las páginas de plataforma (landing, login, admin). */
export default function PlatformLayout({
  children,
  maxWidth = "960px",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.gray50,
        color: C.gray800,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          background: `linear-gradient(135deg, ${C.navy900} 0%, #0a1120 100%)`,
          color: C.white,
          padding: "1rem 1.5rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            maxWidth,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              color: C.white,
              textDecoration: "none",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: "1.1rem",
            }}
          >
            <Shield size={22} color={C.amber} />
            {PLATFORM_NAME}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isSuperAdmin && (
              <Link
                to="/admin"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.35rem 0.6rem",
                  borderRadius: RADIUS.md,
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: C.amber,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Crown size={12} /> Admin
              </Link>
            )}
            {user ? (
              <button
                onClick={() => logout()}
                title={user.email || ""}
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: `1px solid rgba(239, 68, 68, 0.3)`,
                  borderRadius: RADIUS.md,
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: "0.35rem 0.6rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                <LogOut size={12} /> Salir
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: C.white,
                  border: "none",
                  borderRadius: RADIUS.md,
                  color: C.navy900,
                  cursor: "pointer",
                  padding: "0.35rem 0.6rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                }}
              >
                <LogIn size={12} /> Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth,
          width: "100%",
          margin: "0 auto",
          padding: "1.5rem",
          flex: 1,
          boxSizing: "border-box",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}
