# Analytics verification and release checklist

October 7, 2026. Project: `C:\Users\jony2\Downloads\ajs-painting-transfer`.

## Release status

**Local implementation and real-provider QA complete; NOT published.** Separate live and QA properties prepared with permission. Actual requests and QA Realtime receipt verified below. Privacy review and deployment verification remain release tasks.

## Inspection

- Installed Next.js 15.5.19, React 19, App Router, Prisma/SQLite; Render build/start scripts present. Existing Render deployment was inspected earlier in this task.
- No prior GA, GTM, Clarity or advertising pixel found in source. Existing design, photo upload and appointment rules preserved.
- Contact API previously reported success when email sending failed/skipped. It now returns 503 and the form retains the message for retry. Quotes/appointments still count as successful when saved even if their email notification is delayed.
- Unrelated pre-existing audit/design files preserved. No production environment file, deployment, DNS, account access or email-provider settings changed.

## Automated tests

| Suite | Result | Coverage |
|---|---:|---|
| `scripts/test-quote.mjs` | 17 passed | Existing quote/photo API regression checks |
| `scripts/test-scheduling.mjs` | 28 passed | Existing Central-time scheduling and travel-buffer rules |
| `scripts/test-analytics.mjs` | 13 passed | Consent, allowlists, origin/source checks, duplicates, load gates, withdrawal, dry-run isolation and foreground clock |
| `scripts/test-analytics-config.mjs` | 4 passed | Production/development isolation and locked QA ID |
| `scripts/test-analytics-ui.mjs` | 14 passed | Actual React handlers: starts, clicks, success/failure, duplicate submits, malformed responses, saved-but-email-delayed quotes; consent controller and private navigation |
| `scripts/test-contact.mjs` | 4 passed | Actual API: email success, failed/skipped delivery, rate limit |

Total: **80 passing checks**. Automated tests use VM/browser stubs and do not contact Google or send emails. Separate browser integration tests below contact only the QA property.

Final ESLint check, production build (isolated `.next-analytics-build` output), and `git diff --check` also passed. No deployment command was run.

## Browser checks

Real local Next app through a loopback-only QA proxy; desktop and 390×844 mobile viewport. All POST requests intercepted by the proxy: no actual emails, quotes, bookings or database writes. Analytics dry-run uses the same sanitization/consent flow but never loads Google's script.

| Scenario | Observed |
|---|---|
| Before a choice; reject then reload | No analytics iframe/vendor script; no local events. Rejection remembered. |
| Quote submitted while rejected | Success flow remained usable; analytics stayed off. |
| Accept using footer choice | One initial page view. |
| Next.js navigation to Quote | One estimate click and one path page view. |
| Several quote fields changed | One form start, not one event per field. |
| Failed quote, then successful retry/double click | Failure produced no lead; success produced one lead plus thank-you view. Desktop and mobile checked. |
| Failed contact, then successful retry/double click | No failed lead; one successful contact lead. Mobile checked. |
| Thank-you reload | No new lead inferred from the page. |
| Mobile consent controls | Both equal-prominence buttons visible and usable; no horizontal overflow observed. |
| Withdraw, then reload | Collector removed immediately; rejection remembered. Forms remained usable. |
| Event payload inspection | Fixed paths/titles/service categories only. Sentinel names, email, phone, message, submission IDs absent from local event records. |
| Accepted visit with email-like query string and private fragment | Local page-view record contained only canonical `/quote`; neither query nor fragment appeared. |

Scheduling success/failure and private-route teardown are covered by automated handlers/controller tests, not a complete browser booking session. Desktop/mobile refer to browser viewport tests, not physical-device coverage.

## Provider configuration verified in Chrome

- Account 411238046, property 558023335, web stream 16064693955, Measurement ID `G-V56ZM6JDDD`.
- America/Chicago, USD. Optional account sharing off; Enhanced Measurement entirely off.
- Google Signals and user-provided data collection off; ad personalization disallowed in all regions.
- User/event retention two months, reset on new activity off.
- Form type and Service type custom dimensions saved; `generate_lead` key event, once per event, no default monetary value.
- No Clarity installed; no Search Console DNS or link changes.

## Real-provider follow-up, approved October 7

- QA property 558046405, stream 16064715017, ID `G-RH4SHPZS5E`; production ID remains `G-V56ZM6JDDD`. Chicago/USD, Enhanced Measurement off, two-month user/event retention without reset, Signals/user-provided collection off, ad personalization disallowed in all 307 regions.
- Ran the actual Google tag from loopback with simulated form POSTs. A local-only evidence monitor recorded transport calls without altering their destinations/payloads; resource observations and provider reports supplemented it. This is application instrumentation, not full packet capture.
- Before consent and after reject/reload: no collector, analytics cookies or new provider requests. Acceptance loaded only the QA tag and created `_ga` plus its QA-specific cookie.
- Inspected URLs and batched bodies: canonical public paths/titles; no synthetic name, phone, email, private message, query or fragment. All measurement destinations were the QA ID; advertising denial/non-personalization parameters present.
- Desktop and mobile quote failure/retry: one lead per successful simulated submission, none for failures. Mobile contact failure/retry: one contact lead. Double-clicks did not duplicate leads. Thank-you reloads produced views, not leads.
- **QA Realtime visibly reported exactly three generate_lead events** (two quotes, one contact), three form starts, sessions/first visits/page views and site_engagement. Intentional debug reloads account for aggregate view totals.
- Found/fixed a real issue: the blank iframe had no focus, so automatic engagement was absent. Public-document foreground time now supplies numeric durations; an inspected request carried 10,003ms. No recurring keep-alive requests. Clock tests cover delta consumption, background exclusion and reset.
- Mobile withdrawal removed cookies and collector. Request count stayed unchanged after withdrawal/reload/navigation. Cross-tab withdrawal also stopped the other tab and removed shared analytics cookies.
- QA proxy forces fresh development scripts to avoid stale cached code. Evidence UI, simulated writes and dialer/email-launch prevention are not part of production.
- Actual phone/email link clicks each emitted one correctly named click event, with neither destination phone nor email in the inspected payload. The QA harness prevented launching a dialer/mail app; no call or email was made.

## Before public launch — outstanding

1. Review the privacy notice for actual retention, rights, international-transfer and vendor obligations. This is not a legal-compliance certification.
2. Obtain explicit publication approval, apply the live settings, rebuild/deploy and verify HTTPS/domain-specific consent/cookie behavior on the deployed build. Clarity stays off unless separately approved.
3. Review processed standard reports after their 24–48-hour delay. Realtime receipt is proven; processed attribution, long-term cookie expiry and standard-report engagement totals were not independently audited here.
4. Recommended compatibility follow-up: physical iPhone/Safari and Android, browser back/forward cache, slow-network withdrawal races, and a complete authenticated-admin browser journey. Unit coverage is not exhaustive device/network coverage.

No production customer records, inboxes, bookings, DNS, account access or website deployment was changed. Analytics remains dependent on consent, blockers and network delivery; it is not a transactional source of truth.
