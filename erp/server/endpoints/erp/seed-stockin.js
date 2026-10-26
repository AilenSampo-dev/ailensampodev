import { handleErpSeedStockin } from "../../erp-api-handlers.js";

export default async function handler(req, res) {
  await handleErpSeedStockin(req, res, process.env);
}
