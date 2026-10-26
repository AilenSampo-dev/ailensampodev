import { handleAddendumEnviar } from "../../addendum-api-handlers.js";

export default async function handler(req, res) {
  await handleAddendumEnviar(req, res, process.env);
}
