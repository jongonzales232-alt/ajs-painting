import Link from "next/link";
import PublicLayout from "../../components/PublicLayout";

export const metadata = {
  title: "About Us",
  description: "Meet Felipe, founder of AJ's Painting, and learn the family story behind our residential and commercial work. Felipe brings more than 27 years of experience."
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="section about-intro" aria-labelledby="about-heading">
        <div className="container about-intro-grid">
          <div>
            <p className="eyebrow">About AJ&apos;s Painting · Family-owned</p>
            <h1 id="about-heading">A family name.<br />A commitment to doing it right.</h1>
            <p className="about-lead">AJ&apos;s Painting was founded by Felipe and named after his two sons, Alan and Jonathan. For our family, the name represents the care and responsibility we bring to every project.</p>
          </div>
          <figure className="about-motto">
            <p className="eyebrow">The way we work</p>
            <blockquote>“If you&apos;re going to do it, do it right.”</blockquote>
            <figcaption>Felipe <span>Founder of AJ&apos;s Painting</span></figcaption>
            <p className="about-experience"><strong>27+</strong><span>Years of Felipe&apos;s<br />hands-on experience</span></p>
          </figure>
        </div>
      </section>

      <section className="section about-section" aria-labelledby="story-heading">
        <div className="container about-story-grid">
          <div>
            <p className="eyebrow">Felipe&apos;s story</p>
            <h2 id="story-heading">From ranching to a craft of his own</h2>
          </div>
          <div className="about-copy">
            <p>Before becoming a painter, Felipe worked as a ranch hand and dreamed of owning his own business. After moving to Hill County, he took classes in painting and texturing, then spent several years working for another company and learning the trade before starting AJ&apos;s Painting. Today, he brings more than 27 years of experience to his work.</p>
            <p>His approach has always been simple: “If you&apos;re going to do it, do it right.” That means being reliable, keeping his word and taking pride in the finished result.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft about-section" aria-labelledby="care-heading">
        <div className="container about-story-grid">
          <div>
            <p className="eyebrow">Preparation &amp; workmanship</p>
            <h2 id="care-heading">Care starts before the first coat</h2>
          </div>
          <div className="about-copy">
            <p>We understand that we&apos;re working in someone&apos;s home or someone&apos;s business. Our work starts with preparation: protecting belongings, preparing surfaces and taking the time to get the details right. The care that goes into a project before the paint touches the wall matters just as much as the finish.</p>
            <p>We work on residential and commercial properties, with services including painting, drywall, texturing, tile work and remodeling. We&apos;ll discuss your project with you and put together a clear scope of work.</p>
          </div>
        </div>
      </section>

      <section className="section about-section" aria-labelledby="family-heading">
        <div className="container about-story-grid">
          <div>
            <p className="eyebrow">Our family&apos;s roles</p>
            <h2 id="family-heading">Family-owned, working together</h2>
          </div>
          <div className="about-copy">
            <p>Jonathan, a firefighter by trade, helps Felipe on his days off while learning the work and supporting the website and administrative side of the business. We bring our different skills together with the same goal: work we&apos;re proud to put our family&apos;s name behind.</p>
          </div>
        </div>
      </section>

      <section className="section cta-section" aria-labelledby="about-estimate-heading">
        <div className="container cta-panel">
          <div>
            <p className="eyebrow">Your project. Our priority.</p>
            <h2 id="about-estimate-heading">Tell us what you have in mind</h2>
            <p>Whether you&apos;re refreshing your home or improving your business, we&apos;d welcome the chance to talk about your project and prepare an estimate.</p>
          </div>
          <div className="actions about-cta-actions">
            <Link className="button" href="/quote">Request a Free Quote</Link>
            <Link className="button-light" href="/schedule">Schedule an Estimate</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
