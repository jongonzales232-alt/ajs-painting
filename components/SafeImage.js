"use client";

import { useState } from "react";
import Image from "next/image";

export default function SafeImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`gallery-placeholder ${className || ""}`} role="img" aria-label={alt || "Image unavailable"} />;
  }

  return <Image className={className} src={src} alt={alt} width={800} height={600} unoptimized onError={() => setFailed(true)} />;
}
