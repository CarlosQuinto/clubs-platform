const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const AdPlacementKind = {
  HOME: "HOME",
  TOURNAMENT: "TOURNAMENT",
  CLUB: "CLUB",
  TEAMS: "TEAMS",
}
exports.AdPlacementKind = AdPlacementKind;

const AdStatus = {
  PROGRAMADO: "PROGRAMADO",
  EN_CURSO: "EN_CURSO",
  PAUSADO: "PAUSADO",
  EXPIRADO: "EXPIRADO",
}
exports.AdStatus = AdStatus;

const CourtHoldSource = {
  MATCH: "MATCH",
  MANUAL: "MANUAL",
}
exports.CourtHoldSource = CourtHoldSource;

const FootballType = {
  FUT_7: "FUT_7",
  FUT_9: "FUT_9",
  FUT_11: "FUT_11",
}
exports.FootballType = FootballType;

const InquiryStatus = {
  NEW: "NEW",
  DONE: "DONE",
}
exports.InquiryStatus = InquiryStatus;

const InviteKind = {
  SIGNUP: "SIGNUP",
  ACCEPT: "ACCEPT",
}
exports.InviteKind = InviteKind;

const MatchStatus = {
  UNSCHEDULED: "UNSCHEDULED",
  SCHEDULED: "SCHEDULED",
  PLAYED: "PLAYED",
}
exports.MatchStatus = MatchStatus;

const MemberRole = {
  ADMIN: "ADMIN",
  DT: "DT",
  PRENSA: "PRENSA",
  TESORERO: "TESORERO",
}
exports.MemberRole = MemberRole;

const TeamApplicationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
}
exports.TeamApplicationStatus = TeamApplicationStatus;

const TournamentStatus = {
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
}
exports.TournamentStatus = TournamentStatus;

const connectorConfig = {
  connector: 'app',
  service: 'clubs-platform-aem9u-service',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const amIPlatformAdminRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AmIPlatformAdmin');
}
amIPlatformAdminRef.operationName = 'AmIPlatformAdmin';
exports.amIPlatformAdminRef = amIPlatformAdminRef;

exports.amIPlatformAdmin = function amIPlatformAdmin(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(amIPlatformAdminRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const platformAdminByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlatformAdminById', inputVars);
}
platformAdminByIdRef.operationName = 'PlatformAdminById';
exports.platformAdminByIdRef = platformAdminByIdRef;

exports.platformAdminById = function platformAdminById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(platformAdminByIdRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const clubAdminGateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ClubAdminGate', inputVars);
}
clubAdminGateRef.operationName = 'ClubAdminGate';
exports.clubAdminGateRef = clubAdminGateRef;

exports.clubAdminGate = function clubAdminGate(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(clubAdminGateRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const signupInviteByEmailRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SignupInviteByEmail', inputVars);
}
signupInviteByEmailRef.operationName = 'SignupInviteByEmail';
exports.signupInviteByEmailRef = signupInviteByEmailRef;

exports.signupInviteByEmail = function signupInviteByEmail(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(signupInviteByEmailRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const clubInviteLookupRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ClubInviteLookup', inputVars);
}
clubInviteLookupRef.operationName = 'ClubInviteLookup';
exports.clubInviteLookupRef = clubInviteLookupRef;

exports.clubInviteLookup = function clubInviteLookup(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(clubInviteLookupRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminClubsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminClubs');
}
adminClubsRef.operationName = 'AdminClubs';
exports.adminClubsRef = adminClubsRef;

exports.adminClubs = function adminClubs(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminClubsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchAdminClubsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchAdminClubs', inputVars);
}
searchAdminClubsRef.operationName = 'SearchAdminClubs';
exports.searchAdminClubsRef = searchAdminClubsRef;

exports.searchAdminClubs = function searchAdminClubs(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchAdminClubsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminClubPeopleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminClubPeople', inputVars);
}
adminClubPeopleRef.operationName = 'AdminClubPeople';
exports.adminClubPeopleRef = adminClubPeopleRef;

exports.adminClubPeople = function adminClubPeople(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(adminClubPeopleRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminCompetitionRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminCompetition');
}
adminCompetitionRef.operationName = 'AdminCompetition';
exports.adminCompetitionRef = adminCompetitionRef;

exports.adminCompetition = function adminCompetition(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminCompetitionRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminCoverRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminCover');
}
adminCoverRef.operationName = 'AdminCover';
exports.adminCoverRef = adminCoverRef;

exports.adminCover = function adminCover(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminCoverRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminAdsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminAds');
}
adminAdsRef.operationName = 'AdminAds';
exports.adminAdsRef = adminAdsRef;

exports.adminAds = function adminAds(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminAdsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminInboxRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminInbox');
}
adminInboxRef.operationName = 'AdminInbox';
exports.adminInboxRef = adminInboxRef;

exports.adminInbox = function adminInbox(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminInboxRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminAdminsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminAdmins');
}
adminAdminsRef.operationName = 'AdminAdmins';
exports.adminAdminsRef = adminAdminsRef;

exports.adminAdmins = function adminAdmins(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminAdminsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const myPlatformAdminInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MyPlatformAdminInvite', inputVars);
}
myPlatformAdminInviteRef.operationName = 'MyPlatformAdminInvite';
exports.myPlatformAdminInviteRef = myPlatformAdminInviteRef;

exports.myPlatformAdminInvite = function myPlatformAdminInvite(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(myPlatformAdminInviteRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminCourtsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminCourts');
}
adminCourtsRef.operationName = 'AdminCourts';
exports.adminCourtsRef = adminCourtsRef;

exports.adminCourts = function adminCourts(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminCourtsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const bootstrapPlatformAdminRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BootstrapPlatformAdmin', inputVars);
}
bootstrapPlatformAdminRef.operationName = 'BootstrapPlatformAdmin';
exports.bootstrapPlatformAdminRef = bootstrapPlatformAdminRef;

exports.bootstrapPlatformAdmin = function bootstrapPlatformAdmin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(bootstrapPlatformAdminRef(dcInstance, inputVars));
}
;

const claimPlatformAdminInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClaimPlatformAdminInvite', inputVars);
}
claimPlatformAdminInviteRef.operationName = 'ClaimPlatformAdminInvite';
exports.claimPlatformAdminInviteRef = claimPlatformAdminInviteRef;

exports.claimPlatformAdminInvite = function claimPlatformAdminInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(claimPlatformAdminInviteRef(dcInstance, inputVars));
}
;

const deleteLocalityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteLocality', inputVars);
}
deleteLocalityRef.operationName = 'DeleteLocality';
exports.deleteLocalityRef = deleteLocalityRef;

exports.deleteLocality = function deleteLocality(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteLocalityRef(dcInstance, inputVars));
}
;

const createLocalityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLocality', inputVars);
}
createLocalityRef.operationName = 'CreateLocality';
exports.createLocalityRef = createLocalityRef;

exports.createLocality = function createLocality(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createLocalityRef(dcInstance, inputVars));
}
;

const createClubRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateClub', inputVars);
}
createClubRef.operationName = 'CreateClub';
exports.createClubRef = createClubRef;

exports.createClub = function createClub(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createClubRef(dcInstance, inputVars));
}
;

const insertClubHeroRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertClubHero', inputVars);
}
insertClubHeroRef.operationName = 'InsertClubHero';
exports.insertClubHeroRef = insertClubHeroRef;

exports.insertClubHero = function insertClubHero(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertClubHeroRef(dcInstance, inputVars));
}
;

const setClubActiveRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetClubActive', inputVars);
}
setClubActiveRef.operationName = 'SetClubActive';
exports.setClubActiveRef = setClubActiveRef;

exports.setClubActive = function setClubActive(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setClubActiveRef(dcInstance, inputVars));
}
;

const deleteClubRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteClub', inputVars);
}
deleteClubRef.operationName = 'DeleteClub';
exports.deleteClubRef = deleteClubRef;

exports.deleteClub = function deleteClub(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteClubRef(dcInstance, inputVars));
}
;

const saveClubInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveClubInvite', inputVars);
}
saveClubInviteRef.operationName = 'SaveClubInvite';
exports.saveClubInviteRef = saveClubInviteRef;

exports.saveClubInvite = function saveClubInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveClubInviteRef(dcInstance, inputVars));
}
;

const removeClubInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemoveClubInvite', inputVars);
}
removeClubInviteRef.operationName = 'RemoveClubInvite';
exports.removeClubInviteRef = removeClubInviteRef;

exports.removeClubInvite = function removeClubInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removeClubInviteRef(dcInstance, inputVars));
}
;

const saveSignupInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveSignupInvite', inputVars);
}
saveSignupInviteRef.operationName = 'SaveSignupInvite';
exports.saveSignupInviteRef = saveSignupInviteRef;

exports.saveSignupInvite = function saveSignupInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveSignupInviteRef(dcInstance, inputVars));
}
;

const clearSignupInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearSignupInvite', inputVars);
}
clearSignupInviteRef.operationName = 'ClearSignupInvite';
exports.clearSignupInviteRef = clearSignupInviteRef;

exports.clearSignupInvite = function clearSignupInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(clearSignupInviteRef(dcInstance, inputVars));
}
;

const setClubMemberRoleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetClubMemberRole', inputVars);
}
setClubMemberRoleRef.operationName = 'SetClubMemberRole';
exports.setClubMemberRoleRef = setClubMemberRoleRef;

exports.setClubMemberRole = function setClubMemberRole(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setClubMemberRoleRef(dcInstance, inputVars));
}
;

const removeClubMemberRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemoveClubMember', inputVars);
}
removeClubMemberRef.operationName = 'RemoveClubMember';
exports.removeClubMemberRef = removeClubMemberRef;

exports.removeClubMember = function removeClubMember(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removeClubMemberRef(dcInstance, inputVars));
}
;

const acceptClubInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AcceptClubInvite', inputVars);
}
acceptClubInviteRef.operationName = 'AcceptClubInvite';
exports.acceptClubInviteRef = acceptClubInviteRef;

exports.acceptClubInvite = function acceptClubInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(acceptClubInviteRef(dcInstance, inputVars));
}
;

const declineClubInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeclineClubInvite', inputVars);
}
declineClubInviteRef.operationName = 'DeclineClubInvite';
exports.declineClubInviteRef = declineClubInviteRef;

exports.declineClubInvite = function declineClubInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(declineClubInviteRef(dcInstance, inputVars));
}
;

const createSeasonRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSeason', inputVars);
}
createSeasonRef.operationName = 'CreateSeason';
exports.createSeasonRef = createSeasonRef;

exports.createSeason = function createSeason(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSeasonRef(dcInstance, inputVars));
}
;

const setSeasonActiveRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSeasonActive', inputVars);
}
setSeasonActiveRef.operationName = 'SetSeasonActive';
exports.setSeasonActiveRef = setSeasonActiveRef;

exports.setSeasonActive = function setSeasonActive(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSeasonActiveRef(dcInstance, inputVars));
}
;

const deleteSeasonRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteSeason', inputVars);
}
deleteSeasonRef.operationName = 'DeleteSeason';
exports.deleteSeasonRef = deleteSeasonRef;

exports.deleteSeason = function deleteSeason(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteSeasonRef(dcInstance, inputVars));
}
;

const createCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategory', inputVars);
}
createCategoryRef.operationName = 'CreateCategory';
exports.createCategoryRef = createCategoryRef;

exports.createCategory = function createCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCategoryRef(dcInstance, inputVars));
}
;

const createTournamentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTournament', inputVars);
}
createTournamentRef.operationName = 'CreateTournament';
exports.createTournamentRef = createTournamentRef;

exports.createTournament = function createTournament(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createTournamentRef(dcInstance, inputVars));
}
;

const savePlatformHeaderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePlatformHeader', inputVars);
}
savePlatformHeaderRef.operationName = 'SavePlatformHeader';
exports.savePlatformHeaderRef = savePlatformHeaderRef;

exports.savePlatformHeader = function savePlatformHeader(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePlatformHeaderRef(dcInstance, inputVars));
}
;

const savePlatformCoverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePlatformCover', inputVars);
}
savePlatformCoverRef.operationName = 'SavePlatformCover';
exports.savePlatformCoverRef = savePlatformCoverRef;

exports.savePlatformCover = function savePlatformCover(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePlatformCoverRef(dcInstance, inputVars));
}
;

const savePlatformSocialRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePlatformSocial', inputVars);
}
savePlatformSocialRef.operationName = 'SavePlatformSocial';
exports.savePlatformSocialRef = savePlatformSocialRef;

exports.savePlatformSocial = function savePlatformSocial(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePlatformSocialRef(dcInstance, inputVars));
}
;

const replaceHeroImagesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReplaceHeroImages', inputVars);
}
replaceHeroImagesRef.operationName = 'ReplaceHeroImages';
exports.replaceHeroImagesRef = replaceHeroImagesRef;

exports.replaceHeroImages = function replaceHeroImages(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(replaceHeroImagesRef(dcInstance, inputVars));
}
;

const saveCourtSettingsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCourtSettings', inputVars);
}
saveCourtSettingsRef.operationName = 'SaveCourtSettings';
exports.saveCourtSettingsRef = saveCourtSettingsRef;

exports.saveCourtSettings = function saveCourtSettings(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCourtSettingsRef(dcInstance, inputVars));
}
;

const clearCourtWindowsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearCourtWindows', inputVars);
}
clearCourtWindowsRef.operationName = 'ClearCourtWindows';
exports.clearCourtWindowsRef = clearCourtWindowsRef;

exports.clearCourtWindows = function clearCourtWindows(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(clearCourtWindowsRef(dcInstance, inputVars));
}
;

const saveCourtWindowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCourtWindow', inputVars);
}
saveCourtWindowRef.operationName = 'SaveCourtWindow';
exports.saveCourtWindowRef = saveCourtWindowRef;

exports.saveCourtWindow = function saveCourtWindow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCourtWindowRef(dcInstance, inputVars));
}
;

const saveCourtRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCourt', inputVars);
}
saveCourtRef.operationName = 'SaveCourt';
exports.saveCourtRef = saveCourtRef;

exports.saveCourt = function saveCourt(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCourtRef(dcInstance, inputVars));
}
;

const deleteCourtRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteCourt', inputVars);
}
deleteCourtRef.operationName = 'DeleteCourt';
exports.deleteCourtRef = deleteCourtRef;

exports.deleteCourt = function deleteCourt(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteCourtRef(dcInstance, inputVars));
}
;

const saveCourtHoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCourtHold', inputVars);
}
saveCourtHoldRef.operationName = 'SaveCourtHold';
exports.saveCourtHoldRef = saveCourtHoldRef;

exports.saveCourtHold = function saveCourtHold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCourtHoldRef(dcInstance, inputVars));
}
;

const deleteManualCourtHoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteManualCourtHold', inputVars);
}
deleteManualCourtHoldRef.operationName = 'DeleteManualCourtHold';
exports.deleteManualCourtHoldRef = deleteManualCourtHoldRef;

exports.deleteManualCourtHold = function deleteManualCourtHold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteManualCourtHoldRef(dcInstance, inputVars));
}
;

const saveAdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveAd', inputVars);
}
saveAdRef.operationName = 'SaveAd';
exports.saveAdRef = saveAdRef;

exports.saveAd = function saveAd(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveAdRef(dcInstance, inputVars));
}
;

const setAdStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetAdStatus', inputVars);
}
setAdStatusRef.operationName = 'SetAdStatus';
exports.setAdStatusRef = setAdStatusRef;

exports.setAdStatus = function setAdStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setAdStatusRef(dcInstance, inputVars));
}
;

const setAdOrderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetAdOrder', inputVars);
}
setAdOrderRef.operationName = 'SetAdOrder';
exports.setAdOrderRef = setAdOrderRef;

exports.setAdOrder = function setAdOrder(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setAdOrderRef(dcInstance, inputVars));
}
;

const clearAdPlacementsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearAdPlacements', inputVars);
}
clearAdPlacementsRef.operationName = 'ClearAdPlacements';
exports.clearAdPlacementsRef = clearAdPlacementsRef;

exports.clearAdPlacements = function clearAdPlacements(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(clearAdPlacementsRef(dcInstance, inputVars));
}
;

const saveAdPlacementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveAdPlacement', inputVars);
}
saveAdPlacementRef.operationName = 'SaveAdPlacement';
exports.saveAdPlacementRef = saveAdPlacementRef;

exports.saveAdPlacement = function saveAdPlacement(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveAdPlacementRef(dcInstance, inputVars));
}
;

const deleteAdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteAd', inputVars);
}
deleteAdRef.operationName = 'DeleteAd';
exports.deleteAdRef = deleteAdRef;

exports.deleteAd = function deleteAd(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteAdRef(dcInstance, inputVars));
}
;

const setInquiryDoneRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetInquiryDone', inputVars);
}
setInquiryDoneRef.operationName = 'SetInquiryDone';
exports.setInquiryDoneRef = setInquiryDoneRef;

exports.setInquiryDone = function setInquiryDone(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setInquiryDoneRef(dcInstance, inputVars));
}
;

const deleteInquiryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteInquiry', inputVars);
}
deleteInquiryRef.operationName = 'DeleteInquiry';
exports.deleteInquiryRef = deleteInquiryRef;

exports.deleteInquiry = function deleteInquiry(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteInquiryRef(dcInstance, inputVars));
}
;

const rejectTeamApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RejectTeamApplication', inputVars);
}
rejectTeamApplicationRef.operationName = 'RejectTeamApplication';
exports.rejectTeamApplicationRef = rejectTeamApplicationRef;

exports.rejectTeamApplication = function rejectTeamApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(rejectTeamApplicationRef(dcInstance, inputVars));
}
;

const approveTeamApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ApproveTeamApplication', inputVars);
}
approveTeamApplicationRef.operationName = 'ApproveTeamApplication';
exports.approveTeamApplicationRef = approveTeamApplicationRef;

exports.approveTeamApplication = function approveTeamApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(approveTeamApplicationRef(dcInstance, inputVars));
}
;

const savePlatformAdminInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePlatformAdminInvite', inputVars);
}
savePlatformAdminInviteRef.operationName = 'SavePlatformAdminInvite';
exports.savePlatformAdminInviteRef = savePlatformAdminInviteRef;

exports.savePlatformAdminInvite = function savePlatformAdminInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePlatformAdminInviteRef(dcInstance, inputVars));
}
;

const removePlatformAdminInviteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemovePlatformAdminInvite', inputVars);
}
removePlatformAdminInviteRef.operationName = 'RemovePlatformAdminInvite';
exports.removePlatformAdminInviteRef = removePlatformAdminInviteRef;

exports.removePlatformAdminInvite = function removePlatformAdminInvite(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removePlatformAdminInviteRef(dcInstance, inputVars));
}
;

const removePlatformAdminRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemovePlatformAdmin', inputVars);
}
removePlatformAdminRef.operationName = 'RemovePlatformAdmin';
exports.removePlatformAdminRef = removePlatformAdminRef;

exports.removePlatformAdmin = function removePlatformAdmin(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removePlatformAdminRef(dcInstance, inputVars));
}
;

const setClubEventScoreRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetClubEventScore', inputVars);
}
setClubEventScoreRef.operationName = 'SetClubEventScore';
exports.setClubEventScoreRef = setClubEventScoreRef;

exports.setClubEventScore = function setClubEventScore(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setClubEventScoreRef(dcInstance, inputVars));
}
;

const setClubEventLineupRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetClubEventLineup', inputVars);
}
setClubEventLineupRef.operationName = 'SetClubEventLineup';
exports.setClubEventLineupRef = setClubEventLineupRef;

exports.setClubEventLineup = function setClubEventLineup(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setClubEventLineupRef(dcInstance, inputVars));
}
;

const saveClubDefaultLineupRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveClubDefaultLineup', inputVars);
}
saveClubDefaultLineupRef.operationName = 'SaveClubDefaultLineup';
exports.saveClubDefaultLineupRef = saveClubDefaultLineupRef;

exports.saveClubDefaultLineup = function saveClubDefaultLineup(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveClubDefaultLineupRef(dcInstance, inputVars));
}
;

const replaceClubEventAttendeesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReplaceClubEventAttendees', inputVars);
}
replaceClubEventAttendeesRef.operationName = 'ReplaceClubEventAttendees';
exports.replaceClubEventAttendeesRef = replaceClubEventAttendeesRef;

exports.replaceClubEventAttendees = function replaceClubEventAttendees(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(replaceClubEventAttendeesRef(dcInstance, inputVars));
}
;

const replaceClubEventAlbumRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReplaceClubEventAlbum', inputVars);
}
replaceClubEventAlbumRef.operationName = 'ReplaceClubEventAlbum';
exports.replaceClubEventAlbumRef = replaceClubEventAlbumRef;

exports.replaceClubEventAlbum = function replaceClubEventAlbum(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(replaceClubEventAlbumRef(dcInstance, inputVars));
}
;

const replaceClubEventStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReplaceClubEventStats', inputVars);
}
replaceClubEventStatsRef.operationName = 'ReplaceClubEventStats';
exports.replaceClubEventStatsRef = replaceClubEventStatsRef;

exports.replaceClubEventStats = function replaceClubEventStats(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(replaceClubEventStatsRef(dcInstance, inputVars));
}
;

const setMatchClubLineupRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetMatchClubLineup', inputVars);
}
setMatchClubLineupRef.operationName = 'SetMatchClubLineup';
exports.setMatchClubLineupRef = setMatchClubLineupRef;

exports.setMatchClubLineup = function setMatchClubLineup(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setMatchClubLineupRef(dcInstance, inputVars));
}
;

const replaceMatchAttendeesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReplaceMatchAttendees', inputVars);
}
replaceMatchAttendeesRef.operationName = 'ReplaceMatchAttendees';
exports.replaceMatchAttendeesRef = replaceMatchAttendeesRef;

exports.replaceMatchAttendees = function replaceMatchAttendees(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(replaceMatchAttendeesRef(dcInstance, inputVars));
}
;

const saveFinancialGoalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveFinancialGoal', inputVars);
}
saveFinancialGoalRef.operationName = 'SaveFinancialGoal';
exports.saveFinancialGoalRef = saveFinancialGoalRef;

exports.saveFinancialGoal = function saveFinancialGoal(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveFinancialGoalRef(dcInstance, inputVars));
}
;

const setFinancialGoalStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetFinancialGoalStatus', inputVars);
}
setFinancialGoalStatusRef.operationName = 'SetFinancialGoalStatus';
exports.setFinancialGoalStatusRef = setFinancialGoalStatusRef;

exports.setFinancialGoalStatus = function setFinancialGoalStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setFinancialGoalStatusRef(dcInstance, inputVars));
}
;

const deleteFinancialGoalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteFinancialGoal', inputVars);
}
deleteFinancialGoalRef.operationName = 'DeleteFinancialGoal';
exports.deleteFinancialGoalRef = deleteFinancialGoalRef;

exports.deleteFinancialGoal = function deleteFinancialGoal(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteFinancialGoalRef(dcInstance, inputVars));
}
;

const deleteTransactionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteTransaction', inputVars);
}
deleteTransactionRef.operationName = 'DeleteTransaction';
exports.deleteTransactionRef = deleteTransactionRef;

exports.deleteTransaction = function deleteTransaction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteTransactionRef(dcInstance, inputVars));
}
;

const deleteInventoryItemRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteInventoryItem', inputVars);
}
deleteInventoryItemRef.operationName = 'DeleteInventoryItem';
exports.deleteInventoryItemRef = deleteInventoryItemRef;

exports.deleteInventoryItem = function deleteInventoryItem(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteInventoryItemRef(dcInstance, inputVars));
}
;

const saveGalleryPhotoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveGalleryPhoto', inputVars);
}
saveGalleryPhotoRef.operationName = 'SaveGalleryPhoto';
exports.saveGalleryPhotoRef = saveGalleryPhotoRef;

exports.saveGalleryPhoto = function saveGalleryPhoto(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveGalleryPhotoRef(dcInstance, inputVars));
}
;

const swapGalleryPhotosRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SwapGalleryPhotos', inputVars);
}
swapGalleryPhotosRef.operationName = 'SwapGalleryPhotos';
exports.swapGalleryPhotosRef = swapGalleryPhotosRef;

exports.swapGalleryPhotos = function swapGalleryPhotos(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(swapGalleryPhotosRef(dcInstance, inputVars));
}
;

const promoteGalleryPhotoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PromoteGalleryPhoto', inputVars);
}
promoteGalleryPhotoRef.operationName = 'PromoteGalleryPhoto';
exports.promoteGalleryPhotoRef = promoteGalleryPhotoRef;

exports.promoteGalleryPhoto = function promoteGalleryPhoto(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(promoteGalleryPhotoRef(dcInstance, inputVars));
}
;

const deleteGalleryPhotoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteGalleryPhoto', inputVars);
}
deleteGalleryPhotoRef.operationName = 'DeleteGalleryPhoto';
exports.deleteGalleryPhotoRef = deleteGalleryPhotoRef;

exports.deleteGalleryPhoto = function deleteGalleryPhoto(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteGalleryPhotoRef(dcInstance, inputVars));
}
;

const clearClubAvailabilityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearClubAvailability', inputVars);
}
clearClubAvailabilityRef.operationName = 'ClearClubAvailability';
exports.clearClubAvailabilityRef = clearClubAvailabilityRef;

exports.clearClubAvailability = function clearClubAvailability(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(clearClubAvailabilityRef(dcInstance, inputVars));
}
;

const insertClubAvailabilityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertClubAvailability', inputVars);
}
insertClubAvailabilityRef.operationName = 'InsertClubAvailability';
exports.insertClubAvailabilityRef = insertClubAvailabilityRef;

exports.insertClubAvailability = function insertClubAvailability(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertClubAvailabilityRef(dcInstance, inputVars));
}
;

const saveClubPortadaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveClubPortada', inputVars);
}
saveClubPortadaRef.operationName = 'SaveClubPortada';
exports.saveClubPortadaRef = saveClubPortadaRef;

exports.saveClubPortada = function saveClubPortada(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveClubPortadaRef(dcInstance, inputVars));
}
;

const clearClubHeroesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearClubHeroes', inputVars);
}
clearClubHeroesRef.operationName = 'ClearClubHeroes';
exports.clearClubHeroesRef = clearClubHeroesRef;

exports.clearClubHeroes = function clearClubHeroes(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(clearClubHeroesRef(dcInstance, inputVars));
}
;

const insertClubHeroesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertClubHeroes', inputVars);
}
insertClubHeroesRef.operationName = 'InsertClubHeroes';
exports.insertClubHeroesRef = insertClubHeroesRef;

exports.insertClubHeroes = function insertClubHeroes(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertClubHeroesRef(dcInstance, inputVars));
}
;

const deleteGalleryAlbumRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteGalleryAlbum', inputVars);
}
deleteGalleryAlbumRef.operationName = 'DeleteGalleryAlbum';
exports.deleteGalleryAlbumRef = deleteGalleryAlbumRef;

exports.deleteGalleryAlbum = function deleteGalleryAlbum(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteGalleryAlbumRef(dcInstance, inputVars));
}
;

const tournamentEditorRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TournamentEditor', inputVars);
}
tournamentEditorRef.operationName = 'TournamentEditor';
exports.tournamentEditorRef = tournamentEditorRef;

exports.tournamentEditor = function tournamentEditor(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(tournamentEditorRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const scheduleCourtsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ScheduleCourts');
}
scheduleCourtsRef.operationName = 'ScheduleCourts';
exports.scheduleCourtsRef = scheduleCourtsRef;

exports.scheduleCourts = function scheduleCourts(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(scheduleCourtsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const matchSlotHintsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MatchSlotHints', inputVars);
}
matchSlotHintsRef.operationName = 'MatchSlotHints';
exports.matchSlotHintsRef = matchSlotHintsRef;

exports.matchSlotHints = function matchSlotHints(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(matchSlotHintsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const clubScreenRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ClubScreen', inputVars);
}
clubScreenRef.operationName = 'ClubScreen';
exports.clubScreenRef = clubScreenRef;

exports.clubScreen = function clubScreen(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(clubScreenRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const deleteUnplayedTournamentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteUnplayedTournament', inputVars);
}
deleteUnplayedTournamentRef.operationName = 'DeleteUnplayedTournament';
exports.deleteUnplayedTournamentRef = deleteUnplayedTournamentRef;

exports.deleteUnplayedTournament = function deleteUnplayedTournament(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteUnplayedTournamentRef(dcInstance, inputVars));
}
;

const updateTournamentSettingsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTournamentSettings', inputVars);
}
updateTournamentSettingsRef.operationName = 'UpdateTournamentSettings';
exports.updateTournamentSettingsRef = updateTournamentSettingsRef;

exports.updateTournamentSettings = function updateTournamentSettings(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateTournamentSettingsRef(dcInstance, inputVars));
}
;

const addTournamentClubRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddTournamentClub', inputVars);
}
addTournamentClubRef.operationName = 'AddTournamentClub';
exports.addTournamentClubRef = addTournamentClubRef;

exports.addTournamentClub = function addTournamentClub(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(addTournamentClubRef(dcInstance, inputVars));
}
;

const removeTournamentClubRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemoveTournamentClub', inputVars);
}
removeTournamentClubRef.operationName = 'RemoveTournamentClub';
exports.removeTournamentClubRef = removeTournamentClubRef;

exports.removeTournamentClub = function removeTournamentClub(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removeTournamentClubRef(dcInstance, inputVars));
}
;

const insertUnplayedMatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertUnplayedMatch', inputVars);
}
insertUnplayedMatchRef.operationName = 'InsertUnplayedMatch';
exports.insertUnplayedMatchRef = insertUnplayedMatchRef;

exports.insertUnplayedMatch = function insertUnplayedMatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertUnplayedMatchRef(dcInstance, inputVars));
}
;

const markMatchWalkoverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkMatchWalkover', inputVars);
}
markMatchWalkoverRef.operationName = 'MarkMatchWalkover';
exports.markMatchWalkoverRef = markMatchWalkoverRef;

exports.markMatchWalkover = function markMatchWalkover(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markMatchWalkoverRef(dcInstance, inputVars));
}
;

const deleteUnplayedMatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteUnplayedMatch', inputVars);
}
deleteUnplayedMatchRef.operationName = 'DeleteUnplayedMatch';
exports.deleteUnplayedMatchRef = deleteUnplayedMatchRef;

exports.deleteUnplayedMatch = function deleteUnplayedMatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteUnplayedMatchRef(dcInstance, inputVars));
}
;

const saveClubProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveClubProfile', inputVars);
}
saveClubProfileRef.operationName = 'SaveClubProfile';
exports.saveClubProfileRef = saveClubProfileRef;

exports.saveClubProfile = function saveClubProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveClubProfileRef(dcInstance, inputVars));
}
;

const scheduleOfficialMatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ScheduleOfficialMatch', inputVars);
}
scheduleOfficialMatchRef.operationName = 'ScheduleOfficialMatch';
exports.scheduleOfficialMatchRef = scheduleOfficialMatchRef;

exports.scheduleOfficialMatch = function scheduleOfficialMatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(scheduleOfficialMatchRef(dcInstance, inputVars));
}
;

const clearMatchCourtHoldsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearMatchCourtHolds', inputVars);
}
clearMatchCourtHoldsRef.operationName = 'ClearMatchCourtHolds';
exports.clearMatchCourtHoldsRef = clearMatchCourtHoldsRef;

exports.clearMatchCourtHolds = function clearMatchCourtHolds(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(clearMatchCourtHoldsRef(dcInstance, inputVars));
}
;

const saveMatchCourtHoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveMatchCourtHold', inputVars);
}
saveMatchCourtHoldRef.operationName = 'SaveMatchCourtHold';
exports.saveMatchCourtHoldRef = saveMatchCourtHoldRef;

exports.saveMatchCourtHold = function saveMatchCourtHold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveMatchCourtHoldRef(dcInstance, inputVars));
}
;

const saveMatchScoreRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveMatchScore', inputVars);
}
saveMatchScoreRef.operationName = 'SaveMatchScore';
exports.saveMatchScoreRef = saveMatchScoreRef;

exports.saveMatchScore = function saveMatchScore(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveMatchScoreRef(dcInstance, inputVars));
}
;

const clearMatchEventsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearMatchEvents', inputVars);
}
clearMatchEventsRef.operationName = 'ClearMatchEvents';
exports.clearMatchEventsRef = clearMatchEventsRef;

exports.clearMatchEvents = function clearMatchEvents(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(clearMatchEventsRef(dcInstance, inputVars));
}
;

const activateTournamentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ActivateTournament', inputVars);
}
activateTournamentRef.operationName = 'ActivateTournament';
exports.activateTournamentRef = activateTournamentRef;

exports.activateTournament = function activateTournament(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(activateTournamentRef(dcInstance, inputVars));
}
;

const insertMatchGoalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertMatchGoal', inputVars);
}
insertMatchGoalRef.operationName = 'InsertMatchGoal';
exports.insertMatchGoalRef = insertMatchGoalRef;

exports.insertMatchGoal = function insertMatchGoal(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertMatchGoalRef(dcInstance, inputVars));
}
;

const insertMatchCardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertMatchCard', inputVars);
}
insertMatchCardRef.operationName = 'InsertMatchCard';
exports.insertMatchCardRef = insertMatchCardRef;

exports.insertMatchCard = function insertMatchCard(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertMatchCardRef(dcInstance, inputVars));
}
;

const submitInquiryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitInquiry', inputVars);
}
submitInquiryRef.operationName = 'SubmitInquiry';
exports.submitInquiryRef = submitInquiryRef;

exports.submitInquiry = function submitInquiry(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(submitInquiryRef(dcInstance, inputVars));
}
;

const submitTeamApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitTeamApplication', inputVars);
}
submitTeamApplicationRef.operationName = 'SubmitTeamApplication';
exports.submitTeamApplicationRef = submitTeamApplicationRef;

exports.submitTeamApplication = function submitTeamApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(submitTeamApplicationRef(dcInstance, inputVars));
}
;

const ensureMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnsureMyProfile', inputVars);
}
ensureMyProfileRef.operationName = 'EnsureMyProfile';
exports.ensureMyProfileRef = ensureMyProfileRef;

exports.ensureMyProfile = function ensureMyProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(ensureMyProfileRef(dcInstance, inputVars));
}
;

const savePlayerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePlayer', inputVars);
}
savePlayerRef.operationName = 'SavePlayer';
exports.savePlayerRef = savePlayerRef;

exports.savePlayer = function savePlayer(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePlayerRef(dcInstance, inputVars));
}
;

const deletePlayerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePlayer', inputVars);
}
deletePlayerRef.operationName = 'DeletePlayer';
exports.deletePlayerRef = deletePlayerRef;

exports.deletePlayer = function deletePlayer(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePlayerRef(dcInstance, inputVars));
}
;

const saveClubEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveClubEvent', inputVars);
}
saveClubEventRef.operationName = 'SaveClubEvent';
exports.saveClubEventRef = saveClubEventRef;

exports.saveClubEvent = function saveClubEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveClubEventRef(dcInstance, inputVars));
}
;

const deleteClubEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteClubEvent', inputVars);
}
deleteClubEventRef.operationName = 'DeleteClubEvent';
exports.deleteClubEventRef = deleteClubEventRef;

exports.deleteClubEvent = function deleteClubEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteClubEventRef(dcInstance, inputVars));
}
;

const addTransactionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddTransaction', inputVars);
}
addTransactionRef.operationName = 'AddTransaction';
exports.addTransactionRef = addTransactionRef;

exports.addTransaction = function addTransaction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(addTransactionRef(dcInstance, inputVars));
}
;

const setGoalContributionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetGoalContribution', inputVars);
}
setGoalContributionRef.operationName = 'SetGoalContribution';
exports.setGoalContributionRef = setGoalContributionRef;

exports.setGoalContribution = function setGoalContribution(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setGoalContributionRef(dcInstance, inputVars));
}
;

const saveInventoryItemRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveInventoryItem', inputVars);
}
saveInventoryItemRef.operationName = 'SaveInventoryItem';
exports.saveInventoryItemRef = saveInventoryItemRef;

exports.saveInventoryItem = function saveInventoryItem(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveInventoryItemRef(dcInstance, inputVars));
}
;

const createCourtHoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCourtHold', inputVars);
}
createCourtHoldRef.operationName = 'CreateCourtHold';
exports.createCourtHoldRef = createCourtHoldRef;

exports.createCourtHold = function createCourtHold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCourtHoldRef(dcInstance, inputVars));
}
;

const deleteCourtHoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteCourtHold', inputVars);
}
deleteCourtHoldRef.operationName = 'DeleteCourtHold';
exports.deleteCourtHoldRef = deleteCourtHoldRef;

exports.deleteCourtHold = function deleteCourtHold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteCourtHoldRef(dcInstance, inputVars));
}
;

const clubBySlugRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ClubBySlug', inputVars);
}
clubBySlugRef.operationName = 'ClubBySlug';
exports.clubBySlugRef = clubBySlugRef;

exports.clubBySlug = function clubBySlug(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(clubBySlugRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const teamsPageRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TeamsPage');
}
teamsPageRef.operationName = 'TeamsPage';
exports.teamsPageRef = teamsPageRef;

exports.teamsPage = function teamsPage(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(teamsPageRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const searchClubsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SearchClubs', inputVars);
}
searchClubsRef.operationName = 'SearchClubs';
exports.searchClubsRef = searchClubsRef;

exports.searchClubs = function searchClubs(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(searchClubsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const contactPageRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ContactPage');
}
contactPageRef.operationName = 'ContactPage';
exports.contactPageRef = contactPageRef;

exports.contactPage = function contactPage(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(contactPageRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const platformClaimOpenRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlatformClaimOpen');
}
platformClaimOpenRef.operationName = 'PlatformClaimOpen';
exports.platformClaimOpenRef = platformClaimOpenRef;

exports.platformClaimOpen = function platformClaimOpen(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(platformClaimOpenRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const platformChromeRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlatformChrome');
}
platformChromeRef.operationName = 'PlatformChrome';
exports.platformChromeRef = platformChromeRef;

exports.platformChrome = function platformChrome(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(platformChromeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const platformBannerRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlatformBanner');
}
platformBannerRef.operationName = 'PlatformBanner';
exports.platformBannerRef = platformBannerRef;

exports.platformBanner = function platformBanner(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(platformBannerRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const homePageRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'HomePage', inputVars);
}
homePageRef.operationName = 'HomePage';
exports.homePageRef = homePageRef;

exports.homePage = function homePage(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(homePageRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const liveMatchesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'LiveMatches', inputVars);
}
liveMatchesRef.operationName = 'LiveMatches';
exports.liveMatchesRef = liveMatchesRef;

exports.liveMatches = function liveMatches(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(liveMatchesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const registerTeamPageRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'RegisterTeamPage');
}
registerTeamPageRef.operationName = 'RegisterTeamPage';
exports.registerTeamPageRef = registerTeamPageRef;

exports.registerTeamPage = function registerTeamPage(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(registerTeamPageRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const matchesPageRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MatchesPage');
}
matchesPageRef.operationName = 'MatchesPage';
exports.matchesPageRef = matchesPageRef;

exports.matchesPage = function matchesPage(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(matchesPageRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const activeClubsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ActiveClubs');
}
activeClubsRef.operationName = 'ActiveClubs';
exports.activeClubsRef = activeClubsRef;

exports.activeClubs = function activeClubs(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(activeClubsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const categoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'Categories');
}
categoriesRef.operationName = 'Categories';
exports.categoriesRef = categoriesRef;

exports.categories = function categories(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(categoriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const seasonsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'Seasons');
}
seasonsRef.operationName = 'Seasons';
exports.seasonsRef = seasonsRef;

exports.seasons = function seasons(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(seasonsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const tournamentArchiveRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TournamentArchive');
}
tournamentArchiveRef.operationName = 'TournamentArchive';
exports.tournamentArchiveRef = tournamentArchiveRef;

exports.tournamentArchive = function tournamentArchive(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(tournamentArchiveRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const tournamentsBySeasonRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TournamentsBySeason', inputVars);
}
tournamentsBySeasonRef.operationName = 'TournamentsBySeason';
exports.tournamentsBySeasonRef = tournamentsBySeasonRef;

exports.tournamentsBySeason = function tournamentsBySeason(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(tournamentsBySeasonRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const tournamentScreenRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TournamentScreen', inputVars);
}
tournamentScreenRef.operationName = 'TournamentScreen';
exports.tournamentScreenRef = tournamentScreenRef;

exports.tournamentScreen = function tournamentScreen(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(tournamentScreenRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const matchSummaryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MatchSummary', inputVars);
}
matchSummaryRef.operationName = 'MatchSummary';
exports.matchSummaryRef = matchSummaryRef;

exports.matchSummary = function matchSummary(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(matchSummaryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const matchScoreSheetRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MatchScoreSheet', inputVars);
}
matchScoreSheetRef.operationName = 'MatchScoreSheet';
exports.matchScoreSheetRef = matchScoreSheetRef;

exports.matchScoreSheet = function matchScoreSheet(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(matchScoreSheetRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const courtBusyOnDateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'CourtBusyOnDate', inputVars);
}
courtBusyOnDateRef.operationName = 'CourtBusyOnDate';
exports.courtBusyOnDateRef = courtBusyOnDateRef;

exports.courtBusyOnDate = function courtBusyOnDate(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(courtBusyOnDateRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const matchesByTournamentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MatchesByTournament', inputVars);
}
matchesByTournamentRef.operationName = 'MatchesByTournament';
exports.matchesByTournamentRef = matchesByTournamentRef;

exports.matchesByTournament = function matchesByTournament(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(matchesByTournamentRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const clubScopedMatchesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ClubScopedMatches', inputVars);
}
clubScopedMatchesRef.operationName = 'ClubScopedMatches';
exports.clubScopedMatchesRef = clubScopedMatchesRef;

exports.clubScopedMatches = function clubScopedMatches(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(clubScopedMatchesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const upcomingMatchesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'UpcomingMatches', inputVars);
}
upcomingMatchesRef.operationName = 'UpcomingMatches';
exports.upcomingMatchesRef = upcomingMatchesRef;

exports.upcomingMatches = function upcomingMatches(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(upcomingMatchesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const tournamentStandingsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TournamentStandings', inputVars);
}
tournamentStandingsRef.operationName = 'TournamentStandings';
exports.tournamentStandingsRef = tournamentStandingsRef;

exports.tournamentStandings = function tournamentStandings(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(tournamentStandingsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const tournamentScorersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'TournamentScorers', inputVars);
}
tournamentScorersRef.operationName = 'TournamentScorers';
exports.tournamentScorersRef = tournamentScorersRef;

exports.tournamentScorers = function tournamentScorers(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(tournamentScorersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const courtsPageRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'CourtsPage', inputVars);
}
courtsPageRef.operationName = 'CourtsPage';
exports.courtsPageRef = courtsPageRef;

exports.courtsPage = function courtsPage(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(courtsPageRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const courtHoldsOnDateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'CourtHoldsOnDate', inputVars);
}
courtHoldsOnDateRef.operationName = 'CourtHoldsOnDate';
exports.courtHoldsOnDateRef = courtHoldsOnDateRef;

exports.courtHoldsOnDate = function courtHoldsOnDate(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(courtHoldsOnDateRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const liveAdsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'LiveAds', inputVars);
}
liveAdsRef.operationName = 'LiveAds';
exports.liveAdsRef = liveAdsRef;

exports.liveAds = function liveAds(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(liveAdsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const myMembershipsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MyMemberships', inputVars);
}
myMembershipsRef.operationName = 'MyMemberships';
exports.myMembershipsRef = myMembershipsRef;

exports.myMemberships = function myMemberships(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(myMembershipsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const mySpacesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MySpaces');
}
mySpacesRef.operationName = 'MySpaces';
exports.mySpacesRef = mySpacesRef;

exports.mySpaces = function mySpaces(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(mySpacesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const myOpenClubInvitesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'MyOpenClubInvites', inputVars);
}
myOpenClubInvitesRef.operationName = 'MyOpenClubInvites';
exports.myOpenClubInvitesRef = myOpenClubInvitesRef;

exports.myOpenClubInvites = function myOpenClubInvites(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(myOpenClubInvitesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const playerContributionTotalsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlayerContributionTotals', inputVars);
}
playerContributionTotalsRef.operationName = 'PlayerContributionTotals';
exports.playerContributionTotalsRef = playerContributionTotalsRef;

exports.playerContributionTotals = function playerContributionTotals(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(playerContributionTotalsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
