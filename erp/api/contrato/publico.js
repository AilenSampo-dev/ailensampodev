import { handleContratoPublico } from "../../server/contrato-api-handlers.js";

export default async function handler(req, res) {
  await handleContratoPublico(req, res, process.env);
}
