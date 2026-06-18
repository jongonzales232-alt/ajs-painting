import PublicLayout from "../../components/PublicLayout";
import ContactForm from "../../components/ContactForm";

export const metadata = {
  title: "Contact",
  description: "Contact AJ's Painting by phone, email, or contact form."
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <h1>Contact AJ&apos;s Painting</h1>
          <p>Call, email, or send a message about your painting project.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid grid-2">
          <div className="info-panel">
            <h3>Business information</h3>
            <p>Phone: {process.env.BUSINESS_PHONE || "(555) 555-5555"}</p>
            <p>Email: {process.env.BUSINESS_EMAIL || "info@ajspainting.com"}</p>
            <p>Service area: {process.env.SERVICE_AREA || "Your city and surrounding areas"}</p>
            <div className="gallery-placeholder" style={{ marginTop: 18 }} aria-label="Map placeholder" />
          </div>
          <ContactForm />
        </div>
      </section>
    </PublicLayout>
  );
}
