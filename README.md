# JainConnect

JainConnect is a free, community-first platform for useful Jain community
information and services. It is developed and maintained by NovaEdge Digital
Labs.

The repository contains the first backend foundation slice, a read-only public
temple directory API, and the first protected verification/moderation slice.
Sensitive blood-network and donation workflows remain deferred until their
authorization, privacy, and operational controls are implemented and tested.

## Repository status

- `apps/api`: Node.js, Express, and TypeScript API foundation.
- `apps/api/prisma`: initial PostgreSQL identity, consent, role, and audit
  schema.
- `apps/api/openapi`: versioned health, public-temple, and protected admin
  endpoint contract.
- `apps/web`: Next.js App Router public shell with server-rendered temple
  directory pages, SEO route handlers, and a protected admin dashboard.
- `apps/mobile`: Flutter Android discovery shell using the public temple API.
- `IMPLEMENTATION_STATUS.md`: evidence-based feature tracker.
- The protected admin UI is available at `/admin`; the Flutter app remains a
  public discovery shell and does not expose staff workflows.

## Requirements

- Node.js 24 or newer.
- npm 10 or newer.
- PostgreSQL for readiness checks and future persisted features.
- Flutter stable and the Android SDK for mobile checks.

## Local setup

```sh
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:validate
```

Set `DATABASE_URL` in `.env` to a disposable local PostgreSQL database before
running the readiness endpoint. No credentials belong in source control.

## Development commands

```sh
npm run dev             # start the API with file watching
npm run build           # build the API and public website
npm run typecheck       # strict TypeScript check
npm run lint            # ESLint
npm run format:check    # Prettier check for source/config files
npm test                # unit and HTTP contract tests
npm run test:integration # PostgreSQL integration tests; DATABASE_URL required
npm run web:test        # server/API adapter tests for the Next.js site
```

Mobile checks run from the Flutter project directory:

```sh
cd apps/mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

The Android emulator can use the default API base URL (`10.0.2.2:3001`). To
point another device or environment at the API, pass an explicit value:

```sh
flutter run --dart-define=API_BASE_URL=https://api.example.test/api/v1
```

The API listens on `http://127.0.0.1:3001` by default. The live endpoint is
available without a database:

```text
GET /api/v1/health/live
```

The readiness endpoint checks PostgreSQL and returns `503` without disclosing
connection details when the database is unavailable:

```text
GET /api/v1/health/ready
```

Approved public temple records are available through a paginated API. The
database query requires both `PUBLISHED` publication status and `VERIFIED`
verification status; pending or suspended records are not returned.

```text
GET /api/v1/temples?q=temple&city=Indore&page=1&pageSize=20
GET /api/v1/temples/{slug}
```

The first account API uses revocable opaque bearer sessions. Passwords are
scrypt-hashed, session tokens are stored only as SHA-256 hashes, and protected
routes resolve the account server-side:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me       # Authorization: Bearer <token>
POST /api/v1/auth/logout   # Authorization: Bearer <token>
GET  /api/v1/admin/access  # requires an active admin role
```

The API enforces separate role groups for content editing, verification,
moderation, and audit review. Temple publication requires a verified record;
verification decisions, publication changes, report moderation, and content
creation are written to the audit log. The web dashboard at `/admin/login`
keeps the opaque API session in an HTTP-only same-site cookie and proxies
authorized dashboard requests without exposing the token to browser
JavaScript.

Email verification, password recovery, MFA, fine-grained organization-scoped
management, and object-storage evidence uploads are not yet implemented. Do
not use this foundation as a production account system until those release
controls and operational policies are complete.

## Database migrations

The reviewed migrations include identity, public temples, authentication
sessions, and moderation/verification SQL under
`apps/api/prisma/migrations/`.
Apply it to a disposable development database with the repository's Prisma
workflow after configuring `DATABASE_URL`:

```sh
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

The integration suite uses synthetic records and verifies authentication,
public visibility, role-separated moderation, reports, audit events, and the
publication/verification boundary against PostgreSQL:

```sh
npm run db:migrate
npm run test:integration
```

Do not run migrations against production until the deployment, backup, and
rollback procedure has been reviewed.

## Architecture and product specifications

Read `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`,
`THREAT_MODEL.md`, `implementation_plan.md`, `DESIGN.md`, `SEO.md`, and
`JainConnect-Product-Overview.md` before extending the implementation.
