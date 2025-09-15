## Pecunia

### Packages & Subscriptions

The application supports team subscription packages.

#### Registration
On user self-registration (`POST /api/register/self`) a team is created and the `free` package (identified by slug `free`) is automatically assigned if present by creating a `TeamSubscription` with `priceCents = 0`.

#### Purchasing / Upgrading
Endpoint: `POST /api/packages/purchase`

Request body:
```json
{ "teamId": "<team-id>", "packageSlug": "pro", "annual": true }
```

Rules:
* Caller must be owner or admin of the team.
* Previous active subscriptions are deactivated.
* New `TeamSubscription` is created with pricing from `monthlyCents` or `annualCents`.

#### Helper Utilities
`src/lib/package.ts` provides:
* `getFreePackage()` – fetch free package by slug.
* `assignPackageToTeam(teamId, packageSlug, { annual? })` – transactional reassignment.

#### Schema
See `Package` and `TeamSubscription` models in `prisma/schema.prisma`.

