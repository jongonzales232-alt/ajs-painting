"use client";

import { useState } from "react";
import Image from "next/image";

// Only published local images may use the public optimizer. Authenticated
// quote photos must keep their direct, cookie-bearing requests.
const publicImage = /^\/uploads\/(gallery|site)\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp|gif)$/i;
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

  return <Image className={className} src={src} alt={alt} width={800} height={600}
    sizes={sizes} unoptimized={!publicImage.test(src)} onError={() => setFailed(true)} />;
}
