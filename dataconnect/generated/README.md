# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `app`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*AmIPlatformAdmin*](#amiplatformadmin)
  - [*PlatformAdminById*](#platformadminbyid)
  - [*ClubAdminGate*](#clubadmingate)
  - [*SignupInviteByEmail*](#signupinvitebyemail)
  - [*ClubInviteLookup*](#clubinvitelookup)
  - [*AdminClubs*](#adminclubs)
  - [*SearchAdminClubs*](#searchadminclubs)
  - [*AdminClubPeople*](#adminclubpeople)
  - [*AdminCompetition*](#admincompetition)
  - [*AdminCover*](#admincover)
  - [*AdminAds*](#adminads)
  - [*AdminInbox*](#admininbox)
  - [*AdminAdmins*](#adminadmins)
  - [*MyPlatformAdminInvite*](#myplatformadmininvite)
  - [*AdminCourts*](#admincourts)
  - [*TournamentEditor*](#tournamenteditor)
  - [*ScheduleCourts*](#schedulecourts)
  - [*MatchSlotHints*](#matchslothints)
  - [*ClubScreen*](#clubscreen)
  - [*ClubBySlug*](#clubbyslug)
  - [*TeamsPage*](#teamspage)
  - [*SearchClubs*](#searchclubs)
  - [*ContactPage*](#contactpage)
  - [*PlatformClaimOpen*](#platformclaimopen)
  - [*PlatformChrome*](#platformchrome)
  - [*PlatformBanner*](#platformbanner)
  - [*HomePage*](#homepage)
  - [*RegisterTeamPage*](#registerteampage)
  - [*MatchesPage*](#matchespage)
  - [*ActiveClubs*](#activeclubs)
  - [*Categories*](#categories)
  - [*Seasons*](#seasons)
  - [*TournamentArchive*](#tournamentarchive)
  - [*TournamentsBySeason*](#tournamentsbyseason)
  - [*TournamentScreen*](#tournamentscreen)
  - [*MatchSummary*](#matchsummary)
  - [*MatchScoreSheet*](#matchscoresheet)
  - [*CourtBusyOnDate*](#courtbusyondate)
  - [*MatchesByTournament*](#matchesbytournament)
  - [*ClubScopedMatches*](#clubscopedmatches)
  - [*UpcomingMatches*](#upcomingmatches)
  - [*TournamentStandings*](#tournamentstandings)
  - [*TournamentScorers*](#tournamentscorers)
  - [*CourtsPage*](#courtspage)
  - [*CourtHoldsOnDate*](#courtholdsondate)
  - [*LiveAds*](#liveads)
  - [*MyMemberships*](#mymemberships)
  - [*MySpaces*](#myspaces)
  - [*MyOpenClubInvites*](#myopenclubinvites)
  - [*PlayerContributionTotals*](#playercontributiontotals)
- [**Mutations**](#mutations)
  - [*BootstrapPlatformAdmin*](#bootstrapplatformadmin)
  - [*ClaimPlatformAdminInvite*](#claimplatformadmininvite)
  - [*DeleteLocality*](#deletelocality)
  - [*CreateLocality*](#createlocality)
  - [*CreateClub*](#createclub)
  - [*InsertClubHero*](#insertclubhero)
  - [*SetClubActive*](#setclubactive)
  - [*DeleteClub*](#deleteclub)
  - [*SaveClubInvite*](#saveclubinvite)
  - [*RemoveClubInvite*](#removeclubinvite)
  - [*SaveSignupInvite*](#savesignupinvite)
  - [*ClearSignupInvite*](#clearsignupinvite)
  - [*SetClubMemberRole*](#setclubmemberrole)
  - [*RemoveClubMember*](#removeclubmember)
  - [*AcceptClubInvite*](#acceptclubinvite)
  - [*DeclineClubInvite*](#declineclubinvite)
  - [*CreateSeason*](#createseason)
  - [*SetSeasonActive*](#setseasonactive)
  - [*DeleteSeason*](#deleteseason)
  - [*CreateCategory*](#createcategory)
  - [*CreateTournament*](#createtournament)
  - [*SavePlatformHeader*](#saveplatformheader)
  - [*SavePlatformCover*](#saveplatformcover)
  - [*SavePlatformSocial*](#saveplatformsocial)
  - [*ReplaceHeroImages*](#replaceheroimages)
  - [*SaveCourtSettings*](#savecourtsettings)
  - [*ClearCourtWindows*](#clearcourtwindows)
  - [*SaveCourtWindow*](#savecourtwindow)
  - [*SaveCourt*](#savecourt)
  - [*DeleteCourt*](#deletecourt)
  - [*SaveCourtHold*](#savecourthold)
  - [*DeleteManualCourtHold*](#deletemanualcourthold)
  - [*SaveAd*](#savead)
  - [*SetAdStatus*](#setadstatus)
  - [*SetAdOrder*](#setadorder)
  - [*ClearAdPlacements*](#clearadplacements)
  - [*SaveAdPlacement*](#saveadplacement)
  - [*DeleteAd*](#deletead)
  - [*SetInquiryDone*](#setinquirydone)
  - [*DeleteInquiry*](#deleteinquiry)
  - [*RejectTeamApplication*](#rejectteamapplication)
  - [*ApproveTeamApplication*](#approveteamapplication)
  - [*SavePlatformAdminInvite*](#saveplatformadmininvite)
  - [*RemovePlatformAdminInvite*](#removeplatformadmininvite)
  - [*RemovePlatformAdmin*](#removeplatformadmin)
  - [*SetClubEventScore*](#setclubeventscore)
  - [*SetClubEventLineup*](#setclubeventlineup)
  - [*SaveClubDefaultLineup*](#saveclubdefaultlineup)
  - [*ReplaceClubEventAttendees*](#replaceclubeventattendees)
  - [*ReplaceClubEventAlbum*](#replaceclubeventalbum)
  - [*ReplaceClubEventStats*](#replaceclubeventstats)
  - [*SetMatchClubLineup*](#setmatchclublineup)
  - [*ReplaceMatchAttendees*](#replacematchattendees)
  - [*SaveFinancialGoal*](#savefinancialgoal)
  - [*SetFinancialGoalStatus*](#setfinancialgoalstatus)
  - [*DeleteFinancialGoal*](#deletefinancialgoal)
  - [*DeleteTransaction*](#deletetransaction)
  - [*DeleteInventoryItem*](#deleteinventoryitem)
  - [*SaveGalleryPhoto*](#savegalleryphoto)
  - [*SwapGalleryPhotos*](#swapgalleryphotos)
  - [*PromoteGalleryPhoto*](#promotegalleryphoto)
  - [*DeleteGalleryPhoto*](#deletegalleryphoto)
  - [*ClearClubAvailability*](#clearclubavailability)
  - [*InsertClubAvailability*](#insertclubavailability)
  - [*SaveClubPortada*](#saveclubportada)
  - [*ClearClubHeroes*](#clearclubheroes)
  - [*InsertClubHeroes*](#insertclubheroes)
  - [*DeleteGalleryAlbum*](#deletegalleryalbum)
  - [*DeleteUnplayedTournament*](#deleteunplayedtournament)
  - [*UpdateTournamentSettings*](#updatetournamentsettings)
  - [*AddTournamentClub*](#addtournamentclub)
  - [*RemoveTournamentClub*](#removetournamentclub)
  - [*InsertUnplayedMatch*](#insertunplayedmatch)
  - [*MarkMatchWalkover*](#markmatchwalkover)
  - [*DeleteUnplayedMatch*](#deleteunplayedmatch)
  - [*SaveClubProfile*](#saveclubprofile)
  - [*ScheduleOfficialMatch*](#scheduleofficialmatch)
  - [*ClearMatchCourtHolds*](#clearmatchcourtholds)
  - [*SaveMatchCourtHold*](#savematchcourthold)
  - [*SaveMatchScore*](#savematchscore)
  - [*ClearMatchEvents*](#clearmatchevents)
  - [*ActivateTournament*](#activatetournament)
  - [*InsertMatchGoal*](#insertmatchgoal)
  - [*InsertMatchCard*](#insertmatchcard)
  - [*SubmitInquiry*](#submitinquiry)
  - [*SubmitTeamApplication*](#submitteamapplication)
  - [*EnsureMyProfile*](#ensuremyprofile)
  - [*SavePlayer*](#saveplayer)
  - [*DeletePlayer*](#deleteplayer)
  - [*SaveClubEvent*](#saveclubevent)
  - [*DeleteClubEvent*](#deleteclubevent)
  - [*AddTransaction*](#addtransaction)
  - [*SetGoalContribution*](#setgoalcontribution)
  - [*SaveInventoryItem*](#saveinventoryitem)
  - [*CreateCourtHold*](#createcourthold)
  - [*DeleteCourtHold*](#deletecourthold)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `app`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@clubs-platform/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@clubs-platform/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@clubs-platform/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `app` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## AmIPlatformAdmin
You can execute the `AmIPlatformAdmin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
amIPlatformAdmin(options?: ExecuteQueryOptions): QueryPromise<AmIPlatformAdminData, undefined>;

interface AmIPlatformAdminRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AmIPlatformAdminData, undefined>;
}
export const amIPlatformAdminRef: AmIPlatformAdminRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
amIPlatformAdmin(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AmIPlatformAdminData, undefined>;

interface AmIPlatformAdminRef {
  ...
  (dc: DataConnect): QueryRef<AmIPlatformAdminData, undefined>;
}
export const amIPlatformAdminRef: AmIPlatformAdminRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the amIPlatformAdminRef:
```typescript
const name = amIPlatformAdminRef.operationName;
console.log(name);
```

### Variables
The `AmIPlatformAdmin` query has no variables.
### Return Type
Recall that executing the `AmIPlatformAdmin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AmIPlatformAdminData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AmIPlatformAdminData {
  platformAdmins: ({
    email: string;
  })[];
}
```
### Using `AmIPlatformAdmin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, amIPlatformAdmin } from '@clubs-platform/dataconnect';


// Call the `amIPlatformAdmin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await amIPlatformAdmin();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await amIPlatformAdmin(dataConnect);

console.log(data.platformAdmins);

// Or, you can use the `Promise` API.
amIPlatformAdmin().then((response) => {
  const data = response.data;
  console.log(data.platformAdmins);
});
```

### Using `AmIPlatformAdmin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, amIPlatformAdminRef } from '@clubs-platform/dataconnect';


// Call the `amIPlatformAdminRef()` function to get a reference to the query.
const ref = amIPlatformAdminRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = amIPlatformAdminRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformAdmins);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformAdmins);
});
```

## PlatformAdminById
You can execute the `PlatformAdminById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
platformAdminById(vars: PlatformAdminByIdVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminByIdData, PlatformAdminByIdVariables>;

interface PlatformAdminByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformAdminByIdVariables): QueryRef<PlatformAdminByIdData, PlatformAdminByIdVariables>;
}
export const platformAdminByIdRef: PlatformAdminByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
platformAdminById(dc: DataConnect, vars: PlatformAdminByIdVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminByIdData, PlatformAdminByIdVariables>;

interface PlatformAdminByIdRef {
  ...
  (dc: DataConnect, vars: PlatformAdminByIdVariables): QueryRef<PlatformAdminByIdData, PlatformAdminByIdVariables>;
}
export const platformAdminByIdRef: PlatformAdminByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the platformAdminByIdRef:
```typescript
const name = platformAdminByIdRef.operationName;
console.log(name);
```

### Variables
The `PlatformAdminById` query requires an argument of type `PlatformAdminByIdVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PlatformAdminByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `PlatformAdminById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlatformAdminByIdData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlatformAdminByIdData {
  platformAdmin?: {
    email: string;
  };
}
```
### Using `PlatformAdminById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, platformAdminById, PlatformAdminByIdVariables } from '@clubs-platform/dataconnect';

// The `PlatformAdminById` query requires an argument of type `PlatformAdminByIdVariables`:
const platformAdminByIdVars: PlatformAdminByIdVariables = {
  id: ..., 
};

// Call the `platformAdminById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await platformAdminById(platformAdminByIdVars);
// Variables can be defined inline as well.
const { data } = await platformAdminById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await platformAdminById(dataConnect, platformAdminByIdVars);

console.log(data.platformAdmin);

// Or, you can use the `Promise` API.
platformAdminById(platformAdminByIdVars).then((response) => {
  const data = response.data;
  console.log(data.platformAdmin);
});
```

### Using `PlatformAdminById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, platformAdminByIdRef, PlatformAdminByIdVariables } from '@clubs-platform/dataconnect';

// The `PlatformAdminById` query requires an argument of type `PlatformAdminByIdVariables`:
const platformAdminByIdVars: PlatformAdminByIdVariables = {
  id: ..., 
};

// Call the `platformAdminByIdRef()` function to get a reference to the query.
const ref = platformAdminByIdRef(platformAdminByIdVars);
// Variables can be defined inline as well.
const ref = platformAdminByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = platformAdminByIdRef(dataConnect, platformAdminByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformAdmin);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformAdmin);
});
```

## ClubAdminGate
You can execute the `ClubAdminGate` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clubAdminGate(vars: ClubAdminGateVariables, options?: ExecuteQueryOptions): QueryPromise<ClubAdminGateData, ClubAdminGateVariables>;

interface ClubAdminGateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubAdminGateVariables): QueryRef<ClubAdminGateData, ClubAdminGateVariables>;
}
export const clubAdminGateRef: ClubAdminGateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
clubAdminGate(dc: DataConnect, vars: ClubAdminGateVariables, options?: ExecuteQueryOptions): QueryPromise<ClubAdminGateData, ClubAdminGateVariables>;

interface ClubAdminGateRef {
  ...
  (dc: DataConnect, vars: ClubAdminGateVariables): QueryRef<ClubAdminGateData, ClubAdminGateVariables>;
}
export const clubAdminGateRef: ClubAdminGateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clubAdminGateRef:
```typescript
const name = clubAdminGateRef.operationName;
console.log(name);
```

### Variables
The `ClubAdminGate` query requires an argument of type `ClubAdminGateVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClubAdminGateVariables {
  clubId: string;
  userId: string;
}
```
### Return Type
Recall that executing the `ClubAdminGate` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClubAdminGateData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClubAdminGateData {
  platformAdmin?: {
    email: string;
  };
  clubMember?: {
    role: MemberRole;
  };
}
```
### Using `ClubAdminGate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clubAdminGate, ClubAdminGateVariables } from '@clubs-platform/dataconnect';

// The `ClubAdminGate` query requires an argument of type `ClubAdminGateVariables`:
const clubAdminGateVars: ClubAdminGateVariables = {
  clubId: ..., 
  userId: ..., 
};

// Call the `clubAdminGate()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clubAdminGate(clubAdminGateVars);
// Variables can be defined inline as well.
const { data } = await clubAdminGate({ clubId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clubAdminGate(dataConnect, clubAdminGateVars);

console.log(data.platformAdmin);
console.log(data.clubMember);

// Or, you can use the `Promise` API.
clubAdminGate(clubAdminGateVars).then((response) => {
  const data = response.data;
  console.log(data.platformAdmin);
  console.log(data.clubMember);
});
```

### Using `ClubAdminGate`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, clubAdminGateRef, ClubAdminGateVariables } from '@clubs-platform/dataconnect';

// The `ClubAdminGate` query requires an argument of type `ClubAdminGateVariables`:
const clubAdminGateVars: ClubAdminGateVariables = {
  clubId: ..., 
  userId: ..., 
};

// Call the `clubAdminGateRef()` function to get a reference to the query.
const ref = clubAdminGateRef(clubAdminGateVars);
// Variables can be defined inline as well.
const ref = clubAdminGateRef({ clubId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clubAdminGateRef(dataConnect, clubAdminGateVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformAdmin);
console.log(data.clubMember);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformAdmin);
  console.log(data.clubMember);
});
```

## SignupInviteByEmail
You can execute the `SignupInviteByEmail` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
signupInviteByEmail(vars: SignupInviteByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<SignupInviteByEmailData, SignupInviteByEmailVariables>;

interface SignupInviteByEmailRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SignupInviteByEmailVariables): QueryRef<SignupInviteByEmailData, SignupInviteByEmailVariables>;
}
export const signupInviteByEmailRef: SignupInviteByEmailRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
signupInviteByEmail(dc: DataConnect, vars: SignupInviteByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<SignupInviteByEmailData, SignupInviteByEmailVariables>;

interface SignupInviteByEmailRef {
  ...
  (dc: DataConnect, vars: SignupInviteByEmailVariables): QueryRef<SignupInviteByEmailData, SignupInviteByEmailVariables>;
}
export const signupInviteByEmailRef: SignupInviteByEmailRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the signupInviteByEmailRef:
```typescript
const name = signupInviteByEmailRef.operationName;
console.log(name);
```

### Variables
The `SignupInviteByEmail` query requires an argument of type `SignupInviteByEmailVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SignupInviteByEmailVariables {
  emailKey: string;
}
```
### Return Type
Recall that executing the `SignupInviteByEmail` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SignupInviteByEmailData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SignupInviteByEmailData {
  signupInvite?: {
    email: string;
    platform: boolean;
    club?: {
      id: string;
    } & Club_Key;
  };
}
```
### Using `SignupInviteByEmail`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, signupInviteByEmail, SignupInviteByEmailVariables } from '@clubs-platform/dataconnect';

// The `SignupInviteByEmail` query requires an argument of type `SignupInviteByEmailVariables`:
const signupInviteByEmailVars: SignupInviteByEmailVariables = {
  emailKey: ..., 
};

// Call the `signupInviteByEmail()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await signupInviteByEmail(signupInviteByEmailVars);
// Variables can be defined inline as well.
const { data } = await signupInviteByEmail({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await signupInviteByEmail(dataConnect, signupInviteByEmailVars);

console.log(data.signupInvite);

// Or, you can use the `Promise` API.
signupInviteByEmail(signupInviteByEmailVars).then((response) => {
  const data = response.data;
  console.log(data.signupInvite);
});
```

### Using `SignupInviteByEmail`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, signupInviteByEmailRef, SignupInviteByEmailVariables } from '@clubs-platform/dataconnect';

// The `SignupInviteByEmail` query requires an argument of type `SignupInviteByEmailVariables`:
const signupInviteByEmailVars: SignupInviteByEmailVariables = {
  emailKey: ..., 
};

// Call the `signupInviteByEmailRef()` function to get a reference to the query.
const ref = signupInviteByEmailRef(signupInviteByEmailVars);
// Variables can be defined inline as well.
const ref = signupInviteByEmailRef({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = signupInviteByEmailRef(dataConnect, signupInviteByEmailVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.signupInvite);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.signupInvite);
});
```

## ClubInviteLookup
You can execute the `ClubInviteLookup` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clubInviteLookup(vars: ClubInviteLookupVariables, options?: ExecuteQueryOptions): QueryPromise<ClubInviteLookupData, ClubInviteLookupVariables>;

interface ClubInviteLookupRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubInviteLookupVariables): QueryRef<ClubInviteLookupData, ClubInviteLookupVariables>;
}
export const clubInviteLookupRef: ClubInviteLookupRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
clubInviteLookup(dc: DataConnect, vars: ClubInviteLookupVariables, options?: ExecuteQueryOptions): QueryPromise<ClubInviteLookupData, ClubInviteLookupVariables>;

interface ClubInviteLookupRef {
  ...
  (dc: DataConnect, vars: ClubInviteLookupVariables): QueryRef<ClubInviteLookupData, ClubInviteLookupVariables>;
}
export const clubInviteLookupRef: ClubInviteLookupRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clubInviteLookupRef:
```typescript
const name = clubInviteLookupRef.operationName;
console.log(name);
```

### Variables
The `ClubInviteLookup` query requires an argument of type `ClubInviteLookupVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClubInviteLookupVariables {
  clubId: string;
  emailKey: string;
  token: string;
}
```
### Return Type
Recall that executing the `ClubInviteLookup` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClubInviteLookupData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClubInviteLookup`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clubInviteLookup, ClubInviteLookupVariables } from '@clubs-platform/dataconnect';

// The `ClubInviteLookup` query requires an argument of type `ClubInviteLookupVariables`:
const clubInviteLookupVars: ClubInviteLookupVariables = {
  clubId: ..., 
  emailKey: ..., 
  token: ..., 
};

// Call the `clubInviteLookup()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clubInviteLookup(clubInviteLookupVars);
// Variables can be defined inline as well.
const { data } = await clubInviteLookup({ clubId: ..., emailKey: ..., token: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clubInviteLookup(dataConnect, clubInviteLookupVars);

console.log(data.clubInvites);

// Or, you can use the `Promise` API.
clubInviteLookup(clubInviteLookupVars).then((response) => {
  const data = response.data;
  console.log(data.clubInvites);
});
```

### Using `ClubInviteLookup`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, clubInviteLookupRef, ClubInviteLookupVariables } from '@clubs-platform/dataconnect';

// The `ClubInviteLookup` query requires an argument of type `ClubInviteLookupVariables`:
const clubInviteLookupVars: ClubInviteLookupVariables = {
  clubId: ..., 
  emailKey: ..., 
  token: ..., 
};

// Call the `clubInviteLookupRef()` function to get a reference to the query.
const ref = clubInviteLookupRef(clubInviteLookupVars);
// Variables can be defined inline as well.
const ref = clubInviteLookupRef({ clubId: ..., emailKey: ..., token: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clubInviteLookupRef(dataConnect, clubInviteLookupVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubInvites);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubInvites);
});
```

## AdminClubs
You can execute the `AdminClubs` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminClubs(options?: ExecuteQueryOptions): QueryPromise<AdminClubsData, undefined>;

interface AdminClubsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminClubsData, undefined>;
}
export const adminClubsRef: AdminClubsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminClubs(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminClubsData, undefined>;

interface AdminClubsRef {
  ...
  (dc: DataConnect): QueryRef<AdminClubsData, undefined>;
}
export const adminClubsRef: AdminClubsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminClubsRef:
```typescript
const name = adminClubsRef.operationName;
console.log(name);
```

### Variables
The `AdminClubs` query has no variables.
### Return Type
Recall that executing the `AdminClubs` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminClubsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
    locality?: {
      id: string;
    } & Locality_Key;
  } & Club_Key)[];
}
```
### Using `AdminClubs`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminClubs } from '@clubs-platform/dataconnect';


// Call the `adminClubs()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminClubs();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminClubs(dataConnect);

console.log(data.localities);
console.log(data.clubs);

// Or, you can use the `Promise` API.
adminClubs().then((response) => {
  const data = response.data;
  console.log(data.localities);
  console.log(data.clubs);
});
```

### Using `AdminClubs`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminClubsRef } from '@clubs-platform/dataconnect';


// Call the `adminClubsRef()` function to get a reference to the query.
const ref = adminClubsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminClubsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.localities);
console.log(data.clubs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.localities);
  console.log(data.clubs);
});
```

## SearchAdminClubs
You can execute the `SearchAdminClubs` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchAdminClubs(vars: SearchAdminClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchAdminClubsData, SearchAdminClubsVariables>;

interface SearchAdminClubsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchAdminClubsVariables): QueryRef<SearchAdminClubsData, SearchAdminClubsVariables>;
}
export const searchAdminClubsRef: SearchAdminClubsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchAdminClubs(dc: DataConnect, vars: SearchAdminClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchAdminClubsData, SearchAdminClubsVariables>;

interface SearchAdminClubsRef {
  ...
  (dc: DataConnect, vars: SearchAdminClubsVariables): QueryRef<SearchAdminClubsData, SearchAdminClubsVariables>;
}
export const searchAdminClubsRef: SearchAdminClubsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchAdminClubsRef:
```typescript
const name = searchAdminClubsRef.operationName;
console.log(name);
```

### Variables
The `SearchAdminClubs` query requires an argument of type `SearchAdminClubsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchAdminClubsVariables {
  term: string;
}
```
### Return Type
Recall that executing the `SearchAdminClubs` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchAdminClubsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchAdminClubsData {
  clubs?: unknown[] | null;
}
```
### Using `SearchAdminClubs`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchAdminClubs, SearchAdminClubsVariables } from '@clubs-platform/dataconnect';

// The `SearchAdminClubs` query requires an argument of type `SearchAdminClubsVariables`:
const searchAdminClubsVars: SearchAdminClubsVariables = {
  term: ..., 
};

// Call the `searchAdminClubs()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchAdminClubs(searchAdminClubsVars);
// Variables can be defined inline as well.
const { data } = await searchAdminClubs({ term: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchAdminClubs(dataConnect, searchAdminClubsVars);

console.log(data.clubs);

// Or, you can use the `Promise` API.
searchAdminClubs(searchAdminClubsVars).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

### Using `SearchAdminClubs`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchAdminClubsRef, SearchAdminClubsVariables } from '@clubs-platform/dataconnect';

// The `SearchAdminClubs` query requires an argument of type `SearchAdminClubsVariables`:
const searchAdminClubsVars: SearchAdminClubsVariables = {
  term: ..., 
};

// Call the `searchAdminClubsRef()` function to get a reference to the query.
const ref = searchAdminClubsRef(searchAdminClubsVars);
// Variables can be defined inline as well.
const ref = searchAdminClubsRef({ term: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchAdminClubsRef(dataConnect, searchAdminClubsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

## AdminClubPeople
You can execute the `AdminClubPeople` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminClubPeople(vars: AdminClubPeopleVariables, options?: ExecuteQueryOptions): QueryPromise<AdminClubPeopleData, AdminClubPeopleVariables>;

interface AdminClubPeopleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminClubPeopleVariables): QueryRef<AdminClubPeopleData, AdminClubPeopleVariables>;
}
export const adminClubPeopleRef: AdminClubPeopleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminClubPeople(dc: DataConnect, vars: AdminClubPeopleVariables, options?: ExecuteQueryOptions): QueryPromise<AdminClubPeopleData, AdminClubPeopleVariables>;

interface AdminClubPeopleRef {
  ...
  (dc: DataConnect, vars: AdminClubPeopleVariables): QueryRef<AdminClubPeopleData, AdminClubPeopleVariables>;
}
export const adminClubPeopleRef: AdminClubPeopleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminClubPeopleRef:
```typescript
const name = adminClubPeopleRef.operationName;
console.log(name);
```

### Variables
The `AdminClubPeople` query requires an argument of type `AdminClubPeopleVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AdminClubPeopleVariables {
  clubId: string;
}
```
### Return Type
Recall that executing the `AdminClubPeople` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminClubPeopleData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminClubPeople`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminClubPeople, AdminClubPeopleVariables } from '@clubs-platform/dataconnect';

// The `AdminClubPeople` query requires an argument of type `AdminClubPeopleVariables`:
const adminClubPeopleVars: AdminClubPeopleVariables = {
  clubId: ..., 
};

// Call the `adminClubPeople()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminClubPeople(adminClubPeopleVars);
// Variables can be defined inline as well.
const { data } = await adminClubPeople({ clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminClubPeople(dataConnect, adminClubPeopleVars);

console.log(data.clubMembers);
console.log(data.clubInvites);

// Or, you can use the `Promise` API.
adminClubPeople(adminClubPeopleVars).then((response) => {
  const data = response.data;
  console.log(data.clubMembers);
  console.log(data.clubInvites);
});
```

### Using `AdminClubPeople`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminClubPeopleRef, AdminClubPeopleVariables } from '@clubs-platform/dataconnect';

// The `AdminClubPeople` query requires an argument of type `AdminClubPeopleVariables`:
const adminClubPeopleVars: AdminClubPeopleVariables = {
  clubId: ..., 
};

// Call the `adminClubPeopleRef()` function to get a reference to the query.
const ref = adminClubPeopleRef(adminClubPeopleVars);
// Variables can be defined inline as well.
const ref = adminClubPeopleRef({ clubId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminClubPeopleRef(dataConnect, adminClubPeopleVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubMembers);
console.log(data.clubInvites);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubMembers);
  console.log(data.clubInvites);
});
```

## AdminCompetition
You can execute the `AdminCompetition` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminCompetition(options?: ExecuteQueryOptions): QueryPromise<AdminCompetitionData, undefined>;

interface AdminCompetitionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminCompetitionData, undefined>;
}
export const adminCompetitionRef: AdminCompetitionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminCompetition(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminCompetitionData, undefined>;

interface AdminCompetitionRef {
  ...
  (dc: DataConnect): QueryRef<AdminCompetitionData, undefined>;
}
export const adminCompetitionRef: AdminCompetitionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminCompetitionRef:
```typescript
const name = adminCompetitionRef.operationName;
console.log(name);
```

### Variables
The `AdminCompetition` query has no variables.
### Return Type
Recall that executing the `AdminCompetition` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminCompetitionData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminCompetition`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminCompetition } from '@clubs-platform/dataconnect';


// Call the `adminCompetition()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminCompetition();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminCompetition(dataConnect);

console.log(data.seasons);
console.log(data.categories);
console.log(data.tournaments);

// Or, you can use the `Promise` API.
adminCompetition().then((response) => {
  const data = response.data;
  console.log(data.seasons);
  console.log(data.categories);
  console.log(data.tournaments);
});
```

### Using `AdminCompetition`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminCompetitionRef } from '@clubs-platform/dataconnect';


// Call the `adminCompetitionRef()` function to get a reference to the query.
const ref = adminCompetitionRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminCompetitionRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.seasons);
console.log(data.categories);
console.log(data.tournaments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.seasons);
  console.log(data.categories);
  console.log(data.tournaments);
});
```

## AdminCover
You can execute the `AdminCover` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminCover(options?: ExecuteQueryOptions): QueryPromise<AdminCoverData, undefined>;

interface AdminCoverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminCoverData, undefined>;
}
export const adminCoverRef: AdminCoverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminCover(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminCoverData, undefined>;

interface AdminCoverRef {
  ...
  (dc: DataConnect): QueryRef<AdminCoverData, undefined>;
}
export const adminCoverRef: AdminCoverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminCoverRef:
```typescript
const name = adminCoverRef.operationName;
console.log(name);
```

### Variables
The `AdminCover` query has no variables.
### Return Type
Recall that executing the `AdminCover` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminCoverData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminCover`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminCover } from '@clubs-platform/dataconnect';


// Call the `adminCover()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminCover();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminCover(dataConnect);

console.log(data.platformSettings);
console.log(data.platformHeroImages);

// Or, you can use the `Promise` API.
adminCover().then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.platformHeroImages);
});
```

### Using `AdminCover`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminCoverRef } from '@clubs-platform/dataconnect';


// Call the `adminCoverRef()` function to get a reference to the query.
const ref = adminCoverRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminCoverRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);
console.log(data.platformHeroImages);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.platformHeroImages);
});
```

## AdminAds
You can execute the `AdminAds` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminAds(options?: ExecuteQueryOptions): QueryPromise<AdminAdsData, undefined>;

interface AdminAdsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminAdsData, undefined>;
}
export const adminAdsRef: AdminAdsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminAds(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminAdsData, undefined>;

interface AdminAdsRef {
  ...
  (dc: DataConnect): QueryRef<AdminAdsData, undefined>;
}
export const adminAdsRef: AdminAdsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminAdsRef:
```typescript
const name = adminAdsRef.operationName;
console.log(name);
```

### Variables
The `AdminAds` query has no variables.
### Return Type
Recall that executing the `AdminAds` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminAdsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminAds`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminAds } from '@clubs-platform/dataconnect';


// Call the `adminAds()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminAds();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminAds(dataConnect);

console.log(data.ads);

// Or, you can use the `Promise` API.
adminAds().then((response) => {
  const data = response.data;
  console.log(data.ads);
});
```

### Using `AdminAds`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminAdsRef } from '@clubs-platform/dataconnect';


// Call the `adminAdsRef()` function to get a reference to the query.
const ref = adminAdsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminAdsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.ads);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.ads);
});
```

## AdminInbox
You can execute the `AdminInbox` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminInbox(options?: ExecuteQueryOptions): QueryPromise<AdminInboxData, undefined>;

interface AdminInboxRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminInboxData, undefined>;
}
export const adminInboxRef: AdminInboxRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminInbox(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminInboxData, undefined>;

interface AdminInboxRef {
  ...
  (dc: DataConnect): QueryRef<AdminInboxData, undefined>;
}
export const adminInboxRef: AdminInboxRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminInboxRef:
```typescript
const name = adminInboxRef.operationName;
console.log(name);
```

### Variables
The `AdminInbox` query has no variables.
### Return Type
Recall that executing the `AdminInbox` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminInboxData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminInbox`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminInbox } from '@clubs-platform/dataconnect';


// Call the `adminInbox()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminInbox();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminInbox(dataConnect);

console.log(data.localities);
console.log(data.inquiries);
console.log(data.teamApplications);

// Or, you can use the `Promise` API.
adminInbox().then((response) => {
  const data = response.data;
  console.log(data.localities);
  console.log(data.inquiries);
  console.log(data.teamApplications);
});
```

### Using `AdminInbox`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminInboxRef } from '@clubs-platform/dataconnect';


// Call the `adminInboxRef()` function to get a reference to the query.
const ref = adminInboxRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminInboxRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.localities);
console.log(data.inquiries);
console.log(data.teamApplications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.localities);
  console.log(data.inquiries);
  console.log(data.teamApplications);
});
```

## AdminAdmins
You can execute the `AdminAdmins` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminAdmins(options?: ExecuteQueryOptions): QueryPromise<AdminAdminsData, undefined>;

interface AdminAdminsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminAdminsData, undefined>;
}
export const adminAdminsRef: AdminAdminsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminAdmins(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminAdminsData, undefined>;

interface AdminAdminsRef {
  ...
  (dc: DataConnect): QueryRef<AdminAdminsData, undefined>;
}
export const adminAdminsRef: AdminAdminsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminAdminsRef:
```typescript
const name = adminAdminsRef.operationName;
console.log(name);
```

### Variables
The `AdminAdmins` query has no variables.
### Return Type
Recall that executing the `AdminAdmins` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminAdminsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminAdmins`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminAdmins } from '@clubs-platform/dataconnect';


// Call the `adminAdmins()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminAdmins();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminAdmins(dataConnect);

console.log(data.platformAdmins);
console.log(data.platformAdminInvites);

// Or, you can use the `Promise` API.
adminAdmins().then((response) => {
  const data = response.data;
  console.log(data.platformAdmins);
  console.log(data.platformAdminInvites);
});
```

### Using `AdminAdmins`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminAdminsRef } from '@clubs-platform/dataconnect';


// Call the `adminAdminsRef()` function to get a reference to the query.
const ref = adminAdminsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminAdminsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformAdmins);
console.log(data.platformAdminInvites);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformAdmins);
  console.log(data.platformAdminInvites);
});
```

## MyPlatformAdminInvite
You can execute the `MyPlatformAdminInvite` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
myPlatformAdminInvite(vars: MyPlatformAdminInviteVariables, options?: ExecuteQueryOptions): QueryPromise<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;

interface MyPlatformAdminInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MyPlatformAdminInviteVariables): QueryRef<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;
}
export const myPlatformAdminInviteRef: MyPlatformAdminInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
myPlatformAdminInvite(dc: DataConnect, vars: MyPlatformAdminInviteVariables, options?: ExecuteQueryOptions): QueryPromise<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;

interface MyPlatformAdminInviteRef {
  ...
  (dc: DataConnect, vars: MyPlatformAdminInviteVariables): QueryRef<MyPlatformAdminInviteData, MyPlatformAdminInviteVariables>;
}
export const myPlatformAdminInviteRef: MyPlatformAdminInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the myPlatformAdminInviteRef:
```typescript
const name = myPlatformAdminInviteRef.operationName;
console.log(name);
```

### Variables
The `MyPlatformAdminInvite` query requires an argument of type `MyPlatformAdminInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MyPlatformAdminInviteVariables {
  emailKey: string;
}
```
### Return Type
Recall that executing the `MyPlatformAdminInvite` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MyPlatformAdminInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MyPlatformAdminInviteData {
  platformAdminInvite?: {
    email: string;
  };
}
```
### Using `MyPlatformAdminInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, myPlatformAdminInvite, MyPlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `MyPlatformAdminInvite` query requires an argument of type `MyPlatformAdminInviteVariables`:
const myPlatformAdminInviteVars: MyPlatformAdminInviteVariables = {
  emailKey: ..., 
};

// Call the `myPlatformAdminInvite()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await myPlatformAdminInvite(myPlatformAdminInviteVars);
// Variables can be defined inline as well.
const { data } = await myPlatformAdminInvite({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await myPlatformAdminInvite(dataConnect, myPlatformAdminInviteVars);

console.log(data.platformAdminInvite);

// Or, you can use the `Promise` API.
myPlatformAdminInvite(myPlatformAdminInviteVars).then((response) => {
  const data = response.data;
  console.log(data.platformAdminInvite);
});
```

### Using `MyPlatformAdminInvite`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, myPlatformAdminInviteRef, MyPlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `MyPlatformAdminInvite` query requires an argument of type `MyPlatformAdminInviteVariables`:
const myPlatformAdminInviteVars: MyPlatformAdminInviteVariables = {
  emailKey: ..., 
};

// Call the `myPlatformAdminInviteRef()` function to get a reference to the query.
const ref = myPlatformAdminInviteRef(myPlatformAdminInviteVars);
// Variables can be defined inline as well.
const ref = myPlatformAdminInviteRef({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = myPlatformAdminInviteRef(dataConnect, myPlatformAdminInviteVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformAdminInvite);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformAdminInvite);
});
```

## AdminCourts
You can execute the `AdminCourts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
adminCourts(options?: ExecuteQueryOptions): QueryPromise<AdminCourtsData, undefined>;

interface AdminCourtsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminCourtsData, undefined>;
}
export const adminCourtsRef: AdminCourtsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminCourts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminCourtsData, undefined>;

interface AdminCourtsRef {
  ...
  (dc: DataConnect): QueryRef<AdminCourtsData, undefined>;
}
export const adminCourtsRef: AdminCourtsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminCourtsRef:
```typescript
const name = adminCourtsRef.operationName;
console.log(name);
```

### Variables
The `AdminCourts` query has no variables.
### Return Type
Recall that executing the `AdminCourts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminCourtsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AdminCourts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminCourts } from '@clubs-platform/dataconnect';


// Call the `adminCourts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminCourts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminCourts(dataConnect);

console.log(data.platformSettings);
console.log(data.courtOpenWindows);
console.log(data.courts);
console.log(data.courtHolds);

// Or, you can use the `Promise` API.
adminCourts().then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.courtOpenWindows);
  console.log(data.courts);
  console.log(data.courtHolds);
});
```

### Using `AdminCourts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminCourtsRef } from '@clubs-platform/dataconnect';


// Call the `adminCourtsRef()` function to get a reference to the query.
const ref = adminCourtsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminCourtsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);
console.log(data.courtOpenWindows);
console.log(data.courts);
console.log(data.courtHolds);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.courtOpenWindows);
  console.log(data.courts);
  console.log(data.courtHolds);
});
```

## TournamentEditor
You can execute the `TournamentEditor` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
tournamentEditor(vars: TournamentEditorVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentEditorData, TournamentEditorVariables>;

interface TournamentEditorRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentEditorVariables): QueryRef<TournamentEditorData, TournamentEditorVariables>;
}
export const tournamentEditorRef: TournamentEditorRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
tournamentEditor(dc: DataConnect, vars: TournamentEditorVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentEditorData, TournamentEditorVariables>;

interface TournamentEditorRef {
  ...
  (dc: DataConnect, vars: TournamentEditorVariables): QueryRef<TournamentEditorData, TournamentEditorVariables>;
}
export const tournamentEditorRef: TournamentEditorRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the tournamentEditorRef:
```typescript
const name = tournamentEditorRef.operationName;
console.log(name);
```

### Variables
The `TournamentEditor` query requires an argument of type `TournamentEditorVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TournamentEditorVariables {
  id: string;
}
```
### Return Type
Recall that executing the `TournamentEditor` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TournamentEditorData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TournamentEditorData {
  tournaments: ({
    id: string;
    name: string;
    legs: number;
    footballType: FootballType;
    durationMinutes: number;
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
```
### Using `TournamentEditor`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, tournamentEditor, TournamentEditorVariables } from '@clubs-platform/dataconnect';

// The `TournamentEditor` query requires an argument of type `TournamentEditorVariables`:
const tournamentEditorVars: TournamentEditorVariables = {
  id: ..., 
};

// Call the `tournamentEditor()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await tournamentEditor(tournamentEditorVars);
// Variables can be defined inline as well.
const { data } = await tournamentEditor({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await tournamentEditor(dataConnect, tournamentEditorVars);

console.log(data.tournaments);
console.log(data.clubs);
console.log(data.matches);

// Or, you can use the `Promise` API.
tournamentEditor(tournamentEditorVars).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.clubs);
  console.log(data.matches);
});
```

### Using `TournamentEditor`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, tournamentEditorRef, TournamentEditorVariables } from '@clubs-platform/dataconnect';

// The `TournamentEditor` query requires an argument of type `TournamentEditorVariables`:
const tournamentEditorVars: TournamentEditorVariables = {
  id: ..., 
};

// Call the `tournamentEditorRef()` function to get a reference to the query.
const ref = tournamentEditorRef(tournamentEditorVars);
// Variables can be defined inline as well.
const ref = tournamentEditorRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = tournamentEditorRef(dataConnect, tournamentEditorVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournaments);
console.log(data.clubs);
console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.clubs);
  console.log(data.matches);
});
```

## ScheduleCourts
You can execute the `ScheduleCourts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
scheduleCourts(options?: ExecuteQueryOptions): QueryPromise<ScheduleCourtsData, undefined>;

interface ScheduleCourtsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ScheduleCourtsData, undefined>;
}
export const scheduleCourtsRef: ScheduleCourtsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
scheduleCourts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ScheduleCourtsData, undefined>;

interface ScheduleCourtsRef {
  ...
  (dc: DataConnect): QueryRef<ScheduleCourtsData, undefined>;
}
export const scheduleCourtsRef: ScheduleCourtsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the scheduleCourtsRef:
```typescript
const name = scheduleCourtsRef.operationName;
console.log(name);
```

### Variables
The `ScheduleCourts` query has no variables.
### Return Type
Recall that executing the `ScheduleCourts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ScheduleCourtsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ScheduleCourtsData {
  courts: ({
    id: string;
    name: string;
  } & Court_Key)[];
}
```
### Using `ScheduleCourts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, scheduleCourts } from '@clubs-platform/dataconnect';


// Call the `scheduleCourts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await scheduleCourts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await scheduleCourts(dataConnect);

console.log(data.courts);

// Or, you can use the `Promise` API.
scheduleCourts().then((response) => {
  const data = response.data;
  console.log(data.courts);
});
```

### Using `ScheduleCourts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, scheduleCourtsRef } from '@clubs-platform/dataconnect';


// Call the `scheduleCourtsRef()` function to get a reference to the query.
const ref = scheduleCourtsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = scheduleCourtsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.courts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.courts);
});
```

## MatchSlotHints
You can execute the `MatchSlotHints` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
matchSlotHints(vars: MatchSlotHintsVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSlotHintsData, MatchSlotHintsVariables>;

interface MatchSlotHintsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchSlotHintsVariables): QueryRef<MatchSlotHintsData, MatchSlotHintsVariables>;
}
export const matchSlotHintsRef: MatchSlotHintsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
matchSlotHints(dc: DataConnect, vars: MatchSlotHintsVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSlotHintsData, MatchSlotHintsVariables>;

interface MatchSlotHintsRef {
  ...
  (dc: DataConnect, vars: MatchSlotHintsVariables): QueryRef<MatchSlotHintsData, MatchSlotHintsVariables>;
}
export const matchSlotHintsRef: MatchSlotHintsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the matchSlotHintsRef:
```typescript
const name = matchSlotHintsRef.operationName;
console.log(name);
```

### Variables
The `MatchSlotHints` query requires an argument of type `MatchSlotHintsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MatchSlotHintsVariables {
  homeId: string;
  awayId: string;
  from: DateString;
  until: DateString;
}
```
### Return Type
Recall that executing the `MatchSlotHints` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MatchSlotHintsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MatchSlotHints`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, matchSlotHints, MatchSlotHintsVariables } from '@clubs-platform/dataconnect';

// The `MatchSlotHints` query requires an argument of type `MatchSlotHintsVariables`:
const matchSlotHintsVars: MatchSlotHintsVariables = {
  homeId: ..., 
  awayId: ..., 
  from: ..., 
  until: ..., 
};

// Call the `matchSlotHints()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await matchSlotHints(matchSlotHintsVars);
// Variables can be defined inline as well.
const { data } = await matchSlotHints({ homeId: ..., awayId: ..., from: ..., until: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await matchSlotHints(dataConnect, matchSlotHintsVars);

console.log(data.platformSettings);
console.log(data.courtOpenWindows);
console.log(data.courts);
console.log(data.clubs);
console.log(data.courtHolds);
console.log(data.matches);

// Or, you can use the `Promise` API.
matchSlotHints(matchSlotHintsVars).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.courtOpenWindows);
  console.log(data.courts);
  console.log(data.clubs);
  console.log(data.courtHolds);
  console.log(data.matches);
});
```

### Using `MatchSlotHints`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, matchSlotHintsRef, MatchSlotHintsVariables } from '@clubs-platform/dataconnect';

// The `MatchSlotHints` query requires an argument of type `MatchSlotHintsVariables`:
const matchSlotHintsVars: MatchSlotHintsVariables = {
  homeId: ..., 
  awayId: ..., 
  from: ..., 
  until: ..., 
};

// Call the `matchSlotHintsRef()` function to get a reference to the query.
const ref = matchSlotHintsRef(matchSlotHintsVars);
// Variables can be defined inline as well.
const ref = matchSlotHintsRef({ homeId: ..., awayId: ..., from: ..., until: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = matchSlotHintsRef(dataConnect, matchSlotHintsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);
console.log(data.courtOpenWindows);
console.log(data.courts);
console.log(data.clubs);
console.log(data.courtHolds);
console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.courtOpenWindows);
  console.log(data.courts);
  console.log(data.clubs);
  console.log(data.courtHolds);
  console.log(data.matches);
});
```

## ClubScreen
You can execute the `ClubScreen` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clubScreen(vars: ClubScreenVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScreenData, ClubScreenVariables>;

interface ClubScreenRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubScreenVariables): QueryRef<ClubScreenData, ClubScreenVariables>;
}
export const clubScreenRef: ClubScreenRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
clubScreen(dc: DataConnect, vars: ClubScreenVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScreenData, ClubScreenVariables>;

interface ClubScreenRef {
  ...
  (dc: DataConnect, vars: ClubScreenVariables): QueryRef<ClubScreenData, ClubScreenVariables>;
}
export const clubScreenRef: ClubScreenRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clubScreenRef:
```typescript
const name = clubScreenRef.operationName;
console.log(name);
```

### Variables
The `ClubScreen` query requires an argument of type `ClubScreenVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClubScreenVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `ClubScreen` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClubScreenData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClubScreen`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clubScreen, ClubScreenVariables } from '@clubs-platform/dataconnect';

// The `ClubScreen` query requires an argument of type `ClubScreenVariables`:
const clubScreenVars: ClubScreenVariables = {
  slug: ..., 
};

// Call the `clubScreen()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clubScreen(clubScreenVars);
// Variables can be defined inline as well.
const { data } = await clubScreen({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clubScreen(dataConnect, clubScreenVars);

console.log(data.clubs);
console.log(data.seasons);
console.log(data.categories);
console.log(data.tournaments);
console.log(data.matches);

// Or, you can use the `Promise` API.
clubScreen(clubScreenVars).then((response) => {
  const data = response.data;
  console.log(data.clubs);
  console.log(data.seasons);
  console.log(data.categories);
  console.log(data.tournaments);
  console.log(data.matches);
});
```

### Using `ClubScreen`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, clubScreenRef, ClubScreenVariables } from '@clubs-platform/dataconnect';

// The `ClubScreen` query requires an argument of type `ClubScreenVariables`:
const clubScreenVars: ClubScreenVariables = {
  slug: ..., 
};

// Call the `clubScreenRef()` function to get a reference to the query.
const ref = clubScreenRef(clubScreenVars);
// Variables can be defined inline as well.
const ref = clubScreenRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clubScreenRef(dataConnect, clubScreenVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);
console.log(data.seasons);
console.log(data.categories);
console.log(data.tournaments);
console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
  console.log(data.seasons);
  console.log(data.categories);
  console.log(data.tournaments);
  console.log(data.matches);
});
```

## ClubBySlug
You can execute the `ClubBySlug` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clubBySlug(vars: ClubBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<ClubBySlugData, ClubBySlugVariables>;

interface ClubBySlugRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubBySlugVariables): QueryRef<ClubBySlugData, ClubBySlugVariables>;
}
export const clubBySlugRef: ClubBySlugRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
clubBySlug(dc: DataConnect, vars: ClubBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<ClubBySlugData, ClubBySlugVariables>;

interface ClubBySlugRef {
  ...
  (dc: DataConnect, vars: ClubBySlugVariables): QueryRef<ClubBySlugData, ClubBySlugVariables>;
}
export const clubBySlugRef: ClubBySlugRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clubBySlugRef:
```typescript
const name = clubBySlugRef.operationName;
console.log(name);
```

### Variables
The `ClubBySlug` query requires an argument of type `ClubBySlugVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClubBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `ClubBySlug` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClubBySlugData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClubBySlug`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clubBySlug, ClubBySlugVariables } from '@clubs-platform/dataconnect';

// The `ClubBySlug` query requires an argument of type `ClubBySlugVariables`:
const clubBySlugVars: ClubBySlugVariables = {
  slug: ..., 
};

// Call the `clubBySlug()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clubBySlug(clubBySlugVars);
// Variables can be defined inline as well.
const { data } = await clubBySlug({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clubBySlug(dataConnect, clubBySlugVars);

console.log(data.clubs);

// Or, you can use the `Promise` API.
clubBySlug(clubBySlugVars).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

### Using `ClubBySlug`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, clubBySlugRef, ClubBySlugVariables } from '@clubs-platform/dataconnect';

// The `ClubBySlug` query requires an argument of type `ClubBySlugVariables`:
const clubBySlugVars: ClubBySlugVariables = {
  slug: ..., 
};

// Call the `clubBySlugRef()` function to get a reference to the query.
const ref = clubBySlugRef(clubBySlugVars);
// Variables can be defined inline as well.
const ref = clubBySlugRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clubBySlugRef(dataConnect, clubBySlugVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

## TeamsPage
You can execute the `TeamsPage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
teamsPage(options?: ExecuteQueryOptions): QueryPromise<TeamsPageData, undefined>;

interface TeamsPageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<TeamsPageData, undefined>;
}
export const teamsPageRef: TeamsPageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
teamsPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<TeamsPageData, undefined>;

interface TeamsPageRef {
  ...
  (dc: DataConnect): QueryRef<TeamsPageData, undefined>;
}
export const teamsPageRef: TeamsPageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the teamsPageRef:
```typescript
const name = teamsPageRef.operationName;
console.log(name);
```

### Variables
The `TeamsPage` query has no variables.
### Return Type
Recall that executing the `TeamsPage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TeamsPageData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `TeamsPage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, teamsPage } from '@clubs-platform/dataconnect';


// Call the `teamsPage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await teamsPage();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await teamsPage(dataConnect);

console.log(data.clubs);
console.log(data.seasons);
console.log(data.categories);
console.log(data.tournaments);
console.log(data.matches);

// Or, you can use the `Promise` API.
teamsPage().then((response) => {
  const data = response.data;
  console.log(data.clubs);
  console.log(data.seasons);
  console.log(data.categories);
  console.log(data.tournaments);
  console.log(data.matches);
});
```

### Using `TeamsPage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, teamsPageRef } from '@clubs-platform/dataconnect';


// Call the `teamsPageRef()` function to get a reference to the query.
const ref = teamsPageRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = teamsPageRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);
console.log(data.seasons);
console.log(data.categories);
console.log(data.tournaments);
console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
  console.log(data.seasons);
  console.log(data.categories);
  console.log(data.tournaments);
  console.log(data.matches);
});
```

## SearchClubs
You can execute the `SearchClubs` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
searchClubs(vars: SearchClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchClubsData, SearchClubsVariables>;

interface SearchClubsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchClubsVariables): QueryRef<SearchClubsData, SearchClubsVariables>;
}
export const searchClubsRef: SearchClubsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchClubs(dc: DataConnect, vars: SearchClubsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchClubsData, SearchClubsVariables>;

interface SearchClubsRef {
  ...
  (dc: DataConnect, vars: SearchClubsVariables): QueryRef<SearchClubsData, SearchClubsVariables>;
}
export const searchClubsRef: SearchClubsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchClubsRef:
```typescript
const name = searchClubsRef.operationName;
console.log(name);
```

### Variables
The `SearchClubs` query requires an argument of type `SearchClubsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchClubsVariables {
  term: string;
}
```
### Return Type
Recall that executing the `SearchClubs` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchClubsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SearchClubsData {
  clubs?: unknown[] | null;
}
```
### Using `SearchClubs`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchClubs, SearchClubsVariables } from '@clubs-platform/dataconnect';

// The `SearchClubs` query requires an argument of type `SearchClubsVariables`:
const searchClubsVars: SearchClubsVariables = {
  term: ..., 
};

// Call the `searchClubs()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchClubs(searchClubsVars);
// Variables can be defined inline as well.
const { data } = await searchClubs({ term: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchClubs(dataConnect, searchClubsVars);

console.log(data.clubs);

// Or, you can use the `Promise` API.
searchClubs(searchClubsVars).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

### Using `SearchClubs`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchClubsRef, SearchClubsVariables } from '@clubs-platform/dataconnect';

// The `SearchClubs` query requires an argument of type `SearchClubsVariables`:
const searchClubsVars: SearchClubsVariables = {
  term: ..., 
};

// Call the `searchClubsRef()` function to get a reference to the query.
const ref = searchClubsRef(searchClubsVars);
// Variables can be defined inline as well.
const ref = searchClubsRef({ term: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchClubsRef(dataConnect, searchClubsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

## ContactPage
You can execute the `ContactPage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
contactPage(options?: ExecuteQueryOptions): QueryPromise<ContactPageData, undefined>;

interface ContactPageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ContactPageData, undefined>;
}
export const contactPageRef: ContactPageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
contactPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ContactPageData, undefined>;

interface ContactPageRef {
  ...
  (dc: DataConnect): QueryRef<ContactPageData, undefined>;
}
export const contactPageRef: ContactPageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the contactPageRef:
```typescript
const name = contactPageRef.operationName;
console.log(name);
```

### Variables
The `ContactPage` query has no variables.
### Return Type
Recall that executing the `ContactPage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ContactPageData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ContactPageData {
  platformSettings?: {
    whatsapp?: string | null;
  };
}
```
### Using `ContactPage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, contactPage } from '@clubs-platform/dataconnect';


// Call the `contactPage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await contactPage();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await contactPage(dataConnect);

console.log(data.platformSettings);

// Or, you can use the `Promise` API.
contactPage().then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
});
```

### Using `ContactPage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, contactPageRef } from '@clubs-platform/dataconnect';


// Call the `contactPageRef()` function to get a reference to the query.
const ref = contactPageRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = contactPageRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
});
```

## PlatformClaimOpen
You can execute the `PlatformClaimOpen` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
platformClaimOpen(options?: ExecuteQueryOptions): QueryPromise<PlatformClaimOpenData, undefined>;

interface PlatformClaimOpenRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PlatformClaimOpenData, undefined>;
}
export const platformClaimOpenRef: PlatformClaimOpenRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
platformClaimOpen(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PlatformClaimOpenData, undefined>;

interface PlatformClaimOpenRef {
  ...
  (dc: DataConnect): QueryRef<PlatformClaimOpenData, undefined>;
}
export const platformClaimOpenRef: PlatformClaimOpenRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the platformClaimOpenRef:
```typescript
const name = platformClaimOpenRef.operationName;
console.log(name);
```

### Variables
The `PlatformClaimOpen` query has no variables.
### Return Type
Recall that executing the `PlatformClaimOpen` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlatformClaimOpenData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlatformClaimOpenData {
  platformClaimStates: ({
    open?: boolean | null;
  })[];
}
```
### Using `PlatformClaimOpen`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, platformClaimOpen } from '@clubs-platform/dataconnect';


// Call the `platformClaimOpen()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await platformClaimOpen();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await platformClaimOpen(dataConnect);

console.log(data.platformClaimStates);

// Or, you can use the `Promise` API.
platformClaimOpen().then((response) => {
  const data = response.data;
  console.log(data.platformClaimStates);
});
```

### Using `PlatformClaimOpen`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, platformClaimOpenRef } from '@clubs-platform/dataconnect';


// Call the `platformClaimOpenRef()` function to get a reference to the query.
const ref = platformClaimOpenRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = platformClaimOpenRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformClaimStates);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformClaimStates);
});
```

## PlatformChrome
You can execute the `PlatformChrome` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
platformChrome(options?: ExecuteQueryOptions): QueryPromise<PlatformChromeData, undefined>;

interface PlatformChromeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PlatformChromeData, undefined>;
}
export const platformChromeRef: PlatformChromeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
platformChrome(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PlatformChromeData, undefined>;

interface PlatformChromeRef {
  ...
  (dc: DataConnect): QueryRef<PlatformChromeData, undefined>;
}
export const platformChromeRef: PlatformChromeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the platformChromeRef:
```typescript
const name = platformChromeRef.operationName;
console.log(name);
```

### Variables
The `PlatformChrome` query has no variables.
### Return Type
Recall that executing the `PlatformChrome` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlatformChromeData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `PlatformChrome`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, platformChrome } from '@clubs-platform/dataconnect';


// Call the `platformChrome()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await platformChrome();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await platformChrome(dataConnect);

console.log(data.platformSettings);

// Or, you can use the `Promise` API.
platformChrome().then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
});
```

### Using `PlatformChrome`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, platformChromeRef } from '@clubs-platform/dataconnect';


// Call the `platformChromeRef()` function to get a reference to the query.
const ref = platformChromeRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = platformChromeRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
});
```

## PlatformBanner
You can execute the `PlatformBanner` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
platformBanner(options?: ExecuteQueryOptions): QueryPromise<PlatformBannerData, undefined>;

interface PlatformBannerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PlatformBannerData, undefined>;
}
export const platformBannerRef: PlatformBannerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
platformBanner(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PlatformBannerData, undefined>;

interface PlatformBannerRef {
  ...
  (dc: DataConnect): QueryRef<PlatformBannerData, undefined>;
}
export const platformBannerRef: PlatformBannerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the platformBannerRef:
```typescript
const name = platformBannerRef.operationName;
console.log(name);
```

### Variables
The `PlatformBanner` query has no variables.
### Return Type
Recall that executing the `PlatformBanner` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlatformBannerData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlatformBannerData {
  platformSettings?: {
    headline: string;
    tagline: string;
  };
  platformHeroImages: ({
    url: string;
  })[];
}
```
### Using `PlatformBanner`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, platformBanner } from '@clubs-platform/dataconnect';


// Call the `platformBanner()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await platformBanner();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await platformBanner(dataConnect);

console.log(data.platformSettings);
console.log(data.platformHeroImages);

// Or, you can use the `Promise` API.
platformBanner().then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.platformHeroImages);
});
```

### Using `PlatformBanner`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, platformBannerRef } from '@clubs-platform/dataconnect';


// Call the `platformBannerRef()` function to get a reference to the query.
const ref = platformBannerRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = platformBannerRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);
console.log(data.platformHeroImages);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.platformHeroImages);
});
```

## HomePage
You can execute the `HomePage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
homePage(vars: HomePageVariables, options?: ExecuteQueryOptions): QueryPromise<HomePageData, HomePageVariables>;

interface HomePageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: HomePageVariables): QueryRef<HomePageData, HomePageVariables>;
}
export const homePageRef: HomePageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
homePage(dc: DataConnect, vars: HomePageVariables, options?: ExecuteQueryOptions): QueryPromise<HomePageData, HomePageVariables>;

interface HomePageRef {
  ...
  (dc: DataConnect, vars: HomePageVariables): QueryRef<HomePageData, HomePageVariables>;
}
export const homePageRef: HomePageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the homePageRef:
```typescript
const name = homePageRef.operationName;
console.log(name);
```

### Variables
The `HomePage` query requires an argument of type `HomePageVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface HomePageVariables {
  today: DateString;
}
```
### Return Type
Recall that executing the `HomePage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `HomePageData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
  })[];
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
```
### Using `HomePage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, homePage, HomePageVariables } from '@clubs-platform/dataconnect';

// The `HomePage` query requires an argument of type `HomePageVariables`:
const homePageVars: HomePageVariables = {
  today: ..., 
};

// Call the `homePage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await homePage(homePageVars);
// Variables can be defined inline as well.
const { data } = await homePage({ today: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await homePage(dataConnect, homePageVars);

console.log(data.platformSettings);
console.log(data.platformHeroImages);
console.log(data.tournaments);
console.log(data.matches);
console.log(data.adPlacements);

// Or, you can use the `Promise` API.
homePage(homePageVars).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.platformHeroImages);
  console.log(data.tournaments);
  console.log(data.matches);
  console.log(data.adPlacements);
});
```

### Using `HomePage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, homePageRef, HomePageVariables } from '@clubs-platform/dataconnect';

// The `HomePage` query requires an argument of type `HomePageVariables`:
const homePageVars: HomePageVariables = {
  today: ..., 
};

// Call the `homePageRef()` function to get a reference to the query.
const ref = homePageRef(homePageVars);
// Variables can be defined inline as well.
const ref = homePageRef({ today: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = homePageRef(dataConnect, homePageVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);
console.log(data.platformHeroImages);
console.log(data.tournaments);
console.log(data.matches);
console.log(data.adPlacements);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.platformHeroImages);
  console.log(data.tournaments);
  console.log(data.matches);
  console.log(data.adPlacements);
});
```

## RegisterTeamPage
You can execute the `RegisterTeamPage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
registerTeamPage(options?: ExecuteQueryOptions): QueryPromise<RegisterTeamPageData, undefined>;

interface RegisterTeamPageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<RegisterTeamPageData, undefined>;
}
export const registerTeamPageRef: RegisterTeamPageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
registerTeamPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<RegisterTeamPageData, undefined>;

interface RegisterTeamPageRef {
  ...
  (dc: DataConnect): QueryRef<RegisterTeamPageData, undefined>;
}
export const registerTeamPageRef: RegisterTeamPageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerTeamPageRef:
```typescript
const name = registerTeamPageRef.operationName;
console.log(name);
```

### Variables
The `RegisterTeamPage` query has no variables.
### Return Type
Recall that executing the `RegisterTeamPage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterTeamPageData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `RegisterTeamPage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerTeamPage } from '@clubs-platform/dataconnect';


// Call the `registerTeamPage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerTeamPage();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerTeamPage(dataConnect);

console.log(data.clubs);

// Or, you can use the `Promise` API.
registerTeamPage().then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

### Using `RegisterTeamPage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, registerTeamPageRef } from '@clubs-platform/dataconnect';


// Call the `registerTeamPageRef()` function to get a reference to the query.
const ref = registerTeamPageRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerTeamPageRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

## MatchesPage
You can execute the `MatchesPage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
matchesPage(options?: ExecuteQueryOptions): QueryPromise<MatchesPageData, undefined>;

interface MatchesPageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MatchesPageData, undefined>;
}
export const matchesPageRef: MatchesPageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
matchesPage(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<MatchesPageData, undefined>;

interface MatchesPageRef {
  ...
  (dc: DataConnect): QueryRef<MatchesPageData, undefined>;
}
export const matchesPageRef: MatchesPageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the matchesPageRef:
```typescript
const name = matchesPageRef.operationName;
console.log(name);
```

### Variables
The `MatchesPage` query has no variables.
### Return Type
Recall that executing the `MatchesPage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MatchesPageData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MatchesPage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, matchesPage } from '@clubs-platform/dataconnect';


// Call the `matchesPage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await matchesPage();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await matchesPage(dataConnect);

console.log(data.tournaments);
console.log(data.matches);

// Or, you can use the `Promise` API.
matchesPage().then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.matches);
});
```

### Using `MatchesPage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, matchesPageRef } from '@clubs-platform/dataconnect';


// Call the `matchesPageRef()` function to get a reference to the query.
const ref = matchesPageRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = matchesPageRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournaments);
console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.matches);
});
```

## ActiveClubs
You can execute the `ActiveClubs` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
activeClubs(options?: ExecuteQueryOptions): QueryPromise<ActiveClubsData, undefined>;

interface ActiveClubsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ActiveClubsData, undefined>;
}
export const activeClubsRef: ActiveClubsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
activeClubs(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ActiveClubsData, undefined>;

interface ActiveClubsRef {
  ...
  (dc: DataConnect): QueryRef<ActiveClubsData, undefined>;
}
export const activeClubsRef: ActiveClubsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the activeClubsRef:
```typescript
const name = activeClubsRef.operationName;
console.log(name);
```

### Variables
The `ActiveClubs` query has no variables.
### Return Type
Recall that executing the `ActiveClubs` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ActiveClubsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ActiveClubs`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, activeClubs } from '@clubs-platform/dataconnect';


// Call the `activeClubs()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await activeClubs();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await activeClubs(dataConnect);

console.log(data.clubs);

// Or, you can use the `Promise` API.
activeClubs().then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

### Using `ActiveClubs`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, activeClubsRef } from '@clubs-platform/dataconnect';


// Call the `activeClubsRef()` function to get a reference to the query.
const ref = activeClubsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = activeClubsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubs);
});
```

## Categories
You can execute the `Categories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
categories(options?: ExecuteQueryOptions): QueryPromise<CategoriesData, undefined>;

interface CategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<CategoriesData, undefined>;
}
export const categoriesRef: CategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
categories(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<CategoriesData, undefined>;

interface CategoriesRef {
  ...
  (dc: DataConnect): QueryRef<CategoriesData, undefined>;
}
export const categoriesRef: CategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the categoriesRef:
```typescript
const name = categoriesRef.operationName;
console.log(name);
```

### Variables
The `Categories` query has no variables.
### Return Type
Recall that executing the `Categories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CategoriesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CategoriesData {
  categories: ({
    id: string;
    name: string;
    sortOrder: number;
  } & Category_Key)[];
}
```
### Using `Categories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, categories } from '@clubs-platform/dataconnect';


// Call the `categories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await categories();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await categories(dataConnect);

console.log(data.categories);

// Or, you can use the `Promise` API.
categories().then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `Categories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, categoriesRef } from '@clubs-platform/dataconnect';


// Call the `categoriesRef()` function to get a reference to the query.
const ref = categoriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = categoriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

## Seasons
You can execute the `Seasons` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
seasons(options?: ExecuteQueryOptions): QueryPromise<SeasonsData, undefined>;

interface SeasonsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<SeasonsData, undefined>;
}
export const seasonsRef: SeasonsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
seasons(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<SeasonsData, undefined>;

interface SeasonsRef {
  ...
  (dc: DataConnect): QueryRef<SeasonsData, undefined>;
}
export const seasonsRef: SeasonsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the seasonsRef:
```typescript
const name = seasonsRef.operationName;
console.log(name);
```

### Variables
The `Seasons` query has no variables.
### Return Type
Recall that executing the `Seasons` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SeasonsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SeasonsData {
  seasons: ({
    id: string;
    name: string;
    startDate?: DateString | null;
    endDate?: DateString | null;
    active: boolean;
  } & Season_Key)[];
}
```
### Using `Seasons`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, seasons } from '@clubs-platform/dataconnect';


// Call the `seasons()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await seasons();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await seasons(dataConnect);

console.log(data.seasons);

// Or, you can use the `Promise` API.
seasons().then((response) => {
  const data = response.data;
  console.log(data.seasons);
});
```

### Using `Seasons`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, seasonsRef } from '@clubs-platform/dataconnect';


// Call the `seasonsRef()` function to get a reference to the query.
const ref = seasonsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = seasonsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.seasons);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.seasons);
});
```

## TournamentArchive
You can execute the `TournamentArchive` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
tournamentArchive(options?: ExecuteQueryOptions): QueryPromise<TournamentArchiveData, undefined>;

interface TournamentArchiveRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<TournamentArchiveData, undefined>;
}
export const tournamentArchiveRef: TournamentArchiveRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
tournamentArchive(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<TournamentArchiveData, undefined>;

interface TournamentArchiveRef {
  ...
  (dc: DataConnect): QueryRef<TournamentArchiveData, undefined>;
}
export const tournamentArchiveRef: TournamentArchiveRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the tournamentArchiveRef:
```typescript
const name = tournamentArchiveRef.operationName;
console.log(name);
```

### Variables
The `TournamentArchive` query has no variables.
### Return Type
Recall that executing the `TournamentArchive` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TournamentArchiveData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `TournamentArchive`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, tournamentArchive } from '@clubs-platform/dataconnect';


// Call the `tournamentArchive()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await tournamentArchive();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await tournamentArchive(dataConnect);

console.log(data.tournaments);
console.log(data.platformSettings);

// Or, you can use the `Promise` API.
tournamentArchive().then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.platformSettings);
});
```

### Using `TournamentArchive`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, tournamentArchiveRef } from '@clubs-platform/dataconnect';


// Call the `tournamentArchiveRef()` function to get a reference to the query.
const ref = tournamentArchiveRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = tournamentArchiveRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournaments);
console.log(data.platformSettings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.platformSettings);
});
```

## TournamentsBySeason
You can execute the `TournamentsBySeason` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
tournamentsBySeason(vars: TournamentsBySeasonVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentsBySeasonData, TournamentsBySeasonVariables>;

interface TournamentsBySeasonRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentsBySeasonVariables): QueryRef<TournamentsBySeasonData, TournamentsBySeasonVariables>;
}
export const tournamentsBySeasonRef: TournamentsBySeasonRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
tournamentsBySeason(dc: DataConnect, vars: TournamentsBySeasonVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentsBySeasonData, TournamentsBySeasonVariables>;

interface TournamentsBySeasonRef {
  ...
  (dc: DataConnect, vars: TournamentsBySeasonVariables): QueryRef<TournamentsBySeasonData, TournamentsBySeasonVariables>;
}
export const tournamentsBySeasonRef: TournamentsBySeasonRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the tournamentsBySeasonRef:
```typescript
const name = tournamentsBySeasonRef.operationName;
console.log(name);
```

### Variables
The `TournamentsBySeason` query requires an argument of type `TournamentsBySeasonVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TournamentsBySeasonVariables {
  seasonId: string;
}
```
### Return Type
Recall that executing the `TournamentsBySeason` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TournamentsBySeasonData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `TournamentsBySeason`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, tournamentsBySeason, TournamentsBySeasonVariables } from '@clubs-platform/dataconnect';

// The `TournamentsBySeason` query requires an argument of type `TournamentsBySeasonVariables`:
const tournamentsBySeasonVars: TournamentsBySeasonVariables = {
  seasonId: ..., 
};

// Call the `tournamentsBySeason()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await tournamentsBySeason(tournamentsBySeasonVars);
// Variables can be defined inline as well.
const { data } = await tournamentsBySeason({ seasonId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await tournamentsBySeason(dataConnect, tournamentsBySeasonVars);

console.log(data.tournaments);

// Or, you can use the `Promise` API.
tournamentsBySeason(tournamentsBySeasonVars).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
});
```

### Using `TournamentsBySeason`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, tournamentsBySeasonRef, TournamentsBySeasonVariables } from '@clubs-platform/dataconnect';

// The `TournamentsBySeason` query requires an argument of type `TournamentsBySeasonVariables`:
const tournamentsBySeasonVars: TournamentsBySeasonVariables = {
  seasonId: ..., 
};

// Call the `tournamentsBySeasonRef()` function to get a reference to the query.
const ref = tournamentsBySeasonRef(tournamentsBySeasonVars);
// Variables can be defined inline as well.
const ref = tournamentsBySeasonRef({ seasonId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = tournamentsBySeasonRef(dataConnect, tournamentsBySeasonVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournaments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
});
```

## TournamentScreen
You can execute the `TournamentScreen` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
tournamentScreen(vars: TournamentScreenVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScreenData, TournamentScreenVariables>;

interface TournamentScreenRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentScreenVariables): QueryRef<TournamentScreenData, TournamentScreenVariables>;
}
export const tournamentScreenRef: TournamentScreenRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
tournamentScreen(dc: DataConnect, vars: TournamentScreenVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScreenData, TournamentScreenVariables>;

interface TournamentScreenRef {
  ...
  (dc: DataConnect, vars: TournamentScreenVariables): QueryRef<TournamentScreenData, TournamentScreenVariables>;
}
export const tournamentScreenRef: TournamentScreenRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the tournamentScreenRef:
```typescript
const name = tournamentScreenRef.operationName;
console.log(name);
```

### Variables
The `TournamentScreen` query requires an argument of type `TournamentScreenVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TournamentScreenVariables {
  id: string;
}
```
### Return Type
Recall that executing the `TournamentScreen` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TournamentScreenData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `TournamentScreen`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, tournamentScreen, TournamentScreenVariables } from '@clubs-platform/dataconnect';

// The `TournamentScreen` query requires an argument of type `TournamentScreenVariables`:
const tournamentScreenVars: TournamentScreenVariables = {
  id: ..., 
};

// Call the `tournamentScreen()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await tournamentScreen(tournamentScreenVars);
// Variables can be defined inline as well.
const { data } = await tournamentScreen({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await tournamentScreen(dataConnect, tournamentScreenVars);

console.log(data.tournaments);
console.log(data.matches);
console.log(data.tournamentStandings);
console.log(data.tournamentScorers);

// Or, you can use the `Promise` API.
tournamentScreen(tournamentScreenVars).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.matches);
  console.log(data.tournamentStandings);
  console.log(data.tournamentScorers);
});
```

### Using `TournamentScreen`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, tournamentScreenRef, TournamentScreenVariables } from '@clubs-platform/dataconnect';

// The `TournamentScreen` query requires an argument of type `TournamentScreenVariables`:
const tournamentScreenVars: TournamentScreenVariables = {
  id: ..., 
};

// Call the `tournamentScreenRef()` function to get a reference to the query.
const ref = tournamentScreenRef(tournamentScreenVars);
// Variables can be defined inline as well.
const ref = tournamentScreenRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = tournamentScreenRef(dataConnect, tournamentScreenVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournaments);
console.log(data.matches);
console.log(data.tournamentStandings);
console.log(data.tournamentScorers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournaments);
  console.log(data.matches);
  console.log(data.tournamentStandings);
  console.log(data.tournamentScorers);
});
```

## MatchSummary
You can execute the `MatchSummary` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
matchSummary(vars: MatchSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSummaryData, MatchSummaryVariables>;

interface MatchSummaryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchSummaryVariables): QueryRef<MatchSummaryData, MatchSummaryVariables>;
}
export const matchSummaryRef: MatchSummaryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
matchSummary(dc: DataConnect, vars: MatchSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<MatchSummaryData, MatchSummaryVariables>;

interface MatchSummaryRef {
  ...
  (dc: DataConnect, vars: MatchSummaryVariables): QueryRef<MatchSummaryData, MatchSummaryVariables>;
}
export const matchSummaryRef: MatchSummaryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the matchSummaryRef:
```typescript
const name = matchSummaryRef.operationName;
console.log(name);
```

### Variables
The `MatchSummary` query requires an argument of type `MatchSummaryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MatchSummaryVariables {
  matchId: string;
}
```
### Return Type
Recall that executing the `MatchSummary` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MatchSummaryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MatchSummary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, matchSummary, MatchSummaryVariables } from '@clubs-platform/dataconnect';

// The `MatchSummary` query requires an argument of type `MatchSummaryVariables`:
const matchSummaryVars: MatchSummaryVariables = {
  matchId: ..., 
};

// Call the `matchSummary()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await matchSummary(matchSummaryVars);
// Variables can be defined inline as well.
const { data } = await matchSummary({ matchId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await matchSummary(dataConnect, matchSummaryVars);

console.log(data.matches);

// Or, you can use the `Promise` API.
matchSummary(matchSummaryVars).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `MatchSummary`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, matchSummaryRef, MatchSummaryVariables } from '@clubs-platform/dataconnect';

// The `MatchSummary` query requires an argument of type `MatchSummaryVariables`:
const matchSummaryVars: MatchSummaryVariables = {
  matchId: ..., 
};

// Call the `matchSummaryRef()` function to get a reference to the query.
const ref = matchSummaryRef(matchSummaryVars);
// Variables can be defined inline as well.
const ref = matchSummaryRef({ matchId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = matchSummaryRef(dataConnect, matchSummaryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

## MatchScoreSheet
You can execute the `MatchScoreSheet` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
matchScoreSheet(vars: MatchScoreSheetVariables, options?: ExecuteQueryOptions): QueryPromise<MatchScoreSheetData, MatchScoreSheetVariables>;

interface MatchScoreSheetRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchScoreSheetVariables): QueryRef<MatchScoreSheetData, MatchScoreSheetVariables>;
}
export const matchScoreSheetRef: MatchScoreSheetRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
matchScoreSheet(dc: DataConnect, vars: MatchScoreSheetVariables, options?: ExecuteQueryOptions): QueryPromise<MatchScoreSheetData, MatchScoreSheetVariables>;

interface MatchScoreSheetRef {
  ...
  (dc: DataConnect, vars: MatchScoreSheetVariables): QueryRef<MatchScoreSheetData, MatchScoreSheetVariables>;
}
export const matchScoreSheetRef: MatchScoreSheetRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the matchScoreSheetRef:
```typescript
const name = matchScoreSheetRef.operationName;
console.log(name);
```

### Variables
The `MatchScoreSheet` query requires an argument of type `MatchScoreSheetVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MatchScoreSheetVariables {
  matchId: string;
}
```
### Return Type
Recall that executing the `MatchScoreSheet` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MatchScoreSheetData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
  })[];
}
```
### Using `MatchScoreSheet`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, matchScoreSheet, MatchScoreSheetVariables } from '@clubs-platform/dataconnect';

// The `MatchScoreSheet` query requires an argument of type `MatchScoreSheetVariables`:
const matchScoreSheetVars: MatchScoreSheetVariables = {
  matchId: ..., 
};

// Call the `matchScoreSheet()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await matchScoreSheet(matchScoreSheetVars);
// Variables can be defined inline as well.
const { data } = await matchScoreSheet({ matchId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await matchScoreSheet(dataConnect, matchScoreSheetVars);

console.log(data.matches);

// Or, you can use the `Promise` API.
matchScoreSheet(matchScoreSheetVars).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `MatchScoreSheet`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, matchScoreSheetRef, MatchScoreSheetVariables } from '@clubs-platform/dataconnect';

// The `MatchScoreSheet` query requires an argument of type `MatchScoreSheetVariables`:
const matchScoreSheetVars: MatchScoreSheetVariables = {
  matchId: ..., 
};

// Call the `matchScoreSheetRef()` function to get a reference to the query.
const ref = matchScoreSheetRef(matchScoreSheetVars);
// Variables can be defined inline as well.
const ref = matchScoreSheetRef({ matchId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = matchScoreSheetRef(dataConnect, matchScoreSheetVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

## CourtBusyOnDate
You can execute the `CourtBusyOnDate` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
courtBusyOnDate(vars: CourtBusyOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtBusyOnDateData, CourtBusyOnDateVariables>;

interface CourtBusyOnDateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CourtBusyOnDateVariables): QueryRef<CourtBusyOnDateData, CourtBusyOnDateVariables>;
}
export const courtBusyOnDateRef: CourtBusyOnDateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
courtBusyOnDate(dc: DataConnect, vars: CourtBusyOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtBusyOnDateData, CourtBusyOnDateVariables>;

interface CourtBusyOnDateRef {
  ...
  (dc: DataConnect, vars: CourtBusyOnDateVariables): QueryRef<CourtBusyOnDateData, CourtBusyOnDateVariables>;
}
export const courtBusyOnDateRef: CourtBusyOnDateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the courtBusyOnDateRef:
```typescript
const name = courtBusyOnDateRef.operationName;
console.log(name);
```

### Variables
The `CourtBusyOnDate` query requires an argument of type `CourtBusyOnDateVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CourtBusyOnDateVariables {
  date: DateString;
}
```
### Return Type
Recall that executing the `CourtBusyOnDate` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CourtBusyOnDateData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CourtBusyOnDate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, courtBusyOnDate, CourtBusyOnDateVariables } from '@clubs-platform/dataconnect';

// The `CourtBusyOnDate` query requires an argument of type `CourtBusyOnDateVariables`:
const courtBusyOnDateVars: CourtBusyOnDateVariables = {
  date: ..., 
};

// Call the `courtBusyOnDate()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await courtBusyOnDate(courtBusyOnDateVars);
// Variables can be defined inline as well.
const { data } = await courtBusyOnDate({ date: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await courtBusyOnDate(dataConnect, courtBusyOnDateVars);

console.log(data.courtHolds);

// Or, you can use the `Promise` API.
courtBusyOnDate(courtBusyOnDateVars).then((response) => {
  const data = response.data;
  console.log(data.courtHolds);
});
```

### Using `CourtBusyOnDate`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, courtBusyOnDateRef, CourtBusyOnDateVariables } from '@clubs-platform/dataconnect';

// The `CourtBusyOnDate` query requires an argument of type `CourtBusyOnDateVariables`:
const courtBusyOnDateVars: CourtBusyOnDateVariables = {
  date: ..., 
};

// Call the `courtBusyOnDateRef()` function to get a reference to the query.
const ref = courtBusyOnDateRef(courtBusyOnDateVars);
// Variables can be defined inline as well.
const ref = courtBusyOnDateRef({ date: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = courtBusyOnDateRef(dataConnect, courtBusyOnDateVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.courtHolds);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.courtHolds);
});
```

## MatchesByTournament
You can execute the `MatchesByTournament` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
matchesByTournament(vars: MatchesByTournamentVariables, options?: ExecuteQueryOptions): QueryPromise<MatchesByTournamentData, MatchesByTournamentVariables>;

interface MatchesByTournamentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MatchesByTournamentVariables): QueryRef<MatchesByTournamentData, MatchesByTournamentVariables>;
}
export const matchesByTournamentRef: MatchesByTournamentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
matchesByTournament(dc: DataConnect, vars: MatchesByTournamentVariables, options?: ExecuteQueryOptions): QueryPromise<MatchesByTournamentData, MatchesByTournamentVariables>;

interface MatchesByTournamentRef {
  ...
  (dc: DataConnect, vars: MatchesByTournamentVariables): QueryRef<MatchesByTournamentData, MatchesByTournamentVariables>;
}
export const matchesByTournamentRef: MatchesByTournamentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the matchesByTournamentRef:
```typescript
const name = matchesByTournamentRef.operationName;
console.log(name);
```

### Variables
The `MatchesByTournament` query requires an argument of type `MatchesByTournamentVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MatchesByTournamentVariables {
  tournamentId: string;
}
```
### Return Type
Recall that executing the `MatchesByTournament` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MatchesByTournamentData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MatchesByTournament`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, matchesByTournament, MatchesByTournamentVariables } from '@clubs-platform/dataconnect';

// The `MatchesByTournament` query requires an argument of type `MatchesByTournamentVariables`:
const matchesByTournamentVars: MatchesByTournamentVariables = {
  tournamentId: ..., 
};

// Call the `matchesByTournament()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await matchesByTournament(matchesByTournamentVars);
// Variables can be defined inline as well.
const { data } = await matchesByTournament({ tournamentId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await matchesByTournament(dataConnect, matchesByTournamentVars);

console.log(data.matches);

// Or, you can use the `Promise` API.
matchesByTournament(matchesByTournamentVars).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `MatchesByTournament`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, matchesByTournamentRef, MatchesByTournamentVariables } from '@clubs-platform/dataconnect';

// The `MatchesByTournament` query requires an argument of type `MatchesByTournamentVariables`:
const matchesByTournamentVars: MatchesByTournamentVariables = {
  tournamentId: ..., 
};

// Call the `matchesByTournamentRef()` function to get a reference to the query.
const ref = matchesByTournamentRef(matchesByTournamentVars);
// Variables can be defined inline as well.
const ref = matchesByTournamentRef({ tournamentId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = matchesByTournamentRef(dataConnect, matchesByTournamentVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

## ClubScopedMatches
You can execute the `ClubScopedMatches` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clubScopedMatches(vars: ClubScopedMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScopedMatchesData, ClubScopedMatchesVariables>;

interface ClubScopedMatchesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClubScopedMatchesVariables): QueryRef<ClubScopedMatchesData, ClubScopedMatchesVariables>;
}
export const clubScopedMatchesRef: ClubScopedMatchesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
clubScopedMatches(dc: DataConnect, vars: ClubScopedMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<ClubScopedMatchesData, ClubScopedMatchesVariables>;

interface ClubScopedMatchesRef {
  ...
  (dc: DataConnect, vars: ClubScopedMatchesVariables): QueryRef<ClubScopedMatchesData, ClubScopedMatchesVariables>;
}
export const clubScopedMatchesRef: ClubScopedMatchesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clubScopedMatchesRef:
```typescript
const name = clubScopedMatchesRef.operationName;
console.log(name);
```

### Variables
The `ClubScopedMatches` query requires an argument of type `ClubScopedMatchesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClubScopedMatchesVariables {
  clubId: string;
  seasonId: string;
  categoryId: string;
}
```
### Return Type
Recall that executing the `ClubScopedMatches` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClubScopedMatchesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClubScopedMatches`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clubScopedMatches, ClubScopedMatchesVariables } from '@clubs-platform/dataconnect';

// The `ClubScopedMatches` query requires an argument of type `ClubScopedMatchesVariables`:
const clubScopedMatchesVars: ClubScopedMatchesVariables = {
  clubId: ..., 
  seasonId: ..., 
  categoryId: ..., 
};

// Call the `clubScopedMatches()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clubScopedMatches(clubScopedMatchesVars);
// Variables can be defined inline as well.
const { data } = await clubScopedMatches({ clubId: ..., seasonId: ..., categoryId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clubScopedMatches(dataConnect, clubScopedMatchesVars);

console.log(data.matches);

// Or, you can use the `Promise` API.
clubScopedMatches(clubScopedMatchesVars).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `ClubScopedMatches`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, clubScopedMatchesRef, ClubScopedMatchesVariables } from '@clubs-platform/dataconnect';

// The `ClubScopedMatches` query requires an argument of type `ClubScopedMatchesVariables`:
const clubScopedMatchesVars: ClubScopedMatchesVariables = {
  clubId: ..., 
  seasonId: ..., 
  categoryId: ..., 
};

// Call the `clubScopedMatchesRef()` function to get a reference to the query.
const ref = clubScopedMatchesRef(clubScopedMatchesVars);
// Variables can be defined inline as well.
const ref = clubScopedMatchesRef({ clubId: ..., seasonId: ..., categoryId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clubScopedMatchesRef(dataConnect, clubScopedMatchesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

## UpcomingMatches
You can execute the `UpcomingMatches` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
upcomingMatches(vars: UpcomingMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<UpcomingMatchesData, UpcomingMatchesVariables>;

interface UpcomingMatchesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpcomingMatchesVariables): QueryRef<UpcomingMatchesData, UpcomingMatchesVariables>;
}
export const upcomingMatchesRef: UpcomingMatchesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
upcomingMatches(dc: DataConnect, vars: UpcomingMatchesVariables, options?: ExecuteQueryOptions): QueryPromise<UpcomingMatchesData, UpcomingMatchesVariables>;

interface UpcomingMatchesRef {
  ...
  (dc: DataConnect, vars: UpcomingMatchesVariables): QueryRef<UpcomingMatchesData, UpcomingMatchesVariables>;
}
export const upcomingMatchesRef: UpcomingMatchesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upcomingMatchesRef:
```typescript
const name = upcomingMatchesRef.operationName;
console.log(name);
```

### Variables
The `UpcomingMatches` query requires an argument of type `UpcomingMatchesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpcomingMatchesVariables {
  from: string;
  limit: number;
}
```
### Return Type
Recall that executing the `UpcomingMatches` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpcomingMatchesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `UpcomingMatches`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upcomingMatches, UpcomingMatchesVariables } from '@clubs-platform/dataconnect';

// The `UpcomingMatches` query requires an argument of type `UpcomingMatchesVariables`:
const upcomingMatchesVars: UpcomingMatchesVariables = {
  from: ..., 
  limit: ..., 
};

// Call the `upcomingMatches()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upcomingMatches(upcomingMatchesVars);
// Variables can be defined inline as well.
const { data } = await upcomingMatches({ from: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upcomingMatches(dataConnect, upcomingMatchesVars);

console.log(data.matchListings);

// Or, you can use the `Promise` API.
upcomingMatches(upcomingMatchesVars).then((response) => {
  const data = response.data;
  console.log(data.matchListings);
});
```

### Using `UpcomingMatches`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, upcomingMatchesRef, UpcomingMatchesVariables } from '@clubs-platform/dataconnect';

// The `UpcomingMatches` query requires an argument of type `UpcomingMatchesVariables`:
const upcomingMatchesVars: UpcomingMatchesVariables = {
  from: ..., 
  limit: ..., 
};

// Call the `upcomingMatchesRef()` function to get a reference to the query.
const ref = upcomingMatchesRef(upcomingMatchesVars);
// Variables can be defined inline as well.
const ref = upcomingMatchesRef({ from: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upcomingMatchesRef(dataConnect, upcomingMatchesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matchListings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matchListings);
});
```

## TournamentStandings
You can execute the `TournamentStandings` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
tournamentStandings(vars: TournamentStandingsVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentStandingsData, TournamentStandingsVariables>;

interface TournamentStandingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentStandingsVariables): QueryRef<TournamentStandingsData, TournamentStandingsVariables>;
}
export const tournamentStandingsRef: TournamentStandingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
tournamentStandings(dc: DataConnect, vars: TournamentStandingsVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentStandingsData, TournamentStandingsVariables>;

interface TournamentStandingsRef {
  ...
  (dc: DataConnect, vars: TournamentStandingsVariables): QueryRef<TournamentStandingsData, TournamentStandingsVariables>;
}
export const tournamentStandingsRef: TournamentStandingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the tournamentStandingsRef:
```typescript
const name = tournamentStandingsRef.operationName;
console.log(name);
```

### Variables
The `TournamentStandings` query requires an argument of type `TournamentStandingsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TournamentStandingsVariables {
  tournamentId: string;
}
```
### Return Type
Recall that executing the `TournamentStandings` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TournamentStandingsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `TournamentStandings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, tournamentStandings, TournamentStandingsVariables } from '@clubs-platform/dataconnect';

// The `TournamentStandings` query requires an argument of type `TournamentStandingsVariables`:
const tournamentStandingsVars: TournamentStandingsVariables = {
  tournamentId: ..., 
};

// Call the `tournamentStandings()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await tournamentStandings(tournamentStandingsVars);
// Variables can be defined inline as well.
const { data } = await tournamentStandings({ tournamentId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await tournamentStandings(dataConnect, tournamentStandingsVars);

console.log(data.tournamentStandings);

// Or, you can use the `Promise` API.
tournamentStandings(tournamentStandingsVars).then((response) => {
  const data = response.data;
  console.log(data.tournamentStandings);
});
```

### Using `TournamentStandings`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, tournamentStandingsRef, TournamentStandingsVariables } from '@clubs-platform/dataconnect';

// The `TournamentStandings` query requires an argument of type `TournamentStandingsVariables`:
const tournamentStandingsVars: TournamentStandingsVariables = {
  tournamentId: ..., 
};

// Call the `tournamentStandingsRef()` function to get a reference to the query.
const ref = tournamentStandingsRef(tournamentStandingsVars);
// Variables can be defined inline as well.
const ref = tournamentStandingsRef({ tournamentId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = tournamentStandingsRef(dataConnect, tournamentStandingsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournamentStandings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournamentStandings);
});
```

## TournamentScorers
You can execute the `TournamentScorers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
tournamentScorers(vars: TournamentScorersVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScorersData, TournamentScorersVariables>;

interface TournamentScorersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TournamentScorersVariables): QueryRef<TournamentScorersData, TournamentScorersVariables>;
}
export const tournamentScorersRef: TournamentScorersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
tournamentScorers(dc: DataConnect, vars: TournamentScorersVariables, options?: ExecuteQueryOptions): QueryPromise<TournamentScorersData, TournamentScorersVariables>;

interface TournamentScorersRef {
  ...
  (dc: DataConnect, vars: TournamentScorersVariables): QueryRef<TournamentScorersData, TournamentScorersVariables>;
}
export const tournamentScorersRef: TournamentScorersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the tournamentScorersRef:
```typescript
const name = tournamentScorersRef.operationName;
console.log(name);
```

### Variables
The `TournamentScorers` query requires an argument of type `TournamentScorersVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TournamentScorersVariables {
  tournamentId: string;
}
```
### Return Type
Recall that executing the `TournamentScorers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TournamentScorersData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `TournamentScorers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, tournamentScorers, TournamentScorersVariables } from '@clubs-platform/dataconnect';

// The `TournamentScorers` query requires an argument of type `TournamentScorersVariables`:
const tournamentScorersVars: TournamentScorersVariables = {
  tournamentId: ..., 
};

// Call the `tournamentScorers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await tournamentScorers(tournamentScorersVars);
// Variables can be defined inline as well.
const { data } = await tournamentScorers({ tournamentId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await tournamentScorers(dataConnect, tournamentScorersVars);

console.log(data.tournamentScorers);

// Or, you can use the `Promise` API.
tournamentScorers(tournamentScorersVars).then((response) => {
  const data = response.data;
  console.log(data.tournamentScorers);
});
```

### Using `TournamentScorers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, tournamentScorersRef, TournamentScorersVariables } from '@clubs-platform/dataconnect';

// The `TournamentScorers` query requires an argument of type `TournamentScorersVariables`:
const tournamentScorersVars: TournamentScorersVariables = {
  tournamentId: ..., 
};

// Call the `tournamentScorersRef()` function to get a reference to the query.
const ref = tournamentScorersRef(tournamentScorersVars);
// Variables can be defined inline as well.
const ref = tournamentScorersRef({ tournamentId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = tournamentScorersRef(dataConnect, tournamentScorersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tournamentScorers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tournamentScorers);
});
```

## CourtsPage
You can execute the `CourtsPage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
courtsPage(vars: CourtsPageVariables, options?: ExecuteQueryOptions): QueryPromise<CourtsPageData, CourtsPageVariables>;

interface CourtsPageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CourtsPageVariables): QueryRef<CourtsPageData, CourtsPageVariables>;
}
export const courtsPageRef: CourtsPageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
courtsPage(dc: DataConnect, vars: CourtsPageVariables, options?: ExecuteQueryOptions): QueryPromise<CourtsPageData, CourtsPageVariables>;

interface CourtsPageRef {
  ...
  (dc: DataConnect, vars: CourtsPageVariables): QueryRef<CourtsPageData, CourtsPageVariables>;
}
export const courtsPageRef: CourtsPageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the courtsPageRef:
```typescript
const name = courtsPageRef.operationName;
console.log(name);
```

### Variables
The `CourtsPage` query requires an argument of type `CourtsPageVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CourtsPageVariables {
  date: DateString;
}
```
### Return Type
Recall that executing the `CourtsPage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CourtsPageData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CourtsPage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, courtsPage, CourtsPageVariables } from '@clubs-platform/dataconnect';

// The `CourtsPage` query requires an argument of type `CourtsPageVariables`:
const courtsPageVars: CourtsPageVariables = {
  date: ..., 
};

// Call the `courtsPage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await courtsPage(courtsPageVars);
// Variables can be defined inline as well.
const { data } = await courtsPage({ date: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await courtsPage(dataConnect, courtsPageVars);

console.log(data.platformSettings);
console.log(data.courtOpenWindows);
console.log(data.courts);
console.log(data.courtHolds);

// Or, you can use the `Promise` API.
courtsPage(courtsPageVars).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.courtOpenWindows);
  console.log(data.courts);
  console.log(data.courtHolds);
});
```

### Using `CourtsPage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, courtsPageRef, CourtsPageVariables } from '@clubs-platform/dataconnect';

// The `CourtsPage` query requires an argument of type `CourtsPageVariables`:
const courtsPageVars: CourtsPageVariables = {
  date: ..., 
};

// Call the `courtsPageRef()` function to get a reference to the query.
const ref = courtsPageRef(courtsPageVars);
// Variables can be defined inline as well.
const ref = courtsPageRef({ date: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = courtsPageRef(dataConnect, courtsPageVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.platformSettings);
console.log(data.courtOpenWindows);
console.log(data.courts);
console.log(data.courtHolds);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.platformSettings);
  console.log(data.courtOpenWindows);
  console.log(data.courts);
  console.log(data.courtHolds);
});
```

## CourtHoldsOnDate
You can execute the `CourtHoldsOnDate` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
courtHoldsOnDate(vars: CourtHoldsOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;

interface CourtHoldsOnDateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CourtHoldsOnDateVariables): QueryRef<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;
}
export const courtHoldsOnDateRef: CourtHoldsOnDateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
courtHoldsOnDate(dc: DataConnect, vars: CourtHoldsOnDateVariables, options?: ExecuteQueryOptions): QueryPromise<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;

interface CourtHoldsOnDateRef {
  ...
  (dc: DataConnect, vars: CourtHoldsOnDateVariables): QueryRef<CourtHoldsOnDateData, CourtHoldsOnDateVariables>;
}
export const courtHoldsOnDateRef: CourtHoldsOnDateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the courtHoldsOnDateRef:
```typescript
const name = courtHoldsOnDateRef.operationName;
console.log(name);
```

### Variables
The `CourtHoldsOnDate` query requires an argument of type `CourtHoldsOnDateVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CourtHoldsOnDateVariables {
  date: DateString;
}
```
### Return Type
Recall that executing the `CourtHoldsOnDate` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CourtHoldsOnDateData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CourtHoldsOnDate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, courtHoldsOnDate, CourtHoldsOnDateVariables } from '@clubs-platform/dataconnect';

// The `CourtHoldsOnDate` query requires an argument of type `CourtHoldsOnDateVariables`:
const courtHoldsOnDateVars: CourtHoldsOnDateVariables = {
  date: ..., 
};

// Call the `courtHoldsOnDate()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await courtHoldsOnDate(courtHoldsOnDateVars);
// Variables can be defined inline as well.
const { data } = await courtHoldsOnDate({ date: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await courtHoldsOnDate(dataConnect, courtHoldsOnDateVars);

console.log(data.courtHolds);

// Or, you can use the `Promise` API.
courtHoldsOnDate(courtHoldsOnDateVars).then((response) => {
  const data = response.data;
  console.log(data.courtHolds);
});
```

### Using `CourtHoldsOnDate`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, courtHoldsOnDateRef, CourtHoldsOnDateVariables } from '@clubs-platform/dataconnect';

// The `CourtHoldsOnDate` query requires an argument of type `CourtHoldsOnDateVariables`:
const courtHoldsOnDateVars: CourtHoldsOnDateVariables = {
  date: ..., 
};

// Call the `courtHoldsOnDateRef()` function to get a reference to the query.
const ref = courtHoldsOnDateRef(courtHoldsOnDateVars);
// Variables can be defined inline as well.
const ref = courtHoldsOnDateRef({ date: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = courtHoldsOnDateRef(dataConnect, courtHoldsOnDateVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.courtHolds);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.courtHolds);
});
```

## LiveAds
You can execute the `LiveAds` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
liveAds(vars: LiveAdsVariables, options?: ExecuteQueryOptions): QueryPromise<LiveAdsData, LiveAdsVariables>;

interface LiveAdsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: LiveAdsVariables): QueryRef<LiveAdsData, LiveAdsVariables>;
}
export const liveAdsRef: LiveAdsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
liveAds(dc: DataConnect, vars: LiveAdsVariables, options?: ExecuteQueryOptions): QueryPromise<LiveAdsData, LiveAdsVariables>;

interface LiveAdsRef {
  ...
  (dc: DataConnect, vars: LiveAdsVariables): QueryRef<LiveAdsData, LiveAdsVariables>;
}
export const liveAdsRef: LiveAdsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the liveAdsRef:
```typescript
const name = liveAdsRef.operationName;
console.log(name);
```

### Variables
The `LiveAds` query requires an argument of type `LiveAdsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface LiveAdsVariables {
  today: DateString;
  placement: AdPlacementKind;
}
```
### Return Type
Recall that executing the `LiveAds` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `LiveAdsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `LiveAds`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, liveAds, LiveAdsVariables } from '@clubs-platform/dataconnect';

// The `LiveAds` query requires an argument of type `LiveAdsVariables`:
const liveAdsVars: LiveAdsVariables = {
  today: ..., 
  placement: ..., 
};

// Call the `liveAds()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await liveAds(liveAdsVars);
// Variables can be defined inline as well.
const { data } = await liveAds({ today: ..., placement: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await liveAds(dataConnect, liveAdsVars);

console.log(data.adPlacements);

// Or, you can use the `Promise` API.
liveAds(liveAdsVars).then((response) => {
  const data = response.data;
  console.log(data.adPlacements);
});
```

### Using `LiveAds`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, liveAdsRef, LiveAdsVariables } from '@clubs-platform/dataconnect';

// The `LiveAds` query requires an argument of type `LiveAdsVariables`:
const liveAdsVars: LiveAdsVariables = {
  today: ..., 
  placement: ..., 
};

// Call the `liveAdsRef()` function to get a reference to the query.
const ref = liveAdsRef(liveAdsVars);
// Variables can be defined inline as well.
const ref = liveAdsRef({ today: ..., placement: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = liveAdsRef(dataConnect, liveAdsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.adPlacements);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.adPlacements);
});
```

## MyMemberships
You can execute the `MyMemberships` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
myMemberships(vars: MyMembershipsVariables, options?: ExecuteQueryOptions): QueryPromise<MyMembershipsData, MyMembershipsVariables>;

interface MyMembershipsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MyMembershipsVariables): QueryRef<MyMembershipsData, MyMembershipsVariables>;
}
export const myMembershipsRef: MyMembershipsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
myMemberships(dc: DataConnect, vars: MyMembershipsVariables, options?: ExecuteQueryOptions): QueryPromise<MyMembershipsData, MyMembershipsVariables>;

interface MyMembershipsRef {
  ...
  (dc: DataConnect, vars: MyMembershipsVariables): QueryRef<MyMembershipsData, MyMembershipsVariables>;
}
export const myMembershipsRef: MyMembershipsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the myMembershipsRef:
```typescript
const name = myMembershipsRef.operationName;
console.log(name);
```

### Variables
The `MyMemberships` query requires an argument of type `MyMembershipsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MyMembershipsVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `MyMemberships` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MyMembershipsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MyMemberships`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, myMemberships, MyMembershipsVariables } from '@clubs-platform/dataconnect';

// The `MyMemberships` query requires an argument of type `MyMembershipsVariables`:
const myMembershipsVars: MyMembershipsVariables = {
  userId: ..., 
};

// Call the `myMemberships()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await myMemberships(myMembershipsVars);
// Variables can be defined inline as well.
const { data } = await myMemberships({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await myMemberships(dataConnect, myMembershipsVars);

console.log(data.clubMembers);

// Or, you can use the `Promise` API.
myMemberships(myMembershipsVars).then((response) => {
  const data = response.data;
  console.log(data.clubMembers);
});
```

### Using `MyMemberships`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, myMembershipsRef, MyMembershipsVariables } from '@clubs-platform/dataconnect';

// The `MyMemberships` query requires an argument of type `MyMembershipsVariables`:
const myMembershipsVars: MyMembershipsVariables = {
  userId: ..., 
};

// Call the `myMembershipsRef()` function to get a reference to the query.
const ref = myMembershipsRef(myMembershipsVars);
// Variables can be defined inline as well.
const ref = myMembershipsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = myMembershipsRef(dataConnect, myMembershipsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubMembers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubMembers);
});
```

## MySpaces
You can execute the `MySpaces` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
mySpaces(options?: ExecuteQueryOptions): QueryPromise<MySpacesData, undefined>;

interface MySpacesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MySpacesData, undefined>;
}
export const mySpacesRef: MySpacesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
mySpaces(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<MySpacesData, undefined>;

interface MySpacesRef {
  ...
  (dc: DataConnect): QueryRef<MySpacesData, undefined>;
}
export const mySpacesRef: MySpacesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the mySpacesRef:
```typescript
const name = mySpacesRef.operationName;
console.log(name);
```

### Variables
The `MySpaces` query has no variables.
### Return Type
Recall that executing the `MySpaces` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MySpacesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MySpaces`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, mySpaces } from '@clubs-platform/dataconnect';


// Call the `mySpaces()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await mySpaces();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await mySpaces(dataConnect);

console.log(data.clubMembers);

// Or, you can use the `Promise` API.
mySpaces().then((response) => {
  const data = response.data;
  console.log(data.clubMembers);
});
```

### Using `MySpaces`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, mySpacesRef } from '@clubs-platform/dataconnect';


// Call the `mySpacesRef()` function to get a reference to the query.
const ref = mySpacesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = mySpacesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubMembers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubMembers);
});
```

## MyOpenClubInvites
You can execute the `MyOpenClubInvites` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
myOpenClubInvites(vars: MyOpenClubInvitesVariables, options?: ExecuteQueryOptions): QueryPromise<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;

interface MyOpenClubInvitesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MyOpenClubInvitesVariables): QueryRef<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;
}
export const myOpenClubInvitesRef: MyOpenClubInvitesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
myOpenClubInvites(dc: DataConnect, vars: MyOpenClubInvitesVariables, options?: ExecuteQueryOptions): QueryPromise<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;

interface MyOpenClubInvitesRef {
  ...
  (dc: DataConnect, vars: MyOpenClubInvitesVariables): QueryRef<MyOpenClubInvitesData, MyOpenClubInvitesVariables>;
}
export const myOpenClubInvitesRef: MyOpenClubInvitesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the myOpenClubInvitesRef:
```typescript
const name = myOpenClubInvitesRef.operationName;
console.log(name);
```

### Variables
The `MyOpenClubInvites` query requires an argument of type `MyOpenClubInvitesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MyOpenClubInvitesVariables {
  emailKey: string;
}
```
### Return Type
Recall that executing the `MyOpenClubInvites` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MyOpenClubInvitesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MyOpenClubInvites`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, myOpenClubInvites, MyOpenClubInvitesVariables } from '@clubs-platform/dataconnect';

// The `MyOpenClubInvites` query requires an argument of type `MyOpenClubInvitesVariables`:
const myOpenClubInvitesVars: MyOpenClubInvitesVariables = {
  emailKey: ..., 
};

// Call the `myOpenClubInvites()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await myOpenClubInvites(myOpenClubInvitesVars);
// Variables can be defined inline as well.
const { data } = await myOpenClubInvites({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await myOpenClubInvites(dataConnect, myOpenClubInvitesVars);

console.log(data.clubInvites);

// Or, you can use the `Promise` API.
myOpenClubInvites(myOpenClubInvitesVars).then((response) => {
  const data = response.data;
  console.log(data.clubInvites);
});
```

### Using `MyOpenClubInvites`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, myOpenClubInvitesRef, MyOpenClubInvitesVariables } from '@clubs-platform/dataconnect';

// The `MyOpenClubInvites` query requires an argument of type `MyOpenClubInvitesVariables`:
const myOpenClubInvitesVars: MyOpenClubInvitesVariables = {
  emailKey: ..., 
};

// Call the `myOpenClubInvitesRef()` function to get a reference to the query.
const ref = myOpenClubInvitesRef(myOpenClubInvitesVars);
// Variables can be defined inline as well.
const ref = myOpenClubInvitesRef({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = myOpenClubInvitesRef(dataConnect, myOpenClubInvitesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clubInvites);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clubInvites);
});
```

## PlayerContributionTotals
You can execute the `PlayerContributionTotals` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
playerContributionTotals(vars: PlayerContributionTotalsVariables, options?: ExecuteQueryOptions): QueryPromise<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;

interface PlayerContributionTotalsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlayerContributionTotalsVariables): QueryRef<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;
}
export const playerContributionTotalsRef: PlayerContributionTotalsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
playerContributionTotals(dc: DataConnect, vars: PlayerContributionTotalsVariables, options?: ExecuteQueryOptions): QueryPromise<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;

interface PlayerContributionTotalsRef {
  ...
  (dc: DataConnect, vars: PlayerContributionTotalsVariables): QueryRef<PlayerContributionTotalsData, PlayerContributionTotalsVariables>;
}
export const playerContributionTotalsRef: PlayerContributionTotalsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the playerContributionTotalsRef:
```typescript
const name = playerContributionTotalsRef.operationName;
console.log(name);
```

### Variables
The `PlayerContributionTotals` query requires an argument of type `PlayerContributionTotalsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PlayerContributionTotalsVariables {
  clubId: string;
}
```
### Return Type
Recall that executing the `PlayerContributionTotals` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlayerContributionTotalsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlayerContributionTotalsData {
  playerContributionTotals: ({
    total?: number | null;
    player?: {
      id: string;
      name: string;
    } & Player_Key;
  })[];
}
```
### Using `PlayerContributionTotals`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, playerContributionTotals, PlayerContributionTotalsVariables } from '@clubs-platform/dataconnect';

// The `PlayerContributionTotals` query requires an argument of type `PlayerContributionTotalsVariables`:
const playerContributionTotalsVars: PlayerContributionTotalsVariables = {
  clubId: ..., 
};

// Call the `playerContributionTotals()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await playerContributionTotals(playerContributionTotalsVars);
// Variables can be defined inline as well.
const { data } = await playerContributionTotals({ clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await playerContributionTotals(dataConnect, playerContributionTotalsVars);

console.log(data.playerContributionTotals);

// Or, you can use the `Promise` API.
playerContributionTotals(playerContributionTotalsVars).then((response) => {
  const data = response.data;
  console.log(data.playerContributionTotals);
});
```

### Using `PlayerContributionTotals`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, playerContributionTotalsRef, PlayerContributionTotalsVariables } from '@clubs-platform/dataconnect';

// The `PlayerContributionTotals` query requires an argument of type `PlayerContributionTotalsVariables`:
const playerContributionTotalsVars: PlayerContributionTotalsVariables = {
  clubId: ..., 
};

// Call the `playerContributionTotalsRef()` function to get a reference to the query.
const ref = playerContributionTotalsRef(playerContributionTotalsVars);
// Variables can be defined inline as well.
const ref = playerContributionTotalsRef({ clubId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = playerContributionTotalsRef(dataConnect, playerContributionTotalsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.playerContributionTotals);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.playerContributionTotals);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `app` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## BootstrapPlatformAdmin
You can execute the `BootstrapPlatformAdmin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
bootstrapPlatformAdmin(vars: BootstrapPlatformAdminVariables): MutationPromise<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;

interface BootstrapPlatformAdminRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BootstrapPlatformAdminVariables): MutationRef<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;
}
export const bootstrapPlatformAdminRef: BootstrapPlatformAdminRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bootstrapPlatformAdmin(dc: DataConnect, vars: BootstrapPlatformAdminVariables): MutationPromise<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;

interface BootstrapPlatformAdminRef {
  ...
  (dc: DataConnect, vars: BootstrapPlatformAdminVariables): MutationRef<BootstrapPlatformAdminData, BootstrapPlatformAdminVariables>;
}
export const bootstrapPlatformAdminRef: BootstrapPlatformAdminRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bootstrapPlatformAdminRef:
```typescript
const name = bootstrapPlatformAdminRef.operationName;
console.log(name);
```

### Variables
The `BootstrapPlatformAdmin` mutation requires an argument of type `BootstrapPlatformAdminVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BootstrapPlatformAdminVariables {
  userId: string;
  email: string;
  displayName: string;
}
```
### Return Type
Recall that executing the `BootstrapPlatformAdmin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BootstrapPlatformAdminData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BootstrapPlatformAdminData {
  user_upsert: User_Key;
  admin?: unknown | null;
}
```
### Using `BootstrapPlatformAdmin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bootstrapPlatformAdmin, BootstrapPlatformAdminVariables } from '@clubs-platform/dataconnect';

// The `BootstrapPlatformAdmin` mutation requires an argument of type `BootstrapPlatformAdminVariables`:
const bootstrapPlatformAdminVars: BootstrapPlatformAdminVariables = {
  userId: ..., 
  email: ..., 
  displayName: ..., 
};

// Call the `bootstrapPlatformAdmin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bootstrapPlatformAdmin(bootstrapPlatformAdminVars);
// Variables can be defined inline as well.
const { data } = await bootstrapPlatformAdmin({ userId: ..., email: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bootstrapPlatformAdmin(dataConnect, bootstrapPlatformAdminVars);

console.log(data.user_upsert);
console.log(data.admin);

// Or, you can use the `Promise` API.
bootstrapPlatformAdmin(bootstrapPlatformAdminVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
  console.log(data.admin);
});
```

### Using `BootstrapPlatformAdmin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bootstrapPlatformAdminRef, BootstrapPlatformAdminVariables } from '@clubs-platform/dataconnect';

// The `BootstrapPlatformAdmin` mutation requires an argument of type `BootstrapPlatformAdminVariables`:
const bootstrapPlatformAdminVars: BootstrapPlatformAdminVariables = {
  userId: ..., 
  email: ..., 
  displayName: ..., 
};

// Call the `bootstrapPlatformAdminRef()` function to get a reference to the mutation.
const ref = bootstrapPlatformAdminRef(bootstrapPlatformAdminVars);
// Variables can be defined inline as well.
const ref = bootstrapPlatformAdminRef({ userId: ..., email: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bootstrapPlatformAdminRef(dataConnect, bootstrapPlatformAdminVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);
console.log(data.admin);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
  console.log(data.admin);
});
```

## ClaimPlatformAdminInvite
You can execute the `ClaimPlatformAdminInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
claimPlatformAdminInvite(vars: ClaimPlatformAdminInviteVariables): MutationPromise<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;

interface ClaimPlatformAdminInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClaimPlatformAdminInviteVariables): MutationRef<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;
}
export const claimPlatformAdminInviteRef: ClaimPlatformAdminInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
claimPlatformAdminInvite(dc: DataConnect, vars: ClaimPlatformAdminInviteVariables): MutationPromise<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;

interface ClaimPlatformAdminInviteRef {
  ...
  (dc: DataConnect, vars: ClaimPlatformAdminInviteVariables): MutationRef<ClaimPlatformAdminInviteData, ClaimPlatformAdminInviteVariables>;
}
export const claimPlatformAdminInviteRef: ClaimPlatformAdminInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the claimPlatformAdminInviteRef:
```typescript
const name = claimPlatformAdminInviteRef.operationName;
console.log(name);
```

### Variables
The `ClaimPlatformAdminInvite` mutation requires an argument of type `ClaimPlatformAdminInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClaimPlatformAdminInviteVariables {
  emailKey: string;
}
```
### Return Type
Recall that executing the `ClaimPlatformAdminInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClaimPlatformAdminInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClaimPlatformAdminInviteData {
  ensured?: number | null;
  admin?: unknown | null;
  droppedSignup?: number | null;
  droppedInvite?: number | null;
}
```
### Using `ClaimPlatformAdminInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, claimPlatformAdminInvite, ClaimPlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `ClaimPlatformAdminInvite` mutation requires an argument of type `ClaimPlatformAdminInviteVariables`:
const claimPlatformAdminInviteVars: ClaimPlatformAdminInviteVariables = {
  emailKey: ..., 
};

// Call the `claimPlatformAdminInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await claimPlatformAdminInvite(claimPlatformAdminInviteVars);
// Variables can be defined inline as well.
const { data } = await claimPlatformAdminInvite({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await claimPlatformAdminInvite(dataConnect, claimPlatformAdminInviteVars);

console.log(data.ensured);
console.log(data.admin);
console.log(data.droppedSignup);
console.log(data.droppedInvite);

// Or, you can use the `Promise` API.
claimPlatformAdminInvite(claimPlatformAdminInviteVars).then((response) => {
  const data = response.data;
  console.log(data.ensured);
  console.log(data.admin);
  console.log(data.droppedSignup);
  console.log(data.droppedInvite);
});
```

### Using `ClaimPlatformAdminInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, claimPlatformAdminInviteRef, ClaimPlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `ClaimPlatformAdminInvite` mutation requires an argument of type `ClaimPlatformAdminInviteVariables`:
const claimPlatformAdminInviteVars: ClaimPlatformAdminInviteVariables = {
  emailKey: ..., 
};

// Call the `claimPlatformAdminInviteRef()` function to get a reference to the mutation.
const ref = claimPlatformAdminInviteRef(claimPlatformAdminInviteVars);
// Variables can be defined inline as well.
const ref = claimPlatformAdminInviteRef({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = claimPlatformAdminInviteRef(dataConnect, claimPlatformAdminInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ensured);
console.log(data.admin);
console.log(data.droppedSignup);
console.log(data.droppedInvite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ensured);
  console.log(data.admin);
  console.log(data.droppedSignup);
  console.log(data.droppedInvite);
});
```

## DeleteLocality
You can execute the `DeleteLocality` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteLocality(vars: DeleteLocalityVariables): MutationPromise<DeleteLocalityData, DeleteLocalityVariables>;

interface DeleteLocalityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteLocalityVariables): MutationRef<DeleteLocalityData, DeleteLocalityVariables>;
}
export const deleteLocalityRef: DeleteLocalityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteLocality(dc: DataConnect, vars: DeleteLocalityVariables): MutationPromise<DeleteLocalityData, DeleteLocalityVariables>;

interface DeleteLocalityRef {
  ...
  (dc: DataConnect, vars: DeleteLocalityVariables): MutationRef<DeleteLocalityData, DeleteLocalityVariables>;
}
export const deleteLocalityRef: DeleteLocalityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteLocalityRef:
```typescript
const name = deleteLocalityRef.operationName;
console.log(name);
```

### Variables
The `DeleteLocality` mutation requires an argument of type `DeleteLocalityVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteLocalityVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteLocality` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteLocalityData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteLocalityData {
  locality?: unknown | null;
}
```
### Using `DeleteLocality`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteLocality, DeleteLocalityVariables } from '@clubs-platform/dataconnect';

// The `DeleteLocality` mutation requires an argument of type `DeleteLocalityVariables`:
const deleteLocalityVars: DeleteLocalityVariables = {
  id: ..., 
};

// Call the `deleteLocality()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteLocality(deleteLocalityVars);
// Variables can be defined inline as well.
const { data } = await deleteLocality({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteLocality(dataConnect, deleteLocalityVars);

console.log(data.locality);

// Or, you can use the `Promise` API.
deleteLocality(deleteLocalityVars).then((response) => {
  const data = response.data;
  console.log(data.locality);
});
```

### Using `DeleteLocality`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteLocalityRef, DeleteLocalityVariables } from '@clubs-platform/dataconnect';

// The `DeleteLocality` mutation requires an argument of type `DeleteLocalityVariables`:
const deleteLocalityVars: DeleteLocalityVariables = {
  id: ..., 
};

// Call the `deleteLocalityRef()` function to get a reference to the mutation.
const ref = deleteLocalityRef(deleteLocalityVars);
// Variables can be defined inline as well.
const ref = deleteLocalityRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteLocalityRef(dataConnect, deleteLocalityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.locality);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.locality);
});
```

## CreateLocality
You can execute the `CreateLocality` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
createLocality(vars: CreateLocalityVariables): MutationPromise<CreateLocalityData, CreateLocalityVariables>;

interface CreateLocalityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLocalityVariables): MutationRef<CreateLocalityData, CreateLocalityVariables>;
}
export const createLocalityRef: CreateLocalityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLocality(dc: DataConnect, vars: CreateLocalityVariables): MutationPromise<CreateLocalityData, CreateLocalityVariables>;

interface CreateLocalityRef {
  ...
  (dc: DataConnect, vars: CreateLocalityVariables): MutationRef<CreateLocalityData, CreateLocalityVariables>;
}
export const createLocalityRef: CreateLocalityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLocalityRef:
```typescript
const name = createLocalityRef.operationName;
console.log(name);
```

### Variables
The `CreateLocality` mutation requires an argument of type `CreateLocalityVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateLocalityVariables {
  userId?: string;
  id: string;
  name: string;
}
```
### Return Type
Recall that executing the `CreateLocality` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLocalityData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CreateLocality`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLocality, CreateLocalityVariables } from '@clubs-platform/dataconnect';

// The `CreateLocality` mutation requires an argument of type `CreateLocalityVariables`:
const createLocalityVars: CreateLocalityVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
};

// Call the `createLocality()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLocality(createLocalityVars);
// Variables can be defined inline as well.
const { data } = await createLocality({ userId: ..., id: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLocality(dataConnect, createLocalityVars);

console.log(data.query);
console.log(data.locality);

// Or, you can use the `Promise` API.
createLocality(createLocalityVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.locality);
});
```

### Using `CreateLocality`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLocalityRef, CreateLocalityVariables } from '@clubs-platform/dataconnect';

// The `CreateLocality` mutation requires an argument of type `CreateLocalityVariables`:
const createLocalityVars: CreateLocalityVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
};

// Call the `createLocalityRef()` function to get a reference to the mutation.
const ref = createLocalityRef(createLocalityVars);
// Variables can be defined inline as well.
const ref = createLocalityRef({ userId: ..., id: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLocalityRef(dataConnect, createLocalityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.locality);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.locality);
});
```

## CreateClub
You can execute the `CreateClub` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
createClub(vars: CreateClubVariables): MutationPromise<CreateClubData, CreateClubVariables>;

interface CreateClubRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateClubVariables): MutationRef<CreateClubData, CreateClubVariables>;
}
export const createClubRef: CreateClubRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createClub(dc: DataConnect, vars: CreateClubVariables): MutationPromise<CreateClubData, CreateClubVariables>;

interface CreateClubRef {
  ...
  (dc: DataConnect, vars: CreateClubVariables): MutationRef<CreateClubData, CreateClubVariables>;
}
export const createClubRef: CreateClubRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createClubRef:
```typescript
const name = createClubRef.operationName;
console.log(name);
```

### Variables
The `CreateClub` mutation requires an argument of type `CreateClubVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateClub` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateClubData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CreateClub`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createClub, CreateClubVariables } from '@clubs-platform/dataconnect';

// The `CreateClub` mutation requires an argument of type `CreateClubVariables`:
const createClubVars: CreateClubVariables = {
  userId: ..., // optional
  id: ..., 
  slug: ..., 
  name: ..., 
  localityId: ..., 
  location: ..., 
  presidentPhone: ..., 
  description: ..., 
};

// Call the `createClub()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createClub(createClubVars);
// Variables can be defined inline as well.
const { data } = await createClub({ userId: ..., id: ..., slug: ..., name: ..., localityId: ..., location: ..., presidentPhone: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createClub(dataConnect, createClubVars);

console.log(data.query);
console.log(data.club);

// Or, you can use the `Promise` API.
createClub(createClubVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.club);
});
```

### Using `CreateClub`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createClubRef, CreateClubVariables } from '@clubs-platform/dataconnect';

// The `CreateClub` mutation requires an argument of type `CreateClubVariables`:
const createClubVars: CreateClubVariables = {
  userId: ..., // optional
  id: ..., 
  slug: ..., 
  name: ..., 
  localityId: ..., 
  location: ..., 
  presidentPhone: ..., 
  description: ..., 
};

// Call the `createClubRef()` function to get a reference to the mutation.
const ref = createClubRef(createClubVars);
// Variables can be defined inline as well.
const ref = createClubRef({ userId: ..., id: ..., slug: ..., name: ..., localityId: ..., location: ..., presidentPhone: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createClubRef(dataConnect, createClubVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.club);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.club);
});
```

## InsertClubHero
You can execute the `InsertClubHero` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
insertClubHero(vars: InsertClubHeroVariables): MutationPromise<InsertClubHeroData, InsertClubHeroVariables>;

interface InsertClubHeroRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClubHeroVariables): MutationRef<InsertClubHeroData, InsertClubHeroVariables>;
}
export const insertClubHeroRef: InsertClubHeroRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertClubHero(dc: DataConnect, vars: InsertClubHeroVariables): MutationPromise<InsertClubHeroData, InsertClubHeroVariables>;

interface InsertClubHeroRef {
  ...
  (dc: DataConnect, vars: InsertClubHeroVariables): MutationRef<InsertClubHeroData, InsertClubHeroVariables>;
}
export const insertClubHeroRef: InsertClubHeroRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertClubHeroRef:
```typescript
const name = insertClubHeroRef.operationName;
console.log(name);
```

### Variables
The `InsertClubHero` mutation requires an argument of type `InsertClubHeroVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertClubHeroVariables {
  userId?: string;
  id: UUIDString;
  clubId: string;
  url: string;
}
```
### Return Type
Recall that executing the `InsertClubHero` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertClubHeroData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `InsertClubHero`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertClubHero, InsertClubHeroVariables } from '@clubs-platform/dataconnect';

// The `InsertClubHero` mutation requires an argument of type `InsertClubHeroVariables`:
const insertClubHeroVars: InsertClubHeroVariables = {
  userId: ..., // optional
  id: ..., 
  clubId: ..., 
  url: ..., 
};

// Call the `insertClubHero()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertClubHero(insertClubHeroVars);
// Variables can be defined inline as well.
const { data } = await insertClubHero({ userId: ..., id: ..., clubId: ..., url: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertClubHero(dataConnect, insertClubHeroVars);

console.log(data.query);
console.log(data.hero);

// Or, you can use the `Promise` API.
insertClubHero(insertClubHeroVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.hero);
});
```

### Using `InsertClubHero`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertClubHeroRef, InsertClubHeroVariables } from '@clubs-platform/dataconnect';

// The `InsertClubHero` mutation requires an argument of type `InsertClubHeroVariables`:
const insertClubHeroVars: InsertClubHeroVariables = {
  userId: ..., // optional
  id: ..., 
  clubId: ..., 
  url: ..., 
};

// Call the `insertClubHeroRef()` function to get a reference to the mutation.
const ref = insertClubHeroRef(insertClubHeroVars);
// Variables can be defined inline as well.
const ref = insertClubHeroRef({ userId: ..., id: ..., clubId: ..., url: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertClubHeroRef(dataConnect, insertClubHeroVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.hero);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.hero);
});
```

## SetClubActive
You can execute the `SetClubActive` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setClubActive(vars: SetClubActiveVariables): MutationPromise<SetClubActiveData, SetClubActiveVariables>;

interface SetClubActiveRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubActiveVariables): MutationRef<SetClubActiveData, SetClubActiveVariables>;
}
export const setClubActiveRef: SetClubActiveRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setClubActive(dc: DataConnect, vars: SetClubActiveVariables): MutationPromise<SetClubActiveData, SetClubActiveVariables>;

interface SetClubActiveRef {
  ...
  (dc: DataConnect, vars: SetClubActiveVariables): MutationRef<SetClubActiveData, SetClubActiveVariables>;
}
export const setClubActiveRef: SetClubActiveRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setClubActiveRef:
```typescript
const name = setClubActiveRef.operationName;
console.log(name);
```

### Variables
The `SetClubActive` mutation requires an argument of type `SetClubActiveVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetClubActiveVariables {
  userId?: string;
  id: string;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetClubActive` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetClubActiveData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SetClubActive`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setClubActive, SetClubActiveVariables } from '@clubs-platform/dataconnect';

// The `SetClubActive` mutation requires an argument of type `SetClubActiveVariables`:
const setClubActiveVars: SetClubActiveVariables = {
  userId: ..., // optional
  id: ..., 
  active: ..., 
};

// Call the `setClubActive()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setClubActive(setClubActiveVars);
// Variables can be defined inline as well.
const { data } = await setClubActive({ userId: ..., id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setClubActive(dataConnect, setClubActiveVars);

console.log(data.query);
console.log(data.club);

// Or, you can use the `Promise` API.
setClubActive(setClubActiveVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.club);
});
```

### Using `SetClubActive`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setClubActiveRef, SetClubActiveVariables } from '@clubs-platform/dataconnect';

// The `SetClubActive` mutation requires an argument of type `SetClubActiveVariables`:
const setClubActiveVars: SetClubActiveVariables = {
  userId: ..., // optional
  id: ..., 
  active: ..., 
};

// Call the `setClubActiveRef()` function to get a reference to the mutation.
const ref = setClubActiveRef(setClubActiveVars);
// Variables can be defined inline as well.
const ref = setClubActiveRef({ userId: ..., id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setClubActiveRef(dataConnect, setClubActiveVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.club);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.club);
});
```

## DeleteClub
You can execute the `DeleteClub` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteClub(vars: DeleteClubVariables): MutationPromise<DeleteClubData, DeleteClubVariables>;

interface DeleteClubRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClubVariables): MutationRef<DeleteClubData, DeleteClubVariables>;
}
export const deleteClubRef: DeleteClubRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteClub(dc: DataConnect, vars: DeleteClubVariables): MutationPromise<DeleteClubData, DeleteClubVariables>;

interface DeleteClubRef {
  ...
  (dc: DataConnect, vars: DeleteClubVariables): MutationRef<DeleteClubData, DeleteClubVariables>;
}
export const deleteClubRef: DeleteClubRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteClubRef:
```typescript
const name = deleteClubRef.operationName;
console.log(name);
```

### Variables
The `DeleteClub` mutation requires an argument of type `DeleteClubVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteClubVariables {
  userId?: string;
  id: string;
}
```
### Return Type
Recall that executing the `DeleteClub` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteClubData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteClubData {
  query?: {
    platformAdmin?: {
      user: {
        id: string;
      } & User_Key;
    };
  };
  invites?: unknown | null;
  heroes?: unknown | null;
  members?: unknown | null;
  windows?: unknown | null;
  lineups?: unknown | null;
  club?: unknown | null;
}
```
### Using `DeleteClub`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteClub, DeleteClubVariables } from '@clubs-platform/dataconnect';

// The `DeleteClub` mutation requires an argument of type `DeleteClubVariables`:
const deleteClubVars: DeleteClubVariables = {
  userId: ..., // optional
  id: ..., 
};

// Call the `deleteClub()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteClub(deleteClubVars);
// Variables can be defined inline as well.
const { data } = await deleteClub({ userId: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteClub(dataConnect, deleteClubVars);

console.log(data.query);
console.log(data.invites);
console.log(data.heroes);
console.log(data.members);
console.log(data.windows);
console.log(data.lineups);
console.log(data.club);

// Or, you can use the `Promise` API.
deleteClub(deleteClubVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.invites);
  console.log(data.heroes);
  console.log(data.members);
  console.log(data.windows);
  console.log(data.lineups);
  console.log(data.club);
});
```

### Using `DeleteClub`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteClubRef, DeleteClubVariables } from '@clubs-platform/dataconnect';

// The `DeleteClub` mutation requires an argument of type `DeleteClubVariables`:
const deleteClubVars: DeleteClubVariables = {
  userId: ..., // optional
  id: ..., 
};

// Call the `deleteClubRef()` function to get a reference to the mutation.
const ref = deleteClubRef(deleteClubVars);
// Variables can be defined inline as well.
const ref = deleteClubRef({ userId: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteClubRef(dataConnect, deleteClubVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.invites);
console.log(data.heroes);
console.log(data.members);
console.log(data.windows);
console.log(data.lineups);
console.log(data.club);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.invites);
  console.log(data.heroes);
  console.log(data.members);
  console.log(data.windows);
  console.log(data.lineups);
  console.log(data.club);
});
```

## SaveClubInvite
You can execute the `SaveClubInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveClubInvite(vars: SaveClubInviteVariables): MutationPromise<SaveClubInviteData, SaveClubInviteVariables>;

interface SaveClubInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubInviteVariables): MutationRef<SaveClubInviteData, SaveClubInviteVariables>;
}
export const saveClubInviteRef: SaveClubInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveClubInvite(dc: DataConnect, vars: SaveClubInviteVariables): MutationPromise<SaveClubInviteData, SaveClubInviteVariables>;

interface SaveClubInviteRef {
  ...
  (dc: DataConnect, vars: SaveClubInviteVariables): MutationRef<SaveClubInviteData, SaveClubInviteVariables>;
}
export const saveClubInviteRef: SaveClubInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveClubInviteRef:
```typescript
const name = saveClubInviteRef.operationName;
console.log(name);
```

### Variables
The `SaveClubInvite` mutation requires an argument of type `SaveClubInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveClubInviteVariables {
  clubId: string;
  emailKey: string;
  email: string;
  role: string;
  token: string;
  kind: string;
}
```
### Return Type
Recall that executing the `SaveClubInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveClubInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveClubInviteData {
  invite?: unknown | null;
}
```
### Using `SaveClubInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveClubInvite, SaveClubInviteVariables } from '@clubs-platform/dataconnect';

// The `SaveClubInvite` mutation requires an argument of type `SaveClubInviteVariables`:
const saveClubInviteVars: SaveClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
  email: ..., 
  role: ..., 
  token: ..., 
  kind: ..., 
};

// Call the `saveClubInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveClubInvite(saveClubInviteVars);
// Variables can be defined inline as well.
const { data } = await saveClubInvite({ clubId: ..., emailKey: ..., email: ..., role: ..., token: ..., kind: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveClubInvite(dataConnect, saveClubInviteVars);

console.log(data.invite);

// Or, you can use the `Promise` API.
saveClubInvite(saveClubInviteVars).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

### Using `SaveClubInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveClubInviteRef, SaveClubInviteVariables } from '@clubs-platform/dataconnect';

// The `SaveClubInvite` mutation requires an argument of type `SaveClubInviteVariables`:
const saveClubInviteVars: SaveClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
  email: ..., 
  role: ..., 
  token: ..., 
  kind: ..., 
};

// Call the `saveClubInviteRef()` function to get a reference to the mutation.
const ref = saveClubInviteRef(saveClubInviteVars);
// Variables can be defined inline as well.
const ref = saveClubInviteRef({ clubId: ..., emailKey: ..., email: ..., role: ..., token: ..., kind: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveClubInviteRef(dataConnect, saveClubInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

## RemoveClubInvite
You can execute the `RemoveClubInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
removeClubInvite(vars: RemoveClubInviteVariables): MutationPromise<RemoveClubInviteData, RemoveClubInviteVariables>;

interface RemoveClubInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveClubInviteVariables): MutationRef<RemoveClubInviteData, RemoveClubInviteVariables>;
}
export const removeClubInviteRef: RemoveClubInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removeClubInvite(dc: DataConnect, vars: RemoveClubInviteVariables): MutationPromise<RemoveClubInviteData, RemoveClubInviteVariables>;

interface RemoveClubInviteRef {
  ...
  (dc: DataConnect, vars: RemoveClubInviteVariables): MutationRef<RemoveClubInviteData, RemoveClubInviteVariables>;
}
export const removeClubInviteRef: RemoveClubInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removeClubInviteRef:
```typescript
const name = removeClubInviteRef.operationName;
console.log(name);
```

### Variables
The `RemoveClubInvite` mutation requires an argument of type `RemoveClubInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemoveClubInviteVariables {
  clubId: string;
  emailKey: string;
}
```
### Return Type
Recall that executing the `RemoveClubInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemoveClubInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RemoveClubInviteData {
  invite?: unknown | null;
}
```
### Using `RemoveClubInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removeClubInvite, RemoveClubInviteVariables } from '@clubs-platform/dataconnect';

// The `RemoveClubInvite` mutation requires an argument of type `RemoveClubInviteVariables`:
const removeClubInviteVars: RemoveClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
};

// Call the `removeClubInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removeClubInvite(removeClubInviteVars);
// Variables can be defined inline as well.
const { data } = await removeClubInvite({ clubId: ..., emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removeClubInvite(dataConnect, removeClubInviteVars);

console.log(data.invite);

// Or, you can use the `Promise` API.
removeClubInvite(removeClubInviteVars).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

### Using `RemoveClubInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removeClubInviteRef, RemoveClubInviteVariables } from '@clubs-platform/dataconnect';

// The `RemoveClubInvite` mutation requires an argument of type `RemoveClubInviteVariables`:
const removeClubInviteVars: RemoveClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
};

// Call the `removeClubInviteRef()` function to get a reference to the mutation.
const ref = removeClubInviteRef(removeClubInviteVars);
// Variables can be defined inline as well.
const ref = removeClubInviteRef({ clubId: ..., emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removeClubInviteRef(dataConnect, removeClubInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

## SaveSignupInvite
You can execute the `SaveSignupInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveSignupInvite(vars: SaveSignupInviteVariables): MutationPromise<SaveSignupInviteData, SaveSignupInviteVariables>;

interface SaveSignupInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveSignupInviteVariables): MutationRef<SaveSignupInviteData, SaveSignupInviteVariables>;
}
export const saveSignupInviteRef: SaveSignupInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveSignupInvite(dc: DataConnect, vars: SaveSignupInviteVariables): MutationPromise<SaveSignupInviteData, SaveSignupInviteVariables>;

interface SaveSignupInviteRef {
  ...
  (dc: DataConnect, vars: SaveSignupInviteVariables): MutationRef<SaveSignupInviteData, SaveSignupInviteVariables>;
}
export const saveSignupInviteRef: SaveSignupInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveSignupInviteRef:
```typescript
const name = saveSignupInviteRef.operationName;
console.log(name);
```

### Variables
The `SaveSignupInvite` mutation requires an argument of type `SaveSignupInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveSignupInviteVariables {
  emailKey: string;
  email: string;
  clubId?: string | null;
  platform: boolean;
}
```
### Return Type
Recall that executing the `SaveSignupInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveSignupInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveSignupInviteData {
  invite?: unknown | null;
}
```
### Using `SaveSignupInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveSignupInvite, SaveSignupInviteVariables } from '@clubs-platform/dataconnect';

// The `SaveSignupInvite` mutation requires an argument of type `SaveSignupInviteVariables`:
const saveSignupInviteVars: SaveSignupInviteVariables = {
  emailKey: ..., 
  email: ..., 
  clubId: ..., // optional
  platform: ..., 
};

// Call the `saveSignupInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveSignupInvite(saveSignupInviteVars);
// Variables can be defined inline as well.
const { data } = await saveSignupInvite({ emailKey: ..., email: ..., clubId: ..., platform: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveSignupInvite(dataConnect, saveSignupInviteVars);

console.log(data.invite);

// Or, you can use the `Promise` API.
saveSignupInvite(saveSignupInviteVars).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

### Using `SaveSignupInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveSignupInviteRef, SaveSignupInviteVariables } from '@clubs-platform/dataconnect';

// The `SaveSignupInvite` mutation requires an argument of type `SaveSignupInviteVariables`:
const saveSignupInviteVars: SaveSignupInviteVariables = {
  emailKey: ..., 
  email: ..., 
  clubId: ..., // optional
  platform: ..., 
};

// Call the `saveSignupInviteRef()` function to get a reference to the mutation.
const ref = saveSignupInviteRef(saveSignupInviteVars);
// Variables can be defined inline as well.
const ref = saveSignupInviteRef({ emailKey: ..., email: ..., clubId: ..., platform: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveSignupInviteRef(dataConnect, saveSignupInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

## ClearSignupInvite
You can execute the `ClearSignupInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearSignupInvite(vars: ClearSignupInviteVariables): MutationPromise<ClearSignupInviteData, ClearSignupInviteVariables>;

interface ClearSignupInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearSignupInviteVariables): MutationRef<ClearSignupInviteData, ClearSignupInviteVariables>;
}
export const clearSignupInviteRef: ClearSignupInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearSignupInvite(dc: DataConnect, vars: ClearSignupInviteVariables): MutationPromise<ClearSignupInviteData, ClearSignupInviteVariables>;

interface ClearSignupInviteRef {
  ...
  (dc: DataConnect, vars: ClearSignupInviteVariables): MutationRef<ClearSignupInviteData, ClearSignupInviteVariables>;
}
export const clearSignupInviteRef: ClearSignupInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearSignupInviteRef:
```typescript
const name = clearSignupInviteRef.operationName;
console.log(name);
```

### Variables
The `ClearSignupInvite` mutation requires an argument of type `ClearSignupInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearSignupInviteVariables {
  emailKey: string;
}
```
### Return Type
Recall that executing the `ClearSignupInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearSignupInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClearSignupInviteData {
  invite?: unknown | null;
}
```
### Using `ClearSignupInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearSignupInvite, ClearSignupInviteVariables } from '@clubs-platform/dataconnect';

// The `ClearSignupInvite` mutation requires an argument of type `ClearSignupInviteVariables`:
const clearSignupInviteVars: ClearSignupInviteVariables = {
  emailKey: ..., 
};

// Call the `clearSignupInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearSignupInvite(clearSignupInviteVars);
// Variables can be defined inline as well.
const { data } = await clearSignupInvite({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearSignupInvite(dataConnect, clearSignupInviteVars);

console.log(data.invite);

// Or, you can use the `Promise` API.
clearSignupInvite(clearSignupInviteVars).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

### Using `ClearSignupInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearSignupInviteRef, ClearSignupInviteVariables } from '@clubs-platform/dataconnect';

// The `ClearSignupInvite` mutation requires an argument of type `ClearSignupInviteVariables`:
const clearSignupInviteVars: ClearSignupInviteVariables = {
  emailKey: ..., 
};

// Call the `clearSignupInviteRef()` function to get a reference to the mutation.
const ref = clearSignupInviteRef(clearSignupInviteVars);
// Variables can be defined inline as well.
const ref = clearSignupInviteRef({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearSignupInviteRef(dataConnect, clearSignupInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

## SetClubMemberRole
You can execute the `SetClubMemberRole` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setClubMemberRole(vars: SetClubMemberRoleVariables): MutationPromise<SetClubMemberRoleData, SetClubMemberRoleVariables>;

interface SetClubMemberRoleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubMemberRoleVariables): MutationRef<SetClubMemberRoleData, SetClubMemberRoleVariables>;
}
export const setClubMemberRoleRef: SetClubMemberRoleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setClubMemberRole(dc: DataConnect, vars: SetClubMemberRoleVariables): MutationPromise<SetClubMemberRoleData, SetClubMemberRoleVariables>;

interface SetClubMemberRoleRef {
  ...
  (dc: DataConnect, vars: SetClubMemberRoleVariables): MutationRef<SetClubMemberRoleData, SetClubMemberRoleVariables>;
}
export const setClubMemberRoleRef: SetClubMemberRoleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setClubMemberRoleRef:
```typescript
const name = setClubMemberRoleRef.operationName;
console.log(name);
```

### Variables
The `SetClubMemberRole` mutation requires an argument of type `SetClubMemberRoleVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetClubMemberRoleVariables {
  clubId: string;
  userId: string;
  role: string;
}
```
### Return Type
Recall that executing the `SetClubMemberRole` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetClubMemberRoleData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetClubMemberRoleData {
  member?: unknown | null;
}
```
### Using `SetClubMemberRole`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setClubMemberRole, SetClubMemberRoleVariables } from '@clubs-platform/dataconnect';

// The `SetClubMemberRole` mutation requires an argument of type `SetClubMemberRoleVariables`:
const setClubMemberRoleVars: SetClubMemberRoleVariables = {
  clubId: ..., 
  userId: ..., 
  role: ..., 
};

// Call the `setClubMemberRole()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setClubMemberRole(setClubMemberRoleVars);
// Variables can be defined inline as well.
const { data } = await setClubMemberRole({ clubId: ..., userId: ..., role: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setClubMemberRole(dataConnect, setClubMemberRoleVars);

console.log(data.member);

// Or, you can use the `Promise` API.
setClubMemberRole(setClubMemberRoleVars).then((response) => {
  const data = response.data;
  console.log(data.member);
});
```

### Using `SetClubMemberRole`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setClubMemberRoleRef, SetClubMemberRoleVariables } from '@clubs-platform/dataconnect';

// The `SetClubMemberRole` mutation requires an argument of type `SetClubMemberRoleVariables`:
const setClubMemberRoleVars: SetClubMemberRoleVariables = {
  clubId: ..., 
  userId: ..., 
  role: ..., 
};

// Call the `setClubMemberRoleRef()` function to get a reference to the mutation.
const ref = setClubMemberRoleRef(setClubMemberRoleVars);
// Variables can be defined inline as well.
const ref = setClubMemberRoleRef({ clubId: ..., userId: ..., role: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setClubMemberRoleRef(dataConnect, setClubMemberRoleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.member);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.member);
});
```

## RemoveClubMember
You can execute the `RemoveClubMember` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
removeClubMember(vars: RemoveClubMemberVariables): MutationPromise<RemoveClubMemberData, RemoveClubMemberVariables>;

interface RemoveClubMemberRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveClubMemberVariables): MutationRef<RemoveClubMemberData, RemoveClubMemberVariables>;
}
export const removeClubMemberRef: RemoveClubMemberRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removeClubMember(dc: DataConnect, vars: RemoveClubMemberVariables): MutationPromise<RemoveClubMemberData, RemoveClubMemberVariables>;

interface RemoveClubMemberRef {
  ...
  (dc: DataConnect, vars: RemoveClubMemberVariables): MutationRef<RemoveClubMemberData, RemoveClubMemberVariables>;
}
export const removeClubMemberRef: RemoveClubMemberRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removeClubMemberRef:
```typescript
const name = removeClubMemberRef.operationName;
console.log(name);
```

### Variables
The `RemoveClubMember` mutation requires an argument of type `RemoveClubMemberVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemoveClubMemberVariables {
  clubId: string;
  userId: string;
}
```
### Return Type
Recall that executing the `RemoveClubMember` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemoveClubMemberData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RemoveClubMemberData {
  member?: unknown | null;
}
```
### Using `RemoveClubMember`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removeClubMember, RemoveClubMemberVariables } from '@clubs-platform/dataconnect';

// The `RemoveClubMember` mutation requires an argument of type `RemoveClubMemberVariables`:
const removeClubMemberVars: RemoveClubMemberVariables = {
  clubId: ..., 
  userId: ..., 
};

// Call the `removeClubMember()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removeClubMember(removeClubMemberVars);
// Variables can be defined inline as well.
const { data } = await removeClubMember({ clubId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removeClubMember(dataConnect, removeClubMemberVars);

console.log(data.member);

// Or, you can use the `Promise` API.
removeClubMember(removeClubMemberVars).then((response) => {
  const data = response.data;
  console.log(data.member);
});
```

### Using `RemoveClubMember`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removeClubMemberRef, RemoveClubMemberVariables } from '@clubs-platform/dataconnect';

// The `RemoveClubMember` mutation requires an argument of type `RemoveClubMemberVariables`:
const removeClubMemberVars: RemoveClubMemberVariables = {
  clubId: ..., 
  userId: ..., 
};

// Call the `removeClubMemberRef()` function to get a reference to the mutation.
const ref = removeClubMemberRef(removeClubMemberVars);
// Variables can be defined inline as well.
const ref = removeClubMemberRef({ clubId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removeClubMemberRef(dataConnect, removeClubMemberVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.member);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.member);
});
```

## AcceptClubInvite
You can execute the `AcceptClubInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
acceptClubInvite(vars: AcceptClubInviteVariables): MutationPromise<AcceptClubInviteData, AcceptClubInviteVariables>;

interface AcceptClubInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AcceptClubInviteVariables): MutationRef<AcceptClubInviteData, AcceptClubInviteVariables>;
}
export const acceptClubInviteRef: AcceptClubInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
acceptClubInvite(dc: DataConnect, vars: AcceptClubInviteVariables): MutationPromise<AcceptClubInviteData, AcceptClubInviteVariables>;

interface AcceptClubInviteRef {
  ...
  (dc: DataConnect, vars: AcceptClubInviteVariables): MutationRef<AcceptClubInviteData, AcceptClubInviteVariables>;
}
export const acceptClubInviteRef: AcceptClubInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the acceptClubInviteRef:
```typescript
const name = acceptClubInviteRef.operationName;
console.log(name);
```

### Variables
The `AcceptClubInvite` mutation requires an argument of type `AcceptClubInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AcceptClubInviteVariables {
  clubId: string;
  emailKey: string;
  token: string;
  displayName: string;
}
```
### Return Type
Recall that executing the `AcceptClubInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AcceptClubInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AcceptClubInviteData {
  ensured?: number | null;
  member?: unknown | null;
  droppedSignup?: number | null;
  droppedInvite?: number | null;
}
```
### Using `AcceptClubInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, acceptClubInvite, AcceptClubInviteVariables } from '@clubs-platform/dataconnect';

// The `AcceptClubInvite` mutation requires an argument of type `AcceptClubInviteVariables`:
const acceptClubInviteVars: AcceptClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
  token: ..., 
  displayName: ..., 
};

// Call the `acceptClubInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await acceptClubInvite(acceptClubInviteVars);
// Variables can be defined inline as well.
const { data } = await acceptClubInvite({ clubId: ..., emailKey: ..., token: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await acceptClubInvite(dataConnect, acceptClubInviteVars);

console.log(data.ensured);
console.log(data.member);
console.log(data.droppedSignup);
console.log(data.droppedInvite);

// Or, you can use the `Promise` API.
acceptClubInvite(acceptClubInviteVars).then((response) => {
  const data = response.data;
  console.log(data.ensured);
  console.log(data.member);
  console.log(data.droppedSignup);
  console.log(data.droppedInvite);
});
```

### Using `AcceptClubInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, acceptClubInviteRef, AcceptClubInviteVariables } from '@clubs-platform/dataconnect';

// The `AcceptClubInvite` mutation requires an argument of type `AcceptClubInviteVariables`:
const acceptClubInviteVars: AcceptClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
  token: ..., 
  displayName: ..., 
};

// Call the `acceptClubInviteRef()` function to get a reference to the mutation.
const ref = acceptClubInviteRef(acceptClubInviteVars);
// Variables can be defined inline as well.
const ref = acceptClubInviteRef({ clubId: ..., emailKey: ..., token: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = acceptClubInviteRef(dataConnect, acceptClubInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ensured);
console.log(data.member);
console.log(data.droppedSignup);
console.log(data.droppedInvite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ensured);
  console.log(data.member);
  console.log(data.droppedSignup);
  console.log(data.droppedInvite);
});
```

## DeclineClubInvite
You can execute the `DeclineClubInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
declineClubInvite(vars: DeclineClubInviteVariables): MutationPromise<DeclineClubInviteData, DeclineClubInviteVariables>;

interface DeclineClubInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeclineClubInviteVariables): MutationRef<DeclineClubInviteData, DeclineClubInviteVariables>;
}
export const declineClubInviteRef: DeclineClubInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
declineClubInvite(dc: DataConnect, vars: DeclineClubInviteVariables): MutationPromise<DeclineClubInviteData, DeclineClubInviteVariables>;

interface DeclineClubInviteRef {
  ...
  (dc: DataConnect, vars: DeclineClubInviteVariables): MutationRef<DeclineClubInviteData, DeclineClubInviteVariables>;
}
export const declineClubInviteRef: DeclineClubInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the declineClubInviteRef:
```typescript
const name = declineClubInviteRef.operationName;
console.log(name);
```

### Variables
The `DeclineClubInvite` mutation requires an argument of type `DeclineClubInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeclineClubInviteVariables {
  clubId: string;
  emailKey: string;
  token: string;
}
```
### Return Type
Recall that executing the `DeclineClubInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeclineClubInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeclineClubInviteData {
  droppedSignup?: number | null;
  invite?: unknown | null;
}
```
### Using `DeclineClubInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, declineClubInvite, DeclineClubInviteVariables } from '@clubs-platform/dataconnect';

// The `DeclineClubInvite` mutation requires an argument of type `DeclineClubInviteVariables`:
const declineClubInviteVars: DeclineClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
  token: ..., 
};

// Call the `declineClubInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await declineClubInvite(declineClubInviteVars);
// Variables can be defined inline as well.
const { data } = await declineClubInvite({ clubId: ..., emailKey: ..., token: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await declineClubInvite(dataConnect, declineClubInviteVars);

console.log(data.droppedSignup);
console.log(data.invite);

// Or, you can use the `Promise` API.
declineClubInvite(declineClubInviteVars).then((response) => {
  const data = response.data;
  console.log(data.droppedSignup);
  console.log(data.invite);
});
```

### Using `DeclineClubInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, declineClubInviteRef, DeclineClubInviteVariables } from '@clubs-platform/dataconnect';

// The `DeclineClubInvite` mutation requires an argument of type `DeclineClubInviteVariables`:
const declineClubInviteVars: DeclineClubInviteVariables = {
  clubId: ..., 
  emailKey: ..., 
  token: ..., 
};

// Call the `declineClubInviteRef()` function to get a reference to the mutation.
const ref = declineClubInviteRef(declineClubInviteVars);
// Variables can be defined inline as well.
const ref = declineClubInviteRef({ clubId: ..., emailKey: ..., token: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = declineClubInviteRef(dataConnect, declineClubInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.droppedSignup);
console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.droppedSignup);
  console.log(data.invite);
});
```

## CreateSeason
You can execute the `CreateSeason` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
createSeason(vars: CreateSeasonVariables): MutationPromise<CreateSeasonData, CreateSeasonVariables>;

interface CreateSeasonRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSeasonVariables): MutationRef<CreateSeasonData, CreateSeasonVariables>;
}
export const createSeasonRef: CreateSeasonRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSeason(dc: DataConnect, vars: CreateSeasonVariables): MutationPromise<CreateSeasonData, CreateSeasonVariables>;

interface CreateSeasonRef {
  ...
  (dc: DataConnect, vars: CreateSeasonVariables): MutationRef<CreateSeasonData, CreateSeasonVariables>;
}
export const createSeasonRef: CreateSeasonRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSeasonRef:
```typescript
const name = createSeasonRef.operationName;
console.log(name);
```

### Variables
The `CreateSeason` mutation requires an argument of type `CreateSeasonVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSeasonVariables {
  userId?: string;
  id: string;
  name: string;
  startDate?: DateString | null;
  endDate?: DateString | null;
  active: boolean;
}
```
### Return Type
Recall that executing the `CreateSeason` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSeasonData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CreateSeason`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSeason, CreateSeasonVariables } from '@clubs-platform/dataconnect';

// The `CreateSeason` mutation requires an argument of type `CreateSeasonVariables`:
const createSeasonVars: CreateSeasonVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  startDate: ..., // optional
  endDate: ..., // optional
  active: ..., 
};

// Call the `createSeason()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSeason(createSeasonVars);
// Variables can be defined inline as well.
const { data } = await createSeason({ userId: ..., id: ..., name: ..., startDate: ..., endDate: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSeason(dataConnect, createSeasonVars);

console.log(data.query);
console.log(data.season);

// Or, you can use the `Promise` API.
createSeason(createSeasonVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.season);
});
```

### Using `CreateSeason`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSeasonRef, CreateSeasonVariables } from '@clubs-platform/dataconnect';

// The `CreateSeason` mutation requires an argument of type `CreateSeasonVariables`:
const createSeasonVars: CreateSeasonVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  startDate: ..., // optional
  endDate: ..., // optional
  active: ..., 
};

// Call the `createSeasonRef()` function to get a reference to the mutation.
const ref = createSeasonRef(createSeasonVars);
// Variables can be defined inline as well.
const ref = createSeasonRef({ userId: ..., id: ..., name: ..., startDate: ..., endDate: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSeasonRef(dataConnect, createSeasonVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.season);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.season);
});
```

## SetSeasonActive
You can execute the `SetSeasonActive` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setSeasonActive(vars: SetSeasonActiveVariables): MutationPromise<SetSeasonActiveData, SetSeasonActiveVariables>;

interface SetSeasonActiveRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSeasonActiveVariables): MutationRef<SetSeasonActiveData, SetSeasonActiveVariables>;
}
export const setSeasonActiveRef: SetSeasonActiveRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setSeasonActive(dc: DataConnect, vars: SetSeasonActiveVariables): MutationPromise<SetSeasonActiveData, SetSeasonActiveVariables>;

interface SetSeasonActiveRef {
  ...
  (dc: DataConnect, vars: SetSeasonActiveVariables): MutationRef<SetSeasonActiveData, SetSeasonActiveVariables>;
}
export const setSeasonActiveRef: SetSeasonActiveRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setSeasonActiveRef:
```typescript
const name = setSeasonActiveRef.operationName;
console.log(name);
```

### Variables
The `SetSeasonActive` mutation requires an argument of type `SetSeasonActiveVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetSeasonActiveVariables {
  userId?: string;
  id: string;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetSeasonActive` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetSeasonActiveData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SetSeasonActive`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setSeasonActive, SetSeasonActiveVariables } from '@clubs-platform/dataconnect';

// The `SetSeasonActive` mutation requires an argument of type `SetSeasonActiveVariables`:
const setSeasonActiveVars: SetSeasonActiveVariables = {
  userId: ..., // optional
  id: ..., 
  active: ..., 
};

// Call the `setSeasonActive()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setSeasonActive(setSeasonActiveVars);
// Variables can be defined inline as well.
const { data } = await setSeasonActive({ userId: ..., id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setSeasonActive(dataConnect, setSeasonActiveVars);

console.log(data.query);
console.log(data.season);

// Or, you can use the `Promise` API.
setSeasonActive(setSeasonActiveVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.season);
});
```

### Using `SetSeasonActive`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setSeasonActiveRef, SetSeasonActiveVariables } from '@clubs-platform/dataconnect';

// The `SetSeasonActive` mutation requires an argument of type `SetSeasonActiveVariables`:
const setSeasonActiveVars: SetSeasonActiveVariables = {
  userId: ..., // optional
  id: ..., 
  active: ..., 
};

// Call the `setSeasonActiveRef()` function to get a reference to the mutation.
const ref = setSeasonActiveRef(setSeasonActiveVars);
// Variables can be defined inline as well.
const ref = setSeasonActiveRef({ userId: ..., id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setSeasonActiveRef(dataConnect, setSeasonActiveVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.season);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.season);
});
```

## DeleteSeason
You can execute the `DeleteSeason` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteSeason(vars: DeleteSeasonVariables): MutationPromise<DeleteSeasonData, DeleteSeasonVariables>;

interface DeleteSeasonRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSeasonVariables): MutationRef<DeleteSeasonData, DeleteSeasonVariables>;
}
export const deleteSeasonRef: DeleteSeasonRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSeason(dc: DataConnect, vars: DeleteSeasonVariables): MutationPromise<DeleteSeasonData, DeleteSeasonVariables>;

interface DeleteSeasonRef {
  ...
  (dc: DataConnect, vars: DeleteSeasonVariables): MutationRef<DeleteSeasonData, DeleteSeasonVariables>;
}
export const deleteSeasonRef: DeleteSeasonRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSeasonRef:
```typescript
const name = deleteSeasonRef.operationName;
console.log(name);
```

### Variables
The `DeleteSeason` mutation requires an argument of type `DeleteSeasonVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSeasonVariables {
  userId?: string;
  id: string;
}
```
### Return Type
Recall that executing the `DeleteSeason` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSeasonData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `DeleteSeason`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSeason, DeleteSeasonVariables } from '@clubs-platform/dataconnect';

// The `DeleteSeason` mutation requires an argument of type `DeleteSeasonVariables`:
const deleteSeasonVars: DeleteSeasonVariables = {
  userId: ..., // optional
  id: ..., 
};

// Call the `deleteSeason()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSeason(deleteSeasonVars);
// Variables can be defined inline as well.
const { data } = await deleteSeason({ userId: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSeason(dataConnect, deleteSeasonVars);

console.log(data.query);
console.log(data.season);

// Or, you can use the `Promise` API.
deleteSeason(deleteSeasonVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.season);
});
```

### Using `DeleteSeason`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSeasonRef, DeleteSeasonVariables } from '@clubs-platform/dataconnect';

// The `DeleteSeason` mutation requires an argument of type `DeleteSeasonVariables`:
const deleteSeasonVars: DeleteSeasonVariables = {
  userId: ..., // optional
  id: ..., 
};

// Call the `deleteSeasonRef()` function to get a reference to the mutation.
const ref = deleteSeasonRef(deleteSeasonVars);
// Variables can be defined inline as well.
const ref = deleteSeasonRef({ userId: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSeasonRef(dataConnect, deleteSeasonVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.season);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.season);
});
```

## CreateCategory
You can execute the `CreateCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
}
export const createCategoryRef: CreateCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateCategoryRef {
  ...
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
}
export const createCategoryRef: CreateCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCategoryRef:
```typescript
const name = createCategoryRef.operationName;
console.log(name);
```

### Variables
The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCategoryVariables {
  userId?: string;
  id: string;
  name: string;
  sortOrder: number;
}
```
### Return Type
Recall that executing the `CreateCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCategoryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CreateCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCategory, CreateCategoryVariables } from '@clubs-platform/dataconnect';

// The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`:
const createCategoryVars: CreateCategoryVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  sortOrder: ..., 
};

// Call the `createCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCategory(createCategoryVars);
// Variables can be defined inline as well.
const { data } = await createCategory({ userId: ..., id: ..., name: ..., sortOrder: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCategory(dataConnect, createCategoryVars);

console.log(data.query);
console.log(data.category);

// Or, you can use the `Promise` API.
createCategory(createCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.category);
});
```

### Using `CreateCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCategoryRef, CreateCategoryVariables } from '@clubs-platform/dataconnect';

// The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`:
const createCategoryVars: CreateCategoryVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  sortOrder: ..., 
};

// Call the `createCategoryRef()` function to get a reference to the mutation.
const ref = createCategoryRef(createCategoryVars);
// Variables can be defined inline as well.
const ref = createCategoryRef({ userId: ..., id: ..., name: ..., sortOrder: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCategoryRef(dataConnect, createCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.category);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.category);
});
```

## CreateTournament
You can execute the `CreateTournament` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
createTournament(vars: CreateTournamentVariables): MutationPromise<CreateTournamentData, CreateTournamentVariables>;

interface CreateTournamentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTournamentVariables): MutationRef<CreateTournamentData, CreateTournamentVariables>;
}
export const createTournamentRef: CreateTournamentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTournament(dc: DataConnect, vars: CreateTournamentVariables): MutationPromise<CreateTournamentData, CreateTournamentVariables>;

interface CreateTournamentRef {
  ...
  (dc: DataConnect, vars: CreateTournamentVariables): MutationRef<CreateTournamentData, CreateTournamentVariables>;
}
export const createTournamentRef: CreateTournamentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTournamentRef:
```typescript
const name = createTournamentRef.operationName;
console.log(name);
```

### Variables
The `CreateTournament` mutation requires an argument of type `CreateTournamentVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateTournament` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTournamentData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `CreateTournament`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTournament, CreateTournamentVariables } from '@clubs-platform/dataconnect';

// The `CreateTournament` mutation requires an argument of type `CreateTournamentVariables`:
const createTournamentVars: CreateTournamentVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  seasonId: ..., 
  categoryId: ..., 
  groupId: ..., 
  footballType: ..., 
  durationMinutes: ..., 
  startDate: ..., 
  description: ..., 
};

// Call the `createTournament()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTournament(createTournamentVars);
// Variables can be defined inline as well.
const { data } = await createTournament({ userId: ..., id: ..., name: ..., seasonId: ..., categoryId: ..., groupId: ..., footballType: ..., durationMinutes: ..., startDate: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTournament(dataConnect, createTournamentVars);

console.log(data.query);
console.log(data.grouped);
console.log(data.tournament);

// Or, you can use the `Promise` API.
createTournament(createTournamentVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.grouped);
  console.log(data.tournament);
});
```

### Using `CreateTournament`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTournamentRef, CreateTournamentVariables } from '@clubs-platform/dataconnect';

// The `CreateTournament` mutation requires an argument of type `CreateTournamentVariables`:
const createTournamentVars: CreateTournamentVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  seasonId: ..., 
  categoryId: ..., 
  groupId: ..., 
  footballType: ..., 
  durationMinutes: ..., 
  startDate: ..., 
  description: ..., 
};

// Call the `createTournamentRef()` function to get a reference to the mutation.
const ref = createTournamentRef(createTournamentVars);
// Variables can be defined inline as well.
const ref = createTournamentRef({ userId: ..., id: ..., name: ..., seasonId: ..., categoryId: ..., groupId: ..., footballType: ..., durationMinutes: ..., startDate: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTournamentRef(dataConnect, createTournamentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.grouped);
console.log(data.tournament);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.grouped);
  console.log(data.tournament);
});
```

## SavePlatformHeader
You can execute the `SavePlatformHeader` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
savePlatformHeader(vars: SavePlatformHeaderVariables): MutationPromise<SavePlatformHeaderData, SavePlatformHeaderVariables>;

interface SavePlatformHeaderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformHeaderVariables): MutationRef<SavePlatformHeaderData, SavePlatformHeaderVariables>;
}
export const savePlatformHeaderRef: SavePlatformHeaderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
savePlatformHeader(dc: DataConnect, vars: SavePlatformHeaderVariables): MutationPromise<SavePlatformHeaderData, SavePlatformHeaderVariables>;

interface SavePlatformHeaderRef {
  ...
  (dc: DataConnect, vars: SavePlatformHeaderVariables): MutationRef<SavePlatformHeaderData, SavePlatformHeaderVariables>;
}
export const savePlatformHeaderRef: SavePlatformHeaderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the savePlatformHeaderRef:
```typescript
const name = savePlatformHeaderRef.operationName;
console.log(name);
```

### Variables
The `SavePlatformHeader` mutation requires an argument of type `SavePlatformHeaderVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SavePlatformHeaderVariables {
  name: string;
  motto: string;
  logoUrl: string;
}
```
### Return Type
Recall that executing the `SavePlatformHeader` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SavePlatformHeaderData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SavePlatformHeaderData {
  settings?: unknown | null;
}
```
### Using `SavePlatformHeader`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, savePlatformHeader, SavePlatformHeaderVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformHeader` mutation requires an argument of type `SavePlatformHeaderVariables`:
const savePlatformHeaderVars: SavePlatformHeaderVariables = {
  name: ..., 
  motto: ..., 
  logoUrl: ..., 
};

// Call the `savePlatformHeader()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await savePlatformHeader(savePlatformHeaderVars);
// Variables can be defined inline as well.
const { data } = await savePlatformHeader({ name: ..., motto: ..., logoUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await savePlatformHeader(dataConnect, savePlatformHeaderVars);

console.log(data.settings);

// Or, you can use the `Promise` API.
savePlatformHeader(savePlatformHeaderVars).then((response) => {
  const data = response.data;
  console.log(data.settings);
});
```

### Using `SavePlatformHeader`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, savePlatformHeaderRef, SavePlatformHeaderVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformHeader` mutation requires an argument of type `SavePlatformHeaderVariables`:
const savePlatformHeaderVars: SavePlatformHeaderVariables = {
  name: ..., 
  motto: ..., 
  logoUrl: ..., 
};

// Call the `savePlatformHeaderRef()` function to get a reference to the mutation.
const ref = savePlatformHeaderRef(savePlatformHeaderVars);
// Variables can be defined inline as well.
const ref = savePlatformHeaderRef({ name: ..., motto: ..., logoUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = savePlatformHeaderRef(dataConnect, savePlatformHeaderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.settings);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.settings);
});
```

## SavePlatformCover
You can execute the `SavePlatformCover` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
savePlatformCover(vars: SavePlatformCoverVariables): MutationPromise<SavePlatformCoverData, SavePlatformCoverVariables>;

interface SavePlatformCoverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformCoverVariables): MutationRef<SavePlatformCoverData, SavePlatformCoverVariables>;
}
export const savePlatformCoverRef: SavePlatformCoverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
savePlatformCover(dc: DataConnect, vars: SavePlatformCoverVariables): MutationPromise<SavePlatformCoverData, SavePlatformCoverVariables>;

interface SavePlatformCoverRef {
  ...
  (dc: DataConnect, vars: SavePlatformCoverVariables): MutationRef<SavePlatformCoverData, SavePlatformCoverVariables>;
}
export const savePlatformCoverRef: SavePlatformCoverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the savePlatformCoverRef:
```typescript
const name = savePlatformCoverRef.operationName;
console.log(name);
```

### Variables
The `SavePlatformCover` mutation requires an argument of type `SavePlatformCoverVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SavePlatformCoverVariables {
  headline: string;
  tagline: string;
}
```
### Return Type
Recall that executing the `SavePlatformCover` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SavePlatformCoverData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SavePlatformCoverData {
  settings?: unknown | null;
}
```
### Using `SavePlatformCover`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, savePlatformCover, SavePlatformCoverVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformCover` mutation requires an argument of type `SavePlatformCoverVariables`:
const savePlatformCoverVars: SavePlatformCoverVariables = {
  headline: ..., 
  tagline: ..., 
};

// Call the `savePlatformCover()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await savePlatformCover(savePlatformCoverVars);
// Variables can be defined inline as well.
const { data } = await savePlatformCover({ headline: ..., tagline: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await savePlatformCover(dataConnect, savePlatformCoverVars);

console.log(data.settings);

// Or, you can use the `Promise` API.
savePlatformCover(savePlatformCoverVars).then((response) => {
  const data = response.data;
  console.log(data.settings);
});
```

### Using `SavePlatformCover`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, savePlatformCoverRef, SavePlatformCoverVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformCover` mutation requires an argument of type `SavePlatformCoverVariables`:
const savePlatformCoverVars: SavePlatformCoverVariables = {
  headline: ..., 
  tagline: ..., 
};

// Call the `savePlatformCoverRef()` function to get a reference to the mutation.
const ref = savePlatformCoverRef(savePlatformCoverVars);
// Variables can be defined inline as well.
const ref = savePlatformCoverRef({ headline: ..., tagline: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = savePlatformCoverRef(dataConnect, savePlatformCoverVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.settings);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.settings);
});
```

## SavePlatformSocial
You can execute the `SavePlatformSocial` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
savePlatformSocial(vars: SavePlatformSocialVariables): MutationPromise<SavePlatformSocialData, SavePlatformSocialVariables>;

interface SavePlatformSocialRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformSocialVariables): MutationRef<SavePlatformSocialData, SavePlatformSocialVariables>;
}
export const savePlatformSocialRef: SavePlatformSocialRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
savePlatformSocial(dc: DataConnect, vars: SavePlatformSocialVariables): MutationPromise<SavePlatformSocialData, SavePlatformSocialVariables>;

interface SavePlatformSocialRef {
  ...
  (dc: DataConnect, vars: SavePlatformSocialVariables): MutationRef<SavePlatformSocialData, SavePlatformSocialVariables>;
}
export const savePlatformSocialRef: SavePlatformSocialRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the savePlatformSocialRef:
```typescript
const name = savePlatformSocialRef.operationName;
console.log(name);
```

### Variables
The `SavePlatformSocial` mutation requires an argument of type `SavePlatformSocialVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SavePlatformSocialVariables {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  whatsapp: string;
}
```
### Return Type
Recall that executing the `SavePlatformSocial` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SavePlatformSocialData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SavePlatformSocialData {
  settings?: unknown | null;
}
```
### Using `SavePlatformSocial`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, savePlatformSocial, SavePlatformSocialVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformSocial` mutation requires an argument of type `SavePlatformSocialVariables`:
const savePlatformSocialVars: SavePlatformSocialVariables = {
  instagram: ..., 
  facebook: ..., 
  x: ..., 
  youtube: ..., 
  whatsapp: ..., 
};

// Call the `savePlatformSocial()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await savePlatformSocial(savePlatformSocialVars);
// Variables can be defined inline as well.
const { data } = await savePlatformSocial({ instagram: ..., facebook: ..., x: ..., youtube: ..., whatsapp: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await savePlatformSocial(dataConnect, savePlatformSocialVars);

console.log(data.settings);

// Or, you can use the `Promise` API.
savePlatformSocial(savePlatformSocialVars).then((response) => {
  const data = response.data;
  console.log(data.settings);
});
```

### Using `SavePlatformSocial`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, savePlatformSocialRef, SavePlatformSocialVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformSocial` mutation requires an argument of type `SavePlatformSocialVariables`:
const savePlatformSocialVars: SavePlatformSocialVariables = {
  instagram: ..., 
  facebook: ..., 
  x: ..., 
  youtube: ..., 
  whatsapp: ..., 
};

// Call the `savePlatformSocialRef()` function to get a reference to the mutation.
const ref = savePlatformSocialRef(savePlatformSocialVars);
// Variables can be defined inline as well.
const ref = savePlatformSocialRef({ instagram: ..., facebook: ..., x: ..., youtube: ..., whatsapp: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = savePlatformSocialRef(dataConnect, savePlatformSocialVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.settings);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.settings);
});
```

## ReplaceHeroImages
You can execute the `ReplaceHeroImages` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
replaceHeroImages(vars: ReplaceHeroImagesVariables): MutationPromise<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;

interface ReplaceHeroImagesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceHeroImagesVariables): MutationRef<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;
}
export const replaceHeroImagesRef: ReplaceHeroImagesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
replaceHeroImages(dc: DataConnect, vars: ReplaceHeroImagesVariables): MutationPromise<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;

interface ReplaceHeroImagesRef {
  ...
  (dc: DataConnect, vars: ReplaceHeroImagesVariables): MutationRef<ReplaceHeroImagesData, ReplaceHeroImagesVariables>;
}
export const replaceHeroImagesRef: ReplaceHeroImagesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the replaceHeroImagesRef:
```typescript
const name = replaceHeroImagesRef.operationName;
console.log(name);
```

### Variables
The `ReplaceHeroImages` mutation requires an argument of type `ReplaceHeroImagesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReplaceHeroImagesVariables {
  urls: string;
}
```
### Return Type
Recall that executing the `ReplaceHeroImages` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReplaceHeroImagesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReplaceHeroImagesData {
  images?: unknown | null;
}
```
### Using `ReplaceHeroImages`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, replaceHeroImages, ReplaceHeroImagesVariables } from '@clubs-platform/dataconnect';

// The `ReplaceHeroImages` mutation requires an argument of type `ReplaceHeroImagesVariables`:
const replaceHeroImagesVars: ReplaceHeroImagesVariables = {
  urls: ..., 
};

// Call the `replaceHeroImages()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await replaceHeroImages(replaceHeroImagesVars);
// Variables can be defined inline as well.
const { data } = await replaceHeroImages({ urls: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await replaceHeroImages(dataConnect, replaceHeroImagesVars);

console.log(data.images);

// Or, you can use the `Promise` API.
replaceHeroImages(replaceHeroImagesVars).then((response) => {
  const data = response.data;
  console.log(data.images);
});
```

### Using `ReplaceHeroImages`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, replaceHeroImagesRef, ReplaceHeroImagesVariables } from '@clubs-platform/dataconnect';

// The `ReplaceHeroImages` mutation requires an argument of type `ReplaceHeroImagesVariables`:
const replaceHeroImagesVars: ReplaceHeroImagesVariables = {
  urls: ..., 
};

// Call the `replaceHeroImagesRef()` function to get a reference to the mutation.
const ref = replaceHeroImagesRef(replaceHeroImagesVars);
// Variables can be defined inline as well.
const ref = replaceHeroImagesRef({ urls: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = replaceHeroImagesRef(dataConnect, replaceHeroImagesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.images);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.images);
});
```

## SaveCourtSettings
You can execute the `SaveCourtSettings` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveCourtSettings(vars: SaveCourtSettingsVariables): MutationPromise<SaveCourtSettingsData, SaveCourtSettingsVariables>;

interface SaveCourtSettingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtSettingsVariables): MutationRef<SaveCourtSettingsData, SaveCourtSettingsVariables>;
}
export const saveCourtSettingsRef: SaveCourtSettingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveCourtSettings(dc: DataConnect, vars: SaveCourtSettingsVariables): MutationPromise<SaveCourtSettingsData, SaveCourtSettingsVariables>;

interface SaveCourtSettingsRef {
  ...
  (dc: DataConnect, vars: SaveCourtSettingsVariables): MutationRef<SaveCourtSettingsData, SaveCourtSettingsVariables>;
}
export const saveCourtSettingsRef: SaveCourtSettingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveCourtSettingsRef:
```typescript
const name = saveCourtSettingsRef.operationName;
console.log(name);
```

### Variables
The `SaveCourtSettings` mutation requires an argument of type `SaveCourtSettingsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveCourtSettingsVariables {
  userId?: string;
  enabled: boolean;
  slotMinutes: number;
}
```
### Return Type
Recall that executing the `SaveCourtSettings` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveCourtSettingsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SaveCourtSettings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveCourtSettings, SaveCourtSettingsVariables } from '@clubs-platform/dataconnect';

// The `SaveCourtSettings` mutation requires an argument of type `SaveCourtSettingsVariables`:
const saveCourtSettingsVars: SaveCourtSettingsVariables = {
  userId: ..., // optional
  enabled: ..., 
  slotMinutes: ..., 
};

// Call the `saveCourtSettings()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveCourtSettings(saveCourtSettingsVars);
// Variables can be defined inline as well.
const { data } = await saveCourtSettings({ userId: ..., enabled: ..., slotMinutes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveCourtSettings(dataConnect, saveCourtSettingsVars);

console.log(data.query);
console.log(data.settings);

// Or, you can use the `Promise` API.
saveCourtSettings(saveCourtSettingsVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.settings);
});
```

### Using `SaveCourtSettings`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveCourtSettingsRef, SaveCourtSettingsVariables } from '@clubs-platform/dataconnect';

// The `SaveCourtSettings` mutation requires an argument of type `SaveCourtSettingsVariables`:
const saveCourtSettingsVars: SaveCourtSettingsVariables = {
  userId: ..., // optional
  enabled: ..., 
  slotMinutes: ..., 
};

// Call the `saveCourtSettingsRef()` function to get a reference to the mutation.
const ref = saveCourtSettingsRef(saveCourtSettingsVars);
// Variables can be defined inline as well.
const ref = saveCourtSettingsRef({ userId: ..., enabled: ..., slotMinutes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveCourtSettingsRef(dataConnect, saveCourtSettingsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.settings);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.settings);
});
```

## ClearCourtWindows
You can execute the `ClearCourtWindows` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearCourtWindows(vars?: ClearCourtWindowsVariables): MutationPromise<ClearCourtWindowsData, ClearCourtWindowsVariables>;

interface ClearCourtWindowsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ClearCourtWindowsVariables): MutationRef<ClearCourtWindowsData, ClearCourtWindowsVariables>;
}
export const clearCourtWindowsRef: ClearCourtWindowsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearCourtWindows(dc: DataConnect, vars?: ClearCourtWindowsVariables): MutationPromise<ClearCourtWindowsData, ClearCourtWindowsVariables>;

interface ClearCourtWindowsRef {
  ...
  (dc: DataConnect, vars?: ClearCourtWindowsVariables): MutationRef<ClearCourtWindowsData, ClearCourtWindowsVariables>;
}
export const clearCourtWindowsRef: ClearCourtWindowsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearCourtWindowsRef:
```typescript
const name = clearCourtWindowsRef.operationName;
console.log(name);
```

### Variables
The `ClearCourtWindows` mutation has an optional argument of type `ClearCourtWindowsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearCourtWindowsVariables {
  userId?: string;
}
```
### Return Type
Recall that executing the `ClearCourtWindows` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearCourtWindowsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClearCourtWindows`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearCourtWindows, ClearCourtWindowsVariables } from '@clubs-platform/dataconnect';

// The `ClearCourtWindows` mutation has an optional argument of type `ClearCourtWindowsVariables`:
const clearCourtWindowsVars: ClearCourtWindowsVariables = {
  userId: ..., // optional
};

// Call the `clearCourtWindows()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearCourtWindows(clearCourtWindowsVars);
// Variables can be defined inline as well.
const { data } = await clearCourtWindows({ userId: ..., });
// Since all variables are optional for this mutation, you can omit the `ClearCourtWindowsVariables` argument.
const { data } = await clearCourtWindows();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearCourtWindows(dataConnect, clearCourtWindowsVars);

console.log(data.query);
console.log(data.cleared);

// Or, you can use the `Promise` API.
clearCourtWindows(clearCourtWindowsVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.cleared);
});
```

### Using `ClearCourtWindows`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearCourtWindowsRef, ClearCourtWindowsVariables } from '@clubs-platform/dataconnect';

// The `ClearCourtWindows` mutation has an optional argument of type `ClearCourtWindowsVariables`:
const clearCourtWindowsVars: ClearCourtWindowsVariables = {
  userId: ..., // optional
};

// Call the `clearCourtWindowsRef()` function to get a reference to the mutation.
const ref = clearCourtWindowsRef(clearCourtWindowsVars);
// Variables can be defined inline as well.
const ref = clearCourtWindowsRef({ userId: ..., });
// Since all variables are optional for this mutation, you can omit the `ClearCourtWindowsVariables` argument.
const ref = clearCourtWindowsRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearCourtWindowsRef(dataConnect, clearCourtWindowsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.cleared);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.cleared);
});
```

## SaveCourtWindow
You can execute the `SaveCourtWindow` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveCourtWindow(vars: SaveCourtWindowVariables): MutationPromise<SaveCourtWindowData, SaveCourtWindowVariables>;

interface SaveCourtWindowRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtWindowVariables): MutationRef<SaveCourtWindowData, SaveCourtWindowVariables>;
}
export const saveCourtWindowRef: SaveCourtWindowRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveCourtWindow(dc: DataConnect, vars: SaveCourtWindowVariables): MutationPromise<SaveCourtWindowData, SaveCourtWindowVariables>;

interface SaveCourtWindowRef {
  ...
  (dc: DataConnect, vars: SaveCourtWindowVariables): MutationRef<SaveCourtWindowData, SaveCourtWindowVariables>;
}
export const saveCourtWindowRef: SaveCourtWindowRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveCourtWindowRef:
```typescript
const name = saveCourtWindowRef.operationName;
console.log(name);
```

### Variables
The `SaveCourtWindow` mutation requires an argument of type `SaveCourtWindowVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveCourtWindowVariables {
  userId?: string;
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}
```
### Return Type
Recall that executing the `SaveCourtWindow` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveCourtWindowData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SaveCourtWindow`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveCourtWindow, SaveCourtWindowVariables } from '@clubs-platform/dataconnect';

// The `SaveCourtWindow` mutation requires an argument of type `SaveCourtWindowVariables`:
const saveCourtWindowVars: SaveCourtWindowVariables = {
  userId: ..., // optional
  id: ..., 
  weekday: ..., 
  startTime: ..., 
  endTime: ..., 
};

// Call the `saveCourtWindow()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveCourtWindow(saveCourtWindowVars);
// Variables can be defined inline as well.
const { data } = await saveCourtWindow({ userId: ..., id: ..., weekday: ..., startTime: ..., endTime: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveCourtWindow(dataConnect, saveCourtWindowVars);

console.log(data.query);
console.log(data.window);

// Or, you can use the `Promise` API.
saveCourtWindow(saveCourtWindowVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.window);
});
```

### Using `SaveCourtWindow`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveCourtWindowRef, SaveCourtWindowVariables } from '@clubs-platform/dataconnect';

// The `SaveCourtWindow` mutation requires an argument of type `SaveCourtWindowVariables`:
const saveCourtWindowVars: SaveCourtWindowVariables = {
  userId: ..., // optional
  id: ..., 
  weekday: ..., 
  startTime: ..., 
  endTime: ..., 
};

// Call the `saveCourtWindowRef()` function to get a reference to the mutation.
const ref = saveCourtWindowRef(saveCourtWindowVars);
// Variables can be defined inline as well.
const ref = saveCourtWindowRef({ userId: ..., id: ..., weekday: ..., startTime: ..., endTime: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveCourtWindowRef(dataConnect, saveCourtWindowVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.window);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.window);
});
```

## SaveCourt
You can execute the `SaveCourt` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveCourt(vars: SaveCourtVariables): MutationPromise<SaveCourtData, SaveCourtVariables>;

interface SaveCourtRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtVariables): MutationRef<SaveCourtData, SaveCourtVariables>;
}
export const saveCourtRef: SaveCourtRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveCourt(dc: DataConnect, vars: SaveCourtVariables): MutationPromise<SaveCourtData, SaveCourtVariables>;

interface SaveCourtRef {
  ...
  (dc: DataConnect, vars: SaveCourtVariables): MutationRef<SaveCourtData, SaveCourtVariables>;
}
export const saveCourtRef: SaveCourtRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveCourtRef:
```typescript
const name = saveCourtRef.operationName;
console.log(name);
```

### Variables
The `SaveCourt` mutation requires an argument of type `SaveCourtVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `SaveCourt` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveCourtData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SaveCourt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveCourt, SaveCourtVariables } from '@clubs-platform/dataconnect';

// The `SaveCourt` mutation requires an argument of type `SaveCourtVariables`:
const saveCourtVars: SaveCourtVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  description: ..., 
  hourlyRate: ..., 
  football: ..., 
  imageUrl: ..., 
  sortOrder: ..., 
  active: ..., 
};

// Call the `saveCourt()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveCourt(saveCourtVars);
// Variables can be defined inline as well.
const { data } = await saveCourt({ userId: ..., id: ..., name: ..., description: ..., hourlyRate: ..., football: ..., imageUrl: ..., sortOrder: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveCourt(dataConnect, saveCourtVars);

console.log(data.query);
console.log(data.court);

// Or, you can use the `Promise` API.
saveCourt(saveCourtVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.court);
});
```

### Using `SaveCourt`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveCourtRef, SaveCourtVariables } from '@clubs-platform/dataconnect';

// The `SaveCourt` mutation requires an argument of type `SaveCourtVariables`:
const saveCourtVars: SaveCourtVariables = {
  userId: ..., // optional
  id: ..., 
  name: ..., 
  description: ..., 
  hourlyRate: ..., 
  football: ..., 
  imageUrl: ..., 
  sortOrder: ..., 
  active: ..., 
};

// Call the `saveCourtRef()` function to get a reference to the mutation.
const ref = saveCourtRef(saveCourtVars);
// Variables can be defined inline as well.
const ref = saveCourtRef({ userId: ..., id: ..., name: ..., description: ..., hourlyRate: ..., football: ..., imageUrl: ..., sortOrder: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveCourtRef(dataConnect, saveCourtVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.court);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.court);
});
```

## DeleteCourt
You can execute the `DeleteCourt` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteCourt(vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;

interface DeleteCourtRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
}
export const deleteCourtRef: DeleteCourtRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteCourt(dc: DataConnect, vars: DeleteCourtVariables): MutationPromise<DeleteCourtData, DeleteCourtVariables>;

interface DeleteCourtRef {
  ...
  (dc: DataConnect, vars: DeleteCourtVariables): MutationRef<DeleteCourtData, DeleteCourtVariables>;
}
export const deleteCourtRef: DeleteCourtRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteCourtRef:
```typescript
const name = deleteCourtRef.operationName;
console.log(name);
```

### Variables
The `DeleteCourt` mutation requires an argument of type `DeleteCourtVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteCourtVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteCourt` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteCourtData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteCourtData {
  unlinked?: number | null;
  dropped?: number | null;
  court?: unknown | null;
}
```
### Using `DeleteCourt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteCourt, DeleteCourtVariables } from '@clubs-platform/dataconnect';

// The `DeleteCourt` mutation requires an argument of type `DeleteCourtVariables`:
const deleteCourtVars: DeleteCourtVariables = {
  id: ..., 
};

// Call the `deleteCourt()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteCourt(deleteCourtVars);
// Variables can be defined inline as well.
const { data } = await deleteCourt({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteCourt(dataConnect, deleteCourtVars);

console.log(data.unlinked);
console.log(data.dropped);
console.log(data.court);

// Or, you can use the `Promise` API.
deleteCourt(deleteCourtVars).then((response) => {
  const data = response.data;
  console.log(data.unlinked);
  console.log(data.dropped);
  console.log(data.court);
});
```

### Using `DeleteCourt`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteCourtRef, DeleteCourtVariables } from '@clubs-platform/dataconnect';

// The `DeleteCourt` mutation requires an argument of type `DeleteCourtVariables`:
const deleteCourtVars: DeleteCourtVariables = {
  id: ..., 
};

// Call the `deleteCourtRef()` function to get a reference to the mutation.
const ref = deleteCourtRef(deleteCourtVars);
// Variables can be defined inline as well.
const ref = deleteCourtRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteCourtRef(dataConnect, deleteCourtVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.unlinked);
console.log(data.dropped);
console.log(data.court);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.unlinked);
  console.log(data.dropped);
  console.log(data.court);
});
```

## SaveCourtHold
You can execute the `SaveCourtHold` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveCourtHold(vars: SaveCourtHoldVariables): MutationPromise<SaveCourtHoldData, SaveCourtHoldVariables>;

interface SaveCourtHoldRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCourtHoldVariables): MutationRef<SaveCourtHoldData, SaveCourtHoldVariables>;
}
export const saveCourtHoldRef: SaveCourtHoldRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveCourtHold(dc: DataConnect, vars: SaveCourtHoldVariables): MutationPromise<SaveCourtHoldData, SaveCourtHoldVariables>;

interface SaveCourtHoldRef {
  ...
  (dc: DataConnect, vars: SaveCourtHoldVariables): MutationRef<SaveCourtHoldData, SaveCourtHoldVariables>;
}
export const saveCourtHoldRef: SaveCourtHoldRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveCourtHoldRef:
```typescript
const name = saveCourtHoldRef.operationName;
console.log(name);
```

### Variables
The `SaveCourtHold` mutation requires an argument of type `SaveCourtHoldVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `SaveCourtHold` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveCourtHoldData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SaveCourtHold`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveCourtHold, SaveCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `SaveCourtHold` mutation requires an argument of type `SaveCourtHoldVariables`:
const saveCourtHoldVars: SaveCourtHoldVariables = {
  userId: ..., // optional
  id: ..., 
  courtId: ..., 
  holdDate: ..., 
  startTime: ..., 
  endTime: ..., 
  note: ..., 
  guestEmail: ..., // optional
  fresh: ..., // optional
};

// Call the `saveCourtHold()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveCourtHold(saveCourtHoldVars);
// Variables can be defined inline as well.
const { data } = await saveCourtHold({ userId: ..., id: ..., courtId: ..., holdDate: ..., startTime: ..., endTime: ..., note: ..., guestEmail: ..., fresh: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveCourtHold(dataConnect, saveCourtHoldVars);

console.log(data.query);
console.log(data.saved);
console.log(data.race);
console.log(data.hold);

// Or, you can use the `Promise` API.
saveCourtHold(saveCourtHoldVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.saved);
  console.log(data.race);
  console.log(data.hold);
});
```

### Using `SaveCourtHold`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveCourtHoldRef, SaveCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `SaveCourtHold` mutation requires an argument of type `SaveCourtHoldVariables`:
const saveCourtHoldVars: SaveCourtHoldVariables = {
  userId: ..., // optional
  id: ..., 
  courtId: ..., 
  holdDate: ..., 
  startTime: ..., 
  endTime: ..., 
  note: ..., 
  guestEmail: ..., // optional
  fresh: ..., // optional
};

// Call the `saveCourtHoldRef()` function to get a reference to the mutation.
const ref = saveCourtHoldRef(saveCourtHoldVars);
// Variables can be defined inline as well.
const ref = saveCourtHoldRef({ userId: ..., id: ..., courtId: ..., holdDate: ..., startTime: ..., endTime: ..., note: ..., guestEmail: ..., fresh: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveCourtHoldRef(dataConnect, saveCourtHoldVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.saved);
console.log(data.race);
console.log(data.hold);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.saved);
  console.log(data.race);
  console.log(data.hold);
});
```

## DeleteManualCourtHold
You can execute the `DeleteManualCourtHold` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteManualCourtHold(vars: DeleteManualCourtHoldVariables): MutationPromise<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;

interface DeleteManualCourtHoldRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteManualCourtHoldVariables): MutationRef<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;
}
export const deleteManualCourtHoldRef: DeleteManualCourtHoldRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteManualCourtHold(dc: DataConnect, vars: DeleteManualCourtHoldVariables): MutationPromise<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;

interface DeleteManualCourtHoldRef {
  ...
  (dc: DataConnect, vars: DeleteManualCourtHoldVariables): MutationRef<DeleteManualCourtHoldData, DeleteManualCourtHoldVariables>;
}
export const deleteManualCourtHoldRef: DeleteManualCourtHoldRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteManualCourtHoldRef:
```typescript
const name = deleteManualCourtHoldRef.operationName;
console.log(name);
```

### Variables
The `DeleteManualCourtHold` mutation requires an argument of type `DeleteManualCourtHoldVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteManualCourtHoldVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteManualCourtHold` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteManualCourtHoldData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteManualCourtHoldData {
  hold?: unknown | null;
}
```
### Using `DeleteManualCourtHold`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteManualCourtHold, DeleteManualCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `DeleteManualCourtHold` mutation requires an argument of type `DeleteManualCourtHoldVariables`:
const deleteManualCourtHoldVars: DeleteManualCourtHoldVariables = {
  id: ..., 
};

// Call the `deleteManualCourtHold()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteManualCourtHold(deleteManualCourtHoldVars);
// Variables can be defined inline as well.
const { data } = await deleteManualCourtHold({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteManualCourtHold(dataConnect, deleteManualCourtHoldVars);

console.log(data.hold);

// Or, you can use the `Promise` API.
deleteManualCourtHold(deleteManualCourtHoldVars).then((response) => {
  const data = response.data;
  console.log(data.hold);
});
```

### Using `DeleteManualCourtHold`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteManualCourtHoldRef, DeleteManualCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `DeleteManualCourtHold` mutation requires an argument of type `DeleteManualCourtHoldVariables`:
const deleteManualCourtHoldVars: DeleteManualCourtHoldVariables = {
  id: ..., 
};

// Call the `deleteManualCourtHoldRef()` function to get a reference to the mutation.
const ref = deleteManualCourtHoldRef(deleteManualCourtHoldVars);
// Variables can be defined inline as well.
const ref = deleteManualCourtHoldRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteManualCourtHoldRef(dataConnect, deleteManualCourtHoldVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.hold);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.hold);
});
```

## SaveAd
You can execute the `SaveAd` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveAd(vars: SaveAdVariables): MutationPromise<SaveAdData, SaveAdVariables>;

interface SaveAdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveAdVariables): MutationRef<SaveAdData, SaveAdVariables>;
}
export const saveAdRef: SaveAdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveAd(dc: DataConnect, vars: SaveAdVariables): MutationPromise<SaveAdData, SaveAdVariables>;

interface SaveAdRef {
  ...
  (dc: DataConnect, vars: SaveAdVariables): MutationRef<SaveAdData, SaveAdVariables>;
}
export const saveAdRef: SaveAdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveAdRef:
```typescript
const name = saveAdRef.operationName;
console.log(name);
```

### Variables
The `SaveAd` mutation requires an argument of type `SaveAdVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `SaveAd` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveAdData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveAdData {
  ad?: unknown | null;
}
```
### Using `SaveAd`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveAd, SaveAdVariables } from '@clubs-platform/dataconnect';

// The `SaveAd` mutation requires an argument of type `SaveAdVariables`:
const saveAdVars: SaveAdVariables = {
  id: ..., 
  brand: ..., 
  imageUrl: ..., 
  href: ..., 
  startsOn: ..., 
  endsOn: ..., 
  status: ..., 
  sortOrder: ..., 
};

// Call the `saveAd()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveAd(saveAdVars);
// Variables can be defined inline as well.
const { data } = await saveAd({ id: ..., brand: ..., imageUrl: ..., href: ..., startsOn: ..., endsOn: ..., status: ..., sortOrder: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveAd(dataConnect, saveAdVars);

console.log(data.ad);

// Or, you can use the `Promise` API.
saveAd(saveAdVars).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

### Using `SaveAd`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveAdRef, SaveAdVariables } from '@clubs-platform/dataconnect';

// The `SaveAd` mutation requires an argument of type `SaveAdVariables`:
const saveAdVars: SaveAdVariables = {
  id: ..., 
  brand: ..., 
  imageUrl: ..., 
  href: ..., 
  startsOn: ..., 
  endsOn: ..., 
  status: ..., 
  sortOrder: ..., 
};

// Call the `saveAdRef()` function to get a reference to the mutation.
const ref = saveAdRef(saveAdVars);
// Variables can be defined inline as well.
const ref = saveAdRef({ id: ..., brand: ..., imageUrl: ..., href: ..., startsOn: ..., endsOn: ..., status: ..., sortOrder: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveAdRef(dataConnect, saveAdVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ad);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

## SetAdStatus
You can execute the `SetAdStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setAdStatus(vars: SetAdStatusVariables): MutationPromise<SetAdStatusData, SetAdStatusVariables>;

interface SetAdStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetAdStatusVariables): MutationRef<SetAdStatusData, SetAdStatusVariables>;
}
export const setAdStatusRef: SetAdStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setAdStatus(dc: DataConnect, vars: SetAdStatusVariables): MutationPromise<SetAdStatusData, SetAdStatusVariables>;

interface SetAdStatusRef {
  ...
  (dc: DataConnect, vars: SetAdStatusVariables): MutationRef<SetAdStatusData, SetAdStatusVariables>;
}
export const setAdStatusRef: SetAdStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setAdStatusRef:
```typescript
const name = setAdStatusRef.operationName;
console.log(name);
```

### Variables
The `SetAdStatus` mutation requires an argument of type `SetAdStatusVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetAdStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that executing the `SetAdStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetAdStatusData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetAdStatusData {
  ad?: unknown | null;
}
```
### Using `SetAdStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setAdStatus, SetAdStatusVariables } from '@clubs-platform/dataconnect';

// The `SetAdStatus` mutation requires an argument of type `SetAdStatusVariables`:
const setAdStatusVars: SetAdStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `setAdStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setAdStatus(setAdStatusVars);
// Variables can be defined inline as well.
const { data } = await setAdStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setAdStatus(dataConnect, setAdStatusVars);

console.log(data.ad);

// Or, you can use the `Promise` API.
setAdStatus(setAdStatusVars).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

### Using `SetAdStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setAdStatusRef, SetAdStatusVariables } from '@clubs-platform/dataconnect';

// The `SetAdStatus` mutation requires an argument of type `SetAdStatusVariables`:
const setAdStatusVars: SetAdStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `setAdStatusRef()` function to get a reference to the mutation.
const ref = setAdStatusRef(setAdStatusVars);
// Variables can be defined inline as well.
const ref = setAdStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setAdStatusRef(dataConnect, setAdStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ad);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

## SetAdOrder
You can execute the `SetAdOrder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setAdOrder(vars: SetAdOrderVariables): MutationPromise<SetAdOrderData, SetAdOrderVariables>;

interface SetAdOrderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetAdOrderVariables): MutationRef<SetAdOrderData, SetAdOrderVariables>;
}
export const setAdOrderRef: SetAdOrderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setAdOrder(dc: DataConnect, vars: SetAdOrderVariables): MutationPromise<SetAdOrderData, SetAdOrderVariables>;

interface SetAdOrderRef {
  ...
  (dc: DataConnect, vars: SetAdOrderVariables): MutationRef<SetAdOrderData, SetAdOrderVariables>;
}
export const setAdOrderRef: SetAdOrderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setAdOrderRef:
```typescript
const name = setAdOrderRef.operationName;
console.log(name);
```

### Variables
The `SetAdOrder` mutation requires an argument of type `SetAdOrderVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetAdOrderVariables {
  ids: string;
}
```
### Return Type
Recall that executing the `SetAdOrder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetAdOrderData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetAdOrderData {
  ad?: unknown | null;
}
```
### Using `SetAdOrder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setAdOrder, SetAdOrderVariables } from '@clubs-platform/dataconnect';

// The `SetAdOrder` mutation requires an argument of type `SetAdOrderVariables`:
const setAdOrderVars: SetAdOrderVariables = {
  ids: ..., 
};

// Call the `setAdOrder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setAdOrder(setAdOrderVars);
// Variables can be defined inline as well.
const { data } = await setAdOrder({ ids: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setAdOrder(dataConnect, setAdOrderVars);

console.log(data.ad);

// Or, you can use the `Promise` API.
setAdOrder(setAdOrderVars).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

### Using `SetAdOrder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setAdOrderRef, SetAdOrderVariables } from '@clubs-platform/dataconnect';

// The `SetAdOrder` mutation requires an argument of type `SetAdOrderVariables`:
const setAdOrderVars: SetAdOrderVariables = {
  ids: ..., 
};

// Call the `setAdOrderRef()` function to get a reference to the mutation.
const ref = setAdOrderRef(setAdOrderVars);
// Variables can be defined inline as well.
const ref = setAdOrderRef({ ids: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setAdOrderRef(dataConnect, setAdOrderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ad);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

## ClearAdPlacements
You can execute the `ClearAdPlacements` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearAdPlacements(vars: ClearAdPlacementsVariables): MutationPromise<ClearAdPlacementsData, ClearAdPlacementsVariables>;

interface ClearAdPlacementsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearAdPlacementsVariables): MutationRef<ClearAdPlacementsData, ClearAdPlacementsVariables>;
}
export const clearAdPlacementsRef: ClearAdPlacementsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearAdPlacements(dc: DataConnect, vars: ClearAdPlacementsVariables): MutationPromise<ClearAdPlacementsData, ClearAdPlacementsVariables>;

interface ClearAdPlacementsRef {
  ...
  (dc: DataConnect, vars: ClearAdPlacementsVariables): MutationRef<ClearAdPlacementsData, ClearAdPlacementsVariables>;
}
export const clearAdPlacementsRef: ClearAdPlacementsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearAdPlacementsRef:
```typescript
const name = clearAdPlacementsRef.operationName;
console.log(name);
```

### Variables
The `ClearAdPlacements` mutation requires an argument of type `ClearAdPlacementsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearAdPlacementsVariables {
  adId: string;
}
```
### Return Type
Recall that executing the `ClearAdPlacements` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearAdPlacementsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClearAdPlacementsData {
  cleared?: number | null;
}
```
### Using `ClearAdPlacements`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearAdPlacements, ClearAdPlacementsVariables } from '@clubs-platform/dataconnect';

// The `ClearAdPlacements` mutation requires an argument of type `ClearAdPlacementsVariables`:
const clearAdPlacementsVars: ClearAdPlacementsVariables = {
  adId: ..., 
};

// Call the `clearAdPlacements()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearAdPlacements(clearAdPlacementsVars);
// Variables can be defined inline as well.
const { data } = await clearAdPlacements({ adId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearAdPlacements(dataConnect, clearAdPlacementsVars);

console.log(data.cleared);

// Or, you can use the `Promise` API.
clearAdPlacements(clearAdPlacementsVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
});
```

### Using `ClearAdPlacements`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearAdPlacementsRef, ClearAdPlacementsVariables } from '@clubs-platform/dataconnect';

// The `ClearAdPlacements` mutation requires an argument of type `ClearAdPlacementsVariables`:
const clearAdPlacementsVars: ClearAdPlacementsVariables = {
  adId: ..., 
};

// Call the `clearAdPlacementsRef()` function to get a reference to the mutation.
const ref = clearAdPlacementsRef(clearAdPlacementsVars);
// Variables can be defined inline as well.
const ref = clearAdPlacementsRef({ adId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearAdPlacementsRef(dataConnect, clearAdPlacementsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
});
```

## SaveAdPlacement
You can execute the `SaveAdPlacement` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveAdPlacement(vars: SaveAdPlacementVariables): MutationPromise<SaveAdPlacementData, SaveAdPlacementVariables>;

interface SaveAdPlacementRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveAdPlacementVariables): MutationRef<SaveAdPlacementData, SaveAdPlacementVariables>;
}
export const saveAdPlacementRef: SaveAdPlacementRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveAdPlacement(dc: DataConnect, vars: SaveAdPlacementVariables): MutationPromise<SaveAdPlacementData, SaveAdPlacementVariables>;

interface SaveAdPlacementRef {
  ...
  (dc: DataConnect, vars: SaveAdPlacementVariables): MutationRef<SaveAdPlacementData, SaveAdPlacementVariables>;
}
export const saveAdPlacementRef: SaveAdPlacementRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveAdPlacementRef:
```typescript
const name = saveAdPlacementRef.operationName;
console.log(name);
```

### Variables
The `SaveAdPlacement` mutation requires an argument of type `SaveAdPlacementVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveAdPlacementVariables {
  adId: string;
  placement: string;
}
```
### Return Type
Recall that executing the `SaveAdPlacement` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveAdPlacementData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveAdPlacementData {
  placement?: unknown | null;
}
```
### Using `SaveAdPlacement`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveAdPlacement, SaveAdPlacementVariables } from '@clubs-platform/dataconnect';

// The `SaveAdPlacement` mutation requires an argument of type `SaveAdPlacementVariables`:
const saveAdPlacementVars: SaveAdPlacementVariables = {
  adId: ..., 
  placement: ..., 
};

// Call the `saveAdPlacement()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveAdPlacement(saveAdPlacementVars);
// Variables can be defined inline as well.
const { data } = await saveAdPlacement({ adId: ..., placement: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveAdPlacement(dataConnect, saveAdPlacementVars);

console.log(data.placement);

// Or, you can use the `Promise` API.
saveAdPlacement(saveAdPlacementVars).then((response) => {
  const data = response.data;
  console.log(data.placement);
});
```

### Using `SaveAdPlacement`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveAdPlacementRef, SaveAdPlacementVariables } from '@clubs-platform/dataconnect';

// The `SaveAdPlacement` mutation requires an argument of type `SaveAdPlacementVariables`:
const saveAdPlacementVars: SaveAdPlacementVariables = {
  adId: ..., 
  placement: ..., 
};

// Call the `saveAdPlacementRef()` function to get a reference to the mutation.
const ref = saveAdPlacementRef(saveAdPlacementVars);
// Variables can be defined inline as well.
const ref = saveAdPlacementRef({ adId: ..., placement: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveAdPlacementRef(dataConnect, saveAdPlacementVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.placement);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.placement);
});
```

## DeleteAd
You can execute the `DeleteAd` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteAd(vars: DeleteAdVariables): MutationPromise<DeleteAdData, DeleteAdVariables>;

interface DeleteAdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteAdVariables): MutationRef<DeleteAdData, DeleteAdVariables>;
}
export const deleteAdRef: DeleteAdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteAd(dc: DataConnect, vars: DeleteAdVariables): MutationPromise<DeleteAdData, DeleteAdVariables>;

interface DeleteAdRef {
  ...
  (dc: DataConnect, vars: DeleteAdVariables): MutationRef<DeleteAdData, DeleteAdVariables>;
}
export const deleteAdRef: DeleteAdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteAdRef:
```typescript
const name = deleteAdRef.operationName;
console.log(name);
```

### Variables
The `DeleteAd` mutation requires an argument of type `DeleteAdVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteAdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteAd` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteAdData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteAdData {
  ad?: unknown | null;
}
```
### Using `DeleteAd`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteAd, DeleteAdVariables } from '@clubs-platform/dataconnect';

// The `DeleteAd` mutation requires an argument of type `DeleteAdVariables`:
const deleteAdVars: DeleteAdVariables = {
  id: ..., 
};

// Call the `deleteAd()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteAd(deleteAdVars);
// Variables can be defined inline as well.
const { data } = await deleteAd({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteAd(dataConnect, deleteAdVars);

console.log(data.ad);

// Or, you can use the `Promise` API.
deleteAd(deleteAdVars).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

### Using `DeleteAd`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteAdRef, DeleteAdVariables } from '@clubs-platform/dataconnect';

// The `DeleteAd` mutation requires an argument of type `DeleteAdVariables`:
const deleteAdVars: DeleteAdVariables = {
  id: ..., 
};

// Call the `deleteAdRef()` function to get a reference to the mutation.
const ref = deleteAdRef(deleteAdVars);
// Variables can be defined inline as well.
const ref = deleteAdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteAdRef(dataConnect, deleteAdVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ad);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ad);
});
```

## SetInquiryDone
You can execute the `SetInquiryDone` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setInquiryDone(vars: SetInquiryDoneVariables): MutationPromise<SetInquiryDoneData, SetInquiryDoneVariables>;

interface SetInquiryDoneRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetInquiryDoneVariables): MutationRef<SetInquiryDoneData, SetInquiryDoneVariables>;
}
export const setInquiryDoneRef: SetInquiryDoneRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setInquiryDone(dc: DataConnect, vars: SetInquiryDoneVariables): MutationPromise<SetInquiryDoneData, SetInquiryDoneVariables>;

interface SetInquiryDoneRef {
  ...
  (dc: DataConnect, vars: SetInquiryDoneVariables): MutationRef<SetInquiryDoneData, SetInquiryDoneVariables>;
}
export const setInquiryDoneRef: SetInquiryDoneRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setInquiryDoneRef:
```typescript
const name = setInquiryDoneRef.operationName;
console.log(name);
```

### Variables
The `SetInquiryDone` mutation requires an argument of type `SetInquiryDoneVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetInquiryDoneVariables {
  id: string;
}
```
### Return Type
Recall that executing the `SetInquiryDone` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetInquiryDoneData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetInquiryDoneData {
  inquiry?: unknown | null;
}
```
### Using `SetInquiryDone`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setInquiryDone, SetInquiryDoneVariables } from '@clubs-platform/dataconnect';

// The `SetInquiryDone` mutation requires an argument of type `SetInquiryDoneVariables`:
const setInquiryDoneVars: SetInquiryDoneVariables = {
  id: ..., 
};

// Call the `setInquiryDone()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setInquiryDone(setInquiryDoneVars);
// Variables can be defined inline as well.
const { data } = await setInquiryDone({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setInquiryDone(dataConnect, setInquiryDoneVars);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
setInquiryDone(setInquiryDoneVars).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

### Using `SetInquiryDone`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setInquiryDoneRef, SetInquiryDoneVariables } from '@clubs-platform/dataconnect';

// The `SetInquiryDone` mutation requires an argument of type `SetInquiryDoneVariables`:
const setInquiryDoneVars: SetInquiryDoneVariables = {
  id: ..., 
};

// Call the `setInquiryDoneRef()` function to get a reference to the mutation.
const ref = setInquiryDoneRef(setInquiryDoneVars);
// Variables can be defined inline as well.
const ref = setInquiryDoneRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setInquiryDoneRef(dataConnect, setInquiryDoneVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

## DeleteInquiry
You can execute the `DeleteInquiry` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteInquiry(vars: DeleteInquiryVariables): MutationPromise<DeleteInquiryData, DeleteInquiryVariables>;

interface DeleteInquiryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteInquiryVariables): MutationRef<DeleteInquiryData, DeleteInquiryVariables>;
}
export const deleteInquiryRef: DeleteInquiryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteInquiry(dc: DataConnect, vars: DeleteInquiryVariables): MutationPromise<DeleteInquiryData, DeleteInquiryVariables>;

interface DeleteInquiryRef {
  ...
  (dc: DataConnect, vars: DeleteInquiryVariables): MutationRef<DeleteInquiryData, DeleteInquiryVariables>;
}
export const deleteInquiryRef: DeleteInquiryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteInquiryRef:
```typescript
const name = deleteInquiryRef.operationName;
console.log(name);
```

### Variables
The `DeleteInquiry` mutation requires an argument of type `DeleteInquiryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteInquiryVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteInquiry` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteInquiryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteInquiryData {
  inquiry?: unknown | null;
}
```
### Using `DeleteInquiry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteInquiry, DeleteInquiryVariables } from '@clubs-platform/dataconnect';

// The `DeleteInquiry` mutation requires an argument of type `DeleteInquiryVariables`:
const deleteInquiryVars: DeleteInquiryVariables = {
  id: ..., 
};

// Call the `deleteInquiry()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteInquiry(deleteInquiryVars);
// Variables can be defined inline as well.
const { data } = await deleteInquiry({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteInquiry(dataConnect, deleteInquiryVars);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
deleteInquiry(deleteInquiryVars).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

### Using `DeleteInquiry`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteInquiryRef, DeleteInquiryVariables } from '@clubs-platform/dataconnect';

// The `DeleteInquiry` mutation requires an argument of type `DeleteInquiryVariables`:
const deleteInquiryVars: DeleteInquiryVariables = {
  id: ..., 
};

// Call the `deleteInquiryRef()` function to get a reference to the mutation.
const ref = deleteInquiryRef(deleteInquiryVars);
// Variables can be defined inline as well.
const ref = deleteInquiryRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteInquiryRef(dataConnect, deleteInquiryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

## RejectTeamApplication
You can execute the `RejectTeamApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
rejectTeamApplication(vars: RejectTeamApplicationVariables): MutationPromise<RejectTeamApplicationData, RejectTeamApplicationVariables>;

interface RejectTeamApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RejectTeamApplicationVariables): MutationRef<RejectTeamApplicationData, RejectTeamApplicationVariables>;
}
export const rejectTeamApplicationRef: RejectTeamApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
rejectTeamApplication(dc: DataConnect, vars: RejectTeamApplicationVariables): MutationPromise<RejectTeamApplicationData, RejectTeamApplicationVariables>;

interface RejectTeamApplicationRef {
  ...
  (dc: DataConnect, vars: RejectTeamApplicationVariables): MutationRef<RejectTeamApplicationData, RejectTeamApplicationVariables>;
}
export const rejectTeamApplicationRef: RejectTeamApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the rejectTeamApplicationRef:
```typescript
const name = rejectTeamApplicationRef.operationName;
console.log(name);
```

### Variables
The `RejectTeamApplication` mutation requires an argument of type `RejectTeamApplicationVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RejectTeamApplicationVariables {
  id: string;
}
```
### Return Type
Recall that executing the `RejectTeamApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RejectTeamApplicationData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RejectTeamApplicationData {
  application?: unknown | null;
}
```
### Using `RejectTeamApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, rejectTeamApplication, RejectTeamApplicationVariables } from '@clubs-platform/dataconnect';

// The `RejectTeamApplication` mutation requires an argument of type `RejectTeamApplicationVariables`:
const rejectTeamApplicationVars: RejectTeamApplicationVariables = {
  id: ..., 
};

// Call the `rejectTeamApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await rejectTeamApplication(rejectTeamApplicationVars);
// Variables can be defined inline as well.
const { data } = await rejectTeamApplication({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await rejectTeamApplication(dataConnect, rejectTeamApplicationVars);

console.log(data.application);

// Or, you can use the `Promise` API.
rejectTeamApplication(rejectTeamApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

### Using `RejectTeamApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, rejectTeamApplicationRef, RejectTeamApplicationVariables } from '@clubs-platform/dataconnect';

// The `RejectTeamApplication` mutation requires an argument of type `RejectTeamApplicationVariables`:
const rejectTeamApplicationVars: RejectTeamApplicationVariables = {
  id: ..., 
};

// Call the `rejectTeamApplicationRef()` function to get a reference to the mutation.
const ref = rejectTeamApplicationRef(rejectTeamApplicationVars);
// Variables can be defined inline as well.
const ref = rejectTeamApplicationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = rejectTeamApplicationRef(dataConnect, rejectTeamApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

## ApproveTeamApplication
You can execute the `ApproveTeamApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
approveTeamApplication(vars: ApproveTeamApplicationVariables): MutationPromise<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;

interface ApproveTeamApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApproveTeamApplicationVariables): MutationRef<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;
}
export const approveTeamApplicationRef: ApproveTeamApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
approveTeamApplication(dc: DataConnect, vars: ApproveTeamApplicationVariables): MutationPromise<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;

interface ApproveTeamApplicationRef {
  ...
  (dc: DataConnect, vars: ApproveTeamApplicationVariables): MutationRef<ApproveTeamApplicationData, ApproveTeamApplicationVariables>;
}
export const approveTeamApplicationRef: ApproveTeamApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the approveTeamApplicationRef:
```typescript
const name = approveTeamApplicationRef.operationName;
console.log(name);
```

### Variables
The `ApproveTeamApplication` mutation requires an argument of type `ApproveTeamApplicationVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ApproveTeamApplicationVariables {
  id: string;
  clubId: string;
  slug: string;
}
```
### Return Type
Recall that executing the `ApproveTeamApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ApproveTeamApplicationData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ApproveTeamApplicationData {
  application?: unknown | null;
}
```
### Using `ApproveTeamApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, approveTeamApplication, ApproveTeamApplicationVariables } from '@clubs-platform/dataconnect';

// The `ApproveTeamApplication` mutation requires an argument of type `ApproveTeamApplicationVariables`:
const approveTeamApplicationVars: ApproveTeamApplicationVariables = {
  id: ..., 
  clubId: ..., 
  slug: ..., 
};

// Call the `approveTeamApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await approveTeamApplication(approveTeamApplicationVars);
// Variables can be defined inline as well.
const { data } = await approveTeamApplication({ id: ..., clubId: ..., slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await approveTeamApplication(dataConnect, approveTeamApplicationVars);

console.log(data.application);

// Or, you can use the `Promise` API.
approveTeamApplication(approveTeamApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

### Using `ApproveTeamApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, approveTeamApplicationRef, ApproveTeamApplicationVariables } from '@clubs-platform/dataconnect';

// The `ApproveTeamApplication` mutation requires an argument of type `ApproveTeamApplicationVariables`:
const approveTeamApplicationVars: ApproveTeamApplicationVariables = {
  id: ..., 
  clubId: ..., 
  slug: ..., 
};

// Call the `approveTeamApplicationRef()` function to get a reference to the mutation.
const ref = approveTeamApplicationRef(approveTeamApplicationVars);
// Variables can be defined inline as well.
const ref = approveTeamApplicationRef({ id: ..., clubId: ..., slug: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = approveTeamApplicationRef(dataConnect, approveTeamApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

## SavePlatformAdminInvite
You can execute the `SavePlatformAdminInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
savePlatformAdminInvite(vars: SavePlatformAdminInviteVariables): MutationPromise<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;

interface SavePlatformAdminInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlatformAdminInviteVariables): MutationRef<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;
}
export const savePlatformAdminInviteRef: SavePlatformAdminInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
savePlatformAdminInvite(dc: DataConnect, vars: SavePlatformAdminInviteVariables): MutationPromise<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;

interface SavePlatformAdminInviteRef {
  ...
  (dc: DataConnect, vars: SavePlatformAdminInviteVariables): MutationRef<SavePlatformAdminInviteData, SavePlatformAdminInviteVariables>;
}
export const savePlatformAdminInviteRef: SavePlatformAdminInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the savePlatformAdminInviteRef:
```typescript
const name = savePlatformAdminInviteRef.operationName;
console.log(name);
```

### Variables
The `SavePlatformAdminInvite` mutation requires an argument of type `SavePlatformAdminInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SavePlatformAdminInviteVariables {
  emailKey: string;
  email: string;
}
```
### Return Type
Recall that executing the `SavePlatformAdminInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SavePlatformAdminInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SavePlatformAdminInviteData {
  invite?: unknown | null;
}
```
### Using `SavePlatformAdminInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, savePlatformAdminInvite, SavePlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformAdminInvite` mutation requires an argument of type `SavePlatformAdminInviteVariables`:
const savePlatformAdminInviteVars: SavePlatformAdminInviteVariables = {
  emailKey: ..., 
  email: ..., 
};

// Call the `savePlatformAdminInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await savePlatformAdminInvite(savePlatformAdminInviteVars);
// Variables can be defined inline as well.
const { data } = await savePlatformAdminInvite({ emailKey: ..., email: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await savePlatformAdminInvite(dataConnect, savePlatformAdminInviteVars);

console.log(data.invite);

// Or, you can use the `Promise` API.
savePlatformAdminInvite(savePlatformAdminInviteVars).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

### Using `SavePlatformAdminInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, savePlatformAdminInviteRef, SavePlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `SavePlatformAdminInvite` mutation requires an argument of type `SavePlatformAdminInviteVariables`:
const savePlatformAdminInviteVars: SavePlatformAdminInviteVariables = {
  emailKey: ..., 
  email: ..., 
};

// Call the `savePlatformAdminInviteRef()` function to get a reference to the mutation.
const ref = savePlatformAdminInviteRef(savePlatformAdminInviteVars);
// Variables can be defined inline as well.
const ref = savePlatformAdminInviteRef({ emailKey: ..., email: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = savePlatformAdminInviteRef(dataConnect, savePlatformAdminInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invite);
});
```

## RemovePlatformAdminInvite
You can execute the `RemovePlatformAdminInvite` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
removePlatformAdminInvite(vars: RemovePlatformAdminInviteVariables): MutationPromise<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;

interface RemovePlatformAdminInviteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemovePlatformAdminInviteVariables): MutationRef<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;
}
export const removePlatformAdminInviteRef: RemovePlatformAdminInviteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removePlatformAdminInvite(dc: DataConnect, vars: RemovePlatformAdminInviteVariables): MutationPromise<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;

interface RemovePlatformAdminInviteRef {
  ...
  (dc: DataConnect, vars: RemovePlatformAdminInviteVariables): MutationRef<RemovePlatformAdminInviteData, RemovePlatformAdminInviteVariables>;
}
export const removePlatformAdminInviteRef: RemovePlatformAdminInviteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removePlatformAdminInviteRef:
```typescript
const name = removePlatformAdminInviteRef.operationName;
console.log(name);
```

### Variables
The `RemovePlatformAdminInvite` mutation requires an argument of type `RemovePlatformAdminInviteVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemovePlatformAdminInviteVariables {
  emailKey: string;
}
```
### Return Type
Recall that executing the `RemovePlatformAdminInvite` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemovePlatformAdminInviteData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RemovePlatformAdminInviteData {
  droppedSignup?: number | null;
  invite?: unknown | null;
}
```
### Using `RemovePlatformAdminInvite`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removePlatformAdminInvite, RemovePlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `RemovePlatformAdminInvite` mutation requires an argument of type `RemovePlatformAdminInviteVariables`:
const removePlatformAdminInviteVars: RemovePlatformAdminInviteVariables = {
  emailKey: ..., 
};

// Call the `removePlatformAdminInvite()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removePlatformAdminInvite(removePlatformAdminInviteVars);
// Variables can be defined inline as well.
const { data } = await removePlatformAdminInvite({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removePlatformAdminInvite(dataConnect, removePlatformAdminInviteVars);

console.log(data.droppedSignup);
console.log(data.invite);

// Or, you can use the `Promise` API.
removePlatformAdminInvite(removePlatformAdminInviteVars).then((response) => {
  const data = response.data;
  console.log(data.droppedSignup);
  console.log(data.invite);
});
```

### Using `RemovePlatformAdminInvite`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removePlatformAdminInviteRef, RemovePlatformAdminInviteVariables } from '@clubs-platform/dataconnect';

// The `RemovePlatformAdminInvite` mutation requires an argument of type `RemovePlatformAdminInviteVariables`:
const removePlatformAdminInviteVars: RemovePlatformAdminInviteVariables = {
  emailKey: ..., 
};

// Call the `removePlatformAdminInviteRef()` function to get a reference to the mutation.
const ref = removePlatformAdminInviteRef(removePlatformAdminInviteVars);
// Variables can be defined inline as well.
const ref = removePlatformAdminInviteRef({ emailKey: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removePlatformAdminInviteRef(dataConnect, removePlatformAdminInviteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.droppedSignup);
console.log(data.invite);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.droppedSignup);
  console.log(data.invite);
});
```

## RemovePlatformAdmin
You can execute the `RemovePlatformAdmin` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
removePlatformAdmin(vars: RemovePlatformAdminVariables): MutationPromise<RemovePlatformAdminData, RemovePlatformAdminVariables>;

interface RemovePlatformAdminRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemovePlatformAdminVariables): MutationRef<RemovePlatformAdminData, RemovePlatformAdminVariables>;
}
export const removePlatformAdminRef: RemovePlatformAdminRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removePlatformAdmin(dc: DataConnect, vars: RemovePlatformAdminVariables): MutationPromise<RemovePlatformAdminData, RemovePlatformAdminVariables>;

interface RemovePlatformAdminRef {
  ...
  (dc: DataConnect, vars: RemovePlatformAdminVariables): MutationRef<RemovePlatformAdminData, RemovePlatformAdminVariables>;
}
export const removePlatformAdminRef: RemovePlatformAdminRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removePlatformAdminRef:
```typescript
const name = removePlatformAdminRef.operationName;
console.log(name);
```

### Variables
The `RemovePlatformAdmin` mutation requires an argument of type `RemovePlatformAdminVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemovePlatformAdminVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `RemovePlatformAdmin` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemovePlatformAdminData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RemovePlatformAdminData {
  admin?: unknown | null;
}
```
### Using `RemovePlatformAdmin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removePlatformAdmin, RemovePlatformAdminVariables } from '@clubs-platform/dataconnect';

// The `RemovePlatformAdmin` mutation requires an argument of type `RemovePlatformAdminVariables`:
const removePlatformAdminVars: RemovePlatformAdminVariables = {
  userId: ..., 
};

// Call the `removePlatformAdmin()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removePlatformAdmin(removePlatformAdminVars);
// Variables can be defined inline as well.
const { data } = await removePlatformAdmin({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removePlatformAdmin(dataConnect, removePlatformAdminVars);

console.log(data.admin);

// Or, you can use the `Promise` API.
removePlatformAdmin(removePlatformAdminVars).then((response) => {
  const data = response.data;
  console.log(data.admin);
});
```

### Using `RemovePlatformAdmin`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removePlatformAdminRef, RemovePlatformAdminVariables } from '@clubs-platform/dataconnect';

// The `RemovePlatformAdmin` mutation requires an argument of type `RemovePlatformAdminVariables`:
const removePlatformAdminVars: RemovePlatformAdminVariables = {
  userId: ..., 
};

// Call the `removePlatformAdminRef()` function to get a reference to the mutation.
const ref = removePlatformAdminRef(removePlatformAdminVars);
// Variables can be defined inline as well.
const ref = removePlatformAdminRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removePlatformAdminRef(dataConnect, removePlatformAdminVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.admin);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.admin);
});
```

## SetClubEventScore
You can execute the `SetClubEventScore` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setClubEventScore(vars: SetClubEventScoreVariables): MutationPromise<SetClubEventScoreData, SetClubEventScoreVariables>;

interface SetClubEventScoreRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubEventScoreVariables): MutationRef<SetClubEventScoreData, SetClubEventScoreVariables>;
}
export const setClubEventScoreRef: SetClubEventScoreRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setClubEventScore(dc: DataConnect, vars: SetClubEventScoreVariables): MutationPromise<SetClubEventScoreData, SetClubEventScoreVariables>;

interface SetClubEventScoreRef {
  ...
  (dc: DataConnect, vars: SetClubEventScoreVariables): MutationRef<SetClubEventScoreData, SetClubEventScoreVariables>;
}
export const setClubEventScoreRef: SetClubEventScoreRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setClubEventScoreRef:
```typescript
const name = setClubEventScoreRef.operationName;
console.log(name);
```

### Variables
The `SetClubEventScore` mutation requires an argument of type `SetClubEventScoreVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetClubEventScoreVariables {
  id: string;
  clubId: string;
  scoreOurs?: number | null;
  scoreTheirs?: number | null;
  penaltiesOurs?: number | null;
  penaltiesTheirs?: number | null;
}
```
### Return Type
Recall that executing the `SetClubEventScore` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetClubEventScoreData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetClubEventScoreData {
  event?: unknown | null;
}
```
### Using `SetClubEventScore`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setClubEventScore, SetClubEventScoreVariables } from '@clubs-platform/dataconnect';

// The `SetClubEventScore` mutation requires an argument of type `SetClubEventScoreVariables`:
const setClubEventScoreVars: SetClubEventScoreVariables = {
  id: ..., 
  clubId: ..., 
  scoreOurs: ..., // optional
  scoreTheirs: ..., // optional
  penaltiesOurs: ..., // optional
  penaltiesTheirs: ..., // optional
};

// Call the `setClubEventScore()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setClubEventScore(setClubEventScoreVars);
// Variables can be defined inline as well.
const { data } = await setClubEventScore({ id: ..., clubId: ..., scoreOurs: ..., scoreTheirs: ..., penaltiesOurs: ..., penaltiesTheirs: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setClubEventScore(dataConnect, setClubEventScoreVars);

console.log(data.event);

// Or, you can use the `Promise` API.
setClubEventScore(setClubEventScoreVars).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

### Using `SetClubEventScore`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setClubEventScoreRef, SetClubEventScoreVariables } from '@clubs-platform/dataconnect';

// The `SetClubEventScore` mutation requires an argument of type `SetClubEventScoreVariables`:
const setClubEventScoreVars: SetClubEventScoreVariables = {
  id: ..., 
  clubId: ..., 
  scoreOurs: ..., // optional
  scoreTheirs: ..., // optional
  penaltiesOurs: ..., // optional
  penaltiesTheirs: ..., // optional
};

// Call the `setClubEventScoreRef()` function to get a reference to the mutation.
const ref = setClubEventScoreRef(setClubEventScoreVars);
// Variables can be defined inline as well.
const ref = setClubEventScoreRef({ id: ..., clubId: ..., scoreOurs: ..., scoreTheirs: ..., penaltiesOurs: ..., penaltiesTheirs: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setClubEventScoreRef(dataConnect, setClubEventScoreVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

## SetClubEventLineup
You can execute the `SetClubEventLineup` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setClubEventLineup(vars: SetClubEventLineupVariables): MutationPromise<SetClubEventLineupData, SetClubEventLineupVariables>;

interface SetClubEventLineupRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetClubEventLineupVariables): MutationRef<SetClubEventLineupData, SetClubEventLineupVariables>;
}
export const setClubEventLineupRef: SetClubEventLineupRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setClubEventLineup(dc: DataConnect, vars: SetClubEventLineupVariables): MutationPromise<SetClubEventLineupData, SetClubEventLineupVariables>;

interface SetClubEventLineupRef {
  ...
  (dc: DataConnect, vars: SetClubEventLineupVariables): MutationRef<SetClubEventLineupData, SetClubEventLineupVariables>;
}
export const setClubEventLineupRef: SetClubEventLineupRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setClubEventLineupRef:
```typescript
const name = setClubEventLineupRef.operationName;
console.log(name);
```

### Variables
The `SetClubEventLineup` mutation requires an argument of type `SetClubEventLineupVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetClubEventLineupVariables {
  id: string;
  clubId: string;
  lineup?: unknown | null;
}
```
### Return Type
Recall that executing the `SetClubEventLineup` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetClubEventLineupData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetClubEventLineupData {
  event?: unknown | null;
}
```
### Using `SetClubEventLineup`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setClubEventLineup, SetClubEventLineupVariables } from '@clubs-platform/dataconnect';

// The `SetClubEventLineup` mutation requires an argument of type `SetClubEventLineupVariables`:
const setClubEventLineupVars: SetClubEventLineupVariables = {
  id: ..., 
  clubId: ..., 
  lineup: ..., // optional
};

// Call the `setClubEventLineup()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setClubEventLineup(setClubEventLineupVars);
// Variables can be defined inline as well.
const { data } = await setClubEventLineup({ id: ..., clubId: ..., lineup: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setClubEventLineup(dataConnect, setClubEventLineupVars);

console.log(data.event);

// Or, you can use the `Promise` API.
setClubEventLineup(setClubEventLineupVars).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

### Using `SetClubEventLineup`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setClubEventLineupRef, SetClubEventLineupVariables } from '@clubs-platform/dataconnect';

// The `SetClubEventLineup` mutation requires an argument of type `SetClubEventLineupVariables`:
const setClubEventLineupVars: SetClubEventLineupVariables = {
  id: ..., 
  clubId: ..., 
  lineup: ..., // optional
};

// Call the `setClubEventLineupRef()` function to get a reference to the mutation.
const ref = setClubEventLineupRef(setClubEventLineupVars);
// Variables can be defined inline as well.
const ref = setClubEventLineupRef({ id: ..., clubId: ..., lineup: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setClubEventLineupRef(dataConnect, setClubEventLineupVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

## SaveClubDefaultLineup
You can execute the `SaveClubDefaultLineup` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveClubDefaultLineup(vars: SaveClubDefaultLineupVariables): MutationPromise<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;

interface SaveClubDefaultLineupRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubDefaultLineupVariables): MutationRef<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;
}
export const saveClubDefaultLineupRef: SaveClubDefaultLineupRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveClubDefaultLineup(dc: DataConnect, vars: SaveClubDefaultLineupVariables): MutationPromise<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;

interface SaveClubDefaultLineupRef {
  ...
  (dc: DataConnect, vars: SaveClubDefaultLineupVariables): MutationRef<SaveClubDefaultLineupData, SaveClubDefaultLineupVariables>;
}
export const saveClubDefaultLineupRef: SaveClubDefaultLineupRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveClubDefaultLineupRef:
```typescript
const name = saveClubDefaultLineupRef.operationName;
console.log(name);
```

### Variables
The `SaveClubDefaultLineup` mutation requires an argument of type `SaveClubDefaultLineupVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveClubDefaultLineupVariables {
  clubId: string;
  mode: string;
  lineup?: unknown | null;
}
```
### Return Type
Recall that executing the `SaveClubDefaultLineup` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveClubDefaultLineupData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveClubDefaultLineupData {
  lineup?: unknown | null;
}
```
### Using `SaveClubDefaultLineup`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveClubDefaultLineup, SaveClubDefaultLineupVariables } from '@clubs-platform/dataconnect';

// The `SaveClubDefaultLineup` mutation requires an argument of type `SaveClubDefaultLineupVariables`:
const saveClubDefaultLineupVars: SaveClubDefaultLineupVariables = {
  clubId: ..., 
  mode: ..., 
  lineup: ..., // optional
};

// Call the `saveClubDefaultLineup()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveClubDefaultLineup(saveClubDefaultLineupVars);
// Variables can be defined inline as well.
const { data } = await saveClubDefaultLineup({ clubId: ..., mode: ..., lineup: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveClubDefaultLineup(dataConnect, saveClubDefaultLineupVars);

console.log(data.lineup);

// Or, you can use the `Promise` API.
saveClubDefaultLineup(saveClubDefaultLineupVars).then((response) => {
  const data = response.data;
  console.log(data.lineup);
});
```

### Using `SaveClubDefaultLineup`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveClubDefaultLineupRef, SaveClubDefaultLineupVariables } from '@clubs-platform/dataconnect';

// The `SaveClubDefaultLineup` mutation requires an argument of type `SaveClubDefaultLineupVariables`:
const saveClubDefaultLineupVars: SaveClubDefaultLineupVariables = {
  clubId: ..., 
  mode: ..., 
  lineup: ..., // optional
};

// Call the `saveClubDefaultLineupRef()` function to get a reference to the mutation.
const ref = saveClubDefaultLineupRef(saveClubDefaultLineupVars);
// Variables can be defined inline as well.
const ref = saveClubDefaultLineupRef({ clubId: ..., mode: ..., lineup: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveClubDefaultLineupRef(dataConnect, saveClubDefaultLineupVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lineup);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lineup);
});
```

## ReplaceClubEventAttendees
You can execute the `ReplaceClubEventAttendees` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
replaceClubEventAttendees(vars: ReplaceClubEventAttendeesVariables): MutationPromise<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;

interface ReplaceClubEventAttendeesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceClubEventAttendeesVariables): MutationRef<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;
}
export const replaceClubEventAttendeesRef: ReplaceClubEventAttendeesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
replaceClubEventAttendees(dc: DataConnect, vars: ReplaceClubEventAttendeesVariables): MutationPromise<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;

interface ReplaceClubEventAttendeesRef {
  ...
  (dc: DataConnect, vars: ReplaceClubEventAttendeesVariables): MutationRef<ReplaceClubEventAttendeesData, ReplaceClubEventAttendeesVariables>;
}
export const replaceClubEventAttendeesRef: ReplaceClubEventAttendeesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the replaceClubEventAttendeesRef:
```typescript
const name = replaceClubEventAttendeesRef.operationName;
console.log(name);
```

### Variables
The `ReplaceClubEventAttendees` mutation requires an argument of type `ReplaceClubEventAttendeesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReplaceClubEventAttendeesVariables {
  id: string;
  clubId: string;
  labels?: unknown | null;
}
```
### Return Type
Recall that executing the `ReplaceClubEventAttendees` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReplaceClubEventAttendeesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReplaceClubEventAttendeesData {
  cleared?: number | null;
  added?: number | null;
  event?: unknown | null;
}
```
### Using `ReplaceClubEventAttendees`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, replaceClubEventAttendees, ReplaceClubEventAttendeesVariables } from '@clubs-platform/dataconnect';

// The `ReplaceClubEventAttendees` mutation requires an argument of type `ReplaceClubEventAttendeesVariables`:
const replaceClubEventAttendeesVars: ReplaceClubEventAttendeesVariables = {
  id: ..., 
  clubId: ..., 
  labels: ..., // optional
};

// Call the `replaceClubEventAttendees()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await replaceClubEventAttendees(replaceClubEventAttendeesVars);
// Variables can be defined inline as well.
const { data } = await replaceClubEventAttendees({ id: ..., clubId: ..., labels: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await replaceClubEventAttendees(dataConnect, replaceClubEventAttendeesVars);

console.log(data.cleared);
console.log(data.added);
console.log(data.event);

// Or, you can use the `Promise` API.
replaceClubEventAttendees(replaceClubEventAttendeesVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.event);
});
```

### Using `ReplaceClubEventAttendees`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, replaceClubEventAttendeesRef, ReplaceClubEventAttendeesVariables } from '@clubs-platform/dataconnect';

// The `ReplaceClubEventAttendees` mutation requires an argument of type `ReplaceClubEventAttendeesVariables`:
const replaceClubEventAttendeesVars: ReplaceClubEventAttendeesVariables = {
  id: ..., 
  clubId: ..., 
  labels: ..., // optional
};

// Call the `replaceClubEventAttendeesRef()` function to get a reference to the mutation.
const ref = replaceClubEventAttendeesRef(replaceClubEventAttendeesVars);
// Variables can be defined inline as well.
const ref = replaceClubEventAttendeesRef({ id: ..., clubId: ..., labels: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = replaceClubEventAttendeesRef(dataConnect, replaceClubEventAttendeesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);
console.log(data.added);
console.log(data.event);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.event);
});
```

## ReplaceClubEventAlbum
You can execute the `ReplaceClubEventAlbum` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
replaceClubEventAlbum(vars: ReplaceClubEventAlbumVariables): MutationPromise<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;

interface ReplaceClubEventAlbumRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceClubEventAlbumVariables): MutationRef<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;
}
export const replaceClubEventAlbumRef: ReplaceClubEventAlbumRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
replaceClubEventAlbum(dc: DataConnect, vars: ReplaceClubEventAlbumVariables): MutationPromise<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;

interface ReplaceClubEventAlbumRef {
  ...
  (dc: DataConnect, vars: ReplaceClubEventAlbumVariables): MutationRef<ReplaceClubEventAlbumData, ReplaceClubEventAlbumVariables>;
}
export const replaceClubEventAlbumRef: ReplaceClubEventAlbumRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the replaceClubEventAlbumRef:
```typescript
const name = replaceClubEventAlbumRef.operationName;
console.log(name);
```

### Variables
The `ReplaceClubEventAlbum` mutation requires an argument of type `ReplaceClubEventAlbumVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReplaceClubEventAlbumVariables {
  id: string;
  clubId: string;
  urls?: unknown | null;
}
```
### Return Type
Recall that executing the `ReplaceClubEventAlbum` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReplaceClubEventAlbumData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReplaceClubEventAlbumData {
  cleared?: number | null;
  added?: number | null;
  event?: unknown | null;
}
```
### Using `ReplaceClubEventAlbum`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, replaceClubEventAlbum, ReplaceClubEventAlbumVariables } from '@clubs-platform/dataconnect';

// The `ReplaceClubEventAlbum` mutation requires an argument of type `ReplaceClubEventAlbumVariables`:
const replaceClubEventAlbumVars: ReplaceClubEventAlbumVariables = {
  id: ..., 
  clubId: ..., 
  urls: ..., // optional
};

// Call the `replaceClubEventAlbum()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await replaceClubEventAlbum(replaceClubEventAlbumVars);
// Variables can be defined inline as well.
const { data } = await replaceClubEventAlbum({ id: ..., clubId: ..., urls: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await replaceClubEventAlbum(dataConnect, replaceClubEventAlbumVars);

console.log(data.cleared);
console.log(data.added);
console.log(data.event);

// Or, you can use the `Promise` API.
replaceClubEventAlbum(replaceClubEventAlbumVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.event);
});
```

### Using `ReplaceClubEventAlbum`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, replaceClubEventAlbumRef, ReplaceClubEventAlbumVariables } from '@clubs-platform/dataconnect';

// The `ReplaceClubEventAlbum` mutation requires an argument of type `ReplaceClubEventAlbumVariables`:
const replaceClubEventAlbumVars: ReplaceClubEventAlbumVariables = {
  id: ..., 
  clubId: ..., 
  urls: ..., // optional
};

// Call the `replaceClubEventAlbumRef()` function to get a reference to the mutation.
const ref = replaceClubEventAlbumRef(replaceClubEventAlbumVars);
// Variables can be defined inline as well.
const ref = replaceClubEventAlbumRef({ id: ..., clubId: ..., urls: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = replaceClubEventAlbumRef(dataConnect, replaceClubEventAlbumVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);
console.log(data.added);
console.log(data.event);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.event);
});
```

## ReplaceClubEventStats
You can execute the `ReplaceClubEventStats` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
replaceClubEventStats(vars: ReplaceClubEventStatsVariables): MutationPromise<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;

interface ReplaceClubEventStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceClubEventStatsVariables): MutationRef<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;
}
export const replaceClubEventStatsRef: ReplaceClubEventStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
replaceClubEventStats(dc: DataConnect, vars: ReplaceClubEventStatsVariables): MutationPromise<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;

interface ReplaceClubEventStatsRef {
  ...
  (dc: DataConnect, vars: ReplaceClubEventStatsVariables): MutationRef<ReplaceClubEventStatsData, ReplaceClubEventStatsVariables>;
}
export const replaceClubEventStatsRef: ReplaceClubEventStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the replaceClubEventStatsRef:
```typescript
const name = replaceClubEventStatsRef.operationName;
console.log(name);
```

### Variables
The `ReplaceClubEventStats` mutation requires an argument of type `ReplaceClubEventStatsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReplaceClubEventStatsVariables {
  id: string;
  clubId: string;
  stats?: unknown | null;
}
```
### Return Type
Recall that executing the `ReplaceClubEventStats` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReplaceClubEventStatsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReplaceClubEventStatsData {
  cleared?: number | null;
  added?: number | null;
  event?: unknown | null;
}
```
### Using `ReplaceClubEventStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, replaceClubEventStats, ReplaceClubEventStatsVariables } from '@clubs-platform/dataconnect';

// The `ReplaceClubEventStats` mutation requires an argument of type `ReplaceClubEventStatsVariables`:
const replaceClubEventStatsVars: ReplaceClubEventStatsVariables = {
  id: ..., 
  clubId: ..., 
  stats: ..., // optional
};

// Call the `replaceClubEventStats()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await replaceClubEventStats(replaceClubEventStatsVars);
// Variables can be defined inline as well.
const { data } = await replaceClubEventStats({ id: ..., clubId: ..., stats: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await replaceClubEventStats(dataConnect, replaceClubEventStatsVars);

console.log(data.cleared);
console.log(data.added);
console.log(data.event);

// Or, you can use the `Promise` API.
replaceClubEventStats(replaceClubEventStatsVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.event);
});
```

### Using `ReplaceClubEventStats`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, replaceClubEventStatsRef, ReplaceClubEventStatsVariables } from '@clubs-platform/dataconnect';

// The `ReplaceClubEventStats` mutation requires an argument of type `ReplaceClubEventStatsVariables`:
const replaceClubEventStatsVars: ReplaceClubEventStatsVariables = {
  id: ..., 
  clubId: ..., 
  stats: ..., // optional
};

// Call the `replaceClubEventStatsRef()` function to get a reference to the mutation.
const ref = replaceClubEventStatsRef(replaceClubEventStatsVars);
// Variables can be defined inline as well.
const ref = replaceClubEventStatsRef({ id: ..., clubId: ..., stats: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = replaceClubEventStatsRef(dataConnect, replaceClubEventStatsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);
console.log(data.added);
console.log(data.event);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.event);
});
```

## SetMatchClubLineup
You can execute the `SetMatchClubLineup` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setMatchClubLineup(vars: SetMatchClubLineupVariables): MutationPromise<SetMatchClubLineupData, SetMatchClubLineupVariables>;

interface SetMatchClubLineupRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetMatchClubLineupVariables): MutationRef<SetMatchClubLineupData, SetMatchClubLineupVariables>;
}
export const setMatchClubLineupRef: SetMatchClubLineupRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setMatchClubLineup(dc: DataConnect, vars: SetMatchClubLineupVariables): MutationPromise<SetMatchClubLineupData, SetMatchClubLineupVariables>;

interface SetMatchClubLineupRef {
  ...
  (dc: DataConnect, vars: SetMatchClubLineupVariables): MutationRef<SetMatchClubLineupData, SetMatchClubLineupVariables>;
}
export const setMatchClubLineupRef: SetMatchClubLineupRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setMatchClubLineupRef:
```typescript
const name = setMatchClubLineupRef.operationName;
console.log(name);
```

### Variables
The `SetMatchClubLineup` mutation requires an argument of type `SetMatchClubLineupVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetMatchClubLineupVariables {
  matchId: string;
  clubId: string;
  lineup?: unknown | null;
}
```
### Return Type
Recall that executing the `SetMatchClubLineup` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetMatchClubLineupData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetMatchClubLineupData {
  report?: unknown | null;
}
```
### Using `SetMatchClubLineup`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setMatchClubLineup, SetMatchClubLineupVariables } from '@clubs-platform/dataconnect';

// The `SetMatchClubLineup` mutation requires an argument of type `SetMatchClubLineupVariables`:
const setMatchClubLineupVars: SetMatchClubLineupVariables = {
  matchId: ..., 
  clubId: ..., 
  lineup: ..., // optional
};

// Call the `setMatchClubLineup()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setMatchClubLineup(setMatchClubLineupVars);
// Variables can be defined inline as well.
const { data } = await setMatchClubLineup({ matchId: ..., clubId: ..., lineup: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setMatchClubLineup(dataConnect, setMatchClubLineupVars);

console.log(data.report);

// Or, you can use the `Promise` API.
setMatchClubLineup(setMatchClubLineupVars).then((response) => {
  const data = response.data;
  console.log(data.report);
});
```

### Using `SetMatchClubLineup`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setMatchClubLineupRef, SetMatchClubLineupVariables } from '@clubs-platform/dataconnect';

// The `SetMatchClubLineup` mutation requires an argument of type `SetMatchClubLineupVariables`:
const setMatchClubLineupVars: SetMatchClubLineupVariables = {
  matchId: ..., 
  clubId: ..., 
  lineup: ..., // optional
};

// Call the `setMatchClubLineupRef()` function to get a reference to the mutation.
const ref = setMatchClubLineupRef(setMatchClubLineupVars);
// Variables can be defined inline as well.
const ref = setMatchClubLineupRef({ matchId: ..., clubId: ..., lineup: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setMatchClubLineupRef(dataConnect, setMatchClubLineupVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.report);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.report);
});
```

## ReplaceMatchAttendees
You can execute the `ReplaceMatchAttendees` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
replaceMatchAttendees(vars: ReplaceMatchAttendeesVariables): MutationPromise<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;

interface ReplaceMatchAttendeesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReplaceMatchAttendeesVariables): MutationRef<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;
}
export const replaceMatchAttendeesRef: ReplaceMatchAttendeesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
replaceMatchAttendees(dc: DataConnect, vars: ReplaceMatchAttendeesVariables): MutationPromise<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;

interface ReplaceMatchAttendeesRef {
  ...
  (dc: DataConnect, vars: ReplaceMatchAttendeesVariables): MutationRef<ReplaceMatchAttendeesData, ReplaceMatchAttendeesVariables>;
}
export const replaceMatchAttendeesRef: ReplaceMatchAttendeesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the replaceMatchAttendeesRef:
```typescript
const name = replaceMatchAttendeesRef.operationName;
console.log(name);
```

### Variables
The `ReplaceMatchAttendees` mutation requires an argument of type `ReplaceMatchAttendeesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReplaceMatchAttendeesVariables {
  matchId: string;
  clubId: string;
  labels?: unknown | null;
}
```
### Return Type
Recall that executing the `ReplaceMatchAttendees` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReplaceMatchAttendeesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReplaceMatchAttendeesData {
  cleared?: number | null;
  added?: number | null;
  report?: unknown | null;
}
```
### Using `ReplaceMatchAttendees`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, replaceMatchAttendees, ReplaceMatchAttendeesVariables } from '@clubs-platform/dataconnect';

// The `ReplaceMatchAttendees` mutation requires an argument of type `ReplaceMatchAttendeesVariables`:
const replaceMatchAttendeesVars: ReplaceMatchAttendeesVariables = {
  matchId: ..., 
  clubId: ..., 
  labels: ..., // optional
};

// Call the `replaceMatchAttendees()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await replaceMatchAttendees(replaceMatchAttendeesVars);
// Variables can be defined inline as well.
const { data } = await replaceMatchAttendees({ matchId: ..., clubId: ..., labels: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await replaceMatchAttendees(dataConnect, replaceMatchAttendeesVars);

console.log(data.cleared);
console.log(data.added);
console.log(data.report);

// Or, you can use the `Promise` API.
replaceMatchAttendees(replaceMatchAttendeesVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.report);
});
```

### Using `ReplaceMatchAttendees`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, replaceMatchAttendeesRef, ReplaceMatchAttendeesVariables } from '@clubs-platform/dataconnect';

// The `ReplaceMatchAttendees` mutation requires an argument of type `ReplaceMatchAttendeesVariables`:
const replaceMatchAttendeesVars: ReplaceMatchAttendeesVariables = {
  matchId: ..., 
  clubId: ..., 
  labels: ..., // optional
};

// Call the `replaceMatchAttendeesRef()` function to get a reference to the mutation.
const ref = replaceMatchAttendeesRef(replaceMatchAttendeesVars);
// Variables can be defined inline as well.
const ref = replaceMatchAttendeesRef({ matchId: ..., clubId: ..., labels: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = replaceMatchAttendeesRef(dataConnect, replaceMatchAttendeesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);
console.log(data.added);
console.log(data.report);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
  console.log(data.added);
  console.log(data.report);
});
```

## SaveFinancialGoal
You can execute the `SaveFinancialGoal` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveFinancialGoal(vars: SaveFinancialGoalVariables): MutationPromise<SaveFinancialGoalData, SaveFinancialGoalVariables>;

interface SaveFinancialGoalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveFinancialGoalVariables): MutationRef<SaveFinancialGoalData, SaveFinancialGoalVariables>;
}
export const saveFinancialGoalRef: SaveFinancialGoalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveFinancialGoal(dc: DataConnect, vars: SaveFinancialGoalVariables): MutationPromise<SaveFinancialGoalData, SaveFinancialGoalVariables>;

interface SaveFinancialGoalRef {
  ...
  (dc: DataConnect, vars: SaveFinancialGoalVariables): MutationRef<SaveFinancialGoalData, SaveFinancialGoalVariables>;
}
export const saveFinancialGoalRef: SaveFinancialGoalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveFinancialGoalRef:
```typescript
const name = saveFinancialGoalRef.operationName;
console.log(name);
```

### Variables
The `SaveFinancialGoal` mutation requires an argument of type `SaveFinancialGoalVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveFinancialGoalVariables {
  id: string;
  clubId: string;
  title: string;
  amount: number;
  quotaPerPlayer?: number | null;
}
```
### Return Type
Recall that executing the `SaveFinancialGoal` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveFinancialGoalData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveFinancialGoalData {
  goal?: unknown | null;
}
```
### Using `SaveFinancialGoal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveFinancialGoal, SaveFinancialGoalVariables } from '@clubs-platform/dataconnect';

// The `SaveFinancialGoal` mutation requires an argument of type `SaveFinancialGoalVariables`:
const saveFinancialGoalVars: SaveFinancialGoalVariables = {
  id: ..., 
  clubId: ..., 
  title: ..., 
  amount: ..., 
  quotaPerPlayer: ..., // optional
};

// Call the `saveFinancialGoal()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveFinancialGoal(saveFinancialGoalVars);
// Variables can be defined inline as well.
const { data } = await saveFinancialGoal({ id: ..., clubId: ..., title: ..., amount: ..., quotaPerPlayer: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveFinancialGoal(dataConnect, saveFinancialGoalVars);

console.log(data.goal);

// Or, you can use the `Promise` API.
saveFinancialGoal(saveFinancialGoalVars).then((response) => {
  const data = response.data;
  console.log(data.goal);
});
```

### Using `SaveFinancialGoal`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveFinancialGoalRef, SaveFinancialGoalVariables } from '@clubs-platform/dataconnect';

// The `SaveFinancialGoal` mutation requires an argument of type `SaveFinancialGoalVariables`:
const saveFinancialGoalVars: SaveFinancialGoalVariables = {
  id: ..., 
  clubId: ..., 
  title: ..., 
  amount: ..., 
  quotaPerPlayer: ..., // optional
};

// Call the `saveFinancialGoalRef()` function to get a reference to the mutation.
const ref = saveFinancialGoalRef(saveFinancialGoalVars);
// Variables can be defined inline as well.
const ref = saveFinancialGoalRef({ id: ..., clubId: ..., title: ..., amount: ..., quotaPerPlayer: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveFinancialGoalRef(dataConnect, saveFinancialGoalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.goal);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.goal);
});
```

## SetFinancialGoalStatus
You can execute the `SetFinancialGoalStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setFinancialGoalStatus(vars: SetFinancialGoalStatusVariables): MutationPromise<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;

interface SetFinancialGoalStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetFinancialGoalStatusVariables): MutationRef<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;
}
export const setFinancialGoalStatusRef: SetFinancialGoalStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setFinancialGoalStatus(dc: DataConnect, vars: SetFinancialGoalStatusVariables): MutationPromise<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;

interface SetFinancialGoalStatusRef {
  ...
  (dc: DataConnect, vars: SetFinancialGoalStatusVariables): MutationRef<SetFinancialGoalStatusData, SetFinancialGoalStatusVariables>;
}
export const setFinancialGoalStatusRef: SetFinancialGoalStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setFinancialGoalStatusRef:
```typescript
const name = setFinancialGoalStatusRef.operationName;
console.log(name);
```

### Variables
The `SetFinancialGoalStatus` mutation requires an argument of type `SetFinancialGoalStatusVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetFinancialGoalStatusVariables {
  id: string;
  clubId: string;
  status: string;
}
```
### Return Type
Recall that executing the `SetFinancialGoalStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetFinancialGoalStatusData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetFinancialGoalStatusData {
  goal?: unknown | null;
}
```
### Using `SetFinancialGoalStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setFinancialGoalStatus, SetFinancialGoalStatusVariables } from '@clubs-platform/dataconnect';

// The `SetFinancialGoalStatus` mutation requires an argument of type `SetFinancialGoalStatusVariables`:
const setFinancialGoalStatusVars: SetFinancialGoalStatusVariables = {
  id: ..., 
  clubId: ..., 
  status: ..., 
};

// Call the `setFinancialGoalStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setFinancialGoalStatus(setFinancialGoalStatusVars);
// Variables can be defined inline as well.
const { data } = await setFinancialGoalStatus({ id: ..., clubId: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setFinancialGoalStatus(dataConnect, setFinancialGoalStatusVars);

console.log(data.goal);

// Or, you can use the `Promise` API.
setFinancialGoalStatus(setFinancialGoalStatusVars).then((response) => {
  const data = response.data;
  console.log(data.goal);
});
```

### Using `SetFinancialGoalStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setFinancialGoalStatusRef, SetFinancialGoalStatusVariables } from '@clubs-platform/dataconnect';

// The `SetFinancialGoalStatus` mutation requires an argument of type `SetFinancialGoalStatusVariables`:
const setFinancialGoalStatusVars: SetFinancialGoalStatusVariables = {
  id: ..., 
  clubId: ..., 
  status: ..., 
};

// Call the `setFinancialGoalStatusRef()` function to get a reference to the mutation.
const ref = setFinancialGoalStatusRef(setFinancialGoalStatusVars);
// Variables can be defined inline as well.
const ref = setFinancialGoalStatusRef({ id: ..., clubId: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setFinancialGoalStatusRef(dataConnect, setFinancialGoalStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.goal);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.goal);
});
```

## DeleteFinancialGoal
You can execute the `DeleteFinancialGoal` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteFinancialGoal(vars: DeleteFinancialGoalVariables): MutationPromise<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;

interface DeleteFinancialGoalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFinancialGoalVariables): MutationRef<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;
}
export const deleteFinancialGoalRef: DeleteFinancialGoalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteFinancialGoal(dc: DataConnect, vars: DeleteFinancialGoalVariables): MutationPromise<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;

interface DeleteFinancialGoalRef {
  ...
  (dc: DataConnect, vars: DeleteFinancialGoalVariables): MutationRef<DeleteFinancialGoalData, DeleteFinancialGoalVariables>;
}
export const deleteFinancialGoalRef: DeleteFinancialGoalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteFinancialGoalRef:
```typescript
const name = deleteFinancialGoalRef.operationName;
console.log(name);
```

### Variables
The `DeleteFinancialGoal` mutation requires an argument of type `DeleteFinancialGoalVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteFinancialGoalVariables {
  id: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `DeleteFinancialGoal` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteFinancialGoalData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteFinancialGoalData {
  deleted?: number | null;
}
```
### Using `DeleteFinancialGoal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteFinancialGoal, DeleteFinancialGoalVariables } from '@clubs-platform/dataconnect';

// The `DeleteFinancialGoal` mutation requires an argument of type `DeleteFinancialGoalVariables`:
const deleteFinancialGoalVars: DeleteFinancialGoalVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteFinancialGoal()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteFinancialGoal(deleteFinancialGoalVars);
// Variables can be defined inline as well.
const { data } = await deleteFinancialGoal({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteFinancialGoal(dataConnect, deleteFinancialGoalVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteFinancialGoal(deleteFinancialGoalVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteFinancialGoal`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteFinancialGoalRef, DeleteFinancialGoalVariables } from '@clubs-platform/dataconnect';

// The `DeleteFinancialGoal` mutation requires an argument of type `DeleteFinancialGoalVariables`:
const deleteFinancialGoalVars: DeleteFinancialGoalVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteFinancialGoalRef()` function to get a reference to the mutation.
const ref = deleteFinancialGoalRef(deleteFinancialGoalVars);
// Variables can be defined inline as well.
const ref = deleteFinancialGoalRef({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteFinancialGoalRef(dataConnect, deleteFinancialGoalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## DeleteTransaction
You can execute the `DeleteTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteTransaction(vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
}
export const deleteTransactionRef: DeleteTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteTransactionRef {
  ...
  (dc: DataConnect, vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
}
export const deleteTransactionRef: DeleteTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTransactionRef:
```typescript
const name = deleteTransactionRef.operationName;
console.log(name);
```

### Variables
The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTransactionVariables {
  id: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `DeleteTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTransactionData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTransactionData {
  deleted?: number | null;
}
```
### Using `DeleteTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTransaction, DeleteTransactionVariables } from '@clubs-platform/dataconnect';

// The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`:
const deleteTransactionVars: DeleteTransactionVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTransaction(deleteTransactionVars);
// Variables can be defined inline as well.
const { data } = await deleteTransaction({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTransaction(dataConnect, deleteTransactionVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteTransaction(deleteTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTransactionRef, DeleteTransactionVariables } from '@clubs-platform/dataconnect';

// The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`:
const deleteTransactionVars: DeleteTransactionVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteTransactionRef()` function to get a reference to the mutation.
const ref = deleteTransactionRef(deleteTransactionVars);
// Variables can be defined inline as well.
const ref = deleteTransactionRef({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTransactionRef(dataConnect, deleteTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## DeleteInventoryItem
You can execute the `DeleteInventoryItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteInventoryItem(vars: DeleteInventoryItemVariables): MutationPromise<DeleteInventoryItemData, DeleteInventoryItemVariables>;

interface DeleteInventoryItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteInventoryItemVariables): MutationRef<DeleteInventoryItemData, DeleteInventoryItemVariables>;
}
export const deleteInventoryItemRef: DeleteInventoryItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteInventoryItem(dc: DataConnect, vars: DeleteInventoryItemVariables): MutationPromise<DeleteInventoryItemData, DeleteInventoryItemVariables>;

interface DeleteInventoryItemRef {
  ...
  (dc: DataConnect, vars: DeleteInventoryItemVariables): MutationRef<DeleteInventoryItemData, DeleteInventoryItemVariables>;
}
export const deleteInventoryItemRef: DeleteInventoryItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteInventoryItemRef:
```typescript
const name = deleteInventoryItemRef.operationName;
console.log(name);
```

### Variables
The `DeleteInventoryItem` mutation requires an argument of type `DeleteInventoryItemVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteInventoryItemVariables {
  id: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `DeleteInventoryItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteInventoryItemData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteInventoryItemData {
  deleted?: number | null;
}
```
### Using `DeleteInventoryItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteInventoryItem, DeleteInventoryItemVariables } from '@clubs-platform/dataconnect';

// The `DeleteInventoryItem` mutation requires an argument of type `DeleteInventoryItemVariables`:
const deleteInventoryItemVars: DeleteInventoryItemVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteInventoryItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteInventoryItem(deleteInventoryItemVars);
// Variables can be defined inline as well.
const { data } = await deleteInventoryItem({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteInventoryItem(dataConnect, deleteInventoryItemVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteInventoryItem(deleteInventoryItemVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteInventoryItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteInventoryItemRef, DeleteInventoryItemVariables } from '@clubs-platform/dataconnect';

// The `DeleteInventoryItem` mutation requires an argument of type `DeleteInventoryItemVariables`:
const deleteInventoryItemVars: DeleteInventoryItemVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteInventoryItemRef()` function to get a reference to the mutation.
const ref = deleteInventoryItemRef(deleteInventoryItemVars);
// Variables can be defined inline as well.
const ref = deleteInventoryItemRef({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteInventoryItemRef(dataConnect, deleteInventoryItemVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## SaveGalleryPhoto
You can execute the `SaveGalleryPhoto` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveGalleryPhoto(vars: SaveGalleryPhotoVariables): MutationPromise<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;

interface SaveGalleryPhotoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveGalleryPhotoVariables): MutationRef<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;
}
export const saveGalleryPhotoRef: SaveGalleryPhotoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveGalleryPhoto(dc: DataConnect, vars: SaveGalleryPhotoVariables): MutationPromise<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;

interface SaveGalleryPhotoRef {
  ...
  (dc: DataConnect, vars: SaveGalleryPhotoVariables): MutationRef<SaveGalleryPhotoData, SaveGalleryPhotoVariables>;
}
export const saveGalleryPhotoRef: SaveGalleryPhotoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveGalleryPhotoRef:
```typescript
const name = saveGalleryPhotoRef.operationName;
console.log(name);
```

### Variables
The `SaveGalleryPhoto` mutation requires an argument of type `SaveGalleryPhotoVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveGalleryPhotoVariables {
  albumId: string;
  clubId: string;
  albumName: string;
  photoId: string;
  url: string;
  caption: string;
  takenAt: TimestampString;
}
```
### Return Type
Recall that executing the `SaveGalleryPhoto` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveGalleryPhotoData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveGalleryPhotoData {
  album?: number | null;
  photo?: unknown | null;
}
```
### Using `SaveGalleryPhoto`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveGalleryPhoto, SaveGalleryPhotoVariables } from '@clubs-platform/dataconnect';

// The `SaveGalleryPhoto` mutation requires an argument of type `SaveGalleryPhotoVariables`:
const saveGalleryPhotoVars: SaveGalleryPhotoVariables = {
  albumId: ..., 
  clubId: ..., 
  albumName: ..., 
  photoId: ..., 
  url: ..., 
  caption: ..., 
  takenAt: ..., 
};

// Call the `saveGalleryPhoto()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveGalleryPhoto(saveGalleryPhotoVars);
// Variables can be defined inline as well.
const { data } = await saveGalleryPhoto({ albumId: ..., clubId: ..., albumName: ..., photoId: ..., url: ..., caption: ..., takenAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveGalleryPhoto(dataConnect, saveGalleryPhotoVars);

console.log(data.album);
console.log(data.photo);

// Or, you can use the `Promise` API.
saveGalleryPhoto(saveGalleryPhotoVars).then((response) => {
  const data = response.data;
  console.log(data.album);
  console.log(data.photo);
});
```

### Using `SaveGalleryPhoto`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveGalleryPhotoRef, SaveGalleryPhotoVariables } from '@clubs-platform/dataconnect';

// The `SaveGalleryPhoto` mutation requires an argument of type `SaveGalleryPhotoVariables`:
const saveGalleryPhotoVars: SaveGalleryPhotoVariables = {
  albumId: ..., 
  clubId: ..., 
  albumName: ..., 
  photoId: ..., 
  url: ..., 
  caption: ..., 
  takenAt: ..., 
};

// Call the `saveGalleryPhotoRef()` function to get a reference to the mutation.
const ref = saveGalleryPhotoRef(saveGalleryPhotoVars);
// Variables can be defined inline as well.
const ref = saveGalleryPhotoRef({ albumId: ..., clubId: ..., albumName: ..., photoId: ..., url: ..., caption: ..., takenAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveGalleryPhotoRef(dataConnect, saveGalleryPhotoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.album);
console.log(data.photo);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.album);
  console.log(data.photo);
});
```

## SwapGalleryPhotos
You can execute the `SwapGalleryPhotos` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
swapGalleryPhotos(vars: SwapGalleryPhotosVariables): MutationPromise<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;

interface SwapGalleryPhotosRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SwapGalleryPhotosVariables): MutationRef<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;
}
export const swapGalleryPhotosRef: SwapGalleryPhotosRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
swapGalleryPhotos(dc: DataConnect, vars: SwapGalleryPhotosVariables): MutationPromise<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;

interface SwapGalleryPhotosRef {
  ...
  (dc: DataConnect, vars: SwapGalleryPhotosVariables): MutationRef<SwapGalleryPhotosData, SwapGalleryPhotosVariables>;
}
export const swapGalleryPhotosRef: SwapGalleryPhotosRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the swapGalleryPhotosRef:
```typescript
const name = swapGalleryPhotosRef.operationName;
console.log(name);
```

### Variables
The `SwapGalleryPhotos` mutation requires an argument of type `SwapGalleryPhotosVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SwapGalleryPhotosVariables {
  clubId: string;
  firstId: string;
  secondId: string;
}
```
### Return Type
Recall that executing the `SwapGalleryPhotos` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SwapGalleryPhotosData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SwapGalleryPhotosData {
  swapped?: number | null;
}
```
### Using `SwapGalleryPhotos`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, swapGalleryPhotos, SwapGalleryPhotosVariables } from '@clubs-platform/dataconnect';

// The `SwapGalleryPhotos` mutation requires an argument of type `SwapGalleryPhotosVariables`:
const swapGalleryPhotosVars: SwapGalleryPhotosVariables = {
  clubId: ..., 
  firstId: ..., 
  secondId: ..., 
};

// Call the `swapGalleryPhotos()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await swapGalleryPhotos(swapGalleryPhotosVars);
// Variables can be defined inline as well.
const { data } = await swapGalleryPhotos({ clubId: ..., firstId: ..., secondId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await swapGalleryPhotos(dataConnect, swapGalleryPhotosVars);

console.log(data.swapped);

// Or, you can use the `Promise` API.
swapGalleryPhotos(swapGalleryPhotosVars).then((response) => {
  const data = response.data;
  console.log(data.swapped);
});
```

### Using `SwapGalleryPhotos`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, swapGalleryPhotosRef, SwapGalleryPhotosVariables } from '@clubs-platform/dataconnect';

// The `SwapGalleryPhotos` mutation requires an argument of type `SwapGalleryPhotosVariables`:
const swapGalleryPhotosVars: SwapGalleryPhotosVariables = {
  clubId: ..., 
  firstId: ..., 
  secondId: ..., 
};

// Call the `swapGalleryPhotosRef()` function to get a reference to the mutation.
const ref = swapGalleryPhotosRef(swapGalleryPhotosVars);
// Variables can be defined inline as well.
const ref = swapGalleryPhotosRef({ clubId: ..., firstId: ..., secondId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = swapGalleryPhotosRef(dataConnect, swapGalleryPhotosVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.swapped);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.swapped);
});
```

## PromoteGalleryPhoto
You can execute the `PromoteGalleryPhoto` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
promoteGalleryPhoto(vars: PromoteGalleryPhotoVariables): MutationPromise<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;

interface PromoteGalleryPhotoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PromoteGalleryPhotoVariables): MutationRef<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;
}
export const promoteGalleryPhotoRef: PromoteGalleryPhotoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
promoteGalleryPhoto(dc: DataConnect, vars: PromoteGalleryPhotoVariables): MutationPromise<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;

interface PromoteGalleryPhotoRef {
  ...
  (dc: DataConnect, vars: PromoteGalleryPhotoVariables): MutationRef<PromoteGalleryPhotoData, PromoteGalleryPhotoVariables>;
}
export const promoteGalleryPhotoRef: PromoteGalleryPhotoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the promoteGalleryPhotoRef:
```typescript
const name = promoteGalleryPhotoRef.operationName;
console.log(name);
```

### Variables
The `PromoteGalleryPhoto` mutation requires an argument of type `PromoteGalleryPhotoVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PromoteGalleryPhotoVariables {
  clubId: string;
  photoId: string;
}
```
### Return Type
Recall that executing the `PromoteGalleryPhoto` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PromoteGalleryPhotoData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PromoteGalleryPhotoData {
  photo?: unknown | null;
}
```
### Using `PromoteGalleryPhoto`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, promoteGalleryPhoto, PromoteGalleryPhotoVariables } from '@clubs-platform/dataconnect';

// The `PromoteGalleryPhoto` mutation requires an argument of type `PromoteGalleryPhotoVariables`:
const promoteGalleryPhotoVars: PromoteGalleryPhotoVariables = {
  clubId: ..., 
  photoId: ..., 
};

// Call the `promoteGalleryPhoto()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await promoteGalleryPhoto(promoteGalleryPhotoVars);
// Variables can be defined inline as well.
const { data } = await promoteGalleryPhoto({ clubId: ..., photoId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await promoteGalleryPhoto(dataConnect, promoteGalleryPhotoVars);

console.log(data.photo);

// Or, you can use the `Promise` API.
promoteGalleryPhoto(promoteGalleryPhotoVars).then((response) => {
  const data = response.data;
  console.log(data.photo);
});
```

### Using `PromoteGalleryPhoto`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, promoteGalleryPhotoRef, PromoteGalleryPhotoVariables } from '@clubs-platform/dataconnect';

// The `PromoteGalleryPhoto` mutation requires an argument of type `PromoteGalleryPhotoVariables`:
const promoteGalleryPhotoVars: PromoteGalleryPhotoVariables = {
  clubId: ..., 
  photoId: ..., 
};

// Call the `promoteGalleryPhotoRef()` function to get a reference to the mutation.
const ref = promoteGalleryPhotoRef(promoteGalleryPhotoVars);
// Variables can be defined inline as well.
const ref = promoteGalleryPhotoRef({ clubId: ..., photoId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = promoteGalleryPhotoRef(dataConnect, promoteGalleryPhotoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.photo);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.photo);
});
```

## DeleteGalleryPhoto
You can execute the `DeleteGalleryPhoto` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteGalleryPhoto(vars: DeleteGalleryPhotoVariables): MutationPromise<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;

interface DeleteGalleryPhotoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGalleryPhotoVariables): MutationRef<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;
}
export const deleteGalleryPhotoRef: DeleteGalleryPhotoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteGalleryPhoto(dc: DataConnect, vars: DeleteGalleryPhotoVariables): MutationPromise<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;

interface DeleteGalleryPhotoRef {
  ...
  (dc: DataConnect, vars: DeleteGalleryPhotoVariables): MutationRef<DeleteGalleryPhotoData, DeleteGalleryPhotoVariables>;
}
export const deleteGalleryPhotoRef: DeleteGalleryPhotoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteGalleryPhotoRef:
```typescript
const name = deleteGalleryPhotoRef.operationName;
console.log(name);
```

### Variables
The `DeleteGalleryPhoto` mutation requires an argument of type `DeleteGalleryPhotoVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteGalleryPhotoVariables {
  clubId: string;
  photoId: string;
}
```
### Return Type
Recall that executing the `DeleteGalleryPhoto` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteGalleryPhotoData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteGalleryPhotoData {
  deleted?: number | null;
}
```
### Using `DeleteGalleryPhoto`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteGalleryPhoto, DeleteGalleryPhotoVariables } from '@clubs-platform/dataconnect';

// The `DeleteGalleryPhoto` mutation requires an argument of type `DeleteGalleryPhotoVariables`:
const deleteGalleryPhotoVars: DeleteGalleryPhotoVariables = {
  clubId: ..., 
  photoId: ..., 
};

// Call the `deleteGalleryPhoto()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteGalleryPhoto(deleteGalleryPhotoVars);
// Variables can be defined inline as well.
const { data } = await deleteGalleryPhoto({ clubId: ..., photoId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteGalleryPhoto(dataConnect, deleteGalleryPhotoVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteGalleryPhoto(deleteGalleryPhotoVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteGalleryPhoto`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteGalleryPhotoRef, DeleteGalleryPhotoVariables } from '@clubs-platform/dataconnect';

// The `DeleteGalleryPhoto` mutation requires an argument of type `DeleteGalleryPhotoVariables`:
const deleteGalleryPhotoVars: DeleteGalleryPhotoVariables = {
  clubId: ..., 
  photoId: ..., 
};

// Call the `deleteGalleryPhotoRef()` function to get a reference to the mutation.
const ref = deleteGalleryPhotoRef(deleteGalleryPhotoVars);
// Variables can be defined inline as well.
const ref = deleteGalleryPhotoRef({ clubId: ..., photoId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteGalleryPhotoRef(dataConnect, deleteGalleryPhotoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## ClearClubAvailability
You can execute the `ClearClubAvailability` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearClubAvailability(vars: ClearClubAvailabilityVariables): MutationPromise<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;

interface ClearClubAvailabilityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearClubAvailabilityVariables): MutationRef<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;
}
export const clearClubAvailabilityRef: ClearClubAvailabilityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearClubAvailability(dc: DataConnect, vars: ClearClubAvailabilityVariables): MutationPromise<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;

interface ClearClubAvailabilityRef {
  ...
  (dc: DataConnect, vars: ClearClubAvailabilityVariables): MutationRef<ClearClubAvailabilityData, ClearClubAvailabilityVariables>;
}
export const clearClubAvailabilityRef: ClearClubAvailabilityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearClubAvailabilityRef:
```typescript
const name = clearClubAvailabilityRef.operationName;
console.log(name);
```

### Variables
The `ClearClubAvailability` mutation requires an argument of type `ClearClubAvailabilityVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearClubAvailabilityVariables {
  clubId: string;
}
```
### Return Type
Recall that executing the `ClearClubAvailability` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearClubAvailabilityData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClearClubAvailabilityData {
  cleared?: number | null;
}
```
### Using `ClearClubAvailability`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearClubAvailability, ClearClubAvailabilityVariables } from '@clubs-platform/dataconnect';

// The `ClearClubAvailability` mutation requires an argument of type `ClearClubAvailabilityVariables`:
const clearClubAvailabilityVars: ClearClubAvailabilityVariables = {
  clubId: ..., 
};

// Call the `clearClubAvailability()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearClubAvailability(clearClubAvailabilityVars);
// Variables can be defined inline as well.
const { data } = await clearClubAvailability({ clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearClubAvailability(dataConnect, clearClubAvailabilityVars);

console.log(data.cleared);

// Or, you can use the `Promise` API.
clearClubAvailability(clearClubAvailabilityVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
});
```

### Using `ClearClubAvailability`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearClubAvailabilityRef, ClearClubAvailabilityVariables } from '@clubs-platform/dataconnect';

// The `ClearClubAvailability` mutation requires an argument of type `ClearClubAvailabilityVariables`:
const clearClubAvailabilityVars: ClearClubAvailabilityVariables = {
  clubId: ..., 
};

// Call the `clearClubAvailabilityRef()` function to get a reference to the mutation.
const ref = clearClubAvailabilityRef(clearClubAvailabilityVars);
// Variables can be defined inline as well.
const ref = clearClubAvailabilityRef({ clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearClubAvailabilityRef(dataConnect, clearClubAvailabilityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
});
```

## InsertClubAvailability
You can execute the `InsertClubAvailability` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
insertClubAvailability(vars: InsertClubAvailabilityVariables): MutationPromise<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;

interface InsertClubAvailabilityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClubAvailabilityVariables): MutationRef<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;
}
export const insertClubAvailabilityRef: InsertClubAvailabilityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertClubAvailability(dc: DataConnect, vars: InsertClubAvailabilityVariables): MutationPromise<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;

interface InsertClubAvailabilityRef {
  ...
  (dc: DataConnect, vars: InsertClubAvailabilityVariables): MutationRef<InsertClubAvailabilityData, InsertClubAvailabilityVariables>;
}
export const insertClubAvailabilityRef: InsertClubAvailabilityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertClubAvailabilityRef:
```typescript
const name = insertClubAvailabilityRef.operationName;
console.log(name);
```

### Variables
The `InsertClubAvailability` mutation requires an argument of type `InsertClubAvailabilityVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertClubAvailabilityVariables {
  clubId: string;
  windows?: unknown | null;
}
```
### Return Type
Recall that executing the `InsertClubAvailability` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertClubAvailabilityData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertClubAvailabilityData {
  window?: unknown | null;
}
```
### Using `InsertClubAvailability`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertClubAvailability, InsertClubAvailabilityVariables } from '@clubs-platform/dataconnect';

// The `InsertClubAvailability` mutation requires an argument of type `InsertClubAvailabilityVariables`:
const insertClubAvailabilityVars: InsertClubAvailabilityVariables = {
  clubId: ..., 
  windows: ..., // optional
};

// Call the `insertClubAvailability()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertClubAvailability(insertClubAvailabilityVars);
// Variables can be defined inline as well.
const { data } = await insertClubAvailability({ clubId: ..., windows: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertClubAvailability(dataConnect, insertClubAvailabilityVars);

console.log(data.window);

// Or, you can use the `Promise` API.
insertClubAvailability(insertClubAvailabilityVars).then((response) => {
  const data = response.data;
  console.log(data.window);
});
```

### Using `InsertClubAvailability`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertClubAvailabilityRef, InsertClubAvailabilityVariables } from '@clubs-platform/dataconnect';

// The `InsertClubAvailability` mutation requires an argument of type `InsertClubAvailabilityVariables`:
const insertClubAvailabilityVars: InsertClubAvailabilityVariables = {
  clubId: ..., 
  windows: ..., // optional
};

// Call the `insertClubAvailabilityRef()` function to get a reference to the mutation.
const ref = insertClubAvailabilityRef(insertClubAvailabilityVars);
// Variables can be defined inline as well.
const ref = insertClubAvailabilityRef({ clubId: ..., windows: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertClubAvailabilityRef(dataConnect, insertClubAvailabilityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.window);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.window);
});
```

## SaveClubPortada
You can execute the `SaveClubPortada` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveClubPortada(vars: SaveClubPortadaVariables): MutationPromise<SaveClubPortadaData, SaveClubPortadaVariables>;

interface SaveClubPortadaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubPortadaVariables): MutationRef<SaveClubPortadaData, SaveClubPortadaVariables>;
}
export const saveClubPortadaRef: SaveClubPortadaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveClubPortada(dc: DataConnect, vars: SaveClubPortadaVariables): MutationPromise<SaveClubPortadaData, SaveClubPortadaVariables>;

interface SaveClubPortadaRef {
  ...
  (dc: DataConnect, vars: SaveClubPortadaVariables): MutationRef<SaveClubPortadaData, SaveClubPortadaVariables>;
}
export const saveClubPortadaRef: SaveClubPortadaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveClubPortadaRef:
```typescript
const name = saveClubPortadaRef.operationName;
console.log(name);
```

### Variables
The `SaveClubPortada` mutation requires an argument of type `SaveClubPortadaVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveClubPortadaVariables {
  id: string;
  name: string;
  description: string;
  location: string;
}
```
### Return Type
Recall that executing the `SaveClubPortada` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveClubPortadaData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveClubPortadaData {
  club?: unknown | null;
}
```
### Using `SaveClubPortada`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveClubPortada, SaveClubPortadaVariables } from '@clubs-platform/dataconnect';

// The `SaveClubPortada` mutation requires an argument of type `SaveClubPortadaVariables`:
const saveClubPortadaVars: SaveClubPortadaVariables = {
  id: ..., 
  name: ..., 
  description: ..., 
  location: ..., 
};

// Call the `saveClubPortada()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveClubPortada(saveClubPortadaVars);
// Variables can be defined inline as well.
const { data } = await saveClubPortada({ id: ..., name: ..., description: ..., location: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveClubPortada(dataConnect, saveClubPortadaVars);

console.log(data.club);

// Or, you can use the `Promise` API.
saveClubPortada(saveClubPortadaVars).then((response) => {
  const data = response.data;
  console.log(data.club);
});
```

### Using `SaveClubPortada`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveClubPortadaRef, SaveClubPortadaVariables } from '@clubs-platform/dataconnect';

// The `SaveClubPortada` mutation requires an argument of type `SaveClubPortadaVariables`:
const saveClubPortadaVars: SaveClubPortadaVariables = {
  id: ..., 
  name: ..., 
  description: ..., 
  location: ..., 
};

// Call the `saveClubPortadaRef()` function to get a reference to the mutation.
const ref = saveClubPortadaRef(saveClubPortadaVars);
// Variables can be defined inline as well.
const ref = saveClubPortadaRef({ id: ..., name: ..., description: ..., location: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveClubPortadaRef(dataConnect, saveClubPortadaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.club);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.club);
});
```

## ClearClubHeroes
You can execute the `ClearClubHeroes` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearClubHeroes(vars: ClearClubHeroesVariables): MutationPromise<ClearClubHeroesData, ClearClubHeroesVariables>;

interface ClearClubHeroesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearClubHeroesVariables): MutationRef<ClearClubHeroesData, ClearClubHeroesVariables>;
}
export const clearClubHeroesRef: ClearClubHeroesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearClubHeroes(dc: DataConnect, vars: ClearClubHeroesVariables): MutationPromise<ClearClubHeroesData, ClearClubHeroesVariables>;

interface ClearClubHeroesRef {
  ...
  (dc: DataConnect, vars: ClearClubHeroesVariables): MutationRef<ClearClubHeroesData, ClearClubHeroesVariables>;
}
export const clearClubHeroesRef: ClearClubHeroesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearClubHeroesRef:
```typescript
const name = clearClubHeroesRef.operationName;
console.log(name);
```

### Variables
The `ClearClubHeroes` mutation requires an argument of type `ClearClubHeroesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearClubHeroesVariables {
  id: string;
}
```
### Return Type
Recall that executing the `ClearClubHeroes` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearClubHeroesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClearClubHeroesData {
  cleared?: number | null;
}
```
### Using `ClearClubHeroes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearClubHeroes, ClearClubHeroesVariables } from '@clubs-platform/dataconnect';

// The `ClearClubHeroes` mutation requires an argument of type `ClearClubHeroesVariables`:
const clearClubHeroesVars: ClearClubHeroesVariables = {
  id: ..., 
};

// Call the `clearClubHeroes()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearClubHeroes(clearClubHeroesVars);
// Variables can be defined inline as well.
const { data } = await clearClubHeroes({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearClubHeroes(dataConnect, clearClubHeroesVars);

console.log(data.cleared);

// Or, you can use the `Promise` API.
clearClubHeroes(clearClubHeroesVars).then((response) => {
  const data = response.data;
  console.log(data.cleared);
});
```

### Using `ClearClubHeroes`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearClubHeroesRef, ClearClubHeroesVariables } from '@clubs-platform/dataconnect';

// The `ClearClubHeroes` mutation requires an argument of type `ClearClubHeroesVariables`:
const clearClubHeroesVars: ClearClubHeroesVariables = {
  id: ..., 
};

// Call the `clearClubHeroesRef()` function to get a reference to the mutation.
const ref = clearClubHeroesRef(clearClubHeroesVars);
// Variables can be defined inline as well.
const ref = clearClubHeroesRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearClubHeroesRef(dataConnect, clearClubHeroesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cleared);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cleared);
});
```

## InsertClubHeroes
You can execute the `InsertClubHeroes` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
insertClubHeroes(vars: InsertClubHeroesVariables): MutationPromise<InsertClubHeroesData, InsertClubHeroesVariables>;

interface InsertClubHeroesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClubHeroesVariables): MutationRef<InsertClubHeroesData, InsertClubHeroesVariables>;
}
export const insertClubHeroesRef: InsertClubHeroesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertClubHeroes(dc: DataConnect, vars: InsertClubHeroesVariables): MutationPromise<InsertClubHeroesData, InsertClubHeroesVariables>;

interface InsertClubHeroesRef {
  ...
  (dc: DataConnect, vars: InsertClubHeroesVariables): MutationRef<InsertClubHeroesData, InsertClubHeroesVariables>;
}
export const insertClubHeroesRef: InsertClubHeroesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertClubHeroesRef:
```typescript
const name = insertClubHeroesRef.operationName;
console.log(name);
```

### Variables
The `InsertClubHeroes` mutation requires an argument of type `InsertClubHeroesVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertClubHeroesVariables {
  id: string;
  urls?: unknown | null;
}
```
### Return Type
Recall that executing the `InsertClubHeroes` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertClubHeroesData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertClubHeroesData {
  hero?: unknown | null;
}
```
### Using `InsertClubHeroes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertClubHeroes, InsertClubHeroesVariables } from '@clubs-platform/dataconnect';

// The `InsertClubHeroes` mutation requires an argument of type `InsertClubHeroesVariables`:
const insertClubHeroesVars: InsertClubHeroesVariables = {
  id: ..., 
  urls: ..., // optional
};

// Call the `insertClubHeroes()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertClubHeroes(insertClubHeroesVars);
// Variables can be defined inline as well.
const { data } = await insertClubHeroes({ id: ..., urls: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertClubHeroes(dataConnect, insertClubHeroesVars);

console.log(data.hero);

// Or, you can use the `Promise` API.
insertClubHeroes(insertClubHeroesVars).then((response) => {
  const data = response.data;
  console.log(data.hero);
});
```

### Using `InsertClubHeroes`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertClubHeroesRef, InsertClubHeroesVariables } from '@clubs-platform/dataconnect';

// The `InsertClubHeroes` mutation requires an argument of type `InsertClubHeroesVariables`:
const insertClubHeroesVars: InsertClubHeroesVariables = {
  id: ..., 
  urls: ..., // optional
};

// Call the `insertClubHeroesRef()` function to get a reference to the mutation.
const ref = insertClubHeroesRef(insertClubHeroesVars);
// Variables can be defined inline as well.
const ref = insertClubHeroesRef({ id: ..., urls: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertClubHeroesRef(dataConnect, insertClubHeroesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.hero);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.hero);
});
```

## DeleteGalleryAlbum
You can execute the `DeleteGalleryAlbum` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteGalleryAlbum(vars: DeleteGalleryAlbumVariables): MutationPromise<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;

interface DeleteGalleryAlbumRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGalleryAlbumVariables): MutationRef<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;
}
export const deleteGalleryAlbumRef: DeleteGalleryAlbumRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteGalleryAlbum(dc: DataConnect, vars: DeleteGalleryAlbumVariables): MutationPromise<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;

interface DeleteGalleryAlbumRef {
  ...
  (dc: DataConnect, vars: DeleteGalleryAlbumVariables): MutationRef<DeleteGalleryAlbumData, DeleteGalleryAlbumVariables>;
}
export const deleteGalleryAlbumRef: DeleteGalleryAlbumRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteGalleryAlbumRef:
```typescript
const name = deleteGalleryAlbumRef.operationName;
console.log(name);
```

### Variables
The `DeleteGalleryAlbum` mutation requires an argument of type `DeleteGalleryAlbumVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteGalleryAlbumVariables {
  clubId: string;
  albumName: string;
}
```
### Return Type
Recall that executing the `DeleteGalleryAlbum` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteGalleryAlbumData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteGalleryAlbumData {
  deleted?: number | null;
}
```
### Using `DeleteGalleryAlbum`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteGalleryAlbum, DeleteGalleryAlbumVariables } from '@clubs-platform/dataconnect';

// The `DeleteGalleryAlbum` mutation requires an argument of type `DeleteGalleryAlbumVariables`:
const deleteGalleryAlbumVars: DeleteGalleryAlbumVariables = {
  clubId: ..., 
  albumName: ..., 
};

// Call the `deleteGalleryAlbum()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteGalleryAlbum(deleteGalleryAlbumVars);
// Variables can be defined inline as well.
const { data } = await deleteGalleryAlbum({ clubId: ..., albumName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteGalleryAlbum(dataConnect, deleteGalleryAlbumVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteGalleryAlbum(deleteGalleryAlbumVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteGalleryAlbum`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteGalleryAlbumRef, DeleteGalleryAlbumVariables } from '@clubs-platform/dataconnect';

// The `DeleteGalleryAlbum` mutation requires an argument of type `DeleteGalleryAlbumVariables`:
const deleteGalleryAlbumVars: DeleteGalleryAlbumVariables = {
  clubId: ..., 
  albumName: ..., 
};

// Call the `deleteGalleryAlbumRef()` function to get a reference to the mutation.
const ref = deleteGalleryAlbumRef(deleteGalleryAlbumVars);
// Variables can be defined inline as well.
const ref = deleteGalleryAlbumRef({ clubId: ..., albumName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteGalleryAlbumRef(dataConnect, deleteGalleryAlbumVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## DeleteUnplayedTournament
You can execute the `DeleteUnplayedTournament` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteUnplayedTournament(vars: DeleteUnplayedTournamentVariables): MutationPromise<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;

interface DeleteUnplayedTournamentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUnplayedTournamentVariables): MutationRef<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;
}
export const deleteUnplayedTournamentRef: DeleteUnplayedTournamentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUnplayedTournament(dc: DataConnect, vars: DeleteUnplayedTournamentVariables): MutationPromise<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;

interface DeleteUnplayedTournamentRef {
  ...
  (dc: DataConnect, vars: DeleteUnplayedTournamentVariables): MutationRef<DeleteUnplayedTournamentData, DeleteUnplayedTournamentVariables>;
}
export const deleteUnplayedTournamentRef: DeleteUnplayedTournamentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUnplayedTournamentRef:
```typescript
const name = deleteUnplayedTournamentRef.operationName;
console.log(name);
```

### Variables
The `DeleteUnplayedTournament` mutation requires an argument of type `DeleteUnplayedTournamentVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteUnplayedTournamentVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteUnplayedTournament` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUnplayedTournamentData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUnplayedTournamentData {
  children?: number | null;
  tournament?: unknown | null;
}
```
### Using `DeleteUnplayedTournament`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUnplayedTournament, DeleteUnplayedTournamentVariables } from '@clubs-platform/dataconnect';

// The `DeleteUnplayedTournament` mutation requires an argument of type `DeleteUnplayedTournamentVariables`:
const deleteUnplayedTournamentVars: DeleteUnplayedTournamentVariables = {
  id: ..., 
};

// Call the `deleteUnplayedTournament()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUnplayedTournament(deleteUnplayedTournamentVars);
// Variables can be defined inline as well.
const { data } = await deleteUnplayedTournament({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUnplayedTournament(dataConnect, deleteUnplayedTournamentVars);

console.log(data.children);
console.log(data.tournament);

// Or, you can use the `Promise` API.
deleteUnplayedTournament(deleteUnplayedTournamentVars).then((response) => {
  const data = response.data;
  console.log(data.children);
  console.log(data.tournament);
});
```

### Using `DeleteUnplayedTournament`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUnplayedTournamentRef, DeleteUnplayedTournamentVariables } from '@clubs-platform/dataconnect';

// The `DeleteUnplayedTournament` mutation requires an argument of type `DeleteUnplayedTournamentVariables`:
const deleteUnplayedTournamentVars: DeleteUnplayedTournamentVariables = {
  id: ..., 
};

// Call the `deleteUnplayedTournamentRef()` function to get a reference to the mutation.
const ref = deleteUnplayedTournamentRef(deleteUnplayedTournamentVars);
// Variables can be defined inline as well.
const ref = deleteUnplayedTournamentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUnplayedTournamentRef(dataConnect, deleteUnplayedTournamentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.children);
console.log(data.tournament);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.children);
  console.log(data.tournament);
});
```

## UpdateTournamentSettings
You can execute the `UpdateTournamentSettings` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
updateTournamentSettings(vars: UpdateTournamentSettingsVariables): MutationPromise<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;

interface UpdateTournamentSettingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTournamentSettingsVariables): MutationRef<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;
}
export const updateTournamentSettingsRef: UpdateTournamentSettingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTournamentSettings(dc: DataConnect, vars: UpdateTournamentSettingsVariables): MutationPromise<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;

interface UpdateTournamentSettingsRef {
  ...
  (dc: DataConnect, vars: UpdateTournamentSettingsVariables): MutationRef<UpdateTournamentSettingsData, UpdateTournamentSettingsVariables>;
}
export const updateTournamentSettingsRef: UpdateTournamentSettingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTournamentSettingsRef:
```typescript
const name = updateTournamentSettingsRef.operationName;
console.log(name);
```

### Variables
The `UpdateTournamentSettings` mutation requires an argument of type `UpdateTournamentSettingsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateTournamentSettingsVariables {
  userId?: string;
  id: string;
  legs: number;
  footballType: string;
  durationMinutes: number;
  startDate?: DateString | null;
}
```
### Return Type
Recall that executing the `UpdateTournamentSettings` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTournamentSettingsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `UpdateTournamentSettings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTournamentSettings, UpdateTournamentSettingsVariables } from '@clubs-platform/dataconnect';

// The `UpdateTournamentSettings` mutation requires an argument of type `UpdateTournamentSettingsVariables`:
const updateTournamentSettingsVars: UpdateTournamentSettingsVariables = {
  userId: ..., // optional
  id: ..., 
  legs: ..., 
  footballType: ..., 
  durationMinutes: ..., 
  startDate: ..., // optional
};

// Call the `updateTournamentSettings()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTournamentSettings(updateTournamentSettingsVars);
// Variables can be defined inline as well.
const { data } = await updateTournamentSettings({ userId: ..., id: ..., legs: ..., footballType: ..., durationMinutes: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTournamentSettings(dataConnect, updateTournamentSettingsVars);

console.log(data.query);
console.log(data.tournament);

// Or, you can use the `Promise` API.
updateTournamentSettings(updateTournamentSettingsVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.tournament);
});
```

### Using `UpdateTournamentSettings`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTournamentSettingsRef, UpdateTournamentSettingsVariables } from '@clubs-platform/dataconnect';

// The `UpdateTournamentSettings` mutation requires an argument of type `UpdateTournamentSettingsVariables`:
const updateTournamentSettingsVars: UpdateTournamentSettingsVariables = {
  userId: ..., // optional
  id: ..., 
  legs: ..., 
  footballType: ..., 
  durationMinutes: ..., 
  startDate: ..., // optional
};

// Call the `updateTournamentSettingsRef()` function to get a reference to the mutation.
const ref = updateTournamentSettingsRef(updateTournamentSettingsVars);
// Variables can be defined inline as well.
const ref = updateTournamentSettingsRef({ userId: ..., id: ..., legs: ..., footballType: ..., durationMinutes: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTournamentSettingsRef(dataConnect, updateTournamentSettingsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.tournament);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.tournament);
});
```

## AddTournamentClub
You can execute the `AddTournamentClub` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
addTournamentClub(vars: AddTournamentClubVariables): MutationPromise<AddTournamentClubData, AddTournamentClubVariables>;

interface AddTournamentClubRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddTournamentClubVariables): MutationRef<AddTournamentClubData, AddTournamentClubVariables>;
}
export const addTournamentClubRef: AddTournamentClubRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addTournamentClub(dc: DataConnect, vars: AddTournamentClubVariables): MutationPromise<AddTournamentClubData, AddTournamentClubVariables>;

interface AddTournamentClubRef {
  ...
  (dc: DataConnect, vars: AddTournamentClubVariables): MutationRef<AddTournamentClubData, AddTournamentClubVariables>;
}
export const addTournamentClubRef: AddTournamentClubRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addTournamentClubRef:
```typescript
const name = addTournamentClubRef.operationName;
console.log(name);
```

### Variables
The `AddTournamentClub` mutation requires an argument of type `AddTournamentClubVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddTournamentClubVariables {
  userId?: string;
  tournamentId: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `AddTournamentClub` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddTournamentClubData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `AddTournamentClub`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addTournamentClub, AddTournamentClubVariables } from '@clubs-platform/dataconnect';

// The `AddTournamentClub` mutation requires an argument of type `AddTournamentClubVariables`:
const addTournamentClubVars: AddTournamentClubVariables = {
  userId: ..., // optional
  tournamentId: ..., 
  clubId: ..., 
};

// Call the `addTournamentClub()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addTournamentClub(addTournamentClubVars);
// Variables can be defined inline as well.
const { data } = await addTournamentClub({ userId: ..., tournamentId: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addTournamentClub(dataConnect, addTournamentClubVars);

console.log(data.query);
console.log(data.row);

// Or, you can use the `Promise` API.
addTournamentClub(addTournamentClubVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.row);
});
```

### Using `AddTournamentClub`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addTournamentClubRef, AddTournamentClubVariables } from '@clubs-platform/dataconnect';

// The `AddTournamentClub` mutation requires an argument of type `AddTournamentClubVariables`:
const addTournamentClubVars: AddTournamentClubVariables = {
  userId: ..., // optional
  tournamentId: ..., 
  clubId: ..., 
};

// Call the `addTournamentClubRef()` function to get a reference to the mutation.
const ref = addTournamentClubRef(addTournamentClubVars);
// Variables can be defined inline as well.
const ref = addTournamentClubRef({ userId: ..., tournamentId: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addTournamentClubRef(dataConnect, addTournamentClubVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.row);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.row);
});
```

## RemoveTournamentClub
You can execute the `RemoveTournamentClub` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
removeTournamentClub(vars: RemoveTournamentClubVariables): MutationPromise<RemoveTournamentClubData, RemoveTournamentClubVariables>;

interface RemoveTournamentClubRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveTournamentClubVariables): MutationRef<RemoveTournamentClubData, RemoveTournamentClubVariables>;
}
export const removeTournamentClubRef: RemoveTournamentClubRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removeTournamentClub(dc: DataConnect, vars: RemoveTournamentClubVariables): MutationPromise<RemoveTournamentClubData, RemoveTournamentClubVariables>;

interface RemoveTournamentClubRef {
  ...
  (dc: DataConnect, vars: RemoveTournamentClubVariables): MutationRef<RemoveTournamentClubData, RemoveTournamentClubVariables>;
}
export const removeTournamentClubRef: RemoveTournamentClubRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removeTournamentClubRef:
```typescript
const name = removeTournamentClubRef.operationName;
console.log(name);
```

### Variables
The `RemoveTournamentClub` mutation requires an argument of type `RemoveTournamentClubVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemoveTournamentClubVariables {
  userId?: string;
  tournamentId: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `RemoveTournamentClub` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemoveTournamentClubData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `RemoveTournamentClub`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removeTournamentClub, RemoveTournamentClubVariables } from '@clubs-platform/dataconnect';

// The `RemoveTournamentClub` mutation requires an argument of type `RemoveTournamentClubVariables`:
const removeTournamentClubVars: RemoveTournamentClubVariables = {
  userId: ..., // optional
  tournamentId: ..., 
  clubId: ..., 
};

// Call the `removeTournamentClub()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removeTournamentClub(removeTournamentClubVars);
// Variables can be defined inline as well.
const { data } = await removeTournamentClub({ userId: ..., tournamentId: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removeTournamentClub(dataConnect, removeTournamentClubVars);

console.log(data.query);
console.log(data.row);

// Or, you can use the `Promise` API.
removeTournamentClub(removeTournamentClubVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.row);
});
```

### Using `RemoveTournamentClub`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removeTournamentClubRef, RemoveTournamentClubVariables } from '@clubs-platform/dataconnect';

// The `RemoveTournamentClub` mutation requires an argument of type `RemoveTournamentClubVariables`:
const removeTournamentClubVars: RemoveTournamentClubVariables = {
  userId: ..., // optional
  tournamentId: ..., 
  clubId: ..., 
};

// Call the `removeTournamentClubRef()` function to get a reference to the mutation.
const ref = removeTournamentClubRef(removeTournamentClubVars);
// Variables can be defined inline as well.
const ref = removeTournamentClubRef({ userId: ..., tournamentId: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removeTournamentClubRef(dataConnect, removeTournamentClubVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.row);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.row);
});
```

## InsertUnplayedMatch
You can execute the `InsertUnplayedMatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
insertUnplayedMatch(vars: InsertUnplayedMatchVariables): MutationPromise<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;

interface InsertUnplayedMatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertUnplayedMatchVariables): MutationRef<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;
}
export const insertUnplayedMatchRef: InsertUnplayedMatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertUnplayedMatch(dc: DataConnect, vars: InsertUnplayedMatchVariables): MutationPromise<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;

interface InsertUnplayedMatchRef {
  ...
  (dc: DataConnect, vars: InsertUnplayedMatchVariables): MutationRef<InsertUnplayedMatchData, InsertUnplayedMatchVariables>;
}
export const insertUnplayedMatchRef: InsertUnplayedMatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertUnplayedMatchRef:
```typescript
const name = insertUnplayedMatchRef.operationName;
console.log(name);
```

### Variables
The `InsertUnplayedMatch` mutation requires an argument of type `InsertUnplayedMatchVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertUnplayedMatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertUnplayedMatchData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `InsertUnplayedMatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertUnplayedMatch, InsertUnplayedMatchVariables } from '@clubs-platform/dataconnect';

// The `InsertUnplayedMatch` mutation requires an argument of type `InsertUnplayedMatchVariables`:
const insertUnplayedMatchVars: InsertUnplayedMatchVariables = {
  userId: ..., // optional
  id: ..., 
  tournamentId: ..., 
  roundLabel: ..., 
  roundNumber: ..., 
  homeClubId: ..., 
  awayClubId: ..., 
  status: ..., // optional
  walkover: ..., 
};

// Call the `insertUnplayedMatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertUnplayedMatch(insertUnplayedMatchVars);
// Variables can be defined inline as well.
const { data } = await insertUnplayedMatch({ userId: ..., id: ..., tournamentId: ..., roundLabel: ..., roundNumber: ..., homeClubId: ..., awayClubId: ..., status: ..., walkover: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertUnplayedMatch(dataConnect, insertUnplayedMatchVars);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
insertUnplayedMatch(insertUnplayedMatchVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

### Using `InsertUnplayedMatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertUnplayedMatchRef, InsertUnplayedMatchVariables } from '@clubs-platform/dataconnect';

// The `InsertUnplayedMatch` mutation requires an argument of type `InsertUnplayedMatchVariables`:
const insertUnplayedMatchVars: InsertUnplayedMatchVariables = {
  userId: ..., // optional
  id: ..., 
  tournamentId: ..., 
  roundLabel: ..., 
  roundNumber: ..., 
  homeClubId: ..., 
  awayClubId: ..., 
  status: ..., // optional
  walkover: ..., 
};

// Call the `insertUnplayedMatchRef()` function to get a reference to the mutation.
const ref = insertUnplayedMatchRef(insertUnplayedMatchVars);
// Variables can be defined inline as well.
const ref = insertUnplayedMatchRef({ userId: ..., id: ..., tournamentId: ..., roundLabel: ..., roundNumber: ..., homeClubId: ..., awayClubId: ..., status: ..., walkover: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertUnplayedMatchRef(dataConnect, insertUnplayedMatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

## MarkMatchWalkover
You can execute the `MarkMatchWalkover` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
markMatchWalkover(vars: MarkMatchWalkoverVariables): MutationPromise<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;

interface MarkMatchWalkoverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkMatchWalkoverVariables): MutationRef<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;
}
export const markMatchWalkoverRef: MarkMatchWalkoverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
markMatchWalkover(dc: DataConnect, vars: MarkMatchWalkoverVariables): MutationPromise<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;

interface MarkMatchWalkoverRef {
  ...
  (dc: DataConnect, vars: MarkMatchWalkoverVariables): MutationRef<MarkMatchWalkoverData, MarkMatchWalkoverVariables>;
}
export const markMatchWalkoverRef: MarkMatchWalkoverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the markMatchWalkoverRef:
```typescript
const name = markMatchWalkoverRef.operationName;
console.log(name);
```

### Variables
The `MarkMatchWalkover` mutation requires an argument of type `MarkMatchWalkoverVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MarkMatchWalkoverVariables {
  userId?: string;
  id: string;
  homeScore: number;
  awayScore: number;
  walkover: boolean;
}
```
### Return Type
Recall that executing the `MarkMatchWalkover` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MarkMatchWalkoverData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `MarkMatchWalkover`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, markMatchWalkover, MarkMatchWalkoverVariables } from '@clubs-platform/dataconnect';

// The `MarkMatchWalkover` mutation requires an argument of type `MarkMatchWalkoverVariables`:
const markMatchWalkoverVars: MarkMatchWalkoverVariables = {
  userId: ..., // optional
  id: ..., 
  homeScore: ..., 
  awayScore: ..., 
  walkover: ..., 
};

// Call the `markMatchWalkover()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await markMatchWalkover(markMatchWalkoverVars);
// Variables can be defined inline as well.
const { data } = await markMatchWalkover({ userId: ..., id: ..., homeScore: ..., awayScore: ..., walkover: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await markMatchWalkover(dataConnect, markMatchWalkoverVars);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
markMatchWalkover(markMatchWalkoverVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

### Using `MarkMatchWalkover`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, markMatchWalkoverRef, MarkMatchWalkoverVariables } from '@clubs-platform/dataconnect';

// The `MarkMatchWalkover` mutation requires an argument of type `MarkMatchWalkoverVariables`:
const markMatchWalkoverVars: MarkMatchWalkoverVariables = {
  userId: ..., // optional
  id: ..., 
  homeScore: ..., 
  awayScore: ..., 
  walkover: ..., 
};

// Call the `markMatchWalkoverRef()` function to get a reference to the mutation.
const ref = markMatchWalkoverRef(markMatchWalkoverVars);
// Variables can be defined inline as well.
const ref = markMatchWalkoverRef({ userId: ..., id: ..., homeScore: ..., awayScore: ..., walkover: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = markMatchWalkoverRef(dataConnect, markMatchWalkoverVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

## DeleteUnplayedMatch
You can execute the `DeleteUnplayedMatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteUnplayedMatch(vars: DeleteUnplayedMatchVariables): MutationPromise<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;

interface DeleteUnplayedMatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUnplayedMatchVariables): MutationRef<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;
}
export const deleteUnplayedMatchRef: DeleteUnplayedMatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUnplayedMatch(dc: DataConnect, vars: DeleteUnplayedMatchVariables): MutationPromise<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;

interface DeleteUnplayedMatchRef {
  ...
  (dc: DataConnect, vars: DeleteUnplayedMatchVariables): MutationRef<DeleteUnplayedMatchData, DeleteUnplayedMatchVariables>;
}
export const deleteUnplayedMatchRef: DeleteUnplayedMatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUnplayedMatchRef:
```typescript
const name = deleteUnplayedMatchRef.operationName;
console.log(name);
```

### Variables
The `DeleteUnplayedMatch` mutation requires an argument of type `DeleteUnplayedMatchVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteUnplayedMatchVariables {
  userId?: string;
  id: string;
}
```
### Return Type
Recall that executing the `DeleteUnplayedMatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUnplayedMatchData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `DeleteUnplayedMatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUnplayedMatch, DeleteUnplayedMatchVariables } from '@clubs-platform/dataconnect';

// The `DeleteUnplayedMatch` mutation requires an argument of type `DeleteUnplayedMatchVariables`:
const deleteUnplayedMatchVars: DeleteUnplayedMatchVariables = {
  userId: ..., // optional
  id: ..., 
};

// Call the `deleteUnplayedMatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUnplayedMatch(deleteUnplayedMatchVars);
// Variables can be defined inline as well.
const { data } = await deleteUnplayedMatch({ userId: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUnplayedMatch(dataConnect, deleteUnplayedMatchVars);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
deleteUnplayedMatch(deleteUnplayedMatchVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

### Using `DeleteUnplayedMatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUnplayedMatchRef, DeleteUnplayedMatchVariables } from '@clubs-platform/dataconnect';

// The `DeleteUnplayedMatch` mutation requires an argument of type `DeleteUnplayedMatchVariables`:
const deleteUnplayedMatchVars: DeleteUnplayedMatchVariables = {
  userId: ..., // optional
  id: ..., 
};

// Call the `deleteUnplayedMatchRef()` function to get a reference to the mutation.
const ref = deleteUnplayedMatchRef(deleteUnplayedMatchVars);
// Variables can be defined inline as well.
const ref = deleteUnplayedMatchRef({ userId: ..., id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUnplayedMatchRef(dataConnect, deleteUnplayedMatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

## SaveClubProfile
You can execute the `SaveClubProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveClubProfile(vars: SaveClubProfileVariables): MutationPromise<SaveClubProfileData, SaveClubProfileVariables>;

interface SaveClubProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubProfileVariables): MutationRef<SaveClubProfileData, SaveClubProfileVariables>;
}
export const saveClubProfileRef: SaveClubProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveClubProfile(dc: DataConnect, vars: SaveClubProfileVariables): MutationPromise<SaveClubProfileData, SaveClubProfileVariables>;

interface SaveClubProfileRef {
  ...
  (dc: DataConnect, vars: SaveClubProfileVariables): MutationRef<SaveClubProfileData, SaveClubProfileVariables>;
}
export const saveClubProfileRef: SaveClubProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveClubProfileRef:
```typescript
const name = saveClubProfileRef.operationName;
console.log(name);
```

### Variables
The `SaveClubProfile` mutation requires an argument of type `SaveClubProfileVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveClubProfileVariables {
  id: string;
  name: string;
  logoUrl: string;
  presidentPhone: string;
}
```
### Return Type
Recall that executing the `SaveClubProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveClubProfileData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveClubProfileData {
  club?: unknown | null;
}
```
### Using `SaveClubProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveClubProfile, SaveClubProfileVariables } from '@clubs-platform/dataconnect';

// The `SaveClubProfile` mutation requires an argument of type `SaveClubProfileVariables`:
const saveClubProfileVars: SaveClubProfileVariables = {
  id: ..., 
  name: ..., 
  logoUrl: ..., 
  presidentPhone: ..., 
};

// Call the `saveClubProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveClubProfile(saveClubProfileVars);
// Variables can be defined inline as well.
const { data } = await saveClubProfile({ id: ..., name: ..., logoUrl: ..., presidentPhone: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveClubProfile(dataConnect, saveClubProfileVars);

console.log(data.club);

// Or, you can use the `Promise` API.
saveClubProfile(saveClubProfileVars).then((response) => {
  const data = response.data;
  console.log(data.club);
});
```

### Using `SaveClubProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveClubProfileRef, SaveClubProfileVariables } from '@clubs-platform/dataconnect';

// The `SaveClubProfile` mutation requires an argument of type `SaveClubProfileVariables`:
const saveClubProfileVars: SaveClubProfileVariables = {
  id: ..., 
  name: ..., 
  logoUrl: ..., 
  presidentPhone: ..., 
};

// Call the `saveClubProfileRef()` function to get a reference to the mutation.
const ref = saveClubProfileRef(saveClubProfileVars);
// Variables can be defined inline as well.
const ref = saveClubProfileRef({ id: ..., name: ..., logoUrl: ..., presidentPhone: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveClubProfileRef(dataConnect, saveClubProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.club);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.club);
});
```

## ScheduleOfficialMatch
You can execute the `ScheduleOfficialMatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
scheduleOfficialMatch(vars: ScheduleOfficialMatchVariables): MutationPromise<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;

interface ScheduleOfficialMatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ScheduleOfficialMatchVariables): MutationRef<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;
}
export const scheduleOfficialMatchRef: ScheduleOfficialMatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
scheduleOfficialMatch(dc: DataConnect, vars: ScheduleOfficialMatchVariables): MutationPromise<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;

interface ScheduleOfficialMatchRef {
  ...
  (dc: DataConnect, vars: ScheduleOfficialMatchVariables): MutationRef<ScheduleOfficialMatchData, ScheduleOfficialMatchVariables>;
}
export const scheduleOfficialMatchRef: ScheduleOfficialMatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the scheduleOfficialMatchRef:
```typescript
const name = scheduleOfficialMatchRef.operationName;
console.log(name);
```

### Variables
The `ScheduleOfficialMatch` mutation requires an argument of type `ScheduleOfficialMatchVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ScheduleOfficialMatchVariables {
  id: string;
  matchDate: DateString;
  startTime: string;
  venue: string;
  courtId?: string | null;
}
```
### Return Type
Recall that executing the `ScheduleOfficialMatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ScheduleOfficialMatchData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ScheduleOfficialMatchData {
  match?: unknown | null;
}
```
### Using `ScheduleOfficialMatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, scheduleOfficialMatch, ScheduleOfficialMatchVariables } from '@clubs-platform/dataconnect';

// The `ScheduleOfficialMatch` mutation requires an argument of type `ScheduleOfficialMatchVariables`:
const scheduleOfficialMatchVars: ScheduleOfficialMatchVariables = {
  id: ..., 
  matchDate: ..., 
  startTime: ..., 
  venue: ..., 
  courtId: ..., // optional
};

// Call the `scheduleOfficialMatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await scheduleOfficialMatch(scheduleOfficialMatchVars);
// Variables can be defined inline as well.
const { data } = await scheduleOfficialMatch({ id: ..., matchDate: ..., startTime: ..., venue: ..., courtId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await scheduleOfficialMatch(dataConnect, scheduleOfficialMatchVars);

console.log(data.match);

// Or, you can use the `Promise` API.
scheduleOfficialMatch(scheduleOfficialMatchVars).then((response) => {
  const data = response.data;
  console.log(data.match);
});
```

### Using `ScheduleOfficialMatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, scheduleOfficialMatchRef, ScheduleOfficialMatchVariables } from '@clubs-platform/dataconnect';

// The `ScheduleOfficialMatch` mutation requires an argument of type `ScheduleOfficialMatchVariables`:
const scheduleOfficialMatchVars: ScheduleOfficialMatchVariables = {
  id: ..., 
  matchDate: ..., 
  startTime: ..., 
  venue: ..., 
  courtId: ..., // optional
};

// Call the `scheduleOfficialMatchRef()` function to get a reference to the mutation.
const ref = scheduleOfficialMatchRef(scheduleOfficialMatchVars);
// Variables can be defined inline as well.
const ref = scheduleOfficialMatchRef({ id: ..., matchDate: ..., startTime: ..., venue: ..., courtId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = scheduleOfficialMatchRef(dataConnect, scheduleOfficialMatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.match);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.match);
});
```

## ClearMatchCourtHolds
You can execute the `ClearMatchCourtHolds` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearMatchCourtHolds(vars: ClearMatchCourtHoldsVariables): MutationPromise<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;

interface ClearMatchCourtHoldsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearMatchCourtHoldsVariables): MutationRef<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;
}
export const clearMatchCourtHoldsRef: ClearMatchCourtHoldsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearMatchCourtHolds(dc: DataConnect, vars: ClearMatchCourtHoldsVariables): MutationPromise<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;

interface ClearMatchCourtHoldsRef {
  ...
  (dc: DataConnect, vars: ClearMatchCourtHoldsVariables): MutationRef<ClearMatchCourtHoldsData, ClearMatchCourtHoldsVariables>;
}
export const clearMatchCourtHoldsRef: ClearMatchCourtHoldsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearMatchCourtHoldsRef:
```typescript
const name = clearMatchCourtHoldsRef.operationName;
console.log(name);
```

### Variables
The `ClearMatchCourtHolds` mutation requires an argument of type `ClearMatchCourtHoldsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearMatchCourtHoldsVariables {
  userId?: string;
  matchId: string;
}
```
### Return Type
Recall that executing the `ClearMatchCourtHolds` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearMatchCourtHoldsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClearMatchCourtHolds`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearMatchCourtHolds, ClearMatchCourtHoldsVariables } from '@clubs-platform/dataconnect';

// The `ClearMatchCourtHolds` mutation requires an argument of type `ClearMatchCourtHoldsVariables`:
const clearMatchCourtHoldsVars: ClearMatchCourtHoldsVariables = {
  userId: ..., // optional
  matchId: ..., 
};

// Call the `clearMatchCourtHolds()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearMatchCourtHolds(clearMatchCourtHoldsVars);
// Variables can be defined inline as well.
const { data } = await clearMatchCourtHolds({ userId: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearMatchCourtHolds(dataConnect, clearMatchCourtHoldsVars);

console.log(data.query);
console.log(data.cleared);

// Or, you can use the `Promise` API.
clearMatchCourtHolds(clearMatchCourtHoldsVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.cleared);
});
```

### Using `ClearMatchCourtHolds`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearMatchCourtHoldsRef, ClearMatchCourtHoldsVariables } from '@clubs-platform/dataconnect';

// The `ClearMatchCourtHolds` mutation requires an argument of type `ClearMatchCourtHoldsVariables`:
const clearMatchCourtHoldsVars: ClearMatchCourtHoldsVariables = {
  userId: ..., // optional
  matchId: ..., 
};

// Call the `clearMatchCourtHoldsRef()` function to get a reference to the mutation.
const ref = clearMatchCourtHoldsRef(clearMatchCourtHoldsVars);
// Variables can be defined inline as well.
const ref = clearMatchCourtHoldsRef({ userId: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearMatchCourtHoldsRef(dataConnect, clearMatchCourtHoldsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.cleared);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.cleared);
});
```

## SaveMatchCourtHold
You can execute the `SaveMatchCourtHold` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveMatchCourtHold(vars: SaveMatchCourtHoldVariables): MutationPromise<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;

interface SaveMatchCourtHoldRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveMatchCourtHoldVariables): MutationRef<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;
}
export const saveMatchCourtHoldRef: SaveMatchCourtHoldRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveMatchCourtHold(dc: DataConnect, vars: SaveMatchCourtHoldVariables): MutationPromise<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;

interface SaveMatchCourtHoldRef {
  ...
  (dc: DataConnect, vars: SaveMatchCourtHoldVariables): MutationRef<SaveMatchCourtHoldData, SaveMatchCourtHoldVariables>;
}
export const saveMatchCourtHoldRef: SaveMatchCourtHoldRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveMatchCourtHoldRef:
```typescript
const name = saveMatchCourtHoldRef.operationName;
console.log(name);
```

### Variables
The `SaveMatchCourtHold` mutation requires an argument of type `SaveMatchCourtHoldVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveMatchCourtHoldVariables {
  userId?: string;
  id: string;
  courtId: string;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  matchId: string;
}
```
### Return Type
Recall that executing the `SaveMatchCourtHold` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveMatchCourtHoldData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SaveMatchCourtHold`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveMatchCourtHold, SaveMatchCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `SaveMatchCourtHold` mutation requires an argument of type `SaveMatchCourtHoldVariables`:
const saveMatchCourtHoldVars: SaveMatchCourtHoldVariables = {
  userId: ..., // optional
  id: ..., 
  courtId: ..., 
  holdDate: ..., 
  startTime: ..., 
  endTime: ..., 
  matchId: ..., 
};

// Call the `saveMatchCourtHold()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveMatchCourtHold(saveMatchCourtHoldVars);
// Variables can be defined inline as well.
const { data } = await saveMatchCourtHold({ userId: ..., id: ..., courtId: ..., holdDate: ..., startTime: ..., endTime: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveMatchCourtHold(dataConnect, saveMatchCourtHoldVars);

console.log(data.query);
console.log(data.courtHold);

// Or, you can use the `Promise` API.
saveMatchCourtHold(saveMatchCourtHoldVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.courtHold);
});
```

### Using `SaveMatchCourtHold`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveMatchCourtHoldRef, SaveMatchCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `SaveMatchCourtHold` mutation requires an argument of type `SaveMatchCourtHoldVariables`:
const saveMatchCourtHoldVars: SaveMatchCourtHoldVariables = {
  userId: ..., // optional
  id: ..., 
  courtId: ..., 
  holdDate: ..., 
  startTime: ..., 
  endTime: ..., 
  matchId: ..., 
};

// Call the `saveMatchCourtHoldRef()` function to get a reference to the mutation.
const ref = saveMatchCourtHoldRef(saveMatchCourtHoldVars);
// Variables can be defined inline as well.
const ref = saveMatchCourtHoldRef({ userId: ..., id: ..., courtId: ..., holdDate: ..., startTime: ..., endTime: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveMatchCourtHoldRef(dataConnect, saveMatchCourtHoldVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.courtHold);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.courtHold);
});
```

## SaveMatchScore
You can execute the `SaveMatchScore` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveMatchScore(vars: SaveMatchScoreVariables): MutationPromise<SaveMatchScoreData, SaveMatchScoreVariables>;

interface SaveMatchScoreRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveMatchScoreVariables): MutationRef<SaveMatchScoreData, SaveMatchScoreVariables>;
}
export const saveMatchScoreRef: SaveMatchScoreRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveMatchScore(dc: DataConnect, vars: SaveMatchScoreVariables): MutationPromise<SaveMatchScoreData, SaveMatchScoreVariables>;

interface SaveMatchScoreRef {
  ...
  (dc: DataConnect, vars: SaveMatchScoreVariables): MutationRef<SaveMatchScoreData, SaveMatchScoreVariables>;
}
export const saveMatchScoreRef: SaveMatchScoreRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveMatchScoreRef:
```typescript
const name = saveMatchScoreRef.operationName;
console.log(name);
```

### Variables
The `SaveMatchScore` mutation requires an argument of type `SaveMatchScoreVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveMatchScoreVariables {
  userId?: string;
  id: string;
  homeScore: number;
  awayScore: number;
  walkover?: boolean;
}
```
### Return Type
Recall that executing the `SaveMatchScore` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveMatchScoreData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SaveMatchScore`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveMatchScore, SaveMatchScoreVariables } from '@clubs-platform/dataconnect';

// The `SaveMatchScore` mutation requires an argument of type `SaveMatchScoreVariables`:
const saveMatchScoreVars: SaveMatchScoreVariables = {
  userId: ..., // optional
  id: ..., 
  homeScore: ..., 
  awayScore: ..., 
  walkover: ..., // optional
};

// Call the `saveMatchScore()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveMatchScore(saveMatchScoreVars);
// Variables can be defined inline as well.
const { data } = await saveMatchScore({ userId: ..., id: ..., homeScore: ..., awayScore: ..., walkover: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveMatchScore(dataConnect, saveMatchScoreVars);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
saveMatchScore(saveMatchScoreVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

### Using `SaveMatchScore`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveMatchScoreRef, SaveMatchScoreVariables } from '@clubs-platform/dataconnect';

// The `SaveMatchScore` mutation requires an argument of type `SaveMatchScoreVariables`:
const saveMatchScoreVars: SaveMatchScoreVariables = {
  userId: ..., // optional
  id: ..., 
  homeScore: ..., 
  awayScore: ..., 
  walkover: ..., // optional
};

// Call the `saveMatchScoreRef()` function to get a reference to the mutation.
const ref = saveMatchScoreRef(saveMatchScoreVars);
// Variables can be defined inline as well.
const ref = saveMatchScoreRef({ userId: ..., id: ..., homeScore: ..., awayScore: ..., walkover: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveMatchScoreRef(dataConnect, saveMatchScoreVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.match);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.match);
});
```

## ClearMatchEvents
You can execute the `ClearMatchEvents` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
clearMatchEvents(vars: ClearMatchEventsVariables): MutationPromise<ClearMatchEventsData, ClearMatchEventsVariables>;

interface ClearMatchEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClearMatchEventsVariables): MutationRef<ClearMatchEventsData, ClearMatchEventsVariables>;
}
export const clearMatchEventsRef: ClearMatchEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearMatchEvents(dc: DataConnect, vars: ClearMatchEventsVariables): MutationPromise<ClearMatchEventsData, ClearMatchEventsVariables>;

interface ClearMatchEventsRef {
  ...
  (dc: DataConnect, vars: ClearMatchEventsVariables): MutationRef<ClearMatchEventsData, ClearMatchEventsVariables>;
}
export const clearMatchEventsRef: ClearMatchEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearMatchEventsRef:
```typescript
const name = clearMatchEventsRef.operationName;
console.log(name);
```

### Variables
The `ClearMatchEvents` mutation requires an argument of type `ClearMatchEventsVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClearMatchEventsVariables {
  userId?: string;
  matchId: string;
}
```
### Return Type
Recall that executing the `ClearMatchEvents` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearMatchEventsData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ClearMatchEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearMatchEvents, ClearMatchEventsVariables } from '@clubs-platform/dataconnect';

// The `ClearMatchEvents` mutation requires an argument of type `ClearMatchEventsVariables`:
const clearMatchEventsVars: ClearMatchEventsVariables = {
  userId: ..., // optional
  matchId: ..., 
};

// Call the `clearMatchEvents()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearMatchEvents(clearMatchEventsVars);
// Variables can be defined inline as well.
const { data } = await clearMatchEvents({ userId: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearMatchEvents(dataConnect, clearMatchEventsVars);

console.log(data.query);
console.log(data.goals);
console.log(data.cards);

// Or, you can use the `Promise` API.
clearMatchEvents(clearMatchEventsVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.goals);
  console.log(data.cards);
});
```

### Using `ClearMatchEvents`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearMatchEventsRef, ClearMatchEventsVariables } from '@clubs-platform/dataconnect';

// The `ClearMatchEvents` mutation requires an argument of type `ClearMatchEventsVariables`:
const clearMatchEventsVars: ClearMatchEventsVariables = {
  userId: ..., // optional
  matchId: ..., 
};

// Call the `clearMatchEventsRef()` function to get a reference to the mutation.
const ref = clearMatchEventsRef(clearMatchEventsVars);
// Variables can be defined inline as well.
const ref = clearMatchEventsRef({ userId: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearMatchEventsRef(dataConnect, clearMatchEventsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.goals);
console.log(data.cards);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.goals);
  console.log(data.cards);
});
```

## ActivateTournament
You can execute the `ActivateTournament` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
activateTournament(vars: ActivateTournamentVariables): MutationPromise<ActivateTournamentData, ActivateTournamentVariables>;

interface ActivateTournamentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ActivateTournamentVariables): MutationRef<ActivateTournamentData, ActivateTournamentVariables>;
}
export const activateTournamentRef: ActivateTournamentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
activateTournament(dc: DataConnect, vars: ActivateTournamentVariables): MutationPromise<ActivateTournamentData, ActivateTournamentVariables>;

interface ActivateTournamentRef {
  ...
  (dc: DataConnect, vars: ActivateTournamentVariables): MutationRef<ActivateTournamentData, ActivateTournamentVariables>;
}
export const activateTournamentRef: ActivateTournamentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the activateTournamentRef:
```typescript
const name = activateTournamentRef.operationName;
console.log(name);
```

### Variables
The `ActivateTournament` mutation requires an argument of type `ActivateTournamentVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ActivateTournamentVariables {
  userId?: string;
  matchId: string;
}
```
### Return Type
Recall that executing the `ActivateTournament` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ActivateTournamentData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ActivateTournament`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, activateTournament, ActivateTournamentVariables } from '@clubs-platform/dataconnect';

// The `ActivateTournament` mutation requires an argument of type `ActivateTournamentVariables`:
const activateTournamentVars: ActivateTournamentVariables = {
  userId: ..., // optional
  matchId: ..., 
};

// Call the `activateTournament()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await activateTournament(activateTournamentVars);
// Variables can be defined inline as well.
const { data } = await activateTournament({ userId: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await activateTournament(dataConnect, activateTournamentVars);

console.log(data.query);
console.log(data.tournament);

// Or, you can use the `Promise` API.
activateTournament(activateTournamentVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.tournament);
});
```

### Using `ActivateTournament`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, activateTournamentRef, ActivateTournamentVariables } from '@clubs-platform/dataconnect';

// The `ActivateTournament` mutation requires an argument of type `ActivateTournamentVariables`:
const activateTournamentVars: ActivateTournamentVariables = {
  userId: ..., // optional
  matchId: ..., 
};

// Call the `activateTournamentRef()` function to get a reference to the mutation.
const ref = activateTournamentRef(activateTournamentVars);
// Variables can be defined inline as well.
const ref = activateTournamentRef({ userId: ..., matchId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = activateTournamentRef(dataConnect, activateTournamentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.tournament);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.tournament);
});
```

## InsertMatchGoal
You can execute the `InsertMatchGoal` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
insertMatchGoal(vars: InsertMatchGoalVariables): MutationPromise<InsertMatchGoalData, InsertMatchGoalVariables>;

interface InsertMatchGoalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertMatchGoalVariables): MutationRef<InsertMatchGoalData, InsertMatchGoalVariables>;
}
export const insertMatchGoalRef: InsertMatchGoalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertMatchGoal(dc: DataConnect, vars: InsertMatchGoalVariables): MutationPromise<InsertMatchGoalData, InsertMatchGoalVariables>;

interface InsertMatchGoalRef {
  ...
  (dc: DataConnect, vars: InsertMatchGoalVariables): MutationRef<InsertMatchGoalData, InsertMatchGoalVariables>;
}
export const insertMatchGoalRef: InsertMatchGoalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertMatchGoalRef:
```typescript
const name = insertMatchGoalRef.operationName;
console.log(name);
```

### Variables
The `InsertMatchGoal` mutation requires an argument of type `InsertMatchGoalVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertMatchGoal` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertMatchGoalData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `InsertMatchGoal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertMatchGoal, InsertMatchGoalVariables } from '@clubs-platform/dataconnect';

// The `InsertMatchGoal` mutation requires an argument of type `InsertMatchGoalVariables`:
const insertMatchGoalVars: InsertMatchGoalVariables = {
  userId: ..., // optional
  matchId: ..., 
  clubId: ..., 
  sortOrder: ..., 
  scorerId: ..., 
  scorerName: ..., 
  assistId: ..., 
  assistName: ..., 
  isPenalty: ..., 
  isOwnGoal: ..., 
};

// Call the `insertMatchGoal()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertMatchGoal(insertMatchGoalVars);
// Variables can be defined inline as well.
const { data } = await insertMatchGoal({ userId: ..., matchId: ..., clubId: ..., sortOrder: ..., scorerId: ..., scorerName: ..., assistId: ..., assistName: ..., isPenalty: ..., isOwnGoal: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertMatchGoal(dataConnect, insertMatchGoalVars);

console.log(data.query);
console.log(data.goal);

// Or, you can use the `Promise` API.
insertMatchGoal(insertMatchGoalVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.goal);
});
```

### Using `InsertMatchGoal`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertMatchGoalRef, InsertMatchGoalVariables } from '@clubs-platform/dataconnect';

// The `InsertMatchGoal` mutation requires an argument of type `InsertMatchGoalVariables`:
const insertMatchGoalVars: InsertMatchGoalVariables = {
  userId: ..., // optional
  matchId: ..., 
  clubId: ..., 
  sortOrder: ..., 
  scorerId: ..., 
  scorerName: ..., 
  assistId: ..., 
  assistName: ..., 
  isPenalty: ..., 
  isOwnGoal: ..., 
};

// Call the `insertMatchGoalRef()` function to get a reference to the mutation.
const ref = insertMatchGoalRef(insertMatchGoalVars);
// Variables can be defined inline as well.
const ref = insertMatchGoalRef({ userId: ..., matchId: ..., clubId: ..., sortOrder: ..., scorerId: ..., scorerName: ..., assistId: ..., assistName: ..., isPenalty: ..., isOwnGoal: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertMatchGoalRef(dataConnect, insertMatchGoalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.goal);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.goal);
});
```

## InsertMatchCard
You can execute the `InsertMatchCard` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
insertMatchCard(vars: InsertMatchCardVariables): MutationPromise<InsertMatchCardData, InsertMatchCardVariables>;

interface InsertMatchCardRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertMatchCardVariables): MutationRef<InsertMatchCardData, InsertMatchCardVariables>;
}
export const insertMatchCardRef: InsertMatchCardRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertMatchCard(dc: DataConnect, vars: InsertMatchCardVariables): MutationPromise<InsertMatchCardData, InsertMatchCardVariables>;

interface InsertMatchCardRef {
  ...
  (dc: DataConnect, vars: InsertMatchCardVariables): MutationRef<InsertMatchCardData, InsertMatchCardVariables>;
}
export const insertMatchCardRef: InsertMatchCardRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertMatchCardRef:
```typescript
const name = insertMatchCardRef.operationName;
console.log(name);
```

### Variables
The `InsertMatchCard` mutation requires an argument of type `InsertMatchCardVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertMatchCardVariables {
  userId?: string;
  matchId: string;
  clubId: string;
  playerId: string;
  playerName: string;
  color: string;
}
```
### Return Type
Recall that executing the `InsertMatchCard` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertMatchCardData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `InsertMatchCard`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertMatchCard, InsertMatchCardVariables } from '@clubs-platform/dataconnect';

// The `InsertMatchCard` mutation requires an argument of type `InsertMatchCardVariables`:
const insertMatchCardVars: InsertMatchCardVariables = {
  userId: ..., // optional
  matchId: ..., 
  clubId: ..., 
  playerId: ..., 
  playerName: ..., 
  color: ..., 
};

// Call the `insertMatchCard()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertMatchCard(insertMatchCardVars);
// Variables can be defined inline as well.
const { data } = await insertMatchCard({ userId: ..., matchId: ..., clubId: ..., playerId: ..., playerName: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertMatchCard(dataConnect, insertMatchCardVars);

console.log(data.query);
console.log(data.card);

// Or, you can use the `Promise` API.
insertMatchCard(insertMatchCardVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.card);
});
```

### Using `InsertMatchCard`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertMatchCardRef, InsertMatchCardVariables } from '@clubs-platform/dataconnect';

// The `InsertMatchCard` mutation requires an argument of type `InsertMatchCardVariables`:
const insertMatchCardVars: InsertMatchCardVariables = {
  userId: ..., // optional
  matchId: ..., 
  clubId: ..., 
  playerId: ..., 
  playerName: ..., 
  color: ..., 
};

// Call the `insertMatchCardRef()` function to get a reference to the mutation.
const ref = insertMatchCardRef(insertMatchCardVars);
// Variables can be defined inline as well.
const ref = insertMatchCardRef({ userId: ..., matchId: ..., clubId: ..., playerId: ..., playerName: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertMatchCardRef(dataConnect, insertMatchCardVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.card);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.card);
});
```

## SubmitInquiry
You can execute the `SubmitInquiry` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
submitInquiry(vars: SubmitInquiryVariables): MutationPromise<SubmitInquiryData, SubmitInquiryVariables>;

interface SubmitInquiryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitInquiryVariables): MutationRef<SubmitInquiryData, SubmitInquiryVariables>;
}
export const submitInquiryRef: SubmitInquiryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
submitInquiry(dc: DataConnect, vars: SubmitInquiryVariables): MutationPromise<SubmitInquiryData, SubmitInquiryVariables>;

interface SubmitInquiryRef {
  ...
  (dc: DataConnect, vars: SubmitInquiryVariables): MutationRef<SubmitInquiryData, SubmitInquiryVariables>;
}
export const submitInquiryRef: SubmitInquiryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the submitInquiryRef:
```typescript
const name = submitInquiryRef.operationName;
console.log(name);
```

### Variables
The `SubmitInquiry` mutation requires an argument of type `SubmitInquiryVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SubmitInquiryVariables {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}
```
### Return Type
Recall that executing the `SubmitInquiry` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SubmitInquiryData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SubmitInquiryData {
  inquiry?: unknown | null;
}
```
### Using `SubmitInquiry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, submitInquiry, SubmitInquiryVariables } from '@clubs-platform/dataconnect';

// The `SubmitInquiry` mutation requires an argument of type `SubmitInquiryVariables`:
const submitInquiryVars: SubmitInquiryVariables = {
  id: ..., 
  name: ..., 
  email: ..., 
  phone: ..., 
  topic: ..., 
  message: ..., 
};

// Call the `submitInquiry()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await submitInquiry(submitInquiryVars);
// Variables can be defined inline as well.
const { data } = await submitInquiry({ id: ..., name: ..., email: ..., phone: ..., topic: ..., message: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await submitInquiry(dataConnect, submitInquiryVars);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
submitInquiry(submitInquiryVars).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

### Using `SubmitInquiry`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, submitInquiryRef, SubmitInquiryVariables } from '@clubs-platform/dataconnect';

// The `SubmitInquiry` mutation requires an argument of type `SubmitInquiryVariables`:
const submitInquiryVars: SubmitInquiryVariables = {
  id: ..., 
  name: ..., 
  email: ..., 
  phone: ..., 
  topic: ..., 
  message: ..., 
};

// Call the `submitInquiryRef()` function to get a reference to the mutation.
const ref = submitInquiryRef(submitInquiryVars);
// Variables can be defined inline as well.
const ref = submitInquiryRef({ id: ..., name: ..., email: ..., phone: ..., topic: ..., message: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = submitInquiryRef(dataConnect, submitInquiryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

## SubmitTeamApplication
You can execute the `SubmitTeamApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
submitTeamApplication(vars: SubmitTeamApplicationVariables): MutationPromise<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;

interface SubmitTeamApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitTeamApplicationVariables): MutationRef<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;
}
export const submitTeamApplicationRef: SubmitTeamApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
submitTeamApplication(dc: DataConnect, vars: SubmitTeamApplicationVariables): MutationPromise<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;

interface SubmitTeamApplicationRef {
  ...
  (dc: DataConnect, vars: SubmitTeamApplicationVariables): MutationRef<SubmitTeamApplicationData, SubmitTeamApplicationVariables>;
}
export const submitTeamApplicationRef: SubmitTeamApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the submitTeamApplicationRef:
```typescript
const name = submitTeamApplicationRef.operationName;
console.log(name);
```

### Variables
The `SubmitTeamApplication` mutation requires an argument of type `SubmitTeamApplicationVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SubmitTeamApplicationVariables {
  id: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  teamName: string;
}
```
### Return Type
Recall that executing the `SubmitTeamApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SubmitTeamApplicationData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SubmitTeamApplicationData {
  application?: unknown | null;
}
```
### Using `SubmitTeamApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, submitTeamApplication, SubmitTeamApplicationVariables } from '@clubs-platform/dataconnect';

// The `SubmitTeamApplication` mutation requires an argument of type `SubmitTeamApplicationVariables`:
const submitTeamApplicationVars: SubmitTeamApplicationVariables = {
  id: ..., 
  captainName: ..., 
  captainEmail: ..., 
  captainPhone: ..., 
  teamName: ..., 
};

// Call the `submitTeamApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await submitTeamApplication(submitTeamApplicationVars);
// Variables can be defined inline as well.
const { data } = await submitTeamApplication({ id: ..., captainName: ..., captainEmail: ..., captainPhone: ..., teamName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await submitTeamApplication(dataConnect, submitTeamApplicationVars);

console.log(data.application);

// Or, you can use the `Promise` API.
submitTeamApplication(submitTeamApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

### Using `SubmitTeamApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, submitTeamApplicationRef, SubmitTeamApplicationVariables } from '@clubs-platform/dataconnect';

// The `SubmitTeamApplication` mutation requires an argument of type `SubmitTeamApplicationVariables`:
const submitTeamApplicationVars: SubmitTeamApplicationVariables = {
  id: ..., 
  captainName: ..., 
  captainEmail: ..., 
  captainPhone: ..., 
  teamName: ..., 
};

// Call the `submitTeamApplicationRef()` function to get a reference to the mutation.
const ref = submitTeamApplicationRef(submitTeamApplicationVars);
// Variables can be defined inline as well.
const ref = submitTeamApplicationRef({ id: ..., captainName: ..., captainEmail: ..., captainPhone: ..., teamName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = submitTeamApplicationRef(dataConnect, submitTeamApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

## EnsureMyProfile
You can execute the `EnsureMyProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
ensureMyProfile(vars: EnsureMyProfileVariables): MutationPromise<EnsureMyProfileData, EnsureMyProfileVariables>;

interface EnsureMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnsureMyProfileVariables): MutationRef<EnsureMyProfileData, EnsureMyProfileVariables>;
}
export const ensureMyProfileRef: EnsureMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
ensureMyProfile(dc: DataConnect, vars: EnsureMyProfileVariables): MutationPromise<EnsureMyProfileData, EnsureMyProfileVariables>;

interface EnsureMyProfileRef {
  ...
  (dc: DataConnect, vars: EnsureMyProfileVariables): MutationRef<EnsureMyProfileData, EnsureMyProfileVariables>;
}
export const ensureMyProfileRef: EnsureMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the ensureMyProfileRef:
```typescript
const name = ensureMyProfileRef.operationName;
console.log(name);
```

### Variables
The `EnsureMyProfile` mutation requires an argument of type `EnsureMyProfileVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface EnsureMyProfileVariables {
  email: string;
  displayName: string;
}
```
### Return Type
Recall that executing the `EnsureMyProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EnsureMyProfileData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EnsureMyProfileData {
  user_upsert: User_Key;
}
```
### Using `EnsureMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ensureMyProfile, EnsureMyProfileVariables } from '@clubs-platform/dataconnect';

// The `EnsureMyProfile` mutation requires an argument of type `EnsureMyProfileVariables`:
const ensureMyProfileVars: EnsureMyProfileVariables = {
  email: ..., 
  displayName: ..., 
};

// Call the `ensureMyProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await ensureMyProfile(ensureMyProfileVars);
// Variables can be defined inline as well.
const { data } = await ensureMyProfile({ email: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await ensureMyProfile(dataConnect, ensureMyProfileVars);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
ensureMyProfile(ensureMyProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

### Using `EnsureMyProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, ensureMyProfileRef, EnsureMyProfileVariables } from '@clubs-platform/dataconnect';

// The `EnsureMyProfile` mutation requires an argument of type `EnsureMyProfileVariables`:
const ensureMyProfileVars: EnsureMyProfileVariables = {
  email: ..., 
  displayName: ..., 
};

// Call the `ensureMyProfileRef()` function to get a reference to the mutation.
const ref = ensureMyProfileRef(ensureMyProfileVars);
// Variables can be defined inline as well.
const ref = ensureMyProfileRef({ email: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = ensureMyProfileRef(dataConnect, ensureMyProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

## SavePlayer
You can execute the `SavePlayer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
savePlayer(vars: SavePlayerVariables): MutationPromise<SavePlayerData, SavePlayerVariables>;

interface SavePlayerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePlayerVariables): MutationRef<SavePlayerData, SavePlayerVariables>;
}
export const savePlayerRef: SavePlayerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
savePlayer(dc: DataConnect, vars: SavePlayerVariables): MutationPromise<SavePlayerData, SavePlayerVariables>;

interface SavePlayerRef {
  ...
  (dc: DataConnect, vars: SavePlayerVariables): MutationRef<SavePlayerData, SavePlayerVariables>;
}
export const savePlayerRef: SavePlayerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the savePlayerRef:
```typescript
const name = savePlayerRef.operationName;
console.log(name);
```

### Variables
The `SavePlayer` mutation requires an argument of type `SavePlayerVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `SavePlayer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SavePlayerData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SavePlayerData {
  player?: unknown | null;
}
```
### Using `SavePlayer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, savePlayer, SavePlayerVariables } from '@clubs-platform/dataconnect';

// The `SavePlayer` mutation requires an argument of type `SavePlayerVariables`:
const savePlayerVars: SavePlayerVariables = {
  id: ..., 
  clubId: ..., 
  name: ..., 
  shirtNumber: ..., 
  position: ..., 
  isCoach: ..., // optional
  active: ..., // optional
  detail: ..., // optional
};

// Call the `savePlayer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await savePlayer(savePlayerVars);
// Variables can be defined inline as well.
const { data } = await savePlayer({ id: ..., clubId: ..., name: ..., shirtNumber: ..., position: ..., isCoach: ..., active: ..., detail: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await savePlayer(dataConnect, savePlayerVars);

console.log(data.player);

// Or, you can use the `Promise` API.
savePlayer(savePlayerVars).then((response) => {
  const data = response.data;
  console.log(data.player);
});
```

### Using `SavePlayer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, savePlayerRef, SavePlayerVariables } from '@clubs-platform/dataconnect';

// The `SavePlayer` mutation requires an argument of type `SavePlayerVariables`:
const savePlayerVars: SavePlayerVariables = {
  id: ..., 
  clubId: ..., 
  name: ..., 
  shirtNumber: ..., 
  position: ..., 
  isCoach: ..., // optional
  active: ..., // optional
  detail: ..., // optional
};

// Call the `savePlayerRef()` function to get a reference to the mutation.
const ref = savePlayerRef(savePlayerVars);
// Variables can be defined inline as well.
const ref = savePlayerRef({ id: ..., clubId: ..., name: ..., shirtNumber: ..., position: ..., isCoach: ..., active: ..., detail: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = savePlayerRef(dataConnect, savePlayerVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.player);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.player);
});
```

## DeletePlayer
You can execute the `DeletePlayer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deletePlayer(vars: DeletePlayerVariables): MutationPromise<DeletePlayerData, DeletePlayerVariables>;

interface DeletePlayerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePlayerVariables): MutationRef<DeletePlayerData, DeletePlayerVariables>;
}
export const deletePlayerRef: DeletePlayerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePlayer(dc: DataConnect, vars: DeletePlayerVariables): MutationPromise<DeletePlayerData, DeletePlayerVariables>;

interface DeletePlayerRef {
  ...
  (dc: DataConnect, vars: DeletePlayerVariables): MutationRef<DeletePlayerData, DeletePlayerVariables>;
}
export const deletePlayerRef: DeletePlayerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePlayerRef:
```typescript
const name = deletePlayerRef.operationName;
console.log(name);
```

### Variables
The `DeletePlayer` mutation requires an argument of type `DeletePlayerVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePlayerVariables {
  id: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `DeletePlayer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePlayerData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePlayerData {
  deleted?: number | null;
}
```
### Using `DeletePlayer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePlayer, DeletePlayerVariables } from '@clubs-platform/dataconnect';

// The `DeletePlayer` mutation requires an argument of type `DeletePlayerVariables`:
const deletePlayerVars: DeletePlayerVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deletePlayer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePlayer(deletePlayerVars);
// Variables can be defined inline as well.
const { data } = await deletePlayer({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePlayer(dataConnect, deletePlayerVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deletePlayer(deletePlayerVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeletePlayer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePlayerRef, DeletePlayerVariables } from '@clubs-platform/dataconnect';

// The `DeletePlayer` mutation requires an argument of type `DeletePlayerVariables`:
const deletePlayerVars: DeletePlayerVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deletePlayerRef()` function to get a reference to the mutation.
const ref = deletePlayerRef(deletePlayerVars);
// Variables can be defined inline as well.
const ref = deletePlayerRef({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePlayerRef(dataConnect, deletePlayerVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## SaveClubEvent
You can execute the `SaveClubEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveClubEvent(vars: SaveClubEventVariables): MutationPromise<SaveClubEventData, SaveClubEventVariables>;

interface SaveClubEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveClubEventVariables): MutationRef<SaveClubEventData, SaveClubEventVariables>;
}
export const saveClubEventRef: SaveClubEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveClubEvent(dc: DataConnect, vars: SaveClubEventVariables): MutationPromise<SaveClubEventData, SaveClubEventVariables>;

interface SaveClubEventRef {
  ...
  (dc: DataConnect, vars: SaveClubEventVariables): MutationRef<SaveClubEventData, SaveClubEventVariables>;
}
export const saveClubEventRef: SaveClubEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveClubEventRef:
```typescript
const name = saveClubEventRef.operationName;
console.log(name);
```

### Variables
The `SaveClubEvent` mutation requires an argument of type `SaveClubEventVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `SaveClubEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveClubEventData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveClubEventData {
  event?: unknown | null;
}
```
### Using `SaveClubEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveClubEvent, SaveClubEventVariables } from '@clubs-platform/dataconnect';

// The `SaveClubEvent` mutation requires an argument of type `SaveClubEventVariables`:
const saveClubEventVars: SaveClubEventVariables = {
  id: ..., 
  clubId: ..., 
  eventType: ..., 
  matchType: ..., // optional
  title: ..., 
  eventDate: ..., 
  eventTime: ..., 
  detail: ..., // optional
};

// Call the `saveClubEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveClubEvent(saveClubEventVars);
// Variables can be defined inline as well.
const { data } = await saveClubEvent({ id: ..., clubId: ..., eventType: ..., matchType: ..., title: ..., eventDate: ..., eventTime: ..., detail: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveClubEvent(dataConnect, saveClubEventVars);

console.log(data.event);

// Or, you can use the `Promise` API.
saveClubEvent(saveClubEventVars).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

### Using `SaveClubEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveClubEventRef, SaveClubEventVariables } from '@clubs-platform/dataconnect';

// The `SaveClubEvent` mutation requires an argument of type `SaveClubEventVariables`:
const saveClubEventVars: SaveClubEventVariables = {
  id: ..., 
  clubId: ..., 
  eventType: ..., 
  matchType: ..., // optional
  title: ..., 
  eventDate: ..., 
  eventTime: ..., 
  detail: ..., // optional
};

// Call the `saveClubEventRef()` function to get a reference to the mutation.
const ref = saveClubEventRef(saveClubEventVars);
// Variables can be defined inline as well.
const ref = saveClubEventRef({ id: ..., clubId: ..., eventType: ..., matchType: ..., title: ..., eventDate: ..., eventTime: ..., detail: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveClubEventRef(dataConnect, saveClubEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event);
});
```

## DeleteClubEvent
You can execute the `DeleteClubEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteClubEvent(vars: DeleteClubEventVariables): MutationPromise<DeleteClubEventData, DeleteClubEventVariables>;

interface DeleteClubEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClubEventVariables): MutationRef<DeleteClubEventData, DeleteClubEventVariables>;
}
export const deleteClubEventRef: DeleteClubEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteClubEvent(dc: DataConnect, vars: DeleteClubEventVariables): MutationPromise<DeleteClubEventData, DeleteClubEventVariables>;

interface DeleteClubEventRef {
  ...
  (dc: DataConnect, vars: DeleteClubEventVariables): MutationRef<DeleteClubEventData, DeleteClubEventVariables>;
}
export const deleteClubEventRef: DeleteClubEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteClubEventRef:
```typescript
const name = deleteClubEventRef.operationName;
console.log(name);
```

### Variables
The `DeleteClubEvent` mutation requires an argument of type `DeleteClubEventVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteClubEventVariables {
  id: string;
  clubId: string;
}
```
### Return Type
Recall that executing the `DeleteClubEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteClubEventData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteClubEventData {
  deleted?: number | null;
}
```
### Using `DeleteClubEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteClubEvent, DeleteClubEventVariables } from '@clubs-platform/dataconnect';

// The `DeleteClubEvent` mutation requires an argument of type `DeleteClubEventVariables`:
const deleteClubEventVars: DeleteClubEventVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteClubEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteClubEvent(deleteClubEventVars);
// Variables can be defined inline as well.
const { data } = await deleteClubEvent({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteClubEvent(dataConnect, deleteClubEventVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteClubEvent(deleteClubEventVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteClubEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteClubEventRef, DeleteClubEventVariables } from '@clubs-platform/dataconnect';

// The `DeleteClubEvent` mutation requires an argument of type `DeleteClubEventVariables`:
const deleteClubEventVars: DeleteClubEventVariables = {
  id: ..., 
  clubId: ..., 
};

// Call the `deleteClubEventRef()` function to get a reference to the mutation.
const ref = deleteClubEventRef(deleteClubEventVars);
// Variables can be defined inline as well.
const ref = deleteClubEventRef({ id: ..., clubId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteClubEventRef(dataConnect, deleteClubEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

## AddTransaction
You can execute the `AddTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
addTransaction(vars: AddTransactionVariables): MutationPromise<AddTransactionData, AddTransactionVariables>;

interface AddTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddTransactionVariables): MutationRef<AddTransactionData, AddTransactionVariables>;
}
export const addTransactionRef: AddTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addTransaction(dc: DataConnect, vars: AddTransactionVariables): MutationPromise<AddTransactionData, AddTransactionVariables>;

interface AddTransactionRef {
  ...
  (dc: DataConnect, vars: AddTransactionVariables): MutationRef<AddTransactionData, AddTransactionVariables>;
}
export const addTransactionRef: AddTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addTransactionRef:
```typescript
const name = addTransactionRef.operationName;
console.log(name);
```

### Variables
The `AddTransaction` mutation requires an argument of type `AddTransactionVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddTransactionVariables {
  id: string;
  clubId: string;
  type: string;
  description: string;
  category: string;
  amount: number;
  txnDate: DateString;
}
```
### Return Type
Recall that executing the `AddTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddTransactionData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddTransactionData {
  transaction?: unknown | null;
}
```
### Using `AddTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addTransaction, AddTransactionVariables } from '@clubs-platform/dataconnect';

// The `AddTransaction` mutation requires an argument of type `AddTransactionVariables`:
const addTransactionVars: AddTransactionVariables = {
  id: ..., 
  clubId: ..., 
  type: ..., 
  description: ..., 
  category: ..., 
  amount: ..., 
  txnDate: ..., 
};

// Call the `addTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addTransaction(addTransactionVars);
// Variables can be defined inline as well.
const { data } = await addTransaction({ id: ..., clubId: ..., type: ..., description: ..., category: ..., amount: ..., txnDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addTransaction(dataConnect, addTransactionVars);

console.log(data.transaction);

// Or, you can use the `Promise` API.
addTransaction(addTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction);
});
```

### Using `AddTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addTransactionRef, AddTransactionVariables } from '@clubs-platform/dataconnect';

// The `AddTransaction` mutation requires an argument of type `AddTransactionVariables`:
const addTransactionVars: AddTransactionVariables = {
  id: ..., 
  clubId: ..., 
  type: ..., 
  description: ..., 
  category: ..., 
  amount: ..., 
  txnDate: ..., 
};

// Call the `addTransactionRef()` function to get a reference to the mutation.
const ref = addTransactionRef(addTransactionVars);
// Variables can be defined inline as well.
const ref = addTransactionRef({ id: ..., clubId: ..., type: ..., description: ..., category: ..., amount: ..., txnDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addTransactionRef(dataConnect, addTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction);
});
```

## SetGoalContribution
You can execute the `SetGoalContribution` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
setGoalContribution(vars: SetGoalContributionVariables): MutationPromise<SetGoalContributionData, SetGoalContributionVariables>;

interface SetGoalContributionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetGoalContributionVariables): MutationRef<SetGoalContributionData, SetGoalContributionVariables>;
}
export const setGoalContributionRef: SetGoalContributionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setGoalContribution(dc: DataConnect, vars: SetGoalContributionVariables): MutationPromise<SetGoalContributionData, SetGoalContributionVariables>;

interface SetGoalContributionRef {
  ...
  (dc: DataConnect, vars: SetGoalContributionVariables): MutationRef<SetGoalContributionData, SetGoalContributionVariables>;
}
export const setGoalContributionRef: SetGoalContributionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setGoalContributionRef:
```typescript
const name = setGoalContributionRef.operationName;
console.log(name);
```

### Variables
The `SetGoalContribution` mutation requires an argument of type `SetGoalContributionVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetGoalContributionVariables {
  goalId: string;
  playerId: string;
  amount: number;
}
```
### Return Type
Recall that executing the `SetGoalContribution` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetGoalContributionData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetGoalContributionData {
  contribution?: unknown | null;
}
```
### Using `SetGoalContribution`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setGoalContribution, SetGoalContributionVariables } from '@clubs-platform/dataconnect';

// The `SetGoalContribution` mutation requires an argument of type `SetGoalContributionVariables`:
const setGoalContributionVars: SetGoalContributionVariables = {
  goalId: ..., 
  playerId: ..., 
  amount: ..., 
};

// Call the `setGoalContribution()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setGoalContribution(setGoalContributionVars);
// Variables can be defined inline as well.
const { data } = await setGoalContribution({ goalId: ..., playerId: ..., amount: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setGoalContribution(dataConnect, setGoalContributionVars);

console.log(data.contribution);

// Or, you can use the `Promise` API.
setGoalContribution(setGoalContributionVars).then((response) => {
  const data = response.data;
  console.log(data.contribution);
});
```

### Using `SetGoalContribution`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setGoalContributionRef, SetGoalContributionVariables } from '@clubs-platform/dataconnect';

// The `SetGoalContribution` mutation requires an argument of type `SetGoalContributionVariables`:
const setGoalContributionVars: SetGoalContributionVariables = {
  goalId: ..., 
  playerId: ..., 
  amount: ..., 
};

// Call the `setGoalContributionRef()` function to get a reference to the mutation.
const ref = setGoalContributionRef(setGoalContributionVars);
// Variables can be defined inline as well.
const ref = setGoalContributionRef({ goalId: ..., playerId: ..., amount: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setGoalContributionRef(dataConnect, setGoalContributionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contribution);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contribution);
});
```

## SaveInventoryItem
You can execute the `SaveInventoryItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
saveInventoryItem(vars: SaveInventoryItemVariables): MutationPromise<SaveInventoryItemData, SaveInventoryItemVariables>;

interface SaveInventoryItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveInventoryItemVariables): MutationRef<SaveInventoryItemData, SaveInventoryItemVariables>;
}
export const saveInventoryItemRef: SaveInventoryItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveInventoryItem(dc: DataConnect, vars: SaveInventoryItemVariables): MutationPromise<SaveInventoryItemData, SaveInventoryItemVariables>;

interface SaveInventoryItemRef {
  ...
  (dc: DataConnect, vars: SaveInventoryItemVariables): MutationRef<SaveInventoryItemData, SaveInventoryItemVariables>;
}
export const saveInventoryItemRef: SaveInventoryItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveInventoryItemRef:
```typescript
const name = saveInventoryItemRef.operationName;
console.log(name);
```

### Variables
The `SaveInventoryItem` mutation requires an argument of type `SaveInventoryItemVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveInventoryItemVariables {
  id: string;
  clubId: string;
  name: string;
  quantity: number;
  condition: string;
}
```
### Return Type
Recall that executing the `SaveInventoryItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveInventoryItemData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveInventoryItemData {
  item?: unknown | null;
}
```
### Using `SaveInventoryItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveInventoryItem, SaveInventoryItemVariables } from '@clubs-platform/dataconnect';

// The `SaveInventoryItem` mutation requires an argument of type `SaveInventoryItemVariables`:
const saveInventoryItemVars: SaveInventoryItemVariables = {
  id: ..., 
  clubId: ..., 
  name: ..., 
  quantity: ..., 
  condition: ..., 
};

// Call the `saveInventoryItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveInventoryItem(saveInventoryItemVars);
// Variables can be defined inline as well.
const { data } = await saveInventoryItem({ id: ..., clubId: ..., name: ..., quantity: ..., condition: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveInventoryItem(dataConnect, saveInventoryItemVars);

console.log(data.item);

// Or, you can use the `Promise` API.
saveInventoryItem(saveInventoryItemVars).then((response) => {
  const data = response.data;
  console.log(data.item);
});
```

### Using `SaveInventoryItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveInventoryItemRef, SaveInventoryItemVariables } from '@clubs-platform/dataconnect';

// The `SaveInventoryItem` mutation requires an argument of type `SaveInventoryItemVariables`:
const saveInventoryItemVars: SaveInventoryItemVariables = {
  id: ..., 
  clubId: ..., 
  name: ..., 
  quantity: ..., 
  condition: ..., 
};

// Call the `saveInventoryItemRef()` function to get a reference to the mutation.
const ref = saveInventoryItemRef(saveInventoryItemVars);
// Variables can be defined inline as well.
const ref = saveInventoryItemRef({ id: ..., clubId: ..., name: ..., quantity: ..., condition: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveInventoryItemRef(dataConnect, saveInventoryItemVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.item);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.item);
});
```

## CreateCourtHold
You can execute the `CreateCourtHold` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
createCourtHold(vars: CreateCourtHoldVariables): MutationPromise<CreateCourtHoldData, CreateCourtHoldVariables>;

interface CreateCourtHoldRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCourtHoldVariables): MutationRef<CreateCourtHoldData, CreateCourtHoldVariables>;
}
export const createCourtHoldRef: CreateCourtHoldRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCourtHold(dc: DataConnect, vars: CreateCourtHoldVariables): MutationPromise<CreateCourtHoldData, CreateCourtHoldVariables>;

interface CreateCourtHoldRef {
  ...
  (dc: DataConnect, vars: CreateCourtHoldVariables): MutationRef<CreateCourtHoldData, CreateCourtHoldVariables>;
}
export const createCourtHoldRef: CreateCourtHoldRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCourtHoldRef:
```typescript
const name = createCourtHoldRef.operationName;
console.log(name);
```

### Variables
The `CreateCourtHold` mutation requires an argument of type `CreateCourtHoldVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCourtHoldVariables {
  id: string;
  courtId: string;
  holdDate: DateString;
  startTime: string;
  endTime: string;
  note: string;
}
```
### Return Type
Recall that executing the `CreateCourtHold` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCourtHoldData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCourtHoldData {
  courtHold?: unknown | null;
}
```
### Using `CreateCourtHold`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCourtHold, CreateCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `CreateCourtHold` mutation requires an argument of type `CreateCourtHoldVariables`:
const createCourtHoldVars: CreateCourtHoldVariables = {
  id: ..., 
  courtId: ..., 
  holdDate: ..., 
  startTime: ..., 
  endTime: ..., 
  note: ..., 
};

// Call the `createCourtHold()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCourtHold(createCourtHoldVars);
// Variables can be defined inline as well.
const { data } = await createCourtHold({ id: ..., courtId: ..., holdDate: ..., startTime: ..., endTime: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCourtHold(dataConnect, createCourtHoldVars);

console.log(data.courtHold);

// Or, you can use the `Promise` API.
createCourtHold(createCourtHoldVars).then((response) => {
  const data = response.data;
  console.log(data.courtHold);
});
```

### Using `CreateCourtHold`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCourtHoldRef, CreateCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `CreateCourtHold` mutation requires an argument of type `CreateCourtHoldVariables`:
const createCourtHoldVars: CreateCourtHoldVariables = {
  id: ..., 
  courtId: ..., 
  holdDate: ..., 
  startTime: ..., 
  endTime: ..., 
  note: ..., 
};

// Call the `createCourtHoldRef()` function to get a reference to the mutation.
const ref = createCourtHoldRef(createCourtHoldVars);
// Variables can be defined inline as well.
const ref = createCourtHoldRef({ id: ..., courtId: ..., holdDate: ..., startTime: ..., endTime: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCourtHoldRef(dataConnect, createCourtHoldVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.courtHold);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.courtHold);
});
```

## DeleteCourtHold
You can execute the `DeleteCourtHold` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [generated/index.d.ts](./index.d.ts):
```typescript
deleteCourtHold(vars: DeleteCourtHoldVariables): MutationPromise<DeleteCourtHoldData, DeleteCourtHoldVariables>;

interface DeleteCourtHoldRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourtHoldVariables): MutationRef<DeleteCourtHoldData, DeleteCourtHoldVariables>;
}
export const deleteCourtHoldRef: DeleteCourtHoldRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteCourtHold(dc: DataConnect, vars: DeleteCourtHoldVariables): MutationPromise<DeleteCourtHoldData, DeleteCourtHoldVariables>;

interface DeleteCourtHoldRef {
  ...
  (dc: DataConnect, vars: DeleteCourtHoldVariables): MutationRef<DeleteCourtHoldData, DeleteCourtHoldVariables>;
}
export const deleteCourtHoldRef: DeleteCourtHoldRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteCourtHoldRef:
```typescript
const name = deleteCourtHoldRef.operationName;
console.log(name);
```

### Variables
The `DeleteCourtHold` mutation requires an argument of type `DeleteCourtHoldVariables`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteCourtHoldVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteCourtHold` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteCourtHoldData`, which is defined in [generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteCourtHoldData {
  deleted?: number | null;
}
```
### Using `DeleteCourtHold`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteCourtHold, DeleteCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `DeleteCourtHold` mutation requires an argument of type `DeleteCourtHoldVariables`:
const deleteCourtHoldVars: DeleteCourtHoldVariables = {
  id: ..., 
};

// Call the `deleteCourtHold()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteCourtHold(deleteCourtHoldVars);
// Variables can be defined inline as well.
const { data } = await deleteCourtHold({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteCourtHold(dataConnect, deleteCourtHoldVars);

console.log(data.deleted);

// Or, you can use the `Promise` API.
deleteCourtHold(deleteCourtHoldVars).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

### Using `DeleteCourtHold`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteCourtHoldRef, DeleteCourtHoldVariables } from '@clubs-platform/dataconnect';

// The `DeleteCourtHold` mutation requires an argument of type `DeleteCourtHoldVariables`:
const deleteCourtHoldVars: DeleteCourtHoldVariables = {
  id: ..., 
};

// Call the `deleteCourtHoldRef()` function to get a reference to the mutation.
const ref = deleteCourtHoldRef(deleteCourtHoldVars);
// Variables can be defined inline as well.
const ref = deleteCourtHoldRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteCourtHoldRef(dataConnect, deleteCourtHoldVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.deleted);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.deleted);
});
```

