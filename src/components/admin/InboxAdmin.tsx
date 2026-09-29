import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Check, Inbox, Mail, Trash2, UserPlus, X } from "lucide-react";
import ConfirmModal from "../ConfirmModal";
import Field from "./Field";
import { useAuth } from "../../context/AuthContext";
import { usePlatformCatalog } from "../../hooks/usePlatformCatalog";
import {
  DEFAULT_CLUB_DESCRIPTION,
  DEFAULT_HERO_IMAGE,
} from "../../lib/clubDefaults";
import {
  clubDocRef,
  clubItemRef,
  emailKey,
  inquiryRef,
  inquiriesCol,
  normalizeSlug,
  RESERVED_SLUGS,
  teamApplicationRef,
  teamApplicationsCol,
} from "../../lib/paths";
import { whatsappUrl } from "../../lib/social";
import { markSignupInvite } from "../../lib/signupInvite";
import InviteSignupLink from "../platform/InviteSignupLink";
import type { Inquiry, TeamApplication } from "../../lib/types";
import {
  Badge,
  C,
  FormSelect,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../ui";

function asTime(value: Inquiry["createdAt"]) {
  const date = value && typeof value.toDate === "function" ? value.toDate() : null;
  return date ? date.getTime() : 0;
}

function formatWhen(value: Inquiry["createdAt"]) {
  const date = value && typeof value.toDate === "function" ? value.toDate() : null;
  if (!date) return "";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InboxAdmin() {
  const { user } = useAuth();
  const { localities } = usePlatformCatalog();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [busyId, setBusyId] = useState("");
  const [approveId, setApproveId] = useState<string | null>(null);
  const [localityId, setLocalityId] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [lastApproved, setLastApproved] = useState<{
    email: string;
    clubId: string;
  } | null>(null);

  useEffect(() => {
    const unsubInq = onSnapshot(inquiriesCol(), (snap) => {
      const list = snap.docs.map(
        (d) => ({ id: d.id, status: "new", ...d.data() }) as Inquiry,
      );
      list.sort((a, b) => asTime(b.createdAt) - asTime(a.createdAt));
      setInquiries(list);
    });
    const unsubApp = onSnapshot(teamApplicationsCol(), (snap) => {
      const list = snap.docs.map(
        (d) =>
          ({ id: d.id, status: "pending", ...d.data() }) as TeamApplication,
      );
      list.sort((a, b) => asTime(b.createdAt) - asTime(a.createdAt));
      setApplications(list);
    });
    return () => {
      unsubInq();
      unsubApp();
    };
  }, []);

  const pending = useMemo(
    () => applications.filter((a) => a.status === "pending"),
    [applications],
  );
  const reviewed = useMemo(
    () => applications.filter((a) => a.status !== "pending"),
    [applications],
  );
  const newMail = useMemo(
    () => inquiries.filter((i) => i.status !== "done"),
    [inquiries],
  );
  const doneMail = useMemo(
    () => inquiries.filter((i) => i.status === "done"),
    [inquiries],
  );
  const toApprove = pending.find((a) => a.id === approveId) || null;
  const toReject = pending.find((a) => a.id === rejectId) || null;

  const uniqueSlug = async (teamName: string) => {
    const base = normalizeSlug(teamName) || "equipo";
    let slug = base;
    let n = 2;
    while (
      RESERVED_SLUGS.includes(slug) ||
      (await getDoc(clubDocRef(slug))).exists()
    ) {
      slug = `${base}-${n++}`;
    }
    return slug;
  };

  const confirmApprove = async () => {
    if (!toApprove || !user) return;
    if (!localityId) return;
    const localityName =
      localities.find((l) => l.id === localityId)?.name || "";
    try {
      setBusyId(toApprove.id);
      const slug = await uniqueSlug(toApprove.teamName);
      await setDoc(clubDocRef(slug), {
        slug,
        name: toApprove.teamName.trim(),
        localityId,
        location: localityName,
        description: DEFAULT_CLUB_DESCRIPTION,
        heroImages: [DEFAULT_HERO_IMAGE],
        defaultLineups: {},
        presidentPhone: toApprove.captainPhone.trim(),
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      const captainEmail = toApprove.captainEmail.trim().toLowerCase();
      await setDoc(
        clubItemRef(slug, "invites", emailKey(captainEmail)),
        {
          email: captainEmail,
          role: "admin",
          invitedBy: user.uid,
          createdAt: serverTimestamp(),
        },
      );
      await markSignupInvite(captainEmail, { clubId: slug });
      await updateDoc(teamApplicationRef(toApprove.id), {
        status: "approved",
        clubId: slug,
        reviewedAt: serverTimestamp(),
      });
      setLastApproved({ email: captainEmail, clubId: slug });
      setApproveId(null);
      setLocalityId("");
    } catch (err) {
      console.error(err);
      alert("No se pudo aprobar el equipo.");
    } finally {
      setBusyId("");
    }
  };

  const confirmReject = async () => {
    if (!toReject) return;
    try {
      setBusyId(toReject.id);
      await updateDoc(teamApplicationRef(toReject.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });
      setRejectId(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo rechazar la solicitud.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {lastApproved && (
        <SectionCard title="URL para el capitán" icon={<UserPlus size={16} color={C.amber} />}>
          <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: C.gray600 }}>
            Club creado en /{lastApproved.clubId}. Envíale esta URL para que cree su cuenta.
          </p>
          <InviteSignupLink email={lastApproved.email} />
        </SectionCard>
      )}
      <SectionCard
        title={`Equipos pendientes (${pending.length})`}
        icon={<UserPlus size={16} color={C.amber} />}
      >
        {pending.length === 0 ? (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
            No hay solicitudes de equipo.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pending.map((app) => (
              <article key={app.id} style={stackCard}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: C.navy900 }}>
                    {app.teamName}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: C.gray600, marginTop: 4 }}>
                    Capitán: {app.captainName}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.15rem 0.65rem",
                      fontSize: "0.75rem",
                      color: C.gray500,
                      marginTop: 4,
                    }}
                  >
                    <span>{app.captainEmail}</span>
                    <a
                      href={whatsappUrl(app.captainPhone)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: C.navy900, fontWeight: 700 }}
                    >
                      {app.captainPhone}
                    </a>
                  </div>
                  {formatWhen(app.createdAt) && (
                    <div style={{ fontSize: "0.7rem", color: C.gray400, marginTop: 4 }}>
                      {formatWhen(app.createdAt)}
                    </div>
                  )}
                </div>
                <div style={actionRow}>
                  <PrimaryButton
                    type="button"
                    variant="green"
                    disabled={busyId === app.id}
                    onClick={() => {
                      setLocalityId(localities[0]?.id || "");
                      setApproveId(app.id);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Check size={14} /> Aprobar
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    disabled={busyId === app.id}
                    onClick={() => setRejectId(app.id)}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <X size={14} /> Rechazar
                  </SecondaryButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={`Mensajes (${newMail.length})`}
        icon={<Mail size={16} color={C.amber} />}
      >
        {newMail.length === 0 ? (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
            No hay mensajes nuevos.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {newMail.map((item) => (
              <article key={item.id} style={stackCard}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: C.navy900 }}>{item.name}</div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.15rem 0.65rem",
                      fontSize: "0.75rem",
                      color: C.gray500,
                      marginTop: 4,
                    }}
                  >
                    <span>{item.email}</span>
                    <a
                      href={whatsappUrl(item.phone)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: C.navy900, fontWeight: 700 }}
                    >
                      {item.phone}
                    </a>
                    {item.topic && <span>{item.topic}</span>}
                  </div>
                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      fontSize: "0.85rem",
                      color: C.gray700,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.message}
                  </p>
                  {formatWhen(item.createdAt) && (
                    <div style={{ fontSize: "0.7rem", color: C.gray400, marginTop: 6 }}>
                      {formatWhen(item.createdAt)}
                    </div>
                  )}
                </div>
                <div style={actionRow}>
                  <SecondaryButton
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => {
                      setBusyId(item.id);
                      void updateDoc(inquiryRef(item.id), { status: "done" }).finally(
                        () => setBusyId(""),
                      );
                    }}
                  >
                    Atendido
                  </SecondaryButton>
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={busyId === item.id}
                    onClick={() => {
                      setBusyId(item.id);
                      void deleteDoc(inquiryRef(item.id)).finally(() => setBusyId(""));
                    }}
                    style={iconBtn}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {(reviewed.length > 0 || doneMail.length > 0) && (
        <SectionCard
          title="Historial"
          icon={<Inbox size={16} color={C.amber} />}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {reviewed.map((app) => (
              <div key={app.id} style={historyRow}>
                <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
                  <span style={{ fontWeight: 800 }}>{app.teamName}</span>
                  <span style={{ color: C.gray500, fontSize: "0.75rem" }}>
                    {" "}
                    · {app.captainName}
                    {app.clubId ? ` · /${app.clubId}` : ""}
                  </span>
                </div>
                <Badge color={app.status === "approved" ? "green" : "gray"}>
                  {app.status === "approved" ? "Aprobado" : "Rechazado"}
                </Badge>
              </div>
            ))}
            {doneMail.map((item) => (
              <div key={item.id} style={historyRow}>
                <div style={{ flex: "1 1 12rem", minWidth: 0, fontSize: "0.8rem", color: C.gray600 }}>
                  <strong>{item.name}</strong> · {item.email}
                </div>
                <Badge color="gray">Atendido</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <ConfirmModal
        open={!!toApprove}
        title={`Aprobar ${toApprove?.teamName || "equipo"}`}
        message="Se creará el club. Envíale al capitán la URL para que cree su cuenta de presidente."
        confirmLabel="Aprobar y crear"
        confirmDisabled={!localityId || !!busyId}
        busy={!!busyId}
        onCancel={() => {
          if (busyId) return;
          setApproveId(null);
        }}
        onConfirm={() => void confirmApprove()}
      >
        <Field label="Localidad">
          <FormSelect
            value={localityId}
            onChange={(e) => setLocalityId(e.target.value)}
            required
          >
            <option value="">Selecciona...</option>
            {localities.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </FormSelect>
        </Field>
      </ConfirmModal>

      <ConfirmModal
        open={!!toReject}
        title="Rechazar solicitud"
        message={`¿Rechazar a ${toReject?.teamName || "este equipo"}?`}
        confirmLabel="Rechazar"
        danger
        busy={!!busyId}
        onCancel={() => {
          if (busyId) return;
          setRejectId(null);
        }}
        onConfirm={() => void confirmReject()}
      />
    </div>
  );
}

const stackCard: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.7rem",
  padding: "0.9rem 1rem",
  border: `1px solid ${C.gray200}`,
  borderRadius: RADIUS.lg,
  backgroundColor: C.gray50,
};

const actionRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
};

const historyRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.5rem",
  padding: "0.7rem 0.85rem",
  border: `1px solid ${C.gray200}`,
  borderRadius: RADIUS.lg,
  backgroundColor: C.gray50,
};

const iconBtn: CSSProperties = {
  border: `1px solid ${C.gray200}`,
  background: C.white,
  color: C.red,
  borderRadius: RADIUS.md,
  width: 36,
  height: 36,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
