# Gallery fixes — 11 October 2026

Status: implemented and tested locally; owner approved publication on 11 October 2026. See the deployment confirmation for live verification.

## What changed

- Gallery/home photos no longer retain a 600px height on narrow cards. Responsive 4:3 containers use `contain` to show the full approved composition rather than cropping out most of the room.
- Public gallery and business photos use Next.js responsive image optimization. Originals, privacy blurs, captions and photo order are unchanged.
- Only brand assets and public gallery/site paths are permitted by the optimizer. Authenticated quote photos and legacy lead-photo paths are excluded. No new image service or account is needed.
- Photo error state resets when the source is replaced. Missing-image accessibility labels explain the failure.
- Gallery card headings are H2 beneath the page H1; homepage cards remain H3 below Recent work (H2).
- Contact business images also receive responsive height and appropriate size hints.

Implementation reference: [Next.js 15 Image documentation](https://nextjs.org/docs/15/app/api-reference/components/image), especially `sizes`, `unoptimized` and `localPatterns`.

## Validation

Installed Next.js: 15.5.19. Production build, build lint/type checks, targeted ESLint and `git diff --check` passed.

85 isolated regression checks passed:

| Area | Checks |
| --- | ---: |
| Gallery images and optimizer path restrictions | 6 |
| About copy and navigation | 8 |
| Quote API, attachments, validation and failures | 17 |
| Contact API success/failure/rate limit | 4 |
| Scheduling, time zones, overlaps and travel buffer | 28 |
| Form and analytics controller behavior | 18 |
| Analytics environment isolation | 4 |

Commands: `node --experimental-vm-modules scripts/test-gallery-images.mjs` and the corresponding `test-about-navigation`, `test-quote`, `test-contact`, `test-scheduling`, `test-analytics-ui`, `test-analytics-config` scripts. Fixtures mock external email/database operations; no live inquiries were sent.

### Running production preview

Local preview at http://127.0.0.1:3101/gallery uses `.next-analytics-gallery-qa`, a separate SQLite database and copies of the five approved public photos. Live data is not copied into it. Analytics and outbound email are explicitly disabled.

- Eight public routes (`/`, `/gallery`, `/about`, `/services`, `/contact`, `/quote`, `/schedule`, `/privacy`) return HTTP 200.
- All five gallery images load using optimized URLs. Desktop cards measured 366 × 274.5px; mobile cards measured 333 × 249.75px. No horizontal overflow in checked gallery, quote, schedule and homepage mobile views.
- Five 750px WebP responses total **100,516 bytes**, compared with **15,378,773 bytes** of originals (99.35% smaller for this tested size/format; other devices may request other sizes).
- Direct optimizer attempts for `/api/admin/lead-photos/private.jpg` and `/uploads/lead-photos/private.jpg` return HTTP 400.
- Keyboard menu opens with Enter; Escape closes it and restores focus to Menu. Mobile quote, schedule, contact, About and cross-page Reviews links work.
- Reviews anchor lands at 150px, below the 126px sticky mobile header.
- Empty quote submission focuses the first required field.
- Real local browser submission with two approved test photos converted/prepared both, saved exactly one isolated quote and two private photos, then displayed the expected saved-but-email-delayed notice. Email was deliberately disabled.
- Local contact submission with email disabled displays a delivery error and retains the entered message. Successful email responses are covered by mock regression tests, not a live provider send.
- Scheduling preview shows Monday–Friday dates and hourly visits from 8am–7pm starts (ending by 8pm), Central Time. Buffer logic verified in the scheduling suite.
- No browser warning/error logs during the observed run.

## Scope and limits

This is a targeted gallery repair and key-path regression pass, not a complete security or accessibility certification. Real email delivery, admin mutations, production cache behavior and the older 15 production photos were not retested end-to-end in the local pass. Existing analytics policy and scheduling/business settings were not changed. Recheck public gallery images and logo after deployment.

Before/after screenshots and local fixture artifacts are under the workspace `outputs/ceiling-review/` folder. The original 20-photo live gallery remains unchanged by these code fixes.
