import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum AdPlacementKind {
  HOME = "HOME",
  TOURNAMENT = "TOURNAMENT",
  CLUB = "CLUB",
  TEAMS = "TEAMS",
};

export enum AdStatus {
  PROGRAMADO = "PROGRAMADO",
  EN_CURSO = "EN_CURSO",
  PAUSADO = "PAUSADO",
  EXPIRADO = "EXPIRADO",
};

export enum CourtHoldSource {
  MATCH = "MATCH",
  MANUAL = "MANUAL",
};

export enum FootballType {
  FUT_7 = "FUT_7",
  FUT_9 = "FUT_9",
  FUT_11 = "FUT_11",
};

export enum InquiryStatus {
  NEW = "NEW",
  DONE = "DONE",
};

export enum InviteKind {
  SIGNUP = "SIGNUP",
  ACCEPT = "ACCEPT",
};

export enum MatchStatus {
  UNSCHEDULED = "UNSCHEDULED",
  SCHEDULED = "SCHEDULED",
  PLAYED = "PLAYED",
};

export enum MemberRole {
  ADMIN = "ADMIN",
  DT = "DT",
  PRENSA = "PRENSA",
  TESORERO = "TESORERO",
};

export enum TeamApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
};

export enum TournamentStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
};



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
      };
    } & Match_Key;
  } & CourtHold_Key)[];
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

export interface ClearCourtWindowsData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  cleared: number;
}

export interface ClearCourtWindowsVariables {
  userId?: string;
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
  description: string;
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
  tournaments: ({
    id: string;
    name: string;
    status: TournamentStatus;
    footballType: FootballType;
    startDate?: DateString | null;
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
      name: string;
      logoUrl?: string | null;
    };
    awayClub: {
      name: string;
      logoUrl?: string | null;
    };
    tournament: {
      id: string;
      name: string;
      status: TournamentStatus;
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
    homeClub: {
      name: string;
      logoUrl?: string | null;
    };
    awayClub: {
      name: string;
      logoUrl?: string | null;
    };
    tournament: {
      id: string;
      name: string;
      durationMinutes: number;
      liveMarginMinutes: number;
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
    court?: {
      name: string;
      imageUrl?: string | null;
    };
    tournament: {
      id: string;
      name: string;
      footballType: FootballType;
      durationMinutes: number;
      liveMarginMinutes: number;
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
        imageUrl: string;
        isCoach: boolean;
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
        imageUrl: string;
        isCoach: boolean;
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
      } & Player_Key)[];
    } & Club_Key;
    awayClub: {
      id: string;
      name: string;
      players_on_club: ({
        id: string;
        name: string;
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
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
    awayClub: {
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
    court?: {
      id: string;
      name: string;
    } & Court_Key;
    tournament: {
      id: string;
      name: string;
      status: TournamentStatus;
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
  hold?: unknown | null;
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
  fresh?: boolean;
}

export interface SaveCourtSettingsData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  settings?: unknown | null;
}

export interface SaveCourtSettingsVariables {
  userId?: string;
  enabled: boolean;
  slotMinutes: number;
}

export interface SaveCourtVariables {
  userId?: string;
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  football: boolean;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
}

export interface SaveCourtWindowData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  window?: unknown | null;
}

export interface SaveCourtWindowVariables {
  userId?: string;
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
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

export interface SavePlayerData {
  player?: unknown | null;
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
}

export interface SetSeasonActiveVariables {
  userId?: string;
  id: string;
  active: boolean;
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
    liveMarginMinutes: number;
    startDate?: DateString | null;
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
    season: {
      name: string;
    };
    category: {
      name: string;
    };
    tournamentPodiums_on_tournament: ({
      place: number;
      club: {
        name: string;
        slug: string;
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
    walkover: boolean;
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
}

export interface UpdateTournamentSettingsVariables {
  userId?: string;
  id: string;
  legs: number;
  footballType: string;
  durationMinutes: number;
  startDate?: DateString | null;
  liveMarginMinutes?: number | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface AmIPlatformAdminRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AmIPlatformAdminData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AmIPlatformAdminData, undefined>;
  operationName: string;
}
export const amIPlatformAdminRef: AmIPlatformAdminRef;

export function amIPlatformAdmin(options?: ExecuteQueryOptions): QueryPromise<AmIPlatformAdminData, undefined>;
export function amIPlatformAdmin(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AmIPlatformAdminData, undefined>;

interface PlatformAdminByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformAdminByIdVariables): QueryRef<PlatformAdminByIdData, PlatformAdminByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PlatformAdminByIdVariables): QueryRef<PlatformAdminByIdData, PlatformAdminByIdVariables>;
  operationName: string;
}
export const platformAdminByIdRef: PlatformAdminByIdRef;

export function platformAdminById(vars: PlatformAdminByIdVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminByIdData, PlatformAdminByIdVariables>;
export function platformAdminById(dc: DataConnect, vars: PlatformAdminByIdVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminByIdData, PlatformAdminByIdVariables>;

interface ClubAdminGateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubAdminGateVariables): QueryRef<ClubAdminGateData, ClubAdminGateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClubAdminGateVariables): QueryRef<ClubAdminGateData, ClubAdminGateVariables>;
  operationName: string;
}
export const clubAdminGateRef: ClubAdminGateRef;

export function clubAdminGate(vars: ClubAdminGateVariables, options?: ExecuteQueryOptions): QueryPromise<ClubAdminGateData, ClubAdminGateVariables>;
export function clubAdminGate(dc: DataConnect, vars: ClubAdminGateVariables, options?: ExecuteQueryOptions): QueryPromise<ClubAdminGateData, ClubAdminGateVariables>;

interface SignupInviteByEmailRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SignupInviteByEmailVariables): QueryRef<SignupInviteByEmailData, SignupInviteByEmailVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SignupInviteByEmailVariables): QueryRef<SignupInviteByEmailData, SignupInviteByEmailVariables>;
  operationName: string;
}
export const signupInviteByEmailRef: SignupInviteByEmailRef;

export function signupInviteByEmail(vars: SignupInviteByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<SignupInviteByEmailData, SignupInviteByEmailVariables>;
export function signupInviteByEmail(dc: DataConnect, vars: SignupInviteByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<SignupInviteByEmailData, SignupInviteByEmailVariables>;

interface ClubInviteLookupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubInviteLookupVariables): QueryRef<ClubInviteLookupData, ClubInviteLookupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClubInviteLookupVariables): QueryRef<ClubInviteLookupData, ClubInviteLookupVariables>;
  operationName: string;
}
export const clubInviteLookupRef: ClubInviteLookupRef;

export function clubInviteLookup(vars: ClubInviteLookupVariables, options?: ExecuteQueryOptions): QueryPromise<ClubInviteLookupData, ClubInviteLookupVariables>;
export function clubInviteLookup(dc: DataConnect, vars: ClubInviteLookupVariables, options?: ExecuteQueryOptions): QueryPromise<ClubInviteLookupData, ClubInviteLookupVariables>;

interface AdminClubsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminClubsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminClubsData, undefined>;
  operationName: string;
}
export const adminClubsRef: AdminClubsRef;

export function adminClubs(options?: ExecuteQueryOptions): QueryPromise<AdminClubsData, undefined>;
export function adminClubs(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminClubsData, undefined>;

interface SearchAdminClubsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchAdminClubsVariables): QueryRef<SearchAdminClubsData, SearchAdminClubsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchAdminClubsVariables): QueryRef<SearchAdminClubsData, SearchAdminClubsVariables>;
  operationName: string;
}
export const searchAdminClubsRef: SearchAdminClubsRef;

export function searchAdminClubs(vars: SearchAdminClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchAdminClubsData, SearchAdminClubsVariables>;
export function searchAdminClubs(dc: DataConnect, vars: SearchAdminClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchAdminClubsData, SearchAdminClubsVariables>;

interface AdminClubPeopleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminClubPeopleVariables): QueryRef<AdminClubPeopleData, AdminClubPeopleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AdminClubPeopleVariables): QueryRef<AdminClubPeopleData, AdminClubPeopleVariables>;
  operationName: string;
}
export const adminClubPeopleRef: AdminClubPeopleRef;

export function adminClubPeople(vars: AdminClubPeopleVariables, options?: ExecuteQueryOptions): QueryPromise<AdminClubPeopleData, AdminClubPeopleVariables>;
export function adminClubPeople(dc: DataConnect, vars: AdminClubPeopleVariables, options?: ExecuteQueryOptions): QueryPromise<AdminClubPeopleData, AdminClubPeopleVariables>;

interface AdminCompetitionRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminCompetitionData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminCompetitionData, undefined>;
  operationName: string;
}
export const adminCompetitionRef: AdminCompetitionRef;

export function adminCompetition(options?: ExecuteQueryOptions): QueryPromise<AdminCompetitionData, undefined>;
export function adminCompetition(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminCompetitionData, undefined>;

interface AdminCoverRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminCoverData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminCoverData, undefined>;
  operationName: string;
}
export const adminCoverRef: AdminCoverRef;

export function adminCover(options?: ExecuteQueryOptions): QueryPromise<AdminCoverData, undefined>;
export function adminCover(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminCoverData, undefined>;

interface AdminAdsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminAdsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminAdsData, undefined>;
  operationName: string;
}
export const adminAdsRef: AdminAdsRef;

export function adminAds(options?: ExecuteQueryOptions): QueryPromise<AdminAdsData, undefined>;
export function adminAds(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminAdsData, undefined>;

interface AdminInboxRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminInboxData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminInboxData, undefined>;
  operationName: string;
}
export const adminInboxRef: AdminInboxRef;

export function adminInbox(options?: ExecuteQueryOptions): QueryPromise<AdminInboxData, undefined>;
export function adminInbox(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminInboxData, undefined>;

interface AdminAdminsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminAdminsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminAdminsData, undefined>;
  operationName: string;
}
export const adminAdminsRef: AdminAdminsRef;

export function adminAdmins(options?: ExecuteQueryOptions): QueryPromise<AdminAdminsData, undefined>;
export function adminAdmins(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminAdminsData, undefined>;

interface MyPlatformAdminInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MyPlatformAdminInviteVariables): QueryRef<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MyPlatformAdminInviteVariables): QueryRef<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;
  operationName: string;
}
export const myPlatformAdminInviteRef: MyPlatformAdminInviteRef;

export function myPlatformAdminInvite(vars: MyPlatformAdminInviteVariables, options?: ExecuteQueryOptions): QueryPromise<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;
export function myPlatformAdminInvite(dc: DataConnect, vars: MyPlatformAdminInviteVariables, options?: ExecuteQueryOptions): QueryPromise<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;

interface AdminCourtsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminCourtsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<AdminCourtsData, undefined>;
  operationName: string;
}
export const adminCourtsRef: AdminCourtsRef;

export function adminCourts(options?: ExecuteQueryOptions): QueryPromise<AdminCourtsData, undefined>;
export function adminCourts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminCourtsData, undefined>;

interface BootstrapPlatformAdminRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BootstrapPlatformAdminVariables): MutationRef<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BootstrapPlatformAdminVariables): MutationRef<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;
  operationName: string;
}
export const bootstrapPlatformAdminRef: BootstrapPlatformAdminRef;

export function bootstrapPlatformAdmin(vars: BootstrapPlatformAdminVariables): MutationPromise<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;
export function bootstrapPlatformAdmin(dc: DataConnect, vars: BootstrapPlatformAdminVariables): MutationPromise<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;

interface ClaimPlatformAdminInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClaimPlatformAdminInviteVariables): MutationRef<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClaimPlatformAdminInviteVariables): MutationRef<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;
  operationName: string;
}
export const claimPlatformAdminInviteRef: ClaimPlatformAdminInviteRef;

export function claimPlatformAdminInvite(vars: ClaimPlatformAdminInviteVariables): MutationPromise<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;
export function claimPlatformAdminInvite(dc: DataConnect, vars: ClaimPlatformAdminInviteVariables): MutationPromise<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;

interface DeleteLocalityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteLocalityVariables): MutationRef<DeleteLocalityData, DeleteLocalityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteLocalityVariables): MutationRef<DeleteLocalityData, DeleteLocalityVariables>;
  operationName: string;
}
export const deleteLocalityRef: DeleteLocalityRef;

export function deleteLocality(vars: DeleteLocalityVariables): MutationPromise<DeleteLocalityData, DeleteLocalityVariables>;
export function deleteLocality(dc: DataConnect, vars: DeleteLocalityVariables): MutationPromise<DeleteLocalityData, DeleteLocalityVariables>;

interface CreateLocalityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLocalityVariables): MutationRef<CreateLocalityData, CreateLocalityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLocalityVariables): MutationRef<CreateLocalityData, CreateLocalityVariables>;
  operationName: string;
}
export const createLocalityRef: CreateLocalityRef;

export function createLocality(vars: CreateLocalityVariables): MutationPromise<CreateLocalityData, CreateLocalityVariables>;
export function createLocality(dc: DataConnect, vars: CreateLocalityVariables): MutationPromise<CreateLocalityData, CreateLocalityVariables>;

interface CreateClubRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateClubVariables): MutationRef<CreateClubData, CreateClubVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateClubVariables): MutationRef<CreateClubData, CreateClubVariables>;
  operationName: string;
}
export const createClubRef: CreateClubRef;

export function createClub(vars: CreateClubVariables): MutationPromise<CreateClubData, CreateClubVariables>;
export function createClub(dc: DataConnect, vars: CreateClubVariables): MutationPromise<CreateClubData, CreateClubVariables>;

interface InsertClubHeroRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClubHeroVariables): MutationRef<InsertClubHeroData, InsertClubHeroVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertClubHeroVariables): MutationRef<InsertClubHeroData, InsertClubHeroVariables>;
  operationName: string;
}
export const insertClubHeroRef: InsertClubHeroRef;

export function insertClubHero(vars: InsertClubHeroVariables): MutationPromise<InsertClubHeroData, InsertClubHeroVariables>;
export function insertClubHero(dc: DataConnect, vars: InsertClubHeroVariables): MutationPromise<InsertClubHeroData, InsertClubHeroVariables>;

interface SetClubActiveRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubActiveVariables): MutationRef<SetClubActiveData, SetClubActiveVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetClubActiveVariables): MutationRef<SetClubActiveData, SetClubActiveVariables>;
  operationName: string;
}
export const setClubActiveRef: SetClubActiveRef;

export function setClubActive(vars: SetClubActiveVariables): MutationPromise<SetClubActiveData, SetClubActiveVariables>;
export function setClubActive(dc: DataConnect, vars: SetClubActiveVariables): MutationPromise<SetClubActiveData, SetClubActiveVariables>;

interface DeleteClubRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClubVariables): MutationRef<DeleteClubData, DeleteClubVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteClubVariables): MutationRef<DeleteClubData, DeleteClubVariables>;
  operationName: string;
}
export const deleteClubRef: DeleteClubRef;

export function deleteClub(vars: DeleteClubVariables): MutationPromise<DeleteClubData, DeleteClubVariables>;
export function deleteClub(dc: DataConnect, vars: DeleteClubVariables): MutationPromise<DeleteClubData, DeleteClubVariables>;

interface SaveClubInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubInviteVariables): MutationRef<SaveClubInviteData, SaveClubInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveClubInviteVariables): MutationRef<SaveClubInviteData, SaveClubInviteVariables>;
  operationName: string;
}
export const saveClubInviteRef: SaveClubInviteRef;

export function saveClubInvite(vars: SaveClubInviteVariables): MutationPromise<SaveClubInviteData, SaveClubInviteVariables>;
export function saveClubInvite(dc: DataConnect, vars: SaveClubInviteVariables): MutationPromise<SaveClubInviteData, SaveClubInviteVariables>;

interface RemoveClubInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveClubInviteVariables): MutationRef<RemoveClubInviteData, RemoveClubInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemoveClubInviteVariables): MutationRef<RemoveClubInviteData, RemoveClubInviteVariables>;
  operationName: string;
}
export const removeClubInviteRef: RemoveClubInviteRef;

export function removeClubInvite(vars: RemoveClubInviteVariables): MutationPromise<RemoveClubInviteData, RemoveClubInviteVariables>;
export function removeClubInvite(dc: DataConnect, vars: RemoveClubInviteVariables): MutationPromise<RemoveClubInviteData, RemoveClubInviteVariables>;

interface SaveSignupInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveSignupInviteVariables): MutationRef<SaveSignupInviteData, SaveSignupInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveSignupInviteVariables): MutationRef<SaveSignupInviteData, SaveSignupInviteVariables>;
  operationName: string;
}
export const saveSignupInviteRef: SaveSignupInviteRef;

export function saveSignupInvite(vars: SaveSignupInviteVariables): MutationPromise<SaveSignupInviteData, SaveSignupInviteVariables>;
export function saveSignupInvite(dc: DataConnect, vars: SaveSignupInviteVariables): MutationPromise<SaveSignupInviteData, SaveSignupInviteVariables>;

interface ClearSignupInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearSignupInviteVariables): MutationRef<ClearSignupInviteData, ClearSignupInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClearSignupInviteVariables): MutationRef<ClearSignupInviteData, ClearSignupInviteVariables>;
  operationName: string;
}
export const clearSignupInviteRef: ClearSignupInviteRef;

export function clearSignupInvite(vars: ClearSignupInviteVariables): MutationPromise<ClearSignupInviteData, ClearSignupInviteVariables>;
export function clearSignupInvite(dc: DataConnect, vars: ClearSignupInviteVariables): MutationPromise<ClearSignupInviteData, ClearSignupInviteVariables>;

interface SetClubMemberRoleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubMemberRoleVariables): MutationRef<SetClubMemberRoleData, SetClubMemberRoleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetClubMemberRoleVariables): MutationRef<SetClubMemberRoleData, SetClubMemberRoleVariables>;
  operationName: string;
}
export const setClubMemberRoleRef: SetClubMemberRoleRef;

export function setClubMemberRole(vars: SetClubMemberRoleVariables): MutationPromise<SetClubMemberRoleData, SetClubMemberRoleVariables>;
export function setClubMemberRole(dc: DataConnect, vars: SetClubMemberRoleVariables): MutationPromise<SetClubMemberRoleData, SetClubMemberRoleVariables>;

interface RemoveClubMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveClubMemberVariables): MutationRef<RemoveClubMemberData, RemoveClubMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemoveClubMemberVariables): MutationRef<RemoveClubMemberData, RemoveClubMemberVariables>;
  operationName: string;
}
export const removeClubMemberRef: RemoveClubMemberRef;

export function removeClubMember(vars: RemoveClubMemberVariables): MutationPromise<RemoveClubMemberData, RemoveClubMemberVariables>;
export function removeClubMember(dc: DataConnect, vars: RemoveClubMemberVariables): MutationPromise<RemoveClubMemberData, RemoveClubMemberVariables>;

interface AcceptClubInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AcceptClubInviteVariables): MutationRef<AcceptClubInviteData, AcceptClubInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AcceptClubInviteVariables): MutationRef<AcceptClubInviteData, AcceptClubInviteVariables>;
  operationName: string;
}
export const acceptClubInviteRef: AcceptClubInviteRef;

export function acceptClubInvite(vars: AcceptClubInviteVariables): MutationPromise<AcceptClubInviteData, AcceptClubInviteVariables>;
export function acceptClubInvite(dc: DataConnect, vars: AcceptClubInviteVariables): MutationPromise<AcceptClubInviteData, AcceptClubInviteVariables>;

interface DeclineClubInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeclineClubInviteVariables): MutationRef<DeclineClubInviteData, DeclineClubInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeclineClubInviteVariables): MutationRef<DeclineClubInviteData, DeclineClubInviteVariables>;
  operationName: string;
}
export const declineClubInviteRef: DeclineClubInviteRef;

export function declineClubInvite(vars: DeclineClubInviteVariables): MutationPromise<DeclineClubInviteData, DeclineClubInviteVariables>;
export function declineClubInvite(dc: DataConnect, vars: DeclineClubInviteVariables): MutationPromise<DeclineClubInviteData, DeclineClubInviteVariables>;

interface CreateSeasonRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSeasonVariables): MutationRef<CreateSeasonData, CreateSeasonVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSeasonVariables): MutationRef<CreateSeasonData, CreateSeasonVariables>;
  operationName: string;
}
export const createSeasonRef: CreateSeasonRef;

export function createSeason(vars: CreateSeasonVariables): MutationPromise<CreateSeasonData, CreateSeasonVariables>;
export function createSeason(dc: DataConnect, vars: CreateSeasonVariables): MutationPromise<CreateSeasonData, CreateSeasonVariables>;

interface SetSeasonActiveRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSeasonActiveVariables): MutationRef<SetSeasonActiveData, SetSeasonActiveVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetSeasonActiveVariables): MutationRef<SetSeasonActiveData, SetSeasonActiveVariables>;
  operationName: string;
}
export const setSeasonActiveRef: SetSeasonActiveRef;

export function setSeasonActive(vars: SetSeasonActiveVariables): MutationPromise<SetSeasonActiveData, SetSeasonActiveVariables>;
export function setSeasonActive(dc: DataConnect, vars: SetSeasonActiveVariables): MutationPromise<SetSeasonActiveData, SetSeasonActiveVariables>;

interface DeleteSeasonRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSeasonVariables): MutationRef<DeleteSeasonData, DeleteSeasonVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSeasonVariables): MutationRef<DeleteSeasonData, DeleteSeasonVariables>;
  operationName: string;
}
export const deleteSeasonRef: DeleteSeasonRef;

export function deleteSeason(vars: DeleteSeasonVariables): MutationPromise<DeleteSeasonData, DeleteSeasonVariables>;
export function deleteSeason(dc: DataConnect, vars: DeleteSeasonVariables): MutationPromise<DeleteSeasonData, DeleteSeasonVariables>;

interface CreateCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  operationName: string;
}
export const createCategoryRef: CreateCategoryRef;

export function createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;
export function createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateTournamentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTournamentVariables): MutationRef<CreateTournamentData, CreateTournamentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTournamentVariables): MutationRef<CreateTournamentData, CreateTournamentVariables>;
  operationName: string;
}
export const createTournamentRef: CreateTournamentRef;

export function createTournament(vars: CreateTournamentVariables): MutationPromise<CreateTournamentData, CreateTournamentVariables>;
export function createTournament(dc: DataConnect, vars: CreateTournamentVariables): MutationPromise<CreateTournamentData, CreateTournamentVariables>;

interface SavePlatformHeaderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformHeaderVariables): MutationRef<SavePlatformHeaderData, SavePlatformHeaderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SavePlatformHeaderVariables): MutationRef<SavePlatformHeaderData, SavePlatformHeaderVariables>;
  operationName: string;
}
export const savePlatformHeaderRef: SavePlatformHeaderRef;

export function savePlatformHeader(vars: SavePlatformHeaderVariables): MutationPromise<SavePlatformHeaderData, SavePlatformHeaderVariables>;
export function savePlatformHeader(dc: DataConnect, vars: SavePlatformHeaderVariables): MutationPromise<SavePlatformHeaderData, SavePlatformHeaderVariables>;

interface SavePlatformCoverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformCoverVariables): MutationRef<SavePlatformCoverData, SavePlatformCoverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SavePlatformCoverVariables): MutationRef<SavePlatformCoverData, SavePlatformCoverVariables>;
  operationName: string;
}
export const savePlatformCoverRef: SavePlatformCoverRef;

export function savePlatformCover(vars: SavePlatformCoverVariables): MutationPromise<SavePlatformCoverData, SavePlatformCoverVariables>;
export function savePlatformCover(dc: DataConnect, vars: SavePlatformCoverVariables): MutationPromise<SavePlatformCoverData, SavePlatformCoverVariables>;

interface SavePlatformSocialRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformSocialVariables): MutationRef<SavePlatformSocialData, SavePlatformSocialVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SavePlatformSocialVariables): MutationRef<SavePlatformSocialData, SavePlatformSocialVariables>;
  operationName: string;
}
export const savePlatformSocialRef: SavePlatformSocialRef;

export function savePlatformSocial(vars: SavePlatformSocialVariables): MutationPromise<SavePlatformSocialData, SavePlatformSocialVariables>;
export function savePlatformSocial(dc: DataConnect, vars: SavePlatformSocialVariables): MutationPromise<SavePlatformSocialData, SavePlatformSocialVariables>;

interface ReplaceHeroImagesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceHeroImagesVariables): MutationRef<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReplaceHeroImagesVariables): MutationRef<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;
  operationName: string;
}
export const replaceHeroImagesRef: ReplaceHeroImagesRef;

export function replaceHeroImages(vars: ReplaceHeroImagesVariables): MutationPromise<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;
export function replaceHeroImages(dc: DataConnect, vars: ReplaceHeroImagesVariables): MutationPromise<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;

interface SaveCourtSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtSettingsVariables): MutationRef<SaveCourtSettingsData, SaveCourtSettingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveCourtSettingsVariables): MutationRef<SaveCourtSettingsData, SaveCourtSettingsVariables>;
  operationName: string;
}
export const saveCourtSettingsRef: SaveCourtSettingsRef;

export function saveCourtSettings(vars: SaveCourtSettingsVariables): MutationPromise<SaveCourtSettingsData, SaveCourtSettingsVariables>;
export function saveCourtSettings(dc: DataConnect, vars: SaveCourtSettingsVariables): MutationPromise<SaveCourtSettingsData, SaveCourtSettingsVariables>;

interface ClearCourtWindowsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ClearCourtWindowsVariables): MutationRef<ClearCourtWindowsData, ClearCourtWindowsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ClearCourtWindowsVariables): MutationRef<ClearCourtWindowsData, ClearCourtWindowsVariables>;
  operationName: string;
}
export const clearCourtWindowsRef: ClearCourtWindowsRef;

export function clearCourtWindows(vars?: ClearCourtWindowsVariables): MutationPromise<ClearCourtWindowsData, ClearCourtWindowsVariables>;
export function clearCourtWindows(dc: DataConnect, vars?: ClearCourtWindowsVariables): MutationPromise<ClearCourtWindowsData, ClearCourtWindowsVariables>;

interface SaveCourtWindowRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtWindowVariables): MutationRef<SaveCourtWindowData, SaveCourtWindowVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveCourtWindowVariables): MutationRef<SaveCourtWindowData, SaveCourtWindowVariables>;
  operationName: string;
}
export const saveCourtWindowRef: SaveCourtWindowRef;

export function saveCourtWindow(vars: SaveCourtWindowVariables): MutationPromise<SaveCourtWindowData, SaveCourtWindowVariables>;
export function saveCourtWindow(dc: DataConnect, vars: SaveCourtWindowVariables): MutationPromise<SaveCourtWindowData, SaveCourtWindowVariables>;

interface SaveCourtRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtVariables): MutationRef<SaveCourtData, SaveCourtVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveCourtVariables): MutationRef<SaveCourtData, SaveCourtVariables>;
  operationName: string;
}
export const saveCourtRef: SaveCourtRef;

export function saveCourt(vars: SaveCourtVariables): MutationPromise<SaveCourtData, SaveCourtVariables>;
export function saveCourt(dc: DataConnect, vars: SaveCourtVariables): MutationPromise<SaveCourtData, SaveCourtVariables>;

interface DeleteCourtRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
  operationName: string;
}
export const deleteCourtRef: DeleteCourtRef;

export function deleteCourt(vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;
export function deleteCourt(dc: DataConnect, vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;

interface SaveCourtHoldRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtHoldVariables): MutationRef<SaveCourtHoldData, SaveCourtHoldVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveCourtHoldVariables): MutationRef<SaveCourtHoldData, SaveCourtHoldVariables>;
  operationName: string;
}
export const saveCourtHoldRef: SaveCourtHoldRef;

export function saveCourtHold(vars: SaveCourtHoldVariables): MutationPromise<SaveCourtHoldData, SaveCourtHoldVariables>;
export function saveCourtHold(dc: DataConnect, vars: SaveCourtHoldVariables): MutationPromise<SaveCourtHoldData, SaveCourtHoldVariables>;

interface DeleteManualCourtHoldRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteManualCourtHoldVariables): MutationRef<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteManualCourtHoldVariables): MutationRef<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;
  operationName: string;
}
export const deleteManualCourtHoldRef: DeleteManualCourtHoldRef;

export function deleteManualCourtHold(vars: DeleteManualCourtHoldVariables): MutationPromise<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;
export function deleteManualCourtHold(dc: DataConnect, vars: DeleteManualCourtHoldVariables): MutationPromise<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;

interface SaveAdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveAdVariables): MutationRef<SaveAdData, SaveAdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveAdVariables): MutationRef<SaveAdData, SaveAdVariables>;
  operationName: string;
}
export const saveAdRef: SaveAdRef;

export function saveAd(vars: SaveAdVariables): MutationPromise<SaveAdData, SaveAdVariables>;
export function saveAd(dc: DataConnect, vars: SaveAdVariables): MutationPromise<SaveAdData, SaveAdVariables>;

interface SetAdStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetAdStatusVariables): MutationRef<SetAdStatusData, SetAdStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetAdStatusVariables): MutationRef<SetAdStatusData, SetAdStatusVariables>;
  operationName: string;
}
export const setAdStatusRef: SetAdStatusRef;

export function setAdStatus(vars: SetAdStatusVariables): MutationPromise<SetAdStatusData, SetAdStatusVariables>;
export function setAdStatus(dc: DataConnect, vars: SetAdStatusVariables): MutationPromise<SetAdStatusData, SetAdStatusVariables>;

interface SetAdOrderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetAdOrderVariables): MutationRef<SetAdOrderData, SetAdOrderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetAdOrderVariables): MutationRef<SetAdOrderData, SetAdOrderVariables>;
  operationName: string;
}
export const setAdOrderRef: SetAdOrderRef;

export function setAdOrder(vars: SetAdOrderVariables): MutationPromise<SetAdOrderData, SetAdOrderVariables>;
export function setAdOrder(dc: DataConnect, vars: SetAdOrderVariables): MutationPromise<SetAdOrderData, SetAdOrderVariables>;

interface ClearAdPlacementsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearAdPlacementsVariables): MutationRef<ClearAdPlacementsData, ClearAdPlacementsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClearAdPlacementsVariables): MutationRef<ClearAdPlacementsData, ClearAdPlacementsVariables>;
  operationName: string;
}
export const clearAdPlacementsRef: ClearAdPlacementsRef;

export function clearAdPlacements(vars: ClearAdPlacementsVariables): MutationPromise<ClearAdPlacementsData, ClearAdPlacementsVariables>;
export function clearAdPlacements(dc: DataConnect, vars: ClearAdPlacementsVariables): MutationPromise<ClearAdPlacementsData, ClearAdPlacementsVariables>;

interface SaveAdPlacementRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveAdPlacementVariables): MutationRef<SaveAdPlacementData, SaveAdPlacementVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveAdPlacementVariables): MutationRef<SaveAdPlacementData, SaveAdPlacementVariables>;
  operationName: string;
}
export const saveAdPlacementRef: SaveAdPlacementRef;

export function saveAdPlacement(vars: SaveAdPlacementVariables): MutationPromise<SaveAdPlacementData, SaveAdPlacementVariables>;
export function saveAdPlacement(dc: DataConnect, vars: SaveAdPlacementVariables): MutationPromise<SaveAdPlacementData, SaveAdPlacementVariables>;

interface DeleteAdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteAdVariables): MutationRef<DeleteAdData, DeleteAdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteAdVariables): MutationRef<DeleteAdData, DeleteAdVariables>;
  operationName: string;
}
export const deleteAdRef: DeleteAdRef;

export function deleteAd(vars: DeleteAdVariables): MutationPromise<DeleteAdData, DeleteAdVariables>;
export function deleteAd(dc: DataConnect, vars: DeleteAdVariables): MutationPromise<DeleteAdData, DeleteAdVariables>;

interface SetInquiryDoneRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetInquiryDoneVariables): MutationRef<SetInquiryDoneData, SetInquiryDoneVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetInquiryDoneVariables): MutationRef<SetInquiryDoneData, SetInquiryDoneVariables>;
  operationName: string;
}
export const setInquiryDoneRef: SetInquiryDoneRef;

export function setInquiryDone(vars: SetInquiryDoneVariables): MutationPromise<SetInquiryDoneData, SetInquiryDoneVariables>;
export function setInquiryDone(dc: DataConnect, vars: SetInquiryDoneVariables): MutationPromise<SetInquiryDoneData, SetInquiryDoneVariables>;

interface DeleteInquiryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteInquiryVariables): MutationRef<DeleteInquiryData, DeleteInquiryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteInquiryVariables): MutationRef<DeleteInquiryData, DeleteInquiryVariables>;
  operationName: string;
}
export const deleteInquiryRef: DeleteInquiryRef;

export function deleteInquiry(vars: DeleteInquiryVariables): MutationPromise<DeleteInquiryData, DeleteInquiryVariables>;
export function deleteInquiry(dc: DataConnect, vars: DeleteInquiryVariables): MutationPromise<DeleteInquiryData, DeleteInquiryVariables>;

interface RejectTeamApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RejectTeamApplicationVariables): MutationRef<RejectTeamApplicationData, RejectTeamApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RejectTeamApplicationVariables): MutationRef<RejectTeamApplicationData, RejectTeamApplicationVariables>;
  operationName: string;
}
export const rejectTeamApplicationRef: RejectTeamApplicationRef;

export function rejectTeamApplication(vars: RejectTeamApplicationVariables): MutationPromise<RejectTeamApplicationData, RejectTeamApplicationVariables>;
export function rejectTeamApplication(dc: DataConnect, vars: RejectTeamApplicationVariables): MutationPromise<RejectTeamApplicationData, RejectTeamApplicationVariables>;

interface ApproveTeamApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApproveTeamApplicationVariables): MutationRef<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ApproveTeamApplicationVariables): MutationRef<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;
  operationName: string;
}
export const approveTeamApplicationRef: ApproveTeamApplicationRef;

export function approveTeamApplication(vars: ApproveTeamApplicationVariables): MutationPromise<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;
export function approveTeamApplication(dc: DataConnect, vars: ApproveTeamApplicationVariables): MutationPromise<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;

interface SavePlatformAdminInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformAdminInviteVariables): MutationRef<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SavePlatformAdminInviteVariables): MutationRef<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;
  operationName: string;
}
export const savePlatformAdminInviteRef: SavePlatformAdminInviteRef;

export function savePlatformAdminInvite(vars: SavePlatformAdminInviteVariables): MutationPromise<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;
export function savePlatformAdminInvite(dc: DataConnect, vars: SavePlatformAdminInviteVariables): MutationPromise<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;

interface RemovePlatformAdminInviteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemovePlatformAdminInviteVariables): MutationRef<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemovePlatformAdminInviteVariables): MutationRef<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;
  operationName: string;
}
export const removePlatformAdminInviteRef: RemovePlatformAdminInviteRef;

export function removePlatformAdminInvite(vars: RemovePlatformAdminInviteVariables): MutationPromise<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;
export function removePlatformAdminInvite(dc: DataConnect, vars: RemovePlatformAdminInviteVariables): MutationPromise<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;

interface RemovePlatformAdminRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemovePlatformAdminVariables): MutationRef<RemovePlatformAdminData, RemovePlatformAdminVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemovePlatformAdminVariables): MutationRef<RemovePlatformAdminData, RemovePlatformAdminVariables>;
  operationName: string;
}
export const removePlatformAdminRef: RemovePlatformAdminRef;

export function removePlatformAdmin(vars: RemovePlatformAdminVariables): MutationPromise<RemovePlatformAdminData, RemovePlatformAdminVariables>;
export function removePlatformAdmin(dc: DataConnect, vars: RemovePlatformAdminVariables): MutationPromise<RemovePlatformAdminData, RemovePlatformAdminVariables>;

interface SetClubEventScoreRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubEventScoreVariables): MutationRef<SetClubEventScoreData, SetClubEventScoreVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetClubEventScoreVariables): MutationRef<SetClubEventScoreData, SetClubEventScoreVariables>;
  operationName: string;
}
export const setClubEventScoreRef: SetClubEventScoreRef;

export function setClubEventScore(vars: SetClubEventScoreVariables): MutationPromise<SetClubEventScoreData, SetClubEventScoreVariables>;
export function setClubEventScore(dc: DataConnect, vars: SetClubEventScoreVariables): MutationPromise<SetClubEventScoreData, SetClubEventScoreVariables>;

interface SetClubEventLineupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubEventLineupVariables): MutationRef<SetClubEventLineupData, SetClubEventLineupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetClubEventLineupVariables): MutationRef<SetClubEventLineupData, SetClubEventLineupVariables>;
  operationName: string;
}
export const setClubEventLineupRef: SetClubEventLineupRef;

export function setClubEventLineup(vars: SetClubEventLineupVariables): MutationPromise<SetClubEventLineupData, SetClubEventLineupVariables>;
export function setClubEventLineup(dc: DataConnect, vars: SetClubEventLineupVariables): MutationPromise<SetClubEventLineupData, SetClubEventLineupVariables>;

interface SaveClubDefaultLineupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubDefaultLineupVariables): MutationRef<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveClubDefaultLineupVariables): MutationRef<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;
  operationName: string;
}
export const saveClubDefaultLineupRef: SaveClubDefaultLineupRef;

export function saveClubDefaultLineup(vars: SaveClubDefaultLineupVariables): MutationPromise<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;
export function saveClubDefaultLineup(dc: DataConnect, vars: SaveClubDefaultLineupVariables): MutationPromise<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;

interface ReplaceClubEventAttendeesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceClubEventAttendeesVariables): MutationRef<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReplaceClubEventAttendeesVariables): MutationRef<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;
  operationName: string;
}
export const replaceClubEventAttendeesRef: ReplaceClubEventAttendeesRef;

export function replaceClubEventAttendees(vars: ReplaceClubEventAttendeesVariables): MutationPromise<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;
export function replaceClubEventAttendees(dc: DataConnect, vars: ReplaceClubEventAttendeesVariables): MutationPromise<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;

interface ReplaceClubEventAlbumRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceClubEventAlbumVariables): MutationRef<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReplaceClubEventAlbumVariables): MutationRef<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;
  operationName: string;
}
export const replaceClubEventAlbumRef: ReplaceClubEventAlbumRef;

export function replaceClubEventAlbum(vars: ReplaceClubEventAlbumVariables): MutationPromise<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;
export function replaceClubEventAlbum(dc: DataConnect, vars: ReplaceClubEventAlbumVariables): MutationPromise<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;

interface ReplaceClubEventStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceClubEventStatsVariables): MutationRef<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReplaceClubEventStatsVariables): MutationRef<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;
  operationName: string;
}
export const replaceClubEventStatsRef: ReplaceClubEventStatsRef;

export function replaceClubEventStats(vars: ReplaceClubEventStatsVariables): MutationPromise<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;
export function replaceClubEventStats(dc: DataConnect, vars: ReplaceClubEventStatsVariables): MutationPromise<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;

interface SetMatchClubLineupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetMatchClubLineupVariables): MutationRef<SetMatchClubLineupData, SetMatchClubLineupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetMatchClubLineupVariables): MutationRef<SetMatchClubLineupData, SetMatchClubLineupVariables>;
  operationName: string;
}
export const setMatchClubLineupRef: SetMatchClubLineupRef;

export function setMatchClubLineup(vars: SetMatchClubLineupVariables): MutationPromise<SetMatchClubLineupData, SetMatchClubLineupVariables>;
export function setMatchClubLineup(dc: DataConnect, vars: SetMatchClubLineupVariables): MutationPromise<SetMatchClubLineupData, SetMatchClubLineupVariables>;

interface ReplaceMatchAttendeesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceMatchAttendeesVariables): MutationRef<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReplaceMatchAttendeesVariables): MutationRef<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;
  operationName: string;
}
export const replaceMatchAttendeesRef: ReplaceMatchAttendeesRef;

export function replaceMatchAttendees(vars: ReplaceMatchAttendeesVariables): MutationPromise<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;
export function replaceMatchAttendees(dc: DataConnect, vars: ReplaceMatchAttendeesVariables): MutationPromise<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;

interface SaveFinancialGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveFinancialGoalVariables): MutationRef<SaveFinancialGoalData, SaveFinancialGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveFinancialGoalVariables): MutationRef<SaveFinancialGoalData, SaveFinancialGoalVariables>;
  operationName: string;
}
export const saveFinancialGoalRef: SaveFinancialGoalRef;

export function saveFinancialGoal(vars: SaveFinancialGoalVariables): MutationPromise<SaveFinancialGoalData, SaveFinancialGoalVariables>;
export function saveFinancialGoal(dc: DataConnect, vars: SaveFinancialGoalVariables): MutationPromise<SaveFinancialGoalData, SaveFinancialGoalVariables>;

interface SetFinancialGoalStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetFinancialGoalStatusVariables): MutationRef<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetFinancialGoalStatusVariables): MutationRef<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;
  operationName: string;
}
export const setFinancialGoalStatusRef: SetFinancialGoalStatusRef;

export function setFinancialGoalStatus(vars: SetFinancialGoalStatusVariables): MutationPromise<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;
export function setFinancialGoalStatus(dc: DataConnect, vars: SetFinancialGoalStatusVariables): MutationPromise<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;

interface DeleteFinancialGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFinancialGoalVariables): MutationRef<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteFinancialGoalVariables): MutationRef<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;
  operationName: string;
}
export const deleteFinancialGoalRef: DeleteFinancialGoalRef;

export function deleteFinancialGoal(vars: DeleteFinancialGoalVariables): MutationPromise<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;
export function deleteFinancialGoal(dc: DataConnect, vars: DeleteFinancialGoalVariables): MutationPromise<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;

interface DeleteTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
  operationName: string;
}
export const deleteTransactionRef: DeleteTransactionRef;

export function deleteTransaction(vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;
export function deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteInventoryItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteInventoryItemVariables): MutationRef<DeleteInventoryItemData, DeleteInventoryItemVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteInventoryItemVariables): MutationRef<DeleteInventoryItemData, DeleteInventoryItemVariables>;
  operationName: string;
}
export const deleteInventoryItemRef: DeleteInventoryItemRef;

export function deleteInventoryItem(vars: DeleteInventoryItemVariables): MutationPromise<DeleteInventoryItemData, DeleteInventoryItemVariables>;
export function deleteInventoryItem(dc: DataConnect, vars: DeleteInventoryItemVariables): MutationPromise<DeleteInventoryItemData, DeleteInventoryItemVariables>;

interface SaveGalleryPhotoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveGalleryPhotoVariables): MutationRef<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveGalleryPhotoVariables): MutationRef<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;
  operationName: string;
}
export const saveGalleryPhotoRef: SaveGalleryPhotoRef;

export function saveGalleryPhoto(vars: SaveGalleryPhotoVariables): MutationPromise<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;
export function saveGalleryPhoto(dc: DataConnect, vars: SaveGalleryPhotoVariables): MutationPromise<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;

interface SwapGalleryPhotosRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SwapGalleryPhotosVariables): MutationRef<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SwapGalleryPhotosVariables): MutationRef<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;
  operationName: string;
}
export const swapGalleryPhotosRef: SwapGalleryPhotosRef;

export function swapGalleryPhotos(vars: SwapGalleryPhotosVariables): MutationPromise<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;
export function swapGalleryPhotos(dc: DataConnect, vars: SwapGalleryPhotosVariables): MutationPromise<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;

interface PromoteGalleryPhotoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PromoteGalleryPhotoVariables): MutationRef<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PromoteGalleryPhotoVariables): MutationRef<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;
  operationName: string;
}
export const promoteGalleryPhotoRef: PromoteGalleryPhotoRef;

export function promoteGalleryPhoto(vars: PromoteGalleryPhotoVariables): MutationPromise<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;
export function promoteGalleryPhoto(dc: DataConnect, vars: PromoteGalleryPhotoVariables): MutationPromise<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;

interface DeleteGalleryPhotoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGalleryPhotoVariables): MutationRef<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteGalleryPhotoVariables): MutationRef<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;
  operationName: string;
}
export const deleteGalleryPhotoRef: DeleteGalleryPhotoRef;

export function deleteGalleryPhoto(vars: DeleteGalleryPhotoVariables): MutationPromise<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;
export function deleteGalleryPhoto(dc: DataConnect, vars: DeleteGalleryPhotoVariables): MutationPromise<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;

interface ClearClubAvailabilityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearClubAvailabilityVariables): MutationRef<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClearClubAvailabilityVariables): MutationRef<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;
  operationName: string;
}
export const clearClubAvailabilityRef: ClearClubAvailabilityRef;

export function clearClubAvailability(vars: ClearClubAvailabilityVariables): MutationPromise<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;
export function clearClubAvailability(dc: DataConnect, vars: ClearClubAvailabilityVariables): MutationPromise<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;

interface InsertClubAvailabilityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClubAvailabilityVariables): MutationRef<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertClubAvailabilityVariables): MutationRef<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;
  operationName: string;
}
export const insertClubAvailabilityRef: InsertClubAvailabilityRef;

export function insertClubAvailability(vars: InsertClubAvailabilityVariables): MutationPromise<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;
export function insertClubAvailability(dc: DataConnect, vars: InsertClubAvailabilityVariables): MutationPromise<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;

interface SaveClubPortadaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubPortadaVariables): MutationRef<SaveClubPortadaData, SaveClubPortadaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveClubPortadaVariables): MutationRef<SaveClubPortadaData, SaveClubPortadaVariables>;
  operationName: string;
}
export const saveClubPortadaRef: SaveClubPortadaRef;

export function saveClubPortada(vars: SaveClubPortadaVariables): MutationPromise<SaveClubPortadaData, SaveClubPortadaVariables>;
export function saveClubPortada(dc: DataConnect, vars: SaveClubPortadaVariables): MutationPromise<SaveClubPortadaData, SaveClubPortadaVariables>;

interface ClearClubHeroesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearClubHeroesVariables): MutationRef<ClearClubHeroesData, ClearClubHeroesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClearClubHeroesVariables): MutationRef<ClearClubHeroesData, ClearClubHeroesVariables>;
  operationName: string;
}
export const clearClubHeroesRef: ClearClubHeroesRef;

export function clearClubHeroes(vars: ClearClubHeroesVariables): MutationPromise<ClearClubHeroesData, ClearClubHeroesVariables>;
export function clearClubHeroes(dc: DataConnect, vars: ClearClubHeroesVariables): MutationPromise<ClearClubHeroesData, ClearClubHeroesVariables>;

interface InsertClubHeroesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClubHeroesVariables): MutationRef<InsertClubHeroesData, InsertClubHeroesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertClubHeroesVariables): MutationRef<InsertClubHeroesData, InsertClubHeroesVariables>;
  operationName: string;
}
export const insertClubHeroesRef: InsertClubHeroesRef;

export function insertClubHeroes(vars: InsertClubHeroesVariables): MutationPromise<InsertClubHeroesData, InsertClubHeroesVariables>;
export function insertClubHeroes(dc: DataConnect, vars: InsertClubHeroesVariables): MutationPromise<InsertClubHeroesData, InsertClubHeroesVariables>;

interface DeleteGalleryAlbumRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGalleryAlbumVariables): MutationRef<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteGalleryAlbumVariables): MutationRef<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;
  operationName: string;
}
export const deleteGalleryAlbumRef: DeleteGalleryAlbumRef;

export function deleteGalleryAlbum(vars: DeleteGalleryAlbumVariables): MutationPromise<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;
export function deleteGalleryAlbum(dc: DataConnect, vars: DeleteGalleryAlbumVariables): MutationPromise<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;

interface TournamentEditorRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentEditorVariables): QueryRef<TournamentEditorData, TournamentEditorVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TournamentEditorVariables): QueryRef<TournamentEditorData, TournamentEditorVariables>;
  operationName: string;
}
export const tournamentEditorRef: TournamentEditorRef;

export function tournamentEditor(vars: TournamentEditorVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentEditorData, TournamentEditorVariables>;
export function tournamentEditor(dc: DataConnect, vars: TournamentEditorVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentEditorData, TournamentEditorVariables>;

interface ScheduleCourtsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ScheduleCourtsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ScheduleCourtsData, undefined>;
  operationName: string;
}
export const scheduleCourtsRef: ScheduleCourtsRef;

export function scheduleCourts(options?: ExecuteQueryOptions): QueryPromise<ScheduleCourtsData, undefined>;
export function scheduleCourts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ScheduleCourtsData, undefined>;

interface MatchSlotHintsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchSlotHintsVariables): QueryRef<MatchSlotHintsData, MatchSlotHintsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MatchSlotHintsVariables): QueryRef<MatchSlotHintsData, MatchSlotHintsVariables>;
  operationName: string;
}
export const matchSlotHintsRef: MatchSlotHintsRef;

export function matchSlotHints(vars: MatchSlotHintsVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSlotHintsData, MatchSlotHintsVariables>;
export function matchSlotHints(dc: DataConnect, vars: MatchSlotHintsVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSlotHintsData, MatchSlotHintsVariables>;

interface ClubScreenRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubScreenVariables): QueryRef<ClubScreenData, ClubScreenVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClubScreenVariables): QueryRef<ClubScreenData, ClubScreenVariables>;
  operationName: string;
}
export const clubScreenRef: ClubScreenRef;

export function clubScreen(vars: ClubScreenVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScreenData, ClubScreenVariables>;
export function clubScreen(dc: DataConnect, vars: ClubScreenVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScreenData, ClubScreenVariables>;

interface DeleteUnplayedTournamentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUnplayedTournamentVariables): MutationRef<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteUnplayedTournamentVariables): MutationRef<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;
  operationName: string;
}
export const deleteUnplayedTournamentRef: DeleteUnplayedTournamentRef;

export function deleteUnplayedTournament(vars: DeleteUnplayedTournamentVariables): MutationPromise<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;
export function deleteUnplayedTournament(dc: DataConnect, vars: DeleteUnplayedTournamentVariables): MutationPromise<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;

interface UpdateTournamentSettingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTournamentSettingsVariables): MutationRef<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTournamentSettingsVariables): MutationRef<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;
  operationName: string;
}
export const updateTournamentSettingsRef: UpdateTournamentSettingsRef;

export function updateTournamentSettings(vars: UpdateTournamentSettingsVariables): MutationPromise<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;
export function updateTournamentSettings(dc: DataConnect, vars: UpdateTournamentSettingsVariables): MutationPromise<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;

interface AddTournamentClubRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddTournamentClubVariables): MutationRef<AddTournamentClubData, AddTournamentClubVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddTournamentClubVariables): MutationRef<AddTournamentClubData, AddTournamentClubVariables>;
  operationName: string;
}
export const addTournamentClubRef: AddTournamentClubRef;

export function addTournamentClub(vars: AddTournamentClubVariables): MutationPromise<AddTournamentClubData, AddTournamentClubVariables>;
export function addTournamentClub(dc: DataConnect, vars: AddTournamentClubVariables): MutationPromise<AddTournamentClubData, AddTournamentClubVariables>;

interface RemoveTournamentClubRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveTournamentClubVariables): MutationRef<RemoveTournamentClubData, RemoveTournamentClubVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemoveTournamentClubVariables): MutationRef<RemoveTournamentClubData, RemoveTournamentClubVariables>;
  operationName: string;
}
export const removeTournamentClubRef: RemoveTournamentClubRef;

export function removeTournamentClub(vars: RemoveTournamentClubVariables): MutationPromise<RemoveTournamentClubData, RemoveTournamentClubVariables>;
export function removeTournamentClub(dc: DataConnect, vars: RemoveTournamentClubVariables): MutationPromise<RemoveTournamentClubData, RemoveTournamentClubVariables>;

interface InsertUnplayedMatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertUnplayedMatchVariables): MutationRef<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertUnplayedMatchVariables): MutationRef<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;
  operationName: string;
}
export const insertUnplayedMatchRef: InsertUnplayedMatchRef;

export function insertUnplayedMatch(vars: InsertUnplayedMatchVariables): MutationPromise<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;
export function insertUnplayedMatch(dc: DataConnect, vars: InsertUnplayedMatchVariables): MutationPromise<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;

interface MarkMatchWalkoverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkMatchWalkoverVariables): MutationRef<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MarkMatchWalkoverVariables): MutationRef<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;
  operationName: string;
}
export const markMatchWalkoverRef: MarkMatchWalkoverRef;

export function markMatchWalkover(vars: MarkMatchWalkoverVariables): MutationPromise<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;
export function markMatchWalkover(dc: DataConnect, vars: MarkMatchWalkoverVariables): MutationPromise<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;

interface DeleteUnplayedMatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUnplayedMatchVariables): MutationRef<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteUnplayedMatchVariables): MutationRef<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;
  operationName: string;
}
export const deleteUnplayedMatchRef: DeleteUnplayedMatchRef;

export function deleteUnplayedMatch(vars: DeleteUnplayedMatchVariables): MutationPromise<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;
export function deleteUnplayedMatch(dc: DataConnect, vars: DeleteUnplayedMatchVariables): MutationPromise<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;

interface SaveClubProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubProfileVariables): MutationRef<SaveClubProfileData, SaveClubProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveClubProfileVariables): MutationRef<SaveClubProfileData, SaveClubProfileVariables>;
  operationName: string;
}
export const saveClubProfileRef: SaveClubProfileRef;

export function saveClubProfile(vars: SaveClubProfileVariables): MutationPromise<SaveClubProfileData, SaveClubProfileVariables>;
export function saveClubProfile(dc: DataConnect, vars: SaveClubProfileVariables): MutationPromise<SaveClubProfileData, SaveClubProfileVariables>;

interface ScheduleOfficialMatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ScheduleOfficialMatchVariables): MutationRef<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ScheduleOfficialMatchVariables): MutationRef<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;
  operationName: string;
}
export const scheduleOfficialMatchRef: ScheduleOfficialMatchRef;

export function scheduleOfficialMatch(vars: ScheduleOfficialMatchVariables): MutationPromise<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;
export function scheduleOfficialMatch(dc: DataConnect, vars: ScheduleOfficialMatchVariables): MutationPromise<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;

interface ClearMatchCourtHoldsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearMatchCourtHoldsVariables): MutationRef<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClearMatchCourtHoldsVariables): MutationRef<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;
  operationName: string;
}
export const clearMatchCourtHoldsRef: ClearMatchCourtHoldsRef;

export function clearMatchCourtHolds(vars: ClearMatchCourtHoldsVariables): MutationPromise<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;
export function clearMatchCourtHolds(dc: DataConnect, vars: ClearMatchCourtHoldsVariables): MutationPromise<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;

interface SaveMatchCourtHoldRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveMatchCourtHoldVariables): MutationRef<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveMatchCourtHoldVariables): MutationRef<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;
  operationName: string;
}
export const saveMatchCourtHoldRef: SaveMatchCourtHoldRef;

export function saveMatchCourtHold(vars: SaveMatchCourtHoldVariables): MutationPromise<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;
export function saveMatchCourtHold(dc: DataConnect, vars: SaveMatchCourtHoldVariables): MutationPromise<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;

interface SaveMatchScoreRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveMatchScoreVariables): MutationRef<SaveMatchScoreData, SaveMatchScoreVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveMatchScoreVariables): MutationRef<SaveMatchScoreData, SaveMatchScoreVariables>;
  operationName: string;
}
export const saveMatchScoreRef: SaveMatchScoreRef;

export function saveMatchScore(vars: SaveMatchScoreVariables): MutationPromise<SaveMatchScoreData, SaveMatchScoreVariables>;
export function saveMatchScore(dc: DataConnect, vars: SaveMatchScoreVariables): MutationPromise<SaveMatchScoreData, SaveMatchScoreVariables>;

interface ClearMatchEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearMatchEventsVariables): MutationRef<ClearMatchEventsData, ClearMatchEventsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClearMatchEventsVariables): MutationRef<ClearMatchEventsData, ClearMatchEventsVariables>;
  operationName: string;
}
export const clearMatchEventsRef: ClearMatchEventsRef;

export function clearMatchEvents(vars: ClearMatchEventsVariables): MutationPromise<ClearMatchEventsData, ClearMatchEventsVariables>;
export function clearMatchEvents(dc: DataConnect, vars: ClearMatchEventsVariables): MutationPromise<ClearMatchEventsData, ClearMatchEventsVariables>;

interface ActivateTournamentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ActivateTournamentVariables): MutationRef<ActivateTournamentData, ActivateTournamentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ActivateTournamentVariables): MutationRef<ActivateTournamentData, ActivateTournamentVariables>;
  operationName: string;
}
export const activateTournamentRef: ActivateTournamentRef;

export function activateTournament(vars: ActivateTournamentVariables): MutationPromise<ActivateTournamentData, ActivateTournamentVariables>;
export function activateTournament(dc: DataConnect, vars: ActivateTournamentVariables): MutationPromise<ActivateTournamentData, ActivateTournamentVariables>;

interface InsertMatchGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertMatchGoalVariables): MutationRef<InsertMatchGoalData, InsertMatchGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertMatchGoalVariables): MutationRef<InsertMatchGoalData, InsertMatchGoalVariables>;
  operationName: string;
}
export const insertMatchGoalRef: InsertMatchGoalRef;

export function insertMatchGoal(vars: InsertMatchGoalVariables): MutationPromise<InsertMatchGoalData, InsertMatchGoalVariables>;
export function insertMatchGoal(dc: DataConnect, vars: InsertMatchGoalVariables): MutationPromise<InsertMatchGoalData, InsertMatchGoalVariables>;

interface InsertMatchCardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertMatchCardVariables): MutationRef<InsertMatchCardData, InsertMatchCardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertMatchCardVariables): MutationRef<InsertMatchCardData, InsertMatchCardVariables>;
  operationName: string;
}
export const insertMatchCardRef: InsertMatchCardRef;

export function insertMatchCard(vars: InsertMatchCardVariables): MutationPromise<InsertMatchCardData, InsertMatchCardVariables>;
export function insertMatchCard(dc: DataConnect, vars: InsertMatchCardVariables): MutationPromise<InsertMatchCardData, InsertMatchCardVariables>;

interface InsertTimedMatchGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertTimedMatchGoalVariables): MutationRef<InsertTimedMatchGoalData, InsertTimedMatchGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertTimedMatchGoalVariables): MutationRef<InsertTimedMatchGoalData, InsertTimedMatchGoalVariables>;
  operationName: string;
}
export const insertTimedMatchGoalRef: InsertTimedMatchGoalRef;

export function insertTimedMatchGoal(vars: InsertTimedMatchGoalVariables): MutationPromise<InsertTimedMatchGoalData, InsertTimedMatchGoalVariables>;
export function insertTimedMatchGoal(dc: DataConnect, vars: InsertTimedMatchGoalVariables): MutationPromise<InsertTimedMatchGoalData, InsertTimedMatchGoalVariables>;

interface AddLiveMatchGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddLiveMatchGoalVariables): MutationRef<AddLiveMatchGoalData, AddLiveMatchGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddLiveMatchGoalVariables): MutationRef<AddLiveMatchGoalData, AddLiveMatchGoalVariables>;
  operationName: string;
}
export const addLiveMatchGoalRef: AddLiveMatchGoalRef;

export function addLiveMatchGoal(vars: AddLiveMatchGoalVariables): MutationPromise<AddLiveMatchGoalData, AddLiveMatchGoalVariables>;
export function addLiveMatchGoal(dc: DataConnect, vars: AddLiveMatchGoalVariables): MutationPromise<AddLiveMatchGoalData, AddLiveMatchGoalVariables>;

interface DeleteLiveMatchGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteLiveMatchGoalVariables): MutationRef<DeleteLiveMatchGoalData, DeleteLiveMatchGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteLiveMatchGoalVariables): MutationRef<DeleteLiveMatchGoalData, DeleteLiveMatchGoalVariables>;
  operationName: string;
}
export const deleteLiveMatchGoalRef: DeleteLiveMatchGoalRef;

export function deleteLiveMatchGoal(vars: DeleteLiveMatchGoalVariables): MutationPromise<DeleteLiveMatchGoalData, DeleteLiveMatchGoalVariables>;
export function deleteLiveMatchGoal(dc: DataConnect, vars: DeleteLiveMatchGoalVariables): MutationPromise<DeleteLiveMatchGoalData, DeleteLiveMatchGoalVariables>;

interface AddLiveMatchCardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddLiveMatchCardVariables): MutationRef<AddLiveMatchCardData, AddLiveMatchCardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddLiveMatchCardVariables): MutationRef<AddLiveMatchCardData, AddLiveMatchCardVariables>;
  operationName: string;
}
export const addLiveMatchCardRef: AddLiveMatchCardRef;

export function addLiveMatchCard(vars: AddLiveMatchCardVariables): MutationPromise<AddLiveMatchCardData, AddLiveMatchCardVariables>;
export function addLiveMatchCard(dc: DataConnect, vars: AddLiveMatchCardVariables): MutationPromise<AddLiveMatchCardData, AddLiveMatchCardVariables>;

interface DeleteLiveMatchCardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteLiveMatchCardVariables): MutationRef<DeleteLiveMatchCardData, DeleteLiveMatchCardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteLiveMatchCardVariables): MutationRef<DeleteLiveMatchCardData, DeleteLiveMatchCardVariables>;
  operationName: string;
}
export const deleteLiveMatchCardRef: DeleteLiveMatchCardRef;

export function deleteLiveMatchCard(vars: DeleteLiveMatchCardVariables): MutationPromise<DeleteLiveMatchCardData, DeleteLiveMatchCardVariables>;
export function deleteLiveMatchCard(dc: DataConnect, vars: DeleteLiveMatchCardVariables): MutationPromise<DeleteLiveMatchCardData, DeleteLiveMatchCardVariables>;

interface FinishLiveMatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: FinishLiveMatchVariables): MutationRef<FinishLiveMatchData, FinishLiveMatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: FinishLiveMatchVariables): MutationRef<FinishLiveMatchData, FinishLiveMatchVariables>;
  operationName: string;
}
export const finishLiveMatchRef: FinishLiveMatchRef;

export function finishLiveMatch(vars: FinishLiveMatchVariables): MutationPromise<FinishLiveMatchData, FinishLiveMatchVariables>;
export function finishLiveMatch(dc: DataConnect, vars: FinishLiveMatchVariables): MutationPromise<FinishLiveMatchData, FinishLiveMatchVariables>;

interface SubmitInquiryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitInquiryVariables): MutationRef<SubmitInquiryData, SubmitInquiryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SubmitInquiryVariables): MutationRef<SubmitInquiryData, SubmitInquiryVariables>;
  operationName: string;
}
export const submitInquiryRef: SubmitInquiryRef;

export function submitInquiry(vars: SubmitInquiryVariables): MutationPromise<SubmitInquiryData, SubmitInquiryVariables>;
export function submitInquiry(dc: DataConnect, vars: SubmitInquiryVariables): MutationPromise<SubmitInquiryData, SubmitInquiryVariables>;

interface SubmitTeamApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitTeamApplicationVariables): MutationRef<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SubmitTeamApplicationVariables): MutationRef<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;
  operationName: string;
}
export const submitTeamApplicationRef: SubmitTeamApplicationRef;

export function submitTeamApplication(vars: SubmitTeamApplicationVariables): MutationPromise<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;
export function submitTeamApplication(dc: DataConnect, vars: SubmitTeamApplicationVariables): MutationPromise<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;

interface EnsureMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnsureMyProfileVariables): MutationRef<EnsureMyProfileData, EnsureMyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: EnsureMyProfileVariables): MutationRef<EnsureMyProfileData, EnsureMyProfileVariables>;
  operationName: string;
}
export const ensureMyProfileRef: EnsureMyProfileRef;

export function ensureMyProfile(vars: EnsureMyProfileVariables): MutationPromise<EnsureMyProfileData, EnsureMyProfileVariables>;
export function ensureMyProfile(dc: DataConnect, vars: EnsureMyProfileVariables): MutationPromise<EnsureMyProfileData, EnsureMyProfileVariables>;

interface SavePlayerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlayerVariables): MutationRef<SavePlayerData, SavePlayerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SavePlayerVariables): MutationRef<SavePlayerData, SavePlayerVariables>;
  operationName: string;
}
export const savePlayerRef: SavePlayerRef;

export function savePlayer(vars: SavePlayerVariables): MutationPromise<SavePlayerData, SavePlayerVariables>;
export function savePlayer(dc: DataConnect, vars: SavePlayerVariables): MutationPromise<SavePlayerData, SavePlayerVariables>;

interface DeletePlayerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePlayerVariables): MutationRef<DeletePlayerData, DeletePlayerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePlayerVariables): MutationRef<DeletePlayerData, DeletePlayerVariables>;
  operationName: string;
}
export const deletePlayerRef: DeletePlayerRef;

export function deletePlayer(vars: DeletePlayerVariables): MutationPromise<DeletePlayerData, DeletePlayerVariables>;
export function deletePlayer(dc: DataConnect, vars: DeletePlayerVariables): MutationPromise<DeletePlayerData, DeletePlayerVariables>;

interface SaveClubEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubEventVariables): MutationRef<SaveClubEventData, SaveClubEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveClubEventVariables): MutationRef<SaveClubEventData, SaveClubEventVariables>;
  operationName: string;
}
export const saveClubEventRef: SaveClubEventRef;

export function saveClubEvent(vars: SaveClubEventVariables): MutationPromise<SaveClubEventData, SaveClubEventVariables>;
export function saveClubEvent(dc: DataConnect, vars: SaveClubEventVariables): MutationPromise<SaveClubEventData, SaveClubEventVariables>;

interface DeleteClubEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClubEventVariables): MutationRef<DeleteClubEventData, DeleteClubEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteClubEventVariables): MutationRef<DeleteClubEventData, DeleteClubEventVariables>;
  operationName: string;
}
export const deleteClubEventRef: DeleteClubEventRef;

export function deleteClubEvent(vars: DeleteClubEventVariables): MutationPromise<DeleteClubEventData, DeleteClubEventVariables>;
export function deleteClubEvent(dc: DataConnect, vars: DeleteClubEventVariables): MutationPromise<DeleteClubEventData, DeleteClubEventVariables>;

interface AddTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddTransactionVariables): MutationRef<AddTransactionData, AddTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddTransactionVariables): MutationRef<AddTransactionData, AddTransactionVariables>;
  operationName: string;
}
export const addTransactionRef: AddTransactionRef;

export function addTransaction(vars: AddTransactionVariables): MutationPromise<AddTransactionData, AddTransactionVariables>;
export function addTransaction(dc: DataConnect, vars: AddTransactionVariables): MutationPromise<AddTransactionData, AddTransactionVariables>;

interface SetGoalContributionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetGoalContributionVariables): MutationRef<SetGoalContributionData, SetGoalContributionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetGoalContributionVariables): MutationRef<SetGoalContributionData, SetGoalContributionVariables>;
  operationName: string;
}
export const setGoalContributionRef: SetGoalContributionRef;

export function setGoalContribution(vars: SetGoalContributionVariables): MutationPromise<SetGoalContributionData, SetGoalContributionVariables>;
export function setGoalContribution(dc: DataConnect, vars: SetGoalContributionVariables): MutationPromise<SetGoalContributionData, SetGoalContributionVariables>;

interface SaveInventoryItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveInventoryItemVariables): MutationRef<SaveInventoryItemData, SaveInventoryItemVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveInventoryItemVariables): MutationRef<SaveInventoryItemData, SaveInventoryItemVariables>;
  operationName: string;
}
export const saveInventoryItemRef: SaveInventoryItemRef;

export function saveInventoryItem(vars: SaveInventoryItemVariables): MutationPromise<SaveInventoryItemData, SaveInventoryItemVariables>;
export function saveInventoryItem(dc: DataConnect, vars: SaveInventoryItemVariables): MutationPromise<SaveInventoryItemData, SaveInventoryItemVariables>;

interface CreateCourtHoldRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCourtHoldVariables): MutationRef<CreateCourtHoldData, CreateCourtHoldVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCourtHoldVariables): MutationRef<CreateCourtHoldData, CreateCourtHoldVariables>;
  operationName: string;
}
export const createCourtHoldRef: CreateCourtHoldRef;

export function createCourtHold(vars: CreateCourtHoldVariables): MutationPromise<CreateCourtHoldData, CreateCourtHoldVariables>;
export function createCourtHold(dc: DataConnect, vars: CreateCourtHoldVariables): MutationPromise<CreateCourtHoldData, CreateCourtHoldVariables>;

interface DeleteCourtHoldRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourtHoldVariables): MutationRef<DeleteCourtHoldData, DeleteCourtHoldVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCourtHoldVariables): MutationRef<DeleteCourtHoldData, DeleteCourtHoldVariables>;
  operationName: string;
}
export const deleteCourtHoldRef: DeleteCourtHoldRef;

export function deleteCourtHold(vars: DeleteCourtHoldVariables): MutationPromise<DeleteCourtHoldData, DeleteCourtHoldVariables>;
export function deleteCourtHold(dc: DataConnect, vars: DeleteCourtHoldVariables): MutationPromise<DeleteCourtHoldData, DeleteCourtHoldVariables>;

interface ClubBySlugRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubBySlugVariables): QueryRef<ClubBySlugData, ClubBySlugVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClubBySlugVariables): QueryRef<ClubBySlugData, ClubBySlugVariables>;
  operationName: string;
}
export const clubBySlugRef: ClubBySlugRef;

export function clubBySlug(vars: ClubBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<ClubBySlugData, ClubBySlugVariables>;
export function clubBySlug(dc: DataConnect, vars: ClubBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<ClubBySlugData, ClubBySlugVariables>;

interface TeamsPageRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<TeamsPageData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<TeamsPageData, undefined>;
  operationName: string;
}
export const teamsPageRef: TeamsPageRef;

export function teamsPage(options?: ExecuteQueryOptions): QueryPromise<TeamsPageData, undefined>;
export function teamsPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<TeamsPageData, undefined>;

interface SearchClubsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchClubsVariables): QueryRef<SearchClubsData, SearchClubsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchClubsVariables): QueryRef<SearchClubsData, SearchClubsVariables>;
  operationName: string;
}
export const searchClubsRef: SearchClubsRef;

export function searchClubs(vars: SearchClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchClubsData, SearchClubsVariables>;
export function searchClubs(dc: DataConnect, vars: SearchClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchClubsData, SearchClubsVariables>;

interface ContactPageRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ContactPageData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ContactPageData, undefined>;
  operationName: string;
}
export const contactPageRef: ContactPageRef;

export function contactPage(options?: ExecuteQueryOptions): QueryPromise<ContactPageData, undefined>;
export function contactPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ContactPageData, undefined>;

interface PlatformClaimOpenRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PlatformClaimOpenData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<PlatformClaimOpenData, undefined>;
  operationName: string;
}
export const platformClaimOpenRef: PlatformClaimOpenRef;

export function platformClaimOpen(options?: ExecuteQueryOptions): QueryPromise<PlatformClaimOpenData, undefined>;
export function platformClaimOpen(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PlatformClaimOpenData, undefined>;

interface PlatformChromeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PlatformChromeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<PlatformChromeData, undefined>;
  operationName: string;
}
export const platformChromeRef: PlatformChromeRef;

export function platformChrome(options?: ExecuteQueryOptions): QueryPromise<PlatformChromeData, undefined>;
export function platformChrome(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PlatformChromeData, undefined>;

interface PlatformBannerRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PlatformBannerData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<PlatformBannerData, undefined>;
  operationName: string;
}
export const platformBannerRef: PlatformBannerRef;

export function platformBanner(options?: ExecuteQueryOptions): QueryPromise<PlatformBannerData, undefined>;
export function platformBanner(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PlatformBannerData, undefined>;

interface HomePageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: HomePageVariables): QueryRef<HomePageData, HomePageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: HomePageVariables): QueryRef<HomePageData, HomePageVariables>;
  operationName: string;
}
export const homePageRef: HomePageRef;

export function homePage(vars: HomePageVariables, options?: ExecuteQueryOptions): QueryPromise<HomePageData, HomePageVariables>;
export function homePage(dc: DataConnect, vars: HomePageVariables, options?: ExecuteQueryOptions): QueryPromise<HomePageData, HomePageVariables>;

interface LiveMatchesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: LiveMatchesVariables): QueryRef<LiveMatchesData, LiveMatchesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: LiveMatchesVariables): QueryRef<LiveMatchesData, LiveMatchesVariables>;
  operationName: string;
}
export const liveMatchesRef: LiveMatchesRef;

export function liveMatches(vars: LiveMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<LiveMatchesData, LiveMatchesVariables>;
export function liveMatches(dc: DataConnect, vars: LiveMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<LiveMatchesData, LiveMatchesVariables>;

interface RegisterTeamPageRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<RegisterTeamPageData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<RegisterTeamPageData, undefined>;
  operationName: string;
}
export const registerTeamPageRef: RegisterTeamPageRef;

export function registerTeamPage(options?: ExecuteQueryOptions): QueryPromise<RegisterTeamPageData, undefined>;
export function registerTeamPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<RegisterTeamPageData, undefined>;

interface MatchesPageRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MatchesPageData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<MatchesPageData, undefined>;
  operationName: string;
}
export const matchesPageRef: MatchesPageRef;

export function matchesPage(options?: ExecuteQueryOptions): QueryPromise<MatchesPageData, undefined>;
export function matchesPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<MatchesPageData, undefined>;

interface ActiveClubsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ActiveClubsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ActiveClubsData, undefined>;
  operationName: string;
}
export const activeClubsRef: ActiveClubsRef;

export function activeClubs(options?: ExecuteQueryOptions): QueryPromise<ActiveClubsData, undefined>;
export function activeClubs(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ActiveClubsData, undefined>;

interface CategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<CategoriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<CategoriesData, undefined>;
  operationName: string;
}
export const categoriesRef: CategoriesRef;

export function categories(options?: ExecuteQueryOptions): QueryPromise<CategoriesData, undefined>;
export function categories(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<CategoriesData, undefined>;

interface SeasonsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<SeasonsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<SeasonsData, undefined>;
  operationName: string;
}
export const seasonsRef: SeasonsRef;

export function seasons(options?: ExecuteQueryOptions): QueryPromise<SeasonsData, undefined>;
export function seasons(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<SeasonsData, undefined>;

interface TournamentArchiveRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<TournamentArchiveData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<TournamentArchiveData, undefined>;
  operationName: string;
}
export const tournamentArchiveRef: TournamentArchiveRef;

export function tournamentArchive(options?: ExecuteQueryOptions): QueryPromise<TournamentArchiveData, undefined>;
export function tournamentArchive(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<TournamentArchiveData, undefined>;

interface TournamentsBySeasonRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentsBySeasonVariables): QueryRef<TournamentsBySeasonData, TournamentsBySeasonVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TournamentsBySeasonVariables): QueryRef<TournamentsBySeasonData, TournamentsBySeasonVariables>;
  operationName: string;
}
export const tournamentsBySeasonRef: TournamentsBySeasonRef;

export function tournamentsBySeason(vars: TournamentsBySeasonVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentsBySeasonData, TournamentsBySeasonVariables>;
export function tournamentsBySeason(dc: DataConnect, vars: TournamentsBySeasonVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentsBySeasonData, TournamentsBySeasonVariables>;

interface TournamentScreenRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentScreenVariables): QueryRef<TournamentScreenData, TournamentScreenVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TournamentScreenVariables): QueryRef<TournamentScreenData, TournamentScreenVariables>;
  operationName: string;
}
export const tournamentScreenRef: TournamentScreenRef;

export function tournamentScreen(vars: TournamentScreenVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScreenData, TournamentScreenVariables>;
export function tournamentScreen(dc: DataConnect, vars: TournamentScreenVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScreenData, TournamentScreenVariables>;

interface MatchSummaryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchSummaryVariables): QueryRef<MatchSummaryData, MatchSummaryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MatchSummaryVariables): QueryRef<MatchSummaryData, MatchSummaryVariables>;
  operationName: string;
}
export const matchSummaryRef: MatchSummaryRef;

export function matchSummary(vars: MatchSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSummaryData, MatchSummaryVariables>;
export function matchSummary(dc: DataConnect, vars: MatchSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSummaryData, MatchSummaryVariables>;

interface MatchDetailRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchDetailVariables): QueryRef<MatchDetailData, MatchDetailVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MatchDetailVariables): QueryRef<MatchDetailData, MatchDetailVariables>;
  operationName: string;
}
export const matchDetailRef: MatchDetailRef;

export function matchDetail(vars: MatchDetailVariables, options?: ExecuteQueryOptions): QueryPromise<MatchDetailData, MatchDetailVariables>;
export function matchDetail(dc: DataConnect, vars: MatchDetailVariables, options?: ExecuteQueryOptions): QueryPromise<MatchDetailData, MatchDetailVariables>;

interface MatchPreviewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchPreviewVariables): QueryRef<MatchPreviewData, MatchPreviewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MatchPreviewVariables): QueryRef<MatchPreviewData, MatchPreviewVariables>;
  operationName: string;
}
export const matchPreviewRef: MatchPreviewRef;

export function matchPreview(vars: MatchPreviewVariables, options?: ExecuteQueryOptions): QueryPromise<MatchPreviewData, MatchPreviewVariables>;
export function matchPreview(dc: DataConnect, vars: MatchPreviewVariables, options?: ExecuteQueryOptions): QueryPromise<MatchPreviewData, MatchPreviewVariables>;

interface MatchScoreSheetRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchScoreSheetVariables): QueryRef<MatchScoreSheetData, MatchScoreSheetVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MatchScoreSheetVariables): QueryRef<MatchScoreSheetData, MatchScoreSheetVariables>;
  operationName: string;
}
export const matchScoreSheetRef: MatchScoreSheetRef;

export function matchScoreSheet(vars: MatchScoreSheetVariables, options?: ExecuteQueryOptions): QueryPromise<MatchScoreSheetData, MatchScoreSheetVariables>;
export function matchScoreSheet(dc: DataConnect, vars: MatchScoreSheetVariables, options?: ExecuteQueryOptions): QueryPromise<MatchScoreSheetData, MatchScoreSheetVariables>;

interface CourtBusyOnDateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CourtBusyOnDateVariables): QueryRef<CourtBusyOnDateData, CourtBusyOnDateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CourtBusyOnDateVariables): QueryRef<CourtBusyOnDateData, CourtBusyOnDateVariables>;
  operationName: string;
}
export const courtBusyOnDateRef: CourtBusyOnDateRef;

export function courtBusyOnDate(vars: CourtBusyOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtBusyOnDateData, CourtBusyOnDateVariables>;
export function courtBusyOnDate(dc: DataConnect, vars: CourtBusyOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtBusyOnDateData, CourtBusyOnDateVariables>;

interface MatchesByTournamentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchesByTournamentVariables): QueryRef<MatchesByTournamentData, MatchesByTournamentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MatchesByTournamentVariables): QueryRef<MatchesByTournamentData, MatchesByTournamentVariables>;
  operationName: string;
}
export const matchesByTournamentRef: MatchesByTournamentRef;

export function matchesByTournament(vars: MatchesByTournamentVariables, options?: ExecuteQueryOptions): QueryPromise<MatchesByTournamentData, MatchesByTournamentVariables>;
export function matchesByTournament(dc: DataConnect, vars: MatchesByTournamentVariables, options?: ExecuteQueryOptions): QueryPromise<MatchesByTournamentData, MatchesByTournamentVariables>;

interface ClubScopedMatchesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubScopedMatchesVariables): QueryRef<ClubScopedMatchesData, ClubScopedMatchesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClubScopedMatchesVariables): QueryRef<ClubScopedMatchesData, ClubScopedMatchesVariables>;
  operationName: string;
}
export const clubScopedMatchesRef: ClubScopedMatchesRef;

export function clubScopedMatches(vars: ClubScopedMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScopedMatchesData, ClubScopedMatchesVariables>;
export function clubScopedMatches(dc: DataConnect, vars: ClubScopedMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScopedMatchesData, ClubScopedMatchesVariables>;

interface UpcomingMatchesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpcomingMatchesVariables): QueryRef<UpcomingMatchesData, UpcomingMatchesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpcomingMatchesVariables): QueryRef<UpcomingMatchesData, UpcomingMatchesVariables>;
  operationName: string;
}
export const upcomingMatchesRef: UpcomingMatchesRef;

export function upcomingMatches(vars: UpcomingMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<UpcomingMatchesData, UpcomingMatchesVariables>;
export function upcomingMatches(dc: DataConnect, vars: UpcomingMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<UpcomingMatchesData, UpcomingMatchesVariables>;

interface TournamentStandingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentStandingsVariables): QueryRef<TournamentStandingsData, TournamentStandingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TournamentStandingsVariables): QueryRef<TournamentStandingsData, TournamentStandingsVariables>;
  operationName: string;
}
export const tournamentStandingsRef: TournamentStandingsRef;

export function tournamentStandings(vars: TournamentStandingsVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentStandingsData, TournamentStandingsVariables>;
export function tournamentStandings(dc: DataConnect, vars: TournamentStandingsVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentStandingsData, TournamentStandingsVariables>;

interface TournamentScorersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentScorersVariables): QueryRef<TournamentScorersData, TournamentScorersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TournamentScorersVariables): QueryRef<TournamentScorersData, TournamentScorersVariables>;
  operationName: string;
}
export const tournamentScorersRef: TournamentScorersRef;

export function tournamentScorers(vars: TournamentScorersVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScorersData, TournamentScorersVariables>;
export function tournamentScorers(dc: DataConnect, vars: TournamentScorersVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScorersData, TournamentScorersVariables>;

interface CourtsPageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CourtsPageVariables): QueryRef<CourtsPageData, CourtsPageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CourtsPageVariables): QueryRef<CourtsPageData, CourtsPageVariables>;
  operationName: string;
}
export const courtsPageRef: CourtsPageRef;

export function courtsPage(vars: CourtsPageVariables, options?: ExecuteQueryOptions): QueryPromise<CourtsPageData, CourtsPageVariables>;
export function courtsPage(dc: DataConnect, vars: CourtsPageVariables, options?: ExecuteQueryOptions): QueryPromise<CourtsPageData, CourtsPageVariables>;

interface CourtHoldsOnDateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CourtHoldsOnDateVariables): QueryRef<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CourtHoldsOnDateVariables): QueryRef<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;
  operationName: string;
}
export const courtHoldsOnDateRef: CourtHoldsOnDateRef;

export function courtHoldsOnDate(vars: CourtHoldsOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;
export function courtHoldsOnDate(dc: DataConnect, vars: CourtHoldsOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;

interface LiveAdsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: LiveAdsVariables): QueryRef<LiveAdsData, LiveAdsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: LiveAdsVariables): QueryRef<LiveAdsData, LiveAdsVariables>;
  operationName: string;
}
export const liveAdsRef: LiveAdsRef;

export function liveAds(vars: LiveAdsVariables, options?: ExecuteQueryOptions): QueryPromise<LiveAdsData, LiveAdsVariables>;
export function liveAds(dc: DataConnect, vars: LiveAdsVariables, options?: ExecuteQueryOptions): QueryPromise<LiveAdsData, LiveAdsVariables>;

interface MyMembershipsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MyMembershipsVariables): QueryRef<MyMembershipsData, MyMembershipsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MyMembershipsVariables): QueryRef<MyMembershipsData, MyMembershipsVariables>;
  operationName: string;
}
export const myMembershipsRef: MyMembershipsRef;

export function myMemberships(vars: MyMembershipsVariables, options?: ExecuteQueryOptions): QueryPromise<MyMembershipsData, MyMembershipsVariables>;
export function myMemberships(dc: DataConnect, vars: MyMembershipsVariables, options?: ExecuteQueryOptions): QueryPromise<MyMembershipsData, MyMembershipsVariables>;

interface MySpacesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MySpacesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<MySpacesData, undefined>;
  operationName: string;
}
export const mySpacesRef: MySpacesRef;

export function mySpaces(options?: ExecuteQueryOptions): QueryPromise<MySpacesData, undefined>;
export function mySpaces(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<MySpacesData, undefined>;

interface MyOpenClubInvitesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MyOpenClubInvitesVariables): QueryRef<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MyOpenClubInvitesVariables): QueryRef<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;
  operationName: string;
}
export const myOpenClubInvitesRef: MyOpenClubInvitesRef;

export function myOpenClubInvites(vars: MyOpenClubInvitesVariables, options?: ExecuteQueryOptions): QueryPromise<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;
export function myOpenClubInvites(dc: DataConnect, vars: MyOpenClubInvitesVariables, options?: ExecuteQueryOptions): QueryPromise<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;

interface PlayerContributionTotalsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlayerContributionTotalsVariables): QueryRef<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PlayerContributionTotalsVariables): QueryRef<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;
  operationName: string;
}
export const playerContributionTotalsRef: PlayerContributionTotalsRef;

export function playerContributionTotals(vars: PlayerContributionTotalsVariables, options?: ExecuteQueryOptions): QueryPromise<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;
export function playerContributionTotals(dc: DataConnect, vars: PlayerContributionTotalsVariables, options?: ExecuteQueryOptions): QueryPromise<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;

