const ROLE_LABELS: Record<string, string> = {
  admin: "Presidente",
  dt: "D. Técnico",
  tesorero: "Tesorero",
  prensa: "Prensa",
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role] || "Administración";
}

export function inviteEmailHtml(opts: {
  kind: "signup" | "accept";
  clubName: string;
  role: string;
  actionUrl: string;
  declineUrl?: string;
}) {
  const role = roleLabel(opts.role);
  const button = (href: string, label: string, dark = true) =>
    `<a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px;${
      dark
        ? "background:#121212;color:#fff;"
        : "background:#fff;color:#121212;border:1px solid #e5dfd3;"
    }">${label}</a>`;

  if (opts.kind === "signup") {
    return `
      <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
        <p>Te invitaron a <strong>${escapeHtml(opts.clubName)}</strong> como <strong>${escapeHtml(role)}</strong>.</p>
        <p>Todavía no tienes cuenta. Crea una con este mismo correo para unirte al club.</p>
        <p style="margin:24px 0">${button(opts.actionUrl, "Crear cuenta")}</p>
        <p style="font-size:12px;color:#736d63">Si no esperabas este correo, puedes ignorarlo.</p>
      </div>
    `;
  }

  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      <p>Te invitaron a administrar <strong>${escapeHtml(opts.clubName)}</strong> como <strong>${escapeHtml(role)}</strong>.</p>
      <p>Confirma si aceptas ese rol en el club.</p>
      <p style="margin:24px 0;display:flex;gap:10px;flex-wrap:wrap">
        ${button(opts.actionUrl, "Aceptar rol")}
        ${opts.declineUrl ? button(opts.declineUrl, "Rechazar", false) : ""}
      </p>
      <p style="font-size:12px;color:#736d63">Si no esperabas este correo, rechaza la invitación.</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY no está configurada; el correo no se envió.");
    return false;
  }
  const from =
    process.env.MAIL_FROM || "Orínco Futbol 7 <beth.t@example.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", res.status, body);
    return false;
  }
  return true;
}
