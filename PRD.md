# JainConnect --- Product Requirements Document (PRD)

**File:** `PRD.md`\
**Version:** 1.0\
**Status:** Product baseline for design and engineering\
**Product name:** JainConnect\
**Technology partner:** NovaEdge Digital Labs\
**Platforms:** Flutter Android app, Next.js public website, Next.js
admin dashboard\
**Backend:** Node.js + Express.js + TypeScript\
**Database:** PostgreSQL + Prisma\
**Business model:** Free community platform; optional support for
JainConnect operating expenses; temple/trust donations go directly to
the selected recipient

------------------------------------------------------------------------

## 1. Executive Summary

JainConnect is a free, community-first digital platform intended to
connect Jain community members with temples, spiritual teachers,
religious resources, community organizations, events, blood donation
resources, bhojanalays, dharamshalas, pilgrimage information, charitable
initiatives, and verified temple/trust donation information.

The product consists of: 1. A Flutter Android application. 2. A public
Next.js website for discovery, search visibility, and shareable pages.
3. A protected Next.js admin dashboard. 4. A Node.js/Express API that
powers all clients. 5. A PostgreSQL database and supporting
storage/integrations.

All agreed feature areas are part of the product vision. Delivery will
be phased to manage complexity and operational risk, not to permanently
remove features.

## 2. Problem Statement

Jain community information can be spread across local contacts,
messaging groups, social media pages, standalone websites, and physical
notices. People may struggle to find current, trustworthy information
about a temple, event, bhojanalay, dharamshala, guru, pravachan, blood
donation resource, or community organization.

Organizations may also lack a simple, consistent way to maintain public
information and share it with community members.

JainConnect aims to provide one accessible and shareable platform with
structured information, verified listings, useful discovery, and
responsible community-service workflows.

## 3. Vision and Mission

### Vision

Build a dependable digital hub for Jain community information and
services.

### Mission

Make useful religious, community, charitable, and practical resources
easier to discover and share, while protecting privacy and maintaining
trust.

## 4. Goals

-   Make core community discovery and information features free.
-   Provide searchable temple, guru, organization, food, stay, event,
    and resource directories.
-   Help users find blood-donation resources and coordinate requests
    responsibly.
-   Provide public pages for authorized pravachan videos and live
    streams.
-   Give verified temples and trusts dedicated pages with direct
    donation instructions.
-   Keep optional JainConnect operating support separate from
    temple/trust donations.
-   Support sharing through WhatsApp, Telegram, social platforms, and
    deep links.
-   Provide a search-friendly public website that is useful without
    requiring app installation.
-   Provide administrators with tools for verification, moderation,
    content quality, and operational oversight.
-   Credit NovaEdge Digital Labs transparently without turning the
    product into an advertising surface.

## 5. Non-Goals

-   Charging users or organizations a platform subscription for core
    use.
-   Taking custody of or pooling temple/trust donations through the
    JainConnect maintenance account.
-   Replacing medical professionals, hospitals, or authorized blood
    banks.
-   Guaranteeing donor availability, blood compatibility, or medical
    outcomes.
-   Claiming that a temple, trust, guru, or community organization
    endorses JainConnect without authorization.
-   Hosting all live video infrastructure in the first release by
    default.
-   Guaranteeing search-engine rankings, AI citations, app installs, or
    virality.
-   Publishing every submitted record automatically or indexing
    empty/thin location pages.
-   Building a full booking/payment marketplace before operational needs
    and responsibilities are validated.

## 6. Target Users and Roles

### 6.1 Community member

Browses public information, searches listings, views events/resources,
shares pages, saves content, and manages preferences.

### 6.2 Donor

Voluntarily registers in the blood network, controls availability and
consent, and can pause or remove the listing.

### 6.3 Blood-request creator

Submits a blood requirement with relevant hospital/location information
and a safe contact method, then updates or closes the request.

### 6.4 Temple/trust representative

Requests control of a temple/trust profile, submits corrections and
verification evidence, manages approved public details, and provides
authorized donation instructions.

### 6.5 Organization/listing owner

Manages an approved organization, bhojanalay, dharamshala, or business
listing within permitted fields.

### 6.6 Content editor/moderator

Reviews submissions, verifies sources, manages reports, corrects
inaccurate content, and moderates public material.

### 6.7 Administrator

Manages roles, platform settings, verification, sensitive workflows,
audit logs, and operational configuration.

Roles must be enforced by the backend. Hiding a button in the UI is not
sufficient authorization.

## 7. Product Principles

1.  Free access to core features.
2.  Useful community service before promotion.
3.  Verified and source-backed information.
4.  Consent-first handling of sensitive data.
5.  Clear distinction between verified identity and guaranteed accuracy.
6.  Direct temple/trust donation flows.
7.  Separate optional platform-maintenance support.
8.  Respect for different Jain traditions and regional practices.
9.  Accessibility, localization, and responsive design.
10. Modular, testable, maintainable engineering.

## 8. Scope and Functional Requirements

Priority definitions: - **P0:** Required for a safe and useful public
launch of the corresponding phase. - **P1:** Important planned
capability; deliver in its designated phase. - **P2:** Enhancement after
core workflows are reliable.

These priorities organize delivery. They do not remove the feature from
the overall product vision.

### 8.1 Community Directory

**Requirements** - Browse Jain organizations, community associations,
trusts, committees, professionals, and community-owned businesses. -
Search by name, category, city, and state. - Display approved name,
description, public contact details, location, website/social links, and
update date where available. - Provide dedicated public profile pages
and share links. - Allow authorized representatives to request ownership
or corrections. - Support pending, verified, rejected, suspended, and
needs-review states as appropriate. - Allow users to report inaccurate
or abusive content.

**Acceptance criteria** - Search and category/location filters work on
supported devices. - Unapproved submissions are not shown as verified. -
Public contact details are displayed only when approved for
publication. - Changes to verified records are auditable.

### 8.2 Jain Calendar & Resources

**Requirements** - Publish Jain festivals, parv, tithis, and significant
dates. - Display upcoming events and reminders. - Provide articles,
books, educational resources, and Jain philosophy/history content where
distribution is authorized. - Attribute quotes, teachings, and factual
claims to reliable sources. - Support category and language filters
where data exists. - Allow saving and sharing of public resources. -
Clearly identify regional or tradition-specific calendar differences.

**Acceptance criteria** - Dates are reviewed against reliable sources
before publication. - Each substantial resource has source/attribution
metadata. - Content corrections can be submitted and reviewed. -
Reminders require user permission/opt-in.

### 8.3 Blood Donation Network

**Requirements** - Voluntary donor registration with explicit consent. -
Blood-group filters for A+, A−, B+, B−, O+, O−, AB+, AB−. - Search by
city or approximate area. - Availability status and last-confirmed
date. - Blood requests with blood group/component, hospital, city,
urgency, contact method, and expiry. - Donor listing pause/update/delete
controls. - Request creator can update or close a request. - Verified
hospital and blood-bank directory. - Shareable request links with
privacy-safe summaries. - Report and moderation workflows for fraud,
abuse, and expired requests. - Notifications based on user preferences
and consent.

**Acceptance criteria** - Donor personal contact details and exact
location are not public by default. - A donor can withdraw consent and
remove/pause their listing. - Expired/closed requests are clearly marked
and excluded from active search. - The system does not guarantee donor
availability, compatibility, or eligibility. - Medical compatibility and
collection decisions are left to qualified professionals and authorized
blood banks. - Public metadata, analytics, and URLs do not leak private
medical/contact data.

### 8.4 Bhojanalay & Food Services

**Requirements** - Directory of Jain bhojanalays, bhojanshalas, and
relevant food services. - Search by location, type, and available
facilities. - Display address, directions, contact, opening hours, and
prices when supplied and current. - Show dietary practices only when
confirmed by the provider. - Show last-updated or unconfirmed status
where appropriate. - Allow listing owners to request updates. - Provide
correction/reporting tools.

**Acceptance criteria** - Unconfirmed hours are not presented as
verified. - Dietary labels are sourced from provider confirmation or an
approved source. - Each public listing has a stable URL and useful
information. - Duplicate and spam submissions can be reviewed.

### 8.5 Jain Gurus & Spiritual Profiles

**Requirements** - Public profiles for recognized acharyas, munis,
aryikas, sadhvis, and other relevant spiritual teachers. - Biography,
tradition information, official public links, and source attribution
where available. - Upcoming pravachan and event information. - Recorded
pravachan and educational media library. - Search by name, topic,
language, location, and event where data supports it. - Shareable
profile pages. - Corrections and source review.

**Acceptance criteria** - Profiles are based on reliable public sources
and/or authorized confirmation. - Photos and recordings are used with
appropriate rights/permission. - The platform does not imply endorsement
without authorization. - Sensitive or disputed claims have a review
process.

### 8.6 Pravachan Videos & Live Streams

**Requirements** - Catalog authorized videos with title, teacher,
language, topic, source, date, and status. - Display upcoming live
sessions and scheduled events. - Embed permitted streams from official
providers where possible. - Provide an official link fallback when
embedding is unavailable. - Support temple live darshan or religious
events where an authorized stream exists. - Notify users of followed or
opted-in events. - Report unavailable or inappropriate content.

**Acceptance criteria** - Live status is shown only when confirmed by a
reliable source. - Unavailable videos display a fallback message/link. -
The platform does not rebroadcast streams without rights. - Initial
implementation prioritizes external authorized providers to control
infrastructure costs.

### 8.7 Jain Temple Directory

**Requirements** - Dedicated public page for each temple. - Name,
authorized images, address, directions, published timings, contact
details, history, facilities, and source/update information. - Filters
by city, state, pilgrimage area, and facility. - Events, announcements,
gallery, and authorized live links. - Authorized temple/trust
representative workflow. - Verification, corrections, reports, and
status history. - Dedicated donation section for participating verified
temples/trusts.

**Acceptance criteria** - Temple pages use stable canonical URLs. - Only
approved records are labeled verified. - Timings and contact details
show update/source status where practical. - Donation information is
hidden until recipient details meet the verification policy.

### 8.8 Temple/Trust Donations

**Requirements** - Separate donation section on each participating
temple/trust profile. - Authorized representative submits approved
recipient name, payment details, QR image, and donation purpose. - Admin
verifies the recipient and authority before publishing. - Payment-detail
changes trigger re-review and an audit log. - Display recipient identity
and purpose before the QR/payment instructions. - Provide a way to
report suspicious or outdated payment details. - Do not claim
transaction success unless confirmed by a suitable payment-provider
integration. - Keep platform maintenance support entirely separate.

**Acceptance criteria** - The recipient is clearly identified before
payment. - Payments are directed to the selected trust/temple, not to
JainConnect/NovaEdge maintenance funds. - QR display alone never creates
a "payment successful" status. - Tax-deductibility and receipt claims
are not made without verification. - Private financial or verification
documents are not publicly accessible.

### 8.9 JainConnect Maintenance Support

**Requirements** - Dedicated "Support JainConnect" page. - Optional
platform-maintenance QR code/payment instructions. - Explain that
support may cover hosting, domain, storage, backups, security,
monitoring, and maintenance. - Make clear that donations are voluntary
and not required to use core features. - Allow the operator to update
payment instructions through a protected admin flow. - Keep
maintenance-support settings/records separate from temple/trust donation
data.

**Acceptance criteria** - No feature is blocked when a user declines to
contribute. - The recipient and purpose are clearly stated. - No forced
donation modal or misleading urgency is used. - Appropriate legal,
accounting, and tax treatment is confirmed before launch.

### 8.10 Yatra, Dharamshala & Pilgrimage

**Requirements** - Pilgrimage destination directory and route
information. - Nearby temples, dharamshalas, bhojanalays, and relevant
facilities. - Contact details, directions, public facilities, and update
status. - Booking enquiry/request workflow for participating providers
if enabled. - Availability information only when supplied and maintained
by an authorized provider.

**Acceptance criteria** - The UI does not claim confirmed availability
or booking without confirmation. - Location pages contain useful,
accurate content. - Providers can request corrections to their
information.

### 8.11 Seva, Charity & Community Campaigns

**Requirements** - Campaign pages for approved education, medical
assistance, food distribution, animal welfare, and other charitable
initiatives. - Organizer identity, purpose, recipient, dates, updates,
and supporting evidence as appropriate. - Clear payment destination and
separation from platform maintenance support. - Report, review, suspend,
and close workflows. - Accurate updates and closure status.

**Acceptance criteria** - No campaign is labeled verified without a
documented review. - Recipient identity and payment purpose are clear. -
Fraud reports can be reviewed and acted on. - Impact claims are only
published when supported by evidence.

### 8.12 Notifications & Announcements

**Requirements** - Opt-in reminders for festivals/events. -
Notifications for followed temples/gurus and relevant community
updates. - Blood-network notifications only under explicit preference
and consent rules. - Notification categories, mute/opt-out, and sensible
frequency controls. - Admin publishing and scheduling controls.

**Acceptance criteria** - Users can control notification categories. -
Sensitive details are not exposed on lock screens unnecessarily. -
Unavailable or expired events/requests are not repeatedly promoted.

### 8.13 Sharing, SEO & Public Discovery

**Requirements** - Public web pages for eligible temples, gurus, events,
resources, community listings, bhojanalays, dharamshalas, and pilgrimage
content. - Search-friendly metadata, canonical URLs, sitemaps, and
accurate structured data where appropriate. - Open Graph/social preview
metadata. - Share actions for WhatsApp, Telegram, and native share
sheet. - App deep links with useful web fallbacks. - Report/correction
paths on important pages. - No indexing of private donor data, private
requests, account pages, admin pages, or internal verification
documents.

**Acceptance criteria** - Shared links resolve to the intended public
page. - Metadata accurately reflects visible page content. - Nonexistent
pages return appropriate status codes. - No private data appears in
titles, descriptions, sitemaps, or analytics.

### 8.14 Authentication & Profiles

**Requirements** - Public browsing wherever practical. - Authentication
for actions that need identity, consent, or moderation. - Secure
sign-in, session/token handling, and account recovery. - User profile,
saved items, notification preferences, and submitted content history. -
Account data/deletion workflows where applicable. - Role-based
permissions enforced by the backend.

**Acceptance criteria** - Unauthorized users cannot perform protected
actions by calling APIs directly. - Session invalidation and recovery
workflows are tested. - Private user data is not returned to other users
without permission.

### 8.15 Admin & Moderation

**Requirements** - Manage users, roles, temples, trusts, gurus, media,
events, resources, directories, requests, charity, and public
listings. - Review verification submissions and evidence. - Approve,
reject, suspend, request correction, and restore where appropriate. -
Manage reports, spam, fraudulent content, and expired requests. - Manage
maintenance-support settings and temple/trust donation instructions
through separate workflows. - Maintain audit logs for sensitive
actions. - View defined operational analytics. - Manage content sources
and notification templates. - Support backup, restore, and incident
procedures.

**Acceptance criteria** - Role permissions are checked server-side. -
Sensitive actions are logged with actor, timestamp, target, and change
summary. - Payment-detail changes require explicit review. - Private
verification documents are accessible only to authorized roles. - Admin
APIs are not publicly exposed without authentication and authorization.

### 8.16 NovaEdge Digital Labs Branding

**Requirements** - Transparent "Developed and maintained by NovaEdge
Digital Labs" attribution. - About page with product purpose,
operator/contact details, and company link. - Optional professional
technology/services page. - No misleading claims of institutional
endorsement. - Branding does not obstruct community tasks.

**Acceptance criteria** - Attribution is visible but unobtrusive. - No
promotional banner interrupts blood requests, emergency flows, or
donation decisions.

------------------------------------------------------------------------

## 9. User Journeys

### Journey A: Find a temple

1.  User opens app or public website.
2.  Searches temple name or chooses a city.
3.  Reviews available listings and verification status.
4.  Opens temple profile.
5.  Checks address, directions, timings, and facilities.
6.  Shares the public link or opens directions.

### Journey B: Find a blood donor

1.  User opens Blood Network.
2.  Reads a short privacy/safety notice.
3.  Searches by blood group and city/area.
4.  Reviews availability and last-confirmed status.
5.  Uses the permitted contact flow or official blood-bank resource.
6.  Closes or reports the request when appropriate.

The app must not promise a donor or make medical compatibility
decisions.

### Journey C: Register as a donor

1.  User signs in.
2.  Reviews data-use and consent information.
3.  Enters required information and availability preferences.
4.  Confirms registration.
5.  Controls listing visibility, availability, pause, and deletion
    later.

### Journey D: Temple representative adds donation details

1.  Representative signs in and requests verified management access.
2.  Submits authorization evidence and recipient payment details.
3.  Admin reviews identity, authority, and payment recipient.
4.  Approved details are published with recipient name and purpose.
5.  A later change triggers re-verification and an audit record.

### Journey E: Support JainConnect

1.  User opens Support JainConnect.
2.  Reads that support is optional and what it may fund.
3.  Scans the platform's own QR/payment details.
4.  Completes payment in their payment app.
5.  Returns to JainConnect if desired.

The app must not claim success unless the transaction is actually
verified.

### Journey F: Watch a pravachan

1.  User discovers a guru or event.
2.  Opens the profile or event page.
3.  Selects an authorized recording or live link.
4.  Watches through the permitted provider.
5.  Shares the public page.

### Journey G: Submit a correction

1.  User selects "Report incorrect information."
2.  Chooses a reason and supplies details.
3.  The report is logged.
4.  Moderator reviews evidence and updates status.
5.  Where appropriate, the submitter receives a status update.

------------------------------------------------------------------------

## 10. Recommended Technical Stack

### Mobile app

-   Flutter + Dart.
-   State management: Riverpod or Bloc; choose one.
-   Navigation: `go_router`.
-   API client: Dio or a maintained equivalent.
-   Secure storage for credentials/tokens.
-   Firebase Cloud Messaging for push notifications where supported.
-   Deep links/app links.
-   Maps and video integrations selected according to provider terms and
    cost.

### Public website and admin

-   Next.js App Router + TypeScript.
-   Shared design tokens and accessible component patterns.
-   Server-rendered or statically generated public pages where
    appropriate.
-   Protected admin routes and APIs.

### Backend

-   Node.js + Express.js + TypeScript.
-   REST API versioned under `/api/v1`.
-   Zod or equivalent input validation.
-   Central error handling, request IDs, structured logs, rate limits,
    and health endpoints.
-   OpenAPI/Swagger documentation.
-   Background jobs for expiry, reminders, and cleanup.

### Database

-   PostgreSQL as the primary database.
-   Prisma ORM for typed data access and migrations.
-   PostGIS later if advanced geospatial queries justify it.
-   PostgreSQL full-text search initially; a dedicated search service
    only if necessary.

### Storage and providers

-   S3-compatible object storage or a suitable managed media provider.
-   Authorized external video platforms initially.
-   Transactional email provider.
-   Firebase Cloud Messaging.
-   A mapping/geocoding provider chosen after reviewing pricing,
    privacy, and attribution.
-   Optional payment integrations only after recipient flows and
    compliance requirements are validated.

### Infrastructure

-   Linux VPS or managed application hosting.
-   Managed PostgreSQL if budget permits, otherwise a carefully
    administered database with tested backups.
-   HTTPS, reverse proxy/managed ingress, environment secrets,
    staging/production separation, CI/CD, logs, error monitoring,
    backups, and restore tests.

------------------------------------------------------------------------

## 11. High-Level Architecture

``` text
Flutter Android App       Next.js Public Website
         |                          |
         +-----------+--------------+
                     |
               HTTPS REST API
                     |
           Node.js + Express + TS
                     |
          +----------+-----------+
          |          |           |
      PostgreSQL   Object     External
       + Prisma    Storage    Providers
          |
   Scheduled/Background Jobs

Next.js Admin Dashboard
          |
    Protected Admin APIs
          |
    Same API and Database
```

The backend is the source of truth for permissions, verification,
listing status, request expiry, donation instructions, and audit
records. Client-side UI state must never be treated as proof of
authorization or payment.

## 12. Core Data Domains

The detailed schema will be maintained separately. Expected domains: -
Users, sessions, roles, and permissions. - Organizations, community
groups, professionals, and businesses. - Temples, temple
representatives, and verification history. - Gurus, biographies, source
records, and media. - Calendar entries, events, and announcements. -
Articles, books, and resources. - Bhojanalays, dharamshalas, and
pilgrimage places. - Blood donors, consent, availability, and
requests. - Hospitals and blood banks. - Charity/seva campaigns and
recipients. - Temple/trust donation instructions and change history. -
JainConnect maintenance-support settings and optional contributions. -
Reports, moderation actions, audit logs, and notifications. - Media
assets and upload ownership.

Keep platform-support data separate from temple/trust donation data.
Restrict access to private donor information and verification evidence.

## 13. Non-Functional Requirements

### Security

-   HTTPS in production.
-   Server-side validation and authorization.
-   Secure password hashing if passwords are used.
-   Secure token/session handling and revocation.
-   Rate limits on authentication, requests, uploads, and public search.
-   Secret management outside source control and client builds.
-   Least-privilege admin roles and audit logging.
-   Protection against common web/API vulnerabilities.
-   Private storage for verification documents.
-   Dependency updates and security checks.

### Privacy

-   Collect only necessary data.
-   Explicit consent for donor participation and personal-data sharing.
-   Clear privacy policy, retention, and deletion procedures.
-   No personal donor data in public metadata, URLs, sitemaps, or
    analytics.
-   User control over donor listing visibility and availability.
-   Review applicable Indian privacy and data-protection obligations
    before launch.

### Reliability

-   Health/readiness endpoints.
-   Monitoring for API, database, and third-party provider failures.
-   Scheduled backups and tested restore procedures.
-   Error reporting and incident escalation.
-   Safe behavior when video, maps, email, or notification providers are
    unavailable.

### Performance

-   Paginated API responses.
-   Indexed search/filter fields.
-   Efficient database queries and connection management.
-   Optimized images and caching.
-   Reasonable request payload sizes.
-   Load testing based on expected launch traffic and growth.

### Accessibility and localization

-   WCAG 2.2 AA target for the website.
-   Screen-reader labels and large-text support.
-   Keyboard navigation for web/admin.
-   Hindi and English initially if resourcing permits.
-   Design for additional Indic-language support.
-   Localized dates, time formats, and calendar distinctions.

### Maintainability

-   TypeScript strict mode where practical.
-   Consistent linting/formatting.
-   Documented APIs and environment variables.
-   Automated tests and CI.
-   Database migrations under version control.
-   Clear module ownership and operational documentation.

## 14. API Design Expectations

The API contract should be defined in OpenAPI before or alongside
implementation.

Expected resource groups include: - `/api/v1/auth` - `/api/v1/users` -
`/api/v1/organizations` - `/api/v1/temples` - `/api/v1/gurus` -
`/api/v1/events` - `/api/v1/calendar` - `/api/v1/resources` -
`/api/v1/bhojanalays` - `/api/v1/dharamshalas` - `/api/v1/pilgrimage` -
`/api/v1/blood/donors` - `/api/v1/blood/requests` -
`/api/v1/blood-banks` - `/api/v1/charity` - `/api/v1/media` -
`/api/v1/donations/temples` - `/api/v1/support` - `/api/v1/reports` -
`/api/v1/admin`

These are proposed route groups, not a finalized contract. Use
pagination, filtering, consistent error shapes, validation,
authorization, and rate limits. Sensitive endpoints must not leak
whether private records exist beyond what the caller is allowed to know.

## 15. Analytics & Success Metrics

Define metrics before implementation so the team does not confuse
activity with impact.

### Product

-   Active users and repeat usage.
-   Successful searches and profile views.
-   Shares and deep-link opens.
-   Saves/follows where implemented.
-   Event engagement.
-   Feature-level error rates.

### Content and trust

-   Number of verified active listings.
-   Listing freshness and correction turnaround.
-   Broken official links.
-   Report volume and moderation backlog.
-   Expired blood requests still visible in search (target: zero).
-   Payment-detail re-verification compliance.

### Blood network

-   Request closure rate.
-   Time to first meaningful response, if measured responsibly.
-   Report/fraud rate.
-   Donor opt-out and stale availability rate.

Do not publish medical impact claims without reliable evidence.

### Discovery

-   Eligible pages indexed.
-   Search impressions/clicks and useful-action rate.
-   Organic visits to verified pages.
-   Public-link shares and referrals.
-   Play Store listing conversion.
-   Core Web Vitals and technical errors.

### Sustainability

-   Monthly infrastructure/provider costs.
-   Optional platform contributions and cost coverage.
-   Storage and bandwidth growth.
-   Availability and incident frequency.

## 16. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Broad feature scope delays delivery Modular phases, acceptance
                                      criteria, and clear dependencies

  Inaccurate or stale listings        Verification states, source dates,
                                      corrections, and owner update flows

  Blood-request fraud or privacy      Consent, moderation, expiry,
  leaks                               privacy-safe sharing, and access
                                      controls

  Wrong temple payment QR             Recipient verification, change
                                      review, audit trail, and reporting

  Confusion between donation types    Separate flows, labels, data
                                      domains, and payment destinations

  Unauthorized video/media use        Official links, rights checks, and
                                      takedown process

  Excessive hosting costs             External video hosting initially,
                                      monitoring, quotas, and budget
                                      alerts

  Search spam/thin pages              Editorial review, indexing rules,
                                      canonicalization, and noindex for
                                      low-value pages

  Abuse and spam                      Rate limiting, reporting,
                                      moderation, and upload validation

  Trust damage from false claims      Transparent ownership, accurate
                                      verification language, and
                                      corrections

  Provider outage                     Graceful fallback, retries where
                                      safe, monitoring, and documented
                                      alternatives
  -----------------------------------------------------------------------

## 17. Delivery Roadmap

All modules remain in scope. The following order is recommended for
implementation and risk management.

### Phase 0 --- Requirements and foundation

-   Confirm domain, ownership, policies, and visual identity.
-   Finalize user journeys, wireframes, schema, and API contracts.
-   Set up repositories, environments, CI, logging, and backup strategy.
-   Define verification, moderation, and privacy rules.

### Phase 1 --- Core directories

-   Flutter app shell and Next.js public site.
-   Authentication and role system.
-   Community directory.
-   Temple directory and profiles.
-   Jain calendar, resources, and events.
-   Bhojanalay directory.
-   Basic admin moderation and verification.
-   Sharing, public URLs, SEO fundamentals.

### Phase 2 --- Blood network

-   Donor consent, availability, and profile controls.
-   Blood requests, expiry, search, and reporting.
-   Hospital/blood-bank directory.
-   Notifications and safe sharing.
-   Privacy and abuse testing.

### Phase 3 --- Gurus and media

-   Guru profiles and source attribution.
-   Pravachan library and authorized embeds.
-   Live event schedule and official links.
-   Temple media and supported live darshan.

### Phase 4 --- Donations and charity

-   JainConnect support page and optional QR.
-   Verified temple/trust donation instructions.
-   Change-review and audit workflows.
-   Seva/charity campaigns and recipient transparency.
-   Legal/accounting review before public donation launch.

### Phase 5 --- Pilgrimage and advanced discovery

-   Pilgrimage routes and destination pages.
-   Dharamshala information and enquiry flows.
-   Better location search and map integration.
-   Content quality and operations improvements.

### Phase 6 --- Release and expansion

-   Pilot with community users and participating organizations.
-   Fix usability, content, and security issues.
-   Prepare Play Store release and production deployment.
-   Validate backup/restore, monitoring, support, and incident response.
-   Expand city-by-city as verified data becomes available.

## 18. Release Gates

Do not launch a phase publicly until its acceptance criteria pass.

### General

-   Build, lint, test, and deployment checks pass.
-   Error, loading, empty, offline, and success states are present.
-   Authentication and permissions are tested.
-   Privacy policy, terms, contact, and reporting paths are available.
-   No private data is exposed in public APIs/pages.
-   Monitoring, backups, and rollback procedures are ready.

### Blood network

-   Donor consent, pause/delete, request expiry, reporting, and privacy
    checks pass.
-   No medical compatibility guarantees are made.
-   Abuse handling and emergency disclaimers are clear.

### Temple/trust donations

-   Recipient verification is documented.
-   Platform support and recipient donations are separate.
-   QR pages show the recipient and purpose.
-   No false transaction confirmation is shown.
-   Relevant legal/accounting review is complete.

### Media

-   Rights and source checks are complete.
-   Live status is accurate.
-   Fallbacks work when external providers are unavailable.

### SEO/public pages

-   Canonicals, metadata, sitemap, robots policy, status codes, and
    share previews are tested.
-   Only eligible public content is indexable.
-   No donor/private data appears in page source or metadata.

## 19. Open Decisions

Resolve these during product design: - Final domain, brand assets, and
public operator/contact details. - Initial languages and localization
capacity. - Authentication method and whether any actions require
stronger verification. - Maps/geocoding provider and budget. -
Object-storage, email, and notification providers. - Exact verification
evidence by listing type. - Moderator staffing and response
expectations. - Donation operating entity, payment details, accounting,
and tax/legal treatment. - Content sourcing, copyright, and takedown
procedures. - Initial rollout geography and onboarding process for
participating temples. - Hosting budget, expected usage, and
on-call/maintenance ownership.

## 20. Definition of Done

A feature is done only when: 1. Requirements and permissions are
documented. 2. UI states and responsive behavior are implemented. 3. API
validation and server-side authorization are in place. 4. Database
migrations and rollback considerations are documented. 5. Relevant
unit/integration/end-to-end tests pass. 6. Error, empty, loading, and
unavailable-provider states work. 7. Sensitive data is protected and
retention rules are defined. 8. Logs and monitoring are adequate without
leaking private data. 9. Accessibility and localization have been
reviewed. 10. Documentation and operational instructions are updated.
11. Acceptance criteria are demonstrated in a staging environment. 12.
Production rollout and rollback steps are ready.

## 21. Final Product Statement

JainConnect is a free, community-first digital platform connecting Jain
people with verified community information, temples, spiritual teachers,
resources, events, blood donation resources, bhojanalays, dharamshalas,
pilgrimage services, charity initiatives, and direct temple/trust
donation information.

It will use Flutter for Android, Next.js and TypeScript for the public
website and admin dashboard, Node.js/Express for the API, and PostgreSQL
with Prisma for the primary database. Supporting infrastructure will
include appropriate object storage, authorized media providers,
notifications, monitoring, and tested backups.

JainConnect maintenance support will be voluntary. Temple/trust
donations will remain separate and go directly to their respective
recipients. NovaEdge Digital Labs will be credited transparently as the
technology partner.

**Product principle:** Make JainConnect useful, accurate, safe, and
sustainable for the community.
