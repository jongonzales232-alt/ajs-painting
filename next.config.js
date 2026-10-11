/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let local QA use a separate build without disrupting a running preview.
  distDir: process.env.AJS_BUILD_DIR || ".next",
  images: {
    // Never allow the public optimizer to fetch authenticated customer photos.
    localPatterns: [
      { pathname: "/brand/**", search: "" },
      { pathname: "/uploads/gallery/*", search: "" },
      { pathname: "/uploads/site/*", search: "" }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  }
};

module.exports = nextConfig;
