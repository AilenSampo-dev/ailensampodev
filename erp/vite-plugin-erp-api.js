import { handleAuthLogin, handleErpData, handleErpHealth, handleAuthStatus } from "./server/erp-api-handlers.js";
import { handleContratoEnviar, handleContratoPublico } from "./server/contrato-api-handlers.js";
import { handleAddendumEnviar, handleAddendumPublico } from "./server/addendum-api-handlers.js";
import { handleFacturacionEnviarDetalle } from "./server/facturacion-api-handlers.js";
import { passwordRequired } from "./server/auth.js";

const ROUTES = {
  "/api/auth/login": handleAuthLogin,
  "/api/auth/status": handleAuthStatus,
  "/api/erp/data": handleErpData,
  "/api/erp/health": handleErpHealth,
  "/api/contrato/enviar": handleContratoEnviar,
  "/api/contrato/publico": handleContratoPublico,
  "/api/addendum/enviar": handleAddendumEnviar,
  "/api/addendum/publico": handleAddendumPublico,
  "/api/facturacion/enviar-detalle": handleFacturacionEnviarDetalle,
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
