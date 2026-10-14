"use client";

import { useState } from "react";
import Image from "next/image";
import { publicImageSources } from "../lib/public-image-paths.mjs";

// Authenticated quote photos keep direct, cookie-bearing requests.
const gallerySizes = "(max-width: 860px) calc(100vw - 40px), (max-width: 1180px) calc((100vw - 76px) / 3), 368px";

export default function SafeImage(props) {
  // Replacing a photo must reset any error left by the previous source.
  return <ImageWithFallback key={props.src || "empty"} {...props} />;
}

function ImageWithFallback({ src, alt, className, sizes = gallerySizes }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`gallery-placeholder ${className || ""}`} role="img" aria-label={alt ? `${alt} — image unavailable` : "Image unavailable"} />;
  }

  const sources = publicImageSources(src);
  if (sources) {
    // Prepared on upload/startup; visitors never trigger resizing.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} {...sources} alt={alt} width={800} height={600}
      sizes={sizes} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
  }
  return <Image className={className} src={src} alt={alt} width={800} height={600}
    sizes={sizes} unoptimized onError={() => setFailed(true)} />;
}
