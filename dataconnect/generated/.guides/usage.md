# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { amIPlatformAdmin, platformAdminById, clubAdminGate, signupInviteByEmail, clubInviteLookup, adminClubs, adminClubPeople, adminCompetition, adminCover, adminAds } from '@clubs-platform/dataconnect';


// Operation AmIPlatformAdmin: 
const { data } = await AmIPlatformAdmin(dataConnect);

// Operation PlatformAdminById:  For variables, look at type PlatformAdminByIdVars in ../index.d.ts
const { data } = await PlatformAdminById(dataConnect, platformAdminByIdVars);

// Operation ClubAdminGate:  For variables, look at type ClubAdminGateVars in ../index.d.ts
const { data } = await ClubAdminGate(dataConnect, clubAdminGateVars);

// Operation SignupInviteByEmail:  For variables, look at type SignupInviteByEmailVars in ../index.d.ts
const { data } = await SignupInviteByEmail(dataConnect, signupInviteByEmailVars);

// Operation ClubInviteLookup:  For variables, look at type ClubInviteLookupVars in ../index.d.ts
const { data } = await ClubInviteLookup(dataConnect, clubInviteLookupVars);

// Operation AdminClubs: 
const { data } = await AdminClubs(dataConnect);

// Operation AdminClubPeople:  For variables, look at type AdminClubPeopleVars in ../index.d.ts
const { data } = await AdminClubPeople(dataConnect, adminClubPeopleVars);

// Operation AdminCompetition: 
const { data } = await AdminCompetition(dataConnect);

// Operation AdminCover: 
const { data } = await AdminCover(dataConnect);

// Operation AdminAds: 
const { data } = await AdminAds(dataConnect);


```