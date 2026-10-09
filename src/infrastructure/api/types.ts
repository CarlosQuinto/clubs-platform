// Tipos de las operaciones (antes dataconnect/generated). Generado por scripts/api/generarTipos.mjs: no lo edites a mano.
// Cada función RPC de db/migrations/1*.sql devuelve exactamente la forma de su <Op>Data.
/* eslint-disable */

export enum EventType {
  PARTIDO = "PARTIDO",
  ENTRENAMIENTO = "ENTRENAMIENTO",
}

export enum FriendlyMatchType {
  AMISTOSO = "AMISTOSO",
}

export enum CardColor {
  YELLOW = "YELLOW",
  RED = "RED",
}

export enum TransactionType {
  INGRESO = "INGRESO",
  GASTO = "GASTO",
}

export enum TransactionSource {
  MANUAL = "MANUAL",
  LEGACY_AMOUNT_PAID = "LEGACY_AMOUNT_PAID",
}

export enum GoalStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export enum InventoryCondition {
  BUENO = "BUENO",
  MALO = "MALO",
  PERDIDO = "PERDIDO",
}

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;

export enum AdPlacementKind {
  HOME = "HOME",
  TOURNAMENT = "TOURNAMENT",
  CLUB = "CLUB",
  TEAMS = "TEAMS",
}

export enum AdStatus {
  PROGRAMADO = "PROGRAMADO",
  EN_CURSO = "EN_CURSO",
  PAUSADO = "PAUSADO",
  EXPIRADO = "EXPIRADO",
}

export enum CourtHoldSource {
  MATCH = "MATCH",
  MANUAL = "MANUAL",
}

export enum FootballType {
  FUT_7 = "FUT_7",
  FUT_9 = "FUT_9",
  FUT_11 = "FUT_11",
}

export enum InquiryStatus {
  NEW = "NEW",
  DONE = "DONE",
}

export enum InviteKind {
  SIGNUP = "SIGNUP",
  ACCEPT = "ACCEPT",
}

/** Quién no se presentó a un partido dado por W.O. (null = W.O. por ingreso tardío). */
export type MatchNoShow = "HOME" | "AWAY" | "BOTH";

export enum MatchStatus {
  UNSCHEDULED = "UNSCHEDULED",
  SCHEDULED = "SCHEDULED",
  PLAYED = "PLAYED",
}

export enum MemberRole {
  ADMIN = "ADMIN",
  DT = "DT",
  PRENSA = "PRENSA",
  TESORERO = "TESORERO",
}

export enum TeamApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum TournamentStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

export interface AcceptClubInviteData {
  ensured?: number | null;
  member?: unknown | null;
  droppedSignup?: number | null;
  droppedInvite?: number | null;
}

export interface AcceptClubInviteVariables {
  clubId: string;
  emailKey: string;
  token: string;
  displayName: string;
}

export interface ActivateTournamentData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  tournament?: number | null;
}

export interface ActivateTournamentVariables {
  userId?: string;
  matchId: string;
}

export interface ActiveClubsData {
  clubs: ({
    id: string;
    slug: string;
    name: string;
    logoUrl?: string | null;
    location: string;
    active: boolean;
  } & Club_Key)[];
}

export interface AdPlacement_Key {
  adId: string;
  placement: AdPlacementKind;
  __typename?: 'AdPlacement_Key';
}

export interface Ad_Key {
  id: string;
  __typename?: 'Ad_Key';
}

export interface AddLiveMatchCardData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  card?: number | null;
  match?: unknown | null;
}

export interface AddLiveMatchCardVariables {
  id: string;
  matchId: string;
  clubId: string;
  playerId?: string;
  color: string;
  minute?: number | null;
}

export interface AddLiveMatchGoalData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  goal?: number | null;
  match?: unknown | null;
}

export interface AddLiveMatchGoalVariables {
  id: string;
  matchId: string;
  clubId: string;
  scorerId?: string;
  assistId?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  minute?: number | null;
}

export interface AddTournamentClubData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  row?: unknown | null;
  /** Aviso junto a row: jugadores activos del club que ya juegan este torneo con otro club (0010). */
  conflicts?: { playerName: string; clubName: string }[] | null;
}

export interface AddTournamentClubVariables {
  userId?: string;
  tournamentId: string;
  clubId: string;
}

export interface AddTransactionData {
  transaction?: unknown | null;
}

export interface AddTransactionVariables {
  id: string;
  clubId: string;
  type: string;
  description: string;
  category: string;
  amount: number;
  txnDate: DateString;
}

export interface AdminAdminsData {
  platformAdmins: ({
    email: string;
    user: {
      id: string;
      displayName: string;
    } & User_Key;
  })[];
  platformAdminInvites: ({
    emailKey: string;
    email: string;
  } & PlatformAdminInvite_Key)[];
}

export interface AdminAdsData {
  ads: ({
    id: string;
    brand: string;
    imageUrl: string;
    href: string;
    startsOn: DateString;
    endsOn: DateString;
    status: AdStatus;
    sortOrder: number;
    price?: number;
    advertiserName?: string;
    advertiserContact?: string;
    adPlacements_on_ad: ({
      placement: AdPlacementKind;
    })[];
  } & Ad_Key)[];
}

export interface AdminClubPeopleData {
  clubMembers: ({
    email: string;
    displayName: string;
    role: MemberRole;
    user: {
      id: string;
    } & User_Key;
  })[];
  clubInvites: ({
    emailKey: string;
    email: string;
    role: MemberRole;
    token?: string | null;
    kind: InviteKind;
  })[];
}

export interface AdminClubPeopleVariables {
  clubId: string;
}

export interface AdminClubsData {
  localities: ({
    id: string;
    name: string;
  } & Locality_Key)[];
  clubs: ({
    id: string;
    slug: string;
    name: string;
    active: boolean;
    disabledReason?: string | null;
    locality?: {
      id: string;
    } & Locality_Key;
    /** Saldo pendiente con la liga (finanzas). */
    leagueDebt?: number;
  } & Club_Key)[];
}

export interface AdminCompetitionData {
  seasons: ({
    id: string;
    name: string;
    startDate?: DateString | null;
    endDate?: DateString | null;
    active: boolean;
  } & Season_Key)[];
  categories: ({
    id: string;
    name: string;
    sortOrder: number;
  } & Category_Key)[];
  tournaments: ({
    id: string;
    status: TournamentStatus;
    season: {
      id: string;
    } & Season_Key;
  } & Tournament_Key)[];
}

export interface AdminCourtsData {
  platformSettings?: {
    courtsEnabled: boolean;
    courtSlotMinutes: number;
  };
  courtOpenWindows: ({
    id: UUIDString;
    weekday: number;
    startTime: string;
    endTime: string;
  } & CourtOpenWindow_Key)[];
  courts: ({
    id: string;
    name: string;
    description: string;
    location: string;
    hourlyRate: number;
    active: boolean;
    sortOrder: number;
    imageUrl?: string | null;
    football: boolean;
  } & Court_Key)[];
  courtHolds: ({
    id: string;
    holdDate: DateString;
    startTime: string;
    endTime: string;
    source: CourtHoldSource;
    note: string;
    guestEmail: string;
    /** Lo pagado al apartar; null = se pagó todo (solo rentas manuales). */
    deposit?: number | null;
    /** Cobro de la renta en las finanzas de la liga; null si no hay (tarifa apagada o cancha sin costo). */
    rental?: HoldRentalData | null;
    court: {
      id: string;
    } & Court_Key;
    match?: {
      id: string;
      homeClub: {
        name: string;
      };
      awayClub: {
        name: string;
      };
      tournament: {
        durationMinutes: number;
        /** Inicio del torneo (o de su temporada): el partido no puede programarse antes. */
        startDate?: DateString | null;
      };
    } & Match_Key;
  } & CourtHold_Key)[];
}

/** Cobro vigente de una renta manual (league_hold_rental en 1015_fn_finance.sql). */
export interface HoldRentalData {
  chargeId: string;
  amount: number;
  /** Todo lo abonado: lo pagado al apartar más el resto. */
  paid: number;
  status: Exclude<LeagueChargeStatus, "CANCELADO">;
  /** Lo cobrado aparte de lo pagado al apartar (el resto). */
  restPaid: number;
}

export interface AdminCoverData {
  platformSettings?: {
    name: string;
    motto: string;
    headline: string;
    tagline: string;
    logoUrl?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    x?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
  };
  platformHeroImages: ({
    id: UUIDString;
    position: number;
    url: string;
  } & PlatformHeroImage_Key)[];
}

export interface AdminInboxData {
  localities: ({
    id: string;
    name: string;
  } & Locality_Key)[];
  inquiries: ({
    id: string;
    name: string;
    email: string;
    phone: string;
    topic: string;
    message: string;
    status: InquiryStatus;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
  teamApplications: ({
    id: string;
    captainName: string;
    captainEmail: string;
    captainPhone: string;
    teamName: string;
    status: TeamApplicationStatus;
    slug?: string | null;
    createdAt: TimestampString;
    club?: {
      id: string;
    } & Club_Key;
  } & TeamApplication_Key)[];
}

export interface Album_Key {
  id: string;
  __typename?: 'Album_Key';
}

export interface AmIPlatformAdminData {
  platformAdmins: ({
    email: string;
  })[];
}

export interface ApproveTeamApplicationData {
  application?: unknown | null;
}

export interface ApproveTeamApplicationVariables {
  id: string;
  clubId: string;
  slug: string;
}

export interface BootstrapPlatformAdminData {
  user_upsert: User_Key;
  admin?: unknown | null;
}

export interface BootstrapPlatformAdminVariables {
  userId: string;
  email: string;
  displayName: string;
}

export interface CategoriesData {
  categories: ({
    id: string;
    name: string;
    sortOrder: number;
  } & Category_Key)[];
}

export interface Category_Key {
  id: string;
  __typename?: 'Category_Key';
}

export interface ClaimPlatformAdminInviteData {
  ensured?: number | null;
  admin?: unknown | null;
  droppedSignup?: number | null;
  droppedInvite?: number | null;
}

export interface ClaimPlatformAdminInviteVariables {
  emailKey: string;
}

export interface ClearAdPlacementsData {
  cleared?: number | null;
}

export interface ClearAdPlacementsVariables {
  adId: string;
}

export interface ClearClubAvailabilityData {
  cleared?: number | null;
}

export interface ClearClubAvailabilityVariables {
  clubId: string;
}

export interface ClearClubHeroesData {
  cleared?: number | null;
}

export interface ClearClubHeroesVariables {
  id: string;
}

export interface ClearMatchCourtHoldsData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  cleared?: number | null;
}

export interface ClearMatchCourtHoldsVariables {
  userId?: string;
  matchId: string;
}

export interface ClearMatchEventsData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  goals?: number | null;
  cards?: number | null;
}

export interface ClearMatchEventsVariables {
  userId?: string;
  matchId: string;
}

export interface ClearSignupInviteData {
  invite?: unknown | null;
}

export interface ClearSignupInviteVariables {
  emailKey: string;
}

export interface ClubAdminGateData {
  platformAdmin?: {
    email: string;
  };
  clubMember?: {
    role: MemberRole;
  };
}

export interface ClubAdminGateVariables {
  clubId: string;
  userId: string;
}

export interface ClubAvailabilityWindow_Key {
  id: UUIDString;
  __typename?: 'ClubAvailabilityWindow_Key';
}

export interface ClubBySlugData {
  clubs: ({
    id: string;
    slug: string;
    name: string;
    description: string;
    location: string;
    presidentPhone: string;
    logoUrl?: string | null;
    active: boolean;
    locality?: {
      id: string;
      name: string;
    } & Locality_Key;
  } & Club_Key)[];
}

export interface ClubBySlugVariables {
  slug: string;
}

export interface ClubDefaultLineup_Key {
  clubId: string;
  mode: string;
  __typename?: 'ClubDefaultLineup_Key';
}

export interface ClubEventAttendee_Key {
  id: UUIDString;
  __typename?: 'ClubEventAttendee_Key';
}

export interface ClubEventCard_Key {
  id: UUIDString;
  __typename?: 'ClubEventCard_Key';
}

export interface ClubEventGoal_Key {
  id: UUIDString;
  __typename?: 'ClubEventGoal_Key';
}

export interface ClubEventGoalkeeper_Key {
  eventId: string;
  playerId: string;
  __typename?: 'ClubEventGoalkeeper_Key';
}

export interface ClubEventPhoto_Key {
  id: UUIDString;
  __typename?: 'ClubEventPhoto_Key';
}

export interface ClubEvent_Key {
  id: string;
  __typename?: 'ClubEvent_Key';
}

export interface ClubHeroImage_Key {
  id: UUIDString;
  __typename?: 'ClubHeroImage_Key';
}

export interface ClubInviteLookupData {
  clubInvites: ({
    email: string;
    role: MemberRole;
    kind: InviteKind;
    token?: string | null;
    club: {
      id: string;
      name: string;
      slug: string;
    } & Club_Key;
  })[];
}

export interface ClubInviteLookupVariables {
  clubId: string;
  emailKey: string;
  token: string;
}

export interface ClubInvite_Key {
  clubId: string;
  emailKey: string;
  __typename?: 'ClubInvite_Key';
}

export interface ClubMember_Key {
  clubId: string;
  userId: string;
  __typename?: 'ClubMember_Key';
}

export interface ClubScopedMatchesData {
  matches: ({
    id: string;
    roundLabel: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    status: MatchStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    homeClub: {
      id: string;
      name: string;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
    } & Club_Key;
    tournament: {
      id: string;
      name: string;
      season: {
        id: string;
      } & Season_Key;
      category: {
        id: string;
      } & Category_Key;
    } & Tournament_Key;
  } & Match_Key)[];
}

export interface ClubScopedMatchesVariables {
  clubId: string;
  seasonId: string;
  categoryId: string;
}

export interface ClubScreenData {
  clubs: ({
    id: string;
    slug: string;
    name: string;
    description: string;
    location: string;
    presidentPhone: string;
    logoUrl?: string | null;
    active: boolean;
    disabledReason?: string | null;
    locality?: {
      id: string;
      name: string;
    } & Locality_Key;
    clubHeroImages_on_club: ({
      url: string;
    })[];
    clubDefaultLineups_on_club: ({
      mode: string;
      formation: string;
      positions?: unknown | null;
    })[];
    players_on_club: ({
      id: string;
      name: string;
      shirtNumber: string;
      position: string;
      variant: string;
      birthDate?: DateString | null;
      imageUrl: string;
      isCoach: boolean;
      active: boolean;
      /** Eliminado (borrado lógico): se manda para nombrar su historial; no sale en plantilla ni selectores. */
      deletedAt?: TimestampString | null;
      /** Sus otros clubes actuales (0010): nombre, foto y nacimiento se comparten con ellos. */
      otherClubs_on_player: {
        id: string;
        name: string;
        slug: string;
      }[];
    } & Player_Key)[];
    clubEvents_on_club: ({
      id: string;
      eventType: EventType;
      matchType?: FriendlyMatchType | null;
      title: string;
      eventDate: DateString;
      eventTime: string;
      location: string;
      routine?: unknown | null;
      lineup?: unknown | null;
      scoreOurs?: number | null;
      scoreTheirs?: number | null;
      penaltiesOurs?: number | null;
      penaltiesTheirs?: number | null;
      mvp?: {
        id: string;
      } & Player_Key;
      clubEventAttendees_on_event: ({
        rawLabel: string;
        player?: {
          id: string;
        } & Player_Key;
      })[];
      clubEventPhotos_on_event: ({
        url: string;
      })[];
      clubEventGoals_on_event: ({
        isPenalty: boolean;
        isOwnGoal: boolean;
        scorer?: {
          id: string;
        } & Player_Key;
        assist?: {
          id: string;
        } & Player_Key;
      })[];
      clubEventCards_on_event: ({
        color: CardColor;
        player?: {
          id: string;
        } & Player_Key;
      })[];
      clubEventGoalkeepers_on_event: ({
        conceded: number;
        saves: number;
        player: {
          id: string;
        } & Player_Key;
      })[];
    } & ClubEvent_Key)[];
    transactions_on_club: ({
      id: string;
      type: TransactionType;
      description: string;
      category: string;
      amount: number;
      txnDate: DateString;
      source: TransactionSource;
      player?: {
        id: string;
      } & Player_Key;
    } & Transaction_Key)[];
    financialGoals_on_club: ({
      id: string;
      title: string;
      amount: number;
      quotaPerPlayer?: number | null;
      status: GoalStatus;
      createdAt: TimestampString;
      goalContributions_on_goal: ({
        amount: number;
        player: {
          id: string;
        } & Player_Key;
      })[];
    } & FinancialGoal_Key)[];
    inventoryItems_on_club: ({
      id: string;
      name: string;
      quantity: number;
      condition: InventoryCondition;
    } & InventoryItem_Key)[];
    albums_on_club: ({
      id: string;
      name: string;
      galleryPhotos_on_album: ({
        id: string;
        url: string;
        caption: string;
        sortOrder: number;
        takenAt: TimestampString;
      } & GalleryPhoto_Key)[];
    } & Album_Key)[];
    clubAvailabilityWindows_on_club: ({
      weekday: number;
      startTime: string;
      endTime: string;
    })[];
    clubMembers_on_club: ({
      role: MemberRole;
      user: {
        id: string;
      } & User_Key;
    })[];
  } & Club_Key)[];
  seasons: ({
    id: string;
    name: string;
    active: boolean;
    startDate?: DateString | null;
  } & Season_Key)[];
  categories: ({
    id: string;
    name: string;
    sortOrder: number;
  } & Category_Key)[];
  tournaments: ({
    id: string;
    name: string;
    status: TournamentStatus;
    legs: number;
    footballType: FootballType;
    season: {
      id: string;
    } & Season_Key;
    category: {
      id: string;
    } & Category_Key;
    tournamentPodiums_on_tournament: ({
      place: number;
      club: {
        id: string;
      } & Club_Key;
    })[];
  } & Tournament_Key)[];
  matches: ({
    id: string;
    roundLabel: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    status: MatchStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    homeClub: {
      id: string;
      name: string;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
    } & Club_Key;
    tournament: {
      id: string;
      name: string;
      season: {
        id: string;
      } & Season_Key;
      category: {
        id: string;
      } & Category_Key;
    } & Tournament_Key;
    matchClubReports_on_match: ({
      lineup?: unknown | null;
      club: {
        id: string;
      } & Club_Key;
      mvp?: ({
        id: string;
      } & Player_Key) | null;
    })[];
    matchAttendees_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      player: {
        id: string;
      } & Player_Key;
    })[];
    matchGoals_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      scorer?: {
        id: string;
      } & Player_Key;
      assist?: {
        id: string;
      } & Player_Key;
      isPenalty: boolean;
      isOwnGoal: boolean;
    })[];
    matchCards_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      color: CardColor;
      player?: {
        id: string;
      } & Player_Key;
    })[];
  } & Match_Key)[];
}

export interface ClubScreenVariables {
  slug: string;
}

export interface Club_Key {
  id: string;
  __typename?: 'Club_Key';
}

export interface ContactPageData {
  platformSettings?: {
    whatsapp?: string | null;
    courtsEnabled: boolean;
  };
}

export interface CourtBusyOnDateData {
  courtHolds: ({
    startTime: string;
    endTime: string;
    court: {
      id: string;
    } & Court_Key;
    match?: {
      id: string;
    } & Match_Key;
  })[];
}

export interface CourtBusyOnDateVariables {
  date: DateString;
}

export interface CourtHold_Key {
  id: string;
  __typename?: 'CourtHold_Key';
}

export interface CourtHoldsOnDateData {
  courtHolds: ({
    id: string;
    holdDate: DateString;
    startTime: string;
    endTime: string;
    source: CourtHoldSource;
    note: string;
    court: {
      id: string;
      name: string;
    } & Court_Key;
    match?: {
      id: string;
    } & Match_Key;
  } & CourtHold_Key)[];
}

export interface CourtHoldsOnDateVariables {
  date: DateString;
}

export interface CourtOpenWindow_Key {
  id: UUIDString;
  __typename?: 'CourtOpenWindow_Key';
}

export interface Court_Key {
  id: string;
  __typename?: 'Court_Key';
}

export interface CourtsPageData {
  platformSettings?: {
    courtsEnabled: boolean;
    courtSlotMinutes: number;
    whatsapp?: string | null;
  };
  courtOpenWindows: ({
    weekday: number;
    startTime: string;
    endTime: string;
  })[];
  courts: ({
    id: string;
    name: string;
    description: string;
    location: string;
    hourlyRate: number;
    imageUrl?: string | null;
  } & Court_Key)[];
  courtHolds: ({
    startTime: string;
    endTime: string;
    court: {
      id: string;
    } & Court_Key;
  })[];
}

export interface CourtsPageVariables {
  date: DateString;
}

export interface CreateCategoryData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  category?: unknown | null;
}

export interface CreateCategoryVariables {
  userId?: string;
  id: string;
  name: string;
  sortOrder: number;
}

export interface CreateClubData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  club?: unknown | null;
}

export interface CreateClubVariables {
  userId?: string;
  id: string;
  slug: string;
  name: string;
  localityId: string;
  location: string;
  presidentPhone: string;
  description: string;
}

export interface CreateCourtHoldData {
  courtHold?: unknown | null;
}

export interface CreateCourtHoldVariables {
  id: string;
  courtId: string;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  note: string;
}

export interface CreateLocalityData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  locality?: unknown | null;
}

export interface CreateLocalityVariables {
  userId?: string;
  id: string;
  name: string;
}

export interface CreateSeasonData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  season?: unknown | null;
}

export interface CreateSeasonVariables {
  userId?: string;
  id: string;
  name: string;
  startDate?: DateString | null;
  endDate?: DateString | null;
  active: boolean;
}

export interface CreateTournamentData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  grouped?: unknown | null;
  tournament?: unknown | null;
  prized?: unknown | null;
}

export interface CreateTournamentVariables {
  userId?: string;
  id: string;
  name: string;
  seasonId: string;
  categoryId: string;
  groupId: string;
  footballType: string;
  durationMinutes: number;
  startDate: DateString;
  prize?: string;
}

export interface DeclineClubInviteData {
  droppedSignup?: number | null;
  invite?: unknown | null;
}

export interface DeclineClubInviteVariables {
  clubId: string;
  emailKey: string;
  token: string;
}

export interface DeleteAdData {
  ad?: unknown | null;
}

export interface DeleteAdVariables {
  id: string;
}

export interface DeleteClubData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  invites?: unknown | null;
  signups?: number | null;
  club?: unknown | null;
}

export interface DeleteClubEventData {
  deleted?: number | null;
}

export interface DeleteClubEventVariables {
  id: string;
  clubId: string;
}

export interface DeleteClubVariables {
  userId?: string;
  id: string;
}

export interface DeleteCourtData {
  unlinked?: number | null;
  dropped?: number | null;
  court?: unknown | null;
}

export interface DeleteCourtHoldData {
  deleted?: number | null;
}

export interface DeleteCourtHoldVariables {
  id: string;
}

export interface DeleteCourtVariables {
  id: string;
}

export interface DeleteFinancialGoalData {
  deleted?: number | null;
}

export interface DeleteFinancialGoalVariables {
  id: string;
  clubId: string;
}

export interface DeleteGalleryAlbumData {
  deleted?: number | null;
}

export interface DeleteGalleryAlbumVariables {
  clubId: string;
  albumName: string;
}

export interface DeleteGalleryPhotoData {
  deleted?: number | null;
}

export interface DeleteGalleryPhotoVariables {
  clubId: string;
  photoId: string;
}

export interface DeleteInquiryData {
  inquiry?: unknown | null;
}

export interface DeleteInquiryVariables {
  id: string;
}

export interface DeleteInventoryItemData {
  deleted?: number | null;
}

export interface DeleteInventoryItemVariables {
  id: string;
  clubId: string;
}

export interface DeleteLiveMatchCardData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  removed?: number | null;
  match?: unknown | null;
}

export interface DeleteLiveMatchCardVariables {
  matchId: string;
  cardId: string;
}

export interface DeleteLiveMatchGoalData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  removed?: number | null;
  match?: unknown | null;
}

export interface DeleteLiveMatchGoalVariables {
  matchId: string;
  goalId: string;
}

export interface DeleteLocalityData {
  locality?: unknown | null;
}

export interface DeleteLocalityVariables {
  id: string;
}

export interface DeleteManualCourtHoldData {
  hold?: unknown | null;
}

export interface DeleteManualCourtHoldVariables {
  id: string;
  /** Qué pasa con lo pagado: true = la liga se lo queda; false = se le devolvió. Sin la clave, como el trigger. */
  keepPaid?: boolean;
}

export interface DeletePlayerData {
  deleted?: number | null;
}

export interface DeletePlayerVariables {
  id: string;
  clubId: string;
}

export interface DeleteSeasonData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  season?: unknown | null;
}

export interface DeleteSeasonVariables {
  userId?: string;
  id: string;
}

export interface DeleteTransactionData {
  deleted?: number | null;
}

export interface DeleteTransactionVariables {
  id: string;
  clubId: string;
}

export interface DeleteUnplayedMatchData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  match?: unknown | null;
}

export interface DeleteUnplayedMatchVariables {
  userId?: string;
  id: string;
}

export interface CloseTournamentData {
  tournament?: unknown | null;
  /** Partidos programados que quedaron por programar al cerrar. */
  unscheduled?: number | null;
}

export interface CloseTournamentVariables {
  id: string;
}

export interface ReopenTournamentData {
  tournament?: unknown | null;
}

export interface ReopenTournamentVariables {
  id: string;
}

export interface MarkMatchNoShowData {
  match?: unknown | null;
}

export interface MarkMatchNoShowVariables {
  id: string;
  noShow: MatchNoShow;
}

export interface ClearMatchNoShowData {
  match?: unknown | null;
}

export interface ClearMatchNoShowVariables {
  id: string;
}

export interface ResetWalkoverMatchData {
  match?: unknown | null;
}

export interface ResetWalkoverMatchVariables {
  id: string;
}

export interface SetMatchRoundData {
  match?: unknown | null;
}

export interface SetMatchRoundVariables {
  id: string;
  roundLabel: string;
  roundNumber: number;
}

export interface DeleteUnplayedTournamentData {
  children?: number | null;
  tournament?: unknown | null;
}

export interface DeleteUnplayedTournamentVariables {
  id: string;
}

export interface EmailOutbox_Key {
  id: string;
  __typename?: 'EmailOutbox_Key';
}

export interface EnsureMyProfileData {
  user_upsert: User_Key;
}

export interface EnsureMyProfileVariables {
  email: string;
  displayName: string;
}

export interface FinancialGoal_Key {
  id: string;
  __typename?: 'FinancialGoal_Key';
}

export interface FinishLiveMatchData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  tournament?: number | null;
  match?: unknown | null;
}

export interface FinishLiveMatchVariables {
  matchId: string;
}

export interface GalleryPhoto_Key {
  id: string;
  __typename?: 'GalleryPhoto_Key';
}

export interface GoalContribution_Key {
  goalId: string;
  playerId: string;
  __typename?: 'GoalContribution_Key';
}

export interface HomePageData {
  platformSettings?: {
    headline: string;
    tagline: string;
    courtsEnabled: boolean;
    whatsapp?: string | null;
  };
  platformHeroImages: ({
    url: string;
  })[];
  platformStats: ({
    tournaments?: number | null;
    clubs?: number | null;
    players?: number | null;
  })[];
  tournaments: ({
    id: string;
    name: string;
    status: TournamentStatus;
    footballType: FootballType;
    startDate?: DateString | null;
    prize: string;
    season: {
      name: string;
      startDate?: DateString | null;
    };
    category: {
      name: string;
      sortOrder: number;
    };
    tournamentClubs_on_tournament: ({
      _count: number;
    })[];
    matches_on_tournament: ({
      _count: number;
    })[];
  } & Tournament_Key)[];
  matches: ({
    id: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    homeClub: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } & Club_Key;
    court?: {
      id: string;
      name: string;
      location: string;
    } & Court_Key;
    tournament: {
      id: string;
      name: string;
      status: TournamentStatus;
      durationMinutes: number;
      startDate?: DateString | null;
      category: {
        name: string;
      };
    } & Tournament_Key;
  } & Match_Key)[];
  adPlacements: ({
    ad: {
      brand: string;
      imageUrl: string;
      href: string;
      startsOn: DateString;
      endsOn: DateString;
      status: AdStatus;
      sortOrder: number;
    };
  })[];
}

export interface HomePageVariables {
  today: DateString;
}

export interface Inquiry_Key {
  id: string;
  __typename?: 'Inquiry_Key';
}

export interface InsertClubAvailabilityData {
  window?: unknown | null;
}

export interface InsertClubAvailabilityVariables {
  clubId: string;
  windows?: unknown | null;
}

export interface InsertClubHeroData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  hero?: unknown | null;
}

export interface InsertClubHeroVariables {
  userId?: string;
  id: UUIDString;
  clubId: string;
  url: string;
}

export interface InsertClubHeroesData {
  hero?: unknown | null;
}

export interface InsertClubHeroesVariables {
  id: string;
  urls?: unknown | null;
}

export interface InsertMatchCardData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  card?: unknown | null;
}

export interface InsertMatchCardVariables {
  userId?: string;
  matchId: string;
  clubId: string;
  playerId: string;
  playerName: string;
  color: string;
  minute?: number | null;
}

export interface InsertMatchGoalData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  goal?: unknown | null;
}

export interface InsertMatchGoalVariables {
  userId?: string;
  matchId: string;
  clubId: string;
  sortOrder: number;
  scorerId: string;
  scorerName: string;
  assistId: string;
  assistName: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

export interface InsertTimedMatchGoalData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  goal?: unknown | null;
}

export interface InsertTimedMatchGoalVariables {
  matchId: string;
  clubId: string;
  sortOrder: number;
  scorerId?: string;
  assistId?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  minute?: number | null;
}

export interface InsertUnplayedMatchData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  match?: unknown | null;
}

export interface InsertUnplayedMatchVariables {
  userId?: string;
  id: string;
  tournamentId: string;
  roundLabel: string;
  roundNumber: number;
  homeClubId: string;
  awayClubId: string;
  status?: string;
  walkover: boolean;
}

export interface InventoryItem_Key {
  id: string;
  __typename?: 'InventoryItem_Key';
}

export interface LiveAdsData {
  adPlacements: ({
    placement: AdPlacementKind;
    ad: {
      id: string;
      brand: string;
      imageUrl: string;
      href: string;
      sortOrder: number;
      startsOn: DateString;
      endsOn: DateString;
    } & Ad_Key;
  })[];
}

export interface LiveAdsVariables {
  today: DateString;
  placement: AdPlacementKind;
}

export interface LiveMatchesData {
  matches: ({
    id: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    status: MatchStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    penaltiesHome?: number | null;
    penaltiesAway?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    homeClub: {
      name: string;
      logoUrl?: string | null;
    };
    awayClub: {
      name: string;
      logoUrl?: string | null;
    };
    court?: {
      name: string;
      location: string;
    };
    tournament: {
      id: string;
      name: string;
      durationMinutes: number;
      category: {
        name: string;
      };
    } & Tournament_Key;
  } & Match_Key)[];
}

export interface LiveMatchesVariables {
  from: DateString;
  to: DateString;
}

export interface Locality_Key {
  id: string;
  __typename?: 'Locality_Key';
}

export interface MarkMatchWalkoverData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  match?: unknown | null;
}

export interface MarkMatchWalkoverVariables {
  userId?: string;
  id: string;
  homeScore: number;
  awayScore: number;
  walkover: boolean;
}

export interface MatchAttendee_Key {
  matchId: string;
  clubId: string;
  playerId: string;
  __typename?: 'MatchAttendee_Key';
}

export interface MatchCard_Key {
  id: UUIDString;
  __typename?: 'MatchCard_Key';
}

export interface MatchClubReport_Key {
  matchId: string;
  clubId: string;
  __typename?: 'MatchClubReport_Key';
}

export interface MatchDetailData {
  matches: ({
    id: string;
    roundLabel: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    status: MatchStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    penaltiesHome?: number | null;
    penaltiesAway?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    court?: {
      name: string;
      imageUrl?: string | null;
      location: string;
    };
    tournament: {
      id: string;
      name: string;
      footballType: FootballType;
      durationMinutes: number;
      category: {
        name: string;
      };
    } & Tournament_Key;
    homeClub: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
      players_on_club: ({
        id: string;
        name: string;
        shirtNumber: string;
        position: string;
        imageUrl: string;
        isCoach: boolean;
        /** false = de baja o eliminado; solo viene si aparece en el partido. */
        active: boolean;
      } & Player_Key)[];
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
      players_on_club: ({
        id: string;
        name: string;
        shirtNumber: string;
        position: string;
        imageUrl: string;
        isCoach: boolean;
        /** false = de baja o eliminado; solo viene si aparece en el partido. */
        active: boolean;
      } & Player_Key)[];
    } & Club_Key;
    matchClubReports_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      lineup?: unknown | null;
      mvp?: {
        id: string;
        name: string;
      } & Player_Key;
    })[];
    matchAttendees_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      player: {
        id: string;
      } & Player_Key;
    })[];
    matchGoals_on_match: ({
      id: UUIDString;
      minute?: number | null;
      sortOrder: number;
      isPenalty: boolean;
      isOwnGoal: boolean;
      scorerName: string;
      assistName: string;
      club: {
        id: string;
      } & Club_Key;
      scorer?: {
        id: string;
        name: string;
      } & Player_Key;
      assist?: {
        id: string;
        name: string;
      } & Player_Key;
    } & MatchGoal_Key)[];
    matchCards_on_match: ({
      id: UUIDString;
      minute?: number | null;
      color: CardColor;
      playerName: string;
      club: {
        id: string;
      } & Club_Key;
      player?: {
        id: string;
        name: string;
      } & Player_Key;
    } & MatchCard_Key)[];
  } & Match_Key)[];
}

export interface MatchDetailVariables {
  id: string;
}

export interface MatchGoal_Key {
  id: UUIDString;
  __typename?: 'MatchGoal_Key';
}

export interface MatchGoalkeeper_Key {
  matchId: string;
  clubId: string;
  playerId: string;
  __typename?: 'MatchGoalkeeper_Key';
}

export interface MatchPreviewData {
  tournamentStandings: ({
    standingRank?: number | null;
    pj?: number | null;
    g?: number | null;
    e?: number | null;
    p?: number | null;
    gf?: number | null;
    gc?: number | null;
    dg?: number | null;
    pts?: number | null;
    club?: {
      id: string;
    } & Club_Key;
  })[];
  matches: ({
    id: string;
    matchDate?: DateString | null;
    homeScore?: number | null;
    awayScore?: number | null;
    penaltiesHome?: number | null;
    penaltiesAway?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    homeClub: {
      id: string;
      name: string;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
    } & Club_Key;
    tournament: {
      id: string;
      name: string;
    } & Tournament_Key;
  } & Match_Key)[];
}

export interface MatchPreviewVariables {
  tournamentId: string;
  homeClubId: string;
  awayClubId: string;
}

export interface MatchScoreSheetData {
  matches: ({
    homeScore?: number | null;
    awayScore?: number | null;
    homeClub: {
      id: string;
      name: string;
      players_on_club: ({
        id: string;
        name: string;
        /** false = de baja o eliminado; solo viene si aparece en el partido. */
        active: boolean;
      } & Player_Key)[];
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      players_on_club: ({
        id: string;
        name: string;
        /** false = de baja o eliminado; solo viene si aparece en el partido. */
        active: boolean;
      } & Player_Key)[];
    } & Club_Key;
    matchGoals_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      scorer?: {
        id: string;
      } & Player_Key;
      assist?: {
        id: string;
      } & Player_Key;
      isPenalty: boolean;
      isOwnGoal: boolean;
      minute?: number | null;
    })[];
    matchCards_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      color: CardColor;
      player?: {
        id: string;
      } & Player_Key;
      minute?: number | null;
    })[];
  })[];
}

export interface MatchScoreSheetVariables {
  matchId: string;
}

export interface MatchSlotHintsData {
  platformSettings?: {
    courtSlotMinutes: number;
  };
  courtOpenWindows: ({
    weekday: number;
    startTime: string;
    endTime: string;
  })[];
  courts: ({
    id: string;
    name: string;
    location: string;
    sortOrder: number;
  } & Court_Key)[];
  clubs: ({
    id: string;
    clubAvailabilityWindows_on_club: ({
      weekday: number;
      startTime: string;
      endTime: string;
    })[];
  } & Club_Key)[];
  courtHolds: ({
    holdDate: DateString;
    startTime: string;
    endTime: string;
    court: {
      id: string;
    } & Court_Key;
    match?: {
      id: string;
    } & Match_Key;
  })[];
  matches: ({
    id: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    homeClub: {
      id: string;
    } & Club_Key;
    awayClub: {
      id: string;
    } & Club_Key;
    tournament: {
      durationMinutes: number;
    };
  } & Match_Key)[];
}

export interface MatchSlotHintsVariables {
  homeId: string;
  awayId: string;
  from: DateString;
  until: DateString;
}

export interface MatchSummaryData {
  matches: ({
    matchGoals_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      scorerName: string;
      assistName: string;
      scorer?: {
        name: string;
      };
      assist?: {
        name: string;
      };
      isPenalty: boolean;
      isOwnGoal: boolean;
    })[];
    matchCards_on_match: ({
      club: {
        id: string;
      } & Club_Key;
      color: CardColor;
      playerName: string;
      player?: {
        name: string;
      };
    })[];
  })[];
}

export interface MatchSummaryVariables {
  matchId: string;
}

export interface Match_Key {
  id: string;
  __typename?: 'Match_Key';
}

export interface MatchesByTournamentData {
  matches: ({
    id: string;
    roundLabel: string;
    roundNumber?: number | null;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    status: MatchStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    homeClub: {
      id: string;
      name: string;
      slug: string;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      slug: string;
    } & Club_Key;
    court?: {
      id: string;
      name: string;
      location: string;
    } & Court_Key;
  } & Match_Key)[];
}

export interface MatchesByTournamentVariables {
  tournamentId: string;
}

export interface MatchesPageData {
  tournaments: ({
    id: string;
    name: string;
    category: {
      name: string;
    };
  } & Tournament_Key)[];
  matches: ({
    id: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    homeClub: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    } & Club_Key;
    court?: {
      id: string;
      name: string;
      location: string;
    } & Court_Key;
    tournament: {
      id: string;
      name: string;
      status: TournamentStatus;
      durationMinutes: number;
      startDate?: DateString | null;
      category: {
        name: string;
      };
    } & Tournament_Key;
  } & Match_Key)[];
}

export interface MyMembershipsData {
  clubMembers: ({
    role: MemberRole;
    email: string;
    club: {
      id: string;
      slug: string;
      name: string;
      logoUrl?: string | null;
    } & Club_Key;
  })[];
}

export interface MyMembershipsVariables {
  userId: string;
}

export interface MyOpenClubInvitesData {
  clubInvites: ({
    token?: string | null;
    role: MemberRole;
    club: {
      id: string;
      slug: string;
      name: string;
      logoUrl?: string | null;
    } & Club_Key;
  })[];
}

export interface MyOpenClubInvitesVariables {
  emailKey: string;
}

export interface MyPlatformAdminInviteData {
  platformAdminInvite?: {
    email: string;
  };
}

export interface MyPlatformAdminInviteVariables {
  emailKey: string;
}

export interface MySpacesData {
  clubMembers: ({
    role: MemberRole;
    club: {
      id: string;
      slug: string;
      name: string;
      logoUrl?: string | null;
    } & Club_Key;
  })[];
}

export interface PlatformAdminByIdData {
  platformAdmin?: {
    email: string;
  };
}

export interface PlatformAdminByIdVariables {
  id: string;
}

export interface PlatformAdminInvite_Key {
  emailKey: string;
  __typename?: 'PlatformAdminInvite_Key';
}

export interface PlatformAdmin_Key {
  userId: string;
  __typename?: 'PlatformAdmin_Key';
}

export interface PlatformBannerData {
  platformSettings?: {
    headline: string;
    tagline: string;
  };
  platformHeroImages: ({
    url: string;
  })[];
}

export interface PlatformChromeData {
  platformSettings?: {
    name: string;
    motto: string;
    logoUrl?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    x?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
    courtsEnabled: boolean;
  };
}

export interface PlatformClaimOpenData {
  platformClaimStates: ({
    open?: boolean | null;
  })[];
}

export interface PlatformHeroImage_Key {
  id: UUIDString;
  __typename?: 'PlatformHeroImage_Key';
}

export interface PlatformSettings_Key {
  id: string;
  __typename?: 'PlatformSettings_Key';
}

export interface PlayerContributionTotalsData {
  playerContributionTotals: ({
    total?: number | null;
    player?: {
      id: string;
      name: string;
    } & Player_Key;
  })[];
}

export interface PlayerContributionTotalsVariables {
  clubId: string;
}

export interface Player_Key {
  id: string;
  __typename?: 'Player_Key';
}

export interface PromoteGalleryPhotoData {
  photo?: unknown | null;
}

export interface PromoteGalleryPhotoVariables {
  clubId: string;
  photoId: string;
}

export interface RegisterTeamPageData {
  clubs: ({
    name: string;
    slug: string;
    logoUrl?: string | null;
    location: string;
    presidentPhone: string;
    locality?: {
      name: string;
    };
  })[];
}

export interface RejectTeamApplicationData {
  application?: unknown | null;
}

export interface RejectTeamApplicationVariables {
  id: string;
}

export interface RemoveClubInviteData {
  invite?: unknown | null;
}

export interface RemoveClubInviteVariables {
  clubId: string;
  emailKey: string;
}

export interface RemoveClubMemberData {
  member?: unknown | null;
}

export interface RemoveClubMemberVariables {
  clubId: string;
  userId: string;
}

export interface RemovePlatformAdminData {
  admin?: unknown | null;
}

export interface RemovePlatformAdminInviteData {
  droppedSignup?: number | null;
  invite?: unknown | null;
}

export interface RemovePlatformAdminInviteVariables {
  emailKey: string;
}

export interface RemovePlatformAdminVariables {
  userId: string;
}

export interface RemoveTournamentClubData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  row?: unknown | null;
}

export interface RemoveTournamentClubVariables {
  userId?: string;
  tournamentId: string;
  clubId: string;
}

export interface ReplaceClubEventAlbumData {
  cleared?: number | null;
  added?: number | null;
  event?: unknown | null;
}

export interface ReplaceClubEventAlbumVariables {
  id: string;
  clubId: string;
  urls?: unknown | null;
}

export interface ReplaceClubEventAttendeesData {
  cleared?: number | null;
  added?: number | null;
  event?: unknown | null;
}

export interface ReplaceClubEventAttendeesVariables {
  id: string;
  clubId: string;
  labels?: unknown | null;
}

export interface ReplaceClubEventStatsData {
  cleared?: number | null;
  added?: number | null;
  event?: unknown | null;
}

export interface ReplaceClubEventStatsVariables {
  id: string;
  clubId: string;
  stats?: unknown | null;
}

export interface ReplaceHeroImagesData {
  images?: unknown | null;
}

export interface ReplaceHeroImagesVariables {
  urls: string;
}

export interface ReplaceMatchAttendeesData {
  cleared?: number | null;
  added?: number | null;
  report?: unknown | null;
}

export interface ReplaceMatchAttendeesVariables {
  matchId: string;
  clubId: string;
  labels?: unknown | null;
}

export interface RequestThrottle_Key {
  id: string;
  __typename?: 'RequestThrottle_Key';
}

export interface SaveAdData {
  ad?: unknown | null;
}

export interface SaveAdPlacementData {
  placement?: unknown | null;
}

export interface SaveAdPlacementVariables {
  adId: string;
  placement: string;
}

export interface SaveAdVariables {
  id: string;
  brand: string;
  imageUrl: string;
  href: string;
  startsOn: DateString;
  endsOn: DateString;
  status: string;
  sortOrder: number;
  price?: number;
  advertiserName?: string;
  advertiserContact?: string;
}

export interface SaveClubDefaultLineupData {
  lineup?: unknown | null;
}

export interface SaveClubDefaultLineupVariables {
  clubId: string;
  mode: string;
  lineup?: unknown | null;
}

export interface SaveClubEventData {
  event?: unknown | null;
}

export interface SaveClubEventVariables {
  id: string;
  clubId: string;
  eventType: string;
  matchType?: string | null;
  title: string;
  eventDate: DateString;
  eventTime: string;
  detail?: unknown | null;
}

export interface SaveClubInviteData {
  invite?: unknown | null;
}

export interface SaveClubInviteVariables {
  clubId: string;
  emailKey: string;
  email: string;
  role: string;
  token: string;
  kind: string;
}

export interface SaveClubPortadaData {
  club?: unknown | null;
}

export interface SaveClubPortadaVariables {
  id: string;
  name: string;
  description: string;
  location: string;
}

export interface SaveClubProfileData {
  club?: unknown | null;
}

export interface SaveClubProfileVariables {
  id: string;
  name: string;
  logoUrl: string;
  presidentPhone: string;
}

export interface SaveCourtData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  court?: unknown | null;
}

export interface SaveCourtHoldData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  saved?: number | null;
  race?: number | null;
  /** La renta guardada con su cobro ya calculado. */
  hold?: { id: string; rental?: HoldRentalData | null } | null;
}

export interface SaveCourtHoldVariables {
  userId?: string;
  id: string;
  courtId: string;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  note: string;
  guestEmail?: string;
  /** Lo pagado al apartar (mayor que 0); null = se pagó todo; sin la clave, una edición conserva el que tenía. */
  deposit?: number | null;
  fresh?: boolean;
}

/** Renta manual que queda fuera del horario nuevo (save_court_module). */
export interface CourtHoldOutside {
  id: string;
  courtName: string;
  hourlyRate: number;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  note: string;
  guestEmail?: string | null;
  /** Lo que ya se pagó de la renta: al quitarla, su cobro se anula. */
  paid?: number;
}

/** Partido programado cuyo apartado de cancha queda fuera del horario nuevo (save_court_module). */
export interface MatchOutside {
  matchId: string;
  courtName: string;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  homeClub: string;
  awayClub: string;
  tournamentName: string;
}

export interface SaveCourtModuleData {
  saved?: {
    id: string;
  } | null;
  /** Sin `force`: las rentas que impiden guardar. */
  conflicts: CourtHoldOutside[];
  /** Sin `force`: los partidos programados que impiden guardar. */
  matchConflicts: MatchOutside[];
  /** Con `force`: las rentas eliminadas, para avisar por correo. */
  removed: CourtHoldOutside[];
  /** Con `force`: los partidos que quedaron por programar, para avisar a los clubes. */
  unscheduledMatches: MatchOutside[];
}

export interface SaveCourtModuleVariables {
  enabled: boolean;
  slotMinutes: number;
  windows: {
    weekday: number;
    startTime: string;
    endTime: string;
  }[];
  force?: boolean;
}

export interface SaveCourtVariables {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  football: boolean;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  location?: string;
}

export interface SaveFinancialGoalData {
  goal?: unknown | null;
}

export interface SaveFinancialGoalVariables {
  id: string;
  clubId: string;
  title: string;
  amount: number;
  quotaPerPlayer?: number | null;
}

export interface SaveGalleryPhotoData {
  album?: number | null;
  photo?: unknown | null;
}

export interface SaveGalleryPhotoVariables {
  albumId: string;
  clubId: string;
  albumName: string;
  photoId: string;
  url: string;
  caption: string;
  takenAt: TimestampString;
}

export interface SaveInventoryItemData {
  item?: unknown | null;
}

export interface SaveInventoryItemVariables {
  id: string;
  clubId: string;
  name: string;
  quantity: number;
  condition: string;
}

export interface SaveMatchCourtHoldData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  courtHold?: unknown | null;
}

export interface SaveMatchCourtHoldVariables {
  userId?: string;
  id: string;
  courtId: string;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  matchId: string;
}

export interface SaveMatchScoreData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  match?: unknown | null;
}

export interface SaveMatchScoreVariables {
  userId?: string;
  id: string;
  homeScore: number;
  awayScore: number;
  walkover?: boolean;
}

export interface SavePlatformAdminInviteData {
  invite?: unknown | null;
}

export interface SavePlatformAdminInviteVariables {
  emailKey: string;
  email: string;
}

export interface SavePlatformCoverData {
  settings?: unknown | null;
}

export interface SavePlatformCoverVariables {
  headline: string;
  tagline: string;
}

export interface SavePlatformHeaderData {
  settings?: unknown | null;
}

export interface SavePlatformHeaderVariables {
  name: string;
  motto: string;
  logoUrl: string;
}

export interface SavePlatformSocialData {
  settings?: unknown | null;
}

export interface SavePlatformSocialVariables {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  whatsapp: string;
}

/**
 * Aviso (0010): otro club con el que el jugador ya juega un torneo en curso que comparte con este club. No bloquea
 * nada; si anota con los dos, cuenta para cada club.
 */
export interface PlayerTournamentConflict {
  clubName: string;
  tournamentName: string;
}

export interface SavePlayerData {
  player?: unknown | null;
  /** Aviso al reactivar a alguien de baja; viene junto al jugador guardado. */
  conflict?: PlayerTournamentConflict | null;
}

export interface AddExistingPlayerData {
  player?: unknown | null;
  /** 'ALREADY' si ya está vivo en la plantilla (player null). */
  reason?: "ALREADY" | null;
  /** Aviso; viene junto al jugador fichado. */
  conflict?: PlayerTournamentConflict | null;
}

export interface AddExistingPlayerVariables {
  clubId: string;
  playerId: string;
  shirtNumber: string;
  position: string;
  variant?: string | null;
}

/** Jugador de la liga encontrado por nombre para sumarlo a la plantilla (search_players). */
export interface SearchPlayerHit {
  id: string;
  name: string;
  imageUrl: string;
  birthDate?: DateString | null;
  /** 'DELETED' si fue eliminado de este club: agregarlo lo restaura con su historial. */
  inThisClub?: "DELETED" | null;
  /** Aviso antes de agregarlo: ya juega con otro club un torneo en curso de este club. */
  conflict?: PlayerTournamentConflict | null;
  /** Clubes donde está hoy (no eliminado); active false = de baja temporal ahí. */
  clubs_on_player: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    active: boolean;
  }[];
}

export interface SearchPlayersData {
  players: SearchPlayerHit[];
}

export interface SearchPlayersVariables {
  clubId: string;
  q: string;
}

/** Contadores de la ficha del jugador (player_profile): solo partidos oficiales jugados, sin walkovers. */
export interface PlayerProfileCounts {
  matches: number;
  goals: number;
  assists: number;
  penalties: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  mvps: number;
}

/** Club de la ficha: ACTIVE, INACTIVE (de baja) o FORMER (eliminado de la plantilla). No trae clubes borrados. */
export interface PlayerProfileClub {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  shirtNumber: string;
  position: string;
  isCoach: boolean;
  status: "ACTIVE" | "INACTIVE" | "FORMER";
  since: TimestampString;
}

/** Números de un jugador en un torneo con un club (un torneo con dos clubes son dos filas). */
export interface PlayerProfileStatLine extends PlayerProfileCounts {
  season: { id: string; name: string; active: boolean; startDate?: DateString | null };
  tournament: { id: string; name: string; status: TournamentStatus; category?: { name: string } | null };
  /** slug null si el club fue borrado: sus números se conservan sin enlace. */
  club: { id: string; name: string; slug?: string | null; logoUrl?: string | null };
}

/** Ficha pública del jugador: la edad, nunca la fecha de nacimiento. */
export interface PlayerProfileData {
  player: {
    id: string;
    name: string;
    imageUrl: string;
    age?: number | null;
    clubs_on_player: PlayerProfileClub[];
    totals: PlayerProfileCounts;
    statLines: PlayerProfileStatLine[];
  } | null;
}

export interface PlayerProfileVariables {
  id: string;
}

/** Jugador del buscador de /admin (admin_search_players). */
export interface AdminPlayerHit {
  id: string;
  name: string;
  imageUrl: string;
  birthDate?: DateString | null;
  createdAt: TimestampString;
  /** Clubes donde está hoy (no eliminado); active false = de baja ahí. Vacío = jugador libre. */
  clubs_on_player: { id: string; name: string; slug: string; logoUrl?: string | null; active: boolean }[];
}

export interface AdminSearchPlayersData {
  players: AdminPlayerHit[];
}

export interface AdminSearchPlayersVariables {
  /** Letras, 3 a 50; vacío trae los 30 más recientes. */
  q?: string | null;
  /** Solo jugadores sin club. */
  free?: boolean | null;
}

/** Ficha de un club en el detalle de /admin, también eliminadas y de clubes borrados. */
export interface AdminPlayerMembership {
  club: { id: string; name: string; slug: string; logoUrl?: string | null; deleted: boolean };
  shirtNumber: string;
  position: string;
  variant: string;
  isCoach: boolean;
  active: boolean;
  deletedAt?: TimestampString | null;
  createdAt: TimestampString;
}

export interface AdminPlayerData {
  player: {
    id: string;
    name: string;
    birthDate?: DateString | null;
    imageUrl: string;
    createdAt: TimestampString;
    clubPlayers_on_player: AdminPlayerMembership[];
  } | null;
}

export interface AdminPlayerVariables {
  id: string;
}

export interface AdminSavePlayerData {
  player?: { id: string; name: string } | null;
}

/** Datos de la persona; clubId (con dorsal, posición y variante) solo al crear. */
export interface AdminSavePlayerVariables {
  id: string;
  name: string;
  birthDate: string;
  imageUrl: string;
  clubId?: string | null;
  shirtNumber?: string | null;
  position?: string | null;
  variant?: string | null;
}

export interface AdminMergePlayersData {
  merged?: {
    id: string;
    name: string;
    /** Foto del origen que ya no usa nadie: el cliente la borra de Storage. */
    orphanImageUrl?: string | null;
    moved: {
      clubs: number;
      attendees: number;
      goals: number;
      assists: number;
      cards: number;
      mvps: number;
      lineups: number;
      eventFacts: number;
      contributions: number;
      transactions: number;
    };
  } | null;
}

export interface AdminMergePlayersVariables {
  /** El duplicado: sus datos pasan a targetId y se borra. */
  sourceId: string;
  targetId: string;
}

export interface SavePlayerVariables {
  id: string;
  clubId: string;
  name: string;
  shirtNumber: string;
  position: string;
  isCoach?: boolean | null;
  active?: boolean | null;
  detail?: unknown | null;
}

export interface SaveSignupInviteData {
  invite?: unknown | null;
}

export interface SaveSignupInviteVariables {
  emailKey: string;
  email: string;
  clubId?: string | null;
  platform: boolean;
}

export interface ScheduleCourtsData {
  courts: ({
    id: string;
    name: string;
  } & Court_Key)[];
}

export interface ScheduleOfficialMatchData {
  match?: unknown | null;
}

export interface ScheduleOfficialMatchVariables {
  id: string;
  matchDate: DateString;
  startTime: string;
  venue: string;
  courtId?: string | null;
}

export interface SearchAdminClubsData {
  clubs?: unknown[] | null;
}

export interface SearchAdminClubsVariables {
  term: string;
}

export interface SearchClubsData {
  clubs?: unknown[] | null;
}

export interface SearchClubsVariables {
  term: string;
}

export interface SeasonSummaryClub {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface SeasonSummaryPlayerAward {
  playerName: string;
  value: number;
  player?: { id: string; imageUrl: string } | null;
  club?: { id: string; name: string; logoUrl?: string | null } | null;
}

export interface SeasonSummaryKeeperAward {
  playerName: string;
  matches: number;
  conceded: number;
  saves: number;
  player: { id: string; imageUrl: string };
  club?: { id: string; name: string; logoUrl?: string | null } | null;
}

export interface SeasonSummaryMatch {
  id: string;
  matchDate?: DateString | null;
  homeScore: number;
  awayScore: number;
  tournament: { name: string };
  homeClub: SeasonSummaryClub;
  awayClub: SeasonSummaryClub;
}

export interface SeasonSummaryData {
  season: {
    id: string;
    name: string;
    startDate?: DateString | null;
    endDate?: DateString | null;
    tournaments: ({
      id: string;
      name: string;
      prize: string;
      category?: { name: string } | null;
      podium: ({ place: number; club: SeasonSummaryClub })[];
    })[];
    totals: {
      tournaments: number;
      clubs: number;
      matches: number;
      goals: number;
      walkovers: number;
      shootouts: number;
      yellowCards: number;
      redCards: number;
    };
    awards: {
      scorers: SeasonSummaryPlayerAward[];
      assists: SeasonSummaryPlayerAward[];
      mvps: SeasonSummaryPlayerAward[];
      keepers: SeasonSummaryKeeperAward[];
    };
    records: {
      biggestWin?: SeasonSummaryMatch | null;
      highestScoring?: SeasonSummaryMatch | null;
      topAttack?: { matches: number; goals: number; club: SeasonSummaryClub } | null;
      bestDefense?: { matches: number; conceded: number; club: SeasonSummaryClub } | null;
      fairPlay?: { matches: number; yellow: number; red: number; club: SeasonSummaryClub } | null;
      mostCards?: { matches: number; yellow: number; red: number; club: SeasonSummaryClub } | null;
    };
  } | null;
}

export interface SeasonSummaryVariables {
  id: string;
}

export interface Season_Key {
  id: string;
  __typename?: 'Season_Key';
}

export interface SeasonsData {
  seasons: ({
    id: string;
    name: string;
    startDate?: DateString | null;
    endDate?: DateString | null;
    active: boolean;
  } & Season_Key)[];
}

export interface SetAdOrderData {
  ad?: unknown | null;
}

export interface SetAdOrderVariables {
  ids: string;
}

export interface SetAdStatusData {
  ad?: unknown | null;
}

export interface SetAdStatusVariables {
  id: string;
  status: string;
}

export interface SetClubActiveData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  club?: unknown | null;
}

export interface SetClubActiveVariables {
  userId?: string;
  id: string;
  active: boolean;
  reason?: string;
}

export interface SetClubEventLineupData {
  event?: unknown | null;
}

export interface SetClubEventLineupVariables {
  id: string;
  clubId: string;
  lineup?: unknown | null;
}

export interface SetClubEventScoreData {
  event?: unknown | null;
}

export interface SetClubEventScoreVariables {
  id: string;
  clubId: string;
  scoreOurs?: number | null;
  scoreTheirs?: number | null;
  penaltiesOurs?: number | null;
  penaltiesTheirs?: number | null;
}

export interface SetClubMemberRoleData {
  member?: unknown | null;
}

export interface SetClubMemberRoleVariables {
  clubId: string;
  userId: string;
  role: string;
}

export interface SetFinancialGoalStatusData {
  goal?: unknown | null;
}

export interface SetFinancialGoalStatusVariables {
  id: string;
  clubId: string;
  status: string;
}

export interface SetGoalContributionData {
  contribution?: unknown | null;
}

export interface SetGoalContributionVariables {
  goalId: string;
  playerId: string;
  amount: number;
}

export interface SetInquiryDoneData {
  inquiry?: unknown | null;
}

export interface SetInquiryDoneVariables {
  id: string;
}

export interface SetMatchClubLineupData {
  report?: unknown | null;
}

export interface SetMatchClubLineupVariables {
  matchId: string;
  clubId: string;
  lineup?: unknown | null;
  /** Jugador del partido por el club (de su plantilla). Si falta, se conserva el guardado. */
  mvpId?: string | null;
}

export interface SetSeasonActiveData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  season?: unknown | null;
  /** Torneos sin finalizar en la temporada; si hay y no se forzó, `season` viene null. */
  openTournaments?: number | null;
  /** Torneos que se cerraron al forzar. */
  closedTournaments?: number | null;
}

export interface SetSeasonActiveVariables {
  userId?: string;
  id: string;
  active: boolean;
  /** Cierra también los torneos abiertos de la temporada. */
  force?: boolean;
}

export interface SignupInviteByEmailData {
  signupInvite?: {
    email: string;
    platform: boolean;
    club?: {
      id: string;
    } & Club_Key;
  };
}

export interface SignupInviteByEmailVariables {
  emailKey: string;
}

export interface SignupInvite_Key {
  emailKey: string;
  __typename?: 'SignupInvite_Key';
}

export interface SubmitInquiryData {
  inquiry?: unknown | null;
}

export interface SubmitInquiryVariables {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

export interface SubmitTeamApplicationData {
  application?: unknown | null;
}

export interface SubmitTeamApplicationVariables {
  id: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  teamName: string;
}

export interface SwapGalleryPhotosData {
  swapped?: number | null;
}

export interface SwapGalleryPhotosVariables {
  clubId: string;
  firstId: string;
  secondId: string;
}

export interface TeamApplication_Key {
  id: string;
  __typename?: 'TeamApplication_Key';
}

export interface TeamsPageData {
  clubs: ({
    name: string;
    slug: string;
    logoUrl?: string | null;
    location: string;
    presidentPhone: string;
    locality?: {
      name: string;
    };
  })[];
  seasons: ({
    id: string;
    name: string;
    active: boolean;
    startDate?: DateString | null;
  } & Season_Key)[];
  categories: ({
    id: string;
    name: string;
    sortOrder: number;
  } & Category_Key)[];
  tournaments: ({
    season: {
      id: string;
    } & Season_Key;
    category: {
      id: string;
    } & Category_Key;
    tournamentClubs_on_tournament: ({
      club: {
        name: string;
        slug: string;
      };
    })[];
  })[];
  matches: ({
    homeScore?: number | null;
    awayScore?: number | null;
    homeClub: {
      name: string;
      slug: string;
    };
    awayClub: {
      name: string;
      slug: string;
    };
    tournament: {
      season: {
        id: string;
      } & Season_Key;
      category: {
        id: string;
      } & Category_Key;
    };
  })[];
}

export interface TournamentArchiveData {
  tournaments: ({
    id: string;
    name: string;
    status: TournamentStatus;
    footballType: FootballType;
    startDate?: DateString | null;
    prize: string;
    season: {
      name: string;
      active: boolean;
      startDate?: DateString | null;
    };
    category: {
      name: string;
      sortOrder: number;
    };
    tournamentClubs_on_tournament: ({
      _count: number;
    })[];
    matches_on_tournament: ({
      _count: number;
    })[];
  } & Tournament_Key)[];
  platformSettings?: {
    whatsapp?: string | null;
  };
}

export interface TournamentClub_Key {
  tournamentId: string;
  clubId: string;
  __typename?: 'TournamentClub_Key';
}

export interface TournamentEditorData {
  tournaments: ({
    id: string;
    name: string;
    legs: number;
    footballType: FootballType;
    durationMinutes: number;
    startDate?: DateString | null;
    prize: string;
    season: {
      id: string;
      startDate?: DateString | null;
      endDate?: DateString | null;
    } & Season_Key;
    category: {
      name: string;
    };
    tournamentClubs_on_tournament: ({
      club: {
        id: string;
      } & Club_Key;
    })[];
  } & Tournament_Key)[];
  clubs: ({
    id: string;
    name: string;
    active: boolean;
  } & Club_Key)[];
  matches: ({
    id: string;
    status: MatchStatus;
    matchDate?: DateString | null;
    startTime?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    roundLabel: string;
    homeClub: {
      id: string;
    } & Club_Key;
    awayClub: {
      id: string;
    } & Club_Key;
  } & Match_Key)[];
}

export interface TournamentEditorVariables {
  id: string;
}

export interface TournamentGroup_Key {
  id: string;
  __typename?: 'TournamentGroup_Key';
}

export interface TournamentNotice_Key {
  tournamentId: string;
  clubId: string;
  __typename?: 'TournamentNotice_Key';
}

export interface TournamentPodium_Key {
  tournamentId: string;
  place: number;
  __typename?: 'TournamentPodium_Key';
}

export interface TournamentScorersData {
  tournamentScorers: ({
    playerName?: string | null;
    goals?: number | null;
    assists?: number | null;
    club?: {
      id: string;
      name: string;
    } & Club_Key;
    player?: {
      id: string;
      name: string;
    } & Player_Key;
  })[];
}

export interface TournamentScorersVariables {
  tournamentId: string;
}

export interface TournamentScreenData {
  tournaments: ({
    name: string;
    status: TournamentStatus;
    footballType: FootballType;
    startDate?: DateString | null;
    durationMinutes: number;
    prize: string;
    season: {
      name: string;
      active: boolean;
      startDate?: DateString | null;
    };
    category: {
      name: string;
    };
    tournamentPodiums_on_tournament: ({
      place: number;
      club: {
        name: string;
        slug: string;
        logoUrl?: string | null;
      };
    })[];
  })[];
  matches: ({
    id: string;
    roundLabel: string;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue: string;
    status: MatchStatus;
    homeScore?: number | null;
    awayScore?: number | null;
    penaltiesHome?: number | null;
    penaltiesAway?: number | null;
    walkover: boolean;
    noShow?: MatchNoShow | null;
    homeClub: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    } & Club_Key;
    court?: {
      id: string;
      name: string;
      location: string;
    } & Court_Key;
  } & Match_Key)[];
  tournamentStandings: ({
    standingRank?: number | null;
    pj?: number | null;
    g?: number | null;
    e?: number | null;
    p?: number | null;
    gf?: number | null;
    gc?: number | null;
    dg?: number | null;
    pts?: number | null;
    club?: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    } & Club_Key;
  })[];
  tournamentScorers: ({
    playerName?: string | null;
    goals?: number | null;
    assists?: number | null;
    player?: {
      id: string;
      imageUrl: string;
    } & Player_Key;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } & Club_Key;
  })[];
}

export interface TournamentScreenVariables {
  id: string;
}

export interface TournamentStandingsData {
  tournamentStandings: ({
    standingRank?: number | null;
    pj?: number | null;
    g?: number | null;
    e?: number | null;
    p?: number | null;
    gf?: number | null;
    gc?: number | null;
    dg?: number | null;
    pts?: number | null;
    club?: {
      id: string;
      name: string;
      slug: string;
    } & Club_Key;
  })[];
}

export interface TournamentStandingsVariables {
  tournamentId: string;
}

export interface Tournament_Key {
  id: string;
  __typename?: 'Tournament_Key';
}

export interface TournamentsBySeasonData {
  tournaments: ({
    id: string;
    name: string;
    status: TournamentStatus;
    legs: number;
    footballType: FootballType;
    durationMinutes: number;
    startDate?: DateString | null;
    season: {
      id: string;
      name: string;
    } & Season_Key;
    category: {
      id: string;
      name: string;
      sortOrder: number;
    } & Category_Key;
  } & Tournament_Key)[];
}

export interface TournamentsBySeasonVariables {
  seasonId: string;
}

export interface Transaction_Key {
  id: string;
  __typename?: 'Transaction_Key';
}

export interface UpcomingMatchesData {
  matchListings: ({
    startsAt?: string | null;
    matchDate?: DateString | null;
    startTime?: string | null;
    venue?: string | null;
    homeClub?: {
      id: string;
      name: string;
      slug: string;
    } & Club_Key;
    awayClub?: {
      id: string;
      name: string;
      slug: string;
    } & Club_Key;
    tournament?: {
      id: string;
      name: string;
    } & Tournament_Key;
    category?: {
      id: string;
      name: string;
    } & Category_Key;
    match?: {
      id: string;
    } & Match_Key;
  })[];
}

export interface UpcomingMatchesVariables {
  from: string;
  limit: number;
}

export interface UpdateTournamentSettingsData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  tournament?: unknown | null;
  /** Partidos que quedaron por programar al cambiar la duración o la fecha de inicio. */
  unscheduled?: number | null;
}

export interface UpdateTournamentSettingsVariables {
  userId?: string;
  id: string;
  legs: number;
  footballType: string;
  durationMinutes: number;
  startDate?: DateString | null;
  prize?: string | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

// ---- Finanzas de la liga (db/migrations/1015_fn_finance.sql) ----

export type LeagueFeeKind =
  | "CLUB_REGISTRATION" | "CLUB_PAGE" | "SEASON_ENROLLMENT" | "TOURNAMENT_ENROLLMENT" | "DEPOSIT"
  | "MATCH_REFEREE" | "MATCH_COURT" | "COURT_RENTAL"
  | "CARD_YELLOW" | "CARD_RED" | "WALKOVER" | "PROTEST" | "RESCHEDULE"
  | "PLAYER_CARD" | "LATE_SIGNING"
  | "AD" | "SPONSORSHIP"
  | "OTHER";
export type LeagueChargeStatus = "PENDIENTE" | "PARCIAL" | "PAGADO" | "CONDONADO" | "CANCELADO";
export type LeaguePaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "OTRO";
export type LeagueExpenseCategory =
  | "ARBITROS" | "PREMIOS" | "MANTENIMIENTO" | "SERVICIOS" | "MATERIAL" | "SERVIDOR" | "PUBLICIDAD" | "OTRO"
  | "DEVOLUCION" | "DANOS";
export type LeagueFeePeriod = "ONCE" | "MONTH" | "SEASON";
export type LeagueSplitMode = "EACH" | "HALF";
export type LeagueSummaryScope = "TOTAL" | "YEAR" | "MONTH" | "SEASON" | "TOURNAMENT";

export interface LeagueFee {
  kind: LeagueFeeKind;
  enabled: boolean;
  amount: number;
  period: LeagueFeePeriod;
  splitMode: LeagueSplitMode;
  includesRegistration: boolean;
}

export interface AdminFinanceSetupVariables {
  seasonId?: string | null;
}

export interface AdminFinanceSetupData {
  seasonId: string | null;
  seasons: { id: string; name: string; active: boolean; startDate?: DateString | null; endDate?: DateString | null }[];
  tournaments: { id: string; name: string; seasonId: string }[];
  clubs: { id: string; name: string; active: boolean }[];
  fees: LeagueFee[];
}

export interface LeaguePayment {
  id: string;
  amount: number;
  paidOn: DateString;
  method: LeaguePaymentMethod;
  note: string;
}

export interface LeagueCharge {
  id: string;
  kind: LeagueFeeKind;
  status: LeagueChargeStatus;
  concept: string;
  amount: number;
  paid: number;
  balance: number;
  chargedOn: DateString;
  dueDate?: DateString | null;
  club?: { id: string; name: string } | null;
  payerName: string;
  payerContact: string;
  seasonId?: string | null;
  tournament?: { id: string; name: string } | null;
  matchId?: string | null;
  note?: string;
  automatic?: boolean;
  createdAt: TimestampString;
  payments: LeaguePayment[];
}

export interface AdminLeagueChargesVariables {
  seasonId?: string | null;
  tournamentId?: string | null;
  clubId?: string | null;
  status?: LeagueChargeStatus | null;
  kind?: LeagueFeeKind | null;
}

export interface AdminLeagueChargesData {
  charges: LeagueCharge[];
}

export interface LeagueExpense {
  id: string;
  category: LeagueExpenseCategory;
  description: string;
  amount: number;
  spentOn: DateString;
  seasonId?: string | null;
  tournament?: { id: string; name: string } | null;
  chargeId?: string | null;
}

export interface AdminLeagueExpensesVariables {
  seasonId?: string | null;
  tournamentId?: string | null;
}

export interface AdminLeagueExpensesData {
  expenses: LeagueExpense[];
}

export interface AdminFinanceSummaryVariables {
  scope: LeagueSummaryScope;
  year?: number;
  month?: number;
  seasonId?: string;
  tournamentId?: string;
}

export interface LeagueSummaryTotals {
  generated: number;
  collected: number;
  pending: number;
  condoned: number;
  expenses: number;
  refunds: number;
  damages: number;
  losses: number;
  result: number;
}

export interface AdminFinanceSummaryData {
  summary: LeagueSummaryTotals | null;
  byKind?: { kind: LeagueFeeKind; generated: number; collected: number; pending: number }[];
  byCategory?: { category: LeagueExpenseCategory; amount: number }[];
  series?: { key: string; label: string; generated: number; collected: number; expenses: number; losses: number }[];
  /** Cada registro del periodo (hasta 300, los más recientes primero). */
  charges?: LeagueCharge[];
  debtors?: { club: { id: string; name: string }; pending: number; charges: number }[];
}

export interface SaveLeagueFeeVariables {
  seasonId: string;
  kind: LeagueFeeKind;
  enabled: boolean;
  amount: number;
  period?: LeagueFeePeriod;
  splitMode?: LeagueSplitMode;
  includesRegistration?: boolean;
}

export interface SaveLeagueFeeData {
  fee?: { kind: LeagueFeeKind } | null;
  /** Cobros registrados de lo que ya pasó en la temporada al guardar. */
  created?: number | null;
}

export interface CreateLeagueChargeVariables {
  id: string;
  kind: LeagueFeeKind;
  clubId?: string | null;
  payerName?: string | null;
  payerContact?: string | null;
  concept: string;
  amount: number;
  chargedOn: string;
  dueDate?: string | null;
  seasonId?: string | null;
  tournamentId?: string | null;
}

export interface CreateLeagueChargeData {
  charge?: { id: string } | null;
}

export interface SetLeagueChargeStatusVariables {
  id: string;
  action: "CONDONAR" | "CANCELAR" | "REACTIVAR";
  note?: string;
}

export interface SetLeagueChargeStatusData {
  charge?: { id: string; status: LeagueChargeStatus } | null;
}

export interface SetLeagueChargePaidVariables {
  id: string;
  paid: boolean;
}

export interface SetLeagueChargePaidData {
  charge?: { id: string; status: LeagueChargeStatus } | null;
}

export interface AddLeaguePaymentVariables {
  id: string;
  chargeId: string;
  amount: number;
  paidOn: string;
  method: LeaguePaymentMethod;
  note?: string;
}

export interface AddLeaguePaymentData {
  payment?: { id: string } | null;
  charge?: { id: string; status: LeagueChargeStatus } | null;
}

export interface DeleteLeaguePaymentVariables {
  id: string;
}

export interface DeleteLeaguePaymentData {
  deleted?: number | null;
}

export interface SaveLeagueExpenseVariables {
  id: string;
  category: LeagueExpenseCategory;
  description: string;
  amount: number;
  spentOn: string;
  seasonId?: string | null;
  tournamentId?: string | null;
  chargeId?: string | null;
}

export interface SaveLeagueExpenseData {
  expense?: { id: string } | null;
}

export interface DeleteLeagueExpenseVariables {
  id: string;
}

export interface DeleteLeagueExpenseData {
  deleted?: number | null;
}

export interface ClubLeagueAccountVariables {
  clubId: string;
}

export interface ClubLeagueAccountData {
  account: {
    pending: number;
    paid: number;
    charges: Omit<LeagueCharge, "note" | "automatic" | "matchId">[];
  } | null;
}
