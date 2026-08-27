import PublicLayout from "../../components/PublicLayout";
import Link from "next/link";

export const metadata = {
  title: "Painting Services",
  description: "Interior painting, exterior painting, cabinet painting, fence and deck staining, drywall prep, pressure washing, residential painting, and commercial painting."
};

const services = [
  ["Interior painting", "Walls, ceilings, trim, doors, accent walls, and occupied-home protection."],
  ["Exterior painting", "Siding, trim, shutters, doors, scraping, caulking, and weather-ready coatings."],
  ["Cabinet painting", "Careful cleaning, prep, priming, and finish work for kitchens, baths, and built-ins."],
  ["Fence and deck staining or painting", "Refresh exterior wood surfaces with stain or paint after proper prep."],
  ["Drywall patching and minor prep work", "Small patches, sanding, nail pops, cracks, and surface preparation before paint."],
  ["Pressure washing and prep work", "Wash and prep surfaces so paint adheres properly and lasts longer."],
  ["Residential painting", "Reliable painting for bedrooms, living areas, kitchens, exteriors, rentals, and move-in projects."],
  ["Commercial painting", "Simple scheduling and clean job sites for offices, storefronts, and small commercial spaces."]
];

export default function ServicesPage() {
  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <p className="eyebrow">Prepared properly. Finished carefully.</p>
          <h1>Painting Services</h1>
          <p>From one-room refreshes to full exterior projects, AJ&apos;s Painting brings more than 20 years of hands-on experience to every surface.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid grid-2">
          {services.map(([title, text]) => (
            <article className="service-card" key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-blue">
        <div className="container grid grid-2 service-expectations">
          <div>
            <p className="eyebrow">What professional looks like</p>
            <h2>Respect for your property is part of the job</h2>
          </div>
          <ul className="check-list">
            <li>Clear scope and straightforward next steps</li>
            <li>Protection for floors, furniture, landscaping, and fixtures</li>
            <li>Thoughtful cleaning, patching, sanding, and priming</li>
            <li>An orderly work area and final walkthrough</li>
          </ul>
        </div>
      </section>
      <section className="section cta-section">
        <div className="container cta-panel">
          <div>
            <p className="eyebrow">Let&apos;s talk about your project</p>
            <h2>Not sure which service fits?</h2>
            <p>Share a few photos and details. We&apos;ll help you identify the right next step.</p>
          </div>
          <Link className="button" href="/quote">Request a Free Quote</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
