import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import BusinessStructuredData from "./BusinessStructuredData";

export default function PublicLayout({ children }) {
  return (
    <>
      <BusinessStructuredData />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
