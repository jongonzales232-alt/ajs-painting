import "./globals.css";
import AnalyticsConsent from "../components/AnalyticsConsent";
import { analyticsConfig } from "../lib/analytics-config";

export const metadata = {
  title: {
    default: "AJ's Painting | Residential and Commercial Painting",
    template: "%s | AJ's Painting"
  },
  description: "Professional interior, exterior, cabinet, deck, fence, residential, and commercial painting backed by more than 20 years of experience.",
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
