import Image from "next/image";
import Link from "next/link";
import { getBusinessDetails } from "../lib/business";

export default function SiteFooter() {
  const { phone, secondaryPhone, email, serviceArea } = getBusinessDetails();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo-wrap">
            <Image
              className="footer-logo"
              src="/brand/ajs-painting-logo-v3.png"
              alt="AJ's Painting — Your Project. Our Priority."
              width={240}
              height={160}
            />
          </div>
          <p>Careful preparation, clean job sites, and finishes made to last.</p>
        </div>
        <div>
          <h2>Explore</h2>
          <div className="footer-links">
            <Link href="/services">Services</Link>
            <Link href="/gallery">Recent work</Link>
            <Link href="/schedule">Schedule an estimate</Link>
            <Link href="/quote">Request a quote</Link>
          </div>
        </div>
        <div>
          <h2>Get started</h2>
          {phone ? <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : null}
          {secondaryPhone ? <a href={`tel:${secondaryPhone.replace(/[^+\d]/g, "")}`}>{secondaryPhone}</a> : null}
          {email ? <a href={`mailto:${email}`}>{email}</a> : null}
          {serviceArea ? <p>{serviceArea}</p> : <p>Serving local homes and businesses.</p>}
          {!phone && !email ? <Link className="footer-cta" href="/contact">Send us a message</Link> : null}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} AJ&apos;s Painting</span>
        <span>Your Project. Our Priority.</span>
      </div>
    </footer>
  );
}
