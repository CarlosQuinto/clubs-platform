import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, Mail, Trash2, UserCog } from "lucide-react";
import { useClub } from "../../domains/clubs/ClubContext";
import { useAuth } from "../../domains/auth/AuthContext";
import {
  changeMemberRole,
  dropClubInvite,
  dropMember,
  DATA_REVIEW_MESSAGE,
  inviteClubAdmin,
  loadClubPeople,
} from "../../domains/clubs/clubCommands";
import { MemberRole } from "../../infrastructure/dataconnect";
import { emailKey } from "../../shared/paths";
import { emailText, isRegisterEmail } from "../../shared/textLimits";
import { inviteRespondPath } from "../../domains/clubs/clubInvite";
import { sendClubInvite, type InviteKind } from "../../infrastructure/functions/callables";
import { signupUrl } from "../../domains/clubs/signupInvite";
import { Role, ROLES, ROLE_LABELS } from "../../domains/auth/roles";
import InviteSignupLink, {
  CopySignupUrlButton,
} from "../shell/InviteSignupLink";
import ConfirmModal from "../../shared/ConfirmModal";
import { useModalLock } from "../../shared/useModalLock";
import {
  C,
  RADIUS,
  SHADOWS,
  Badge,
  FormInput,
  FormSelect,
  PrimaryButton,
} from "../../shared/ui";

interface Member {
  id: string;
  email: string;
  displayName?: string;
  role: Role;
}

interface Invite {
  id: string;
  email: string;
  role: Role;
  kind?: InviteKind;
  token?: string;
}

/**
 * Gestión de miembros e invitaciones de un club.
 * Visible para el rol `admin` del club y para super administradores.
 */
const ROLE_SQL: Record<Role, MemberRole> = {
  admin: MemberRole.ADMIN,
  dt: MemberRole.DT,
  prensa: MemberRole.PRENSA,
  tesorero: MemberRole.TESORERO,
};

const SQL_ROLE: Record<MemberRole, Role> = {
  [MemberRole.ADMIN]: "admin",
  [MemberRole.DT]: "dt",
  [MemberRole.PRENSA]: "prensa",
  [MemberRole.TESORERO]: "tesorero",
};

export default function MembersModal({
  clubName,
  onClose,
}: {
  clubName: string;
  onClose: () => void;
}) {
  const { clubId } = useClub();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastInvite, setLastInvite] = useState("");
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [lastInviteKind, setLastInviteKind] = useState<InviteKind | "">("");
  const [lastMailed, setLastMailed] = useState(true);
  const [cancelInvite, setCancelInvite] = useState<Invite | null>(null);
  const [canceling, setCanceling] = useState(false);
  const sending = useRef(false);

  useModalLock(cancelInvite ? null : onClose);

  const reload = async () => {
    const data = await loadClubPeople(clubId);
    setMembers(
      data.clubMembers
        .map((member) => ({
          id: member.user.id,
          email: member.email,
          displayName: member.displayName,
          role: SQL_ROLE[member.role],
        }))
        .sort((a, b) => a.email.localeCompare(b.email)),
    );
    setInvites(
      data.clubInvites
        .map((invite) => ({
          id: invite.emailKey,
          email: invite.email,
          role: SQL_ROLE[invite.role],
          kind: invite.kind === "ACCEPT" ? "accept" as const : "signup" as const,
          token: invite.token || "",
        }))
        .sort((a, b) => a.email.localeCompare(b.email)),
    );
  };

  useEffect(() => {
    void reload().catch((err: unknown) => console.error(err));
    // reload solo depende de clubId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    setError("");
    const clean = email.trim().toLowerCase();
    if (!isRegisterEmail(clean)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (!ROLE_SQL[role]) {
      setError("Elige un rol.");
      return;
    }
    const taken =
      members.some((m) => m.email.toLowerCase() === clean) ||
      invites.some((inv) => inv.email.toLowerCase() === clean);
    if (taken) {
      setError("Este correo ya tiene un rol o invitación en el club.");
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      const key = emailKey(clean);
      const preview = await sendClubInvite({
        clubId,
        email: clean,
        role,
        token,
        hold: true,
      });
      await inviteClubAdmin({
        clubId,
        emailKey: key,
        email: clean,
        role: ROLE_SQL[role],
        token,
        kind: preview.kind === "accept" ? "ACCEPT" : "SIGNUP",
        platform: false,
      });
      const sent = preview.held
        ? await sendClubInvite({ clubId, email: clean, role, token }).catch(() => null)
        : preview;
      await reload();
      setLastInvite(clean);
      setLastInviteUrl(sent?.url || inviteRespondPath(clubId, key, token));
      setLastInviteKind(sent?.kind || preview.kind);
      setLastMailed(sent?.mailed ?? false);
      setEmail("");
      setRole("admin");
    } catch (err) {
      console.error(err);
      setError(inviteError(err));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const changeRole = async (m: Member, newRole: Role) => {
    if (!ROLE_SQL[newRole]) return;
    await changeMemberRole(clubId, m.id, ROLE_SQL[newRole]);
    await reload();
  };

  const removeMember = async (m: Member) => {
    const self = m.id === user?.uid;
    const msg = self
      ? "Vas a quitarte a ti mismo del club y perderás el acceso de gestión. ¿Continuar?"
      : `¿Quitar a ${m.email} del club?`;
    if (window.confirm(msg)) {
      await dropMember(clubId, m.id);
      await reload();
    }
  };

  const confirmCancel = async () => {
    if (!cancelInvite || canceling) return;
    setCanceling(true);
    setError("");
    try {
      await dropClubInvite(clubId, cancelInvite.id);
      if (lastInvite === cancelInvite.email) setLastInvite("");
      setCancelInvite(null);
      await reload();
    } catch (err) {
      console.error(err);
      setError("No se pudo cancelar la invitación.");
    } finally {
      setCanceling(false);
    }
  };

  return createPortal(
    <>
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.85)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="members-modal compact-form"
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.lg,
          padding: "1rem 1rem 1.1rem",
          width: "100%",
          maxWidth: "440px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: SHADOWS.xl,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0.7rem",
            right: "0.7rem",
            background: "none",
            border: "none",
            color: C.gray400,
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        <h3 className="members-modal__title">
          <UserCog size={15} color={C.amber} />
          Administradores
        </h3>
        <p className="members-modal__club">{clubName}</p>
        <p className="members-modal__hint">
          Invita por correo. Si ya tiene cuenta, le pedimos que acepte el rol. Si no,
          le mandamos el enlace para crearla.
        </p>

        <form onSubmit={handleInvite} className="members-invite">
          <FormInput
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => {
              setEmail(emailText(e.target.value));
              setError("");
            }}
          />
          <div className="members-invite__row">
            <FormSelect
              required
              value={role}
              onChange={(e) => {
                const next = e.target.value;
                if (ROLES.some((item) => item.value === next)) setRole(next as Role);
              }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </FormSelect>
            <PrimaryButton
              type="submit"
              disabled={busy || !isRegisterEmail(email) || !ROLE_SQL[role]}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
                padding: "0.45rem 0.75rem",
                whiteSpace: "nowrap",
              }}
            >
              <UserPlus size={13} /> {busy ? "Enviando..." : "Invitar"}
            </PrimaryButton>
          </div>
        </form>
        {error && (
          <p style={{ color: C.red, fontSize: "0.72rem", margin: "0.35rem 0 0" }}>
            {error}
          </p>
        )}
        {lastInvite && (
          <>
            <p
              style={{
                margin: "0.55rem 0 0",
                fontSize: "0.72rem",
                color: lastMailed ? C.green : C.gray500,
                lineHeight: 1.4,
              }}
            >
              {lastInviteKind === "accept"
                ? lastMailed
                  ? `Se envió un correo a ${lastInvite} para aceptar el rol.`
                  : `No se pudo enviar el correo. Copia el enlace para que acepte el rol.`
                : lastMailed
                  ? `Se envió un correo a ${lastInvite} para crear su cuenta.`
                  : `No se pudo enviar el correo. Copia el enlace de registro.`}
            </p>
            <InviteSignupLink
              url={lastInviteUrl || signupUrl(lastInvite)}
              label={
                lastInviteKind === "accept"
                  ? "URL para aceptar el rol"
                  : "URL para crear cuenta"
              }
            />
          </>
        )}

        <div className="members-roles">
          {ROLES.map((r) => (
            <div key={r.value} className="members-roles__item">
              <strong>{r.label}</strong>
              <span>{r.description}</span>
            </div>
          ))}
        </div>

        <SectionTitle>Administradores ({members.length})</SectionTitle>
        {members.length === 0 && (
          <EmptyRow>Todavía no hay administradores con acceso.</EmptyRow>
        )}
        {members.map((m) => (
          <Row key={m.id}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: C.gray800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.displayName || m.email}
                {m.id === user?.uid && (
                  <Badge color="amber" style={{ marginLeft: "0.4rem" }}>
                    tú
                  </Badge>
                )}
              </div>
              {m.displayName && (
                <div style={{ fontSize: "0.7rem", color: C.gray500 }}>
                  {m.email}
                </div>
              )}
            </div>
            <FormSelect
              value={m.role}
              onChange={(e) => {
                const next = e.target.value;
                if (ROLES.some((item) => item.value === next)) {
                  void changeRole(m, next as Role);
                }
              }}
              style={{ width: "auto", padding: "0.35rem 0.5rem", fontSize: "0.75rem" }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </FormSelect>
            <IconButton title="Quitar" onClick={() => removeMember(m)}>
              <Trash2 size={14} />
            </IconButton>
          </Row>
        ))}

        <SectionTitle style={{ marginTop: "0.85rem" }}>
          Invitaciones pendientes ({invites.length})
        </SectionTitle>
        {invites.length === 0 && <EmptyRow>Sin invitaciones pendientes.</EmptyRow>}
        {invites.map((inv) => (
          <Row key={inv.id}>
            <Mail size={14} color={C.gray400} />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: "0.85rem",
                color: C.gray700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {inv.email}
            </div>
            <Badge color="blue">{ROLE_LABELS[inv.role]}</Badge>
            <Badge color="gray">
              {inv.kind === "accept" ? "Aceptar rol" : "Crear cuenta"}
            </Badge>
            <CopySignupUrlButton
              url={
                inv.kind === "accept" && inv.token
                  ? `${window.location.origin}${inviteRespondPath(clubId, inv.id, inv.token)}`
                  : signupUrl(inv.email)
              }
            />
            <IconButton
              title="Cancelar invitación"
              disabled={canceling}
              onClick={() => setCancelInvite(inv)}
            >
              <Trash2 size={14} />
            </IconButton>
          </Row>
        ))}
      </div>
    </div>
    <ConfirmModal
      open={Boolean(cancelInvite)}
      title="Cancelar invitación"
      message="¿Seguro que deseas cancelar esta invitación?"
      confirmLabel="Cancelar invitación"
      cancelLabel="Volver"
      danger
      busy={canceling}
      zIndex={10001}
      onConfirm={() => void confirmCancel()}
      onCancel={() => {
        if (!canceling) setCancelInvite(null);
      }}
    />
    </>,
    document.body,
  );
}

function inviteError(err: unknown) {
  if (err instanceof Error && err.message === DATA_REVIEW_MESSAGE) {
    return "No se pudo crear la invitación.";
  }
  const code = (err as { code?: string }).code || "";
  if (code.includes("already-exists")) {
    return "Este correo ya tiene un rol o invitación en el club.";
  }
  if (code.includes("unauthenticated")) return "Inicia sesión de nuevo para invitar.";
  if (code.includes("permission-denied")) {
    return "Solo el presidente o un superadmin puede invitar.";
  }
  if (code.includes("invalid-argument")) return "Escribe un correo válido.";
  return "No se pudo crear la invitación.";
}

const SectionTitle = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <h4
    style={{
      margin: "0 0 0.5rem 0",
      fontSize: "0.7rem",
      fontWeight: 800,
      color: C.gray500,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      ...style,
    }}
  >
    {children}
  </h4>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.45rem 0.55rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray200}`,
      backgroundColor: C.gray50,
      marginBottom: "0.3rem",
    }}
  >
    {children}
  </div>
);

const EmptyRow = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: C.gray400 }}>
    {children}
  </p>
);

const IconButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    style={{
      background: "none",
      border: "none",
      color: C.gray400,
      cursor: "pointer",
      padding: "0.25rem",
      display: "flex",
      ...props.style,
    }}
  />
);
