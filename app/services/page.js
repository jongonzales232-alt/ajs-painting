import PublicLayout from "../../components/PublicLayout";

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
          <h1>Painting Services</h1>
          <p>Professional prep, clear communication, and durable finishes for residential and commercial projects.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid grid-2">
          {services.map(([title, text]) => (
            <article className="service-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
