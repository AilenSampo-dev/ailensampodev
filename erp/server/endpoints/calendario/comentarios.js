import { handleCalendarioComentarios } from "../../calendario-api-handlers.js";

export default async function handler(req, res) {
  await handleCalendarioComentarios(req, res, process.env);
}
