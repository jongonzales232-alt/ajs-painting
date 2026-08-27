import PublicLayout from "../../components/PublicLayout";
import ScheduleForm from "../../components/ScheduleForm";
import { getAvailableSlots } from "../../lib/availability";
import Link from "next/link";

export const metadata = {
  title: "Schedule an Estimate",
  description: "Choose an available date and time for an AJ's Painting estimate appointment."
};

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const slots = await getAvailableSlots();

  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <p className="eyebrow">Choose a time that works for you</p>
          <h1>Schedule an Estimate</h1>
          <p>Pick an available time for AJ&apos;s Painting to review your project and prepare a quote.</p>
        </div>
      </section>
      <section className="section">
        <div className="container form-layout">
          <ScheduleForm slots={slots} />
          <aside className="form-aside">
            <p className="eyebrow">A useful on-site visit</p>
            <h2>We come prepared to understand the work</h2>
            <p>During the estimate, we can review surfaces, preparation needs, access, finish preferences, and project timing.</p>
            <p className="aside-note">Need to share photos first? Use the quote form instead.</p>
            <Link className="text-link" href="/quote">Request a quote with photos</Link>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
