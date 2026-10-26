import { handleCalendarioData } from "../../server/calendario-api-handlers.js";

export default async function handler(req, res) {
  await handleCalendarioData(req, res, process.env);
}
