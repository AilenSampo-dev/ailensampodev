import { handleAuthStatus } from "../../server/erp-api-handlers.js";
import { passwordRequired } from "../../server/auth.js";

export default async function handler(req, res) {
  if (req.method === "GET" && !passwordRequired(process.env)) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, cloudBackup: false, passwordRequired: false }));
    return;
  }
  await handleAuthStatus(req, res, process.env);
}
