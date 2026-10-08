import Image from "next/image";
import Link from "next/link";
import { getBusinessDetails } from "../lib/business";

export default function SiteFooter() {
  const { phone, secondaryPhone, email, serviceArea } = getBusinessDetails();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <Link href="/" className="footer-logo-wrap" aria-label="AJ's Painting home">
            <Image
              className="footer-logo"
              src="/brand/ajs-painting-logo-v3.png"
              alt="AJ's Painting — Your Project. Our Priority."
              width={240}
              height={160}
            />
          </Link>
          <div className="footer-contact">
            <div className="footer-contact-links">
              {phone ? <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : null}
              {secondaryPhone ? <a href={`tel:${secondaryPhone.replace(/[^+\d]/g, "")}`}>{secondaryPhone}</a> : null}
              {email ? <a className="footer-email" href={`mailto:${email}`}>{email}</a> : null}
              {!phone && !email ? <Link className="footer-cta" href="/contact">Send us a message</Link> : null}
            </div>
            <p>{serviceArea || "Serving local homes and businesses."}</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/about">About Us</Link>
          <Link href="/services">Services</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/#reviews">Reviews</Link>
          <Link href="/schedule">Schedule</Link>
          <Link href="/quote">Quote</Link>
        </nav>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AJ&apos;s Painting</span>
          <div className="footer-privacy">
            <Link href="/privacy">Privacy notice</Link>
            <button type="button" className="privacy-settings" data-privacy-settings>Privacy choices</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
