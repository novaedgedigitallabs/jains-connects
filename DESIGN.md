# JainConnect --- Design System & UX/UI Guidelines

**File:** `DESIGN.md`\
**Version:** 1.0\
**Platforms:** Flutter Android app, Next.js public website, Next.js
admin dashboard\
**Brand credit:** Developed and maintained by NovaEdge Digital Labs

## 1. Design vision

JainConnect should feel like a thoughtfully designed community
service---not a generic AI-generated template, flashy startup landing
page, or religious poster converted into an app. Combine the clarity of
a well-made civic service with the warmth of a community institution.

The product should feel trustworthy, calm, human, culturally respectful,
and practical. Use strong typography, authentic photography, restrained
color, and predictable interactions. Avoid excessive gradients,
glassmorphism, glowing borders, 3D decorations, ornamental patterns,
oversized rounded cards, and unnecessary animations.

**Core principle:** Content and task completion come first. Decoration
comes last.

## 2. Brand personality

-   **Trustworthy:** Clear labels, source information, verification
    status, and predictable behavior.
-   **Grounded:** Practical layouts and restrained visual effects.
-   **Respectful:** Represent Jain traditions accurately without
    treating one tradition as universal.
-   **Human:** Real photographs, useful editorial content, and plain
    language.
-   **Accessible:** Readable text, sufficient contrast, touch-friendly
    controls, and large-text support.
-   **Efficient:** Search, filters, directions, contact, and sharing are
    easy to find.
-   **Consistent:** Share design tokens across Flutter and Next.js while
    adapting layouts to each platform.

Do not imply endorsement by a temple, trust, guru, or community body
without permission.

## 3. Color system

### 3.1 Brand palette

Use warm ivory as the main canvas, deep green for trust and stability,
and a restrained saffron accent for occasional highlights. This creates
a calm, editorial look without relying on gradients or clichés.

  -----------------------------------------------------------------------
  Token                   Hex                     Usage
  ----------------------- ----------------------- -----------------------
  `brand-900`             `#183D35`               Primary brand, active
                                                  navigation, strong
                                                  brand surfaces

  `brand-800`             `#245347`               Hover/pressed states
                                                  and secondary brand use

  `brand-700`             `#2F6B59`               Primary actions, after
                                                  contrast testing

  `brand-100`             `#E5F0EA`               Selected states and
                                                  soft brand surfaces

  `brand-50`              `#F3F7F4`               Subtle brand-tinted
                                                  backgrounds

  `accent-700`            `#9A5A12`               Small accent icons and
                                                  selected highlights

  `accent-100`            `#F8EBD5`               Warm accent backgrounds

  `canvas`                `#F8F7F2`               Main page background

  `surface`               `#FFFFFF`               Cards, forms, sheets,
                                                  dialogs

  `surface-muted`         `#F0EFE8`               Secondary panels

  `ink`                   `#202824`               Main text

  `ink-secondary`         `#5B655F`               Descriptions and
                                                  secondary text

  `ink-tertiary`          `#737C76`               Low-priority metadata;
                                                  verify contrast

  `border`                `#DDE2DC`               Dividers, card edges,
                                                  inputs

  `border-strong`         `#B8C3BA`               Stronger boundaries and
                                                  focus-adjacent borders

  `success`               `#23734D`               Successful states

  `success-bg`            `#E6F4EB`               Success messages

  `warning`               `#87530B`               Warnings

  `warning-bg`            `#FFF2D6`               Warning surfaces

  `danger`                `#B42318`               Errors and destructive
                                                  actions

  `danger-bg`             `#FDECEA`               Error surfaces

  `info`                  `#245C91`               Informational states

  `info-bg`               `#EAF3FB`               Information surfaces
  -----------------------------------------------------------------------

These are starting tokens, not a substitute for contrast testing. Verify
actual foreground/background combinations against WCAG 2.2 AA. Do not
use color alone to communicate state; include text, icons, or other
cues.

### 3.2 Color rationale

-   **Deep green:** communicates steadiness and continuity; use for
    brand and important actions, not every component.
-   **Warm ivory:** softens the interface and supports long reading
    sessions; use white surfaces for forms and dense content where
    clearer separation helps.
-   **Saffron/amber:** a restrained cultural accent for selected
    highlights and festival markers; not the default button color.
-   **Neutral ink:** provides readable, editorial contrast without large
    blocks of pure black.
-   **Semantic colors:** green means success, amber means caution, red
    means error/destructive, and blue means neutral information.

Starting visual ratio: 70% neutral surfaces, 20% text/borders/structure,
8% brand green, 2% saffron. This is a guideline, not a strict
measurement.

### 3.3 Dark mode

Do not mechanically invert the light palette. If implemented, use
charcoal-green surfaces, soft off-white text, subtle borders, and
contrast-tested semantic colors. Avoid pure black backgrounds and bright
green large surfaces. Test dark mode separately.

## 4. Typography

Recommended fonts: - English/Latin UI: **Inter**. - Hindi/Devanagari UI:
**Noto Sans Devanagari**. - Other Indic scripts: select appropriate
fonts when localization requirements are confirmed.

Use dependable fallbacks and avoid decorative display fonts for
navigation, forms, or long reading content.

  Style                   Size     Weight   Line height Use
  ------------ --------------- ---------- ------------- -----------------------------
  Display                32 px   650--700          1.15 Occasional landing headline
  H1                     28 px   650--700           1.2 Page title
  H2                     23 px   600--650          1.25 Main section
  H3                     19 px        600           1.3 Card/subsection title
  H4                     16 px        600          1.35 Small heading
  Body large             16 px        400          1.55 Main descriptions
  Body               14--15 px        400           1.5 General UI
  Label              13--14 px   500--600           1.4 Inputs and filters
  Caption        12 px minimum   400--500           1.4 Supporting metadata

Use plain, direct language. Prefer "Find a temple" over marketing
jargon, "Last updated 12 Oct 2026" over vague "Recently updated," and
"No temples found in this area" over generic slogans. Do not put long
paragraphs in tiny text.

## 5. Layout, spacing, and shape

### Spacing scale

Use a 4 px base: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px`.

-   4--8 px: icon/text gaps.
-   12--16 px: compact component padding.
-   16--24 px: standard cards and form sections.
-   24--32 px: content section separation.
-   40--64 px: major website section separation.

### Radius scale

-   Small controls: 6 px.
-   Inputs and standard buttons: 8 px.
-   Cards and panels: 10--12 px.
-   Dialogs and bottom sheets: 16 px.
-   Pills: status labels and compact filter chips only.

### Borders and width

-   Prefer a 1 px neutral border for cards and inputs.
-   Use shadows only when elevation explains interaction, such as menus
    or dialogs.
-   Avoid heavy permanent shadows and nested cards.
-   Mobile horizontal padding: 16--20 px.
-   Desktop general content: centered container around 1120--1200 px.
-   Long-form reading column: approximately 680--760 px.
-   Admin tables may use wider layouts but should remain usable on
    smaller screens.

Do not add empty space just to make a page look luxurious. Spacing
should clarify hierarchy.

## 6. Navigation

### Mobile app

Use a bottom navigation bar with no more than five destinations:

1.  **Home** --- search, quick actions, events, nearby services, recent
    content.
2.  **Discover** --- temples, gurus, bhojanalays, dharamshalas,
    organizations, businesses, resources.
3.  **Seva** --- blood network, charity, verified donation destinations.
4.  **Events** --- calendar, religious events, live pravachan schedule.
5.  **Profile** --- saved items, preferences, submitted
    listings/requests, settings.

Use icons with text labels. If "Seva" is unclear in user testing,
consider "Community" or "Help & Seva." Important blood-network actions
must be discoverable without making the whole interface feel alarming.

### Public website

Primary navigation: Home, Temples, Gurus & Pravachan, Community,
Bhojanalay & Stay, Calendar & Events, Blood Network. Include an obvious
search action. Keep "Support JainConnect" in a footer or secondary area
rather than making it the dominant call to action.

### Admin dashboard

Use a task-oriented sidebar: Overview, Listings, Temples & Trusts, Gurus
& Media, Events & Resources, Blood Requests, Donations & Seva, Reports &
Moderation, Users & Roles, Audit Logs, Settings. Keep admin operations
separate from public navigation.

## 7. Screen design guidance

### Home

Recommended order: 1. Simple page heading. 2. Prominent search: "Search
temples, gurus, bhojanalay..." 3. Four quick actions: Find a Temple,
Blood Network, Jain Calendar, Bhojanalay. 4. Upcoming events or festival
information with source/date. 5. Nearby services, only if location
permission is granted. 6. Latest pravachan or confirmed live event. 7.
Community announcements. 8. Optional, subtle Support JainConnect link
near the bottom or in the menu.

Avoid a giant hero banner that pushes useful actions below the fold. Do
not use carousels for essential content.

### Search and discovery

-   Support partial names and common spelling variants where practical.
-   Provide category and location filters.
-   Show counts only when accurate.
-   Include "Reset filters."
-   Provide helpful no-result suggestions.
-   Show verification status and last-updated information where
    relevant.
-   Make the primary result action obvious: View, Directions, Call, or
    Share.

### Temple profile

-   Authentic cover photograph with consistent crop.
-   Temple name and verification status.
-   Address and directions.
-   Timings and public contact details, with last-updated date when
    available.
-   Sections: Overview, Events, Gallery, Live, Donations.
-   Nearby facilities and report-correction link.
-   Name the recipient trust and donation purpose before displaying
    payment instructions.
-   Never show a verified badge before the verification workflow is
    complete.

### Guru profile

-   Authorized portrait, name, recognized title, and sourced tradition
    information.
-   Biography with attribution.
-   Upcoming pravachan, recordings, official channel links, and
    confirmed live status.
-   Related resources and share action.
-   Avoid popularity rankings without a transparent, justified
    methodology.

### Blood Network

-   Primary actions: "Find a Donor" and "Post a Blood Request."
-   Clear blood-group selector, city/hospital fields, availability, and
    last-confirmed date.
-   Explain data use before donor registration.
-   Show request expiry and status.
-   Do not expose exact location or phone number publicly by default.
-   Include a clear note that medical professionals and authorized blood
    banks determine eligibility and compatibility.
-   Use red only for relevant urgent status or errors, not as the
    full-page background.
-   Avoid frightening countdowns and unverified emergency claims.

### Bhojanalay and dharamshala

-   Search by location and service type.
-   List/map switch where maps add value.
-   Clear address, directions, timings, and facilities.
-   Show dietary claims only when confirmed.
-   Mark hours as unconfirmed when necessary.
-   Do not use generic stock photos as if they depict the actual place.

### Calendar and events

-   Offer list and calendar views where useful.
-   Make date, time, location, organizer, and source easy to scan.
-   Use a restrained accent for important dates.
-   Reminders must be opt-in.
-   Label regional or tradition-specific calendar differences.
-   Provide shareable event pages.

### Pravachan and live video

-   Use a stable 16:9 video frame.
-   Show title, speaker, source, date, language, and
    live/upcoming/recorded status.
-   Keep related videos below the player.
-   Show a live badge only when a stream is confirmed live.
-   Provide an official fallback link if embedding fails.
-   Respect source platform controls, copyright, and accessibility
    features.

### Donations

Always distinguish: - **Support JainConnect:** optional support for
platform operating costs. - **Donate to \[Temple/Trust\]:** payment
directly to the named recipient.

For temple/trust donations: - Display verified recipient name and
purpose. - Show the QR code and payment instructions. - Tell users to
confirm the recipient name in their payment app. - Provide a
report-payment-details link. - Do not claim success based on a QR scan
or a button click. - Do not mix platform-support messaging into the
temple donation flow.

For JainConnect support: - State that contributions are optional. -
Explain likely operating expenses. - Avoid guilt, pressure, or fake
urgency. - Never block features when users decline to donate.

### Forms and account screens

-   Put visible labels above fields; do not rely on placeholders alone.
-   Group related fields into short sections.
-   Mark required fields and explain why sensitive data is needed.
-   Show inline validation beside the relevant field.
-   Preserve safe form data after recoverable errors.
-   Confirm destructive actions.
-   Make privacy and notification settings easy to find.

### Admin

-   Prioritize queues, filters, statuses, and actions.
-   Use tables for dense records and cards only where they aid scanning.
-   Confirm suspension, deletion, and payment-detail changes.
-   Audit sensitive changes.
-   Hide private information unless the role and task require access.
-   Avoid vanity metrics without definitions and meaningful time ranges.

## 8. Component rules

### Buttons

-   Primary: deep green with high-contrast text.
-   Secondary: neutral surface with border.
-   Tertiary: text action for low-priority operations.
-   Destructive: semantic red.
-   Use clear verbs: "Find donor," "View directions," "Submit request,"
    "Share temple."
-   Define loading and disabled states; prevent duplicate submissions.
-   Target at least 48 × 48 logical pixels for mobile touch controls
    where practical.

### Inputs

-   Neutral surface, 1 px border, 8 px radius.
-   Visible focus state.
-   Error text must explain how to fix the issue.
-   Search should have a clear affordance and a way to clear the query.
-   Do not rely on color alone to indicate errors.

### Cards

-   Use cards to group items such as temples and events, not every
    paragraph.
-   Prefer subtle borders over heavy shadows.
-   Keep content aligned and actions obvious.
-   Use authentic images only when they add useful context.
-   Avoid nested cards.

### Status labels

Use explicit text such as Verified, Pending review, Live, Expired, or
Needs update. Color is secondary. Email verification alone does not mean
an organization or temple is verified.

### Icons

Use one consistent icon family, such as Material Symbols or Lucide. Pair
unfamiliar icons with text. Do not mix outline, filled, 3D, and emoji
icon styles. Avoid religious symbols as generic decoration.

## 9. Imagery and art direction

Prefer authentic photographs of actual temples, places, events, and
community spaces where permission exists. Use natural light, accurate
details, consistent image ratios, neutral image treatment, meaningful
website alt text, and credits when required.

Avoid: - AI-generated images that falsely represent a real temple, guru,
or event. - Fake testimonials or screenshots. - Unlicensed portraits and
pravachan recordings. - Excessive lotus, diya, mandala, and ornamental
motifs. - Neon gradients, glowing borders, and decorative 3D objects on
utility screens. - Generic stock-photo collages instead of real
community content.

If an actual image is unavailable, show a neutral placeholder---not a
fabricated location presented as real.

## 10. Motion and feedback

-   Keep transitions brief, generally 150--250 ms.
-   Show feedback after saving, submitting, copying, or sharing only
    when the action result is known.
-   Use skeletons sparingly.
-   Provide retry actions for recoverable failures.
-   Respect reduced-motion preferences where supported.
-   Avoid parallax, animated backgrounds, bouncing icons, and decorative
    motion on task screens.
-   Never mark a donation, request, or listing verified before the
    backend confirms it.

## 11. Accessibility and localization

Target WCAG 2.2 AA for the website and apply equivalent principles to
Flutter.

-   Normal text contrast: at least 4.5:1; large text: at least 3:1, as
    defined by WCAG.
-   Meaningful controls and boundaries should meet applicable non-text
    contrast requirements.
-   Keyboard access and visible focus on web.
-   Semantic headings, landmarks, labels, and image alt text.
-   Screen-reader labels for icon buttons and meaningful status
    announcements.
-   Touch targets around 48 × 48 logical pixels on mobile where
    practical.
-   Do not communicate state through color alone.
-   Test enlarged text, zoom, and responsive layouts.
-   Avoid text baked into images.
-   Check Devanagari line height and font rendering.
-   Support Hindi and English initially if resources allow; design for
    future localization.
-   Respect locale for dates, times, numerals, and calendar labels.
-   Do not assume all Jain users follow the same calendar conventions.

## 12. UX for sensitive features

### Donor privacy

Explain data use before registration. Keep exact location and direct
contact details private by default. Let donors pause, update, or remove
listings. Do not expose unnecessary medical information.

### Trust verification

Show what was verified where practical, record approval history,
re-check sensitive payment details after changes, and provide a
correction/report path on important public listings.

### Donation clarity

Separate platform operator and temple/trust recipient. Display recipient
name and purpose before payment. Do not imply tax benefits without
confirmation. Never show false payment success.

### Religious respect

Source religious facts and dates, show relevant tradition or regional
distinctions, avoid unjustified popularity rankings, and provide a
correction process for disputed information.

## 13. Responsive behavior

-   **Mobile:** one primary task per screen, bottom navigation, readable
    cards, full-width controls, no unnecessary horizontal scrolling.
-   **Tablet:** adaptive margins and two-column layouts only where they
    improve browsing.
-   **Desktop website:** centered content, readable line lengths,
    discovery grids, and map/list split only when useful.
-   **Admin:** desktop-first queues and tables with responsive fallbacks
    for essential moderation tasks.

## 14. Brand placement

Credit NovaEdge Digital Labs in the About page, footer/credits, or a
restrained "Technology by NovaEdge Digital Labs" line. Do not place a
large company banner on the home screen or interrupt blood, temple,
emergency, or donation flows with promotion. The platform should earn
trust through usefulness and reliability.

## 15. Shared design tokens

Maintain a single source of design tokens and map them to Flutter theme
definitions and web CSS variables. Avoid hardcoding different colors in
individual components.

``` css
:root {
  --color-brand-900: #183D35;
  --color-brand-800: #245347;
  --color-brand-700: #2F6B59;
  --color-brand-100: #E5F0EA;
  --color-brand-50: #F3F7F4;

  --color-accent-700: #9A5A12;
  --color-accent-100: #F8EBD5;

  --color-canvas: #F8F7F2;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F0EFE8;

  --color-ink: #202824;
  --color-ink-secondary: #5B655F;
  --color-ink-tertiary: #737C76;

  --color-border: #DDE2DC;
  --color-border-strong: #B8C3BA;

  --color-success: #23734D;
  --color-success-bg: #E6F4EB;
  --color-warning: #87530B;
  --color-warning-bg: #FFF2D6;
  --color-danger: #B42318;
  --color-danger-bg: #FDECEA;
  --color-info: #245C91;
  --color-info-bg: #EAF3FB;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

Flutter should expose matching `ColorScheme`, text styles, spacing
constants, and component themes. Use semantic tokens such as `success`,
`danger`, and `surface` rather than assigning brand colors ad hoc.
Contrast-test the actual components before release.

## 16. Design quality checklist

Before a screen is approved: - Does it help users complete the main task
quickly? - Is the primary action clear without dominating the page? - Is
the content hierarchy obvious? - Are claims sourced and sufficiently
current? - Are verification status and update dates visible where
needed? - Are donor and trust details protected? - Are payment recipient
and purpose unambiguous? - Are loading, empty, error, offline, and
success states designed? - Does it work with large text and screen
readers? - Are touch targets, keyboard focus, and responsive layouts
usable? - Are images authentic, permitted, and credited where
required? - Does it avoid unnecessary gradients, animation, nested
cards, and generic marketing copy? - Is NovaEdge branding transparent
but unobtrusive? - Have relevant usability and accessibility tests
passed?

## 17. Design acceptance criteria

The design system is ready for implementation when: 1. Color
combinations have been contrast-tested. 2. Typography has been checked
in English and required Indic scripts. 3. Mobile navigation and website
information architecture are documented. 4. Components have defined
default, focus, pressed, disabled, loading, and error states as
applicable. 5. Critical flows are mapped: donor registration, blood
request, temple verification, temple donation, and optional platform
support. 6. Public/private information boundaries are explicit. 7.
Mobile, tablet, desktop, and admin responsive behaviors are defined. 8.
Flutter and Next.js use matching tokens. 9. Real users have tested
critical flows before broad launch.

## 18. Final design direction

JainConnect should feel like a credible community service built with
care: quiet confidence, strong typography, warm neutral surfaces, deep
green brand accents, limited saffron highlights, authentic imagery, and
clear task-focused navigation.

The goal is not to make the app look expensive through effects. It
should feel trustworthy because every screen is understandable, every
action has a clear result, and sensitive information is handled
responsibly.

**Design rule:** If a visual element does not improve clarity, trust,
accessibility, or task completion, remove it.
