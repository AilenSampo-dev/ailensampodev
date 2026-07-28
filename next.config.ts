import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "/api/proposals/[slug]/document": ["./src/content/propuestas/**/*"],
    "/p/[slug]": ["./src/content/propuestas/**/*"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /propuesta\.html$/,
      include: [path.join(__dirname, "src/content/propuestas")],
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
