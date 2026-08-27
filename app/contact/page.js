import PublicLayout from "../../components/PublicLayout";
import ContactForm from "../../components/ContactForm";
import SafeImage from "../../components/SafeImage";
import { prisma } from "../../lib/prisma";
import { getBusinessDetails } from "../../lib/business";
import Link from "next/link";

export const metadata = {
  title: "Contact",
  description: "Contact AJ's Painting by phone, email, or contact form."
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const businessImage = await prisma.siteAsset.findUnique({ where: { key: "contactBusinessImage" } });
  const { phone, secondaryPhone, email, serviceArea } = getBusinessDetails();

  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <p className="eyebrow">Questions are welcome</p>
          <h1>Contact AJ&apos;s Painting</h1>
          <p>Tell us what you&apos;re working on. We&apos;ll help you choose the most useful next step.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid grid-2">
          <div className="info-panel">
            <p className="eyebrow">Business information</p>
            <h2>Let&apos;s talk about the right finish for your space</h2>
            {phone ? <p><strong>Phone</strong><br /><a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a></p> : null}
            {secondaryPhone ? <p><strong>Additional phone</strong><br /><a href={`tel:${secondaryPhone.replace(/[^+\d]/g, "")}`}>{secondaryPhone}</a></p> : null}
            {email ? <p><strong>Email</strong><br /><a href={`mailto:${email}`}>{email}</a></p> : null}
            {serviceArea ? <p><strong>Service area</strong><br />{serviceArea}</p> : <p>Serving local homeowners and businesses.</p>}
            {!phone && !email ? <p className="muted">Use the message form and AJ&apos;s Painting will follow up directly.</p> : null}
            <h3>What you can expect</h3>
            <ul className="check-list contact-check-list">
              <li>A response focused on your actual project</li>
              <li>Clear questions about surfaces, prep, and timing</li>
              <li>A straightforward path to an estimate</li>
            </ul>
            <Link className="text-link" href="/schedule">Or schedule an estimate</Link>
            {businessImage ? <SafeImage
              className="contact-business-image"
              src={businessImage.url}
              alt={businessImage.alt || "AJ's Painting business photo"}
            /> : null}
          </div>
          <ContactForm />
        </div>
      </section>
    </PublicLayout>
  );
}
