import { handleAuthLogin } from "../../server/erp-api-handlers.js";

export default async function handler(req, res) {
  await handleAuthLogin(req, res, process.env);
}
