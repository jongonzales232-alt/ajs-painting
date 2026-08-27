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
          <p className="eyebrow">Free, straightforward project planning</p>
          <h1>Request a Free Quote</h1>
          <p>Tell us what you&apos;re planning. The more detail you share, the more useful our first conversation can be.</p>
        </div>
      </section>
      <section className="section">
        <div className="container form-layout">
          <QuoteForm />
          <aside className="form-aside">
            <p className="eyebrow">What happens next</p>
            <h2>A clear response from an experienced painter</h2>
            <ol className="aside-steps">
              <li><strong>We review your details.</strong><span>Photos, surfaces, timing, and project size help us understand the scope.</span></li>
              <li><strong>We follow up.</strong><span>We&apos;ll ask any useful questions and arrange an on-site look when needed.</span></li>
              <li><strong>You get next steps.</strong><span>No pressure—just a clear plan for moving the project forward.</span></li>
            </ol>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
