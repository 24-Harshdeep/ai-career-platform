import type { NextConfig } from "next";

// In production (Render), NEXT_PUBLIC_API_BASE_URL is injected at build time
// and points to the careeros-backend service URL.
// Locally it falls back to localhost:5000.
const backendApiUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

// Ensure no double /api suffix when constructing the rewrite destination.
const backendBase = backendApiUrl.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy same-origin browser /api/* calls to the backend service.
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
