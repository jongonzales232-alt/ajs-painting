import Link from "next/link";
import Image from "next/image";
import { getBusinessDetails } from "../lib/business";

export default function SiteHeader() {
  const { phone } = getBusinessDetails();

  return (
    <header className="site-header">
      <div className="trust-bar">
        <div className="container trust-bar-inner">
          <span>Over 20 years of hands-on painting experience</span>
          <span>Free estimates · Residential &amp; commercial</span>
          {phone ? <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : null}
        </div>
      </div>
      <nav className="nav" aria-label="Main navigation">
        <Link className="brand" href="/">
          <Image
            className="brand-logo"
            src="/brand/ajs-painting-logo-v3.png"
            alt="AJ's Painting — Your Project. Our Priority."
            width={240}
            height={160}
            priority
          />
        </Link>
        <div className="nav-links desktop-nav">
          <Link href="/services">Services</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/schedule">Schedule</Link>
          <Link href="/contact">Contact</Link>
          <Link className="nav-cta" href="/quote">Request a Free Quote</Link>
        </div>
        <details className="mobile-nav">
          <summary>Menu</summary>
          <div className="mobile-nav-links">
            <Link href="/services">Services</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/schedule">Schedule</Link>
            <Link href="/contact">Contact</Link>
            <Link className="nav-cta" href="/quote">Request a Free Quote</Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
