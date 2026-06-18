export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div>
          <strong>AJ&apos;s Painting</strong>
          <div>Quality painting services you can trust.</div>
        </div>
        <div>
          <div>{process.env.BUSINESS_PHONE || "(555) 555-5555"}</div>
          <div>{process.env.BUSINESS_EMAIL || "info@ajspainting.com"}</div>
        </div>
      </div>
    </footer>
  );
}
