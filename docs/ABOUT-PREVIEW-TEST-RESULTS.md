# About Us preview — October 8, 2026

Preview review record: all checks below were completed locally before publication. The owner approved publication on October 8, 2026. Deployment and live-site verification follow separately.

## What changed

- Added `/about`, using the owner's family story in five clearly labeled sections, with the existing blue-and-cream styling and two estimate actions.
- Felipe is identified as the founder. His 27+ years are explicitly personal trade experience, not the age of the company. No founding year was invented.
- Alan appears only in the explanation of the company name. Jonathan's firefighter, hands-on learning, website and administrative roles follow the supplied copy.
- Added About Us and Reviews to the shared desktop/mobile navigation and About Us to the compact footer. Kept scheduling and the prominent quote action.
- Renamed the homepage section to Customer Reviews. Preserved both existing Google URLs and the honest wording about collecting reviews. Added no stars, counts or testimonials.
- Corrected horizontal overflow styling that prevented the existing sticky header from working. Review anchors now leave space below the header.
- Added mobile menu dismissal for Escape, outside clicks, navigation and tabbing out. Escape returns focus to Menu.
- Added page title, description and a fixed, privacy-safe About page analytics label. Analytics is disabled in the local preview.

## Automated checks

All 108 checks passed: 8 new About/navigation checks, 17 quote checks, 28 scheduling checks, 4 contact checks, and 51 analytics/configuration/controller/route checks. ESLint and whitespace checks passed. The production build passed, including the new static About route.

These are local isolated regression tests, including simulated successful and failed submissions, duplicate submissions, photo attachments and travel buffers. No real emails, bookings or analytics requests were sent by these tests.

## Browser checks

Tested in the Chromium-based in-app browser using desktop, tablet and phone-sized viewports—not physical devices or a cross-browser certification.

- 1280 × 900: desktop header fits; About sections render; visible keyboard focus; all desktop navigation destinations load.
- 1061 × 850: desktop links still fit without colliding with the logo.
- 1024 × 768: menu layout replaces the desktop links; no horizontal overflow.
- 390 × 844 and 320 × 740: stacked content and buttons fit; all seven menu destinations remain available; no horizontal overflow. Compact footer retained.
- 844 × 390: short landscape menu is internally scrollable and stays within the viewport.
- Keyboard: Enter opens the menu; Tab reaches its links; Escape closes and restores focus; tabbing out closes it. Outside clicks and navigation also close it.
- Reviews from About: opens `/#reviews`, closes the mobile menu, and focuses the reviews section. At desktop size the section begins near 168px below the viewport top and the header ends at 149px; at phone size these are approximately 150px and 126px. Same-page Reviews also works.
- Both About estimate buttons open the existing quote/scheduling forms. Header links to Services, Gallery, Contact and About were followed successfully. Existing scheduling date choices render. No live form submission was made.
- Footer Privacy choices opens on About and closes without changing the saved preference.
- The browser shows the expected About page title and description. Development-only Next.js notices about skipping sticky elements during scroll handling were observed; tested route and review-anchor navigation worked.

## Photo and publication

No suitable owner/family portrait was supplied. The motto panel makes the page complete without a stock or invented portrait. A real photograph of Felipe, or Felipe and Jonathan, can be added beside the Felipe's story section later with an accurate caption and consent from the people pictured.

Local preview: http://127.0.0.1:3100/about (available on this computer while the preview server is running).

Publication is approved by the owner. Local Gallery data is not the production gallery; the existing live photos were not changed.
