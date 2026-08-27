import Link from "next/link";
import PublicLayout from "../components/PublicLayout";
import SafeImage from "../components/SafeImage";
import { prisma } from "../lib/prisma";

export const metadata = {
  title: "AJ's Painting | Quality Painting Services You Can Trust",
  description: "Request a free quote from AJ's Painting for residential and commercial interior and exterior painting."
};

export const dynamic = "force-dynamic";

const services = [
  ["Interior painting", "Clean lines, careful prep, and smooth finishes for rooms, ceilings, trim, and doors."],
  ["Exterior painting", "Durable exterior coatings with proper washing, scraping, caulking, and protection."],
  ["Cabinets, decks, and fences", "Refresh high-impact surfaces with paint, stain, and repair-minded prep work."]
];

const processSteps = [
  ["1", "Tell us about the project", "Share the rooms, surfaces, timing, and any photos that help us understand the work."],
  ["2", "Get a clear estimate", "We review the scope, explain the prep involved, and provide straightforward next steps."],
  ["3", "Enjoy a careful finish", "We protect the space, keep the job site orderly, and complete a final walkthrough with you."]
];

export default async function HomePage() {
  const photos = await prisma.galleryPhoto.findMany({ orderBy: { createdAt: "desc" }, take: 3 });

  return (
    <PublicLayout>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Professional painting · Over 20 years of experience</p>
          <h1>Careful prep. Clean lines. A finish built to last.</h1>
          <p>
            AJ&apos;s Painting brings decades of hands-on experience to interior, exterior, cabinet, deck, fence, residential, and commercial projects.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/quote">Request a Free Quote</Link>
            <Link className="button-light" href="/schedule">Schedule an Estimate</Link>
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Why customers choose AJ's Painting">
        <div className="container proof-grid">
          <div><strong>20+</strong><span>Years of experience</span></div>
          <div><strong>Free</strong><span>Project estimates</span></div>
          <div><strong>Prep-first</strong><span>Workmanship</span></div>
          <div><strong>Clear</strong><span>Communication</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow">Full-service craftsmanship</p>
            <h2>Painting services for homes and small businesses</h2>
            <p>From single rooms to full exterior repaints, AJ&apos;s Painting keeps the process clear from estimate to final walkthrough.</p>
          </div>
          <div className="grid grid-3">
            {services.map(([title, text]) => (
              <article className="service-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="actions" style={{ marginTop: 28 }}>
            <Link className="text-link" href="/services">Explore every service</Link>
          </div>
        </div>
      </section>

      <section className="section section-blue">
        <div className="container">
          <div className="section-title section-title-light">
            <p className="eyebrow">A professional process</p>
            <h2>Know what happens before the first brush hits the wall</h2>
            <p>Good results start with a clear scope, thoughtful preparation, and communication you do not have to chase.</p>
          </div>
          <div className="process-grid">
            {processSteps.map(([number, title, text]) => (
              <article className="process-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-title">
            <p className="eyebrow">Completed projects</p>
            <h2>Recent work</h2>
            <p>See the preparation, detail, and finish AJ&apos;s Painting brings to each project.</p>
          </div>
          {photos.length ? <div className="gallery-grid">
            {photos.map((photo) => (
              <article className="gallery-card" key={photo.id}>
                <SafeImage src={photo.url} alt={photo.title || "Painting project"} />
                <div className="gallery-card-body">
                  <h3>{photo.title}</h3>
                  <p>{photo.description}</p>
                </div>
              </article>
            ))}
          </div> : (
            <div className="empty-state">
              <p className="eyebrow">Portfolio updates are on the way</p>
              <h3>Planning a project now?</h3>
              <p>Tell us what you are working on and we will walk through the right preparation and finish for your space.</p>
              <Link className="button" href="/quote">Start Your Free Quote</Link>
            </div>
          )}
          <div className="actions" style={{ marginTop: 24 }}>
            <Link className="button-secondary" href="/gallery">View Gallery</Link>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container cta-panel">
          <div>
            <p className="eyebrow">Your project deserves a clear plan</p>
            <h2>Ready for a professional painting estimate?</h2>
            <p>Send project details and photos, or choose a time for an in-person estimate.</p>
          </div>
          <div className="actions">
            <Link className="button" href="/quote">Request a Free Quote</Link>
            <Link className="button-light" href="/schedule">Schedule an Estimate</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
