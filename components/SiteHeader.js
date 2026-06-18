import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="nav" aria-label="Main navigation">
        <Link className="brand" href="/">
          <span className="brand-mark">AJ</span>
          <span>AJ&apos;s Painting</span>
        </Link>
        <div className="nav-links">
          <Link href="/services">Services</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/schedule">Schedule</Link>
          <Link href="/contact">Contact</Link>
          <Link className="nav-cta" href="/quote">Request a Free Quote</Link>
        </div>
      </nav>
    </header>
  );
}
