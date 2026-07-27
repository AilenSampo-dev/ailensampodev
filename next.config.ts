import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Incluir propuestas HTML en el bundle serverless de Vercel
  outputFileTracingIncludes: {
    "/*": ["./content/propuestas/**/*"],
  },
};

export default nextConfig;
