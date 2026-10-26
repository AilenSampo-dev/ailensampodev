import { handleAddendumPublico } from "../../addendum-api-handlers.js";

export default async function handler(req, res) {
  await handleAddendumPublico(req, res, process.env);
}
