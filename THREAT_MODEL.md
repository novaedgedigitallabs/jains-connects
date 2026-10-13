# THREAT_MODEL.md --- JainConnect Security Threat Model

**Status:** Initial threat model for design and implementation\
**Scope:** Public website, Flutter Android app, backend API, database,
admin/moderation tools, object storage, notifications, external
integrations, and operational infrastructure.

This document identifies plausible threats and required mitigations. It
is not a completed security audit, penetration test, or claim that the
controls are already implemented. Validate each control against the
actual repository and deployment.

## 1. Objectives

JainConnect must protect:

-   Community members' accounts and personal information.
-   Blood donors and people requesting blood assistance.
-   Private verification evidence and internal moderation records.
-   The integrity of temple, trust, guru, event, and community listings.
-   Temple/trust payment instructions and recipient identity.
-   The separate optional JainConnect operating-cost support flow.
-   Admin privileges, service credentials, availability, and platform
    reputation.
-   The accuracy and authorized use of public content and media.

Security must preserve the platform's community purpose and avoid
unnecessary collection of sensitive data.

## 2. Scope and Assumptions

### In scope

-   Next.js public website and admin experience.
-   Flutter Android client.
-   Node.js/Express TypeScript API.
-   PostgreSQL and Prisma migrations.
-   Object storage and media delivery.
-   Authentication, sessions, authorization, and account recovery.
-   Blood donor consent, search, contact, and request lifecycle.
-   Organization verification and moderation.
-   Donation instructions and platform support.
-   Email, push notifications, maps/geocoding, analytics, and video
    providers.
-   Deployment, CI/CD, logs, backups, and administrator access.

### Assumptions to validate

-   Clients communicate with the API over HTTPS.
-   Public content can be read without an account where product
    requirements permit it.
-   Sensitive operations require server-side authentication and
    authorization.
-   Third-party providers may fail, be misconfigured, or return
    malicious/unexpected data.
-   Users may make mistakes or act abusively; privileged accounts may be
    compromised.
-   The system may initially run as a modular monolith. Microservices
    are not assumed.
-   Actual identity provider, hosting provider, payment capability,
    retention schedule, and production controls are not yet established
    by this document.

## 3. Assets and Security Requirements

  -----------------------------------------------------------------------
  Asset                   Security objective      Impact if compromised
  ----------------------- ----------------------- -----------------------
  User accounts and       Confidentiality,        Account takeover,
  sessions                integrity, availability impersonation,
                                                  unauthorized changes

  Donor profiles and      Strict confidentiality  Harassment, unwanted
  contact details         and consent             contact, privacy harm

  Blood requests          Integrity, limited      Fraud, misinformation,
                          disclosure, freshness   unsafe or stale
                                                  requests

  Verification evidence   Restricted              Identity theft,
                          confidentiality and     impersonation, fraud
                          integrity               

  Organization and temple Integrity and           False listings,
  records                 authenticity            reputational harm

  Donation QR/payment     Integrity,              Funds sent to
  details                 authenticity,           fraudulent recipients
                          availability            

  Platform-support        Integrity and clear     Misleading collection
  configuration           recipient identity      or misdirected funds

  Admin roles and         Confidentiality and     Widespread compromise
  credentials             integrity               and malicious changes

  Public content and      Integrity,              Misinformation,
  media                   authorization,          copyright complaints,
                          availability            reputational harm

  Database, storage, and  Confidentiality,        Data exposure,
  backups                 integrity,              corruption, prolonged
                          recoverability          outage

  Secrets and signing     Confidentiality and     Service impersonation
  keys                    integrity               and data compromise

  Audit logs              Integrity and           Loss of accountability
                          controlled              or exposure of private
                          confidentiality         data
  -----------------------------------------------------------------------

## 4. Trust Boundaries

1.  **Public internet → web application:** All input is untrusted; apply
    safe rendering, validation, rate limits, and secure headers.
2.  **Web/mobile clients → API:** Clients can be modified. Never trust
    client-side role checks, validation, ownership, or payment status.
3.  **API → database:** Use least-privilege database credentials,
    parameterized ORM operations, constraints, and reviewed migrations.
4.  **API → object storage:** Separate public assets from private
    evidence; scope access and use short-lived signed links where
    appropriate.
5.  **Admin → privileged APIs:** Require dedicated authorization, strong
    authentication, least privilege, and audit records.
6.  **User submissions → public content:** Treat submissions as
    untrusted until validated, reviewed, and approved.
7.  **JainConnect → third-party providers:** Minimize shared data,
    validate responses, use timeouts, and keep provider credentials
    private.
8.  **Donation recipient → user payment app:** JainConnect may display
    verified instructions but must not infer payment success from a QR
    scan or redirect.
9.  **Production → development/analytics/logs:** Do not copy real donor
    data, private evidence, credentials, or unrestricted production
    dumps into lower-trust environments.

## 5. Threat Rating Method

Use qualitative ratings until there is enough evidence for a
quantitative risk model.

-   **Critical:** Could expose sensitive donor/evidence data at scale,
    enable broad account/admin takeover, or redirect donations to
    fraudulent recipients.
-   **High:** Serious privacy, integrity, fraud, privilege-escalation,
    or availability impact.
-   **Medium:** Limited impact, meaningful abuse potential, or an
    important control weakness with restricted reach.
-   **Low:** Minor impact with limited reach and effective compensating
    controls.

Likelihood depends on exposure, exploitability, current controls, and
operational context. Ratings below are initial design priorities, not
measured probabilities. Reassess after implementation and testing.

## 6. Threat Register

### T1 --- Unauthorized donor data disclosure

**Initial severity:** Critical\
**Threat:** Public search, an API response, a log, cache, analytics
event, export, or share preview reveals donor phone numbers, exact
location, or other private data.

**Mitigations** - Keep donor data in a restricted domain separate from
public profiles. - Return an explicit allowlist of fields for each
response; do not serialize database objects wholesale. - Require an
approved contact workflow and current consent before disclosing contact
information. - Use city/approximate-area search by default; avoid exact
public coordinates. - Exclude donor records and sensitive requests from
sitemap, JSON-LD, metadata, search indexing, analytics, and public
caches. - Redact sensitive fields from logs, error reports, traces, and
push notifications. - Add automated tests that assert private fields
never appear in anonymous or unauthorized responses.

**Verification evidence** - Anonymous and cross-account API tests. -
Cache and page-source review. - Log/analytics payload review. - Consent
withdrawal and removal tests.

### T2 --- Donor contact abuse, scraping, or harassment

**Initial severity:** High\
**Threat:** An attacker enumerates donors or requests, sends bulk
contact attempts, or uses exposed contact details for harassment.

**Mitigations** - Do not expose unrestricted donor lists or bulk
exports. - Rate-limit search, contact requests, account creation, and
repeated actions by multiple signals. - Use pagination, abuse detection,
CAPTCHA or equivalent challenge only when justified by risk. - Provide
block/report, pause, withdrawal, and moderator escalation mechanisms. -
Require minimal account assurance before sensitive contact actions. -
Apply contact-request quotas and expiration. - Avoid revealing whether a
particular person is registered as a donor through error messages or
timing.

**Verification evidence** - Enumeration and rate-limit tests. -
Repeated-contact and account-abuse scenarios. - Donor withdrawal and
report-handling tests.

### T3 --- Stale, fake, or malicious blood request

**Initial severity:** High\
**Threat:** Fake requests, outdated requests, false hospital details, or
malicious content misleads users.

**Mitigations** - Validate required fields and enforce request lifecycle
states. - Use review/moderation appropriate to exposure and risk. - Set
and enforce expiry; exclude expired/closed requests from active
results. - Allow reporting and requester cancellation. - Show freshness
and verification status honestly. - Avoid claims of medical
compatibility, guaranteed donor availability, or clinical outcomes. -
Apply abuse limits and audit sensitive moderation actions.

**Verification evidence** - Expiry boundary tests, state-transition
tests, moderation tests, and report workflow tests.

### T4 --- Account takeover or insecure recovery

**Initial severity:** High\
**Threat:** Credential stuffing, weak recovery, leaked tokens, insecure
session handling, or phishing compromises member or administrator
accounts.

**Mitigations** - Use a maintained authentication implementation and
secure password hashing if local passwords are supported. - Rate-limit
login, verification, and recovery endpoints; avoid account-enumeration
responses. - Use short-lived access tokens or secure server-managed
sessions, with defined rotation/revocation behavior. - Store web cookies
with appropriate `HttpOnly`, `Secure`, and `SameSite` attributes when
cookie sessions are used. - Store mobile credentials using appropriate
platform-protected storage. - Require stronger authentication for
privileged users; use MFA for admins when supported. - Invalidate
sessions after security-sensitive changes and provide session revocation
where appropriate. - Never log passwords, one-time codes, session
cookies, or tokens.

**Verification evidence** - Authentication/recovery tests,
session-revocation tests, cookie configuration checks, and admin MFA
configuration review.

### T5 --- Broken authorization, IDOR, or privilege escalation

**Initial severity:** Critical\
**Threat:** A user changes a record ID, organization ID, role value, or
request payload to view or modify another user's record or perform a
privileged action.

**Mitigations** - Enforce role and resource-level authorization on every
protected API operation. - Resolve organization scope from verified
server-side membership, not request-supplied claims. - Deny by default
and use explicit permissions for sensitive operations. - Separate
reviewer, moderator, organization representative, and administrator
capabilities. - Use database transactions for sensitive state changes. -
Audit role grants/revocations, verification decisions, payment-detail
changes, and administrative overrides. - Add negative tests for every
role/resource combination.

**Verification evidence** - Cross-account and cross-organization
authorization matrix. - Direct-object-reference tests. - Role escalation
and mass-assignment tests.

### T6 --- Fraudulent temple/trust donation instructions

**Initial severity:** Critical\
**Threat:** An attacker replaces a QR code, changes a payment
identifier, impersonates a temple/trust, or publishes a misleading
recipient.

**Mitigations** - Verify the organization, representative authority,
recipient identity, and payment destination before publication. - Keep
new or changed instructions in a pending state until an authorized
reviewer approves them. - Re-review changes to QR images, payment URLs,
bank details, or recipient identifiers. - Display the verified recipient
name and purpose clearly beside payment instructions. - Store review
history and audit actor/time. - Restrict configuration changes to
least-privileged roles and consider dual approval for high-risk
changes. - Provide a fast suspension/reporting path for suspected
fraud. - Never infer successful payment from QR display, scan, redirect,
or return to the app. - Do not claim tax deductibility or receipt
issuance without verification.

**Verification evidence** - Unauthorized-change tests. - Re-review and
suspension tests. - Audit-log checks. - Manual recipient verification
procedure and evidence.

### T7 --- Confusion or mixing of temple donations and platform support

**Initial severity:** Critical\
**Threat:** UI labels, API routes, data tables, analytics, or payment
instructions blur the distinction between money sent directly to a
temple/trust and optional support for JainConnect expenses.

**Mitigations** - Use separate domain models, API routes, permissions,
admin views, and analytics. - Make the recipient and purpose explicit
before showing payment instructions. - Never route temple/trust
donations through JainConnect or NovaEdge operating accounts. - Keep
platform support optional and never block core functionality when
declined. - Do not mark QR-only contributions as confirmed without an
authoritative confirmation source. - Review collection, accounting, tax,
and legal requirements before enabling payment processing.

**Verification evidence** - UI/content review. - API and database
separation tests. - End-to-end tests for recipient labels and state
transitions. - Audit of any payment integration.

### T8 --- Private verification evidence exposure

**Initial severity:** High\
**Threat:** Identity documents, trust records, private contact details,
or internal reviewer notes become public through storage URLs, admin
endpoints, or logs.

**Mitigations** - Store evidence in private object storage with
least-privilege access. - Use short-lived signed URLs and verify
reviewer authorization before issuing them. - Keep evidence keys out of
public API responses. - Restrict reviewer access and log access where
practical. - Define retention and secure deletion policies. - Redact
evidence and personal details from logs and monitoring systems.

**Verification evidence** - Anonymous URL-access tests. - Signed-link
expiry tests. - Role-based evidence-access tests. - Retention/deletion
checks.

### T9 --- Malicious submissions, XSS, unsafe links, or upload abuse

**Initial severity:** High\
**Threat:** User content or uploaded files cause script execution,
phishing, malware distribution, resource exhaustion, or unsafe external
redirects.

**Mitigations** - Validate and normalize input on the server. - Escape
output in the relevant rendering context; sanitize rich text with a
maintained library if rich text is allowed. - Do not render arbitrary
HTML or untrusted embeds. - Allowlist URL schemes and supported video
hosts. - Validate file type, size, content, and upload permissions; use
generated object keys. - Keep unapproved uploads private and scan where
available. - Apply CSP and other security headers appropriate to the
app. - Prevent open redirects and unsafe `javascript:` or data URL use.

**Verification evidence** - XSS and URL-validation tests. - Upload
size/type tests. - Content-security-header review. - Unapproved-upload
access tests.

### T10 --- SQL injection, unsafe queries, or data corruption

**Initial severity:** High\
**Threat:** Untrusted input alters database queries or causes
unauthorized changes, data loss, or excessive resource consumption.

**Mitigations** - Use Prisma's parameterized APIs and avoid unsafe raw
SQL. - If raw SQL is required, parameterize values and review query
construction. - Validate inputs and limit query complexity. - Use
database constraints and transactions. - Run the application with a
least-privilege database role. - Review migrations and test against
disposable/staging databases. - Protect production backups and test
restoration.

**Verification evidence** - Query/input validation tests. - Database
privilege review. - Migration review and backup-restore drill.

### T11 --- Abuse of search, APIs, and expensive operations

**Initial severity:** Medium--High\
**Threat:** Scraping, spam, expensive search filters, oversized uploads,
or repeated notification requests degrade service or increase provider
costs.

**Mitigations** - Apply per-route rate limits and sensible request-size
limits. - Paginate results and bound page size, sorting, and filter
complexity. - Add query timeouts and appropriate database indexes. - Use
quotas for uploads, notifications, and third-party calls. - Add
idempotency/deduplication to retryable operations. - Monitor error
rates, latency, queue growth, and provider spending. - Add progressive
abuse controls instead of relying on a single IP-based limit.

**Verification evidence** - Rate-limit and load tests. - Query-plan
review for high-volume endpoints. - Quota and alert tests.

### T12 --- Misuse of admin tools or compromised privileged user

**Initial severity:** Critical\
**Threat:** An administrator account is compromised or a legitimate
insider changes records, roles, or donation details improperly.

**Mitigations** - Use least-privilege role separation. - Require MFA for
privileged access where supported. - Restrict administrative endpoints
and protect sessions. - Audit sensitive actions and make audit logs
resistant to ordinary modification. - Require a second reviewer for
high-risk payment recipient changes where feasible. - Alert on unusual
role grants, bulk changes, repeated failed sign-ins, and
donation-instruction updates. - Establish an account-disable and
incident-response process.

**Verification evidence** - Admin permission matrix. - MFA enforcement
check. - Audit tamper/access review. - Simulated privileged-account
compromise exercise.

### T13 --- Secrets or credentials leak through source, CI, logs, or client bundles

**Initial severity:** Critical\
**Threat:** Database credentials, signing keys, API tokens, or storage
credentials are committed or exposed to web/mobile clients.

**Mitigations** - Use protected environment configuration or an approved
secret manager. - Validate required configuration at startup without
printing secret values. - Scan commits and CI artifacts for secrets. -
Keep server-only environment variables separate from public client
configuration. - Rotate exposed credentials promptly and review access
logs. - Use separate credentials for development, staging, and
production. - Never place secrets in mobile assets; mobile binaries must
be treated as inspectable.

**Verification evidence** - Secret scanning. - Built-bundle
inspection. - CI configuration review. - Credential rotation procedure
test.

### T14 --- Cross-site request forgery, CORS, and web session weaknesses

**Initial severity:** Medium--High\
**Threat:** A malicious site triggers authenticated actions or overly
broad CORS/cookie settings enable unauthorized access.

**Mitigations** - Choose and document the authentication/session
model. - If cookie-based sessions are used, set secure cookie attributes
and use CSRF protection for state-changing requests where needed. - Use
an explicit CORS allowlist; do not reflect arbitrary origins. - Never
combine credentialed requests with unrestricted origins. - Validate
`Origin`/`Referer` where appropriate as a supplementary defense, not the
sole defense. - Protect logout, account changes, role changes, and
donation configuration actions.

**Verification evidence** - CORS tests for allowed and disallowed
origins. - CSRF tests for state-changing routes. - Cookie/session
configuration review.

### T15 --- Unsafe caching or CDN leakage

**Initial severity:** High\
**Threat:** A shared cache serves a private donor response,
authenticated profile, or admin page to another user.

**Mitigations** - Mark personalized and sensitive responses as
non-shared-cacheable. - Avoid caching API responses containing
authorization-dependent fields. - Use explicit cache keys and
purge/revalidation rules for public content. - Ensure server rendering
does not reuse private data across users. - Keep authorization checks
active even when content is cached. - Test cache behavior with two
distinct accounts and anonymous requests.

**Verification evidence** - HTTP header review. - Cross-user cache
tests. - SSR/cache configuration review.

### T16 --- Notification privacy leaks or duplicate abuse

**Initial severity:** Medium--High\
**Threat:** Push/email messages reveal sensitive information on lock
screens, are sent after consent withdrawal, or duplicate excessively.

**Mitigations** - Keep sensitive medical and donor details out of
notification payloads. - Use generic notifications that direct an
authorized user to a protected screen. - Respect notification
preferences and consent. - Deduplicate jobs and make retries
idempotent. - Handle revoked device tokens and provider failures. -
Limit notification volume and monitor delivery anomalies.

**Verification evidence** - Payload inspection. - Preference/withdrawal
tests. - Retry/deduplication tests.

### T17 --- Third-party integration compromise or data over-sharing

**Initial severity:** Medium--High\
**Threat:** A provider is compromised, misconfigured, or receives more
personal data than needed.

**Mitigations** - Use adapters and minimum necessary scopes/data. - Do
not send donor contact data to maps, analytics, or unrelated
providers. - Validate provider responses and use strict timeouts. - Keep
API keys server-side and restrict them by environment/domain/IP where
supported. - Review provider retention, privacy, availability, and
failure behavior. - Provide graceful degradation when non-critical
providers are unavailable.

**Verification evidence** - Outbound data-flow review. - Provider
permission/configuration audit. - Failure/timeout tests.

### T18 --- False, unauthorized, or misleading public content

**Initial severity:** High\
**Threat:** Fake affiliations, fabricated temple details, unauthorized
guru imagery, incorrect event information, or unauthorized livestreams
damage trust.

**Mitigations** - Keep source URLs and review timestamps for relevant
records. - Require review for sensitive claims and high-risk public
content. - Separate verification status from publication status. - Use
authorized official sources for media and links. - Provide
report/correction/takedown workflows. - Do not claim endorsement without
authorization. - Avoid inventing opening hours, prices, ratings,
lineage, credentials, or event status.

**Verification evidence** - Content publication workflow tests. -
Source/attribution review. - Report and takedown exercise.

### T19 --- Insecure mobile storage or deep links

**Initial severity:** Medium--High\
**Threat:** Sensitive tokens are stored insecurely, deep links expose
private screens, or untrusted links cause unsafe navigation.

**Mitigations** - Store credentials using platform-protected storage. -
Do not persist sensitive donor records unnecessarily. - Validate
deep-link hosts, paths, and parameters. - Require authentication and
authorization after navigating to a protected destination. - Clear
protected state on sign-out and handle expired sessions. - Avoid
sensitive values in deep-link URLs, logs, and share previews. - Keep web
fallbacks safe and functional.

**Verification evidence** - Mobile storage review. - Deep-link
validation tests. - Sign-out and session-expiry tests.

### T20 --- Backup theft, corruption, or unrecoverable outage

**Initial severity:** High\
**Threat:** Database/object backups are exposed, incomplete, outdated,
or impossible to restore during an incident.

**Mitigations** - Encrypt backups at rest and in transit where
supported. - Restrict backup access and separate credentials from
application runtime. - Define retention, recovery objectives, and
restore ownership. - Test database and object-storage restoration
periodically. - Keep development/staging access separate from production
backup access. - Document rollback and incident recovery steps.

**Verification evidence** - Successful restore drill with recorded
duration. - Backup access-control review. - Recovery runbook review.

### T21 --- Dependency or build pipeline compromise

**Initial severity:** High\
**Threat:** A vulnerable or malicious package, compromised build action,
or exposed deployment credential introduces malicious code.

**Mitigations** - Minimize dependencies and review maintenance,
provenance, permissions, and licenses. - Use lockfiles and the
repository's established package manager. - Pin or constrain CI actions
and deployment tooling appropriately. - Run dependency/security
scanning. - Protect release credentials and require review for sensitive
workflow changes. - Separate build/test credentials from production
secrets. - Review generated artifacts before release.

**Verification evidence** - Dependency scan results. - CI workflow
review. - Release credential scope review.

### T22 --- Denial of service or resource exhaustion

**Initial severity:** Medium--High\
**Threat:** Request floods, oversized bodies, pathological queries,
storage exhaustion, or provider outages make the platform unavailable.

**Mitigations** - Set request, upload, query, and execution time
limits. - Rate-limit sensitive and expensive routes. - Use database
indexes and bounded pagination. - Monitor capacity and provider usage. -
Configure platform-level DDoS protections where available. - Keep health
checks lightweight and prevent them from exposing internal details. -
Define graceful degradation for non-critical services.

**Verification evidence** - Load/abuse tests. - Resource-limit checks. -
Monitoring alert exercise.

### T23 --- Privacy or authorization regressions through analytics

**Initial severity:** High\
**Threat:** Analytics events or session replay capture phone numbers,
donor details, internal notes, private pages, or verification evidence.

**Mitigations** - Define an allowlist of permitted analytics events and
fields. - Exclude donor workflows, sensitive form fields, and restricted
admin screens from session replay unless a reviewed, privacy-preserving
design explicitly permits use. - Avoid personal data in event names,
URLs, and custom properties. - Apply consent and retention controls as
appropriate. - Review analytics payloads in staging before launch.

**Verification evidence** - Network payload inspection. - Analytics
schema review. - Sensitive-screen instrumentation audit.

## 7. Security Requirements by Release Stage

### Before any public beta

-   Server-side authorization for all protected routes.
-   Donor privacy defaults and consent withdrawal.
-   No public verification evidence.
-   No publishing of unverified donation QR/payment details.
-   Strict separation of platform support from temple/trust donations.
-   Input validation, rate limits, safe output rendering, and secure
    configuration.
-   Secrets excluded from source control and client bundles.
-   Sensitive data excluded from public SEO and analytics.
-   Account/report/record correction mechanisms appropriate to exposed
    features.
-   Basic security and privacy regression tests.

### Before production

-   Complete role/resource authorization matrix and negative tests.
-   Review admin authentication and MFA capability.
-   Verify payment recipient review and change-control workflow.
-   Complete backup/restore and rollback drills.
-   Test rate limits, upload controls, session expiry, and notification
    privacy.
-   Run dependency scanning and an application security review.
-   Review logs, analytics, cache/CDN rules, CORS/CSRF, and security
    headers.
-   Define retention, deletion, incident response, and security contact
    processes.
-   Conduct independent security testing proportionate to the data and
    risk.

## 8. Required Security Tests

At minimum, create repeatable tests for:

1.  Anonymous users cannot read private profiles, donor contact details,
    internal notes, or verification evidence.
2.  One member cannot update another member's profile, donor settings,
    or blood request.
3.  An organization representative cannot edit another organization's
    records.
4.  Client-supplied role, owner, verification, and payment-status fields
    are ignored or rejected.
5.  Consent withdrawal removes donor discoverability and blocks future
    contact access.
6.  Expired and closed blood requests are excluded from active results.
7.  Unauthorized users cannot create, approve, or modify donation
    instructions.
8.  Any QR/payment-detail change returns the instructions to review
    before republication.
9.  Temple/trust donation routes and platform-support routes cannot be
    confused or cross-authorized.
10. A QR scan or redirect never produces a confirmed payment state
    without trusted evidence.
11. Unapproved uploads and private evidence cannot be fetched publicly.
12. Rate limits and request-size limits are enforced.
13. HTML, URL, file, and deep-link validation rejects unsafe inputs.
14. Sensitive fields do not appear in logs, analytics, push payloads,
    metadata, sitemaps, or shared caches.
15. Admin role changes and sensitive actions produce audit events.
16. Account/session revocation prevents further protected access.
17. Migrations and backups can be safely tested and restored in a
    non-production environment.

## 9. Incident Response

Prepare a documented response for:

-   Donor-data exposure or unauthorized contact.
-   Account/admin compromise.
-   Fraudulent donation QR or payment instructions.
-   Private verification evidence exposure.
-   Unauthorized media/content publication.
-   Database corruption or service outage.
-   Secret or signing-key exposure.

The runbook should define an incident owner, severity classification,
containment actions, credential rotation, affected-record suspension,
evidence preservation, communication responsibilities, recovery checks,
and post-incident review. Legal notification duties and timelines must
be determined with appropriate advice; do not invent them.

For suspected donation fraud, suspend the affected instructions
promptly, preserve the audit trail, verify the recipient through an
independent trusted channel, and communicate only confirmed facts.

## 10. Ownership and Review

For each threat, track:

-   Owner
-   Severity and likelihood
-   Affected components
-   Required control
-   Test/evidence link
-   Current status: `OPEN`, `IN_PROGRESS`, `MITIGATED`, `ACCEPTED`,
    `NOT_APPLICABLE`
-   Residual risk and acceptance approver
-   Last reviewed date

Review this threat model:

-   Before launching a new sensitive feature.
-   Before changing authentication, donor contact, verification,
    donation, or storage flows.
-   After a security incident or meaningful architecture change.
-   Before production release and periodically thereafter.

A threat is not mitigated merely because its control is documented.
Record evidence from code review, automated tests, configuration
inspection, or independent assessment.

## 11. Final Rule

Default to least privilege, data minimization, explicit consent,
verifiable public information, and reversible administrative actions.
Treat donor privacy and donation-recipient integrity as high-risk areas.
Do not launch a sensitive workflow until its required controls are
implemented and verified.
