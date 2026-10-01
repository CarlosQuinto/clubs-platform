import nodemailer from "nodemailer";

const ROLE_LABELS: Record<string, string> = {
  admin: "Presidente",
  dt: "D. Técnico",
  tesorero: "Tesorero",
  prensa: "Prensa",
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role] || "Administración";
}

function mailButton(href: string, label: string, dark = true) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px;${
    dark
      ? "background:#121212;color:#fff;"
      : "background:#fff;color:#121212;border:1px solid #e5dfd3;"
  }">${escapeHtml(label)}</a>`;
}

function mailClose(platformName: string) {
  return `
      <p>Si no esperabas este correo, puedes ignorarlo.</p>
      <p>Gracias,</p>
      <p>El equipo de ${platformName}</p>
  `;
}

export function inviteEmailHtml(opts: {
  kind: "signup" | "accept";
  platformName: string;
  clubName: string;
  role: string;
  actionUrl: string;
  declineUrl?: string;
}) {
  const role = escapeHtml(roleLabel(opts.role));
  const clubName = escapeHtml(opts.clubName);
  const platformName = escapeHtml(opts.platformName);
  const body =
    opts.kind === "signup"
      ? `
      <p>Hola:</p>
      <p>Te invitaron a <strong>${clubName}</strong> como <strong>${role}</strong> en <strong>${platformName}</strong>.</p>
      <p>Todavía no tienes cuenta. Créala con este mismo correo para unirte al club.</p>
      <p style="margin:24px 0">${mailButton(opts.actionUrl, "Crear cuenta")}</p>
    `
      : `
      <p>Hola:</p>
      <p>Te invitaron a administrar <strong>${clubName}</strong> como <strong>${role}</strong> en <strong>${platformName}</strong>.</p>
      <p style="margin:24px 0">
        ${mailButton(opts.actionUrl, "Aceptar rol")}
        ${opts.declineUrl ? ` ${mailButton(opts.declineUrl, "Rechazar", false)}` : ""}
      </p>
    `;

  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      ${body}
      ${mailClose(platformName)}
    </div>
  `;
}

export function inviteEmailText(opts: {
  kind: "signup" | "accept";
  platformName: string;
  clubName: string;
  role: string;
  actionUrl: string;
  declineUrl?: string;
}) {
  const role = roleLabel(opts.role);
  const intro =
    opts.kind === "signup"
      ? [
          `Te invitaron a ${opts.clubName} como ${role} en ${opts.platformName}.`,
          "",
          "Todavía no tienes cuenta. Créala con este mismo correo para unirte al club.",
          "",
          "Crear cuenta:",
          opts.actionUrl,
        ]
      : [
          `Te invitaron a administrar ${opts.clubName} como ${role} en ${opts.platformName}.`,
          "",
          "Aceptar rol:",
          opts.actionUrl,
          ...(opts.declineUrl ? ["", "Rechazar:", opts.declineUrl] : []),
        ];

  return [
    "Hola:",
    "",
    ...intro,
    "",
    "Si no esperabas este correo, puedes ignorarlo.",
    "",
    "Gracias,",
    "",
    `El equipo de ${opts.platformName}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function passwordResetEmailHtml(opts: {
  platformName: string;
  email: string;
  actionUrl: string;
}) {
  const platformName = escapeHtml(opts.platformName);
  const email = escapeHtml(opts.email);
  const actionUrl = escapeHtml(opts.actionUrl);
  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      <p>Hola:</p>
      <p>Sigue este enlace para restablecer la contraseña de <strong>${platformName}</strong> asociada a tu cuenta ${email}.</p>
      <p style="margin:24px 0">
        <a href="${actionUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px;background:#121212;color:#fff;">Restablecer contraseña</a>
      </p>
      <p>Si no has solicitado restablecer tu contraseña, puedes ignorar este correo electrónico.</p>
      <p>Gracias,</p>
      <p>El equipo de ${platformName}</p>
    </div>
  `;
}

export function passwordResetEmailText(opts: {
  platformName: string;
  email: string;
  actionUrl: string;
}) {
  return [
    "Hola:",
    "",
    `Sigue este enlace para restablecer la contraseña de ${opts.platformName} asociada a tu cuenta ${opts.email}.`,
    "",
    "Restablecer contraseña:",
    opts.actionUrl,
    "",
    "Si no has solicitado restablecer tu contraseña, puedes ignorar este correo electrónico.",
    "",
    "Gracias,",
    "",
    `El equipo de ${opts.platformName}`,
  ].join("\n");
}

export function teamApprovedEmailHtml(opts: {
  kind: "signup" | "accept";
  platformName: string;
  teamName: string;
  captainName: string;
  actionUrl: string;
}) {
  const platformName = escapeHtml(opts.platformName);
  const teamName = escapeHtml(opts.teamName);
  const captain = escapeHtml(opts.captainName);
  const hello = captain ? `Hola ${captain}:` : "Hola:";
  const body =
    opts.kind === "signup"
      ? `
      <p>${hello}</p>
      <p>Aprobamos el registro de <strong>${teamName}</strong>. Eres el presidente del club.</p>
      <p>Todavía no tienes cuenta. Créala con este mismo correo para administrarlo.</p>
      <p style="margin:24px 0">${mailButton(opts.actionUrl, "Crear cuenta")}</p>
    `
      : `
      <p>${hello}</p>
      <p>Aprobamos el registro de <strong>${teamName}</strong>. Entra para confirmar que administras el club como presidente.</p>
      <p style="margin:24px 0">${mailButton(opts.actionUrl, "Aceptar presidencia")}</p>
    `;
  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      ${body}
      ${mailClose(platformName)}
    </div>
  `;
}

export function teamApprovedEmailText(opts: {
  kind: "signup" | "accept";
  platformName: string;
  teamName: string;
  captainName: string;
  actionUrl: string;
}) {
  const hello = opts.captainName ? `Hola ${opts.captainName}:` : "Hola:";
  const lines =
    opts.kind === "signup"
      ? [
          `Aprobamos el registro de ${opts.teamName}. Eres el presidente del club.`,
          "",
          "Todavía no tienes cuenta. Créala con este mismo correo para administrarlo.",
          "",
          "Crear cuenta:",
          opts.actionUrl,
        ]
      : [
          `Aprobamos el registro de ${opts.teamName}. Entra para confirmar que administras el club como presidente.`,
          "",
          "Aceptar presidencia:",
          opts.actionUrl,
        ];
  return [
    hello,
    "",
    ...lines,
    "",
    "Si no esperabas este correo, puedes ignorarlo.",
    "",
    "Gracias,",
    "",
    `El equipo de ${opts.platformName}`,
  ].join("\n");
}

export function teamRejectedEmailHtml(opts: {
  platformName: string;
  teamName: string;
  captainName: string;
  actionUrl: string;
  whatsapp?: string;
}) {
  const platformName = escapeHtml(opts.platformName);
  const teamName = escapeHtml(opts.teamName);
  const captain = escapeHtml(opts.captainName);
  const hello = captain ? `Hola ${captain}:` : "Hola:";
  const contact = opts.whatsapp
    ? `o comunicarte por WhatsApp al ${escapeHtml(opts.whatsapp)} para más información.`
    : "o comunicarte a nuestros teléfonos de contacto para más información.";
  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      <p>${hello}</p>
      <p>Revisamos la solicitud de <strong>${teamName}</strong> en <strong>${platformName}</strong> y por ahora no quedó registrada.</p>
      <p>Si quieres, puedes enviar una nueva solicitud ${contact}</p>
      <p style="margin:24px 0">${mailButton(opts.actionUrl, "Registrar equipo")}</p>
      <p>Gracias,</p>
      <p>El equipo de ${platformName}</p>
    </div>
  `;
}

export function teamRejectedEmailText(opts: {
  platformName: string;
  teamName: string;
  captainName: string;
  actionUrl: string;
  whatsapp?: string;
}) {
  const hello = opts.captainName ? `Hola ${opts.captainName}:` : "Hola:";
  const contact = opts.whatsapp
    ? `o comunicarte por WhatsApp al ${opts.whatsapp} para más información.`
    : "o comunicarte a nuestros teléfonos de contacto para más información.";
  return [
    hello,
    "",
    `Revisamos la solicitud de ${opts.teamName} en ${opts.platformName} y por ahora no quedó registrada.`,
    "",
    `Si quieres, puedes enviar una nueva solicitud ${contact}`,
    "",
    "Registrar equipo:",
    opts.actionUrl,
    "",
    "Gracias,",
    "",
    `El equipo de ${opts.platformName}`,
  ].join("\n");
}

export function enrollmentEmailHtml(opts: {
  platformName: string;
  clubName: string;
  tournamentName: string;
  startDate: string;
  actionUrl: string;
}) {
  const platformName = escapeHtml(opts.platformName);
  const clubName = escapeHtml(opts.clubName);
  const tournamentName = escapeHtml(opts.tournamentName);
  const start = escapeHtml(opts.startDate || "la fecha indicada en el torneo");
  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      <p>Hola:</p>
      <p><strong>${clubName}</strong> quedó inscrito en <strong>${tournamentName}</strong>, que inicia el ${start}.</p>
      <p>Hace falta la disponibilidad del equipo: los días y el rango de horas en que pueden jugar.</p>
      <p style="margin:24px 0">${mailButton(opts.actionUrl, "Cargar disponibilidad")}</p>
      ${mailClose(platformName)}
    </div>
  `;
}

export function enrollmentEmailText(opts: {
  platformName: string;
  clubName: string;
  tournamentName: string;
  startDate: string;
  actionUrl: string;
}) {
  return [
    `Hola:`,
    ``,
    `${opts.clubName} quedó inscrito en ${opts.tournamentName}, que inicia el ${opts.startDate || "la fecha indicada en el torneo"}.`,
    ``,
    `Hace falta la disponibilidad del equipo: los días y el rango de horas en que pueden jugar.`,
    ``,
    opts.actionUrl,
    ``,
    `Gracias,`,
    ``,
    `El equipo de ${opts.platformName}`,
  ].join("\n");
}

export function scheduleEmailHtml(opts: {
  platformName: string;
  clubName: string;
  rivalName: string;
  tournamentName: string;
  when: string;
  venue: string;
  previous?: string;
}) {
  const platformName = escapeHtml(opts.platformName);
  const intro = opts.previous
    ? `<p>Se reprogramó el partido de <strong>${escapeHtml(opts.clubName)}</strong> contra <strong>${escapeHtml(opts.rivalName)}</strong> en <strong>${escapeHtml(opts.tournamentName)}</strong>.</p>
       <p>Antes: ${escapeHtml(opts.previous)}</p>
       <p>Ahora: <strong>${escapeHtml(opts.when)}</strong>${opts.venue ? ` · ${escapeHtml(opts.venue)}` : ""}</p>`
    : `<p>Quedó calendarizado el partido de <strong>${escapeHtml(opts.clubName)}</strong> contra <strong>${escapeHtml(opts.rivalName)}</strong> en <strong>${escapeHtml(opts.tournamentName)}</strong>.</p>
       <p><strong>${escapeHtml(opts.when)}</strong>${opts.venue ? ` · ${escapeHtml(opts.venue)}` : ""}</p>`;
  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#292621;line-height:1.5;max-width:520px">
      <p>Hola:</p>
      ${intro}
      ${mailClose(platformName)}
    </div>
  `;
}

export function scheduleEmailText(opts: {
  platformName: string;
  clubName: string;
  rivalName: string;
  tournamentName: string;
  when: string;
  venue: string;
  previous?: string;
}) {
  const place = opts.venue ? ` · ${opts.venue}` : "";
  const body = opts.previous
    ? [
        `Se reprogramó el partido de ${opts.clubName} contra ${opts.rivalName} en ${opts.tournamentName}.`,
        ``,
        `Antes: ${opts.previous}`,
        `Ahora: ${opts.when}${place}`,
      ]
    : [
        `Quedó calendarizado el partido de ${opts.clubName} contra ${opts.rivalName} en ${opts.tournamentName}.`,
        ``,
        `${opts.when}${place}`,
      ];
  return [...body, ``, `Gracias,`, ``, `El equipo de ${opts.platformName}`].join("\n");
}

export function gmailConfigured() {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

export async function sendGmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName: string;
}): Promise<boolean> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) {
    console.warn("GMAIL_USER o GMAIL_APP_PASSWORD no están configurados; el correo no se envió.");
    return false;
  }
  const message = {
    from: `"${opts.fromName.replace(/"/g, "")}" <${user}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  };
  const attempts = [
    { port: 465, secure: true },
    { port: 587, secure: false },
  ];
  for (const attempt of attempts) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: attempt.port,
      secure: attempt.secure,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
    try {
      await transporter.sendMail(message);
      return true;
    } catch (err) {
      console.error(`Gmail SMTP ${attempt.port} error:`, err);
    } finally {
      transporter.close();
    }
  }
  return false;
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
