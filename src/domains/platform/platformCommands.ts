import {
  adminAdmins,
  type AdminAdminsData,
  adminCover,
  type AdminCoverData,
  clearHeroImages,
  dataConnect,
  QueryFetchPolicy,
  removePlatformAdmin,
  removePlatformAdminInvite,
  saveHeroImage,
  savePlatformAdminInvite,
  savePlatformCover,
  savePlatformHeader,
  savePlatformSocial,
  saveSignupInvite,
} from "../../infrastructure/dataconnect";
import { sessionUserId } from "../../infrastructure/auth";
import { savedRow } from "../../shared/saved";

export async function loadCover(): Promise<AdminCoverData> {
  return (await adminCover(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function saveHeader(name: string, motto: string, logoUrl: string) {
  const result = await savePlatformHeader(dataConnect, {
    userId: sessionUserId(),
    name,
    motto,
    logoUrl,
  });
  savedRow(result.data.settings);
}

export async function saveCoverText(headline: string, tagline: string) {
  const result = await savePlatformCover(dataConnect, {
    userId: sessionUserId(),
    headline,
    tagline,
  });
  savedRow(result.data.settings);
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
  savedRow(result.data.settings);
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
    savedRow(result.data.image);
  }
}

export async function loadAdmins(): Promise<AdminAdminsData> {
  return (await adminAdmins(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function invitePlatformAdmin(emailKey: string, email: string) {
  const result = await savePlatformAdminInvite(dataConnect, { emailKey, email });
  savedRow(result.data.invite);
  await saveSignupInvite(dataConnect, {
    emailKey,
    email,
    clubId: null,
    platform: true,
  });
}

export async function dropPlatformInvite(emailKey: string) {
  const result = await removePlatformAdminInvite(dataConnect, { emailKey });
  savedRow(result.data.invite);
}

export async function dropPlatformAdmin(userId: string) {
  const result = await removePlatformAdmin(dataConnect, { userId });
  savedRow(result.data.admin);
}
