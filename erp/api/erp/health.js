import { handleErpHealth } from "../../server/erp-api-handlers.js";

export default async function handler(req, res) {
  await handleErpHealth(req, res, process.env);
}
