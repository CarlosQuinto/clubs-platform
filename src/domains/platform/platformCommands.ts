import {
  adminAdmins,
  type AdminAdminsData,
  adminCover,
  type AdminCoverData,
  dataConnect,
  QueryFetchPolicy,
  removePlatformAdmin,
  removePlatformAdminInvite,
  replaceHeroImages as replaceHeroImagesMutation,
  savePlatformAdminInvite,
  savePlatformCover,
  savePlatformHeader,
  savePlatformSocial,
  saveSignupInvite,
} from "../../infrastructure/dataconnect";
import { savedRow } from "../../shared/saved";

export async function loadCover(): Promise<AdminCoverData> {
  return (await adminCover(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function saveHeader(name: string, motto: string, logoUrl: string) {
  const result = await savePlatformHeader(dataConnect, {
    name,
    motto,
    logoUrl,
  });
  savedRow(result.data.settings);
}

export async function saveCoverText(headline: string, tagline: string) {
  const result = await savePlatformCover(dataConnect, {
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
  const result = await savePlatformSocial(dataConnect, input);
  savedRow(result.data.settings);
}

/** Fotos del carrusel de portada como máximo. El SQL rechaza la séptima. */
export const MAX_HERO_IMAGES = 6;

/** Reemplaza el carrusel completo en una sola sentencia. */
export async function replaceHeroImages(urls: string[]) {
  const result = await replaceHeroImagesMutation(dataConnect, { urls: urls.join(" ") });
  savedRow(result.data.images);
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
