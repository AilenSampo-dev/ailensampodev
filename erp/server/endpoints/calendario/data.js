import { handleCalendarioData } from "../../calendario-api-handlers.js";

export default async function handler(req, res) {
  await handleCalendarioData(req, res, process.env);
}
