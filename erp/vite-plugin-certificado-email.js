import { enviarCertificadoBrevo } from "./server/enviar-certificado-brevo.js";

/**
 * API dev: POST /api/certificado/enviar
 * Requiere BREVO_API_KEY y BREVO_FROM_EMAIL en .env
 */
export function certificadoEmailApi() {
  return {
    name: "certificado-email-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/certificado/enviar" || req.method !== "POST") {
          return next();
        }

        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body || "{}");
            const result = await enviarCertificadoBrevo(data);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (e) {
            res.statusCode = e.status || 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e.message || "Error interno" }));
          }
        });
      });
    },
  };
}
