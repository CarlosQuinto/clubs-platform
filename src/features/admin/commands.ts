import {
  adminAdmins,
  adminAds,
  adminClubPeople,
  adminClubs,
  adminCompetition,
  adminCourts,
  adminCover,
  adminInbox,
  approveTeamApplication,
  clearAdPlacements,
  clearCourtWindows,
  clearHeroImages,
  clearSignupInvite,
  createCategory,
  createClub,
  insertClubHero,
  createLocality,
  createSeason,
  createTournament,
  deleteAd,
  deleteClub,
  deleteCourt,
  deleteInquiry,
  deleteManualCourtHold,
  deleteSeason,
  removeClubInvite,
  removeClubMember,
  removePlatformAdmin,
  removePlatformAdminInvite,
  rejectTeamApplication,
  saveAd,
  saveAdPlacement,
  saveClubInvite,
  saveCourt,
  saveCourtHold,
  saveCourtSettings,
  saveCourtWindow,
  saveHeroImage,
  savePlatformAdminInvite,
  savePlatformCover,
  savePlatformHeader,
  savePlatformSocial,
  saveSignupInvite,
  setAdStatus,
  setAdSortOrder,
  setClubActive,
  setClubMemberRole,
  setInquiryDone,
  setSeasonActive,
  signupInviteByEmail,
  type AdminAdminsData,
  type AdminAdsData,
  type AdminClubPeopleData,
  type AdminClubsData,
  type AdminCompetitionData,
  type AdminCourtsData,
  type AdminCoverData,
  type AdminInboxData,
} from "../../../dataconnect/generated";
import { QueryFetchPolicy } from "firebase/data-connect";
import { auth } from "../../lib/firebase";
import { dataConnect } from "../../lib/sqlConnect";
import { invalidatePlatformChrome } from "../shell/usePlatformChrome";
import { emailKey as toEmailKey } from "../../lib/paths";

export async function loadClubs(): Promise<AdminClubsData> {
  return (await adminClubs(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadClubPeople(clubId: string): Promise<AdminClubPeopleData> {
  return (await adminClubPeople(dataConnect, { clubId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadCompetition(): Promise<AdminCompetitionData> {
  return (await adminCompetition(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadCover(): Promise<AdminCoverData> {
  return (await adminCover(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadAds(): Promise<AdminAdsData> {
  return (await adminAds(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadInbox(): Promise<AdminInboxData> {
  return (await adminInbox(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadAdmins(): Promise<AdminAdminsData> {
  return (await adminAdmins(dataConnect)).data;
}

export async function loadCourts(): Promise<AdminCourtsData> {
  return (await adminCourts(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function signupInviteExists(emailKey: string) {
  const result = await signupInviteByEmail(dataConnect, { emailKey });
  return Boolean(result.data.signupInvite);
}

function sessionUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Debes iniciar sesión.");
  return uid;
}

function saved(value: unknown) {
  return value != null;
}

async function requireSaved(value: unknown) {
  if (!saved(value)) throw new Error("No se pudo guardar.");
}

export async function addLocality(name: string) {
  const result = await createLocality(dataConnect, {
    userId: sessionUserId(),
    id: crypto.randomUUID(),
    name,
  });
  await requireSaved(result.data.locality);
}

export async function addClub(input: {
  slug: string;
  name: string;
  localityId: string;
  location: string;
  presidentPhone: string;
  description: string;
  heroUrl: string;
  adminEmail: string;
}) {
  const id = crypto.randomUUID();
  const result = await createClub(dataConnect, {
    userId: sessionUserId(),
    id,
    slug: input.slug,
    name: input.name,
    localityId: input.localityId,
    location: input.location,
    presidentPhone: input.presidentPhone,
    description: input.description,
  });
  await requireSaved(result.data.club);
  await insertClubHero(dataConnect, {
    userId: sessionUserId(),
    id: crypto.randomUUID(),
    clubId: id,
    url: input.heroUrl,
  });
  if (input.adminEmail) {
    const email = input.adminEmail.trim().toLowerCase();
    const key = toEmailKey(email);
    await saveClubInvite(dataConnect, {
      clubId: id,
      emailKey: key,
      email,
      role: "ADMIN",
      token: crypto.randomUUID().replace(/-/g, ""),
      kind: "SIGNUP",
    });
    await saveSignupInvite(dataConnect, {
      emailKey: key,
      email,
      clubId: id,
      platform: false,
    });
  }
  return id;
}

export async function setClubVisible(id: string, active: boolean) {
  const result = await setClubActive(dataConnect, { userId: sessionUserId(), id, active });
  await requireSaved(result.data.club);
}

export async function removeClub(id: string) {
  const result = await deleteClub(dataConnect, { userId: sessionUserId(), id });
  await requireSaved(result.data.club);
}

export async function addSeason(input: {
  name: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}) {
  const result = await createSeason(dataConnect, { userId: sessionUserId(), id: crypto.randomUUID(), ...input });
  await requireSaved(result.data.season);
}

export async function toggleSeason(id: string, active: boolean) {
  const result = await setSeasonActive(dataConnect, { userId: sessionUserId(), id, active });
  await requireSaved(result.data.season);
}

export async function removeSeason(id: string) {
  const result = await deleteSeason(dataConnect, { userId: sessionUserId(), id });
  await requireSaved(result.data.season);
}

export async function addCategory(name: string, sortOrder: number) {
  const id = crypto.randomUUID();
  const result = await createCategory(dataConnect, { userId: sessionUserId(), id, name, sortOrder });
  await requireSaved(result.data.category);
  return id;
}

export async function addTournament(input: {
  name: string;
  seasonId: string;
  categoryId: string;
  groupId: string;
  footballType: string;
  durationMinutes: number;
  startDate: string;
  description: string;
}) {
  const result = await createTournament(dataConnect, { userId: sessionUserId(), id: crypto.randomUUID(), ...input });
  await requireSaved(result.data.tournament);
}

export async function saveHeader(name: string, motto: string, logoUrl: string) {
  const result = await savePlatformHeader(dataConnect, {
    userId: sessionUserId(),
    name,
    motto,
    logoUrl,
  });
  await requireSaved(result.data.settings);
  invalidatePlatformChrome();
}

export async function saveCoverText(headline: string, tagline: string) {
  const result = await savePlatformCover(dataConnect, {
    userId: sessionUserId(),
    headline,
    tagline,
  });
  await requireSaved(result.data.settings);
  invalidatePlatformChrome();
}

export async function saveSocial(input: {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  whatsapp: string;
}) {
  const result = await savePlatformSocial(dataConnect, {
    userId: sessionUserId(),
    ...input,
  });
  await requireSaved(result.data.settings);
  invalidatePlatformChrome();
}

export async function replaceHeroImages(urls: string[]) {
  const userId = sessionUserId();
  await clearHeroImages(dataConnect, { userId });
  for (let index = 0; index < urls.length; index += 1) {
    const result = await saveHeroImage(dataConnect, {
      userId,
      id: crypto.randomUUID(),
      position: index,
      url: urls[index],
    });
    await requireSaved(result.data.image);
  }
  invalidatePlatformChrome();
}

export async function saveCourtModule(enabled: boolean, slotMinutes: number, windows: {
  weekday: number;
  startTime: string;
  endTime: string;
}[]) {
  const userId = sessionUserId();
  const settings = await saveCourtSettings(dataConnect, { userId, enabled, slotMinutes });
  await requireSaved(settings.data.settings);
  await clearCourtWindows(dataConnect, { userId });
  for (const window of windows) {
    const result = await saveCourtWindow(dataConnect, {
      userId,
      id: crypto.randomUUID(),
      ...window,
    });
    await requireSaved(result.data.window);
  }
}

export async function upsertCourt(input: {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  football: boolean;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
}) {
  const result = await saveCourt(dataConnect, { userId: sessionUserId(), ...input });
  await requireSaved(result.data.court);
}

export async function removeCourt(id: string) {
  const result = await deleteCourt(dataConnect, { id });
  await requireSaved(result.data.court);
}

export async function upsertHold(input: {
  id: string;
  courtId: string;
  holdDate: string;
  startTime: string;
  endTime: string;
  note: string;
  guestEmail?: string;
}) {
  const result = await saveCourtHold(dataConnect, { userId: sessionUserId(), ...input });
  await requireSaved(result.data.hold);
}

export async function removeManualHold(id: string) {
  const result = await deleteManualCourtHold(dataConnect, { id });
  await requireSaved(result.data.hold);
}

export async function upsertAd(input: {
  id: string;
  brand: string;
  imageUrl: string;
  href: string;
  startsOn: string;
  endsOn: string;
  status: string;
  sortOrder: number;
  placements: string[];
}) {
  const { placements, ...ad } = input;
  const savedAd = await saveAd(dataConnect, ad);
  await requireSaved(savedAd.data.ad);
  await clearAdPlacements(dataConnect, { adId: input.id });
  for (const placement of placements) {
    await saveAdPlacement(dataConnect, { adId: input.id, placement });
  }
}

export async function saveAdStatus(id: string, status: string) {
  const result = await setAdStatus(dataConnect, { id, status });
  await requireSaved(result.data.ad);
}

export async function orderAd(id: string, sortOrder: number) {
  const result = await setAdSortOrder(dataConnect, { id, sortOrder });
  await requireSaved(result.data.ad);
}

export async function removeAd(id: string) {
  const result = await deleteAd(dataConnect, { id });
  await requireSaved(result.data.ad);
}

export async function finishInquiry(id: string) {
  const result = await setInquiryDone(dataConnect, { id });
  await requireSaved(result.data.inquiry);
}

export async function removeInquiry(id: string) {
  const result = await deleteInquiry(dataConnect, { id });
  await requireSaved(result.data.inquiry);
}

export async function rejectApplication(id: string) {
  const result = await rejectTeamApplication(dataConnect, { id });
  await requireSaved(result.data.application);
}

export async function approveApplication(input: {
  id: string;
  clubId: string;
  slug: string;
  name: string;
  localityId: string;
  location: string;
  presidentPhone: string;
  description: string;
  heroUrl: string;
  email: string;
  emailKey: string;
  token: string;
  kind: string;
}) {
  const club = await createClub(dataConnect, {
    userId: sessionUserId(),
    id: input.clubId,
    slug: input.slug,
    name: input.name,
    localityId: input.localityId,
    location: input.location,
    presidentPhone: input.presidentPhone,
    description: input.description,
  });
  await requireSaved(club.data.club);
  const savedClub = club.data.club as { id?: string } | string | null;
  const clubId = (typeof savedClub === "string" ? savedClub : savedClub?.id) || input.clubId;
  await insertClubHero(dataConnect, {
    userId: sessionUserId(),
    id: crypto.randomUUID(),
    clubId,
    url: input.heroUrl,
  });
  await saveClubInvite(dataConnect, {
    clubId,
    emailKey: input.emailKey,
    email: input.email,
    role: "ADMIN",
    token: input.token,
    kind: input.kind,
  });
  if (input.kind === "SIGNUP") {
    await saveSignupInvite(dataConnect, {
      emailKey: input.emailKey,
      email: input.email,
      clubId,
      platform: false,
    });
  }
  const result = await approveTeamApplication(dataConnect, {
    id: input.id,
    clubId,
    slug: input.slug,
  });
  await requireSaved(result.data.application);
}

export async function invitePlatformAdmin(emailKey: string, email: string) {
  const result = await savePlatformAdminInvite(dataConnect, { emailKey, email });
  await requireSaved(result.data.invite);
  await saveSignupInvite(dataConnect, {
    emailKey,
    email,
    clubId: null,
    platform: true,
  });
}

export async function dropPlatformInvite(emailKey: string) {
  const result = await removePlatformAdminInvite(dataConnect, { emailKey });
  await requireSaved(result.data.invite);
}

export async function dropPlatformAdmin(userId: string) {
  const result = await removePlatformAdmin(dataConnect, { userId });
  await requireSaved(result.data.admin);
}

export async function inviteClubAdmin(input: {
  clubId: string;
  emailKey: string;
  email: string;
  role: string;
  token: string;
  kind: string;
  platform: boolean;
}) {
  const savedInvite = await saveClubInvite(dataConnect, {
    clubId: input.clubId,
    emailKey: input.emailKey,
    email: input.email,
    role: input.role,
    token: input.token,
    kind: input.kind,
  });
  await requireSaved(savedInvite.data.invite);
  if (input.kind === "SIGNUP") {
    await saveSignupInvite(dataConnect, {
      emailKey: input.emailKey,
      email: input.email,
      clubId: input.clubId,
      platform: input.platform,
    });
  } else {
    await clearSignupInvite(dataConnect, { emailKey: input.emailKey }).catch(() => undefined);
  }
}

export async function dropClubInvite(clubId: string, emailKey: string) {
  const result = await removeClubInvite(dataConnect, { clubId, emailKey });
  await requireSaved(result.data.invite);
  await clearSignupInvite(dataConnect, { emailKey }).catch(() => undefined);
}

export async function changeMemberRole(clubId: string, userId: string, role: string) {
  const result = await setClubMemberRole(dataConnect, { clubId, userId, role });
  await requireSaved(result.data.member);
}

export async function dropMember(clubId: string, userId: string) {
  const result = await removeClubMember(dataConnect, { clubId, userId });
  await requireSaved(result.data.member);
}
