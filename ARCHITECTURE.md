# ARCHITECTURE.md --- JainConnect System Architecture

**Status:** Proposed baseline architecture\
**Product:** JainConnect\
**Purpose:** Define the system boundaries, components, data flows,
security boundaries, and operational principles for implementation.

This document describes the intended architecture. It does not claim
that any service, infrastructure, integration, or feature is already
implemented. Confirm decisions against the actual repository and
deployment environment before implementation.

## 1. Architecture Goals

JainConnect is a free, community-first platform for discovering and
sharing useful Jain community information. Its architecture must
support:

-   A public, search-friendly website and a Flutter Android application.
-   A protected admin and moderation experience.
-   Verified community records, temples, trusts, gurus, events,
    resources, and seva initiatives.
-   A privacy-preserving blood-donor and blood-request workflow.
-   Authorized media links, livestream embeds, and pravachan resources.
-   Temple/trust donations paid directly to the verified recipient.
-   A separate, optional JainConnect operating-cost support flow.
-   Clear authorization, auditability, maintainability, and incremental
    delivery.
-   Practical operation on a Linux VPS or managed services without
    unnecessary infrastructure complexity.

## 2. High-Level System

``` mermaid
flowchart TB
    Visitor[Public visitor] --> Web[Next.js public website]
    Member[Community member] --> Mobile[Flutter Android app]
    Admin[Authorized administrator] --> AdminUI[Protected Next.js admin UI]

    Web --> API[Node.js + Express API]
    Mobile --> API
    AdminUI --> API

    API --> Auth[Authentication and authorization]
    API --> DB[(PostgreSQL)]
    API --> ObjectStorage[Object storage]
    API --> Notifications[Notification adapters]
    API --> Maps[Maps/geocoding adapter]
    API --> Video[Authorized video providers]
    API --> Email[Transactional email provider]

    API --> Audit[Audit events]
    Audit --> DB
```

The diagram is conceptual. The actual deployment may combine the public
website and admin UI in one Next.js application if that fits the
repository and access-control model. Regardless of deployment shape,
public and privileged operations must have clear server-side
authorization boundaries.

## 3. System Components

### 3.1 Public website --- Next.js App Router

Responsibilities:

-   Render public directory and detail pages for temples, trusts, gurus,
    events, resources, bhojanalays, dharamshalas, pilgrimage
    destinations, and approved seva initiatives.
-   Provide useful public content that search engines can crawl without
    requiring app installation.
-   Support canonical URLs, metadata, structured data, sitemap
    generation, and appropriate indexing controls.
-   Provide sign-in/account experiences where needed.
-   Provide safe submission, reporting, and request workflows.
-   Deep-link to the mobile app where supported, with a functional web
    fallback.

Implementation principles:

-   Use server rendering or static generation where suitable for public
    content.
-   Use revalidation or explicit cache invalidation when verified public
    records change.
-   Do not cache personalized, private, or permission-dependent
    responses in a shared public cache.
-   Do not place secrets in client bundles.
-   Treat all query parameters, form values, and URL identifiers as
    untrusted input.
-   Use consistent loading, empty, error, and not-found states.

### 3.2 Android application --- Flutter

Responsibilities:

-   Provide community access on Android.
-   Support account/profile features, event discovery, notifications,
    approved resource browsing, blood-network consent and requests, and
    other phased features in the PRD.
-   Provide share links that resolve to public web pages.
-   Support offline-friendly presentation for appropriate non-sensitive
    cached content.

Implementation principles:

-   Follow the repository's established navigation and state-management
    patterns.
-   Keep API and domain logic separate from widgets.
-   Use secure platform storage for session credentials.
-   Avoid storing sensitive donor details or verification evidence on
    the device unless there is a documented requirement and suitable
    protection.
-   Handle revoked sessions, network failures, permission denial,
    expired requests, and notification opt-outs.
-   Do not treat client-side visibility checks as authorization.

### 3.3 Backend API --- Node.js, Express, TypeScript

Responsibilities:

-   Enforce authentication, role checks, resource-level authorization,
    validation, business rules, and rate limits.
-   Serve versioned REST endpoints under `/api/v1`.
-   Coordinate database transactions and external service adapters.
-   Apply consent, expiry, verification, moderation, and
    donation-recipient rules.
-   Produce consistent error responses and audit events for sensitive
    actions.
-   Publish the OpenAPI contract and keep it synchronized with
    implementation.

Suggested logical modules:

-   Identity and accounts
-   Profiles and community directory
-   Temples and trusts
-   Gurus and spiritual content
-   Events and calendar resources
-   Bhojanalays, dharamshalas, and pilgrimage information
-   Blood donors and blood requests
-   Seva and charity initiatives
-   Media and external video links
-   Temple/trust donation instructions
-   JainConnect support
-   Notifications
-   Reports, verification, and moderation
-   Admin operations and audit logs

These are logical boundaries, not a mandate to create a microservice for
each module. Start with a modular monolith unless scale, reliability, or
team ownership provides a concrete reason to split services.

### 3.4 Database --- PostgreSQL with Prisma

PostgreSQL is the primary source of truth for application records and
authorization-related state. Prisma provides schema management, typed
access, and migrations.

Data principles:

-   Enforce relationships and integrity with foreign keys and database
    constraints.
-   Add indexes for common lookup, filtering, pagination, and moderation
    queries.
-   Use transactions for multi-record operations that must succeed or
    fail together.
-   Use explicit lifecycle states rather than relying on deletion or UI
    visibility alone.
-   Track creation/update timestamps and the actor for sensitive state
    transitions.
-   Use soft deletion only when it serves a documented retention or
    audit need; define retention and access rules.
-   Store secrets and high-risk payment credentials outside ordinary
    application tables.
-   Avoid persisting unnecessary sensitive personal data.

The detailed entity model belongs in `DATABASE_SCHEMA.md`; this document
defines system-level boundaries rather than a final schema.

### 3.5 Object and media storage

Use approved S3-compatible object storage or a managed provider for
user-submitted and administrative media.

Controls:

-   Validate file type, size, and content before making files public.
-   Use generated object keys instead of trusting uploaded filenames.
-   Keep private verification evidence in private storage with
    short-lived authorized access.
-   Do not expose storage credentials to clients.
-   Apply upload quotas, malware/content scanning where available, and
    deletion/retention rules.
-   Prefer official video links or authorized embeds over downloading
    and re-hosting third-party streams.
-   Use a CDN only where its caching and access-control behavior is
    understood.

### 3.6 External integrations

Wrap providers behind small adapters so a provider can be changed
without rewriting business logic.

  -----------------------------------------------------------------------
  Integration             Purpose                 Key constraint
  ----------------------- ----------------------- -----------------------
  Firebase Cloud          Push notifications      Respect notification
  Messaging                                       preferences and avoid
                                                  sensitive content in
                                                  push payloads

  Transactional email     Account and service     Use verified sender
                          emails                  configuration; avoid
                                                  leaking private details

  Maps/geocoding          Approximate location    Minimize location data
                          and directions          sent to providers and
                                                  disclose relevant use

  Video platforms         Official                Use authorized sources
                          pravachan/live-stream   and respect provider
                          embeds                  restrictions

  Object storage          Images and documents    Enforce private/public
                                                  access boundaries

  Error monitoring        Diagnostics             Scrub tokens, donor
                                                  data, and verification
                                                  evidence

  Analytics               Product usage           Minimize personal data;
                                                  do not track sensitive
                                                  donor information
  -----------------------------------------------------------------------

Do not add every integration in the first release. Implement only those
required for the active milestone and record provider-specific decisions
in configuration and operational documentation.

## 4. Trust Boundaries and Request Flow

A typical request follows this path:

1.  A web or mobile client sends an HTTPS request.
2.  The API applies request-size limits, parsing, basic abuse controls,
    and request correlation.
3.  Authentication middleware validates the session or token where
    required.
4.  Authorization checks the role and permission for the specific
    operation and resource.
5.  Input validation parses and normalizes all untrusted data.
6.  Domain logic checks business rules, lifecycle state, consent,
    expiry, and verification.
7.  The service reads or writes PostgreSQL, using a transaction where
    needed.
8.  Sensitive changes produce an audit record.
9.  External side effects such as email or push notifications are
    performed through adapters, preferably after durable state is
    committed.
10. The API returns a minimal, documented response.

Never trust client-supplied roles, ownership IDs, verification status,
payment status, or recipient details. Recheck sensitive decisions on the
server using current database state.

## 5. Identity, Roles, and Authorization

The product may include anonymous visitors, registered members, content
submitters, verified organizational representatives, moderators, and
administrators. Final role definitions must align with `PRD.md`.

Rules:

-   Public reading should be allowed for eligible public records.
-   Private profile changes and donor controls require authenticated
    access.
-   Organizational representatives may manage only records they are
    authorized to manage.
-   Verification and moderation actions require dedicated permissions.
-   Admin access must use least privilege and be auditable.
-   Enforce resource ownership and role checks in the API, not only in
    the UI.
-   Prevent insecure direct object reference (IDOR) issues.
-   Apply rate limits and abuse controls to sign-in, recovery, search,
    submissions, reports, and blood-request operations.
-   Keep account recovery and session revocation behavior explicit.
-   Use secure cookie/session configuration for web or appropriately
    protected token storage for mobile, based on the chosen auth design.
-   Do not invent an authentication provider or token strategy without
    checking the repository and documenting the decision.

## 6. Sensitive Domain Flows

### 6.1 Blood donor discovery and requests

The blood network requires stricter privacy controls than ordinary
public directories.

Suggested flow:

1.  A donor explicitly opts in after reviewing what information will be
    used.
2.  The donor selects blood group, broad location, availability, and
    contact preferences.
3.  The API validates consent and stores only necessary information.
4.  Search returns a privacy-safe result set, using city or approximate
    area by default.
5.  Contact details are shared only through the explicitly approved
    contact workflow.
6.  A donor can pause, update, or withdraw participation.
7.  Requests and availability expire or close according to defined
    lifecycle rules.
8.  Sensitive access and administrative changes are logged without
    recording private details in ordinary logs.

Do not expose exact home addresses, unrestricted phone lists, or donor
records in public search, sitemap, structured data, analytics, or share
previews. The platform must not guarantee medical compatibility, donor
availability, or clinical outcomes.

### 6.2 Temple and trust donation instructions

Temple/trust donation details must be tied to a specific, verified
recipient.

Suggested flow:

1.  An authorized representative submits recipient and payment details
    with evidence.
2.  An authorized reviewer verifies the organization, representative
    authority, recipient identity, and payment destination.
3.  The details remain pending until approval.
4.  Public pages show the verified recipient, purpose, review state/date
    where appropriate, and approved QR/payment instructions.
5.  A change to payment details triggers re-review and an audit record.
6.  Reports or suspected fraud can suspend the instructions while the
    issue is investigated.

JainConnect should provide payment instructions or direct users to the
recipient's approved payment channel. Do not claim payment completion
merely because a QR was displayed, scanned, or opened in a payment app.

### 6.3 Optional JainConnect operating-cost support

This is a separate flow for voluntary support of platform expenses such
as hosting, domain, storage, security, and maintenance.

-   Keep its UI, database records, recipient details, API permissions,
    reporting, and analytics separate from temple/trust donation flows.
-   Declining support must not block core functionality.
-   Do not label platform support as a donation to a temple, trust, or
    charitable cause.
-   Do not claim tax deductibility, a receipt, or payment confirmation
    unless verified and supported.
-   Obtain appropriate legal, accounting, and tax review before enabling
    a collection or payment integration.

### 6.4 Verification and moderation

-   Store verification status and review history with the relevant
    record.
-   Keep submitted identity and organizational evidence private.
-   Record the reviewer, time, decision, and a safe summary of the
    action.
-   Provide correction/reporting paths for inaccurate public records.
-   Support suspension or removal of content that is fraudulent, unsafe,
    unauthorized, or materially inaccurate.
-   Avoid displaying verification badges until the defined review has
    been completed.

## 7. Data Classification and Caching

Use these conceptual classes when deciding access and storage behavior:

  -----------------------------------------------------------------------
  Class                   Examples                Default handling
  ----------------------- ----------------------- -----------------------
  Public                  Approved temple         Public web rendering
                          profile, public event,  and eligible indexing
                          official resource link  

  Member-private          Account settings,       Authenticated access
                          private profile fields  only

  Sensitive               Donor contact data,     Strict authorization,
                          blood-request contact   minimal retention, no
                          details                 public indexing

  Restricted evidence     Identity documents,     Private storage, narrow
                          trust verification      reviewer access,
                          evidence                short-lived access
                                                  links

  Operational secret      API keys, signing keys, Secret manager or
                          database credentials    protected environment
                                                  configuration; never
                                                  client-visible
  -----------------------------------------------------------------------

Caching rules:

-   Public, approved records may be cached with clear invalidation or
    revalidation.
-   Private and personalized API responses must not enter shared caches.
-   Sensitive donor data should have minimal or no persistent client
    caching.
-   On sign-out, clear protected local state.
-   Do not use `robots.txt` as a substitute for authentication or access
    controls.

## 8. API Design

-   Use `/api/v1` for REST endpoints.
-   Publish an OpenAPI specification.
-   Use a consistent response and error format.
-   Validate route parameters, query parameters, request bodies,
    uploaded files, and external callback payloads.
-   Apply pagination to large result sets.
-   Enforce server-side authorization for every protected route.
-   Use idempotency or duplicate protection for retryable operations
    such as submissions and notification dispatch.
-   Keep provider secrets on the server.
-   Avoid putting personal or sensitive data in URL paths, query
    strings, logs, or error messages.

Proposed route groups:

``` text
/api/v1/auth/*
/api/v1/accounts/*
/api/v1/profiles/*
/api/v1/directory/*
/api/v1/temples/*
/api/v1/trusts/*
/api/v1/gurus/*
/api/v1/events/*
/api/v1/resources/*
/api/v1/blood/donors/*
/api/v1/blood/requests/*
/api/v1/seva/*
/api/v1/media/*
/api/v1/donations/temples/*
/api/v1/support/*
/api/v1/notifications/*
/api/v1/reports/*
/api/v1/admin/*
/api/v1/health
```

These are proposed route groups, not a final endpoint contract. Define
request/response schemas, permissions, rate limits, and error cases in
`API_SPEC.md`.

## 9. SEO and Public Content Architecture

Public pages should use stable, human-readable routes such as:

``` text
/temples/[slug]
/trusts/[slug]
/gurus/[slug]
/events/[slug]
/bhojanalays/[slug]
/dharamshalas/[slug]
/pilgrimage/[slug]
/resources/[slug]
/seva/[slug]
```

The final route scheme should be consistent with `SEO.md` and the actual
product navigation.

SEO controls:

-   Unique titles and descriptions for meaningful public pages.
-   Canonical URLs and correct HTTP status codes.
-   Structured data only for facts visible on the page and supported by
    reliable records.
-   Sitemaps that include only eligible public pages.
-   `noindex` or access controls for private, thin, duplicate, pending,
    or unverified content as appropriate.
-   No donor data or private blood-request details in public HTML,
    metadata, JSON-LD, analytics, or social previews.
-   Useful web fallback pages for shared mobile links.
-   Clear source attribution and last-reviewed information for records
    that can change.

SEO, answer-engine optimization, and generative-engine optimization
improve eligibility and clarity; they do not guarantee rankings, rich
results, or AI citations.

## 10. Notifications and Background Work

Use the simplest reliable approach that meets the active release needs.

Potential background tasks include:

-   Expiring old blood requests and stale availability.
-   Sending event reminders and opt-in notifications.
-   Sending transactional emails.
-   Refreshing cached public content or sitemap data.
-   Processing media metadata and moderation queues.
-   Cleaning up expired temporary uploads.

Operational rules:

-   Make jobs idempotent and safe to retry.
-   Record failures and expose useful operational metrics.
-   Avoid duplicate notifications through deduplication keys or durable
    job state.
-   Respect user preferences and quiet/consent rules where defined.
-   Do not include sensitive medical or donor details in push
    notification text.
-   If a durable queue is not justified, start with a managed scheduler
    or a small database-backed job mechanism; document its reliability
    limits before relying on it for critical workflows.

## 11. Deployment Topology

A practical initial deployment can use:

-   HTTPS reverse proxy or managed ingress.
-   Next.js website/admin deployment.
-   Node.js API deployment.
-   Managed PostgreSQL or a secured PostgreSQL instance.
-   Private object storage.
-   External notification, email, maps, and media providers only when
    required.
-   Error monitoring and centralized, privacy-safe logs.
-   Automated backups with tested restoration.

Keep development, staging, and production isolated. Production must use
separate credentials, domains, storage configuration, and database
access controls.

Do not assume that a single VPS is production-ready merely because the
application starts. Assess resource sizing, security updates, firewall
rules, TLS renewal, process supervision, backups, monitoring, deployment
rollback, and restore procedures.

## 12. Security Baseline

-   HTTPS everywhere outside local development.
-   Secure secrets management and startup configuration validation.
-   Principle of least privilege for database and service accounts.
-   Server-side input validation and output minimization.
-   Authentication, authorization, rate limiting, and abuse protection.
-   Safe CORS, cookie, CSRF, and content-security settings appropriate
    to the selected auth and deployment design.
-   Safe upload validation and private evidence storage.
-   Dependency vulnerability checks and timely security updates.
-   Redacted structured logs.
-   Audit records for verification, payment-detail changes, role
    changes, and sensitive moderation actions.
-   Tested backup and restoration procedures.
-   No sensitive data in client bundles, public metadata, source maps,
    or analytics.

Security controls must be verified against the actual implementation and
deployment configuration; listing a control here does not mean it has
already been implemented.

## 13. Reliability, Performance, and Observability

-   Add health and readiness checks that do not leak secrets.
-   Set timeouts and bounded retries for external providers.
-   Use database indexes and paginated queries for directories.
-   Cache only data that is safe to cache.
-   Optimize public images and defer non-critical media.
-   Track API error rates, latency, database health, job failures,
    notification delivery, storage usage, and provider costs.
-   Include request/correlation IDs where practical.
-   Never log access tokens, passwords, private donor details, or
    verification documents.
-   Configure backups and periodically test restoration.
-   Document deployment, migration, rollback, incident response, and
    recovery.

## 14. Testing and Release Gates

Before a release, verify the relevant items below:

-   Authentication and role/resource authorization.
-   Cross-account access attempts and IDOR protection.
-   Donor consent, privacy, pause/removal, expiry, and request closure.
-   Temple/trust verification and payment-detail change review.
-   Separation of temple/trust donation records from platform-support
    records.
-   No false payment-success state.
-   Public SEO rendering, canonical URLs, status codes, sitemap
    eligibility, and private-data exclusion.
-   API contract and migration correctness.
-   Mobile/web critical user journeys and failure states.
-   Upload restrictions, rate limits, and safe error handling.
-   Monitoring, backup, restore, and rollback readiness.
-   Accessibility and responsive behavior.

Use synthetic data. Do not use real donor or verification records in
fixtures, screenshots, logs, or test environments.

## 15. Architecture Decisions to Record

Maintain an Architecture Decision Record (ADR) for decisions that
materially affect long-term behavior, including:

-   Authentication/session strategy.
-   Repository and deployment boundaries for web and admin.
-   Flutter state management and navigation.
-   Validation library and API error conventions.
-   Object-storage and upload-security approach.
-   Background job and notification strategy.
-   Maps/geocoding provider and location precision.
-   Verification workflow and evidence retention.
-   Donation recipient verification and any future payment integration.
-   Analytics/privacy approach.
-   Data retention and account deletion policies.

Each ADR should state context, options considered, decision,
consequences, security/privacy implications, and date. Do not invent
unresolved decisions; mark them as pending.

## 16. Implementation Order

A suggested dependency-aware order is:

1.  Repository baseline, environment validation, linting, type checks,
    and CI.
2.  Database foundation, migrations, API conventions, authentication,
    and authorization.
3.  Public site shell, shared design tokens, navigation, metadata, and
    health checks.
4.  Admin permissions, audit events, verification, and moderation
    foundations.
5.  Public community directories and detail pages.
6.  Events, calendar, resources, temples/trusts, gurus, and authorized
    media.
7.  Blood-network consent, privacy-safe search, request lifecycle, and
    moderation.
8.  Direct temple/trust donation instructions and separate optional
    platform-support flow.
9.  Flutter app integration, deep links, and opt-in notifications.
10. Performance, accessibility, security, backup/restore, and
    production-readiness verification.

The sequence can change based on the PRD, dependencies, and available
resources. Do not expose a sensitive workflow publicly until its
consent, authorization, moderation, and expiry requirements are
implemented and tested.

## 17. Related Documents

-   `AGENTS.md` --- mandatory contributor and coding-agent rules.
-   `PRD.md` --- functional scope and acceptance criteria.
-   `DESIGN.md` --- design system and UX behavior.
-   `SEO.md` --- discoverability and indexing requirements.
-   `JainConnect-Product-Overview.md` --- product vision and high-level
    feature overview.
-   `DATABASE_SCHEMA.md` --- detailed data model, when authored.
-   `API_SPEC.md` --- detailed API contract, when authored.
-   `DEPLOYMENT.md` --- environment, deployment, backup, and recovery
    procedures, when authored.

## 18. Final Principle

Use a modular, secure, privacy-first architecture that can be delivered
incrementally. Preserve the separation between public community
information, sensitive donor workflows, verified organizational records,
direct temple/trust donations, and optional JainConnect operating-cost
support. Prefer evidence-backed behavior over assumptions, and document
anything that remains undecided.
