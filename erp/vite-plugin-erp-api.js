import { handleAuthLogin, handleErpData, handleAuthStatus } from "./server/erp-api-handlers.js";
import { handleContratoEnviar, handleContratoPublico } from "./server/contrato-api-handlers.js";
import { passwordRequired } from "./server/auth.js";

const ROUTES = {
  "/api/auth/login": handleAuthLogin,
  "/api/auth/status": handleAuthStatus,
  "/api/erp/data": handleErpData,
  "/api/contrato/enviar": handleContratoEnviar,
  "/api/contrato/publico": handleContratoPublico,
};

/** Dev: auth + backup ERP vía middleware Vite */
export function erpApiPlugin() {
  return {
    name: "erp-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        const handler = ROUTES[path];
        if (!handler) return next();

        if (req.url?.startsWith("/api/auth/status") && req.method === "GET" && !passwordRequired()) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, cloudBackup: false, passwordRequired: false }));
          return;
        }

        try {
          await handler(req, res, process.env);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message || "Error interno" }));
        }
      });
    },
  };
}
