// Pruebas del panel /admin (db/migrations/1013_fn_admin.sql) sobre los datos dummy.
// La BD es efímera, pero se deja como estaba en lo que miran las demás pruebas (clubes, miembros, torneos, canchas).

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const ADMIN_UID = "11111111-1111-4111-8111-111111111101";
const BAHIA_PRES_UID = "11111111-1111-4111-8111-111111111106";
const USUARIO_UID = "11111111-1111-4111-8111-111111111199";
const HALCONES = "dummy-club-halcones";
const BAHIA = "dummy-club-bahia";
const NADIE = { emailKey: "nadie@demo,local", email: "nadie@demo.local" };
const TOKEN1 = "abcdefghijklmnop1234567890ABCDEF";
const TOKEN2 = "ZYXWVUTSRQPONMLK0987654321zyxwvu";
// Franjas de apertura de la semilla (scripts/demo/demo-seed.sql)
const WINDOWS = [
  ["f81a5836-dbc1-4558-afc7-9ba4d46bac94", 1], ["83bcf787-3865-44b5-a2a0-127fb62605d0", 2],
  ["80881834-a429-4d3e-ab1c-35f911a8b53d", 3], ["d4ad414d-0759-4bcf-a562-02def9ca3961", 4],
  ["892f3f11-6d3a-4340-a7d8-8cbb727d32ae", 5], ["441f05bb-5351-405d-a5a6-2a1f0ba3e6aa", 6],
  ["60880c95-62e5-45ab-a864-c2de4c17df30", 7],
];

const iso = (d) => d.toISOString().slice(0, 10);
const plusDays = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

export async function run({ db, rpc, check }) {
  if (!existsSync(join(ROOT, "scripts", "demo", "demo-seed.sql"))) {
    check(true, "sin datos dummy: se omiten las pruebas del panel");
    return;
  }
  const denied = (r) => r.error?.code === "42501";

  // ---------- Lecturas ----------
  const reads = ["admin_clubs", "admin_competition", "admin_cover", "admin_ads", "admin_inbox", "admin_courts"];
  for (const fn of reads) {
    const pres = await rpc("presidente", fn);
    check(denied(pres), `${fn}: presidente no puede (42501)`, pres);
    const anon = await rpc("anon", fn);
    check(denied(anon), `${fn}: anónimo no puede`, anon);
  }
  const search0 = await rpc("presidente", "search_admin_clubs", { term: "halcones" });
  check(denied(search0), "search_admin_clubs: presidente no puede", search0);
  const peopleBahia = await rpc("presidente", "admin_club_people", { clubId: BAHIA });
  check(denied(peopleBahia), "admin_club_people: presidente de otro club no puede", peopleBahia);
  const peopleDt = await rpc("dt", "admin_club_people", { clubId: HALCONES });
  check(denied(peopleDt), "admin_club_people: DT no puede", peopleDt);

  const clubs = await rpc("admin", "admin_clubs");
  check(clubs.data?.clubs?.length === 8 && clubs.data.localities.length === 3, "admin_clubs: 8 clubes y 3 localidades", clubs.error ?? clubs.data?.clubs?.length);
  check(clubs.data?.clubs?.[0]?.locality?.name && typeof clubs.data.clubs[0].location === "string", "admin_clubs: localidad y campos retirados", clubs.data?.clubs?.[0]);
  const search = await rpc("admin", "search_admin_clubs", { term: "HALCÓNES" });
  check(search.data?.clubs?.length === 1 && search.data.clubs[0].localityId === "dummy-loc-guaymas", "search_admin_clubs: sin acentos, con localityId", search.data);
  const searchShort = await rpc("admin", "search_admin_clubs", { term: "ha" });
  check(searchShort.data?.clubs?.length === 0, "search_admin_clubs: término corto no busca");
  const people = await rpc("presidente", "admin_club_people", { clubId: HALCONES });
  check(people.data?.clubMembers?.length === 4 && people.data.clubMembers.every((m) => m.user?.id && m.role), "admin_club_people: presidente ve a su club", people.error ?? people.data);
  const peopleAdmin = await rpc("admin", "admin_club_people", { clubId: BAHIA });
  check(peopleAdmin.data?.clubMembers?.length === 1 && Array.isArray(peopleAdmin.data.clubInvites), "admin_club_people: superadmin ve cualquier club", peopleAdmin.error);
  const comp = await rpc("admin", "admin_competition");
  check(comp.data?.seasons?.length === 2 && comp.data.categories.length === 3 && comp.data.tournaments.length === 4 && comp.data.tournaments[0].season?.id, "admin_competition", comp.error ?? comp.data);
  check(/^\d{4}-\d{2}-\d{2}$/.test(comp.data?.seasons?.[0]?.startDate ?? ""), "admin_competition: fechas YYYY-MM-DD", comp.data?.seasons?.[0]);
  const cover = await rpc("admin", "admin_cover");
  check(typeof cover.data?.platformSettings?.name === "string" && Array.isArray(cover.data.platformHeroImages), "admin_cover", cover.error ?? cover.data);
  const heroBefore = (cover.data?.platformHeroImages ?? []).map((h) => h.url);
  const ads = await rpc("admin", "admin_ads");
  check(ads.data?.ads?.length === 3 && ads.data.ads[0].adPlacements_on_ad.length === 2 && ads.data.ads[0].status === "EN_CURSO", "admin_ads: anuncios con ubicaciones", ads.error ?? ads.data);
  const inbox = await rpc("admin", "admin_inbox");
  check(inbox.data?.inquiries?.length >= 3 && inbox.data.teamApplications.length >= 3 && inbox.data.localities.length === 3, "admin_inbox", inbox.error ?? inbox.data);
  check(/Z$/.test(inbox.data?.inquiries?.[0]?.createdAt ?? "") && inbox.data?.teamApplications?.[0]?.club === null, "admin_inbox: createdAt ISO y club opcional", inbox.data?.inquiries?.[0]);
  const courts = await rpc("admin", "admin_courts");
  check(courts.data?.courts?.length === 4 && typeof courts.data.platformSettings?.courtSlotMinutes === "number", "admin_courts: canchas y ajustes", courts.error ?? courts.data);
  const matchHold = courts.data?.courtHolds?.find((h) => h.source === "MATCH");
  check(matchHold?.match?.homeClub?.name && matchHold.match.awayClub?.name && matchHold.match.tournament?.durationMinutes, "admin_courts: apartado de partido con clubes y duración", matchHold);

  // ---------- Localidades y clubes ----------
  const loc = await rpc("admin", "create_locality", { id: "prueba-loc-1", name: "villa  juarez" });
  check(loc.data?.locality?.id === "prueba-loc-1", "create_locality: válida", loc);
  const locPres = await rpc("presidente", "create_locality", { userId: ADMIN_UID, id: "prueba-loc-2", name: "Otra" });
  check(locPres.data?.locality === null, "create_locality: presidente -> null aunque mande userId", locPres);
  const locDup = await rpc("admin", "create_locality", { id: "prueba-loc-3", name: "Villa Juarez" });
  check(locDup.data?.locality === null, "create_locality: nombre repetido -> null", locDup);
  const locs = (await rpc("admin", "admin_clubs")).data?.localities ?? [];
  check(locs.some((l) => l.id === "prueba-loc-1" && l.name === "Villa Juarez"), "create_locality: initcap y espacios", locs);

  const clubVars = { id: "prueba-club-1", slug: "club-prueba", name: "Club Prueba", localityId: "prueba-loc-1", location: "", presidentPhone: "6221234567", description: "Datos de prueba" };
  const clubPres = await rpc("presidente", "create_club", { userId: ADMIN_UID, ...clubVars });
  check(clubPres.data?.club === null, "create_club: presidente -> null", clubPres);
  const clubReserved = await rpc("admin", "create_club", { ...clubVars, slug: "admin" });
  check(clubReserved.data?.club === null, "create_club: slug reservado -> null", clubReserved);
  const clubBadPhone = await rpc("admin", "create_club", { ...clubVars, presidentPhone: "123" });
  check(clubBadPhone.data?.club === null, "create_club: teléfono inválido -> null", clubBadPhone);
  const club = await rpc("admin", "create_club", clubVars);
  check(club.data?.club?.id === "prueba-club-1", "create_club: válido", club);
  const clubDupSlug = await rpc("admin", "create_club", { ...clubVars, id: "prueba-club-2" });
  check(clubDupSlug.data?.club === null, "create_club: slug repetido -> null", clubDupSlug);
  const clubLower = await rpc("admin", "create_club", { ...clubVars, id: "prueba-club-3", slug: "halcones-del-mar", name: "halcones del mar" });
  const clubLowerRow = (await rpc("admin", "admin_clubs")).data?.clubs?.find((c) => c.id === "prueba-club-3");
  check(clubLower.data?.club?.id === "prueba-club-3" && clubLowerRow?.name === "Halcones Del Mar", "create_club: nombre en Title Case (initcap)", clubLowerRow?.name);
  await db.exec("DELETE FROM clubs WHERE id = 'prueba-club-3'"); // el resto de pruebas cuenta clubes

  const hero = await rpc("admin", "insert_club_hero", { id: "0f1e2d3c-4b5a-4968-8777-665544332211", clubId: "prueba-club-1", url: "https://a/hero.jpg" });
  check(hero.data?.hero?.id === "prueba-club-1", "insert_club_hero: válido", hero);
  const heroPres = await rpc("presidente", "insert_club_hero", { userId: ADMIN_UID, id: "0f1e2d3c-4b5a-4968-8777-665544332212", clubId: HALCONES, url: "https://a/x.jpg" });
  check(heroPres.data?.hero === null, "insert_club_hero: presidente -> null", heroPres);

  const offBad = await rpc("admin", "set_club_active", { id: "prueba-club-1", active: false, reason: "no" });
  check(offBad.data?.club === null, "set_club_active: motivo corto -> null", offBad);
  const off = await rpc("admin", "set_club_active", { id: "prueba-club-1", active: false, reason: "Falta documentación" });
  check(off.data?.club?.id === "prueba-club-1", "set_club_active: desactivar con motivo", off);
  const offRow = (await rpc("admin", "admin_clubs")).data?.clubs?.find((c) => c.id === "prueba-club-1");
  check(offRow?.active === false && offRow.disabledReason === "Falta documentación", "set_club_active: motivo guardado", offRow);
  const onPres = await rpc("presidente", "set_club_active", { userId: ADMIN_UID, id: "prueba-club-1", active: true });
  check(onPres.data?.club === null, "set_club_active: presidente -> null", onPres);
  const on = await rpc("admin", "set_club_active", { id: "prueba-club-1", active: true });
  check(on.data?.club?.id === "prueba-club-1", "set_club_active: reactivar", on);

  // Solicitudes de equipo
  const approvePres = await rpc("presidente", "approve_team_application", { id: "dummy-solicitud-1", clubId: "prueba-club-1", slug: "club-prueba" });
  check(approvePres.data?.application === null, "approve_team_application: presidente -> null", approvePres);
  const approve = await rpc("admin", "approve_team_application", { id: "dummy-solicitud-1", clubId: "prueba-club-1", slug: "club-prueba" });
  check(approve.data?.application?.id === "dummy-solicitud-1", "approve_team_application: válida", approve);
  const approveAgain = await rpc("admin", "approve_team_application", { id: "dummy-solicitud-1", clubId: "prueba-club-1", slug: "club-prueba" });
  check(approveAgain.data?.application === null, "approve_team_application: ya revisada -> null", approveAgain);
  const rejectPres = await rpc("presidente", "reject_team_application", { id: "dummy-solicitud-2" });
  check(rejectPres.data?.application === null, "reject_team_application: presidente -> null", rejectPres);
  const reject = await rpc("admin", "reject_team_application", { id: "dummy-solicitud-2" });
  check(reject.data?.application?.id === "dummy-solicitud-2", "reject_team_application: válida", reject);
  const apps = (await rpc("admin", "admin_inbox")).data?.teamApplications ?? [];
  check(apps.find((a) => a.id === "dummy-solicitud-1")?.club?.id === "prueba-club-1" && apps.find((a) => a.id === "dummy-solicitud-2")?.status === "REJECTED", "admin_inbox: solicitudes actualizadas", apps);

  // ---------- Invitaciones y miembros (superadmin) ----------
  const inviteVars = { clubId: HALCONES, ...NADIE, role: "PRENSA", token: TOKEN1, kind: "SIGNUP" };
  const inviteUser = await rpc("usuario", "save_club_invite", inviteVars);
  check(inviteUser.data?.invite === null, "save_club_invite: usuario sin rol -> null", inviteUser);
  const inviteBadKey = await rpc("admin", "save_club_invite", { ...inviteVars, emailKey: "otra@demo,local" });
  check(inviteBadKey.data?.invite === null, "save_club_invite: emailKey distinto del correo -> null", inviteBadKey);
  const invite = await rpc("admin", "save_club_invite", inviteVars);
  check(invite.data?.invite?.id === NADIE.emailKey, "save_club_invite: superadmin invita", invite);
  const inviteDup = await rpc("admin", "save_club_invite", inviteVars);
  check(inviteDup.data?.invite === null, "save_club_invite: repetida -> null", inviteDup);
  const signup = await rpc("admin", "save_signup_invite", { ...NADIE, clubId: HALCONES, platform: false });
  check(signup.data?.invite?.id === NADIE.emailKey, "save_signup_invite: superadmin", signup);
  const accept = await rpc("usuario", "accept_club_invite", { clubId: HALCONES, emailKey: NADIE.emailKey, token: TOKEN1, displayName: "Nadie Demo" });
  check(accept.data?.member?.id === USUARIO_UID, "accept_club_invite: el invitado entra al club", accept);
  const people5 = (await rpc("admin", "admin_club_people", { clubId: HALCONES })).data;
  check(people5?.clubMembers?.length === 5 && people5.clubInvites.length === 0, "admin_club_people: 5 miembros y sin invitaciones", people5);

  const rolePres = await rpc("presidente", "set_club_member_role", { clubId: HALCONES, userId: USUARIO_UID, role: "TESORERO" });
  check(rolePres.data?.member?.id === USUARIO_UID, "set_club_member_role: presidente en su club", rolePres);
  const roleBad = await rpc("presidente", "set_club_member_role", { clubId: HALCONES, userId: USUARIO_UID, role: "JEFE" });
  check(roleBad.data?.member === null, "set_club_member_role: rol inválido -> null", roleBad);
  const roleOther = await rpc("presidente", "set_club_member_role", { clubId: BAHIA, userId: BAHIA_PRES_UID, role: "DT" });
  check(roleOther.data?.member === null, "set_club_member_role: presidente en otro club -> null", roleOther);
  const roleDt = await rpc("dt", "set_club_member_role", { clubId: HALCONES, userId: USUARIO_UID, role: "DT" });
  check(roleDt.data?.member === null, "set_club_member_role: DT no puede -> null", roleDt);
  const roleAdmin = await rpc("admin", "set_club_member_role", { clubId: HALCONES, userId: USUARIO_UID, role: "PRENSA" });
  check(roleAdmin.data?.member?.id === USUARIO_UID, "set_club_member_role: superadmin", roleAdmin);
  const roleRow = (await rpc("admin", "admin_club_people", { clubId: HALCONES })).data?.clubMembers?.find((m) => m.user.id === USUARIO_UID);
  check(roleRow?.role === "PRENSA" && roleRow.displayName === "Nadie Demo", "set_club_member_role: rol guardado", roleRow);

  const removeOther = await rpc("presidente", "remove_club_member", { clubId: BAHIA, userId: BAHIA_PRES_UID });
  check(removeOther.data?.member === null, "remove_club_member: presidente en otro club -> null", removeOther);
  const removeAdmin = await rpc("admin", "remove_club_member", { clubId: HALCONES, userId: USUARIO_UID });
  check(removeAdmin.data?.member?.id === USUARIO_UID, "remove_club_member: superadmin", removeAdmin);

  // ---------- Invitaciones y miembros (presidente) ----------
  const INV = { emailKey: "invitado@demo,local", email: "invitado@demo.local" };
  const pInviteBahia = await rpc("presidente", "save_club_invite", { clubId: BAHIA, ...INV, role: "DT", token: TOKEN2, kind: "SIGNUP" });
  check(pInviteBahia.data?.invite === null, "save_club_invite: presidente en otro club -> null", pInviteBahia);
  const pInviteDt = await rpc("dt", "save_club_invite", { clubId: HALCONES, ...INV, role: "DT", token: TOKEN2, kind: "SIGNUP" });
  check(pInviteDt.data?.invite === null, "save_club_invite: DT -> null", pInviteDt);
  const pInvite = await rpc("presidente", "save_club_invite", { clubId: HALCONES, ...INV, role: "DT", token: TOKEN2, kind: "SIGNUP" });
  check(pInvite.data?.invite?.id === INV.emailKey, "save_club_invite: presidente en su club", pInvite);
  const pSignupPlatform = await rpc("presidente", "save_signup_invite", { ...INV, clubId: HALCONES, platform: true });
  check(pSignupPlatform.data?.invite === null, "save_signup_invite: presidente no da acceso de plataforma -> null", pSignupPlatform);
  const pSignup = await rpc("presidente", "save_signup_invite", { ...INV, clubId: HALCONES, platform: false });
  check(pSignup.data?.invite?.id === INV.emailKey, "save_signup_invite: presidente con invitación previa", pSignup);
  const pSignupBahia = await rpc("presidente", "save_signup_invite", { emailKey: "x@demo,local", email: "x@demo.local", clubId: BAHIA, platform: false });
  check(pSignupBahia.data?.invite === null, "save_signup_invite: sin invitación del club -> null", pSignupBahia);
  const pClearDt = await rpc("dt", "clear_signup_invite", { emailKey: INV.emailKey });
  check(pClearDt.data?.invite === null, "clear_signup_invite: DT -> null", pClearDt);
  const pClear = await rpc("presidente", "clear_signup_invite", { emailKey: INV.emailKey });
  check(pClear.data?.invite?.id === INV.emailKey, "clear_signup_invite: presidente de ese club", pClear);
  const pClearAgain = await rpc("presidente", "clear_signup_invite", { emailKey: INV.emailKey });
  check(pClearAgain.data?.invite === null, "clear_signup_invite: ya no existe -> null", pClearAgain);
  const pRemoveBahia = await rpc("presidente", "remove_club_invite", { clubId: BAHIA, emailKey: INV.emailKey });
  check(pRemoveBahia.data?.invite === null, "remove_club_invite: presidente en otro club -> null", pRemoveBahia);
  const pRemove = await rpc("presidente", "remove_club_invite", { clubId: HALCONES, emailKey: INV.emailKey });
  check(pRemove.data?.invite?.id === INV.emailKey, "remove_club_invite: presidente en su club", pRemove);

  // El presidente invita, el invitado entra y el presidente lo saca
  const pInvite2 = await rpc("presidente", "save_club_invite", { clubId: HALCONES, ...NADIE, role: "PRENSA", token: TOKEN2, kind: "SIGNUP" });
  check(pInvite2.data?.invite?.id === NADIE.emailKey, "save_club_invite: presidente invita de nuevo", pInvite2);
  const accept2 = await rpc("usuario", "accept_club_invite", { clubId: HALCONES, emailKey: NADIE.emailKey, token: TOKEN2, displayName: "Nadie Demo" });
  check(accept2.data?.member?.id === USUARIO_UID, "accept_club_invite: segunda vez", accept2);
  const pRemoveMember = await rpc("presidente", "remove_club_member", { clubId: HALCONES, userId: USUARIO_UID });
  check(pRemoveMember.data?.member?.id === USUARIO_UID, "remove_club_member: presidente en su club", pRemoveMember);
  const people4 = (await rpc("admin", "admin_club_people", { clubId: HALCONES })).data;
  check(people4?.clubMembers?.length === 4 && people4.clubInvites.length === 0, "admin_club_people: vuelve a 4 miembros", people4);

  // ---------- Borrar club ----------
  await rpc("admin", "save_club_invite", { clubId: "prueba-club-1", emailKey: "x@demo,local", email: "x@demo.local", role: "ADMIN", token: TOKEN1, kind: "SIGNUP" });
  const delClubPres = await rpc("presidente", "delete_club", { userId: ADMIN_UID, id: "prueba-club-1" });
  check(delClubPres.data?.club === null && delClubPres.data?.invites === null, "delete_club: presidente -> null", delClubPres);
  const delClub = await rpc("admin", "delete_club", { id: "prueba-club-1" });
  check(delClub.data?.club?.id === "prueba-club-1" && delClub.data.invites?.id === "x@demo,local", "delete_club: borrado lógico e invitaciones", delClub);
  const delClubAgain = await rpc("admin", "delete_club", { id: "prueba-club-1" });
  check(delClubAgain.data?.club === null, "delete_club: ya borrado -> null", delClubAgain);
  const clubsAfter = (await rpc("admin", "admin_clubs")).data?.clubs ?? [];
  check(clubsAfter.length === 8 && !clubsAfter.some((c) => c.id === "prueba-club-1"), "admin_clubs: el club borrado no se lista", clubsAfter.length);

  // ---------- Competición ----------
  const seasonPres = await rpc("presidente", "create_season", { userId: ADMIN_UID, id: "prueba-season-1", name: "2027", startDate: "2027-01-01", endDate: "2027-12-31", active: false });
  check(seasonPres.data?.season === null, "create_season: presidente -> null", seasonPres);
  const seasonBad = await rpc("admin", "create_season", { id: "prueba-season-1", name: "2027", startDate: "2027-12-31", endDate: "2027-01-01", active: false });
  check(seasonBad.data?.season === null, "create_season: fin antes del inicio -> null", seasonBad);
  const season = await rpc("admin", "create_season", { id: "prueba-season-1", name: "2027", startDate: "2027-01-01", endDate: "2027-12-31", active: true });
  check(season.data?.season?.id === "prueba-season-1", "create_season: válida", season);
  const seasonRow = (await rpc("admin", "admin_competition")).data?.seasons?.find((s) => s.id === "prueba-season-1");
  check(seasonRow?.active === true && seasonRow.endDate === "2027-12-31", "create_season: guardada activa", seasonRow);
  const closePres = await rpc("presidente", "set_season_active", { userId: ADMIN_UID, id: "prueba-season-1", active: false });
  check(closePres.data?.season === null, "set_season_active: presidente -> null", closePres);
  const reopenSeason = await rpc("admin", "set_season_active", { id: "prueba-season-1", active: true });
  check(reopenSeason.data?.season === null, "set_season_active: una temporada no se reabre -> null", reopenSeason);

  const catPres = await rpc("presidente", "create_category", { userId: ADMIN_UID, id: "prueba-cat-1", name: "Sub Veinte", sortOrder: 9 });
  check(catPres.data?.category === null, "create_category: presidente -> null", catPres);
  const catDup = await rpc("admin", "create_category", { id: "prueba-cat-1", name: "veteranos", sortOrder: 9 });
  check(catDup.data?.category === null, "create_category: nombre repetido -> null", catDup);
  const catSpaces = await rpc("admin", "create_category", { id: "prueba-cat-1", name: "sub  veinte", sortOrder: 9 });
  check(catSpaces.data?.category === null, "create_category: doble espacio -> null (misma regla que el formulario)", catSpaces);
  const cat = await rpc("admin", "create_category", { id: "prueba-cat-1", name: "sub veinte", sortOrder: 9 });
  check(cat.data?.category?.id === "prueba-cat-1", "create_category: válida", cat);
  const catRow = (await rpc("admin", "admin_competition")).data?.categories?.find((c) => c.id === "prueba-cat-1");
  check(catRow?.name === "Sub Veinte" && catRow.sortOrder === 9, "create_category: initcap", catRow);

  const tourVars = { id: "prueba-tour-1", name: "Copa Prueba", seasonId: "prueba-season-1", categoryId: "prueba-cat-1", groupId: "prueba-group-1", footballType: "FUT_7", durationMinutes: 60, startDate: "2027-03-01", prize: "$1,000 MXN" };
  const tourPres = await rpc("presidente", "create_tournament", { userId: ADMIN_UID, ...tourVars });
  check(tourPres.data?.tournament === null && tourPres.data?.grouped === null, "create_tournament: presidente -> null", tourPres);
  const tourBadPrize = await rpc("admin", "create_tournament", { ...tourVars, prize: "<script>" });
  check(tourBadPrize.data?.grouped === null && tourBadPrize.data?.tournament === null, "create_tournament: premio inválido -> null", tourBadPrize);
  const tourOutOfSeason = await rpc("admin", "create_tournament", { ...tourVars, startDate: "2028-01-01" });
  check(tourOutOfSeason.data?.tournament === null, "create_tournament: fecha fuera de temporada -> null", tourOutOfSeason);
  const orphanGroups = await db.query("SELECT count(*)::int AS n FROM tournament_groups WHERE id = 'prueba-group-1'");
  check(orphanGroups.rows[0].n === 0, "create_tournament: no deja grupo huérfano al fallar");
  const tour = await rpc("admin", "create_tournament", tourVars);
  check(tour.data?.grouped?.id === "prueba-group-1" && tour.data.tournament?.id === "prueba-tour-1" && tour.data.prized?.id === "prueba-tour-1", "create_tournament: válido", tour);
  const tourRow = await db.query("SELECT prize, status::text AS status, legs FROM tournaments WHERE id = 'prueba-tour-1'");
  check(tourRow.rows[0]?.prize === "$1,000 MXN" && tourRow.rows[0].status === "UPCOMING" && tourRow.rows[0].legs === 2, "create_tournament: premio y estado", tourRow.rows[0]);
  const delSeasonBusy = await rpc("admin", "delete_season", { id: "prueba-season-1" });
  check(delSeasonBusy.data?.season === null, "delete_season: con torneos -> null", delSeasonBusy);
  const compStatus = (await rpc("admin", "admin_competition")).data?.tournaments?.find((t) => t.id === "prueba-tour-1");
  check(compStatus?.status === "UPCOMING" && compStatus.season.id === "prueba-season-1", "admin_competition: estado del torneo", compStatus);
  const closeOpen = await rpc("admin", "set_season_active", { id: "prueba-season-1", active: false });
  check(closeOpen.data?.season === null && closeOpen.data?.openTournaments === 1, "set_season_active: con torneos abiertos -> null y los cuenta", closeOpen.data);
  const closeForced = await rpc("admin", "set_season_active", { id: "prueba-season-1", active: false, force: true });
  const forcedRows = await db.query("SELECT (SELECT status::text FROM tournaments WHERE id = 'prueba-tour-1') AS status, (SELECT active FROM seasons WHERE id = 'prueba-season-1') AS active");
  check(closeForced.data?.season?.id === "prueba-season-1" && closeForced.data.closedTournaments === 1 && forcedRows.rows[0].status === "FINISHED" && forcedRows.rows[0].active === false, "set_season_active: forzar cierra los torneos y la temporada", { closeForced: closeForced.data, row: forcedRows.rows[0] });
  const reopenLocked = await rpc("admin", "reopen_tournament", { id: "prueba-tour-1" });
  check(reopenLocked.data?.tournament === null, "reopen_tournament: temporada cerrada -> null", reopenLocked);
  // No hay RPC de borrado de torneo en este bloque: se limpia por SQL
  await db.exec("DELETE FROM tournaments WHERE id = 'prueba-tour-1'; DELETE FROM tournament_groups WHERE id = 'prueba-group-1'; DELETE FROM categories WHERE id = 'prueba-cat-1';");
  const delSeasonPres = await rpc("presidente", "delete_season", { userId: ADMIN_UID, id: "prueba-season-1" });
  check(delSeasonPres.data?.season === null, "delete_season: presidente -> null", delSeasonPres);
  const delSeason = await rpc("admin", "delete_season", { id: "prueba-season-1" });
  check(delSeason.data?.season?.id === "prueba-season-1", "delete_season: válida", delSeason);
  const compAfter = (await rpc("admin", "admin_competition")).data;
  check(compAfter?.seasons?.length === 2 && compAfter.categories.length === 3 && compAfter.tournaments.length === 4, "admin_competition: todo como estaba", compAfter);

  // ---------- Portada, redes y carrusel ----------
  const headerBad = await rpc("admin", "save_platform_header", { name: "Liga <b>", motto: "", logoUrl: "" });
  check(headerBad.data?.settings === null, "save_platform_header: nombre inválido -> null", headerBad);
  const headerPres = await rpc("presidente", "save_platform_header", { name: "Liga Prueba", motto: "", logoUrl: "" });
  check(headerPres.data?.settings === null, "save_platform_header: presidente -> null", headerPres);
  const header = await rpc("admin", "save_platform_header", { name: "Liga Prueba", motto: "Juego limpio", logoUrl: "https://a/logo.png" });
  check(header.data?.settings?.id === "config", "save_platform_header: válido", header);
  const coverBad = await rpc("admin", "save_platform_cover", { headline: "x".repeat(36), tagline: "" });
  check(coverBad.data?.settings === null, "save_platform_cover: titular largo -> null", coverBad);
  const coverOk = await rpc("admin", "save_platform_cover", { headline: "Liga amateur de futbol", tagline: "Temporada 2026" });
  check(coverOk.data?.settings?.id === "config", "save_platform_cover: válido", coverOk);
  const socialBad = await rpc("admin", "save_platform_social", { instagram: "", facebook: "", x: "", youtube: "", whatsapp: "abc" });
  check(socialBad.data?.settings === null, "save_platform_social: whatsapp inválido -> null", socialBad);
  const social = await rpc("admin", "save_platform_social", { instagram: "LigaPrueba", facebook: "", x: "", youtube: "https://youtube.com/channel/UCabc", whatsapp: "6221234567" });
  check(social.data?.settings?.id === "config", "save_platform_social: válido", social);
  const coverRow = (await rpc("admin", "admin_cover")).data?.platformSettings;
  check(coverRow?.name === "Liga Prueba" && coverRow.motto === "Juego limpio" && coverRow.tagline === "Temporada 2026" && coverRow.instagram === "ligaprueba" && coverRow.youtube === "https://youtube.com/channel/UCabc", "admin_cover: cambios guardados", coverRow);
  await rpc("admin", "save_platform_header", { name: "Clubs Platform", motto: "", logoUrl: "" });

  const heroPres2 = await rpc("presidente", "replace_hero_images", { urls: "https://a/1.jpg" });
  check(heroPres2.data?.images === null, "replace_hero_images: presidente -> null", heroPres2);
  const heroMany = await rpc("admin", "replace_hero_images", { urls: Array.from({ length: 7 }, (_, i) => `https://a/${i}.jpg`).join(" ") });
  check(heroMany.data?.images === null, "replace_hero_images: más de 6 -> null", heroMany);
  const heroBadUrl = await rpc("admin", "replace_hero_images", { urls: "ftp://a/1.jpg" });
  check(heroBadUrl.data?.images === null, "replace_hero_images: URL inválida -> null", heroBadUrl);
  const hero2 = await rpc("admin", "replace_hero_images", { urls: "https://a/1.jpg https://a/2.jpg" });
  check(hero2.data?.images?.id === "config", "replace_hero_images: dos imágenes", hero2);
  const heroRows = (await rpc("admin", "admin_cover")).data?.platformHeroImages ?? [];
  check(heroRows.length === 2 && heroRows[0].position === 0 && heroRows[1].url === "https://a/2.jpg" && typeof heroRows[0].id === "string", "admin_cover: carrusel con posiciones", heroRows);
  await rpc("admin", "replace_hero_images", { urls: "https://a/3.jpg" });
  const heroRows1 = (await rpc("admin", "admin_cover")).data?.platformHeroImages ?? [];
  check(heroRows1.length === 1 && heroRows1[0].url === "https://a/3.jpg", "replace_hero_images: recorta las sobrantes", heroRows1);
  await rpc("admin", "replace_hero_images", { urls: heroBefore.join(" ") });

  // ---------- Nombre de la cuenta (db/migrations/0005_auth_display_name.sql) ----------
  // Insertar exigiría invitación (trigger BEFORE INSERT); el trigger de actualización aplica la misma regla.
  // Se usa el presidente porque tiene cuenta en auth.users (el «usuario» sin club solo existe en users).
  const PRES_UID = "11111111-1111-4111-8111-111111111102";
  const nameBefore = (await db.query(
    "SELECT u.raw_user_meta_data, p.display_name FROM auth.users u JOIN users p ON p.id = u.id::text WHERE u.id = $1::uuid",
    [PRES_UID],
  )).rows[0];
  await db.query("UPDATE auth.users SET raw_user_meta_data = $2::jsonb WHERE id = $1::uuid",
    [PRES_UID, JSON.stringify({ display_name: "  Ana   " + "b".repeat(60) })]);
  const longName = await db.query("SELECT display_name FROM users WHERE id = $1", [PRES_UID]);
  check(longName.rows[0]?.display_name === ("Ana " + "b".repeat(60)).slice(0, 40), "auth.users: el nombre se recorta a 40 con espacios simples", longName.rows[0]);
  await db.query("UPDATE auth.users SET raw_user_meta_data = $2::jsonb WHERE id = $1::uuid", [PRES_UID, JSON.stringify(nameBefore?.raw_user_meta_data ?? {})]);
  await db.query("UPDATE users SET display_name = $2 WHERE id = $1", [PRES_UID, nameBefore?.display_name ?? ""]);

  // ---------- Canchas ----------
  const WIN7 = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, startTime: "07:00", endTime: "23:00" }));
  const modulePres = await rpc("presidente", "save_court_module", { enabled: true, slotMinutes: 60, windows: WIN7 });
  check(modulePres.data?.saved === null, "save_court_module: presidente -> null", modulePres);
  const moduleSlot = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 45, windows: WIN7 });
  check(moduleSlot.data?.saved === null, "save_court_module: paso de 45 -> null", moduleSlot);
  const moduleBad = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: [{ weekday: 1, startTime: "07:00", endTime: "06:00" }] });
  check(moduleBad.data?.saved === null, "save_court_module: franja al revés -> null", moduleBad);
  const moduleDay = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: [{ weekday: 8, startTime: "07:00", endTime: "08:00" }] });
  check(moduleDay.data?.saved === null, "save_court_module: día 8 -> null", moduleDay);
  const moduleTime = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: [{ weekday: 1, startTime: "7:00", endTime: "08:00" }] });
  check(moduleTime.data?.saved === null, "save_court_module: hora sin dos dígitos -> null", moduleTime);
  const moduleOk = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: WIN7 });
  check(moduleOk.data?.saved?.id === "config" && moduleOk.data.removed?.length === 0 && moduleOk.data.conflicts?.length === 0, "save_court_module: 7 franjas", moduleOk);
  const courtsRead = (await rpc("admin", "admin_courts")).data;
  check(courtsRead?.courtOpenWindows?.length === 7 && courtsRead.platformSettings.courtsEnabled === true && courtsRead.platformSettings.courtSlotMinutes === 60, "admin_courts: franjas y ajustes", courtsRead?.courtOpenWindows?.length);
  // Sin franjas, las rentas de la semilla (por la tarde, en fechas futuras) quedan fuera: no se guarda
  const moduleEmpty = await rpc("admin", "save_court_module", { enabled: false, slotMinutes: 30, windows: [] });
  check(moduleEmpty.data?.saved === null && moduleEmpty.data?.conflicts?.length >= 1 && moduleEmpty.data.conflicts.every((c) => c.guestEmail !== undefined), "save_court_module: sin franjas, las rentas pendientes salen en conflicts", moduleEmpty);
  const moduleStill = (await rpc("admin", "admin_courts")).data;
  check(moduleStill?.courtOpenWindows?.length === 7 && moduleStill.platformSettings.courtsEnabled === true, "save_court_module: con conflicts no cambia nada", moduleStill?.platformSettings);

  const courtVars = { id: "prueba-court-1", name: "campo prueba", description: "Pasto", hourlyRate: 123.456, football: true, imageUrl: "", sortOrder: 5, active: true, location: "" };
  const courtPres = await rpc("presidente", "save_court", { userId: ADMIN_UID, ...courtVars });
  check(courtPres.data?.court === null, "save_court: presidente -> null", courtPres);
  const courtBad = await rpc("admin", "save_court", { ...courtVars, name: "Nombre demasiado largo" });
  check(courtBad.data?.court === null, "save_court: nombre largo -> null", courtBad);
  const court = await rpc("admin", "save_court", courtVars);
  check(court.data?.court?.id === "prueba-court-1", "save_court: válida", court);
  const courtRow = (await rpc("admin", "admin_courts")).data?.courts?.find((c) => c.id === "prueba-court-1");
  check(courtRow?.name === "Campo Prueba" && courtRow.hourlyRate === 123.46 && courtRow.imageUrl === null, "save_court: initcap, redondeo e imagen nula", courtRow);
  const courtEdit = await rpc("admin", "save_court", { ...courtVars, hourlyRate: 200, location: "Col. Centro" });
  check(courtEdit.data?.court?.id === "prueba-court-1", "save_court: edición", courtEdit);
  // La URL pública del bucket en desarrollo es http://localhost:8000/...: tiene que aceptarse
  const localImage = "http://localhost:8000/storage/v1/object/public/media/platform/courts/1.jpg";
  const courtPhoto = await rpc("admin", "save_court", { ...courtVars, imageUrl: localImage });
  check(courtPhoto.data?.court?.id === "prueba-court-1", "save_court: foto con URL http del bucket local", courtPhoto);
  const courtBadPhoto = await rpc("admin", "save_court", { ...courtVars, imageUrl: "ftp://x y" });
  check(courtBadPhoto.data?.court === null, "save_court: URL de foto inválida -> null", courtBadPhoto);

  const holdDate = plusDays(7);
  const holdVars = { id: "prueba-hold-1", courtId: "prueba-court-1", holdDate, startTime: "10:00", endTime: "11:00", note: "juan perez · cumple", guestEmail: "Juan@Correo.com", fresh: true };
  const holdPres = await rpc("presidente", "save_court_hold", { userId: ADMIN_UID, ...holdVars });
  check(holdPres.data?.hold === null, "save_court_hold: presidente -> null", holdPres);
  const holdOffGrid = await rpc("admin", "save_court_hold", { ...holdVars, startTime: "10:15" });
  check(holdOffGrid.data?.hold === null, "save_court_hold: fuera de la rejilla -> null", holdOffGrid);
  const holdPast = await rpc("admin", "save_court_hold", { ...holdVars, holdDate: "2020-01-01" });
  check(holdPast.data?.hold === null, "save_court_hold: fecha pasada -> null", holdPast);
  const holdClosed = await rpc("admin", "save_court_hold", { ...holdVars, startTime: "05:00", endTime: "06:00" });
  check(holdClosed.data?.hold === null, "save_court_hold: fuera de la apertura -> null", holdClosed);
  const hold = await rpc("admin", "save_court_hold", holdVars);
  check(hold.data?.hold?.id === "prueba-hold-1", "save_court_hold: válido", hold);

  // El horario nuevo deja fuera el apartado de 10:00 a 11:00 (dos franjas por día: 07-10 y 11-23); las rentas
  // de la semilla son por la tarde y siguen dentro.
  // Un recorte del horario también desprograma los partidos que caen en él (con force): se guardan y se
  // restauran para que las pruebas de liga vean la semilla intacta.
  const snapshotMatches = async (ids) => ({
    matches: (await db.query("SELECT id, status::text AS status, match_date::text AS match_date, start_time, court_id, venue FROM matches WHERE id = ANY($1::text[])", [ids])).rows,
    holds: (await db.query("SELECT id, court_id, hold_date::text AS hold_date, start_time, end_time, match_id FROM court_holds WHERE match_id = ANY($1::text[])", [ids])).rows,
  });
  const restoreMatches = async (snap) => {
    for (const m of snap.matches) {
      await db.query("UPDATE matches SET status = $2::match_status, match_date = $3::date, start_time = $4, court_id = $5, venue = $6 WHERE id = $1",
        [m.id, m.status, m.match_date, m.start_time, m.court_id, m.venue]);
    }
    for (const h of snap.holds) {
      await db.query("INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, match_id, note, guest_email) VALUES ($1, $2, $3::date, $4, $5, 'MATCH', $6, '', '') ON CONFLICT (id) DO NOTHING",
        [h.id, h.court_id, h.hold_date, h.start_time, h.end_time, h.match_id]);
    }
  };
  const splitWindows = WIN7.flatMap((w) => [{ ...w, endTime: "10:00" }, { ...w, startTime: "11:00" }]);
  const conflict = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: splitWindows });
  const splitSnap = await snapshotMatches((conflict.data?.matchConflicts ?? []).map((m) => m.matchId));
  const conflictRow = conflict.data?.conflicts?.[0];
  check(conflict.data?.saved === null && conflict.data?.conflicts?.length === 1 && conflictRow?.id === "prueba-hold-1" && typeof conflictRow.courtName === "string" && typeof conflictRow.hourlyRate === "number" && conflictRow.holdDate === holdDate && conflictRow.guestEmail === "juan@correo.com", "save_court_module: renta fuera del horario -> conflicts sin guardar", conflict);
  const windowsKept = (await rpc("admin", "admin_courts")).data?.courtOpenWindows;
  check(windowsKept?.length === 7 && windowsKept[0].endTime === "23:00", "save_court_module: sin force no toca las franjas", windowsKept?.length);
  const forced = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: splitWindows, force: true });
  check(forced.data?.saved?.id === "config" && forced.data.removed?.length === 1 && forced.data.removed[0].id === "prueba-hold-1", "save_court_module: force elimina la renta y la devuelve", forced);
  const afterForce = (await rpc("admin", "admin_courts")).data;
  check(!afterForce?.courtHolds?.some((h) => h.id === "prueba-hold-1") && afterForce?.courtHolds?.some((h) => h.id === matchHold?.id) && afterForce?.courtOpenWindows?.length === 14, "save_court_module: la renta ya no está y el apartado de partido sigue", afterForce?.courtHolds?.length);
  await restoreMatches(splitSnap);
  await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: WIN7 });
  const holdAgain = await rpc("admin", "save_court_hold", holdVars);
  check(holdAgain.data?.hold?.id === "prueba-hold-1", "save_court_hold: se vuelve a crear tras restaurar el horario", holdAgain);

  // Un partido programado cuyo apartado queda fuera del horario también frena el guardado; con force queda
  // por programar. Se busca uno futuro que no comparta hora con ninguna renta manual de su mismo día de la
  // semana, para que force no toque las rentas de la semilla.
  const allHolds = (await rpc("admin", "admin_courts")).data?.courtHolds ?? [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const isoDow = (d) => ((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
  const futureMatchHold = allHolds.find((h) =>
    h.source === "MATCH" && h.holdDate >= todayIso && h.match?.id &&
    !allHolds.some((o) => o.source === "MANUAL" && isoDow(o.holdDate) === isoDow(h.holdDate) && o.startTime < h.endTime && h.startTime < o.endTime));
  if (!futureMatchHold) {
    check(true, "save_court_module: sin apartado de partido futuro en la semilla, se omite la prueba de partidos");
  } else {
    const matchId = futureMatchHold.match.id;
    const dow = isoDow(futureMatchHold.holdDate);
    const cutWindows = WIN7.flatMap((w) => w.weekday !== dow
      ? [w]
      : [{ ...w, endTime: futureMatchHold.startTime }, ...(futureMatchHold.endTime < "23:00" ? [{ ...w, startTime: futureMatchHold.endTime }] : [])]);
    const matchConflict = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: cutWindows });
    const mc = matchConflict.data?.matchConflicts?.find((m) => m.matchId === matchId);
    check(matchConflict.data?.saved === null && matchConflict.data?.conflicts?.length === 0 && mc && mc.homeClub && mc.awayClub && mc.tournamentName && mc.holdDate === futureMatchHold.holdDate, "save_court_module: partido fuera del horario -> matchConflicts sin guardar", matchConflict);
    const matchStill = (await db.query("SELECT status::text AS status FROM matches WHERE id = $1", [matchId])).rows[0];
    check(matchStill?.status === "SCHEDULED", "save_court_module: sin force el partido sigue programado", matchStill);
    // El corte afecta a todos los partidos de ese día de la semana en esa hora: se guardan todos para restaurarlos
    const affectedIds = (matchConflict.data?.matchConflicts ?? []).map((m) => m.matchId);
    const cutSnap = await snapshotMatches(affectedIds);
    const matchForced = await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: cutWindows, force: true });
    check(matchForced.data?.saved?.id === "config" && matchForced.data.unscheduledMatches?.some((m) => m.matchId === matchId) && matchForced.data.removed?.length === 0, "save_court_module: force deja el partido por programar y lo devuelve", matchForced);
    const matchAfter = (await db.query("SELECT status::text AS status, match_date, start_time, court_id FROM matches WHERE id = $1", [matchId])).rows[0];
    const holdGone = !((await rpc("admin", "admin_courts")).data?.courtHolds ?? []).some((h) => h.id === futureMatchHold.id);
    check(matchAfter?.status === "UNSCHEDULED" && matchAfter.match_date === null && matchAfter.start_time === null && matchAfter.court_id === null && holdGone, "save_court_module: el partido queda sin fecha, cancha ni apartado", matchAfter);
    // Se deja la semilla como estaba para las pruebas de liga
    await restoreMatches(cutSnap);
    await rpc("admin", "save_court_module", { enabled: true, slotMinutes: 60, windows: WIN7 });
    const restored = (await db.query("SELECT count(*)::int AS n FROM matches WHERE id = ANY($1::text[]) AND status = 'SCHEDULED'", [affectedIds])).rows[0];
    check(restored?.n === affectedIds.length, "save_court_module: la semilla queda restaurada tras la prueba", restored);
  }
  const holdOverlap = await rpc("admin", "save_court_hold", { ...holdVars, id: "prueba-hold-2", startTime: "10:00", endTime: "12:00" });
  check(holdOverlap.data?.hold === null, "save_court_hold: cruzado con otro -> null", holdOverlap);
  const holdRow = (await rpc("admin", "admin_courts")).data?.courtHolds?.find((h) => h.id === "prueba-hold-1");
  check(holdRow?.note === "Juan Perez · cumple" && holdRow.guestEmail === "juan@correo.com" && holdRow.source === "MANUAL" && holdRow.holdDate === holdDate && holdRow.court.id === "prueba-court-1" && holdRow.match === null, "admin_courts: apartado manual", holdRow);
  const holdEdit = await rpc("admin", "save_court_hold", { ...holdVars, endTime: "12:00", fresh: false });
  check(holdEdit.data?.hold?.id === "prueba-hold-1", "save_court_hold: edición", holdEdit);
  const delHoldPres = await rpc("presidente", "delete_manual_court_hold", { id: "prueba-hold-1" });
  check(delHoldPres.data?.hold === null, "delete_manual_court_hold: presidente -> null", delHoldPres);
  const delHoldMatch = await rpc("admin", "delete_manual_court_hold", { id: matchHold?.id ?? "x" });
  check(delHoldMatch.data?.hold === null, "delete_manual_court_hold: apartado de partido -> null", delHoldMatch);
  const delHold = await rpc("admin", "delete_manual_court_hold", { id: "prueba-hold-1" });
  check(delHold.data?.hold?.id === "prueba-hold-1", "delete_manual_court_hold: válido", delHold);

  await rpc("admin", "save_court_hold", holdVars);
  const delCourtPres = await rpc("presidente", "delete_court", { id: "prueba-court-1" });
  check(delCourtPres.data?.court === null, "delete_court: presidente -> null", delCourtPres);
  const delCourt = await rpc("admin", "delete_court", { id: "prueba-court-1" });
  check(delCourt.data?.court?.id === "prueba-court-1", "delete_court: válido", delCourt);
  const courtsAfter = (await rpc("admin", "admin_courts")).data;
  check(courtsAfter?.courts?.length === 4 && !courtsAfter.courtHolds.some((h) => h.id === "prueba-hold-1"), "admin_courts: cancha y apartados borrados", courtsAfter?.courts?.length);

  // ---------- Publicidad ----------
  const adVars = { id: "prueba-ad-1", brand: "Marca Prueba", imageUrl: "https://a/ad.png", href: "", startsOn: plusDays(0), endsOn: plusDays(30), status: "EN_CURSO", sortOrder: 50 };
  const adPres = await rpc("presidente", "save_ad", adVars);
  check(adPres.data?.ad === null, "save_ad: presidente -> null", adPres);
  const adBadDates = await rpc("admin", "save_ad", { ...adVars, endsOn: plusDays(-1) });
  check(adBadDates.data?.ad === null, "save_ad: termina antes de empezar -> null", adBadDates);
  const adPast = await rpc("admin", "save_ad", { ...adVars, startsOn: "2020-01-01", endsOn: "2020-02-01" });
  check(adPast.data?.ad === null, "save_ad: nuevo en el pasado -> null", adPast);
  const adBadStatus = await rpc("admin", "save_ad", { ...adVars, status: "OTRO" });
  check(adBadStatus.data?.ad === null, "save_ad: estado inválido -> null", adBadStatus);
  const ad = await rpc("admin", "save_ad", adVars);
  check(ad.data?.ad?.id === "prueba-ad-1", "save_ad: válido", ad);
  const placementPres = await rpc("presidente", "save_ad_placement", { adId: "prueba-ad-1", placement: "HOME" });
  check(placementPres.data?.placement === null, "save_ad_placement: presidente -> null", placementPres);
  const placementBad = await rpc("admin", "save_ad_placement", { adId: "prueba-ad-1", placement: "SIDEBAR" });
  check(placementBad.data?.placement === null, "save_ad_placement: ubicación inválida -> null", placementBad);
  const placement = await rpc("admin", "save_ad_placement", { adId: "prueba-ad-1", placement: "HOME" });
  check(placement.data?.placement?.id === "prueba-ad-1", "save_ad_placement: válida", placement);
  await rpc("admin", "save_ad_placement", { adId: "prueba-ad-1", placement: "TEAMS" });
  const statusPres = await rpc("presidente", "set_ad_status", { id: "prueba-ad-1", status: "PAUSADO" });
  check(statusPres.data?.ad === null, "set_ad_status: presidente -> null", statusPres);
  const statusBad = await rpc("admin", "set_ad_status", { id: "prueba-ad-1", status: "OTRO" });
  check(statusBad.data?.ad === null, "set_ad_status: estado inválido -> null", statusBad);
  const status = await rpc("admin", "set_ad_status", { id: "prueba-ad-1", status: "PAUSADO" });
  check(status.data?.ad?.id === "prueba-ad-1", "set_ad_status: válido", status);
  const orderPres = await rpc("presidente", "set_ad_order", { ids: "prueba-ad-1,dummy-ad-golazo" });
  check(orderPres.data?.ad === null, "set_ad_order: presidente -> null", orderPres);
  const order = await rpc("admin", "set_ad_order", { ids: "prueba-ad-1,dummy-ad-golazo,dummy-ad-faro,dummy-ad-bahia" });
  check(order.data?.ad?.id, "set_ad_order: válido", order);
  const adsRows = (await rpc("admin", "admin_ads")).data?.ads ?? [];
  const adRow = adsRows.find((a) => a.id === "prueba-ad-1");
  check(adsRows[0]?.id === "prueba-ad-1" && adRow?.sortOrder === 0 && adRow.status === "PAUSADO" && adRow.adPlacements_on_ad.length === 2 && adsRows[1]?.sortOrder === 1, "admin_ads: orden, estado y ubicaciones", adsRows.map((a) => [a.id, a.sortOrder]));
  const clearAdPres = await rpc("presidente", "clear_ad_placements", { adId: "prueba-ad-1" });
  check(clearAdPres.data?.cleared === null, "clear_ad_placements: presidente -> null", clearAdPres);
  const clearAd = await rpc("admin", "clear_ad_placements", { adId: "prueba-ad-1" });
  check(clearAd.data?.cleared === 2, "clear_ad_placements: borra las dos", clearAd);
  const delAdPres = await rpc("presidente", "delete_ad", { id: "prueba-ad-1" });
  check(delAdPres.data?.ad === null, "delete_ad: presidente -> null", delAdPres);
  const delAd = await rpc("admin", "delete_ad", { id: "prueba-ad-1" });
  check(delAd.data?.ad?.id === "prueba-ad-1", "delete_ad: válido", delAd);
  const adsAfter = (await rpc("admin", "admin_ads")).data?.ads ?? [];
  check(adsAfter.length === 3 && adsAfter[0].id === "dummy-ad-golazo", "admin_ads: vuelve a 3 en el mismo orden", adsAfter.map((a) => a.id));

  // ---------- Bandeja ----------
  const donePres = await rpc("presidente", "set_inquiry_done", { id: "dummy-consulta-1" });
  check(donePres.data?.inquiry === null, "set_inquiry_done: presidente -> null", donePres);
  const done = await rpc("admin", "set_inquiry_done", { id: "dummy-consulta-1" });
  check(done.data?.inquiry?.id === "dummy-consulta-1", "set_inquiry_done: válido", done);
  const delInqPres = await rpc("presidente", "delete_inquiry", { id: "dummy-consulta-2" });
  check(delInqPres.data?.inquiry === null, "delete_inquiry: presidente -> null", delInqPres);
  const delInq = await rpc("admin", "delete_inquiry", { id: "dummy-consulta-2" });
  check(delInq.data?.inquiry?.id === "dummy-consulta-2", "delete_inquiry: válido", delInq);
  const delInqMissing = await rpc("admin", "delete_inquiry", { id: "no-existe" });
  check(delInqMissing.data?.inquiry === null, "delete_inquiry: inexistente -> null", delInqMissing);
  const inqRows = (await rpc("admin", "admin_inbox")).data?.inquiries ?? [];
  check(inqRows.find((i) => i.id === "dummy-consulta-1")?.status === "DONE" && !inqRows.some((i) => i.id === "dummy-consulta-2"), "admin_inbox: consultas actualizadas", inqRows.map((i) => [i.id, i.status]));

  // ---------- Superadministradores ----------
  const adminInvitePres = await rpc("presidente", "save_platform_admin_invite", NADIE);
  check(adminInvitePres.data?.invite === null, "save_platform_admin_invite: presidente -> null", adminInvitePres);
  const adminInviteSelf = await rpc("admin", "save_platform_admin_invite", { emailKey: "admin@demo,local", email: "admin@demo.local" });
  check(adminInviteSelf.data?.invite === null, "save_platform_admin_invite: ya es superadmin -> null", adminInviteSelf);
  const adminInviteBadKey = await rpc("admin", "save_platform_admin_invite", { emailKey: "otra@demo,local", email: NADIE.email });
  check(adminInviteBadKey.data?.invite === null, "save_platform_admin_invite: emailKey distinto -> null", adminInviteBadKey);
  const adminInvite = await rpc("admin", "save_platform_admin_invite", NADIE);
  check(adminInvite.data?.invite?.id === NADIE.emailKey, "save_platform_admin_invite: válida", adminInvite);
  const adminInviteDup = await rpc("admin", "save_platform_admin_invite", NADIE);
  check(adminInviteDup.data?.invite === null, "save_platform_admin_invite: repetida -> null", adminInviteDup);
  const longEmail = `${"a".repeat(90)}@demo.local`;
  const adminInviteLong = await rpc("admin", "save_platform_admin_invite", { emailKey: longEmail.replace(/\./g, ","), email: longEmail });
  check(adminInviteLong.data?.invite === null, "save_platform_admin_invite: más de 100 caracteres -> null", adminInviteLong);
  const signupPlatform = await rpc("admin", "save_signup_invite", { ...NADIE, clubId: null, platform: true });
  check(signupPlatform.data?.invite?.id === NADIE.emailKey, "save_signup_invite: acceso de plataforma", signupPlatform);
  const removeInvitePres = await rpc("presidente", "remove_platform_admin_invite", { emailKey: NADIE.emailKey });
  check(removeInvitePres.data?.invite === null, "remove_platform_admin_invite: presidente -> null", removeInvitePres);
  const claim = await rpc("usuario", "claim_platform_admin_invite", { emailKey: NADIE.emailKey });
  check(claim.data?.admin?.id === USUARIO_UID, "claim_platform_admin_invite: el invitado es superadmin", claim);
  const admins2 = (await rpc("admin", "admin_admins")).data;
  check(admins2?.platformAdmins?.length === 2 && admins2.platformAdminInvites.length === 0, "admin_admins: 2 superadmins y sin invitaciones", admins2);
  const leftovers = await db.query("SELECT count(*)::int AS n FROM signup_invites WHERE email_key = $1", [NADIE.emailKey]);
  check(leftovers.rows[0].n === 0, "claim_platform_admin_invite: borra la invitación de registro");
  const removeSelf = await rpc("admin", "remove_platform_admin", { userId: ADMIN_UID });
  check(removeSelf.data?.admin === null, "remove_platform_admin: nadie se quita a sí mismo -> null", removeSelf);
  const removePres = await rpc("presidente", "remove_platform_admin", { userId: USUARIO_UID });
  check(removePres.data?.admin === null, "remove_platform_admin: presidente -> null", removePres);
  const remove = await rpc("admin", "remove_platform_admin", { userId: USUARIO_UID });
  check(remove.data?.admin?.id === USUARIO_UID, "remove_platform_admin: válido", remove);
  const removeLast = await rpc("admin", "remove_platform_admin", { userId: ADMIN_UID });
  check(removeLast.data?.admin === null, "remove_platform_admin: no se queda sin superadmin", removeLast);
  const admins1 = (await rpc("admin", "admin_admins")).data;
  check(admins1?.platformAdmins?.length === 1 && admins1.platformAdmins[0].email === "admin@demo.local", "admin_admins: vuelve a 1", admins1);
  const readsUser = await rpc("usuario", "admin_clubs");
  check(denied(readsUser), "admin_clubs: el superadmin quitado ya no puede", readsUser);

  await rpc("admin", "save_platform_admin_invite", { emailKey: "otro@demo,local", email: "otro@demo.local" });
  await rpc("admin", "save_signup_invite", { emailKey: "otro@demo,local", email: "otro@demo.local", clubId: null, platform: true });
  const removeInvite = await rpc("admin", "remove_platform_admin_invite", { emailKey: "otro@demo,local" });
  check(removeInvite.data?.invite?.id === "otro@demo,local", "remove_platform_admin_invite: válida", removeInvite);
  const leftovers2 = await db.query("SELECT count(*)::int AS n FROM signup_invites WHERE email_key = 'otro@demo,local'");
  check(leftovers2.rows[0].n === 0, "remove_platform_admin_invite: borra también la de registro");
  const removeInviteMissing = await rpc("admin", "remove_platform_admin_invite", { emailKey: "otro@demo,local" });
  check(removeInviteMissing.data?.invite === null, "remove_platform_admin_invite: ya no existe -> null", removeInviteMissing);

  // Mutaciones con variables vacías: nunca fallan, solo devuelven null
  const empty = await rpc("admin", "create_club", {});
  check(!empty.error && empty.data?.club === null, "create_club: sin variables -> null", empty);
}
