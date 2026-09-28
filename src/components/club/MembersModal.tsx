import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { X, UserPlus, Mail, Trash2, UserCog } from "lucide-react";
import { useClub } from "../../context/ClubContext";
import { useAuth } from "../../context/AuthContext";
import { emailKey } from "../../lib/paths";
import { Role, ROLES, ROLE_LABELS } from "../../lib/roles";
import {
  C,
  RADIUS,
  SHADOWS,
  Badge,
  FormInput,
  FormSelect,
  PrimaryButton,
} from "../ui";

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
}

/**
 * Gestión de miembros e invitaciones de un club.
 * Visible para el rol `admin` del club y para super administradores.
 */
export default function MembersModal({
  clubName,
  onClose,
}: {
  clubName: string;
  onClose: () => void;
}) {
  const { col, item } = useClub();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("dt");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const unsubM = onSnapshot(col("members"), (snap) => {
      const list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Member,
      );
      list.sort((a, b) => a.email.localeCompare(b.email));
      setMembers(list);
    });
    const unsubI = onSnapshot(col("invites"), (snap) => {
      const list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Invite,
      );
      list.sort((a, b) => a.email.localeCompare(b.email));
      setInvites(list);
    });
    return () => {
      unsubM();
      unsubI();
    };
  }, [col]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (members.some((m) => m.email === clean)) {
      setError("Esa persona ya es miembro del club.");
      return;
    }
    try {
      setBusy(true);
      await setDoc(item("invites", emailKey(clean)), {
        email: clean,
        role,
        invitedBy: user?.uid || null,
        createdAt: serverTimestamp(),
      });
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la invitación.");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (m: Member, newRole: Role) => {
    await updateDoc(item("members", m.id), { role: newRole });
  };

  const removeMember = async (m: Member) => {
    const self = m.id === user?.uid;
    const msg = self
      ? "Vas a quitarte a ti mismo del club y perderás el acceso de gestión. ¿Continuar?"
      : `¿Quitar a ${m.email} del club?`;
    if (window.confirm(msg)) {
      await deleteDoc(item("members", m.id));
    }
  };

  const removeInvite = async (inv: Invite) => {
    await deleteDoc(item("invites", inv.id));
  };

  return createPortal(
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
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          padding: "1.5rem",
          width: "100%",
          maxWidth: "520px",
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
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: C.gray400,
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        <h3
          style={{
            margin: "0 0 0.25rem 0",
            fontSize: "1.1rem",
            fontWeight: 900,
            color: C.navy900,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <UserCog size={18} color={C.amber} /> Miembros de {clubName}
        </h3>
        <p
          style={{
            margin: "0 0 1.25rem 0",
            fontSize: "0.8rem",
            color: C.gray500,
            lineHeight: 1.4,
          }}
        >
          Invita por correo. Cuando esa persona inicie sesión con ese correo,
          obtendrá automáticamente el rol asignado.
        </p>

        <form
          onSubmit={handleInvite}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <FormInput
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormSelect
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            style={{ width: "auto" }}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </FormSelect>
          <PrimaryButton
            type="submit"
            disabled={busy}
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
            }}
          >
            <UserPlus size={14} /> {busy ? "Enviando..." : "Invitar"}
          </PrimaryButton>
        </form>
        {error && (
          <p style={{ color: C.red, fontSize: "0.8rem", margin: "0 0 1rem" }}>
            {error}
          </p>
        )}

        <div style={{ fontSize: "0.7rem", color: C.gray500, marginBottom: "1rem" }}>
          {ROLES.map((r) => (
            <div key={r.value}>
              <strong style={{ color: C.gray700 }}>{r.label}:</strong>{" "}
              {r.description}
            </div>
          ))}
        </div>

        <SectionTitle>Miembros ({members.length})</SectionTitle>
        {members.length === 0 && (
          <EmptyRow>Todavía no hay miembros con acceso.</EmptyRow>
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
              onChange={(e) => changeRole(m, e.target.value as Role)}
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

        <SectionTitle style={{ marginTop: "1.25rem" }}>
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
            <IconButton title="Cancelar invitación" onClick={() => removeInvite(inv)}>
              <Trash2 size={14} />
            </IconButton>
          </Row>
        ))}
      </div>
    </div>,
    document.body,
  );
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
      padding: "0.6rem 0.75rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray200}`,
      backgroundColor: C.gray50,
      marginBottom: "0.4rem",
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
