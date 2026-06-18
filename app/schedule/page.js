import PublicLayout from "../../components/PublicLayout";
import ScheduleForm from "../../components/ScheduleForm";
import { getAvailableSlots } from "../../lib/availability";

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
          <h1>Schedule an Estimate</h1>
          <p>Pick an available time for AJ&apos;s Painting to review your project and prepare a quote.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ScheduleForm slots={slots} />
        </div>
      </section>
    </PublicLayout>
  );
}
