import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { certificadoEmailApi } from "./vite-plugin-certificado-email.js";
import { erpApiPlugin } from "./vite-plugin-erp-api.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [react(), certificadoEmailApi(), erpApiPlugin()],
  };
});
