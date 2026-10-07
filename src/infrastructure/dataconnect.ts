// Operaciones de datos. Generado por scripts/api/generarShim.mjs a partir de dataconnect/connector/*.gql.
// Cada export conserva el nombre y la firma del SDK de Data Connect (op(dataConnect, vars, opciones) -> { data })
// y llama a la función RPC homónima en snake_case (db/migrations/1*.sql). Añade operaciones nuevas aquí a mano.
import type * as T from "./api/types";
import { mutation, query, queryNoVars } from "./api/rpc";

export * from "./api/types";
export { dataConnect, QueryFetchPolicy, RpcError, rpcErrorHint } from "./api/rpc";
export type { ExecuteQueryOptions, OperationResult } from "./api/rpc";

// ---- admin.gql ----
/** mutation AcceptClubInvite (USER) */
export const acceptClubInvite = mutation<T.AcceptClubInviteVariables, T.AcceptClubInviteData>("accept_club_invite");
// ---- league.gql ----
/** mutation ActivateTournament (USER) */
export const activateTournament = mutation<T.ActivateTournamentVariables, T.ActivateTournamentData>("activate_tournament");
/** mutation AddLiveMatchCard (USER) */
export const addLiveMatchCard = mutation<T.AddLiveMatchCardVariables, T.AddLiveMatchCardData>("add_live_match_card");
/** mutation AddLiveMatchGoal (USER) */
export const addLiveMatchGoal = mutation<T.AddLiveMatchGoalVariables, T.AddLiveMatchGoalData>("add_live_match_goal");
/** mutation AddTournamentClub (USER) */
export const addTournamentClub = mutation<T.AddTournamentClubVariables, T.AddTournamentClubData>("add_tournament_club");
// ---- mutations.gql ----
/** mutation AddTransaction (USER) */
export const addTransaction = mutation<T.AddTransactionVariables, T.AddTransactionData>("add_transaction");
// ---- admin.gql ----
/** query AdminAdmins (USER) */
export const adminAdmins = queryNoVars<T.AdminAdminsData>("admin_admins");
/** query AdminAds (USER) */
export const adminAds = queryNoVars<T.AdminAdsData>("admin_ads");
/** query AdminClubPeople (USER) */
export const adminClubPeople = query<T.AdminClubPeopleVariables, T.AdminClubPeopleData>("admin_club_people");
/** query AdminClubs (USER) */
export const adminClubs = queryNoVars<T.AdminClubsData>("admin_clubs");
/** query AdminCompetition (USER) */
export const adminCompetition = queryNoVars<T.AdminCompetitionData>("admin_competition");
/** query AdminCourts (USER) */
export const adminCourts = queryNoVars<T.AdminCourtsData>("admin_courts");
/** query AdminCover (USER) */
export const adminCover = queryNoVars<T.AdminCoverData>("admin_cover");
/** query AdminInbox (USER) */
export const adminInbox = queryNoVars<T.AdminInboxData>("admin_inbox");
/** mutation ApproveTeamApplication (USER) */
export const approveTeamApplication = mutation<T.ApproveTeamApplicationVariables, T.ApproveTeamApplicationData>("approve_team_application");
/** mutation BootstrapPlatformAdmin (USER) */
export const bootstrapPlatformAdmin = mutation<T.BootstrapPlatformAdminVariables, T.BootstrapPlatformAdminData>("bootstrap_platform_admin");
/** mutation ClaimPlatformAdminInvite (USER) */
export const claimPlatformAdminInvite = mutation<T.ClaimPlatformAdminInviteVariables, T.ClaimPlatformAdminInviteData>("claim_platform_admin_invite");
/** mutation ClearAdPlacements (USER) */
export const clearAdPlacements = mutation<T.ClearAdPlacementsVariables, T.ClearAdPlacementsData>("clear_ad_placements");
// ---- club.gql ----
/** mutation ClearClubAvailability (USER) */
export const clearClubAvailability = mutation<T.ClearClubAvailabilityVariables, T.ClearClubAvailabilityData>("clear_club_availability");
/** mutation ClearClubHeroes (USER) */
export const clearClubHeroes = mutation<T.ClearClubHeroesVariables, T.ClearClubHeroesData>("clear_club_heroes");
// ---- admin.gql ----
/** mutation ClearCourtWindows (USER) */
// ---- league.gql ----
/** mutation ClearMatchCourtHolds (USER) */
export const clearMatchCourtHolds = mutation<T.ClearMatchCourtHoldsVariables, T.ClearMatchCourtHoldsData>("clear_match_court_holds");
/** mutation ClearMatchEvents (USER) */
export const clearMatchEvents = mutation<T.ClearMatchEventsVariables, T.ClearMatchEventsData>("clear_match_events");
// ---- admin.gql ----
/** mutation ClearSignupInvite (USER) */
export const clearSignupInvite = mutation<T.ClearSignupInviteVariables, T.ClearSignupInviteData>("clear_signup_invite");
/** query ClubInviteLookup (PUBLIC) */
export const clubInviteLookup = query<T.ClubInviteLookupVariables, T.ClubInviteLookupData>("club_invite_lookup");
// ---- league.gql ----
/** query ClubScreen (PUBLIC) */
export const clubScreen = query<T.ClubScreenVariables, T.ClubScreenData>("club_screen");
// ---- queries.gql ----
/** query ContactPage (PUBLIC) */
export const contactPage = queryNoVars<T.ContactPageData>("contact_page");
/** query CourtBusyOnDate (USER) */
export const courtBusyOnDate = query<T.CourtBusyOnDateVariables, T.CourtBusyOnDateData>("court_busy_on_date");
/** query CourtsPage (PUBLIC) */
export const courtsPage = query<T.CourtsPageVariables, T.CourtsPageData>("courts_page");
// ---- admin.gql ----
/** mutation CreateCategory (USER) */
export const createCategory = mutation<T.CreateCategoryVariables, T.CreateCategoryData>("create_category");
/** mutation CreateClub (USER) */
export const createClub = mutation<T.CreateClubVariables, T.CreateClubData>("create_club");
/** mutation CreateLocality (USER) */
export const createLocality = mutation<T.CreateLocalityVariables, T.CreateLocalityData>("create_locality");
/** mutation CreateSeason (USER) */
export const createSeason = mutation<T.CreateSeasonVariables, T.CreateSeasonData>("create_season");
/** mutation CreateTournament (USER) */
export const createTournament = mutation<T.CreateTournamentVariables, T.CreateTournamentData>("create_tournament");
/** mutation DeclineClubInvite (PUBLIC) */
export const declineClubInvite = mutation<T.DeclineClubInviteVariables, T.DeclineClubInviteData>("decline_club_invite");
/** mutation DeleteAd (USER) */
export const deleteAd = mutation<T.DeleteAdVariables, T.DeleteAdData>("delete_ad");
/** mutation DeleteClub (USER) */
export const deleteClub = mutation<T.DeleteClubVariables, T.DeleteClubData>("delete_club");
// ---- mutations.gql ----
/** mutation DeleteClubEvent (USER) */
export const deleteClubEvent = mutation<T.DeleteClubEventVariables, T.DeleteClubEventData>("delete_club_event");
// ---- admin.gql ----
/** mutation DeleteCourt (USER) */
export const deleteCourt = mutation<T.DeleteCourtVariables, T.DeleteCourtData>("delete_court");
// ---- club.gql ----
/** mutation DeleteFinancialGoal (USER) */
export const deleteFinancialGoal = mutation<T.DeleteFinancialGoalVariables, T.DeleteFinancialGoalData>("delete_financial_goal");
/** mutation DeleteGalleryAlbum (USER) */
export const deleteGalleryAlbum = mutation<T.DeleteGalleryAlbumVariables, T.DeleteGalleryAlbumData>("delete_gallery_album");
/** mutation DeleteGalleryPhoto (USER) */
export const deleteGalleryPhoto = mutation<T.DeleteGalleryPhotoVariables, T.DeleteGalleryPhotoData>("delete_gallery_photo");
// ---- admin.gql ----
/** mutation DeleteInquiry (USER) */
export const deleteInquiry = mutation<T.DeleteInquiryVariables, T.DeleteInquiryData>("delete_inquiry");
// ---- club.gql ----
/** mutation DeleteInventoryItem (USER) */
export const deleteInventoryItem = mutation<T.DeleteInventoryItemVariables, T.DeleteInventoryItemData>("delete_inventory_item");
// ---- league.gql ----
/** mutation DeleteLiveMatchCard (USER) */
export const deleteLiveMatchCard = mutation<T.DeleteLiveMatchCardVariables, T.DeleteLiveMatchCardData>("delete_live_match_card");
/** mutation DeleteLiveMatchGoal (USER) */
export const deleteLiveMatchGoal = mutation<T.DeleteLiveMatchGoalVariables, T.DeleteLiveMatchGoalData>("delete_live_match_goal");
// ---- admin.gql ----
/** mutation DeleteManualCourtHold (USER) */
export const deleteManualCourtHold = mutation<T.DeleteManualCourtHoldVariables, T.DeleteManualCourtHoldData>("delete_manual_court_hold");
// ---- mutations.gql ----
/** mutation DeletePlayer (USER) */
export const deletePlayer = mutation<T.DeletePlayerVariables, T.DeletePlayerData>("delete_player");
// ---- admin.gql ----
/** mutation DeleteSeason (USER) */
export const deleteSeason = mutation<T.DeleteSeasonVariables, T.DeleteSeasonData>("delete_season");
// ---- club.gql ----
/** mutation DeleteTransaction (USER) */
export const deleteTransaction = mutation<T.DeleteTransactionVariables, T.DeleteTransactionData>("delete_transaction");
// ---- league.gql ----
/** mutation DeleteUnplayedMatch (USER) */
export const deleteUnplayedMatch = mutation<T.DeleteUnplayedMatchVariables, T.DeleteUnplayedMatchData>("delete_unplayed_match");
/** mutation CloseTournament (USER): FINISHED, podio con la tabla y partidos pendientes por programar */
export const closeTournament = mutation<T.CloseTournamentVariables, T.CloseTournamentData>("close_tournament");
/** mutation ReopenTournament (USER): solo con la temporada activa */
export const reopenTournament = mutation<T.ReopenTournamentVariables, T.ReopenTournamentData>("reopen_tournament");
/** mutation ResetWalkoverMatch (USER): un W.O. vuelve a «por programar» */
export const resetWalkoverMatch = mutation<T.ResetWalkoverMatchVariables, T.ResetWalkoverMatchData>("reset_walkover_match");
/** mutation SetMatchRound (USER): renumera la jornada de un partido no jugado */
export const setMatchRound = mutation<T.SetMatchRoundVariables, T.SetMatchRoundData>("set_match_round");
/** mutation DeleteUnplayedTournament (USER) */
export const deleteUnplayedTournament = mutation<T.DeleteUnplayedTournamentVariables, T.DeleteUnplayedTournamentData>("delete_unplayed_tournament");
// ---- mutations.gql ----
/** mutation EnsureMyProfile (USER) */
export const ensureMyProfile = mutation<T.EnsureMyProfileVariables, T.EnsureMyProfileData>("ensure_my_profile");
// ---- league.gql ----
/** mutation FinishLiveMatch (USER) */
export const finishLiveMatch = mutation<T.FinishLiveMatchVariables, T.FinishLiveMatchData>("finish_live_match");
// ---- queries.gql ----
/** query HomePage (PUBLIC) */
export const homePage = query<T.HomePageVariables, T.HomePageData>("home_page");
// ---- club.gql ----
/** mutation InsertClubAvailability (USER) */
export const insertClubAvailability = mutation<T.InsertClubAvailabilityVariables, T.InsertClubAvailabilityData>("insert_club_availability");
// ---- admin.gql ----
/** mutation InsertClubHero (USER) */
export const insertClubHero = mutation<T.InsertClubHeroVariables, T.InsertClubHeroData>("insert_club_hero");
// ---- club.gql ----
/** mutation InsertClubHeroes (USER) */
export const insertClubHeroes = mutation<T.InsertClubHeroesVariables, T.InsertClubHeroesData>("insert_club_heroes");
// ---- league.gql ----
/** mutation InsertMatchCard (USER) */
export const insertMatchCard = mutation<T.InsertMatchCardVariables, T.InsertMatchCardData>("insert_match_card");
/** mutation InsertTimedMatchGoal (USER) */
export const insertTimedMatchGoal = mutation<T.InsertTimedMatchGoalVariables, T.InsertTimedMatchGoalData>("insert_timed_match_goal");
/** mutation InsertUnplayedMatch (USER) */
export const insertUnplayedMatch = mutation<T.InsertUnplayedMatchVariables, T.InsertUnplayedMatchData>("insert_unplayed_match");
// ---- queries.gql ----
/** query LiveAds (PUBLIC) */
export const liveAds = query<T.LiveAdsVariables, T.LiveAdsData>("live_ads");
/** query LiveMatches (PUBLIC) */
export const liveMatches = query<T.LiveMatchesVariables, T.LiveMatchesData>("live_matches");
// ---- league.gql ----
/** mutation MarkMatchWalkover (USER) */
export const markMatchWalkover = mutation<T.MarkMatchWalkoverVariables, T.MarkMatchWalkoverData>("mark_match_walkover");
// ---- queries.gql ----
/** query MatchDetail (PUBLIC) */
export const matchDetail = query<T.MatchDetailVariables, T.MatchDetailData>("match_detail");
/** query MatchesPage (PUBLIC) */
export const matchesPage = queryNoVars<T.MatchesPageData>("matches_page");
/** query MatchPreview (PUBLIC) */
export const matchPreview = query<T.MatchPreviewVariables, T.MatchPreviewData>("match_preview");
/** query MatchScoreSheet (USER) */
export const matchScoreSheet = query<T.MatchScoreSheetVariables, T.MatchScoreSheetData>("match_score_sheet");
// ---- league.gql ----
/** query MatchSlotHints (USER) */
export const matchSlotHints = query<T.MatchSlotHintsVariables, T.MatchSlotHintsData>("match_slot_hints");
// ---- queries.gql ----
/** query MyMemberships (USER) */
export const myMemberships = query<T.MyMembershipsVariables, T.MyMembershipsData>("my_memberships");
/** query MyOpenClubInvites (USER) */
export const myOpenClubInvites = query<T.MyOpenClubInvitesVariables, T.MyOpenClubInvitesData>("my_open_club_invites");
/** query MySpaces (USER) */
export const mySpaces = queryNoVars<T.MySpacesData>("my_spaces");
// ---- admin.gql ----
/** query PlatformAdminById (USER) */
export const platformAdminById = query<T.PlatformAdminByIdVariables, T.PlatformAdminByIdData>("platform_admin_by_id");
// ---- queries.gql ----
/** query PlatformBanner (PUBLIC) */
export const platformBanner = queryNoVars<T.PlatformBannerData>("platform_banner");
/** query PlatformChrome (PUBLIC) */
export const platformChrome = queryNoVars<T.PlatformChromeData>("platform_chrome");
/** query PlatformClaimOpen (PUBLIC) */
export const platformClaimOpen = queryNoVars<T.PlatformClaimOpenData>("platform_claim_open");
// ---- club.gql ----
/** mutation PromoteGalleryPhoto (USER) */
export const promoteGalleryPhoto = mutation<T.PromoteGalleryPhotoVariables, T.PromoteGalleryPhotoData>("promote_gallery_photo");
// ---- queries.gql ----
/** query RegisterTeamPage (PUBLIC) */
export const registerTeamPage = queryNoVars<T.RegisterTeamPageData>("register_team_page");
// ---- admin.gql ----
/** mutation RejectTeamApplication (USER) */
export const rejectTeamApplication = mutation<T.RejectTeamApplicationVariables, T.RejectTeamApplicationData>("reject_team_application");
/** mutation RemoveClubInvite (USER) */
export const removeClubInvite = mutation<T.RemoveClubInviteVariables, T.RemoveClubInviteData>("remove_club_invite");
/** mutation RemoveClubMember (USER) */
export const removeClubMember = mutation<T.RemoveClubMemberVariables, T.RemoveClubMemberData>("remove_club_member");
/** mutation RemovePlatformAdmin (USER) */
export const removePlatformAdmin = mutation<T.RemovePlatformAdminVariables, T.RemovePlatformAdminData>("remove_platform_admin");
/** mutation RemovePlatformAdminInvite (USER) */
export const removePlatformAdminInvite = mutation<T.RemovePlatformAdminInviteVariables, T.RemovePlatformAdminInviteData>("remove_platform_admin_invite");
// ---- league.gql ----
/** mutation RemoveTournamentClub (USER) */
export const removeTournamentClub = mutation<T.RemoveTournamentClubVariables, T.RemoveTournamentClubData>("remove_tournament_club");
// ---- club.gql ----
/** mutation ReplaceClubEventAlbum (USER) */
export const replaceClubEventAlbum = mutation<T.ReplaceClubEventAlbumVariables, T.ReplaceClubEventAlbumData>("replace_club_event_album");
/** mutation ReplaceClubEventAttendees (USER) */
export const replaceClubEventAttendees = mutation<T.ReplaceClubEventAttendeesVariables, T.ReplaceClubEventAttendeesData>("replace_club_event_attendees");
/** mutation ReplaceClubEventStats (USER) */
export const replaceClubEventStats = mutation<T.ReplaceClubEventStatsVariables, T.ReplaceClubEventStatsData>("replace_club_event_stats");
// ---- admin.gql ----
/** mutation ReplaceHeroImages (USER) */
export const replaceHeroImages = mutation<T.ReplaceHeroImagesVariables, T.ReplaceHeroImagesData>("replace_hero_images");
// ---- club.gql ----
/** mutation ReplaceMatchAttendees (USER) */
export const replaceMatchAttendees = mutation<T.ReplaceMatchAttendeesVariables, T.ReplaceMatchAttendeesData>("replace_match_attendees");
// ---- admin.gql ----
/** mutation SaveAd (USER) */
export const saveAd = mutation<T.SaveAdVariables, T.SaveAdData>("save_ad");
/** mutation SaveAdPlacement (USER) */
export const saveAdPlacement = mutation<T.SaveAdPlacementVariables, T.SaveAdPlacementData>("save_ad_placement");
// ---- club.gql ----
/** mutation SaveClubDefaultLineup (USER) */
export const saveClubDefaultLineup = mutation<T.SaveClubDefaultLineupVariables, T.SaveClubDefaultLineupData>("save_club_default_lineup");
// ---- mutations.gql ----
/** mutation SaveClubEvent (USER) */
export const saveClubEvent = mutation<T.SaveClubEventVariables, T.SaveClubEventData>("save_club_event");
// ---- admin.gql ----
/** mutation SaveClubInvite (USER) */
export const saveClubInvite = mutation<T.SaveClubInviteVariables, T.SaveClubInviteData>("save_club_invite");
// ---- club.gql ----
/** mutation SaveClubPortada (USER) */
export const saveClubPortada = mutation<T.SaveClubPortadaVariables, T.SaveClubPortadaData>("save_club_portada");
// ---- league.gql ----
/** mutation SaveClubProfile (USER) */
export const saveClubProfile = mutation<T.SaveClubProfileVariables, T.SaveClubProfileData>("save_club_profile");
// ---- admin.gql ----
/** mutation SaveCourt (USER) */
export const saveCourt = mutation<T.SaveCourtVariables, T.SaveCourtData>("save_court");
/** mutation SaveCourtHold (USER) */
export const saveCourtHold = mutation<T.SaveCourtHoldVariables, T.SaveCourtHoldData>("save_court_hold");
/** mutation SaveCourtSettings (USER) */
export const saveCourtModule = mutation<T.SaveCourtModuleVariables, T.SaveCourtModuleData>("save_court_module");
/** mutation SaveCourtWindow (USER) */
// ---- club.gql ----
/** mutation SaveFinancialGoal (USER) */
export const saveFinancialGoal = mutation<T.SaveFinancialGoalVariables, T.SaveFinancialGoalData>("save_financial_goal");
/** mutation SaveGalleryPhoto (USER) */
export const saveGalleryPhoto = mutation<T.SaveGalleryPhotoVariables, T.SaveGalleryPhotoData>("save_gallery_photo");
// ---- mutations.gql ----
/** mutation SaveInventoryItem (USER) */
export const saveInventoryItem = mutation<T.SaveInventoryItemVariables, T.SaveInventoryItemData>("save_inventory_item");
// ---- league.gql ----
/** mutation SaveMatchCourtHold (USER) */
export const saveMatchCourtHold = mutation<T.SaveMatchCourtHoldVariables, T.SaveMatchCourtHoldData>("save_match_court_hold");
/** mutation SaveMatchScore (USER) */
export const saveMatchScore = mutation<T.SaveMatchScoreVariables, T.SaveMatchScoreData>("save_match_score");
// ---- admin.gql ----
/** mutation SavePlatformAdminInvite (USER) */
export const savePlatformAdminInvite = mutation<T.SavePlatformAdminInviteVariables, T.SavePlatformAdminInviteData>("save_platform_admin_invite");
/** mutation SavePlatformCover (USER) */
export const savePlatformCover = mutation<T.SavePlatformCoverVariables, T.SavePlatformCoverData>("save_platform_cover");
/** mutation SavePlatformHeader (USER) */
export const savePlatformHeader = mutation<T.SavePlatformHeaderVariables, T.SavePlatformHeaderData>("save_platform_header");
/** mutation SavePlatformSocial (USER) */
export const savePlatformSocial = mutation<T.SavePlatformSocialVariables, T.SavePlatformSocialData>("save_platform_social");
// ---- mutations.gql ----
/** mutation SavePlayer (USER) */
export const savePlayer = mutation<T.SavePlayerVariables, T.SavePlayerData>("save_player");
// ---- admin.gql ----
/** mutation SaveSignupInvite (USER) */
export const saveSignupInvite = mutation<T.SaveSignupInviteVariables, T.SaveSignupInviteData>("save_signup_invite");
// ---- league.gql ----
/** query ScheduleCourts (USER) */
export const scheduleCourts = queryNoVars<T.ScheduleCourtsData>("schedule_courts");
/** mutation ScheduleOfficialMatch (USER) */
export const scheduleOfficialMatch = mutation<T.ScheduleOfficialMatchVariables, T.ScheduleOfficialMatchData>("schedule_official_match");
// ---- admin.gql ----
/** query SearchAdminClubs (USER) */
export const searchAdminClubs = query<T.SearchAdminClubsVariables, T.SearchAdminClubsData>("search_admin_clubs");
// ---- queries.gql ----
/** query SearchClubs (PUBLIC) */
export const searchClubs = query<T.SearchClubsVariables, T.SearchClubsData>("search_clubs");
// ---- admin.gql ----
/** mutation SetAdOrder (USER) */
export const setAdOrder = mutation<T.SetAdOrderVariables, T.SetAdOrderData>("set_ad_order");
/** mutation SetAdStatus (USER) */
export const setAdStatus = mutation<T.SetAdStatusVariables, T.SetAdStatusData>("set_ad_status");
/** mutation SetClubActive (USER) */
export const setClubActive = mutation<T.SetClubActiveVariables, T.SetClubActiveData>("set_club_active");
// ---- club.gql ----
/** mutation SetClubEventLineup (USER) */
export const setClubEventLineup = mutation<T.SetClubEventLineupVariables, T.SetClubEventLineupData>("set_club_event_lineup");
/** mutation SetClubEventScore (USER) */
export const setClubEventScore = mutation<T.SetClubEventScoreVariables, T.SetClubEventScoreData>("set_club_event_score");
// ---- admin.gql ----
/** mutation SetClubMemberRole (USER) */
export const setClubMemberRole = mutation<T.SetClubMemberRoleVariables, T.SetClubMemberRoleData>("set_club_member_role");
// ---- club.gql ----
/** mutation SetFinancialGoalStatus (USER) */
export const setFinancialGoalStatus = mutation<T.SetFinancialGoalStatusVariables, T.SetFinancialGoalStatusData>("set_financial_goal_status");
// ---- mutations.gql ----
/** mutation SetGoalContribution (USER) */
export const setGoalContribution = mutation<T.SetGoalContributionVariables, T.SetGoalContributionData>("set_goal_contribution");
// ---- admin.gql ----
/** mutation SetInquiryDone (USER) */
export const setInquiryDone = mutation<T.SetInquiryDoneVariables, T.SetInquiryDoneData>("set_inquiry_done");
// ---- club.gql ----
/** mutation SetMatchClubLineup (USER) */
export const setMatchClubLineup = mutation<T.SetMatchClubLineupVariables, T.SetMatchClubLineupData>("set_match_club_lineup");
// ---- admin.gql ----
/** mutation SetSeasonActive (USER) */
export const setSeasonActive = mutation<T.SetSeasonActiveVariables, T.SetSeasonActiveData>("set_season_active");
/** query SignupInviteByEmail (PUBLIC) */
export const signupInviteByEmail = query<T.SignupInviteByEmailVariables, T.SignupInviteByEmailData>("signup_invite_by_email");
// ---- mutations.gql ----
/** mutation SubmitInquiry (PUBLIC) */
export const submitInquiry = mutation<T.SubmitInquiryVariables, T.SubmitInquiryData>("submit_inquiry");
/** mutation SubmitTeamApplication (PUBLIC) */
export const submitTeamApplication = mutation<T.SubmitTeamApplicationVariables, T.SubmitTeamApplicationData>("submit_team_application");
// ---- club.gql ----
/** mutation SwapGalleryPhotos (USER) */
export const swapGalleryPhotos = mutation<T.SwapGalleryPhotosVariables, T.SwapGalleryPhotosData>("swap_gallery_photos");
// ---- queries.gql ----
/** query TeamsPage (PUBLIC) */
export const teamsPage = queryNoVars<T.TeamsPageData>("teams_page");
/** query TournamentArchive (PUBLIC) */
export const tournamentArchive = queryNoVars<T.TournamentArchiveData>("tournament_archive");
// ---- league.gql ----
/** query TournamentEditor (USER) */
export const tournamentEditor = query<T.TournamentEditorVariables, T.TournamentEditorData>("tournament_editor");
// ---- queries.gql ----
/** query TournamentScreen (PUBLIC) */
export const tournamentScreen = query<T.TournamentScreenVariables, T.TournamentScreenData>("tournament_screen");
// ---- league.gql ----
/** mutation UpdateTournamentSettings (USER) */
export const updateTournamentSettings = mutation<T.UpdateTournamentSettingsVariables, T.UpdateTournamentSettingsData>("update_tournament_settings");
