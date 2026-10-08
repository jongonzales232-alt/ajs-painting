import Link from "next/link";
import Image from "next/image";
import { getBusinessDetails } from "../lib/business";
import { SITE_LINKS } from "../lib/site-navigation.mjs";
import MobileNavigation from "./MobileNavigation";

export default function SiteHeader() {
  const { phone, insurance } = getBusinessDetails();

  return (
    <header className="site-header">
      <div className="trust-bar">
        <div className="container trust-bar-inner">
          <span>Felipe brings 27+ years of experience</span>
          <span>Free estimates · {insurance.headline}</span>
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
          {SITE_LINKS.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
          <Link className="nav-cta" href="/quote">Request a Free Quote</Link>
        </div>
        <MobileNavigation links={SITE_LINKS} />
      </nav>
    </header>
  );
}
