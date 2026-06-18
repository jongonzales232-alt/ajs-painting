import Link from "next/link";
import PublicLayout from "../../components/PublicLayout";

export const metadata = {
  title: "Thank You",
  description: "Thank you for contacting AJ's Painting."
};

export default function ThankYouPage() {
  return (
    <PublicLayout>
      <section className="section">
        <div className="container info-panel">
          <h1>Thank you</h1>
          <p>AJ&apos;s Painting received your information and will follow up soon.</p>
          <div className="actions" style={{ marginTop: 18 }}>
            <Link className="button" href="/">Back to Home</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
