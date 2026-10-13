# JainConnect --- Product Overview & Technical Blueprint

**Document status:** Initial product vision and planning baseline\
**Version:** 1.0\
**Product:** JainConnect\
**Technology partner:** NovaEdge Digital Labs\
**Primary market:** Jain community in India, with a platform
architecture that can expand nationally\
**Business model:** Free community platform supported by optional
platform-maintenance donations; temple and trust donations go directly
to their respective recipients

------------------------------------------------------------------------

## 1. Executive Summary

JainConnect is a free digital platform designed to connect Jain
community members with religious resources, temples, spiritual teachers,
community organizations, blood donation support, Jain food facilities,
pilgrimage information, charitable initiatives, and community events.

The platform will bring these services together through an Android
application, a public website, and an administrative dashboard. Users
should be able to discover useful information, share public pages,
contact verified organizations, watch authorized pravachan videos or
live streams, and find relevant community services.

JainConnect will not charge users, temples, or trusts a platform usage
fee. The platform may display an optional contribution QR code or
payment details to help cover its own infrastructure and operating
expenses. Contributions must never be mandatory to use the platform.

Temple and trust donations will be separate from JainConnect maintenance
contributions. Each participating, verified temple or trust can provide
its own approved payment details. Donations to those recipients must go
directly to the selected temple or trust, not through NovaEdge Digital
Labs or the JainConnect platform's maintenance account.

## 2. Why We Are Building JainConnect

Information useful to Jain community members can be spread across
separate websites, social media pages, messaging groups, local
directories, and personal contacts. Finding accurate information about a
temple, bhojanalay, dharamshala, event, spiritual teacher, or blood
donation requirement can therefore take time.

JainConnect aims to provide a centralized, easy-to-use and shareable
place for this information, while respecting different Jain traditions
and protecting users' privacy.

The project also gives NovaEdge Digital Labs an opportunity to
contribute a useful public-facing technology product. The company and
its founder may be identified transparently as the platform's technology
creators, without making the app primarily an advertisement.

## 3. Mission and Objectives

### Mission

Make useful Jain community, religious, charitable, and practical
services easier to discover and access through a free digital platform.

### Objectives

-   Bring community directories, temples, food facilities, spiritual
    content, calendars, and events into one platform.
-   Help people discover blood donation resources and coordinate
    requests responsibly.
-   Give verified temples and trusts dedicated public pages and direct
    donation options.
-   Make religious resources and authorized videos easier to find and
    share.
-   Help community organizations publish accurate information and
    announcements.
-   Make public pages discoverable through search engines and shareable
    through messaging apps.
-   Operate transparently, with voluntary support for platform expenses.
-   Build trust through verification, privacy safeguards, moderation,
    and clear ownership information.

## 4. Intended Users

-   Jain community members and families.
-   Students, young people, and working professionals.
-   Temple visitors, pilgrims, and people planning Jain yatras.
-   Jain acharyas, munis, aryikas, sadhvis, spiritual teachers, and
    their authorized representatives.
-   Temple committees, trusts, charitable organizations, and community
    associations.
-   Blood donors and people coordinating blood requests.
-   Jain bhojanalays, bhojanshalas, dharamshalas, and other relevant
    service providers.
-   Community-owned businesses and professionals.
-   Platform administrators and authorized moderators.

The platform should represent Jain traditions accurately and
respectfully. Profiles and religious content must not imply endorsement
or affiliation without authorization.

## 5. Product Principles

1.  **Free to use:** Core platform features will not require payment.
2.  **Community-first:** Features should solve real user needs rather
    than exist solely for promotion.
3.  **Transparent funding:** JainConnect maintenance contributions are
    optional and distinct from temple donations.
4.  **Direct temple donations:** A temple or trust controls its own
    payment details and receives donations directly.
5.  **Verified information:** Important profiles and claims should be
    reviewed and have a visible verification status.
6.  **Privacy by design:** Personal information, especially donor and
    emergency-request data, must not be exposed unnecessarily.
7.  **Accessible and shareable:** Public information should work on
    mobile devices and be easy to share.
8.  **Respectful representation:** Content should account for
    differences in Jain traditions and avoid unverified religious
    claims.
9.  **Maintainable engineering:** The system should be modular,
    documented, tested, backed up, and observable.
10. **Honest status indicators:** The app must distinguish verified,
    unverified, pending, unavailable, and expired information.

------------------------------------------------------------------------

## 6. Feature Overview

### 6.1 Community Directory

-   Directory of Jain organizations, community associations, trusts, and
    committees.
-   City-wise and state-wise discovery.
-   Community announcements and events.
-   Profiles with approved names, descriptions, addresses, contact
    channels, websites, and public links.
-   Jain professionals and community business listings.
-   Search, filters, reporting, and correction requests.
-   Authorized organization representatives can request profile
    ownership or edits.
-   Admin review and verification status.
-   Shareable public profile links.

### 6.2 Jain Calendar & Resources

-   Jain festivals, parv, tithis, and important dates.
-   Upcoming religious programs and community events.
-   Articles about Jain philosophy, history, literature, and practices.
-   Digital resources and books where distribution is authorized.
-   Daily teachings or quotations with attribution and source
    information.
-   Topic-wise and tradition-aware organization of resources.
-   Bookmarks, sharing, and optional reminders.
-   Clear source attribution and correction/reporting tools.
-   Calendar information should be checked against reliable sources and
    relevant regional or tradition-specific calendars. The app must not
    silently present one calendar interpretation as universal.

### 6.3 Jain Blood Network

-   Voluntary donor registration.
-   Blood group filters: A+, A−, B+, B−, O+, O−, AB+, and AB−.
-   Search by city or approximate area.
-   Availability status and last-confirmed date.
-   Blood requirement requests containing relevant details such as
    hospital, city, required blood group/component, urgency, and
    requester contact method.
-   Request expiry, closure, and reporting tools.
-   Links or directory entries for verified hospitals and blood banks.
-   Shareable emergency-request pages with carefully controlled
    information.
-   Admin tools to review abuse reports and remove fraudulent or expired
    requests.
-   Consent and a simple way for donors to pause or delete their
    listing.

**Safety requirements:** JainConnect is a discovery and coordination
tool, not a medical authority or blood-compatibility system. A qualified
medical professional and authorized blood bank must determine
compatibility, donor eligibility, and collection. The app must not
guarantee that a donor is eligible or available. Do not expose a donor's
exact location or phone number publicly by default. Require consent
before sharing personal details. Use expiry and re-confirmation
workflows for requests and donor availability.

### 6.4 Jain Bhojanalay & Food Services

-   Directory of Jain bhojanalays, bhojanshalas, and relevant vegetarian
    food facilities.
-   Search by city, area, and proximity where the user permits location
    access.
-   Address, map directions, public contact details, operating hours,
    and available facilities.
-   Prices and meal availability where the listing owner supplies
    current information.
-   Clearly labeled dietary information, such as no onion/garlic, only
    when confirmed by the provider.
-   Pilgrim-friendly food information.
-   Listing corrections, reports, and verification.
-   Filters for service type and facilities.

Do not assume every establishment follows the same food rules. Dietary
claims and opening hours should have a source or last-updated date.

### 6.5 Jain Gurus & Spiritual Profiles

-   Profiles for recognized Jain acharyas, munis, aryikas, sadhvis, and
    other spiritual teachers.
-   Biography and tradition/lineage information where reliably sourced.
-   Public teachings, publications, and official social/video links.
-   Upcoming pravachan and event schedules.
-   Recorded pravachan library.
-   Search by teacher, topic, language, location, or event.
-   Shareable profile and video links.
-   Admin review, correction requests, and source attribution.

Only publish information that is public and appropriately sourced.
Obtain permission where required for photographs, biographies,
recordings, and other copyrighted material. Avoid implying an
endorsement by a guru or institution without authorization.

### 6.6 Pravachan Videos & Live Streams

-   Video library with teacher, topic, language, date, and source
    metadata.
-   Upcoming live-session schedule.
-   Live stream pages and notifications where supported.
-   Embedding of authorized YouTube or other provider streams when
    permitted by the provider.
-   Links to official channels when embedding is unavailable.
-   Playback error and unavailable-stream states.
-   Moderation and reporting.
-   Shareable live-event and recording pages.

For the initial implementation, prefer authorized external video embeds
and official links instead of building a custom live-streaming
infrastructure. Native streaming, recording, transcoding, or video
hosting can be considered later if there is a demonstrated need and a
sustainable budget. Embedding a video does not grant permission to
rebroadcast it; ownership, platform terms, and consent must be
respected.

### 6.7 Jain Temple Directory

-   Dedicated public page for each listed Jain temple.
-   Temple name, images, address, map directions, timings, contact
    channels, history, and available facilities.
-   City, state, pilgrimage-route, and facility filters.
-   Temple events, announcements, gallery, and authorized live
    darshan/pravachan links.
-   Participating temple or trust representative accounts.
-   Listing ownership requests, updates, verification, and reporting.
-   Direct donation section for verified and participating
    temples/trusts.
-   Shareable temple links.

Temple details and donation information should be reviewed before
verification. A temple listing must not be marked verified solely
because someone submitted a form.

### 6.8 Temple & Trust Donations

-   Each participating temple/trust has a separate donation section.
-   Verified authorized representatives can submit or update payment
    details.
-   Supported details may include the recipient's official name, UPI ID,
    QR code, and other approved payment instructions.
-   Donation purpose labels, such as temple maintenance, bhojanshala
    seva, or an approved development campaign.
-   Clear recipient identity before the user scans or pays.
-   QR/image preview and basic validation of uploaded files.
-   Change history and re-verification when payment details change.
-   Reporting mechanism for suspicious or outdated details.
-   Donation instructions and appropriate disclaimers.

**Payment flow:** Payments should go directly to the selected temple or
trust through its own approved payment details. JainConnect/NovaEdge
must not collect or route these funds through its maintenance account. A
static QR code alone generally does not confirm that a payment
succeeded. Do not show an automatic "payment successful" state unless a
legitimate payment-provider integration confirms it. Do not claim a
donation is tax-deductible unless that status has been verified.

### 6.9 JainConnect Maintenance Support

-   Dedicated "Support JainConnect" page.
-   Optional UPI QR code and payment instructions controlled by the
    platform operator.
-   Plain-language explanation that contributions support hosting, VPS,
    domain, database, storage, email/SMS services, security, backups,
    and maintenance.
-   A clear statement that payment is voluntary and not required to use
    the app.
-   A basic, transparent summary of operating costs and contributions
    where practical.
-   Contact details for questions or corrections.
-   No forced donation pop-ups, access restrictions, or misleading
    donation claims.

Platform maintenance contributions must remain separate from
temple/trust donations in the UI, records, accounting, and backend data
model. Confirm the appropriate legal, accounting, and tax treatment for
the operating entity before launch.

### 6.10 Jain Yatra, Dharamshala & Pilgrimage

-   Jain pilgrimage destinations and route information.
-   Nearby temples, dharamshalas, bhojanalays, and relevant services.
-   Public facilities, contact information, and directions.
-   Availability information only when supplied and kept current by an
    authorized provider.
-   Booking enquiry or request workflows for participating facilities,
    if enabled.
-   Travel tips and notices with source and update dates.

Do not advertise real-time room availability or confirmed bookings
unless the provider integration supports them.

### 6.11 Seva, Charity & Community Initiatives

-   Verified charity and seva campaign pages.
-   Education assistance, medical support, food distribution, animal
    welfare, and other approved initiatives.
-   Organizer identity, purpose, location, dates, and supporting
    documents where appropriate.
-   Clear recipient and payment destination for every fundraising
    campaign.
-   Campaign updates, reports, closure status, and complaint handling.
-   Direct-to-recipient payment arrangements where legally and
    technically appropriate.

Campaign verification must be meaningful and documented. Avoid
publishing unverified fundraising appeals as confirmed initiatives.

### 6.12 Notifications & Announcements

-   Upcoming festivals and religious events.
-   New pravachan or scheduled live streams.
-   Community announcements.
-   Relevant blood-request alerts, subject to user preferences and
    consent.
-   Updates from followed temples, organizations, or teachers.
-   Notification categories and mute/opt-out controls.
-   Avoid unnecessary, excessive, or sensitive push notifications.

### 6.13 Sharing, Discovery & Growth

-   Share the app through WhatsApp, Telegram, and the operating system's
    share sheet.
-   Shareable public links for temples, gurus, events, resources, and
    blood requests.
-   Web pages that remain useful to people who have not installed the
    app.
-   App-install links and referral attribution where
    privacy-appropriate.
-   Search-engine-friendly metadata and structured page content.
-   Sitemap and canonical URLs for eligible public pages.
-   Social sharing previews.
-   Report/correction links on public pages.

Sharing should never expose private donor information, hidden contact
details, or internal admin data.

### 6.14 Authentication & User Accounts

-   Public browsing for public information wherever practical.
-   Sign-in required for actions that need identity, consent, or
    moderation, such as donor registration, submitting requests, and
    managing listings.
-   Secure authentication and account recovery.
-   User profile and notification preferences.
-   Consent records where needed.
-   Account data export/deletion workflow as applicable.
-   Role-based permissions for ordinary users, listing owners,
    temple/trust representatives, moderators, and administrators.

### 6.15 Admin Dashboard & Moderation

-   Manage users, roles, organizations, temples, gurus, bhojanalays,
    events, resources, and public listings.
-   Review verification requests and supporting evidence.
-   Approve, reject, suspend, or request corrections.
-   Manage reports, spam, fraudulent content, and expired blood
    requests.
-   Manage platform-maintenance donation instructions.
-   Review temple/trust donation details and changes.
-   Manage official content, videos, live events, and announcements.
-   Maintain audit logs for sensitive actions.
-   Basic analytics for searches, listing engagement, reports, and
    feature usage.
-   Manage notification templates and operational settings.
-   Backup, restore, and incident-response procedures.

Admin actions affecting verified profiles, payment details, or sensitive
data should be logged. Use least-privilege access and require stronger
protection for administrator accounts.

### 6.16 Transparent NovaEdge Digital Labs Branding

-   "Developed and maintained by NovaEdge Digital Labs" in an
    appropriate About/credits location.
-   Founder/developer profile and company website/contact links, where
    desired.
-   A professional technology/services page that explains the company's
    role.
-   No deceptive claims of endorsement by a temple, trust, guru, or
    community body.
-   Community utility remains the main user experience; advertising
    should not obstruct core tasks.

------------------------------------------------------------------------

## 7. Recommended Technology Stack

The stack should be practical to build and maintain, suitable for a
small engineering team, and able to support additional modules as the
user base grows.

### 7.1 Mobile App

**Flutter + Dart**

Why: - One primary codebase for Android and potential future iOS
support. - Consistent UI and reusable widgets. - Strong ecosystem for
routing, forms, state management, maps, notifications, and media
embeds. - Good fit for a feature-rich community app.

Recommended supporting packages (select and pin versions during
implementation): - State management: Riverpod or Bloc; choose one
consistently. - Navigation: `go_router`. - API calls: `dio` or `http`. -
Secure local token storage: a maintained secure-storage package. - Push
notifications: Firebase Cloud Messaging, with appropriate platform
configuration. - Deep links: verified app links/universal links where
supported. - Maps: a suitable map provider SDK, subject to provider
terms and cost. - Video: official embeds or a maintained WebView/player
approach that respects provider policies.

Do not store privileged secrets, database credentials, or server signing
keys inside the mobile app.

### 7.2 Public Website

**Next.js + TypeScript**

Purpose: - Public temple, guru, event, resource, and directory pages. -
Search-engine discoverability. - App-install landing page and product
information. - Shareable URLs and social preview metadata. - Optional
authenticated account or listing-management pages where useful.

Recommended: - Next.js App Router. - TypeScript. - A consistent
component system and accessible design tokens. - Server-rendered or
statically generated public pages where appropriate. - Sitemap, robots
directives, metadata, canonical URLs, and structured data where
accurate. - Responsive design and performance monitoring.

The website is a companion to the Flutter app, not a substitute for it.

### 7.3 Backend API

**Node.js + Express.js + TypeScript**

Why: - Aligns with the proposed JavaScript/TypeScript development
workflow. - Provides REST APIs for Flutter, the website, and the admin
dashboard. - Supports modular feature boundaries and a familiar
ecosystem. - Can integrate with PostgreSQL, object storage, email
services, notifications, and video providers.

Recommended backend practices: - REST API with versioning, for example
`/api/v1`. - Modular structure by domain/feature. - Request validation
using Zod or a comparable schema validator. - Centralized error handling
and consistent response formats. - Authentication and role/permission
middleware. - Structured logs, health endpoints, request IDs, and
monitoring. - OpenAPI documentation. - Rate limiting and abuse controls
on public and sensitive endpoints. - Automated unit, integration, and
API contract tests. - Background jobs for expiry, reminders, email, and
cleanup tasks. - Explicit configuration validation and environment-based
secrets.

Express is suitable for the first version. A different framework is not
required unless later scale, team structure, or operational requirements
justify a change.

### 7.4 Primary Database

**PostgreSQL**

PostgreSQL is the recommended primary database because JainConnect has
many connected, structured entities: users, organizations, temples, guru
profiles, locations, events, donation instructions, reports,
permissions, and verification records.

Benefits: - Relational integrity and foreign-key constraints. -
Transactions for important multi-step operations. - Indexes for search
and filtering. - Reliable modelling of roles, ownership, and
recipient/payment separation. - Geospatial support through PostGIS if
advanced nearby-place queries become necessary. - Good support for audit
and reporting queries.

**ORM:** Prisma with TypeScript is recommended for developer
productivity, typed queries, schema migrations, and maintainable data
access. SQL can still be used where justified.

MongoDB is not the default recommendation for this product. It can work,
but PostgreSQL better matches the connected records and integrity
requirements described above. Avoid introducing multiple primary
databases without a demonstrated need.

### 7.5 Search & Location

Initial version: - PostgreSQL full-text search and indexes. -
Latitude/longitude fields for place discovery. - A mapping/geocoding
provider selected after checking pricing, usage limits, attribution, and
privacy terms.

Later, if search needs outgrow the primary database: - Consider a
dedicated search engine such as Meilisearch or OpenSearch. - Consider
PostGIS for richer radius and spatial queries.

Do not add a separate search service on day one unless real requirements
demand it.

### 7.6 Media & File Storage

Use object storage for temple images, profile photos, approved
documents, and other uploads. Choose a provider after comparing cost,
region, access control, bandwidth, and backup options. Examples include
an S3-compatible provider or Cloudinary for suitable image workflows.

Requirements: - Upload validation and file-size limits. - MIME-type and
file-content checks where feasible. - Randomized storage keys rather
than trusting user filenames. - Private storage for verification
documents. - Public access only for approved assets. - Signed URLs for
private files where appropriate. - Image resizing/compression and
deletion policies. - No sensitive donor documents in public storage.

For video, use authorized external platforms initially. Self-hosted
video delivery can substantially increase bandwidth and infrastructure
cost.

### 7.7 Authentication, Email & Push Notifications

-   Authentication: secure server-side sessions or short-lived access
    tokens with a carefully designed refresh flow.
-   Passwords, if used, must be stored using a modern password-hashing
    algorithm; never store plaintext passwords.
-   Social sign-in may be added if it simplifies onboarding and is
    configured securely.
-   Email: a reputable transactional email provider for verification and
    operational messages.
-   Push: Firebase Cloud Messaging for supported platforms.
-   SMS/OTP: only if needed; evaluate cost, delivery reliability, and
    abuse risks.
-   Store secrets only in server-side environment configuration or a
    secret manager.

### 7.8 Payments & QR Codes

Initial approach: - Static UPI QR/payment instructions for optional
JainConnect maintenance support. - Separate approved UPI QR/payment
instructions for each verified temple or trust. - No payment collection
or fund pooling by JainConnect for temple donations. - Clear recipient
identity and purpose before a user pays. - No claim of automatic payment
confirmation without provider-backed verification.

Later, payment gateway integration can be evaluated if there is a
justified need. A gateway must support the intended recipient/payment
arrangement and applicable compliance requirements. Do not assume that a
standard payment account can legally or technically split payments to
arbitrary trusts.

### 7.9 Hosting & Deployment

A practical initial deployment may use: - Linux VPS or a managed Node.js
hosting service for the API. - Managed PostgreSQL where budget permits;
otherwise a carefully administered database with tested backups. -
Object storage for media. - HTTPS through a trusted TLS setup. - A
reverse proxy such as Nginx or a managed ingress. - Automated
deployments from a protected Git repository. - Separate development,
staging, and production environments. - Domain/DNS management and uptime
monitoring. - Centralized logs and error reporting. - Scheduled backups
and periodic restore tests.

Do not assume a single small VPS can safely host unlimited users, live
video, database workloads, and all media traffic. Monitor resource usage
and scale components when actual usage requires it.

### 7.10 Admin Dashboard

**Next.js + TypeScript**, sharing UI conventions with the public website
but deployed and protected appropriately.

Requirements: - Role-based access. - Strong administrator
authentication. - Optional multi-factor authentication. - Sensitive
action confirmations. - Audit logs. - Search and filters for operational
records. - Verification queues and moderation tools. - No public
exposure of internal endpoints or privileged credentials.

### 7.11 Testing & Engineering Quality

-   Flutter unit and widget tests.
-   Backend unit and integration tests.
-   API contract tests.
-   Website component and end-to-end tests where practical.
-   Authorization tests for every sensitive role and resource.
-   Database migration tests.
-   Upload, QR display, deep-link, notification, and sharing tests.
-   Backup/restore tests.
-   Accessibility, responsiveness, and performance checks.
-   Dependency and secret scanning.
-   Production smoke tests after deployment.

### 7.12 Development Tools

-   Git and GitHub for version control and code review.
-   ESLint and Prettier for backend/web formatting and linting.
-   TypeScript strict mode for backend and website code.
-   Dart formatter and Flutter analyzer.
-   Environment-variable validation.
-   CI workflow for lint, tests, build checks, and release artifacts.
-   API documentation using OpenAPI/Swagger tooling.
-   Issue tracking and release checklists.

------------------------------------------------------------------------

## 8. High-Level Architecture

``` text
Flutter Android App          Next.js Public Website
          |                           |
          +------------+--------------+
                       |
                HTTPS / REST API
                       |
             Node.js + Express API
                       |
        +--------------+----------------+
        |              |                |
   PostgreSQL     Object Storage    External Providers
   + Prisma       Images/Files      Email/Push/Maps/Video
        |
  Scheduled Jobs / Background Tasks

Next.js Admin Dashboard
          |
    Protected Admin APIs
          |
   Same backend and database
```

The backend is the source of truth for permissions, listing status,
verification, donation instructions, request expiry, and sensitive
workflows. The mobile app and website must not independently decide that
a user or payment is verified.

------------------------------------------------------------------------

## 9. High-Level Data Domains

The database schema should be designed and reviewed before
implementation. Likely domains include:

-   Users, profiles, sessions, roles, and permissions.
-   Organizations, community associations, and business listings.
-   Temples, temple representatives, and verification records.
-   Gurus, biographies, media records, and public source links.
-   Events, calendar entries, announcements, and reminders.
-   Resources, articles, books, and attribution metadata.
-   Bhojanalays, dharamshalas, pilgrimage places, and facilities.
-   Blood donors, consent records, availability confirmations, and
    requests.
-   Charity campaigns, organizers, recipients, and updates.
-   Temple/trust donation instructions and payment-detail change
    history.
-   JainConnect maintenance-support settings and optional contribution
    records.
-   User reports, moderation decisions, audit logs, and notification
    preferences.
-   Media assets, upload ownership, and access policies.

Temple/trust payment details and JainConnect maintenance-support
settings must be stored and managed separately. Access to personal donor
data and private verification documents must be tightly restricted.

------------------------------------------------------------------------

## 10. Security, Privacy & Trust

-   Collect only the data required for a clear product purpose.
-   Obtain explicit consent for donor registration and personal-data
    sharing.
-   Provide clear privacy notices and data-retention policies.
-   Protect data in transit using HTTPS and use appropriate at-rest
    protections.
-   Validate all input server-side.
-   Apply least-privilege authorization to every sensitive operation.
-   Rate-limit authentication, donor search, emergency requests,
    uploads, and reporting.
-   Keep secrets out of source control and client bundles.
-   Record sensitive admin changes.
-   Back up the database and test restoration.
-   Provide abuse reporting and moderation workflows.
-   Remove or expire stale blood requests and outdated availability
    claims.
-   Restrict access to private verification files.
-   Avoid exposing exact locations or personal phone numbers by default.
-   Establish incident response and account-recovery procedures.
-   Review applicable Indian privacy, consumer, charitable-fundraising,
    payment, and tax requirements with qualified professionals before
    launch.

## 11. Verification & Content Governance

Use explicit states such as `pending`, `verified`, `rejected`,
`suspended`, and `needs_review` where appropriate.

Verification should consider the entity type: - Temples and trusts:
reliable public records and confirmation from an authorized
representative. - Organizations and businesses: appropriate public
contact and ownership confirmation. - Guru profiles: reliable source
material and confirmation where feasible. - Charity campaigns: organizer
identity, purpose, recipient, and relevant evidence. - Donation
instructions: recipient identity and authorization to publish the
payment details. - Blood banks/hospitals: reliable official source
information.

Verification is not a permanent guarantee. Provide re-checks, expiry
where appropriate, correction requests, and an audit trail. Clearly
distinguish a verified identity from a guarantee that a listing's
current hours, availability, or claims are always correct.

## 12. Free Platform & Funding Model

### What stays free

-   Browsing public directories, temples, resources, events, and
    available media.
-   Searching for community services.
-   Accessing public guru and temple pages.
-   Sharing public links.
-   Using core community features without a donation.

Some actions may require sign-in for consent, security, or moderation
reasons, but not payment.

### JainConnect operating support

Voluntary contributions may help pay for: - VPS or application
hosting. - Database hosting and backups. - Domain and DNS. - File
storage and bandwidth. - Email, notifications, and other provider
usage. - Monitoring, security, and maintenance.

The app should not imply that a contribution guarantees a service level
or special access unless such a policy is deliberately established and
clearly disclosed.

### Temple and trust donations

-   Each participating recipient controls its own approved donation
    instructions.
-   Users see the recipient name and purpose before paying.
-   Donations go directly to the recipient's account or payment handle.
-   JainConnect maintenance funds are kept separate.
-   QR-code payment is not treated as proof of payment unless verified
    by an appropriate integration.
-   Receipts, refund policies, and tax claims must be handled accurately
    and by the appropriate recipient/operator.

------------------------------------------------------------------------

## 13. Public Website & Discoverability

The public website should allow search engines and people without the
app to access eligible public information.

Recommended public routes: - `/temples/[slug]` - `/gurus/[slug]` -
`/events/[slug]` - `/resources/[slug]` - `/bhojanalay/[slug]` -
`/dharamshalas/[slug]` - `/community/[slug]` -
`/blood-requests/[public-id]` only where safe and consented

Public pages should use descriptive titles, metadata, canonical URLs,
suitable structured data, optimized images, and social preview cards.
Private account data, donor contact details, internal verification
documents, and administrative records must never be indexed.

Do not create empty or misleading pages solely to rank in search
engines. Public pages should provide useful, accurate, maintained
information.

## 14. Development Roadmap

The entire agreed feature scope remains part of the product vision.
Phased delivery is a method of reducing risk, not a decision to
permanently remove features.

### Phase 0 --- Product & operational foundation

-   Confirm branding, domain, ownership, and governance.
-   Finalize requirements, UX flows, database design, and API contracts.
-   Establish repository structure, environments, CI, backups, and
    security baseline.
-   Define verification and content policies.

### Phase 1 --- Core platform

-   Flutter app shell and navigation.
-   Next.js public website and protected admin dashboard.
-   Authentication and roles.
-   Community directory.
-   Temple directory and public profiles.
-   Jain calendar, resources, and events.
-   Bhojanalay directory.
-   Shareable public pages and basic SEO.
-   Initial moderation and verification workflows.

### Phase 2 --- Blood network and community operations

-   Donor registration and consent.
-   Blood requests, filters, expiry, and reporting.
-   Verified blood-bank/hospital directory.
-   Notifications and shareable request pages.
-   Privacy and abuse-prevention testing.

### Phase 3 --- Gurus and media

-   Guru profiles.
-   Pravachan library and authorized embeds.
-   Upcoming live events and official live-stream links.
-   Temple event media and supported live darshan.
-   Content-source and rights-management workflows.

### Phase 4 --- Donations and seva

-   Separate JainConnect maintenance-support page and QR configuration.
-   Verified temple/trust donation instructions.
-   Payment-detail approval and change history.
-   Charity/seva campaign workflows.
-   Transparent donation guidance and operational policies.

### Phase 5 --- Yatra and advanced operations

-   Pilgrimage discovery and route information.
-   Dharamshala facilities and availability enquiries.
-   Enhanced map/search features.
-   Expanded reporting, analytics, and operational tooling.
-   Performance testing and capacity improvements.

### Phase 6 --- Release and expansion

-   Pilot with willing community members and participating
    organizations.
-   Validate content quality and moderation capacity.
-   Android release preparation and Play Store compliance.
-   Production website and API deployment.
-   Monitoring, backup/restore validation, incident procedures, and
    support process.
-   Region-by-region listing expansion.

Phases may overlap after requirements are validated. Dates and costs
should be estimated after design, provider selection, and scope review.

------------------------------------------------------------------------

## 15. Release Acceptance Criteria

Before public launch, verify at minimum:

-   All core screens have loading, empty, error, and success states.
-   Public directory and profile pages work on mobile and desktop.
-   Search, filters, and sharing links behave correctly.
-   Private actions enforce authentication and role checks on the
    server.
-   Temple/trust donation recipients are verified and clearly
    identified.
-   JainConnect maintenance donations are clearly separate from temple
    donations.
-   No payment is required to use core features.
-   QR payment screens do not falsely report transaction success.
-   Blood donor consent, privacy, request expiry, and reporting are
    tested.
-   Live/video content uses authorized sources and handles unavailable
    streams.
-   Admin changes to verified profiles and payment details are
    auditable.
-   Sensitive files and personal data are not publicly accessible.
-   Database backup and restore procedures have been tested.
-   Privacy policy, terms, contact details, and content-reporting
    process are published.
-   Flutter release build, website build, API checks, and security tests
    pass.
-   Hosting costs, provider limits, and maintenance ownership are
    documented.

## 16. Success Metrics

Measure usefulness and reliability rather than downloads alone.

-   Active users and repeat usage.
-   Number and freshness of verified listings.
-   Search success and profile engagement.
-   Number of active community organizations and participating temples.
-   Blood-request response rate and time to first meaningful response,
    where measured responsibly.
-   Expired or fraudulent request/report rate.
-   Pravachan and event engagement.
-   Public-page sharing and search discovery.
-   Correction turnaround time and moderation backlog.
-   Uptime, API latency, crash rate, and failed requests.
-   Operating costs, voluntary maintenance contributions, and funding
    coverage.

Do not publish impact claims, such as lives saved or donations
delivered, unless there is reliable evidence to support them.

## 17. Risks & Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Inaccurate or outdated listings     Verification states, last-updated
                                      timestamps, owner updates, and
                                      reporting

  Fraudulent blood requests           Consent, moderation, expiry,
                                      reporting, and careful contact-data
                                      handling

  Misused temple QR codes             Verified recipient identity,
                                      approval workflow, change history,
                                      and visible recipient details

  Confusion between donation types    Separate pages, settings, records,
                                      labels, and payment destinations

  Copyright or live-stream            Official links, permitted embeds,
  restrictions                        rights checks, and takedown process

  High video bandwidth costs          Use authorized external hosting
                                      initially

  Spam or malicious uploads           Rate limits, validation,
                                      moderation, and restricted file
                                      access

  Platform costs exceed donations     Monitor usage, budget for recurring
                                      expenses, and maintain a
                                      transparent support model

  Broad scope delays launch           Modular implementation, phased
                                      testing, and explicit acceptance
                                      criteria

  Loss of trust                       Transparent ownership, privacy
                                      policy, correction channels, and
                                      accountable administration
  -----------------------------------------------------------------------

## 18. Open Decisions Before Implementation

These decisions should be finalized during product design: - Final logo,
colors, typography, and visual system. - Domain name and public contact
details. - Initial language support and localization strategy. -
Authentication methods and whether public browsing requires an account
for any feature. - Map/geocoding provider and budget. - Object-storage
and email provider. - Exact verification evidence required for each
entity type. - Donation-support wording, operating entity, accounting,
and legal/tax treatment. - Content submission, moderation, and copyright
procedures. - Whether temple/trust representatives can manage their own
pages immediately or must request admin changes. - Release and ongoing
maintenance responsibilities.

## 19. Final Product Statement

JainConnect is a free, community-first digital platform that brings Jain
community directories, temples, spiritual teachers, religious resources,
events, blood donation coordination, food services, pilgrimage
information, charity, and direct temple/trust donation information into
one connected experience.

The platform will be built with Flutter for Android, Next.js and
TypeScript for the public website and admin dashboard, Node.js and
Express.js for the backend API, and PostgreSQL with Prisma for
structured data. It will use appropriate object storage, external media
providers, notifications, monitoring, and security controls.

NovaEdge Digital Labs will be transparently credited as the technology
partner. Voluntary JainConnect support will help fund platform
operations, while temple and trust donations remain separate and go
directly to their respective recipients.

**Core principle:** Make JainConnect useful, trustworthy, accessible,
and sustainable for the community.
