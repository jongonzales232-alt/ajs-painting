import PublicLayout from "../../components/PublicLayout";
import QuoteForm from "../../components/QuoteForm";

export const metadata = {
  title: "Request a Free Quote",
  description: "Request a free painting quote from AJ's Painting and upload photos of the project area."
};

export default function QuotePage() {
  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <h1>Request a Free Quote</h1>
          <p>Share a few project details and photos. AJ&apos;s Painting will follow up with next steps.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <QuoteForm />
        </div>
      </section>
    </PublicLayout>
  );
}
