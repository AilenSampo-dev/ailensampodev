import { handleErpData } from "../../server/erp-api-handlers.js";

export default async function handler(req, res) {
  await handleErpData(req, res, process.env);
}
