# IMPLEMENTATION_PLAN.md --- JainConnect Delivery Plan

**Status:** Proposed phased implementation plan\
**Product:** JainConnect\
**Primary goal:** Deliver a reliable, free, privacy-first community
platform with a public website, Flutter Android app, backend API, and
protected administration tools.

This plan defines a dependency-aware sequence of work, deliverables,
acceptance gates, and release criteria. It is not a statement that
implementation has already begun or that any milestone is complete.
Update status only when evidence from the repository, tests, or deployed
environment supports it.

## 1. Product and Delivery Principles

1.  **All agreed features remain in scope.** Delivery may be phased, but
    features must not be silently removed from the product vision.
2.  **Trust before reach.** Verification, privacy, consent, moderation,
    and accurate information are foundational---not optional polish.
3.  **Build a modular monolith first.** Use a shared backend and
    database for the web, app, and admin experience. Split services only
    when a demonstrated need justifies it.
4.  **Public access where appropriate.** Useful public community
    information should be accessible on the website without requiring
    app installation.
5.  **Mobile and web parity by capability.** Not every workflow must
    launch on both clients simultaneously, but API contracts and product
    scope should support the agreed experience across clients.
6.  **No payment ambiguity.** Temple/trust donations go directly to
    their own verified recipients. Optional JainConnect operating-cost
    support is separate and never a prerequisite for core features.
7.  **Privacy by design.** Donor data, private profiles, verification
    evidence, and internal moderation details must not leak through
    APIs, search, metadata, analytics, logs, caches, or notifications.
8.  **Evidence-based progress.** Mark work complete only after relevant
    tests or checks pass. Record blockers and external dependencies
    explicitly.
9.  **Preserve existing work.** Inspect the repository and working tree
    before making changes; avoid destructive or unrelated refactors.
10. **Avoid premature complexity.** Introduce queues, microservices,
    search engines, or custom video infrastructure only when the product
    requirements and operating constraints justify them.

## 2. Source-of-Truth Documents

Read these before implementation:

-   `AGENTS.md` --- coding-agent workflow, quality rules, security and
    privacy requirements.
-   `PRD.md` --- product scope, user roles, workflows, acceptance
    criteria, and release gates.
-   `ARCHITECTURE.md` --- system boundaries, components, integrations,
    and deployment approach.
-   `DATA_MODEL.md` --- entities, relationships, constraints, privacy
    boundaries, and lifecycle rules.
-   `THREAT_MODEL.md` --- threats, mitigations, verification evidence,
    and incident-response requirements.
-   `DESIGN.md` --- visual system, components, responsive layouts, and
    accessibility.
-   `SEO.md` --- discoverability, structured data, canonical URLs,
    indexing rules, and content strategy.
-   `JainConnect-Product-Overview.md` --- product vision and feature
    overview.

If a document conflicts with the repository's current behavior or
another requirement, record the conflict and resolve it deliberately. Do
not claim to have inspected a file or environment that was not
available.

## 3. Target Technology

Use existing repository decisions where they are sound; otherwise follow
this target stack:

  -----------------------------------------------------------------------
  Layer                               Target
  ----------------------------------- -----------------------------------
  Android application                 Flutter + Dart

  Public website                      Next.js App Router + TypeScript

  Admin interface                     Next.js + TypeScript; may share the
                                      web app if access boundaries remain
                                      clear

  Backend                             Node.js + Express.js + TypeScript

  Database                            PostgreSQL

  ORM/migrations                      Prisma

  API contract                        OpenAPI/Swagger; REST under
                                      `/api/v1`

  Media/object storage                S3-compatible storage or an
                                      approved managed provider

  Push notifications                  Firebase Cloud Messaging, when
                                      required

  Email                               Approved transactional email
                                      provider, when required

  Maps/geocoding                      Approved provider, with
                                      location-data minimization

  Hosting                             Linux VPS or managed hosting with
                                      HTTPS, monitoring, backups, and
                                      staging/production separation
  -----------------------------------------------------------------------

Do not add every external provider at the start. Keep integrations
behind adapters and configure them only when the relevant milestone
needs them.

## 4. Milestones at a Glance

  -----------------------------------------------------------------------
  Phase                   Focus                   Exit condition
  ----------------------- ----------------------- -----------------------
  0                       Repository discovery    Current state and gaps
                          and decisions           documented

  1                       Project foundation and  Reproducible local
                          CI                      setup and baseline
                                                  checks

  2                       Data, API conventions,  Secure foundation
                          authentication,         tested
                          authorization           

  3                       Admin, verification,    Sensitive changes are
                          moderation, audit       controlled and
                                                  traceable

  4                       Public website and core Approved public content
                          directories             is discoverable

  5                       Events, calendar,       Community information
                          resources, media, seva  workflows work
                                                  end-to-end

  6                       Blood network           Consent, privacy,
                                                  expiry, and abuse
                                                  controls verified

  7                       Donation instructions   Recipient integrity and
                          and platform support    strict flow separation
                                                  verified

  8                       Flutter application     Agreed mobile workflows
                                                  work against the same
                                                  API

  9                       Notifications and       Failure handling,
                          operational hardening   monitoring, and
                                                  recovery tested

  10                      Beta, launch, and       Release gates met and
                          post-launch             ownership established
  -----------------------------------------------------------------------

The exact sequence may be adjusted based on the existing codebase and
dependencies. Do not expose high-risk features early merely to meet a
milestone date.

## 5. Phase 0 --- Repository Discovery and Planning

### Tasks

-   Inspect the current repository tree, branch, Git status, existing
    code, lockfiles, environment templates, and scripts.
-   Identify which apps/services already exist and whether any
    production/staging resources are configured.
-   Review current tests, lint/type-check scripts, build scripts, CI
    workflows, migrations, and deployment configuration.
-   Compare the implementation with the product documents.
-   Inventory missing environment variables and external providers
    without printing secret values.
-   Create a feature/requirement traceability matrix mapping PRD
    acceptance criteria to modules, tests, and release gates.
-   Record unresolved choices as architecture decision records (ADRs).

### Deliverables

-   Repository baseline report.
-   Current-state architecture and gap list.
-   Verified local setup instructions.
-   Initial backlog grouped by dependencies and risk.
-   List of unresolved decisions and external blockers.

### Exit criteria

-   Existing work and changes are understood and preserved.
-   No feature is incorrectly marked complete based on documentation
    alone.
-   High-risk data flows and release blockers are identified.

## 6. Phase 1 --- Project Foundation and CI

### Tasks

-   Establish or verify the agreed repository structure without forcing
    a migration if a workable structure already exists.
-   Configure environment templates with placeholder names only; never
    commit actual secrets.
-   Establish consistent formatting, linting, type checking, and test
    commands for TypeScript, Next.js, and Flutter.
-   Pin supported runtime/toolchain versions and use the repository's
    existing package manager and lockfiles.
-   Add CI checks for formatting/linting, type checks, unit tests, and
    production builds where feasible.
-   Add configuration validation and safe startup/health checks.
-   Establish development, staging, and production environment
    separation.
-   Add a basic README with setup, commands, architecture links, and
    troubleshooting.
-   Configure dependency and secret scanning where supported.

### Deliverables

-   Reproducible development environment.
-   CI pipeline with honest pass/fail reporting.
-   `.env.example` or equivalent safe configuration template.
-   Baseline health/readiness endpoints.
-   Documented developer commands.

### Exit criteria

-   A clean checkout can install dependencies and run documented checks.
-   Required environment variables fail fast with safe messages when
    absent.
-   No secrets are committed or exposed in client bundles.
-   CI does not suppress failing checks to appear green.

## 7. Phase 2 --- Database, API Conventions, Identity, and Authorization

### Tasks

-   Review and finalize initial Prisma models for users, profiles,
    roles/permissions, consent, and audit events.
-   Establish migration practices, constraints, indexes, and a safe
    development/staging database workflow.
-   Define the API response/error envelope, validation approach,
    pagination, request IDs, and OpenAPI conventions.
-   Implement authentication using a selected, documented strategy.
-   Implement server-side role and resource-level authorization.
-   Add account lifecycle, session expiry/revocation, recovery, and
    verified-contact behavior appropriate to the selected authentication
    design.
-   Apply rate limits and request-size limits to sensitive endpoints.
-   Add baseline tests for cross-account access, role escalation, mass
    assignment, and invalid input.

### Deliverables

-   Initial schema and reviewed migrations.
-   Versioned API skeleton.
-   Authentication and permission middleware.
-   OpenAPI baseline.
-   Authorization test matrix.

### Exit criteria

-   Protected endpoints deny access by default.
-   Client-supplied role, owner, verification, and payment-status fields
    cannot grant privileges.
-   Migrations can be applied to a disposable/staging database.
-   Cross-account and cross-role tests pass.
-   Secrets and authentication data are handled safely.

## 8. Phase 3 --- Admin, Verification, Moderation, and Audit

### Tasks

-   Implement protected admin routes and least-privilege permissions.
-   Build organization/record submission and review workflows.
-   Separate verification status from publication status.
-   Implement reports, correction requests, takedown/suspension, and
    review queues.
-   Keep verification evidence private and issue short-lived access only
    after server-side authorization.
-   Add audit events for role changes, verification decisions, sensitive
    edits, suspensions, and payment-instruction changes.
-   Provide safe admin states for pending, approved, rejected,
    suspended, and needs-review records.
-   Add MFA for privileged users where supported by the selected auth
    provider.
-   Test unauthorized admin access and cross-organization editing.

### Deliverables

-   Admin shell and permission checks.
-   Review/moderation workflows.
-   Restricted evidence storage/access.
-   Audit event model and admin history views.
-   Moderation runbook.

### Exit criteria

-   Only authorized reviewers can approve sensitive records.
-   Organization representatives can manage only permitted records.
-   Public pages never expose internal notes or evidence.
-   Sensitive actions are auditable.
-   Report and suspension flows have been tested.

## 9. Phase 4 --- Public Website and Core Directories

### Tasks

-   Implement the approved design tokens, navigation, typography,
    responsive layout, and shared UI components from `DESIGN.md`.
-   Build the public site shell, error/not-found pages, loading states,
    and accessible navigation.
-   Implement directory and detail pages for approved temples, trusts,
    organizations, community listings, bhojanalays, dharamshalas, and
    pilgrimage places.
-   Add search, filters, pagination, location display, and source/review
    information where appropriate.
-   Enforce publication and verification rules on the server.
-   Add metadata, canonical URLs, structured data, sitemap generation,
    and social previews according to `SEO.md`.
-   Ensure empty, pending, rejected, suspended, and private records are
    not accidentally public.
-   Add useful share links and mobile web fallbacks.

### Deliverables

-   Search-friendly public website.
-   Core directory pages and detail pages.
-   Moderated publication workflow.
-   Public SEO and accessibility checks.

### Exit criteria

-   Public pages render useful content without requiring app
    installation.
-   Only eligible records are public and indexable.
-   Metadata and structured data match visible, supported facts.
-   Search is paginated and does not reveal sensitive fields.
-   Core pages work on mobile and desktop with keyboard-accessible
    controls.

## 10. Phase 5 --- Events, Jain Calendar, Resources, Media, and Seva

### Tasks

-   Implement event creation, review, publication, updates,
    cancellation, and expiry.
-   Implement calendar entries with source attribution and
    tradition/calendar context where needed.
-   Add resource pages for approved guides, articles, books, and
    official links.
-   Add guru profiles with sourced biographies and review workflows.
-   Add authorized pravachan videos, official livestream links, and
    temple darshan resources.
-   Add seva/charity initiative pages and organization
    ownership/verification where applicable.
-   Implement event reminders only after preference, scheduling,
    deduplication, and cancellation behavior is defined.
-   Add report/correction paths for inaccurate information.
-   Validate all external links and supported video hosts.

### Deliverables

-   Event and calendar workflows.
-   Resource and guru profiles.
-   Authorized media directory.
-   Seva initiative directory.
-   Source attribution and review metadata.

### Exit criteria

-   Events have valid time ranges, timezone handling, and cancellation
    behavior.
-   Calendar information is sourced and does not incorrectly imply one
    interpretation is universal.
-   No unauthorized stream or media is published.
-   Public structured data reflects the actual page.
-   Reminders cannot be sent repeatedly due to retries and respect user
    preferences.

## 11. Phase 6 --- Blood Network

**Risk level:** High. Do not release publicly until all exit criteria
pass.

### Tasks

-   Finalize consent language, permitted uses, public/private fields,
    contact workflow, expiry intervals, and retention policy.
-   Implement explicit opt-in and record consent version/time.
-   Implement donor availability controls: pause, update, withdraw, and
    re-confirmation.
-   Implement privacy-safe search by blood group and broad location.
-   Implement blood requests with review state, expiry, cancellation,
    fulfilment, and reporting.
-   Implement controlled donor/requester contact with rate limits and
    expiry.
-   Prevent donor contact details from appearing in public pages, URLs,
    analytics, logs, metadata, sitemaps, and notifications.
-   Add anti-enumeration behavior, abuse controls, and moderation
    escalation.
-   Add tests for consent withdrawal, cross-account access, expired
    requests, repeated contact, and private-field exposure.

### Deliverables

-   Consent-based donor enrollment.
-   Privacy-safe search.
-   Time-bounded blood requests.
-   Controlled contact and reporting workflows.
-   Retention/withdrawal procedures and security test evidence.

### Exit criteria

-   No public endpoint exposes donor contact details by default.
-   Consent withdrawal immediately disables discovery/contact access as
    specified.
-   Expired/closed requests are excluded from active results.
-   Unauthorized cross-user and cross-role access tests pass.
-   The product does not claim medical compatibility or guaranteed
    availability.
-   Privacy and abuse controls are verified before public launch.

## 12. Phase 7 --- Donation Instructions and Optional Platform Support

**Risk level:** High. Treat payment recipient integrity as a release
blocker.

### A. Temple/trust donation instructions

Tasks:

-   Define required proof for organization identity, representative
    authority, and payment recipient.
-   Implement a submission and review process for QR codes, payment
    URLs, and other approved instructions.
-   Store evidence privately and maintain an audit trail.
-   Require re-review whenever payment destination details change.
-   Show recipient identity and intended purpose clearly on the public
    page.
-   Add report/suspension flow for suspected fraud.
-   Ensure the app never claims payment success based only on QR
    display, scan, redirect, or return from a payment app.

### B. Optional JainConnect support

Tasks:

-   Implement a distinct support configuration and user-facing
    explanation of platform operating costs.
-   Keep support entirely optional; core features remain accessible
    without contributing.
-   Use separate API routes, permissions, admin views, data records, and
    analytics from temple/trust donation instructions.
-   Decide whether the initial release only displays a verified QR or
    uses a trusted payment integration.
-   Do not record a payment as confirmed unless a trusted source
    confirms it.
-   Complete applicable legal, accounting, and tax review before
    collecting or processing funds.

### Deliverables

-   Verified temple/trust payment-instruction workflow.
-   Separate optional platform-support page/configuration.
-   Audit trail and fraud-reporting path.
-   Clear recipient and purpose labels.

### Exit criteria

-   Temple/trust funds are paid directly to the verified recipient and
    never routed through JainConnect/NovaEdge operating accounts.
-   The two flows cannot be confused in UI, API, storage, admin, or
    analytics.
-   Unauthorized payment-detail changes cannot go live.
-   No false payment-success, receipt, or tax-deductibility claims
    exist.
-   Core features remain available to users who decline platform
    support.

## 13. Phase 8 --- Flutter Android Application

### Tasks

-   Establish the app shell, navigation, theme, API client, error
    handling, and session lifecycle.
-   Implement public directory, temple, event, resource, guru, and
    pilgrimage browsing.
-   Implement authentication and account/profile features as defined in
    the PRD.
-   Implement the blood network only after its backend privacy and
    authorization gates pass.
-   Add donation instructions and optional platform support using the
    same strict separation as the web experience.
-   Implement share links and verified app deep links with safe web
    fallbacks.
-   Add push notifications only after preferences, token lifecycle,
    deduplication, and privacy-safe payloads are implemented.
-   Add offline-friendly behavior only for appropriate public content;
    avoid persistent sensitive donor data.
-   Add widget, state, navigation, and critical journey tests.

### Deliverables

-   Flutter Android application integrated with the shared API.
-   Consistent design and accessible mobile interactions.
-   Safe session/deep-link behavior.
-   Android build and release configuration.

### Exit criteria

-   Core agreed mobile journeys work on supported Android targets.
-   Session expiry, network failure, permission denial, and sign-out are
    handled safely.
-   Sensitive data is not stored unnecessarily or exposed in
    notifications.
-   API authorization remains effective regardless of client behavior.
-   A signed release build can be produced from documented instructions.

## 14. Phase 9 --- Notifications and Operational Hardening

### Tasks

-   Add the required transactional email and push integrations through
    adapters.
-   Implement idempotent jobs for request expiry, reminders, cleanup,
    and other scheduled work.
-   Add deduplication and retry policies with bounded retries.
-   Add structured logs, request IDs, error monitoring, health/readiness
    checks, and privacy-safe metrics.
-   Add database/object-storage backups and a tested restore procedure.
-   Configure production HTTPS, secure headers, CORS/CSRF as applicable,
    rate limits, database access controls, and upload protections.
-   Verify secret management, dependency scanning, and CI/CD
    permissions.
-   Test external-provider outages and graceful degradation.
-   Document deployment, migration, rollback, incident response, and
    recovery.

### Deliverables

-   Operational monitoring and alerts.
-   Reliable scheduled jobs and notification handling.
-   Backup/restore evidence.
-   Deployment and incident runbooks.
-   Security review findings and remediation status.

### Exit criteria

-   Critical failures are observable without logging sensitive data.
-   Jobs can retry without creating uncontrolled duplicates.
-   Restore and rollback procedures have been exercised in a safe
    environment.
-   External-provider failures do not falsely report success.
-   Production configuration and access controls have been reviewed.

## 15. Phase 10 --- Beta, Launch, and Post-Launch

### Pre-beta

-   Invite a limited set of community members and authorized
    organizational representatives.
-   Test usability, correctness, moderation, and privacy with synthetic
    or consented test data.
-   Review reported content and correction workflows.
-   Validate public information with sources and review dates.
-   Fix high-severity bugs before expanding access.

### Pre-production launch

-   Complete all applicable threat-model release gates.
-   Verify backups, restore, rollback, alerting, and incident response.
-   Review app signing, package identity, store metadata, privacy
    disclosures, and permissions.
-   Review web metadata, indexing, sitemap, structured data,
    accessibility, and performance.
-   Confirm authorized media and recipient/payment details.
-   Confirm all external provider credentials and policies are
    production-ready.
-   Publish only the features whose required controls are implemented
    and tested.

### Post-launch

-   Monitor errors, latency, abuse, stale listings, expired requests,
    moderation backlog, and provider costs.
-   Establish a cadence for rechecking temple/trust details, donation
    instructions, and time-sensitive listings.
-   Review user reports and privacy requests.
-   Track feature adoption with privacy-minimizing metrics.
-   Prioritize fixes based on user harm, security, correctness, and
    operational risk.
-   Revisit the threat model after major changes or incidents.

## 16. Cross-Cutting Workstreams

These tasks run throughout all phases rather than being deferred to the
end.

### Security and privacy

-   Threat-model-driven implementation and tests.
-   Least privilege and resource-level authorization.
-   Data minimization, retention, consent, and deletion.
-   Secret handling, secure configuration, and dependency updates.
-   Safe logs, analytics, caches, notifications, and file storage.

### Design and accessibility

-   Follow `DESIGN.md`.
-   Support responsive layouts, keyboard navigation, readable contrast,
    screen readers, and scalable text.
-   Provide loading, empty, error, offline, success, and denied states.
-   Avoid color-only status and unnecessary animation.

### SEO and content quality

-   Follow `SEO.md`.
-   Use accurate sources, review dates, canonical URLs, and structured
    data that matches visible content.
-   Exclude private and low-quality records from indexing.
-   Do not promise rankings or AI citations.

### Quality engineering

-   Unit, integration, authorization, privacy, web/mobile, and
    end-to-end tests.
-   Migration and restore checks.
-   Reproducible CI and honest reporting.
-   Synthetic test data and no real donor data in fixtures.

### Operations and cost

-   Use a small, maintainable initial architecture.
-   Monitor hosting, database, object storage, email, notification, and
    maps costs.
-   Add quotas and alerts before enabling potentially expensive public
    features.
-   Avoid building custom streaming or microservices without a justified
    need.

## 17. Requirement-to-Evidence Tracking

Maintain a live tracker with at least these columns:

  -----------------------------------------------------------------------
  Field                               Purpose
  ----------------------------------- -----------------------------------
  Requirement ID                      Stable reference to the PRD
                                      acceptance criterion

  Feature/module                      Product area

  Phase                               Planned implementation milestone

  Status                              `NOT_STARTED`, `IN_PROGRESS`,
                                      `BLOCKED`, `IMPLEMENTED`,
                                      `VERIFIED`

  Implementation references           Relevant files, PRs, or commits

  Tests/checks                        Automated or manual verification
                                      evidence

  Owner                               Responsible person/team

  Blocker/dependency                  External service, decision, or
                                      prerequisite

  Residual risk                       Remaining limitations

  Last updated                        Date of evidence-backed update
  -----------------------------------------------------------------------

Use `IMPLEMENTED` only when code is present and reviewed. Use `VERIFIED`
only when the required checks pass. A task blocked by missing
credentials, hardware, provider access, or legal review must remain
blocked with the exact reason.

## 18. Definition of Done

A feature is done only when all applicable conditions are satisfied:

-   It meets the relevant PRD acceptance criteria.
-   Its authorization and privacy behavior is implemented server-side.
-   Inputs and external data are validated.
-   Loading, empty, error, and failure states are handled.
-   Relevant tests pass.
-   Lint, type checks, and builds pass where available.
-   API/OpenAPI, database schema, and documentation are updated as
    needed.
-   SEO/indexing behavior is correct for public content.
-   Accessibility and responsive behavior are checked.
-   Logs and analytics do not expose sensitive data.
-   Security implications and threat-model controls are reviewed.
-   The final diff contains no unrelated changes or secrets.
-   Limitations and unverified behavior are reported accurately.

## 19. Recommended First Sprint

Start with a discovery and foundation sprint, not all feature
development at once:

1.  Inspect the repository and preserve the working tree.
2.  Map current code to `PRD.md` and this plan.
3.  Identify existing scripts, migrations, tests, and deployment
    resources.
4.  Finalize only the architecture decisions needed for the first
    vertical slice.
5.  Establish a clean development setup and CI checks.
6.  Implement or validate a minimal API health endpoint and database
    connectivity.
7.  Define the first reviewed schema migration for identity and
    authorization.
8.  Add tests for configuration, health checks, and baseline access
    control.
9.  Record blockers and publish a short evidence-based status report.

After the first sprint, choose the next work based on dependency order
and risk. Do not start a sensitive blood or donation workflow before its
verification and authorization foundations are ready.

## 20. Related Documents

-   `AGENTS.md`
-   `PRD.md`
-   `ARCHITECTURE.md`
-   `DATA_MODEL.md`
-   `THREAT_MODEL.md`
-   `DESIGN.md`
-   `SEO.md`
-   `JainConnect-Product-Overview.md`
-   `API_SPEC.md` --- planned
-   `DEPLOYMENT.md` --- planned

## 21. Final Principle

Build JainConnect in verifiable increments. Preserve the complete
product vision while sequencing work according to dependencies and risk.
Do not trade donor privacy, organizational verification,
donation-recipient integrity, or honest status reporting for faster
delivery.
