/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let local QA use a separate build without disrupting a running preview.
  distDir: process.env.AJS_BUILD_DIR || ".next",
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  }
};

module.exports = nextConfig;
