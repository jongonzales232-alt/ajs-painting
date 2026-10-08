import PublicLayout from "../../components/PublicLayout";

export const metadata = { title: "Privacy notice" };
export default function PrivacyPage() {
  return <PublicLayout><section className="section"><article className="container privacy-notice">
    <p className="eyebrow">Your information, handled with care</p>
    <h1>Privacy notice</h1>
    <p>Last updated October 7, 2026.</p>
    <h2>When you contact us</h2>
    <p>We use the contact details, project information, appointment details and photos you choose to submit to respond to your request and provide our services. Quote requests and appointments are stored in our website&apos;s private records; contact messages are sent to our business email. Render hosts our website and Resend handles email notifications. These essential services work whether you accept or reject analytics.</p>
    <h2>Optional website analytics</h2>
    <p>When enabled and only after you choose Accept analytics, we use Google Analytics 4 to understand visits, sessions, public pages viewed, broad traffic sources, device/browser types, engagement and actions such as phone-link clicks, email-link clicks, estimate-link clicks, form starts and successfully submitted inquiries. A phone click is not a completed call.</p>
    <p>We send fixed page names and service categories, not form contents, customer names, contact details, addresses, message text, photo names or booking identifiers. We remove URL query strings and fragments from analytics and reduce recognized referring sites to a short approved list. Unrecognized sources may appear as direct traffic. We do not enable advertising, remarketing, Google Signals, user IDs or user-provided data collection.</p>
    <p>Google receives technical connection information when analytics is accepted, including your IP address and browser information; this is not anonymous tracking. Google states that GA4 does not log or store individual IP addresses. Analytics uses first-party cookies (such as _ga and _ga_*) to distinguish browsers and sessions. This implementation limits their lifetime to 180 days.</p>
    <p>Our Analytics property is configured to retain detailed user and event data for two months, without extending that period on new activity. Standard aggregated reports may remain available longer.</p>
    <h2>Your choice</h2>
    <p>Optional analytics scripts, cookies and collection requests are blocked until you accept. Reject optional leaves analytics off. Your choice is stored in this browser for 180 days using local storage. You can change it at any time below or using Privacy choices in the footer. Withdrawal stops future collection and removes accessible analytics cookies; it does not delete information already received by Google. Blocking browser storage keeps optional analytics off.</p>
    <button type="button" className="button-light" data-privacy-settings>Privacy choices</button>
    <h2>No session recording</h2>
    <p>Microsoft Clarity heatmaps and session replays are not enabled. Adding them would require a separate decision, an updated notice and consent choice, strict masking, and exclusion of forms, private pages and sensitive content.</p>
    <h2>Essential operations and retention</h2>
    <p>Our hosting, security and email providers may process connection logs to operate the site, prevent abuse and deliver messages. Administrator sign-in uses an essential session cookie. Project information is kept as needed to handle inquiries and business records. Contact us to ask about access, correction or deletion; some records may need to be retained for legitimate business or legal reasons.</p>
    <h2>Questions</h2>
    <p>Email <a href="mailto:ajspaintingcontractor@gmail.com">ajspaintingcontractor@gmail.com</a> about privacy or your information.</p>
    <p>Learn more in <a href="https://policies.google.com/privacy" rel="noreferrer">Google&apos;s privacy policy</a> and <a href="https://support.google.com/analytics/answer/12017362" rel="noreferrer">Google&apos;s GA4 data privacy documentation</a>.</p>
  </article></section></PublicLayout>;
}
