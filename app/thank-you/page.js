import Link from "next/link";
import PublicLayout from "../../components/PublicLayout";

export const metadata = {
  title: "Thank You",
  description: "Thank you for contacting AJ's Painting."
};

export default async function ThankYouPage({ searchParams }) {
  const params = await searchParams;
  return (
    <PublicLayout>
      <section className="section">
        <div className="container info-panel">
          <h1>Thank you</h1>
          <p>AJ&apos;s Painting received your information and will follow up soon.</p>
          {params?.email === "delayed" && <p role="status">Your quote details and photos are saved, but an email notification could not be sent. Please do not submit again. If you need to confirm or add details, call <a href="tel:2542050950">(254) 205-0950</a>.</p>}
          <div className="actions" style={{ marginTop: 18 }}>
            <Link className="button" href="/">Back to Home</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
