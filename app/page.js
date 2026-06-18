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

export default async function HomePage() {
  const photos = await prisma.galleryPhoto.findMany({ orderBy: { createdAt: "desc" }, take: 3 });

  return (
    <PublicLayout>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Quality Painting Services You Can Trust</h1>
          <p>
            AJ&apos;s Painting helps homeowners and businesses get clean, reliable interior and exterior painting with straightforward estimates and careful jobsite prep.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/quote">Request a Free Quote</Link>
            <Link className="button-light" href="/schedule">Schedule an Estimate</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title">
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
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-title">
            <h2>Recent work</h2>
            <p>Gallery photos can be uploaded from the admin dashboard as jobs are completed.</p>
          </div>
          <div className="gallery-grid">
            {(photos.length ? photos : [
              { id: "sample-1", title: "Interior repaint", description: "Fresh walls and trim for a bright living space.", url: "" },
              { id: "sample-2", title: "Exterior refresh", description: "Clean siding finish with weather-ready prep.", url: "" },
              { id: "sample-3", title: "Cabinet finish", description: "Updated cabinet color with a smooth durable finish.", url: "" }
            ]).map((photo) => (
              <article className="gallery-card" key={photo.id}>
                <SafeImage src={photo.url} alt={photo.title || "Painting project"} />
                <div className="gallery-card-body">
                  <h3>{photo.title}</h3>
                  <p>{photo.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="actions" style={{ marginTop: 24 }}>
            <Link className="button-secondary" href="/gallery">View Gallery</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-2">
          <div className="info-panel">
            <h3>Ready for a clear estimate?</h3>
            <p>Send project details and photos, or pick a time for an in-person estimate. AJ&apos;s Painting will follow up with next steps.</p>
          </div>
          <div className="info-panel">
            <h3>Contact</h3>
            <p>{process.env.BUSINESS_PHONE || "(555) 555-5555"}</p>
            <p>{process.env.BUSINESS_EMAIL || "info@ajspainting.com"}</p>
            <p>{process.env.SERVICE_AREA || "Your city and surrounding areas"}</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
