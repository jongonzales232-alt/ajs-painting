"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function MobileNavigation({ links }) {
  const details = useRef(null);
  const summary = useRef(null);
  const pathname = usePathname();

  useEffect(() => { if (details.current) details.current.open = false; }, [pathname]);
  useEffect(() => {
    const outside = (event) => {
      if (details.current && !details.current.contains(event.target)) details.current.open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  return (
    <details className="mobile-nav" ref={details}
      onKeyDown={(event) => {
        if (event.key === "Escape" && details.current?.open) {
          event.preventDefault(); details.current.open = false; summary.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}>
      <summary ref={summary}>Menu</summary>
      <div className="mobile-nav-links" onClick={(event) => {
        if (event.target.closest("a") && details.current) details.current.open = false;
      }}>
        {links.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        <Link className="nav-cta" href="/quote">Request a Free Quote</Link>
      </div>
    </details>
  );
}
