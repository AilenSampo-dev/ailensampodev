import { handleContratoEnviar } from "../../server/contrato-api-handlers.js";

export default async function handler(req, res) {
  await handleContratoEnviar(req, res, process.env);
}
