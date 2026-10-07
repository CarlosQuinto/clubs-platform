import pg from "pg";
import { FnError } from "./errors.js";

/**
 * Acceso a Postgres con el rol api_service. Cada función traduce una operación del antiguo conector
 * `functions` (dataconnect/functions/functions.gql) a SQL plano y devuelve la misma forma que
 * esperaban index.ts/notices.ts. Las relaciones son columnas `<campo>_id` (db/migrations/0001_schema.sql).
 */
export const DEFAULT_PLATFORM_NAME = "Clubs Platform";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
});

pool.on("error", (err) => {
  console.error("Error en una conexión inactiva de Postgres:", err);
});

async function query<Row extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<Row>(text, params);
  return result.rows;
}

async function first<Row extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const rows = await query<Row>(text, params);
  return rows[0] ?? null;
}

export async function closePool() {
  await pool.end();
}

// ---------- FunctionsAdminGate ----------

export type AdminGate = {
  platformAdmin: { email: string } | null;
  clubMember: { role: string; club: { deletedAt: string | null } } | null;
};

export async function adminGate(userId: string, clubId: string): Promise<AdminGate> {
  const [admin, member] = await Promise.all([
    first<{ email: string }>("SELECT email FROM platform_admins WHERE user_id = $1", [userId]),
    clubId
      ? first<{ role: string; deleted_at: string | null }>(
          `SELECT cm.role::text AS role, c.deleted_at::text AS deleted_at
             FROM club_members cm
             JOIN clubs c ON c.id = cm.club_id
            WHERE cm.club_id = $1 AND cm.user_id = $2`,
          [clubId, userId],
        )
      : Promise.resolve(null),
  ]);
  return {
    platformAdmin: admin ? { email: admin.email } : null,
    clubMember: member ? { role: member.role, club: { deletedAt: member.deleted_at } } : null,
  };
}

export async function assertSuperAdmin(uid: string, message = "Solo un superadmin puede hacer esto.") {
  const gate = await adminGate(uid, "");
  if (!gate.platformAdmin) throw new FnError("permission-denied", message);
}

export async function assertClubAdmin(uid: string, clubId: string) {
  const gate = await adminGate(uid, clubId);
  if (gate.platformAdmin) return;
  // Un club eliminado (borrado lógico) ya no da permisos a sus miembros.
  if (gate.clubMember?.role === "ADMIN" && !gate.clubMember.club.deletedAt) return;
  throw new FnError("permission-denied", "Solo el presidente o un superadmin puede invitar.");
}

// ---------- MailBrand ----------

export async function platformBrand() {
  const settings = await first<{ name: string | null; whatsapp: string | null }>(
    "SELECT name, whatsapp FROM platform_settings WHERE id = 'config'",
  );
  return {
    name: settings?.name?.trim() || DEFAULT_PLATFORM_NAME,
    whatsapp: settings?.whatsapp?.trim() || "",
  };
}

// ---------- ClubMailInfo ----------

export type ClubMailInfo = { id: string; name: string; slug: string; deletedAt: string | null };

export async function clubMailInfo(clubId: string): Promise<ClubMailInfo | null> {
  const row = await first<{ id: string; name: string; slug: string; deleted_at: string | null }>(
    "SELECT id, name, slug, deleted_at::text AS deleted_at FROM clubs WHERE id = $1",
    [clubId],
  );
  return row ? { id: row.id, name: row.name, slug: row.slug, deletedAt: row.deleted_at } : null;
}

// ---------- TeamApplicationMail ----------

export type TeamApplicationMail = {
  teamName: string;
  captainName: string;
  captainEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  slug: string | null;
  club: { id: string; slug: string } | null;
};

export async function teamApplicationMail(id: string): Promise<TeamApplicationMail | null> {
  const row = await first<{
    team_name: string;
    captain_name: string;
    captain_email: string;
    status: TeamApplicationMail["status"];
    slug: string | null;
    club_id: string | null;
    club_slug: string | null;
  }>(
    `SELECT ta.team_name, ta.captain_name, ta.captain_email, ta.status::text AS status, ta.slug,
            c.id AS club_id, c.slug AS club_slug
       FROM team_applications ta
       LEFT JOIN clubs c ON c.id = ta.club_id
      WHERE ta.id = $1`,
    [id],
  );
  if (!row) return null;
  return {
    teamName: row.team_name,
    captainName: row.captain_name,
    captainEmail: row.captain_email,
    status: row.status,
    slug: row.slug,
    club: row.club_id ? { id: row.club_id, slug: row.club_slug || "" } : null,
  };
}

// ---------- PlatformAdminInviteMail ----------

export async function platformAdminInviteMail(emailKey: string) {
  return first<{ email: string }>("SELECT email FROM platform_admin_invites WHERE email_key = $1", [
    emailKey,
  ]);
}

// ---------- Destinatarios (Presidentes) ----------

export type NoticeClub = {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  clubMembers_on_club: { email: string }[];
  clubInvites_on_club: { email: string }[];
};

/** Correos de los Presidentes; si nadie aceptó aún, los de sus invitaciones. */
export function presidentEmails(club: NoticeClub) {
  // A un club eliminado ya no se le envían avisos.
  if (club.deletedAt) return [];
  const clean = (rows: { email: string }[]) => [
    ...new Set(
      rows.map((row) => row.email.trim().toLowerCase()).filter((email) => email.includes("@")),
    ),
  ];
  const members = clean(club.clubMembers_on_club);
  return members.length ? members : clean(club.clubInvites_on_club);
}

/** Miembros e invitaciones con rol ADMIN de cada club (equivale a `clubMembers_on_club(where: { role: { eq: ADMIN } })`). */
async function adminRecipients(clubIds: string[]) {
  const members = new Map<string, { email: string }[]>();
  const invites = new Map<string, { email: string }[]>();
  if (!clubIds.length) return { members, invites };
  const [memberRows, inviteRows] = await Promise.all([
    query<{ club_id: string; email: string }>(
      "SELECT club_id, email FROM club_members WHERE role = 'ADMIN' AND club_id = ANY($1::text[])",
      [clubIds],
    ),
    query<{ club_id: string; email: string }>(
      "SELECT club_id, email FROM club_invites WHERE role = 'ADMIN' AND club_id = ANY($1::text[])",
      [clubIds],
    ),
  ]);
  for (const row of memberRows) {
    members.set(row.club_id, [...(members.get(row.club_id) ?? []), { email: row.email }]);
  }
  for (const row of inviteRows) {
    invites.set(row.club_id, [...(invites.get(row.club_id) ?? []), { email: row.email }]);
  }
  return { members, invites };
}

// ---------- MatchScheduleNotice ----------

export type MatchScheduleNotice = {
  match: {
    id: string;
    matchDate: string | null;
    startTime: string | null;
    venue: string;
    status: string;
    scheduleNoticeKey: string | null;
    court: { id: string; name: string } | null;
    tournament: { name: string };
    homeClub: NoticeClub;
    awayClub: NoticeClub;
  } | null;
  courts: { id: string; name: string }[];
};

export async function matchScheduleNotice(matchId: string): Promise<MatchScheduleNotice> {
  const [row, courts] = await Promise.all([
    first<{
      id: string;
      match_date: string | null;
      start_time: string | null;
      venue: string;
      status: string;
      schedule_notice_key: string | null;
      court_id: string | null;
      court_name: string | null;
      tournament_name: string;
      home_id: string;
      home_name: string;
      home_slug: string;
      home_deleted_at: string | null;
      away_id: string;
      away_name: string;
      away_slug: string;
      away_deleted_at: string | null;
    }>(
      `SELECT m.id, m.match_date::text AS match_date, m.start_time, m.venue, m.status::text AS status,
              m.schedule_notice_key, m.court_id, co.name AS court_name, t.name AS tournament_name,
              h.id AS home_id, h.name AS home_name, h.slug AS home_slug, h.deleted_at::text AS home_deleted_at,
              a.id AS away_id, a.name AS away_name, a.slug AS away_slug, a.deleted_at::text AS away_deleted_at
         FROM matches m
         JOIN tournaments t ON t.id = m.tournament_id
         JOIN clubs h ON h.id = m.home_club_id
         JOIN clubs a ON a.id = m.away_club_id
         LEFT JOIN courts co ON co.id = m.court_id
        WHERE m.id = $1`,
      [matchId],
    ),
    query<{ id: string; name: string }>("SELECT id, name FROM courts"),
  ]);
  if (!row) return { match: null, courts };
  const { members, invites } = await adminRecipients([row.home_id, row.away_id]);
  const club = (id: string, name: string, slug: string, deletedAt: string | null): NoticeClub => ({
    id,
    name,
    slug,
    deletedAt,
    clubMembers_on_club: members.get(id) ?? [],
    clubInvites_on_club: invites.get(id) ?? [],
  });
  return {
    match: {
      id: row.id,
      matchDate: row.match_date,
      startTime: row.start_time,
      venue: row.venue,
      status: row.status,
      scheduleNoticeKey: row.schedule_notice_key,
      court: row.court_id ? { id: row.court_id, name: row.court_name || "" } : null,
      tournament: { name: row.tournament_name },
      homeClub: club(row.home_id, row.home_name, row.home_slug, row.home_deleted_at),
      awayClub: club(row.away_id, row.away_name, row.away_slug, row.away_deleted_at),
    },
    courts,
  };
}

// ---------- MarkMatchScheduleNotice ----------

export async function markMatchScheduleNotice(matchId: string, key: string) {
  return first<{ id: string }>(
    `UPDATE matches
        SET schedule_notice_key = NULLIF($2, '')
      WHERE id = $1
      RETURNING id`,
    [matchId, key],
  );
}

// ---------- TournamentEnrollmentNotice ----------

export type TournamentEnrollmentNotice = {
  name: string;
  startDate: string | null;
  clubs: NoticeClub[];
};

export async function tournamentEnrollmentNotice(
  tournamentId: string,
): Promise<TournamentEnrollmentNotice | null> {
  const tournament = await first<{ name: string; start_date: string | null }>(
    "SELECT name, start_date::text AS start_date FROM tournaments WHERE id = $1",
    [tournamentId],
  );
  if (!tournament) return null;
  const rows = await query<{ id: string; name: string; slug: string; deleted_at: string | null }>(
    `SELECT c.id, c.name, c.slug, c.deleted_at::text AS deleted_at
       FROM tournament_clubs tc
       JOIN clubs c ON c.id = tc.club_id
      WHERE tc.tournament_id = $1`,
    [tournamentId],
  );
  const { members, invites } = await adminRecipients(rows.map((row) => row.id));
  return {
    name: tournament.name,
    startDate: tournament.start_date,
    clubs: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      deletedAt: row.deleted_at,
      clubMembers_on_club: members.get(row.id) ?? [],
      clubInvites_on_club: invites.get(row.id) ?? [],
    })),
  };
}

// ---------- HitRequestThrottle ----------

/** Suma un intento; si la ventana ya venció, vuelve a empezar en 1. Devuelve los intentos de la ventana actual. */
export async function hitRequestThrottle(id: string, windowSeconds: number) {
  const row = await first<{ id: string; hits: number }>(
    `INSERT INTO request_throttles (id, hits, window_start)
     VALUES ($1, 1, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE SET
       hits = CASE
         WHEN request_throttles.window_start < CURRENT_TIMESTAMP - make_interval(secs => $2::int)
         THEN 1 ELSE request_throttles.hits + 1 END,
       window_start = CASE
         WHEN request_throttles.window_start < CURRENT_TIMESTAMP - make_interval(secs => $2::int)
         THEN CURRENT_TIMESTAMP ELSE request_throttles.window_start END
     RETURNING id, hits`,
    [id.slice(0, 400), windowSeconds],
  );
  return Number(row?.hits ?? 0);
}

// ---------- RecordTournamentNotice ----------

/** Registra el aviso de inscripción; null si ya se había avisado a ese club. */
export async function recordTournamentNotice(tournamentId: string, clubId: string) {
  return first<{ id: string }>(
    `INSERT INTO tournament_notices (tournament_id, club_id, sent_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (tournament_id, club_id) DO NOTHING
     RETURNING club_id AS id`,
    [tournamentId, clubId],
  );
}

// ---------- Cuentas ----------

/**
 * Antes `auth.getUserByEmail`: si el correo ya tiene cuenta en GoTrue. auth.users tiene RLS sin políticas,
 * así que se consulta a través de api_user_exists (db/migrations/1014_fn_api.sql).
 */
export async function userExists(email: string) {
  const row = await first<{ ok: boolean }>("SELECT public.api_user_exists($1) AS ok", [email]);
  return row?.ok === true;
}
