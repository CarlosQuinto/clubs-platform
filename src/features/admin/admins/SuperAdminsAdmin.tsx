import { useRef, useState, type CSSProperties } from "react";
import { Crown, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../../../domains/auth/AuthContext";
import { emailKey } from "../../../shared/paths";
import { emailText, isRegisterEmail } from "../../../shared/textLimits";
import ConfirmModal from "../../../shared/ConfirmModal";
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

type PendingRemoval =
  | { kind: "admin"; uid: string; label: string }
  | { kind: "invite"; invite: Invite };

/** Mensaje para el superadmin cuando falla el correo de invitación. */
function mailErrorMessage(err: unknown) {
  const code = (err as { code?: string }).code || "";
  if (code.includes("resource-exhausted")) {
    return "Demasiados envíos seguidos. Espera unos minutos e inténtalo de nuevo.";
  }
  return "No se pudo enviar el correo. Envíale la URL.";
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
  const [resendTo, setResendTo] = useState("");
  const [removal, setRemoval] = useState<PendingRemoval | null>(null);
  const sending = useRef(false);

  const admins = screen.data?.platformAdmins ?? [];
  const uids = admins.map((admin) => admin.user.id);
  const emails = Object.fromEntries(admins.map((admin) => [admin.user.id, admin.email]));
  const validEmail = isRegisterEmail(email);

  const resetMessages = () => {
    setError("");
    setNotice("");
    setResendTo("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    resetMessages();
    const clean = email.trim();
    if (!isRegisterEmail(clean)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (user?.email && user.email.toLowerCase() === clean) {
      setError("Esa ya es tu cuenta.");
      return;
    }
    if (Object.values(emails).some((v) => v.toLowerCase() === clean)) {
      setError("Este correo ya es administrador de la plataforma.");
      return;
    }
    if (invites.some((inv) => inv.email.toLowerCase() === clean)) {
      setError("Ya hay una invitación pendiente para ese correo.");
      setResendTo(clean);
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      await invitePlatformAdmin(emailKey(clean), clean);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo crear la invitación: revisa que el correo no tenga una invitación y que no hayas enviado demasiadas en la última hora.",
      );
      sending.current = false;
      setBusy(false);
      return;
    }
    screen.reload();
    setEmail("");
    setLastInvite(clean);
    try {
      const result = await sendPlatformAdminInvite(clean);
      setNotice(
        result.mailed
          ? "Invitación enviada por correo."
          : "Invitación creada, pero el correo no se pudo enviar. Envíale la URL.",
      );
    } catch (mailErr) {
      console.error(mailErr);
      setNotice(`Invitación creada. ${mailErrorMessage(mailErr)}`);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const resendInvite = async () => {
    if (sending.current || !resendTo) return;
    const to = resendTo;
    sending.current = true;
    setBusy(true);
    resetMessages();
    try {
      const result = await sendPlatformAdminInvite(to);
      setLastInvite(to);
      setNotice(
        result.mailed
          ? "Invitación reenviada por correo."
          : "El correo no se pudo enviar. Envíale la URL.",
      );
    } catch (err) {
      console.error(err);
      setError(mailErrorMessage(err));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const confirmRemoval = async () => {
    if (!removal || sending.current) return;
    sending.current = true;
    setBusy(true);
    resetMessages();
    try {
      if (removal.kind === "invite") {
        await dropPlatformInvite(removal.invite.id);
        if (lastInvite === removal.invite.email) setLastInvite("");
      } else {
        await dropPlatformAdmin(removal.uid);
      }
      screen.reload();
    } catch (err) {
      console.error(err);
      setError(
        removal.kind === "invite"
          ? "No se pudo cancelar la invitación."
          : "No se pudo quitar al administrador.",
      );
    } finally {
      setRemoval(null);
      sending.current = false;
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
                      onClick={() => setRemoval({ kind: "admin", uid, label })}
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
              onChange={(e) => {
                setEmail(emailText(e.target.value));
                setError("");
                setResendTo("");
              }}
              placeholder="correo@ejemplo.com"
              maxLength={320}
              autoComplete="email"
              required
            />
          </Field>
          {error && (
            <p style={{ margin: 0, color: C.red, fontSize: "0.72rem" }}>
              {error}
              {resendTo && (
                <>
                  {" "}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void resendInvite()}
                    style={linkBtn}
                  >
                    Reenviar correo
                  </button>
                </>
              )}
            </p>
          )}
          {notice && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.72rem" }}>{notice}</p>
          )}
          <PrimaryButton
            type="submit"
            disabled={busy || !validEmail}
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
                  disabled={busy}
                  onClick={() => setRemoval({ kind: "invite", invite: inv })}
                  style={iconBtn}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmModal
        open={removal !== null}
        title={removal?.kind === "invite" ? "Cancelar invitación" : "Quitar administrador"}
        message={
          removal?.kind === "invite"
            ? `¿Seguro que deseas cancelar la invitación de ${removal.invite.email}?`
            : removal
              ? `¿Seguro que deseas revocar el acceso de ${removal.label}? Esta acción no se puede deshacer.`
              : ""
        }
        confirmLabel={removal?.kind === "invite" ? "Cancelar invitación" : "Revocar acceso"}
        cancelLabel="Volver"
        danger
        busy={busy}
        onConfirm={() => void confirmRemoval()}
        onCancel={() => {
          if (!sending.current) setRemoval(null);
        }}
      />
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

const linkBtn: CSSProperties = {
  border: "none",
  background: "none",
  padding: 0,
  color: C.navy900,
  fontSize: "0.72rem",
  fontWeight: 800,
  textDecoration: "underline",
  cursor: "pointer",
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
