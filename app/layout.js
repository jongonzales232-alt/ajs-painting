import "./globals.css";
import AnalyticsConsent from "../components/AnalyticsConsent";
import { analyticsConfig } from "../lib/analytics-config";

export const metadata = {
  title: {
    default: "AJ's Painting | Residential and Commercial Painting",
    template: "%s | AJ's Painting"
  },
  description: "Residential and commercial painting led by founder Felipe, who brings more than 27 years of experience in the trade.",
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
