import { handleAddendumEnviar } from "../../server/addendum-api-handlers.js";

export default async function handler(req, res) {
  await handleAddendumEnviar(req, res, process.env);
}
