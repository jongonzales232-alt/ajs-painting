import "./globals.css";
import AnalyticsConsent from "../components/AnalyticsConsent";
import { analyticsConfig } from "../lib/analytics-config";
import { SITE_URL } from "../lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AJ's Painting | Waco, Hillsboro & Whitney, TX",
    template: "%s | AJ's Painting"
  },
  description: "Residential and commercial painting in Waco, Hillsboro and Whitney, Texas. Founder Felipe brings 27+ years of experience. Free estimates.",
  icons: {
    icon: "/brand/ajs-painting-logo-v3.png"
  }
};

export default function RootLayout({ children }) {
  const { enabled, test, qa } = analyticsConfig();
  return (
    <html lang="en">
      <body>{children}<AnalyticsConsent enabled={enabled} test={test} qa={qa} /></body>
    </html>
  );
}
