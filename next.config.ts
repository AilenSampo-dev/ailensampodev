import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/p/[slug]": ["./src/content/propuestas/**/*"],
    "/api/proposals/[slug]/document": ["./src/content/propuestas/**/*"],
    "/app/propuestas/[slug]": ["./src/content/propuestas/**/*"],
  },
};

export default nextConfig;
