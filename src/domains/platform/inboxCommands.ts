import {
  adminInbox,
  type AdminInboxData,
  approveTeamApplication,
  createClub,
  dataConnect,
  deleteInquiry,
  insertClubHero,
  QueryFetchPolicy,
  rejectTeamApplication,
  saveClubInvite,
  saveSignupInvite,
  setInquiryDone,
} from "../../infrastructure/dataconnect";
import { sessionUserId } from "../../infrastructure/auth";
import { savedRow } from "../../shared/saved";

export async function loadInbox(): Promise<AdminInboxData> {
  return (await adminInbox(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function finishInquiry(id: string) {
  const result = await setInquiryDone(dataConnect, { id });
  savedRow(result.data.inquiry);
}

export async function removeInquiry(id: string) {
  const result = await deleteInquiry(dataConnect, { id });
  savedRow(result.data.inquiry);
}

export async function rejectApplication(id: string) {
  const result = await rejectTeamApplication(dataConnect, { id });
  savedRow(result.data.application);
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
  savedRow(club.data.club);
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
  savedRow(result.data.application);
}
