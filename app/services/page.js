import PublicLayout from "../../components/PublicLayout";
import Link from "next/link";
import { paintingServices } from "../../lib/painting-services";

export const metadata = {
  title: "Painting Services in Waco, Hillsboro & Whitney",
  description: "Explore interior, exterior, cabinet, commercial painting and fence or deck staining in Waco, Hillsboro and Whitney. Free estimates from AJ's Painting.",
  alternates: { canonical: "/services" }
};

const services = [
  ["Residential painting", "Reliable painting for bedrooms, living areas, kitchens, exteriors, rentals, and move-in projects."],
  ["Drywall patching and minor prep work", "Small patches, sanding, nail pops, cracks, and surface preparation before paint."],
  ["Pressure washing and prep work", "Wash and prep surfaces so paint adheres properly and lasts longer."]
];

export default function ServicesPage() {
  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <p className="eyebrow">Prepared properly. Finished carefully.</p>
          <h1>Painting services in Waco, Hillsboro &amp; Whitney</h1>
          <p>Painting for homes, rental properties, offices, storefronts, and small commercial spaces across Central Texas. Founder Felipe brings more than 27 years of hands-on experience to your interior or exterior project.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-title"><h2>Explore our painting services</h2><p>Find out what is included, how we prepare and what to share when requesting an estimate.</p></div>
          <div className="grid grid-2">
            {paintingServices.map((service) => (
              <article className="service-card" key={service.slug}>
                <h3><Link href={`/services/${service.slug}`}>{service.name}</Link></h3>
                <p>{service.summary}</p>
                <Link className="text-link service-card-link" href={`/services/${service.slug}`}>Learn about {service.name.toLowerCase()}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container"><div className="section-title"><h2>Surfaces and preparation we cover</h2></div></div>
        <div className="container grid grid-3">
          {services.map(([title, text]) => (
            <article className="service-card" key={title}>
              <h3>{title}</h3>
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
