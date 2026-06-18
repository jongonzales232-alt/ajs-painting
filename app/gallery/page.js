import PublicLayout from "../../components/PublicLayout";
import SafeImage from "../../components/SafeImage";
import { prisma } from "../../lib/prisma";

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
          <h1>Project Gallery</h1>
          <p>Completed job photos uploaded by AJ&apos;s Painting.</p>
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
            <div className="info-panel">
              <h3>Gallery coming soon</h3>
              <p>AJ&apos;s Painting can upload completed job photos from the admin dashboard.</p>
            </div>
          ) : null}
        </div>
      </section>
    </PublicLayout>
  );
}
