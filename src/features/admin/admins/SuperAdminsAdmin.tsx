import { useState, type CSSProperties } from "react";
import { Crown, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../../../domains/auth/AuthContext";
import { emailKey } from "../../../shared/paths";
import {
  dropPlatformAdmin,
  dropPlatformInvite,
  invitePlatformAdmin,
  loadAdmins,
} from "../../../domains/platform/platformCommands";
import { useAdminQuery } from "../useAdminQuery";
import Field from "../Field";
import InviteSignupLink, {
  CopySignupUrlButton,
} from "../../shell/InviteSignupLink";
import { sendPlatformAdminInvite } from "../../../infrastructure/functions/callables";
import {
  Badge,
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SectionCard,
} from "../../../shared/ui";

interface Invite {
  id: string;
  email: string;
}

export default function SuperAdminsAdmin() {
  const { user } = useAuth();
  const screen = useAdminQuery(loadAdmins);
  const invites: Invite[] = (screen.data?.platformAdminInvites ?? []).map((invite) => ({
    id: invite.emailKey,
    email: invite.email,
  }));
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastInvite, setLastInvite] = useState("");

  const admins = screen.data?.platformAdmins ?? [];
  const uids = admins.map((admin) => admin.user.id);
  const emails = Object.fromEntries(admins.map((admin) => [admin.user.id, admin.email]));

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (user?.email && user.email.toLowerCase() === clean) {
      setError("Esa ya es tu cuenta.");
      return;
    }
    if (Object.values(emails).some((v) => v.toLowerCase() === clean)) {
      setError("Ese correo ya es administrador.");
      return;
    }
    if (invites.some((inv) => inv.email.toLowerCase() === clean)) {
      setError("Ya hay una invitación para ese correo.");
      return;
    }
    try {
      setBusy(true);
      await invitePlatformAdmin(emailKey(clean), clean);
      screen.reload();
      let mailed = false;
      try {
        const result = await sendPlatformAdminInvite(clean);
        mailed = result.mailed;
      } catch (mailErr) {
        console.error(mailErr);
      }
      setEmail("");
      setLastInvite(clean);
      setNotice(
        mailed
          ? "Invitación enviada por correo."
          : "Invitación creada, pero el correo no se pudo enviar. Envíale la URL.",
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la invitación.");
    } finally {
      setBusy(false);
    }
  };

  const removeInvite = async (inv: Invite) => {
    if (!window.confirm(`¿Cancelar la invitación de ${inv.email}?`)) return;
    await dropPlatformInvite(inv.id);
    screen.reload();
    if (lastInvite === inv.email) setLastInvite("");
  };

  const removeAdmin = async (uid: string, label: string) => {
    if (uids.length <= 1) {
      setError("Tiene que quedar al menos un administrador.");
      return;
    }
    const self = uid === user?.uid;
    const msg = self
      ? "Vas a quitarte a ti mismo y perderás el acceso de administración. ¿Continuar?"
      : `¿Quitar a ${label} como administrador?`;
    if (!window.confirm(msg)) return;
    try {
      setBusy(true);
      await dropPlatformAdmin(uid);
      screen.reload();
    } catch (err) {
      console.error(err);
      setError("No se pudo quitar al administrador.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <SectionCard
        className="compact-form-card"
        title={`Administradores (${uids.length})`}
        icon={<Crown size={14} color={C.amber} />}
      >
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.78rem", color: C.gray500 }}>
          Invita por correo. Le enviamos un enlace para crear su cuenta o para entrar
          si ya la tiene. Al aceptarla, recibe acceso total a la plataforma.
        </p>
        {uids.length === 0 ? (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
            Todavía no hay administradores.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {uids.map((uid) => {
              const label = emails[uid] || uid;
              const self = uid === user?.uid;
              return (
                <div key={uid} style={rowStyle}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        color: C.navy900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </div>
                    {self && (
                      <div style={{ fontSize: "0.68rem", color: C.gray500, marginTop: 2 }}>
                        Tu cuenta
                      </div>
                    )}
                  </div>
                  {self ? (
                    <Badge color="amber">Tú</Badge>
                  ) : (
                    <button
                      type="button"
                      title="Quitar"
                      disabled={busy || uids.length <= 1}
                      onClick={() => void removeAdmin(uid, label)}
                      style={iconBtn}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        className="compact-form-card"
        title="Invitar administrador"
        icon={<UserPlus size={14} color={C.amber} />}
      >
        <form
          onSubmit={handleInvite}
          className="compact-form admin-club-form"
        >
          <Field label="Correo">
            <FormInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </Field>
          {error && (
            <p style={{ margin: 0, color: C.red, fontSize: "0.72rem" }}>{error}</p>
          )}
          {notice && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.72rem" }}>{notice}</p>
          )}
          <PrimaryButton
            type="submit"
            disabled={busy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "fit-content",
              alignSelf: "flex-start",
            }}
          >
            <UserPlus size={14} /> Enviar invitación
          </PrimaryButton>
        </form>
        {lastInvite && <InviteSignupLink email={lastInvite} />}

        {invites.length > 0 && (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: C.gray500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Pendientes ({invites.length})
            </div>
            {invites.map((inv) => (
              <div key={inv.id} style={rowStyle}>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: C.navy900,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inv.email}
                </span>
                <Badge color="gray">Pendiente</Badge>
                <CopySignupUrlButton email={inv.email} />
                <button
                  type="button"
                  title="Cancelar"
                  onClick={() => void removeInvite(inv)}
                  style={iconBtn}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.55rem",
  padding: "0.6rem 0.7rem",
  borderRadius: RADIUS.md,
  border: `1px solid ${C.gray200}`,
  backgroundColor: C.gray50,
};

const iconBtn: CSSProperties = {
  border: `1px solid ${C.gray200}`,
  background: C.white,
  color: C.red,
  borderRadius: RADIUS.md,
  width: 32,
  height: 32,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
