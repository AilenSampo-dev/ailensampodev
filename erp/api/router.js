// Única función de Vercel para todas las rutas /api/* del ERP.
// El plan Hobby permite como máximo 12 funciones por proyecto; con un archivo por ruta el ERP llegó a 13
// el 17/9/2026 y desde entonces ningún deploy se publicaba. Ahora cada ruta vive en server/endpoints/
// (mismo código que antes, sin cambios) y vercel.json manda /api/* acá.
// Para sumar una ruta: crear server/endpoints/<grupo>/<nombre>.js y agregarla a ROUTES.
import h_addendum_enviar from "../server/endpoints/addendum/enviar.js";
import h_addendum_publico from "../server/endpoints/addendum/publico.js";
import h_auth_login from "../server/endpoints/auth/login.js";
import h_auth_status from "../server/endpoints/auth/status.js";
import h_calendario_accesos from "../server/endpoints/calendario/accesos.js";
import h_calendario_comentarios from "../server/endpoints/calendario/comentarios.js";
import h_calendario_data from "../server/endpoints/calendario/data.js";
import h_calendario_img from "../server/endpoints/calendario/img.js";
import h_certificado_enviar from "../server/endpoints/certificado/enviar.js";
import h_contrato_enviar from "../server/endpoints/contrato/enviar.js";
import h_contrato_publico from "../server/endpoints/contrato/publico.js";
import h_erp_data from "../server/endpoints/erp/data.js";
import h_erp_health from "../server/endpoints/erp/health.js";
import h_erp_history_restore from "../server/endpoints/erp/history-restore.js";
import h_erp_history from "../server/endpoints/erp/history.js";
import h_erp_seed_stockin from "../server/endpoints/erp/seed-stockin.js";
import h_facturacion_enviar_detalle from "../server/endpoints/facturacion/enviar-detalle.js";

const ROUTES = {
  "/api/addendum/enviar": h_addendum_enviar,
  "/api/addendum/publico": h_addendum_publico,
  "/api/auth/login": h_auth_login,
  "/api/auth/status": h_auth_status,
  "/api/calendario/accesos": h_calendario_accesos,
  "/api/calendario/comentarios": h_calendario_comentarios,
  "/api/calendario/data": h_calendario_data,
  "/api/calendario/img": h_calendario_img,
  "/api/certificado/enviar": h_certificado_enviar,
  "/api/contrato/enviar": h_contrato_enviar,
  "/api/contrato/publico": h_contrato_publico,
  "/api/erp/data": h_erp_data,
  "/api/erp/health": h_erp_health,
  "/api/erp/history-restore": h_erp_history_restore,
  "/api/erp/history": h_erp_history,
  "/api/erp/seed-stockin": h_erp_seed_stockin,
  "/api/facturacion/enviar-detalle": h_facturacion_enviar_detalle,
};

export default async function handler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  // vercel.json reescribe /api/<ruta> → /api/router?__path=<ruta>
  const fromRewrite = url.searchParams.get("__path");
  const path = (fromRewrite ? `/api/${fromRewrite}` : url.pathname).replace(/\/+$/, "");
  url.searchParams.delete("__path");
  const query = url.searchParams.toString();
  req.url = path + (query ? `?${query}` : ""); // los handlers ven la URL original

  const route = ROUTES[path];
  if (!route) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Ruta no encontrada." }));
    return;
  }
  return route(req, res);
}
