# AGENTS.md --- JainConnect Engineering Guidelines

This file defines the working rules for AI coding agents and
contributors working in the JainConnect repository. Follow these
instructions before making changes. If the repository already contains
established conventions that do not conflict with these rules, preserve
them.

## 1. Product Context

JainConnect is a free, community-first platform for discovering Jain
community information and services, including temples, trusts, gurus,
events, Jain calendar resources, pravachans, blood-donation resources,
bhojanalays, dharamshalas, pilgrimage information, and verified
charity/seva initiatives.

NovaEdge Digital Labs is the technology partner and should be credited
transparently. The platform must prioritize usefulness, accuracy, trust,
accessibility, privacy, and sustainable operations over promotion.

All agreed product modules remain in the product scope. Implement them
in phases when needed; do not silently remove features from the product
vision because they are not part of the current milestone.

## 2. Documentation Hierarchy

Before implementing a feature, read the relevant project documentation:

-   `JainConnect-Product-Overview.md` --- product context, feature
    inventory, architecture, and roadmap.
-   `PRD.md` --- functional requirements, user roles, workflows,
    acceptance criteria, risks, and release gates.
-   `DESIGN.md` --- visual system, UI patterns, responsive behavior, and
    accessibility direction.
-   `SEO.md` --- technical SEO, public discovery, metadata, structured
    data, AEO/GEO, and indexing rules.
-   `AGENTS.md` --- repository-wide instructions for agents and
    contributors.

If a referenced file is absent, do not pretend it was read. Inspect the
repository, use the available documentation, and report any material
gap. When documents appear to conflict, preserve security/privacy and
explicit product constraints first, then raise the conflict rather than
silently choosing a risky interpretation.

## 3. Approved Technology Direction

Use the following stack unless the repository or an explicit project
decision establishes a justified alternative:

-   **Android app:** Flutter and Dart.
-   **Public website:** Next.js App Router and TypeScript.
-   **Admin dashboard:** Next.js and TypeScript, with protected routes
    and server-side authorization.
-   **Backend API:** Node.js, Express.js, and TypeScript.
-   **Primary database:** PostgreSQL.
-   **ORM and migrations:** Prisma.
-   **API contract:** OpenAPI/Swagger, versioned under `/api/v1`.
-   **Media storage:** S3-compatible object storage or an approved
    managed media provider.
-   **Push notifications:** Firebase Cloud Messaging where appropriate.
-   **Video:** Authorized embeds or official links first; do not build
    custom streaming infrastructure without an explicit requirement.
-   **Hosting:** Linux VPS or managed services with HTTPS, monitoring,
    backups, and staging/production separation.

Prefer the existing dependencies and patterns in the repository. Do not
introduce a new framework, state-management library, database, or
provider merely for personal preference. For Flutter, use the
state-management and navigation choices already established; if none
exist, document and choose one consistent approach before broad
implementation.

## 4. Required Working Process

For every task:

1.  Inspect the repository structure, current branch/status, relevant
    files, existing patterns, and available scripts before editing.
2.  Read the applicable requirements and identify the specific
    acceptance criteria.
3.  Make the smallest coherent change that solves the task. Avoid
    unrelated refactors and unnecessary dependency additions.
4.  Preserve existing user changes. Never reset, overwrite, delete, or
    reformat unrelated work.
5.  Validate input and enforce permissions on the server, not only in
    the UI.
6.  Add or update tests for changed behavior and edge cases.
7.  Run relevant formatting, linting, type checks, tests, builds, and
    migration checks that are available.
8.  Review the final diff for regressions, secrets, accidental generated
    files, privacy leaks, and unrelated changes.
9.  Update documentation when behavior, configuration, API contracts,
    schema, or operational procedures change.
10. Report what changed, what was verified, what could not be verified,
    and any remaining blockers. Never claim a check passed unless it was
    actually run and passed.

Do not stop after making code changes if practical verification is
available. If a command cannot run because a dependency, credential,
provider, device, or environment is unavailable, record the exact
blocker and do not fabricate results.

## 5. Architecture and Code Quality

-   Keep business logic out of presentation components where practical.
-   Use clear module boundaries for authentication, directories,
    temples, gurus, events, resources, blood network, media, donations,
    support, charity, notifications, and moderation.
-   Use strict typing and avoid `any` or untyped dynamic data unless a
    documented integration boundary requires it.
-   Validate untrusted inputs at API boundaries using the project's
    established validation library.
-   Keep API responses and error formats consistent.
-   Use pagination for potentially large lists; do not load entire
    directories by default.
-   Use database constraints, foreign keys, and transactions where
    needed to preserve integrity.
-   Avoid N+1 database queries and unbounded queries.
-   Keep configuration in environment variables or the project's
    approved secret manager. Validate required configuration at startup.
-   Never commit secrets, production credentials, private keys, real
    donor data, or private verification documents.
-   Avoid hard-coded URLs, IDs, credentials, and provider assumptions
    when configuration or persisted data is appropriate.
-   Use stable IDs and canonical public URLs for public records.
-   Document important architectural choices and non-obvious trade-offs.

## 6. Database and API Rules

-   PostgreSQL is the primary source of truth; Prisma schema and
    migrations must stay aligned.
-   Make schema changes through reviewed migrations. Do not modify
    production data manually as a substitute for a migration.
-   Consider migration safety, indexes, uniqueness, nullability,
    deletion behavior, and existing records.
-   Do not use destructive migrations without a clear need, an impact
    assessment, and a safe rollout/backup plan.
-   Use `/api/v1` for versioned REST endpoints unless an existing
    documented contract says otherwise.
-   Validate query parameters, request bodies, uploaded files, and route
    parameters.
-   Apply server-side authentication, authorization, rate limits, and
    audit logging to sensitive routes.
-   Return only fields that the caller is authorized to access.
-   Use consistent pagination, filtering, sorting, and error
    conventions.
-   Document API changes in OpenAPI and keep client types/contracts
    synchronized where the repository supports it.
-   Use idempotency or duplicate protection for operations that may be
    retried, especially requests, notifications, and any future
    payment-related integration.

## 7. Privacy, Safety, and Trust

### Blood network

-   Obtain explicit, understandable consent before adding someone to the
    donor network.
-   Provide donor pause, availability update, and removal/withdrawal
    controls.
-   Do not expose personal phone numbers, exact locations, private
    profiles, or sensitive details publicly by default.
-   Prefer city/approximate-area search and privacy-safe contact flows.
-   Expire or clearly close stale requests; do not keep expired requests
    in active results.
-   Do not claim that a donor is available, medically eligible, or
    compatible unless the relevant fact is current and appropriately
    confirmed.
-   Do not replace medical professionals, hospitals, or authorized blood
    banks.

### Verification and moderation

-   Distinguish `pending`, `verified`, `rejected`, `suspended`, and
    `needs review` states where applicable.
-   A verification badge means a defined review was completed; it does
    not guarantee that every listing detail is permanently correct.
-   Keep evidence private and accessible only to authorized reviewers.
-   Provide reporting and correction paths for important public records.
-   Log sensitive moderation and verification actions with actor,
    timestamp, target, and a useful change summary.
-   Do not invent facts, affiliations, endorsements, event dates,
    timings, contact details, or credentials. Mark missing information
    as unknown or request a source.

### Content and media

-   Use images, books, articles, recordings, and streams only when
    public use is authorized or otherwise permitted.
-   Prefer official sources and links; attribute sourced material.
-   Do not imply that a guru, temple, trust, or organization endorses
    JainConnect without authorization.
-   Provide a correction/takedown process where relevant.

## 8. Strict Donation Boundaries

There are two distinct flows and they must remain separate in the UI,
API, database, admin dashboard, analytics, and operational
documentation.

### Temple/trust donations

-   Payments must go directly to the selected temple or trust using that
    recipient's verified payment details.
-   Never route temple/trust donations through JainConnect or NovaEdge
    Digital Labs maintenance accounts.
-   Verify the recipient and representative authority before publishing
    payment details.
-   Re-review changes to QR codes or payment details and record an audit
    trail.
-   Clearly identify the recipient and purpose before showing payment
    instructions.
-   A displayed QR code or a user returning from a payment app is not
    proof of payment success.
-   Do not claim tax deductibility or receipt availability without
    appropriate verification.

### JainConnect maintenance support

-   Contributions are optional and intended for JainConnect operating
    expenses such as hosting, domain, storage, backups, security, and
    maintenance.
-   Core features must not be blocked when a user declines to
    contribute.
-   Keep maintenance-support settings and records separate from
    temple/trust donation records.
-   Never use coercive prompts, misleading urgency, or ambiguous
    recipient labels.
-   Any payment integration or public collection flow must receive
    appropriate legal, accounting, and tax review before launch.

Do not merge these flows to simplify implementation.

## 9. Web, SEO, AEO, and GEO Rules

-   Public pages must render useful, indexable content without requiring
    app installation or client-side interaction for the primary
    information.
-   Use unique, accurate titles and descriptions, canonical URLs,
    correct status codes, social preview metadata, and appropriate
    structured data.
-   Structured data must describe content actually visible on the page.
    Do not fabricate ratings, reviews, prices, opening hours, event
    status, verification, or organization relationships.
-   Generate sitemaps from eligible public records only.
-   Do not index private profiles, donor records, blood requests
    containing personal data, admin routes, account pages, internal
    evidence, or low-value/empty pages.
-   Use `noindex` or appropriate access controls where required;
    `robots.txt` alone is not access control.
-   Avoid doorway pages, keyword stuffing, duplicated city pages, fake
    FAQs, and mass-generated thin content.
-   For AEO/GEO, use clear factual headings, concise direct answers,
    accurate entities, source attribution, dates, and editorial review.
    Do not promise AI citations or rankings.
-   For local discovery, publish address and hours only when
    sufficiently verified and current.
-   Optimize performance, image sizes, accessibility, and Core Web
    Vitals without sacrificing correctness or usability.
-   App deep links must have functional web fallbacks.
-   Never place private data, access tokens, or personal medical/contact
    details in metadata, URLs, analytics events, or share previews.

## 10. Design and Accessibility

-   `DESIGN.md` is the source of truth for colors, typography, spacing,
    layouts, components, and responsive behavior.
-   Avoid inventing a second visual system or replacing the approved
    palette without an explicit design decision.
-   Prefer clear, restrained, community-oriented UI over generic
    template styling or excessive effects.
-   Provide loading, empty, error, offline/unavailable, success, and
    permission-denied states for meaningful workflows.
-   Use accessible labels, logical focus order, keyboard navigation on
    web, readable contrast, scalable text, and screen-reader semantics.
-   Do not communicate status using color alone.
-   Respect reduced-motion preferences and avoid unnecessary animation.
-   Keep critical actions such as blood requests, reporting, and
    donation recipient identification clear and unobstructed.
-   Ensure mobile layouts work on small screens and handle long
    Indic-language text gracefully.

## 11. Authentication and Authorization

-   Public browsing should remain available where the product
    requirements allow it.
-   Protect account, donor-management, submission, verification,
    moderation, and admin actions.
-   Enforce role and resource-level permissions on the server for every
    protected operation.
-   Do not trust role names or ownership IDs supplied by the client.
-   Prevent insecure direct object reference issues by checking access
    to the specific resource.
-   Use secure token/session storage and appropriate expiry/revocation
    behavior.
-   Apply rate limits and abuse controls to sign-in, account recovery,
    reporting, search, and submission endpoints.
-   Keep admin access least-privileged and log sensitive administrative
    actions.

## 12. Testing Expectations

Add or update tests appropriate to the change:

-   **Unit tests:** validation, business rules, permission decisions,
    date/expiry logic, and pure functions.
-   **Integration tests:** API/database interactions, authorization,
    migrations, and provider failure handling.
-   **End-to-end tests:** key user journeys and critical release gates.
-   **Flutter tests:** widget/state behavior and important navigation
    flows.
-   **Web tests:** public page rendering, metadata,
    accessibility-critical controls, and protected admin behavior.
-   **Security/privacy tests:** cross-user access, donor data exposure,
    unauthorized edits, upload restrictions, and role escalation.
-   **SEO tests:** canonical URLs, status codes, structured-data
    accuracy, sitemap eligibility, and private-page exclusion.

Use synthetic test data. Never use real donor or sensitive community
data in tests, screenshots, fixtures, or logs. If the repository lacks a
test framework, do not introduce a large testing stack without assessing
the smallest useful option.

## 13. Observability and Operations

-   Use structured logs with request/correlation IDs where practical.
-   Do not log passwords, access tokens, payment credentials, private
    donor data, or verification documents.
-   Add health/readiness checks and meaningful error reporting.
-   Monitor API, database, storage, notification, and external
    media-provider failures.
-   Configure automated backups and periodically verify restoration.
-   Keep development, staging, and production configuration separate.
-   Document deployment, rollback, migration, backup, restore, and
    incident-response steps.
-   Set sensible quotas and monitor storage, bandwidth, and provider
    costs.

## 14. Dependencies and Tooling

-   Inspect `package.json`, lockfiles, Flutter/Dart configuration, and
    repository scripts before running commands.
-   Use the package manager already selected by the lockfile; do not mix
    package managers.
-   Prefer maintained, minimal dependencies and review permissions,
    license, maintenance, and security implications.
-   Do not run broad automated upgrades or rewrite lockfiles unless the
    task requires it.
-   Do not suppress lint/type/test errors to make checks appear green.
-   Do not disable security controls to bypass a failing test.
-   Avoid generating large files, build artifacts, secrets, or local
    environment files in source control.

## 15. Git and Change Management

-   Inspect `git status` before changes and again before finishing.
-   Preserve unrelated staged and unstaged changes.
-   Do not use destructive Git commands such as `reset --hard`, forced
    checkout, or broad cleanup commands unless explicitly requested and
    safe.
-   Keep changes focused and reviewable.
-   Do not commit or push unless explicitly requested.
-   Do not mark TODOs as complete without evidence.
-   If a task is blocked, implement safe independent parts and document
    the exact blocker rather than inventing configuration or
    credentials.

## 16. Completion Report

At the end of each task, provide a concise report containing:

1.  Summary of changes.
2.  Files created or modified.
3.  Checks actually run and their results.
4.  Known limitations, unverified behavior, and blockers.
5.  Any required follow-up decision.

Distinguish clearly between implemented, tested, and
production-verified. Never claim that deployment, device testing,
payment verification, or external-provider behavior succeeded unless
evidence confirms it.

## 17. Final Rule

When uncertain, preserve user data and existing work, prefer the least
risky change, follow the documented product requirements, and ask for
clarification before making irreversible decisions or changing privacy,
payment, verification, or security behavior.
