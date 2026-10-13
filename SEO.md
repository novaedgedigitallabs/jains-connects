# JainConnect --- SEO, AEO, GEO & Discoverability Strategy

**File:** `SEO.md`\
**Version:** 1.0\
**Product:** JainConnect\
**Platforms:** Next.js public website, Flutter Android app,
Node.js/Express API\
**Brand:** JainConnect --- developed and maintained by NovaEdge Digital
Labs\
**Primary market:** India, with region-by-region content expansion

------------------------------------------------------------------------

## 1. Purpose

This document defines the organic discovery and search visibility
strategy for JainConnect across traditional search engines, answer
engines, AI-powered search experiences, local discovery, app stores, and
social sharing.

The objective is not to generate thousands of thin pages or chase
search-engine loopholes. The objective is to publish genuinely useful,
accurate, maintained information that helps people find Jain temples,
community services, religious resources, events, gurus, bhojanalays,
dharamshalas, and appropriate blood-donation resources.

SEO, AEO, and GEO improve discoverability; they do not guarantee
rankings, citations, AI mentions, traffic, installs, or donations.

## 2. Definitions

-   **SEO --- Search Engine Optimization:** Improve crawlability,
    indexability, relevance, usability, and organic visibility in
    traditional search engines.
-   **Local SEO:** Help users discover relevant real-world places
    through location-specific pages, accurate listings, maps, and
    business information.
-   **AEO --- Answer Engine Optimization:** Make factual,
    well-structured content easy for search systems to understand and
    use when answering questions.
-   **GEO --- Generative Engine Optimization:** Improve the clarity,
    authority, originality, and verifiability of content so it can be
    understood and potentially referenced by AI-powered search and
    answer experiences.
-   **ASO --- App Store Optimization:** Improve the discoverability and
    conversion of the JainConnect Android app listing.
-   **Social discovery:** Make public pages render good previews and
    share easily through WhatsApp, Telegram, and other channels.

These practices overlap. There is no reliable "AI ranking hack," special
markup, or guaranteed technique for inclusion in generated answers.

## 3. Business and user goals

### User goals

-   Find a nearby Jain temple, bhojanalay, or dharamshala.
-   Learn about Jain festivals, dates, traditions, and resources.
-   Find verified information about a guru or pravachan.
-   Discover community events and organizations.
-   Find relevant blood-donation resources safely.
-   Access verified temple/trust donation information.
-   Share accurate information with family and community groups.

### Platform goals

-   Build sustainable organic discovery for genuinely useful public
    pages.
-   Earn community trust through accuracy, sourcing, and transparent
    ownership.
-   Increase useful visits, repeat use, app installs, and verified
    listing submissions.
-   Help participating temples and organizations maintain correct public
    information.
-   Make platform funding transparent without turning public content
    into donation advertising.

## 4. Search architecture

### 4.1 Public website is the discovery layer

Use Next.js for public, indexable pages. Flutter is the mobile product,
not the primary crawlable content surface.

Public pages should render meaningful content in HTML and work without
requiring app installation or account creation, wherever the information
is public. Do not require client-side JavaScript to reveal all essential
text.

Recommended public route patterns:

``` text
/
 /about
 /contact
 /privacy
 /terms
 /report-information
 /temples
 /temples/[slug]
 /gurus
 /gurus/[slug]
 /pravachan
 /pravachan/[slug]
 /events
 /events/[slug]
 /calendar
 /resources
 /resources/[slug]
 /community
 /community/[slug]
 /bhojanalay
 /bhojanalay/[slug]
 /dharamshalas
 /dharamshalas/[slug]
 /pilgrimage
 /pilgrimage/[slug]
 /blood-network
 /blood-banks
 /blood-requests/[public-id]
 /charity
 /charity/[slug]
 /support-jainconnect
```

Routes are proposed examples. Keep only pages with useful, approved
content. Do not expose donor contact details, private requests, internal
verification evidence, admin pages, or sensitive personal data to search
engines.

### 4.2 URL rules

-   Use short, descriptive, stable, lowercase slugs.
-   Use hyphens between words.
-   Avoid random IDs in public URLs when a stable slug is appropriate.
-   Use one canonical URL per content item.
-   Redirect changed slugs with a permanent redirect when appropriate.
-   Avoid unnecessary query parameters in canonical URLs.
-   Do not encode the same content under multiple URLs.
-   Keep URL structures predictable across content types.
-   Do not change a URL simply to insert more keywords.

Example:

``` text
/temples/shri-digambar-jain-temple-indore
/events/mahavir-jayanti-indore-2027
/gurus/[verified-public-profile-slug]
/bhojanalay/[approved-place-slug]
```

The examples are illustrative; never create a public page for an
unverified or nonexistent entity.

## 5. Technical SEO

### 5.1 Crawlability and indexability

-   Use server-rendered or statically generated Next.js public pages
    where appropriate.
-   Return accurate HTTP status codes: `200` for valid pages, `301/308`
    for permanent moves, `404` for missing pages, and `410` only when
    removal is intentionally permanent.
-   Do not return `200` for deleted or nonexistent listings.
-   Keep internal navigation as crawlable HTML links.
-   Avoid blocking important CSS, JavaScript, or images needed to render
    public content.
-   Keep private/admin/API routes out of public sitemaps and index.
-   Use `noindex` for genuinely private, low-value, or duplicate pages
    where appropriate; `robots.txt` alone does not remove an already
    indexed URL.
-   Avoid generating indexable empty search-result combinations.
-   Prevent staging and preview environments from being indexed; use
    access controls and `noindex` as defense in depth.
-   Use Google Search Console and Bing Webmaster Tools to inspect
    crawl/indexing issues.

### 5.2 Metadata

Every indexable page must have unique, accurate metadata: - A
descriptive title. - A useful meta description. - A canonical URL. -
Appropriate Open Graph and social-sharing metadata. - A meaningful H1. -
Descriptive image alt text where images convey information.

Metadata examples:

``` html
<title>Jain Temples in Indore — JainConnect</title>
<meta
  name="description"
  content="Explore verified Jain temple listings in Indore, with available timings, directions, facilities, and official contact information."
/>
<link rel="canonical" href="https://YOUR-DOMAIN/temples/indore" />
```

Replace `YOUR-DOMAIN` with the final canonical domain. Do not copy this
description to every location page. Use only factual details present in
the actual page.

### 5.3 Sitemap

Generate XML sitemaps from approved, public, canonical records.

-   Include only indexable URLs that return `200`.
-   Include canonical URLs, not tracking URLs.
-   Exclude drafts, rejected/suspended records, private pages, and thin
    pages.
-   Split large sitemaps when needed and use a sitemap index.
-   Keep `lastmod` truthful: update it when meaningful content changes,
    not on every deployment.
-   Add the sitemap location to `robots.txt` and submit it to search
    consoles.
-   Remove URLs from sitemaps when content is no longer eligible for
    indexing.

Possible sitemap groups: - Core pages. - Temple pages. - Guru pages. -
Events. - Resources. - Bhojanalay and dharamshala pages. - Pilgrimage
pages. - Approved community organization pages.

### 5.4 Robots and canonicalization

A starting policy may look like:

``` text
User-agent: *
Disallow: /admin/
Disallow: /account/
Disallow: /api/
Sitemap: https://YOUR-DOMAIN/sitemap.xml
```

Review this against actual routes before release. Do not use
`robots.txt` as a substitute for authentication or access control.
Private content must be protected on the server. Avoid disallowing
public resources needed for rendering.

### 5.5 Performance and Core Web Vitals

Target good Core Web Vitals, measured from real-user data when
sufficient traffic exists:

-   Largest Contentful Paint (LCP): 2.5 seconds or less.
-   Interaction to Next Paint (INP): 200 milliseconds or less.
-   Cumulative Layout Shift (CLS): 0.1 or less.

These are "good" thresholds in Google's published guidance, evaluated at
the 75th percentile. Performance should be tested on realistic mobile
devices and networks.

Implementation practices: - Optimize images and use responsive sizes. -
Reserve image/video dimensions to reduce layout shift. - Lazy-load
below-the-fold images. - Do not lazy-load the primary above-the-fold
image when it is the LCP element. - Reduce unnecessary client-side
JavaScript. - Avoid autoplaying video on public pages. - Cache static
assets with appropriate immutable/versioned URLs. - Cache public data
carefully and invalidate it when approved listings change. - Monitor API
latency and database query performance. - Avoid third-party scripts that
do not provide clear value. - Test with PageSpeed Insights, Lighthouse,
and Search Console field data.

### 5.6 Mobile-first and accessibility

-   Responsive layouts and readable typography.
-   Semantic HTML, proper heading order, labels, keyboard focus, and
    meaningful alt text.
-   Good contrast and clear interactive controls.
-   Avoid text embedded in images.
-   Ensure public information remains usable with slow networks.
-   Provide helpful error and empty states.
-   Do not require app installation to read public informational pages.

Accessibility helps usability and content interpretation, but should not
be presented as a guaranteed ranking boost.

### 5.7 Structured data

Use Schema.org JSON-LD only when it accurately describes visible page
content and complies with search-engine guidelines.

Potential types, depending on the actual entity and current
eligibility: - `Organization` for JainConnect and appropriately verified
organizations. - `WebSite` for the public site. - `BreadcrumbList` for
navigational hierarchy. - `Article` or `BlogPosting` for genuine
editorial resources. - `Event` for real events with accurate dates,
times, location, organizer, and status. - `VideoObject` for videos with
appropriate metadata. - A suitable `Place`/`TouristAttraction`/other
schema only after confirming that it fits the entity type and
search-engine guidance.

Important: - Do not label a Jain temple as a `LocalBusiness` or
`ReligiousOrganization` merely because it sounds plausible. Confirm the
supported Schema.org type and search engine's current eligibility before
implementation. - Do not add fake ratings, reviews, prices,
availability, or event details. - Structured data must match visible
content. - Validate with the Schema Markup Validator and Google's Rich
Results Test where applicable. - Valid structured data does not
guarantee a rich result.

### 5.8 Duplicate and faceted pages

-   Canonicalize alternate URLs.
-   Avoid indexing every combination of blood group, city, filters, sort
    order, and query parameters.
-   Keep useful static category/location landing pages only when they
    have substantive content and reliable listings.
-   Do not publish programmatic location pages with only a swapped city
    name.
-   Noindex internal search pages if they create low-value duplicates.
-   Avoid near-identical pages that differ only in keyword wording.

### 5.9 Broken links and redirects

-   Run automated link checks.
-   Redirect retired slugs to the closest valid replacement when useful.
-   Do not redirect every removed listing to the homepage.
-   Keep internal links updated.
-   Use a custom 404 page with search and directory navigation.
-   Monitor crawl errors and server errors.

## 6. Local SEO

Local discovery is important for temples, bhojanalays, dharamshalas,
pilgrimage places, and participating community organizations.

### 6.1 Location pages

Create location pages only when there is sufficient verified content to
serve a real user need.

Example hierarchy:

``` text
/temples
/temples/madhya-pradesh
/temples/indore
/temples/indore/[temple-slug]
```

A useful city page can include: - A short, original introduction to the
area and directory. - Actual verified listings. - Address and directions
where approved. - Current opening hours only when confirmed. -
Facilities and contact details from reliable sources. - Last-updated
information. - A correction/report link. - Links to relevant events and
pilgrimage resources.

Do not create thousands of empty pages for every city, district, pin
code, or neighborhood. Index only pages with genuine value and enough
reliable content.

### 6.2 Google Business Profile and maps

JainConnect should have a Google Business Profile only if it meets
Google's eligibility rules as a real organization/service with an
eligible presence. Do not create fake addresses or duplicate profiles to
target more cities.

For each temple or business: - Encourage its authorized representative
to manage its own eligible profile. - Do not claim or edit a profile
without authorization. - Keep name, address, phone, website, and hours
accurate where applicable. - Do not represent JainConnect as the owner
of a temple. - Use map providers under their terms and display required
attribution.

### 6.3 Local entity data quality

Store normalized fields such as: - Display name and approved alternative
names. - Address components. - Latitude/longitude when verified and
appropriate. - Public contact channels. - Opening hours with source and
last-confirmed date. - Facilities and accessibility details. - Official
website/social links. - Verification status and review timestamp. -
Content owner and correction history.

For temples and sensitive places, location precision and public
disclosure should be reviewed with the authorized organization.

## 7. Keyword and Search-Intent Strategy

Do keyword research using actual search data, community interviews,
Search Console, and keyword tools. The examples below are topic ideas,
not claims about search volume or competition.

### 7.1 Temple discovery

-   Jain temple in \[city\]
-   Jain mandir near \[area\]
-   Jain temple timings in \[city\]
-   Jain temple directions
-   Jain pilgrimage places in \[region\]

Landing page: relevant directory/location page with real listings,
directions, and verified details.

### 7.2 Food and stay

-   Jain bhojanalay in \[city\]
-   Jain food near \[area\]
-   Jain bhojanshala \[city\]
-   Jain dharamshala in \[place\]
-   Dharamshala near \[temple/pilgrimage place\]

Landing page: useful listings with current details, dietary information
only when confirmed, and clear last-updated status.

### 7.3 Religious calendar and learning

-   Jain festival calendar \[year\]
-   Jain parv dates \[year\]
-   Jainism resources for beginners
-   Jain philosophy articles
-   Mahavir Jayanti events in \[city\]

Calendar pages must be checked against appropriate sources and explain
regional/tradition-specific differences where relevant.

### 7.4 Guru and pravachan discovery

-   \[Guru's public name\] pravachan
-   Jain pravachan in Hindi
-   Upcoming Jain pravachan \[city\]
-   Official live pravachan schedule

Use authorized recordings, official links, attribution, and accurate
event status. Do not create pages targeting a guru's name without
substantive and appropriately sourced content.

### 7.5 Blood donation

-   Blood bank in \[city\]
-   Blood donation camp \[city\]
-   How to find a blood donor safely
-   Official blood bank resources

Blood-network pages must not expose private donor data to attract search
traffic. Emergency listings should have carefully controlled indexing,
expiry, and personal-information policies.

### 7.6 Community and charity

-   Jain community organization \[city\]
-   Jain charitable trust \[city\]
-   Jain community events \[city\]
-   Verified Jain charity initiatives

Only publish factual, reviewed information and avoid implying
endorsement by organizations without permission.

### 7.7 Keyword mapping rules

-   One primary search intent per landing page.
-   Avoid multiple pages competing for the same intent without a clear
    reason.
-   Use natural language in titles, headings, descriptions, and body
    content.
-   Use alternative spellings and transliterations when helpful to
    users, not as keyword stuffing.
-   Support English and Hindi searches with useful localized content.
-   Research whether terms such as "Jain mandir," "Jain temple," "Jain
    bhojanalay," and regional spellings are actually used by the target
    audience.
-   Do not put every keyword into every page.

## 8. Content Strategy & Editorial Standards

### 8.1 Content principles

Every indexable page should answer a real user question, provide unique
value, and be maintained. Content must be accurate, sourced, clear, and
written for people---not produced in bulk to manipulate rankings.

### 8.2 Recommended content types

-   Verified temple and pilgrimage profiles.
-   City guides to temples and Jain facilities.
-   Jain calendar explainers with cited sources.
-   Festival and event pages.
-   Guru profiles with reliable source attribution.
-   Pravachan pages with authorized video links.
-   Guides to using blood-bank resources responsibly.
-   Practical guides for pilgrims.
-   Directory pages for community organizations.
-   Explanations of JainConnect's verification and donation processes.

### 8.3 Editorial requirements

For each substantial article or profile, keep: - Author or responsible
editor. - Published date and meaningful last-updated date. - Reliable
sources and citations. - Clear distinction between fact,
tradition-specific interpretation, and opinion. - Rights/permission
information for photos and media where required. - Correction/contact
route. - Review status for sensitive or disputed claims.

For religious content, cite recognized primary or credible sources where
possible and identify tradition-specific differences. Avoid presenting
contested interpretations as universally accepted.

For health-related or emergency content, prioritize official
medical/government sources and avoid personalized medical advice.

### 8.4 AI-assisted content

AI may help draft or organize content, but every factual listing,
religious claim, calendar date, medical instruction, profile, and
donation recipient must be reviewed by a responsible human before
publication.

Do not: - Publish hundreds of unreviewed AI-generated city pages. -
Invent temple details, opening hours, biographies, sources,
testimonials, or events. - Use AI-generated imagery to imply a real
temple or guru was photographed. - publish paraphrased or copied
material without rights or attribution. - Claim a human expert reviewed
content when that did not happen.

The finished page should demonstrate real editorial value, not generic
filler.

## 9. AEO --- Answer Engine Optimization

The aim is to make answers understandable and verifiable for people and
automated systems.

### 9.1 Page structure

For question-oriented content: 1. Use a descriptive H1 that matches the
page purpose. 2. Answer the main question directly in the opening
section. 3. Add clear H2/H3 headings for supporting questions. 4. Use
lists or tables when they genuinely improve comprehension. 5. Provide
source links for important factual claims. 6. State date, location,
eligibility, or limitations explicitly. 7. Include an
editor/contact/correction path where appropriate.

Example structure for a temple profile: - What is the temple called? -
Where is it located? - What are the published timings, and when were
they last confirmed? - What facilities are available? - How can visitors
contact the authorized organization? - What is the source of the
information?

Do not add FAQ blocks merely to insert keywords. Questions should
reflect real user needs.

### 9.2 FAQ strategy

Add FAQs only when they answer common, useful questions not already
resolved clearly by the page. Write concise, accurate answers with
source references where needed.

Do not expect FAQ rich results for every page. Search-engine eligibility
and presentation can change, and structured FAQ markup does not
guarantee enhanced visibility.

### 9.3 Answer quality

-   State facts directly.
-   Include relevant dates and locations.
-   Distinguish known information from unavailable or unverified
    information.
-   Attribute quotations and teachings.
-   Link to official sources when possible.
-   Avoid unsupported superlatives such as "the best" or "the largest."
-   Keep page content accessible without login when it is meant to be
    public.

## 10. GEO --- Generative Engine Optimization

GEO is an emerging practice rather than a guaranteed ranking system. No
markup, prompt, file, or "AI SEO" service can guarantee that ChatGPT or
another generative system will mention JainConnect.

Best practices: - Publish original, useful information with clear
sourcing. - Keep entity names, official URLs, and descriptions
consistent. - Explain who operates JainConnect and how it relates to
NovaEdge Digital Labs. - Provide reliable contact and correction
information. - Use meaningful headings, descriptive links, tables, and
structured content. - Cite primary sources for important facts. -
Maintain up-to-date public profiles and clear publication dates. - Earn
legitimate mentions and links from participating organizations,
community publications, and relevant partners. - Make key information
available as readable HTML rather than image-only text. - Avoid
manipulative link schemes, fake citations, mass guest posts, and
fabricated authority. - Do not create fake reviews or pretend a temple
or guru endorses the platform.

### 10.1 Entity clarity

The site should clearly explain: - What JainConnect is. - Who operates
and maintains it. - What its free services include. - How listings are
verified. - How platform-maintenance contributions differ from
temple/trust donations. - How to report incorrect information. - What
the platform does not verify or guarantee.

Consistent entity information improves clarity for users and may help
search systems understand the organization, but it does not guarantee AI
citations.

### 10.2 Third-party AI crawlers

Review the current published documentation and policies for each
search/AI provider before deciding whether to allow its crawler. Do not
assume all AI crawlers use the same user-agent, purpose, or access
policy. Keep sensitive and private data protected by authentication;
`robots.txt` is not access control.

## 11. App Store Optimization (ASO)

For the Google Play listing: - Use a clear app title: "JainConnect" if
available and policy-compliant. - Write a truthful short description
emphasizing actual features. - Use screenshots of the real, working
app. - Explain temple discovery, Jain calendar/resources, community
services, and blood-network safeguards accurately. - Use a readable app
icon that remains recognizable at small sizes. - Provide a useful
feature graphic where required. - Localize store text for supported
languages. - Request ratings/reviews through permitted, non-coercive
flows. - Respond professionally to feedback. - Track store listing
conversion and install quality. - Keep privacy declarations, data safety
information, permissions, and app behavior aligned.

Do not stuff keywords into the title, fabricate reviews, incentivize
misleading ratings, or promise features that are not live.

## 12. Social Sharing & Referral Discovery

Public content should be easy to share: - Correct Open Graph title,
description, and image. - Shareable canonical URLs for temples, events,
gurus, and resources. - Social preview images using approved photos and
accurate text. - WhatsApp/Telegram sharing from the app and website. -
App links/deep links that open the relevant in-app page when installed
and a useful web page otherwise. - A fallback when app links fail. -
Share controls that do not expose private donor details or internal
records.

Track aggregate share events only with an appropriate privacy notice and
data minimization.

## 13. Internal Linking

Create logical links between related content: - Temple pages → location
page, nearby facilities, related events, authorized live stream. - Guru
pages → authorized pravachan recordings and upcoming events. - Event
pages → venue, organizer, related resource, calendar. -
Bhojanalay/dharamshala pages → nearby temples or pilgrimage pages when
genuinely relevant. - City pages → verified listings and useful
guides. - Resources → reliable primary sources and related resources.

Use descriptive anchor text. Avoid giant automated link blocks and
irrelevant cross-linking.

## 14. Trust, Safety & Indexing Rules

### 14.1 Blood network privacy

-   Never publish donor phone numbers, exact locations, private medical
    data, or private request details for SEO.
-   Use consented, minimal public request summaries only if there is a
    clear user benefit.
-   Expire closed or stale requests promptly.
-   Keep donor discovery behind appropriate privacy and consent
    controls.
-   Use `noindex` or remove sensitive URLs where appropriate, while also
    enforcing server-side access restrictions.
-   Do not expose personal data in URLs, page titles, metadata,
    sitemaps, logs, or analytics events.

### 14.2 Donations

-   Separate the JainConnect maintenance-support page from each
    temple/trust donation page.
-   Show the verified recipient and purpose.
-   Never index internal verification documents, transaction records, or
    private donor information.
-   Do not use unverified claims about tax deductibility or financial
    impact.
-   Avoid misleading donation snippets or fake urgency.

### 14.3 User-generated content

-   Moderate public submissions.
-   Prevent untrusted user text from injecting page metadata or
    structured data.
-   Apply rate limits and abuse reporting.
-   Avoid indexing thin, duplicate, spammy, or unmoderated
    user-generated pages.
-   Provide a takedown/correction workflow.

## 15. Analytics & Measurement

Use privacy-conscious analytics and configure consent/notice
requirements as applicable.

### Core tools

-   Google Search Console.
-   Bing Webmaster Tools.
-   Google Analytics or a privacy-conscious alternative, subject to the
    product's privacy choices.
-   PageSpeed Insights and Lighthouse.
-   Server logs and error monitoring.
-   Google Play Console for app-store performance.

### SEO metrics

-   Indexed eligible pages and excluded-page reasons.
-   Impressions, clicks, click-through rate, and average position by
    page/query.
-   Organic landing sessions.
-   Search-to-useful-action rate.
-   Search traffic to verified listing pages.
-   Organic visits leading to directions, official contacts, or resource
    engagement.
-   Core Web Vitals field data.
-   Crawl errors, redirects, 404/5xx rates.
-   Referral traffic from legitimate community sites.
-   Conversion from store listing view to install.

### AEO/GEO monitoring

-   Monitor branded and non-branded discovery questions periodically.
-   Record the date, prompt/query, engine, answer, and cited URLs when
    doing manual checks.
-   Treat results as observations, not a standardized ranking metric.
-   Do not automate prohibited scraping or misrepresent visibility.
-   Do not use a single answer screenshot as proof of consistent AI
    visibility.

### Product trust metrics

-   Listing freshness.
-   Verified listing count.
-   Correction/report turnaround time.
-   Stale event and blood-request rate.
-   Broken official links.
-   User reports and moderation backlog.

Define each metric, its data source, and measurement window before
creating a dashboard.

## 16. Technical Implementation Checklist for Next.js

-   [ ] Define canonical production domain and redirect rules.
-   [ ] Use server-rendered/static public content where appropriate.
-   [ ] Build reusable metadata generation by content type.
-   [ ] Create `robots.txt` and dynamic XML sitemap(s).
-   [ ] Add canonical URLs and Open Graph metadata.
-   [ ] Add breadcrumbs where useful.
-   [ ] Add valid JSON-LD only for eligible and accurate entities.
-   [ ] Use image optimization, responsive sizes, and stable dimensions.
-   [ ] Ensure public page content renders in HTML.
-   [ ] Set correct HTTP status codes for missing/retired content.
-   [ ] Add custom 404 and useful error states.
-   [ ] Prevent staging, admin, account, and private records from being
    indexed.
-   [ ] Add noindex rules to low-value filtered/search pages where
    appropriate.
-   [ ] Validate structured data and sitemap URLs.
-   [ ] Add search-console verification.
-   [ ] Monitor Core Web Vitals and server errors.
-   [ ] Test mobile rendering, accessibility, and share previews.
-   [ ] Add a correction/report path to important listings.
-   [ ] Confirm analytics do not leak sensitive data.

## 17. Content Publishing Workflow

1.  A listing or article is submitted by an authorized person or editor.
2.  Validate required fields, URLs, uploads, and permissions.
3.  Review the source, identity, accuracy, and rights/permissions.
4.  Assign the correct verification/content status.
5.  Publish only when the record meets its content policy.
6.  Generate metadata, canonical URL, and structured data from approved
    fields.
7.  Include in sitemap only if it qualifies for indexing.
8.  Monitor reports, broken links, and content freshness.
9.  Update meaningful `lastmod` values when substantial changes occur.
10. Remove or noindex content when it becomes private, stale, invalid,
    or unsafe.

No user-submitted record should automatically become a verified public
SEO landing page.

## 18. Launch Plan

### Pre-launch

-   Confirm domain and canonical URL.
-   Finalize URL structure and redirects.
-   Publish About, Contact, Privacy, Terms, correction/reporting, and
    donation-explanation pages.
-   Verify that public content is real and approved.
-   Test sitemap, robots, canonical tags, metadata, and status codes.
-   Test private-data exposure and role permissions.
-   Check mobile speed, accessibility, and share previews.
-   Set up Search Console, Bing Webmaster Tools, and analytics.
-   Confirm app store copy matches live functionality.

### First 30 days

-   Submit sitemap and inspect priority pages.
-   Fix crawl/indexing and technical issues.
-   Publish high-value, verified temple and city pages only where
    sufficient content exists.
-   Review search queries and user feedback.
-   Check broken links, stale data, and conversion paths.
-   Ask participating organizations to link to their own verified
    JainConnect pages when appropriate; do not pay for or manufacture
    links.

### Days 31--90

-   Improve pages based on actual search and usage data.
-   Expand to more locations only when listings are reliable.
-   Add original, source-backed guides addressing observed user
    questions.
-   Review app listing conversion and onboarding friction.
-   Audit content freshness, crawl waste, and privacy safeguards.
-   Track referral traffic and legitimate community mentions.

This schedule is a working plan, not a guarantee of indexing or
rankings. Search visibility can take time and varies by site, query,
competition, and content quality.

## 19. Definition of Done

SEO/AEO/GEO implementation is ready for public launch when: 1. Important
public pages have unique, accurate metadata and canonical URLs. 2.
Eligible pages are rendered as useful HTML and linked internally. 3.
Sitemap and robots rules have been validated. 4. Private data and admin
routes are not exposed or indexed. 5. Structured data matches visible
content and validates where applicable. 6. Public location/listing pages
have useful, verified information. 7. Blood and donation pages follow
privacy and recipient-clarity requirements. 8. Content has sources,
responsible editorial ownership, and correction paths. 9. Mobile
performance, accessibility, and social previews have been checked. 10.
Search consoles and basic measurement are configured. 11. Staging and
production domains are correctly separated. 12. A maintenance owner and
content freshness process are defined.

## 20. Final Strategy

JainConnect should earn search visibility by becoming a dependable
source of practical, verified Jain community information. Technical SEO
makes pages discoverable; local SEO connects people to relevant places;
AEO makes answers clear and source-backed; GEO focuses on entity
clarity, original information, and verifiable references; ASO helps the
mobile app listing communicate its real value.

Do not optimize for search engines at the expense of user trust. Do not
publish unverified information, expose personal data, manufacture
backlinks, or promise AI visibility.

**Success principle:** Publish useful information, make it technically
accessible, keep it accurate, and measure whether it genuinely helps
people.
