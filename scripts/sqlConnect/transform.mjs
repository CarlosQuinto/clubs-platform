import { createHash } from "node:crypto";

const MEMBER_ROLES = new Set(["ADMIN", "DT", "PRENSA", "TESORERO"]);
const FOOTBALL = { 7: "FUT_7", 9: "FUT_9", 11: "FUT_11" };
const DURATIONS = new Set([30, 60, 90, 120]);

export const TABLE_TYPES = {
  localities: "Locality",
  categories: "Category",
  seasons: "Season",
  users: "User",
  platformSettings: "PlatformSettings",
  platformHeroImages: "PlatformHeroImage",
  courtOpenWindows: "CourtOpenWindow",
  platformAdmins: "PlatformAdmin",
  platformAdminInvites: "PlatformAdminInvite",
  clubs: "Club",
  clubHeroImages: "ClubHeroImage",
  clubAvailabilityWindows: "ClubAvailabilityWindow",
  clubDefaultLineups: "ClubDefaultLineup",
  clubMembers: "ClubMember",
  clubInvites: "ClubInvite",
  players: "Player",
  tournamentGroups: "TournamentGroup",
  tournaments: "Tournament",
  tournamentClubs: "TournamentClub",
  tournamentPodium: "TournamentPodium",
  tournamentNotices: "TournamentNotice",
  courts: "Court",
  matches: "Match",
  matchClubReports: "MatchClubReport",
  matchAttendees: "MatchAttendee",
  matchGoals: "MatchGoal",
  matchCards: "MatchCard",
  matchGoalkeepers: "MatchGoalkeeper",
  courtHolds: "CourtHold",
  clubEvents: "ClubEvent",
  clubEventAttendees: "ClubEventAttendee",
  clubEventGoals: "ClubEventGoal",
  clubEventCards: "ClubEventCard",
  clubEventGoalkeepers: "ClubEventGoalkeeper",
  clubEventPhotos: "ClubEventPhoto",
  transactions: "Transaction",
  financialGoals: "FinancialGoal",
  goalContributions: "GoalContribution",
  inventoryItems: "InventoryItem",
  albums: "Album",
  galleryPhotos: "GalleryPhoto",
  ads: "Ad",
  adPlacements: "AdPlacement",
  inquiries: "Inquiry",
  teamApplications: "TeamApplication",
  signupInvites: "SignupInvite",
  emailOutbox: "EmailOutbox",
};

export const TABLE_ORDER = [
  "localities",
  "categories",
  "seasons",
  "users",
  "platformSettings",
  "platformHeroImages",
  "courtOpenWindows",
  "platformAdmins",
  "platformAdminInvites",
  "clubs",
  "clubHeroImages",
  "clubAvailabilityWindows",
  "clubDefaultLineups",
  "clubMembers",
  "clubInvites",
  "players",
  "tournamentGroups",
  "tournaments",
  "tournamentClubs",
  "tournamentPodium",
  "tournamentNotices",
  "courts",
  "matches",
  "matchClubReports",
  "matchAttendees",
  "matchGoals",
  "matchCards",
  "matchGoalkeepers",
  "courtHolds",
  "clubEvents",
  "clubEventAttendees",
  "clubEventGoals",
  "clubEventCards",
  "clubEventGoalkeepers",
  "clubEventPhotos",
  "transactions",
  "financialGoals",
  "goalContributions",
  "inventoryItems",
  "albums",
  "galleryPhotos",
  "ads",
  "adPlacements",
  "inquiries",
  "teamApplications",
  "signupInvites",
  "emailOutbox",
];

function stableUuid(key) {
  const h = createHash("sha256").update(String(key)).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function timestamp(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (value && value.__type === "timestamp" && typeof value.value === "string") {
    return value.value;
  }
  return null;
}

function dateOnly(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function timeOnly(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function enumValue(value, map, fallback) {
  const key = typeof value === "string" ? value.trim() : value;
  if (map[key]) return map[key];
  const upper = typeof key === "string" ? key.toUpperCase() : "";
  if (map[upper]) return map[upper];
  return fallback;
}

function compact(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function entries(collection) {
  if (!collection || typeof collection !== "object") return [];
  return Object.entries(collection).map(([id, doc]) => {
    const data = doc && typeof doc === "object" ? doc : {};
    const { __collections, ...fields } = data;
    return { id, fields, sub: __collections || {} };
  });
}

function subEntries(parent, name) {
  return entries(parent.sub?.[name]);
}

export function transformExport(data) {
  const issues = [];
  const issue = (sourcePath, reason, payload = null) => {
    issues.push({ sourcePath, reason, payload });
  };

  const collections = data.collections || {};
  const tables = Object.fromEntries(TABLE_ORDER.map((name) => [name, []]));
  const userIds = new Set();
  const userEmails = new Set();

  const addUser = (id, email, displayName, updatedAt, sourcePath) => {
    if (!id || userIds.has(id)) return;
    let cleanEmail = text(email).trim().toLowerCase();
    if (!cleanEmail || userEmails.has(cleanEmail)) {
      issue(sourcePath, cleanEmail ? "correo de usuario repetido" : "usuario sin correo");
      cleanEmail = `import+${id}@local.invalid`;
    }
    userIds.add(id);
    userEmails.add(cleanEmail);
    tables.users.push(
      compact({
        id,
        email: cleanEmail,
        displayName: text(displayName),
        updatedAt: timestamp(updatedAt) || new Date(0).toISOString(),
      }),
    );
  };

  for (const doc of entries(collections.users)) {
    addUser(doc.id, doc.fields.email, doc.fields.displayName, doc.fields.updatedAt, `users/${doc.id}`);
  }

  for (const doc of entries(collections.localities)) {
    tables.localities.push(
      compact({
        id: doc.id,
        name: text(doc.fields.name, doc.id),
        createdAt: timestamp(doc.fields.createdAt),
      }),
    );
  }
  const localityIds = new Set(tables.localities.map((row) => row.id));

  for (const doc of entries(collections.categories)) {
    tables.categories.push({
      id: doc.id,
      name: text(doc.fields.name, doc.id),
      sortOrder: Number.isFinite(doc.fields.order) ? doc.fields.order : 0,
    });
  }
  const categoryIds = new Set(tables.categories.map((row) => row.id));

  for (const doc of entries(collections.seasons)) {
    tables.seasons.push(
      compact({
        id: doc.id,
        name: text(doc.fields.name, doc.id),
        startDate: dateOnly(doc.fields.startDate),
        endDate: dateOnly(doc.fields.endDate),
        active: doc.fields.active === true,
      }),
    );
  }
  const seasonIds = new Set(tables.seasons.map((row) => row.id));

  const platformDoc =
    entries(collections.platform).find((doc) => doc.id === "config") ||
    entries(collections.platform)[0];
  if (platformDoc) {
    const social = platformDoc.fields.social || {};
    const slot = platformDoc.fields.courtSlotMinutes === 30 ? 30 : 60;
    tables.platformSettings.push(
      compact({
        id: "config",
        name: text(platformDoc.fields.name),
        motto: text(platformDoc.fields.motto),
        headline: text(platformDoc.fields.headline),
        tagline: text(platformDoc.fields.tagline),
        logoUrl: text(platformDoc.fields.logoUrl) || null,
        instagram: text(social.instagram) || null,
        facebook: text(social.facebook) || null,
        x: text(social.x) || null,
        youtube: text(social.youtube) || null,
        whatsapp: text(social.whatsapp) || null,
        courtsEnabled: platformDoc.fields.courtsEnabled === true,
        courtSlotMinutes: slot,
        createdAt: timestamp(platformDoc.fields.createdAt) || new Date(0).toISOString(),
        updatedAt: timestamp(platformDoc.fields.updatedAt) || new Date(0).toISOString(),
      }),
    );
    const heroes = Array.isArray(platformDoc.fields.heroImages) ? platformDoc.fields.heroImages : [];
    heroes.forEach((url, position) => {
      if (typeof url !== "string" || !url) return;
      tables.platformHeroImages.push({
        id: stableUuid(`platform-hero:${position}:${url}`),
        position,
        url,
      });
    });
    const windows = Array.isArray(platformDoc.fields.courtOpenWindows)
      ? platformDoc.fields.courtOpenWindows
      : [];
    windows.forEach((window, index) => {
      const startTime = timeOnly(window?.start);
      const endTime = timeOnly(window?.end);
      const weekday = Number(window?.day);
      if (!startTime || !endTime || startTime >= endTime || weekday < 1 || weekday > 7) {
        issue(`platform/config/courtOpenWindows/${index}`, "ventana de cancha inválida", window);
        return;
      }
      tables.courtOpenWindows.push({
        id: stableUuid(`court-window:${index}:${weekday}:${startTime}:${endTime}`),
        weekday,
        startTime,
        endTime,
      });
    });
    const adminEmails = platformDoc.fields.superAdminEmails || {};
    const adminIds = Array.isArray(platformDoc.fields.superAdmins) ? platformDoc.fields.superAdmins : [];
    for (const uid of adminIds) {
      if (typeof uid !== "string" || !uid) continue;
      if (!userIds.has(uid)) {
        addUser(uid, adminEmails[uid], "", null, `platform/config/superAdmins/${uid}`);
      }
      const email = text(adminEmails[uid]).trim().toLowerCase() || `import+${uid}@local.invalid`;
      tables.platformAdmins.push({ userId: uid, email });
    }
    for (const invite of subEntries(platformDoc, "invites")) {
      const email = text(invite.fields.email).trim().toLowerCase();
      if (!email) {
        issue(`platform/config/invites/${invite.id}`, "invitación sin correo");
        continue;
      }
      const invitedById = text(invite.fields.invitedBy);
      tables.platformAdminInvites.push(
        compact({
          emailKey: invite.id,
          email,
          invitedById: userIds.has(invitedById) ? invitedById : null,
          createdAt: timestamp(invite.fields.createdAt) || new Date(0).toISOString(),
        }),
      );
    }
  }

  for (const club of entries(collections.clubs)) {
    for (const member of subEntries(club, "members")) {
      if (!userIds.has(member.id)) {
        addUser(
          member.id,
          member.fields.email,
          member.fields.displayName,
          member.fields.joinedAt,
          `clubs/${club.id}/members/${member.id}`,
        );
      }
    }
  }

  const clubIds = new Set();
  for (const doc of entries(collections.clubs)) {
    const slug = text(doc.fields.slug, doc.id).trim();
    if (!slug) {
      issue(`clubs/${doc.id}`, "club sin slug");
      continue;
    }
    const localityId = text(doc.fields.localityId);
    const createdById = text(doc.fields.createdBy);
    if (localityId && !localityIds.has(localityId)) {
      issue(`clubs/${doc.id}`, "localidad inexistente", { localityId });
    }
    if (createdById && !userIds.has(createdById)) {
      issue(`clubs/${doc.id}`, "createdBy sin usuario", { createdById });
    }
    clubIds.add(doc.id);
    tables.clubs.push(
      compact({
        id: doc.id,
        slug,
        name: text(doc.fields.name, doc.id),
        description: text(doc.fields.description),
        localityId: localityId && localityIds.has(localityId) ? localityId : null,
        location: text(doc.fields.location),
        presidentPhone: text(doc.fields.presidentPhone),
        logoUrl: text(doc.fields.logoUrl) || null,
        active: doc.fields.active !== false,
        createdById: createdById && userIds.has(createdById) ? createdById : null,
        createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
      }),
    );
    const images = Array.isArray(doc.fields.heroImages)
      ? doc.fields.heroImages
      : doc.fields.heroImage
        ? [doc.fields.heroImage]
        : [];
    images.forEach((url, position) => {
      if (typeof url !== "string" || !url) return;
      tables.clubHeroImages.push({
        id: stableUuid(`club-hero:${doc.id}:${position}:${url}`),
        clubId: doc.id,
        position,
        url,
      });
    });
    const lineups = doc.fields.defaultLineups || {};
    if (lineups && typeof lineups === "object") {
      for (const [mode, lineup] of Object.entries(lineups)) {
        if (!lineup || typeof lineup !== "object") continue;
        tables.clubDefaultLineups.push({
          clubId: doc.id,
          mode: text(lineup.mode, mode).slice(0, 16),
          formation: text(lineup.formation, "2-3-1").slice(0, 16),
          positions: lineup.positions && typeof lineup.positions === "object" ? lineup.positions : {},
        });
      }
    }
    const availability = subEntries(doc, "availability").find((item) => item.id === "windows");
    const clubWindows = Array.isArray(availability?.fields.windows) ? availability.fields.windows : [];
    clubWindows.forEach((window, index) => {
      const startTime = timeOnly(window?.start);
      const endTime = timeOnly(window?.end);
      const weekday = Number(window?.day);
      if (!startTime || !endTime || startTime >= endTime || weekday < 1 || weekday > 7) {
        issue(`clubs/${doc.id}/availability/windows/${index}`, "ventana inválida", window);
        return;
      }
      const updatedById = text(availability.fields.updatedBy);
      tables.clubAvailabilityWindows.push(
        compact({
          id: stableUuid(`availability:${doc.id}:${index}:${weekday}:${startTime}:${endTime}`),
          clubId: doc.id,
          weekday,
          startTime,
          endTime,
          updatedAt: timestamp(availability.fields.updatedAt),
          updatedById: userIds.has(updatedById) ? updatedById : null,
        }),
      );
    });
  }

  for (const club of entries(collections.clubs)) {
    if (!clubIds.has(club.id)) continue;
    for (const member of subEntries(club, "members")) {
      const role = enumValue(member.fields.role, {
        admin: "ADMIN",
        dt: "DT",
        prensa: "PRENSA",
        tesorero: "TESORERO",
      });
      if (!MEMBER_ROLES.has(role)) {
        issue(`clubs/${club.id}/members/${member.id}`, "rol de miembro desconocido", member.fields.role);
        continue;
      }
      if (!userIds.has(member.id)) {
        addUser(
          member.id,
          member.fields.email,
          member.fields.displayName,
          member.fields.joinedAt,
          `clubs/${club.id}/members/${member.id}`,
        );
      }
      tables.clubMembers.push(
        compact({
          clubId: club.id,
          userId: member.id,
          email: text(member.fields.email).trim().toLowerCase() || `import+${member.id}@local.invalid`,
          displayName: text(member.fields.displayName),
          role,
          joinedAt: timestamp(member.fields.joinedAt) || new Date(0).toISOString(),
        }),
      );
    }
    for (const invite of subEntries(club, "invites")) {
      const role = enumValue(invite.fields.role, {
        admin: "ADMIN",
        dt: "DT",
        prensa: "PRENSA",
        tesorero: "TESORERO",
      });
      const kind = enumValue(invite.fields.kind, { signup: "SIGNUP", accept: "ACCEPT" }, "ACCEPT");
      const email = text(invite.fields.email).trim().toLowerCase();
      if (!email || !MEMBER_ROLES.has(role)) {
        issue(`clubs/${club.id}/invites/${invite.id}`, "invitación incompleta");
        continue;
      }
      const invitedById = text(invite.fields.invitedBy);
      tables.clubInvites.push(
        compact({
          clubId: club.id,
          emailKey: invite.id,
          email,
          role,
          token: text(invite.fields.token) || null,
          kind,
          invitedById: userIds.has(invitedById) ? invitedById : null,
          createdAt: timestamp(invite.fields.createdAt) || new Date(0).toISOString(),
        }),
      );
    }
  }

  const playerIds = new Set();
  const playersByClub = new Map();
  for (const club of entries(collections.clubs)) {
    if (!clubIds.has(club.id)) continue;
    const roster = [];
    for (const player of subEntries(club, "players")) {
      const birthDate = dateOnly(player.fields.birthDate);
      playerIds.add(player.id);
      const row = compact({
        id: player.id,
        clubId: club.id,
        name: text(player.fields.name, "Sin nombre"),
        shirtNumber: text(player.fields.number, "S/N").slice(0, 8) || "S/N",
        position: text(player.fields.position, "Delantero").slice(0, 24),
        variant: text(player.fields.variant).slice(0, 80),
        birthDate,
        imageUrl: text(player.fields.imageUrl),
        isCoach: player.fields.isDT === true,
        active: player.fields.active !== false,
        createdAt: timestamp(player.fields.timestamp) || new Date(0).toISOString(),
      });
      tables.players.push(row);
      roster.push(row);
      const paid = Number(player.fields.amount_paid);
      if (Number.isFinite(paid) && paid > 0) {
        const paidDate =
          dateOnly(player.fields.payment_timestamp) ||
          dateOnly(player.fields.timestamp) ||
          "1970-01-01";
        tables.transactions.push({
          id: `legacy-${player.id}`,
          clubId: club.id,
          type: "INGRESO",
          description: `Aportación Anterior: ${row.name}`.slice(0, 240),
          category: "Aportaciones",
          amount: paid,
          txnDate: paidDate,
          source: "LEGACY_AMOUNT_PAID",
          playerId: player.id,
          createdAt: timestamp(player.fields.payment_timestamp) || row.createdAt,
        });
      }
    }
    playersByClub.set(club.id, roster);
  }

  const groupIds = new Set();
  const tournamentIds = new Set();
  const tournamentClubIds = new Map();
  for (const doc of entries(collections.tournaments)) {
    if (!seasonIds.has(doc.fields.seasonId) || !categoryIds.has(doc.fields.categoryId)) {
      issue(`tournaments/${doc.id}`, "temporada o categoría inexistente", {
        seasonId: doc.fields.seasonId,
        categoryId: doc.fields.categoryId,
      });
      continue;
    }
    const groupId = text(doc.fields.groupId);
    if (groupId) groupIds.add(groupId);
    const footballType = FOOTBALL[doc.fields.footballType] || "FUT_11";
    const legs = doc.fields.legs === 1 ? 1 : 2;
    const durationMinutes = DURATIONS.has(doc.fields.durationMinutes) ? doc.fields.durationMinutes : 90;
    const status = enumValue(doc.fields.status, {
      upcoming: "UPCOMING",
      active: "ACTIVE",
      finished: "FINISHED",
    }, "UPCOMING");
    tournamentIds.add(doc.id);
    tables.tournaments.push(
      compact({
        id: doc.id,
        name: text(doc.fields.name, doc.id),
        seasonId: doc.fields.seasonId,
        categoryId: doc.fields.categoryId,
        groupId: groupId || null,
        status,
        legs,
        footballType,
        durationMinutes,
        startDate: dateOnly(doc.fields.startDate),
        description: text(doc.fields.description),
        createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
      }),
    );
    const clubSet = new Set();
    const clubList = Array.isArray(doc.fields.clubIds) ? doc.fields.clubIds : [];
    for (const clubId of clubList) {
      if (!clubIds.has(clubId) || clubSet.has(clubId)) {
        if (clubId && !clubIds.has(clubId)) {
          issue(`tournaments/${doc.id}`, "club del torneo inexistente", { clubId });
        }
        continue;
      }
      clubSet.add(clubId);
      tables.tournamentClubs.push({
        tournamentId: doc.id,
        clubId,
        createdAt: "1970-01-01T00:00:00.000Z",
      });
    }
    tournamentClubIds.set(doc.id, clubSet);
    const podium = doc.fields.podium || {};
    const used = new Set();
    for (const place of [1, 2, 3]) {
      const clubId = podium[String(place)] || podium[place];
      if (!clubId) continue;
      if (!clubSet.has(clubId) || used.has(clubId)) {
        issue(`tournaments/${doc.id}/podium/${place}`, "podio fuera del torneo", { clubId });
        continue;
      }
      used.add(clubId);
      tables.tournamentPodium.push({ tournamentId: doc.id, place, clubId });
    }
    for (const notice of subEntries(doc, "notices")) {
      if (!clubIds.has(notice.id)) {
        issue(`tournaments/${doc.id}/notices/${notice.id}`, "aviso a un club inexistente");
        continue;
      }
      tables.tournamentNotices.push({
        tournamentId: doc.id,
        clubId: notice.id,
        sentAt: timestamp(notice.fields.sentAt) || new Date(0).toISOString(),
      });
    }
  }
  for (const groupId of groupIds) {
    tables.tournamentGroups.push({ id: groupId, label: groupId });
  }

  for (const doc of entries(collections.courts)) {
    tables.courts.push(
      compact({
        id: doc.id,
        name: text(doc.fields.name, "Cancha").slice(0, 15),
        description: text(doc.fields.description).slice(0, 15),
        hourlyRate: Number.isFinite(doc.fields.hourlyRate) ? doc.fields.hourlyRate : 0,
        active: doc.fields.active !== false,
        sortOrder: Number.isFinite(doc.fields.order) ? doc.fields.order : 0,
        imageUrl: text(doc.fields.imageUrl) || null,
        football: doc.fields.football !== false,
      }),
    );
  }
  const courtIds = new Set(tables.courts.map((row) => row.id));

  const matchIds = new Set();
  for (const doc of entries(collections.matches)) {
    if (!tournamentIds.has(doc.fields.tournamentId)) {
      issue(`matches/${doc.id}`, "torneo inexistente", { tournamentId: doc.fields.tournamentId });
      continue;
    }
    if (!clubIds.has(doc.fields.homeClubId) || !clubIds.has(doc.fields.awayClubId)) {
      issue(`matches/${doc.id}`, "local o visita inexistente");
      continue;
    }
    if (doc.fields.homeClubId === doc.fields.awayClubId) {
      issue(`matches/${doc.id}`, "local y visita son el mismo club");
      continue;
    }
    const status = enumValue(doc.fields.status, {
      unscheduled: "UNSCHEDULED",
      scheduled: "SCHEDULED",
      played: "PLAYED",
    });
    if (!status) {
      issue(`matches/${doc.id}`, "estado de partido desconocido", doc.fields.status);
      continue;
    }
    const courtId = text(doc.fields.courtId);
    if (courtId && !courtIds.has(courtId)) {
      issue(`matches/${doc.id}`, "cancha inexistente", { courtId });
    }
    const roundLabel = text(doc.fields.round, "—").slice(0, 16) || "—";
    const roundNumber = /^\d+$/.test(roundLabel) ? Number(roundLabel) : null;
    matchIds.add(doc.id);
    tables.matches.push(
      compact({
        id: doc.id,
        tournamentId: doc.fields.tournamentId,
        roundLabel,
        roundNumber,
        homeClubId: doc.fields.homeClubId,
        awayClubId: doc.fields.awayClubId,
        matchDate: dateOnly(doc.fields.date),
        startTime: timeOnly(doc.fields.time),
        venue: text(doc.fields.venue).slice(0, 200),
        courtId: courtId && courtIds.has(courtId) ? courtId : null,
        status,
        homeScore: Number.isFinite(doc.fields.homeScore) ? doc.fields.homeScore : null,
        awayScore: Number.isFinite(doc.fields.awayScore) ? doc.fields.awayScore : null,
        penaltiesHome: Number.isFinite(doc.fields.penaltiesHome) ? doc.fields.penaltiesHome : null,
        penaltiesAway: Number.isFinite(doc.fields.penaltiesAway) ? doc.fields.penaltiesAway : null,
        walkover: doc.fields.walkover === true,
        scheduleNoticeKey: text(doc.fields.scheduleNoticeKey).slice(0, 80) || null,
        createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
        updatedAt: timestamp(doc.fields.updatedAt),
      }),
    );
    const sides = doc.fields.sides && typeof doc.fields.sides === "object" ? doc.fields.sides : {};
    for (const [clubId, side] of Object.entries(sides)) {
      if (!side || typeof side !== "object") continue;
      if (clubId !== doc.fields.homeClubId && clubId !== doc.fields.awayClubId) {
        issue(`matches/${doc.id}/sides/${clubId}`, "informe de un club que no juega");
        continue;
      }
      const names = side.playerNames && typeof side.playerNames === "object" ? side.playerNames : {};
      const mvpId = text(side.mvp);
      tables.matchClubReports.push(
        compact({
          matchId: doc.id,
          clubId,
          mvpId: mvpId && playerIds.has(mvpId) ? mvpId : null,
          lineup: side.lineup && typeof side.lineup === "object" ? side.lineup : null,
        }),
      );
      if (mvpId && !playerIds.has(mvpId)) {
        issue(`matches/${doc.id}/sides/${clubId}`, "mvp sin jugador", { mvpId });
      }
      const seenAttendees = new Set();
      for (const attendee of Array.isArray(side.attendees) ? side.attendees : []) {
        if (typeof attendee !== "string" || !playerIds.has(attendee) || seenAttendees.has(attendee)) {
          if (attendee && !playerIds.has(attendee)) {
            issue(`matches/${doc.id}/sides/${clubId}`, "asistente sin jugador", { attendee });
          }
          continue;
        }
        seenAttendees.add(attendee);
        tables.matchAttendees.push({
          matchId: doc.id,
          clubId,
          playerId: attendee,
          createdAt: "1970-01-01T00:00:00.000Z",
        });
      }
      const stats = Array.isArray(side.stats) ? side.stats : [];
      stats.forEach((stat, sortOrder) => {
        const scorerId = text(stat?.scorer);
        const assistId = text(stat?.assist);
        if (!scorerId && !stat?.isOwnGoal) {
          issue(`matches/${doc.id}/sides/${clubId}/stats/${sortOrder}`, "gol sin goleador");
          return;
        }
        const scorerKnown = scorerId && playerIds.has(scorerId);
        const assistKnown = assistId && playerIds.has(assistId);
        if (scorerId && !scorerKnown) {
          issue(`matches/${doc.id}/sides/${clubId}/stats/${sortOrder}`, "goleador sin jugador", { scorerId });
        }
        if (assistId && !assistKnown) {
          issue(`matches/${doc.id}/sides/${clubId}/stats/${sortOrder}`, "asistencia sin jugador", { assistId });
        }
        tables.matchGoals.push(
          compact({
            id: stableUuid(`goal:${doc.id}:${clubId}:${sortOrder}`),
            matchId: doc.id,
            clubId,
            sortOrder,
            scorerId: scorerKnown ? scorerId : null,
            scorerName: (names[scorerId] || scorerId || "").slice(0, 160),
            assistId: assistKnown ? assistId : null,
            assistName: (names[assistId] || assistId || "").slice(0, 160),
            isPenalty: stat?.isPenalty === true,
            isOwnGoal: stat?.isOwnGoal === true,
          }),
        );
      });
      const pushCards = (list, color) => {
        (Array.isArray(list) ? list : []).forEach((playerId, index) => {
          if (typeof playerId !== "string" || !playerId) return;
          const known = playerIds.has(playerId);
          if (!known) {
            issue(`matches/${doc.id}/sides/${clubId}`, `tarjeta ${color} sin jugador`, { playerId });
          }
          tables.matchCards.push(
            compact({
              id: stableUuid(`card:${doc.id}:${clubId}:${color}:${index}:${playerId}`),
              matchId: doc.id,
              clubId,
              playerId: known ? playerId : null,
              playerName: (names[playerId] || playerId).slice(0, 160),
              color,
            }),
          );
        });
      };
      pushCards(side.yellowCards, "YELLOW");
      pushCards(side.redCards, "RED");
      const keepers = Array.isArray(side.goalkeepers) ? side.goalkeepers : [];
      const seenKeepers = new Set();
      for (const keeper of keepers) {
        const playerId = text(keeper?.id);
        if (!playerId || !playerIds.has(playerId) || seenKeepers.has(playerId)) {
          if (playerId && !playerIds.has(playerId)) {
            issue(`matches/${doc.id}/sides/${clubId}`, "portero sin jugador", { playerId });
          }
          continue;
        }
        seenKeepers.add(playerId);
        tables.matchGoalkeepers.push({
          matchId: doc.id,
          clubId,
          playerId,
          conceded: Number.isFinite(keeper.conceded) ? keeper.conceded : 0,
          saves: Number.isFinite(keeper.saves) ? keeper.saves : 0,
        });
      }
    }
  }

  const acceptedHolds = [];
  for (const doc of entries(collections.courtHolds)) {
    const source = enumValue(doc.fields.source, { match: "MATCH", manual: "MANUAL" });
    const startTime = timeOnly(doc.fields.startTime);
    const endTime = timeOnly(doc.fields.endTime);
    const holdDate = dateOnly(doc.fields.date);
    const courtId = text(doc.fields.courtId);
    const matchId = text(doc.fields.matchId);
    if (!source || !startTime || !endTime || !holdDate || startTime >= endTime || !courtIds.has(courtId)) {
      issue(`courtHolds/${doc.id}`, "reserva inválida");
      continue;
    }
    if (source === "MATCH" && !matchIds.has(matchId)) {
      issue(`courtHolds/${doc.id}`, "reserva de partido inexistente", { matchId });
      continue;
    }
    const row = {
      id: doc.id,
      courtId,
      holdDate,
      startTime,
      endTime,
      source,
      matchId: source === "MATCH" ? matchId : null,
      note: text(doc.fields.note).slice(0, 240),
    };
    const clash = acceptedHolds.find(
      (hold) =>
        hold.courtId === row.courtId &&
        hold.holdDate === row.holdDate &&
        hold.startTime < row.endTime &&
        row.startTime < hold.endTime,
    );
    if (clash) {
      issue(`courtHolds/${doc.id}`, "reserva solapada", { otherId: clash.id });
      continue;
    }
    acceptedHolds.push(row);
    tables.courtHolds.push(compact(row));
  }

  for (const club of entries(collections.clubs)) {
    if (!clubIds.has(club.id)) continue;
    const roster = playersByClub.get(club.id) || [];
    const byName = new Map(roster.map((player) => [player.name.trim().toLowerCase(), player.id]));
    for (const event of subEntries(club, "events")) {
      const eventType = enumValue(event.fields.eventType, {
        Partido: "PARTIDO",
        Entrenamiento: "ENTRENAMIENTO",
      });
      const eventDate = dateOnly(event.fields.eventDate);
      const eventTime = timeOnly(event.fields.eventTime);
      if (!eventType || !eventDate || !eventTime) {
        issue(`clubs/${club.id}/events/${event.id}`, "evento incompleto");
        continue;
      }
      const matchType = event.fields.matchType === "Amistoso" ? "AMISTOSO" : null;
      const mvpId = text(event.fields.mvp);
      tables.clubEvents.push(
        compact({
          id: event.id,
          clubId: club.id,
          eventType,
          matchType,
          title: text(event.fields.title, "Evento").slice(0, 200),
          eventDate,
          eventTime,
          location: text(event.fields.location, "Por definir").slice(0, 200),
          routine: event.fields.routine ?? [],
          lineup: event.fields.lineup && typeof event.fields.lineup === "object" ? event.fields.lineup : null,
          scoreOurs: Number.isFinite(event.fields.scoreOurs) ? event.fields.scoreOurs : null,
          scoreTheirs: Number.isFinite(event.fields.scoreTheirs) ? event.fields.scoreTheirs : null,
          penaltiesOurs: Number.isFinite(event.fields.penaltiesOurs) ? event.fields.penaltiesOurs : null,
          penaltiesTheirs: Number.isFinite(event.fields.penaltiesTheirs) ? event.fields.penaltiesTheirs : null,
          mvpId: mvpId && playerIds.has(mvpId) ? mvpId : null,
          createdAt: timestamp(event.fields.timestamp) || new Date(0).toISOString(),
        }),
      );
      const seen = new Set();
      (Array.isArray(event.fields.attendees) ? event.fields.attendees : []).forEach((value, index) => {
        if (typeof value !== "string" || !value) return;
        const playerId = playerIds.has(value) ? value : byName.get(value.trim().toLowerCase());
        if (playerId && seen.has(playerId)) return;
        if (playerId) seen.add(playerId);
        else issue(`clubs/${club.id}/events/${event.id}`, "asistente sin jugador", { value });
        tables.clubEventAttendees.push({
          id: stableUuid(`event-attendee:${event.id}:${playerId || value}:${index}`),
          eventId: event.id,
          playerId: playerId || null,
          rawLabel: playerId ? "" : value.slice(0, 160),
        });
      });
      (Array.isArray(event.fields.stats) ? event.fields.stats : []).forEach((stat, sortOrder) => {
        const scorerId = text(stat?.scorer);
        const assistId = text(stat?.assist);
        tables.clubEventGoals.push(
          compact({
            id: stableUuid(`event-goal:${event.id}:${sortOrder}`),
            eventId: event.id,
            sortOrder,
            scorerId: scorerId && playerIds.has(scorerId) ? scorerId : null,
            assistId: assistId && playerIds.has(assistId) ? assistId : null,
            isPenalty: stat?.isPenalty === true,
            isOwnGoal: stat?.isOwnGoal === true,
          }),
        );
      });
      const pushEventCards = (list, color) => {
        (Array.isArray(list) ? list : []).forEach((playerId, index) => {
          if (typeof playerId !== "string") return;
          tables.clubEventCards.push(
            compact({
              id: stableUuid(`event-card:${event.id}:${color}:${index}:${playerId}`),
              eventId: event.id,
              playerId: playerIds.has(playerId) ? playerId : null,
              color,
            }),
          );
        });
      };
      pushEventCards(event.fields.yellowCards, "YELLOW");
      pushEventCards(event.fields.redCards, "RED");
      const seenKeepers = new Set();
      for (const keeper of Array.isArray(event.fields.goalkeepers) ? event.fields.goalkeepers : []) {
        const playerId = text(keeper?.id);
        if (!playerId || !playerIds.has(playerId) || seenKeepers.has(playerId)) continue;
        seenKeepers.add(playerId);
        tables.clubEventGoalkeepers.push({
          eventId: event.id,
          playerId,
          conceded: Number.isFinite(keeper.conceded) ? keeper.conceded : 0,
          saves: Number.isFinite(keeper.saves) ? keeper.saves : 0,
        });
      }
      const photos = Array.isArray(event.fields.photoUrls)
        ? event.fields.photoUrls
        : event.fields.photoUrl
          ? [event.fields.photoUrl]
          : [];
      photos.forEach((url, position) => {
        if (typeof url !== "string" || !url) return;
        tables.clubEventPhotos.push({
          id: stableUuid(`event-photo:${event.id}:${position}:${url}`),
          eventId: event.id,
          position,
          url,
        });
      });
    }

    for (const txn of subEntries(club, "transactions")) {
      const type = enumValue(txn.fields.type, { ingreso: "INGRESO", gasto: "GASTO" });
      const txnDate = dateOnly(txn.fields.date);
      const amount = Number(txn.fields.amount);
      if (!type || !txnDate || !Number.isFinite(amount) || amount < 0) {
        issue(`clubs/${club.id}/transactions/${txn.id}`, "movimiento inválido");
        continue;
      }
      const playerId = text(txn.fields.playerId);
      tables.transactions.push(
        compact({
          id: txn.id,
          clubId: club.id,
          type,
          description: text(txn.fields.description, "Movimiento").slice(0, 240),
          category: text(txn.fields.category, "Otro").slice(0, 40),
          amount,
          txnDate,
          source: "MANUAL",
          playerId: playerId && playerIds.has(playerId) ? playerId : null,
          createdAt: timestamp(txn.fields.timestamp) || new Date(0).toISOString(),
        }),
      );
    }

    for (const goal of subEntries(club, "goals")) {
      const status = enumValue(goal.fields.status, { active: "ACTIVE", completed: "COMPLETED" });
      const amount = Number(goal.fields.amount);
      if (!status || !Number.isFinite(amount) || amount < 0) {
        issue(`clubs/${club.id}/goals/${goal.id}`, "meta inválida");
        continue;
      }
      tables.financialGoals.push(
        compact({
          id: goal.id,
          clubId: club.id,
          title: text(goal.fields.title, "Meta").slice(0, 200),
          amount,
          quotaPerPlayer: Number.isFinite(goal.fields.quotaPerPlayer) ? goal.fields.quotaPerPlayer : null,
          status,
          createdAt: timestamp(goal.fields.createdAt) || new Date(0).toISOString(),
        }),
      );
      const contributions = goal.fields.contributions || {};
      for (const [playerId, rawAmount] of Object.entries(contributions)) {
        const paid = Number(rawAmount);
        if (!playerIds.has(playerId) || !Number.isFinite(paid) || paid < 0) {
          issue(`clubs/${club.id}/goals/${goal.id}`, "aportación inválida", { playerId, rawAmount });
          continue;
        }
        tables.goalContributions.push({ goalId: goal.id, playerId, amount: paid });
      }
    }

    const inventorySeen = new Map();
    for (const item of subEntries(club, "inventory")) {
      const condition = enumValue(item.fields.condition, {
        Bueno: "BUENO",
        Malo: "MALO",
        Perdido: "PERDIDO",
      });
      const quantity = Number(item.fields.quantity);
      const name = text(item.fields.name).trim();
      if (!condition || !name || !Number.isFinite(quantity) || quantity < 0) {
        issue(`clubs/${club.id}/inventory/${item.id}`, "artículo inválido");
        continue;
      }
      const key = `${name}\u0000${condition}`;
      const existing = inventorySeen.get(key);
      if (existing) {
        existing.quantity += quantity;
        issue(`clubs/${club.id}/inventory/${item.id}`, "artículo fusionado por nombre y condición", {
          into: existing.id,
        });
        continue;
      }
      const row = {
        id: item.id,
        clubId: club.id,
        name: name.slice(0, 160),
        quantity,
        condition,
        createdAt: timestamp(item.fields.timestamp) || new Date(0).toISOString(),
      };
      inventorySeen.set(key, row);
      tables.inventoryItems.push(row);
    }

    const albums = new Map();
    const photos = subEntries(club, "gallery")
      .map((photo) => ({
        id: photo.id,
        url: text(photo.fields.url),
        caption: text(photo.fields.caption).slice(0, 240),
        albumName: text(photo.fields.albumName).trim() || "Galería General",
        takenAt: timestamp(photo.fields.timestamp),
      }))
      .filter((photo) => photo.url && photo.takenAt)
      .sort((a, b) => a.takenAt.localeCompare(b.takenAt) || a.id.localeCompare(b.id));
    const positions = new Map();
    for (const photo of photos) {
      if (!albums.has(photo.albumName)) {
        const album = {
          id: stableUuid(`album:${club.id}:${photo.albumName}`),
          clubId: club.id,
          name: photo.albumName.slice(0, 160),
        };
        albums.set(photo.albumName, album);
        tables.albums.push(album);
        positions.set(photo.albumName, 0);
      }
      const sortOrder = positions.get(photo.albumName);
      positions.set(photo.albumName, sortOrder + 1);
      tables.galleryPhotos.push({
        id: photo.id,
        albumId: albums.get(photo.albumName).id,
        url: photo.url,
        caption: photo.caption,
        sortOrder,
        takenAt: photo.takenAt,
      });
    }
  }

  const placementMap = { home: "HOME", tournament: "TOURNAMENT", club: "CLUB", teams: "TEAMS" };
  for (const doc of entries(collections.ads)) {
    const startsOn = dateOnly(doc.fields.startsAt);
    const endsOn = dateOnly(doc.fields.endsAt);
    if (!startsOn || !endsOn || !text(doc.fields.brand) || !text(doc.fields.imageUrl)) {
      issue(`ads/${doc.id}`, "anuncio incompleto");
      continue;
    }
    tables.ads.push({
      id: doc.id,
      brand: text(doc.fields.brand).slice(0, 160),
      imageUrl: doc.fields.imageUrl,
      href: text(doc.fields.href, "#"),
      startsOn,
      endsOn,
      active: doc.fields.active !== false,
      sortOrder: Number.isFinite(doc.fields.order) ? doc.fields.order : 0,
      createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
    });
    const seen = new Set();
    for (const placement of Array.isArray(doc.fields.placements) ? doc.fields.placements : []) {
      const mapped = placementMap[placement];
      if (!mapped || seen.has(mapped)) {
        if (placement && !mapped) issue(`ads/${doc.id}`, "ubicación de anuncio desconocida", { placement });
        continue;
      }
      seen.add(mapped);
      tables.adPlacements.push({
        adId: doc.id,
        placement: mapped,
        createdAt: "1970-01-01T00:00:00.000Z",
      });
    }
  }

  for (const doc of entries(collections.inquiries)) {
    const status = enumValue(doc.fields.status, { new: "NEW", done: "DONE" }, "NEW");
    tables.inquiries.push({
      id: doc.id,
      name: text(doc.fields.name, "Sin nombre").slice(0, 160),
      email: text(doc.fields.email, "sin-correo@local.invalid").slice(0, 320),
      phone: text(doc.fields.phone).slice(0, 40),
      topic: text(doc.fields.topic).slice(0, 80),
      message: text(doc.fields.message),
      status,
      createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
    });
  }

  for (const doc of entries(collections.teamApplications)) {
    const status = enumValue(doc.fields.status, {
      pending: "PENDING",
      approved: "APPROVED",
      rejected: "REJECTED",
    }, "PENDING");
    const clubId = text(doc.fields.clubId);
    if (clubId && !clubIds.has(clubId)) {
      issue(`teamApplications/${doc.id}`, "club de la solicitud inexistente", { clubId });
    }
    tables.teamApplications.push(
      compact({
        id: doc.id,
        captainName: text(doc.fields.captainName).slice(0, 160),
        captainEmail: text(doc.fields.captainEmail).slice(0, 320),
        captainPhone: text(doc.fields.captainPhone).slice(0, 40),
        teamName: text(doc.fields.teamName).slice(0, 160),
        status,
        clubId: clubId && clubIds.has(clubId) ? clubId : null,
        slug: text(doc.fields.slug).slice(0, 40) || null,
        createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
        reviewedAt: timestamp(doc.fields.reviewedAt),
      }),
    );
  }

  for (const doc of entries(collections.signupInvites)) {
    const email = text(doc.fields.email).trim().toLowerCase();
    const clubId = text(doc.fields.clubId);
    const platform = doc.fields.platform === true;
    if (!email) {
      issue(`signupInvites/${doc.id}`, "invitación de registro sin correo");
      continue;
    }
    if (platform === Boolean(clubId)) {
      issue(`signupInvites/${doc.id}`, "invitación de registro ambigua", { platform, clubId });
    }
    const useClub = !platform && clubIds.has(clubId);
    if (clubId && !clubIds.has(clubId)) {
      issue(`signupInvites/${doc.id}`, "club de la invitación inexistente", { clubId });
    }
    if (!platform && !useClub) continue;
    tables.signupInvites.push(
      compact({
        emailKey: doc.id,
        email,
        clubId: useClub ? clubId : null,
        platform: platform && !useClub,
        updatedAt: timestamp(doc.fields.updatedAt) || new Date(0).toISOString(),
      }),
    );
  }

  for (const doc of entries(collections.mail)) {
    const message = doc.fields.message || {};
    const meta = doc.fields.meta || {};
    const recipients = Array.isArray(doc.fields.to)
      ? doc.fields.to.filter((item) => typeof item === "string" && item)
      : [];
    const clubId = text(meta.clubId);
    if (!recipients.length || !text(message.subject) || !text(message.html)) {
      issue(`mail/${doc.id}`, "correo incompleto");
      continue;
    }
    tables.emailOutbox.push(
      compact({
        id: doc.id,
        recipients,
        subject: text(message.subject).slice(0, 240),
        html: message.html,
        kind: text(meta.kind, "unknown").slice(0, 24),
        clubId: clubId && clubIds.has(clubId) ? clubId : null,
        createdAt: timestamp(doc.fields.createdAt) || new Date(0).toISOString(),
      }),
    );
  }

  return { tables, issues };
}
