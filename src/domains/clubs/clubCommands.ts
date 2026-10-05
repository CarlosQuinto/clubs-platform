import {
  adminClubPeople,
  type AdminClubPeopleData,
  adminClubs,
  type AdminClubsData,
  clearSignupInvite,
  createClub,
  createLocality,
  dataConnect,
  deleteClub,
  insertClubHero,
  QueryFetchPolicy,
  removeClubInvite,
  removeClubMember,
  saveClubInvite,
  saveSignupInvite,
  searchAdminClubs,
  setClubActive,
  setClubMemberRole,
  signupInviteByEmail,
} from "../../infrastructure/dataconnect";
import { sessionUserId } from "../../infrastructure/auth";
import { savedRow } from "../../shared/saved";
import { invalidateMySpaces } from "../auth/mySpaces";
import { emailKey as toEmailKey } from "../../shared/paths";

export const DATA_REVIEW_MESSAGE = "Los datos no pasaron la revisión.";

export async function loadClubs(): Promise<AdminClubsData> {
  return (await adminClubs(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function loadClubPeople(clubId: string): Promise<AdminClubPeopleData> {
  return (await adminClubPeople(dataConnect, { clubId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function signupInviteExists(emailKey: string) {
  const result = await signupInviteByEmail(
    dataConnect,
    { emailKey },
    { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
  );
  return Boolean(result.data.signupInvite);
}

export async function addLocality(name: string) {
  const result = await createLocality(dataConnect, {
    userId: sessionUserId(),
    id: crypto.randomUUID(),
    name,
  });
  if (!result.data.locality) throw new Error(DATA_REVIEW_MESSAGE);
  savedRow(result.data.locality);
}

export async function findAdminClubs(term: string) {
  const result = await searchAdminClubs(
    dataConnect,
    { term },
    { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
  );
  return result.data.clubs;
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
  if (!result.data.club) throw new Error(DATA_REVIEW_MESSAGE);
  savedRow(result.data.club);
  await insertClubHero(dataConnect, {
    userId: sessionUserId(),
    id: crypto.randomUUID(),
    clubId: id,
    url: input.heroUrl,
  });
  if (input.adminEmail) {
    const email = input.adminEmail.trim().toLowerCase();
    const key = toEmailKey(email);
    const savedInvite = await saveClubInvite(dataConnect, {
      clubId: id,
      emailKey: key,
      email,
      role: "ADMIN",
      token: crypto.randomUUID().replace(/-/g, ""),
      kind: "SIGNUP",
    });
    if (!savedInvite.data.invite) throw new Error(DATA_REVIEW_MESSAGE);
    savedRow(savedInvite.data.invite);
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
  savedRow(result.data.club);
}

export async function removeClub(id: string) {
  const result = await deleteClub(dataConnect, { userId: sessionUserId(), id });
  savedRow(result.data.club);
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
  savedRow(savedInvite.data.invite);
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
  savedRow(result.data.invite);
  await clearSignupInvite(dataConnect, { emailKey }).catch(() => undefined);
}

export async function changeMemberRole(clubId: string, userId: string, role: string) {
  const result = await setClubMemberRole(dataConnect, { clubId, userId, role });
  savedRow(result.data.member);
  invalidateMySpaces();
}

export async function dropMember(clubId: string, userId: string) {
  const result = await removeClubMember(dataConnect, { clubId, userId });
  savedRow(result.data.member);
  invalidateMySpaces();
}
