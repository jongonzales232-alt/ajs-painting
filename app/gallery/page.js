import PublicLayout from "../../components/PublicLayout";
import SafeImage from "../../components/SafeImage";
import { prisma } from "../../lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Project Gallery",
  description: "See completed painting projects from AJ's Painting."
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const photos = await prisma.galleryPhoto.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <PublicLayout>
      <section className="page-title">
        <div className="container">
          <p className="eyebrow">Careful work, visible results</p>
          <h1>Project Gallery</h1>
          <p>A closer look at completed interior, exterior, cabinet, deck, fence, residential, and commercial projects.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="gallery-grid">
            {photos.map((photo) => (
              <article className="gallery-card" key={photo.id}>
                <SafeImage src={photo.url} alt={photo.title || "Completed painting job"} />
                <div className="gallery-card-body">
                  <h3>{photo.title || "Completed project"}</h3>
                  {photo.description ? <p>{photo.description}</p> : null}
                  <small>
                    {[photo.jobType, photo.jobDate ? new Date(photo.jobDate).toLocaleDateString() : ""].filter(Boolean).join(" - ")}
                  </small>
                </div>
              </article>
            ))}
          </div>
          {photos.length === 0 ? (
            <div className="empty-state gallery-empty">
              <p className="eyebrow">New portfolio photos are being prepared</p>
              <h2>Have a project in mind today?</h2>
              <p>You do not have to wait for the gallery. Send a few details and photos, and we&apos;ll talk through your project.</p>
              <div className="actions">
                <Link className="button" href="/quote">Request a Free Quote</Link>
                <Link className="button-light" href="/services">Explore Services</Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PublicLayout>
  );
}
