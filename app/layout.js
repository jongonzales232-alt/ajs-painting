import "./globals.css";

export const metadata = {
  title: {
    default: "AJ's Painting | Residential and Commercial Painting",
    template: "%s | AJ's Painting"
  },
  description: "Professional interior, exterior, cabinet, deck, fence, residential, and commercial painting services from AJ's Painting."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
