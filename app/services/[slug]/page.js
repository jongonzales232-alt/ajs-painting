import Link from "next/link";
import { notFound } from "next/navigation";
import PublicLayout from "../../../components/PublicLayout";
import { paintingServices } from "../../../lib/painting-services";
import { jsonLd, pageMetadata, SITE_URL } from "../../../lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return paintingServices.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = paintingServices.find((item) => item.slug === slug);
  if (!service) notFound();
  return pageMetadata(service.title, service.description, `/services/${slug}`);
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = paintingServices.find((item) => item.slug === slug);
  if (!service) notFound();
  const url = `${SITE_URL}/services/${slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service", "@id": `${url}#service`, url,
        name: service.name, description: service.description,
        serviceType: service.name, provider: { "@id": `${SITE_URL}/#business` },
        areaServed: ["Waco, Texas", "Hillsboro, Texas", "Whitney, Texas"]
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
          { "@type": "ListItem", position: 3, name: service.name, item: url }
        ]
      }
    ]
  };
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <section className="page-title">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <Link href="/services">Services</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{service.name}</span>
          </nav>
          <p className="eyebrow">AJ&apos;s Painting and Contracting</p>
          <h1>{service.title}</h1>
          <p>{service.intro}</p>
          <div className="actions service-actions">
            <Link className="button" href="/schedule">Schedule a Free Estimate</Link>
            <a className="button-secondary" href="tel:2542050950">Call (254) 205-0950</a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container service-detail-copy">
          {service.sections.map(([heading, copy]) => <article key={heading}><h2>{heading}</h2><p>{copy}</p></article>)}
          <Link className="text-link" href="/gallery">See our project gallery</Link>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <div className="section-title"><h2>Planning your project</h2></div>
          <div className="grid grid-2">
            {service.questions.map(([question, answer]) => <article className="service-card" key={question}><h3>{question}</h3><p>{answer}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section cta-section">
        <div className="container cta-panel">
          <div><p className="eyebrow">Local service. Personal attention.</p><h2>Let&apos;s visit your property and talk through the work</h2><p>Serving Waco, Hillsboro, Whitney and surrounding Central Texas communities. We travel to you for estimates and project work.</p></div>
          <Link className="button" href="/quote">Request a Free Quote</Link>
        </div>
        <nav className="container related-services" aria-label="More painting services">
          {paintingServices.filter((item) => item.slug !== slug).map((item) => <Link key={item.slug} href={`/services/${item.slug}`}>{item.name}</Link>)}
        </nav>
      </section>
    </PublicLayout>
  );
}
