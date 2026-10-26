import { handleErpHistory } from "../../erp-api-handlers.js";

export default async function handler(req, res) {
  await handleErpHistory(req, res, process.env);
}
