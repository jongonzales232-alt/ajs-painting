# AJ's Painting analytics — owner guide

Updated October 7, 2026. **Published on [ajspaintingtx.com](https://ajspaintingtx.com/) with your approval.** Live application commit: `12f1ca2`.

## Your account and launch settings

- Google owner: ajspaintingcontractor@gmail.com (Felipe Gonzalez).
- Account: AJ's Painting, 411238046. Property: AJ's Painting website, 558023335.
- Web stream: AJ's Painting — public website, 16064693955.
- Measurement ID: **G-V56ZM6JDDD**. This is a public identifier, not a password.
- [Open Google Analytics](https://analytics.google.com/analytics/web/#/a411238046p558023335/).
- Reporting zone: America/Chicago; currency: USD.
- Optional account data-sharing unchecked; Enhanced Measurement off; Google Signals and user-provided data collection not enabled.
- Advertising personalization disallowed in all 307 available regions. No Ads integration or remarketing enabled.
- User and event retention: 2 months; reset on new user activity off. Aggregated standard reports are not governed by that short user/event retention setting.

These server environment settings are now saved on the **ajs-painting** Render service and the site has been rebuilt/deployed. Do not paste Google's generic snippet into the site; that would bypass this consent implementation and duplicate events.

```
ANALYTICS_ENABLED=true
GA4_MEASUREMENT_ID=G-V56ZM6JDDD
ANALYTICS_LOCAL_TEST=0
```

Leave `AJS_BUILD_DIR` unset on Render. No secret analytics key is needed. Do not change the existing email, database, domain or scheduling settings. The website only permits live analytics on ajspaintingtx.com and www.ajspaintingtx.com in a production build. Localhost, preview domains and signed-in administrator sessions cannot load the live collector. Root-layout settings are included in the build: rebuild after changing analytics settings.

## A five-minute weekly check

Sign in to the property above. In each report, use the date picker at the top right: **Last 7 days → Apply**, then **Last 30 days → Apply**. Use complete days through yesterday for comparable totals. GA menus vary by the selected business objectives; use the top search box for the report names below if a report isn't in the sidebar.

| Question | Report and what to read |
|---|---|
| How many people visited? | Reports → Reports snapshot: Active users (estimated browsers, not an exact count of people), Sessions, Views and engagement. |
| Where did visits come from? | Traffic acquisition: Session default channel group or Session source / medium, plus Sessions. |
| Which pages matter? | Pages and screens: Page path and screen class, Views, Active users and average engagement time. |
| Mobile or desktop? | Tech details: select Device category. |
| How many people clicked a phone number? | Events: find `phone_click`, read Event count. This means a link click, **not a completed call**. |
| How many quotes succeeded? | Events: `generate_lead`, filtered by custom dimension Form type = `quote`. Contact messages use `contact`; appointments use `schedule`. |
| Which sources bring inquiries? | Traffic acquisition: select `generate_lead` in the Key events column. For quote-only attribution, use an Explore free-form report with Session source / medium, Form type, Sessions and Event count; filter Event name = generate_lead and Form type = quote. |

## Event definitions and report configuration

| Event | Meaning |
|---|---|
| `page_view` | One accepted-consent view per public path transition or full-page reload. Query/hash-only changes do not create extra views. |
| `phone_click` / `email_click` | Clicks on phone/email links; destination phone/email values are not sent. |
| `estimate_click` | A link to /quote or /schedule; not the Submit button. |
| `form_start` | First field change in a quote, contact or scheduling form during that page visit after consent. |
| `generate_lead` | Quote/appointment saved successfully, or contact message accepted by the email service. Email acceptance is not proof of inbox delivery. A saved quote counts even if its notification is delayed. |
| `site_engagement` | Actual foreground time sent on interactions/transitions and once after ten seconds per page. No recurring keep-alive; background time excluded. The blank collector cannot measure focus itself. |

Already configured: **Admin → Data display → Custom definitions** has the event-scoped dimensions **Form type** (`form_type`) and **Service type** (`service_type`). **Admin → Data display → Events** has `generate_lead` marked as a key event, counted once per event, with no assumed monetary value. It uses the website's explicit event code, not a derived page-view rule. Do not make an automatic event from form clicks, form_submit, or /thank-you views. Phone clicks remain distinct from completed leads. Data will accumulate as consenting visitors use the published site.

Keep Enhanced Measurement entirely off (including browser-history pageviews, form interactions, outbound clicks, site search and downloads). Do not enable Google Signals, advertising personalization, user-provided data, cross-domain linking, remarketing or Ads integrations. Review any future Google tag/Tag Manager changes before publishing; the isolated collector and consent gate must remain the only analytics loader.

## Privacy and limitations

- Visitors must actively accept. Reject optional is equally prominent. Footer → Privacy choices lets them withdraw without losing filled-in form fields.
- The choice is stored for 180 days. Accessible Google analytics cookies are removed on withdrawal; already transmitted information is not recalled. A request already sent cannot be unsent.
- Only fixed public page paths/titles, fixed service categories and approved broad referring sources are used. Query strings, fragments, UTM values, ad click IDs, form text, photos, booking/lead IDs and arbitrary referrer hosts are not sent. This deliberately sacrifices campaign detail; some real referrals will appear as direct/unknown.
- Google still receives technical connection data when accepted, including IP/browser information. This is minimized analytics, not a claim of anonymity.
- People who reject, block scripts, change devices or clear cookies affect counts. Bots can inflate visits despite provider filtering. Do not equate GA counts with your actual inbox or quote database.
- New analytics cannot reconstruct visits that were never recorded. Reports can take 24–48 hours to populate. A new property showing zero before launch is expected.
- The new /privacy page explains hosting, inquiry processing, consent and optional analytics. **Legal review remains required** for actual retention policies, international transfers, applicable privacy rights, vendor agreements and the wording appropriate to this business. No automatic legal-compliance claim is made.

## Microsoft Clarity — optional, NOT enabled

Clarity could provide heatmaps and session replays after you separately approve it and provide a project ID. There is deliberately no Clarity script or activation switch in this release: adding an ID alone cannot start recording.

Before a later implementation: choose Strict masking in the Clarity dashboard, use a separate replay opt-in, mask all content by default, and exclude entire /quote, /contact, /schedule, /thank-you, /admin, /api and upload routes. Only explicitly reviewed marketing pages should be eligible. Block URL queries/fragments and stop the recorder **before** entering excluded routes; dashboard filters are not collection-time exclusions. Never unmask form fields, customer names, messages, addresses, photos or private content. Update the notice and rerun the privacy/network tests first. No Clarity account has been created.

## Google Search Console (search terms, impressions and clicks)

1. Open [Google Search Console](https://search.google.com/search-console/) using the business Google account.
2. Reuse an existing ajspaintingtx.com property if present. Otherwise choose Add property → **Domain**, enter `ajspaintingtx.com` (no https or path).
3. Copy Google's exact TXT verification record into your domain's DNS, then Verify. This requires your approval and domain access; do not replace any existing DNS records. If DNS access is unavailable, a URL-prefix property for `https://ajspaintingtx.com/` offers alternative ownership-verification methods.
4. Open **Performance → Search results**, choose Last 7 days or a custom last-30-day range. Read Total clicks, Total impressions, Average CTR and Average position. The Queries tab shows available search terms; Pages shows landing pages. Some low-volume queries are hidden for privacy.
5. Optional: after verification, GA Admin → Product links → Search Console links can connect the existing property. No advertising link is needed. This linkage has not been created.

## Validation and launch status

With your approval, a separate **AJ's Painting — QA TEST ONLY** property was created: property **558046405**, stream **16064715017**, ID **G-RH4SHPZS5E**. [Open the test property](https://analytics.google.com/analytics/web/#/a411238046p558046405/). Its numbers are not customer activity. It has two-month retention without reset, Enhanced Measurement/Signals/user-provided collection off, and ad personalization disallowed everywhere.

Real Google requests were inspected from the local website. QA Realtime confirmed two simulated quote leads and one simulated contact lead, sessions, page views, starts and engagement. All form writes were intercepted; no emails or bookings were created. No test traffic went to the live ID.

The local real-provider switch is development-only, locked to the exact QA ID and loopback hosts. The evidence panel is injected only by `scripts/analytics-qa-proxy.mjs`, never by the deployed application. Production ignores the QA environment switch. No extra hosted website or paid service was created.

**The analytics update is live.** All 90 automated checks and the production build passed. Render confirmed the final deployment; the live collector serves the correct production ID, and desktop/mobile rejection, reload, navigation, privacy choices and public form-page checks passed. A Render-specific hostname issue was found and corrected before launch verification was completed. No synthetic inquiry was submitted to the live site; accepted-consent transport was tested against the separate QA property. Confirm actual incoming activity as customers opt in. Standard reports can take 24–48 hours to process. Review the privacy notice with an appropriate adviser; see ANALYTICS-TEST-RESULTS.md for the full evidence and remaining coverage limits.

## Sources

- [Google: manual pageviews and duplicate avoidance](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google: configuration parameters](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Google: foreground engagement](https://support.google.com/analytics/answer/11109416)
- [Google: traffic acquisition](https://support.google.com/analytics/answer/12923437)
- [Google: Search Console property verification](https://support.google.com/webmasters/answer/34592)
- [Google: Search performance report](https://support.google.com/webmasters/answer/7576553)
- [Microsoft: Clarity privacy and masking](https://clarity.microsoft.com/privacy)
