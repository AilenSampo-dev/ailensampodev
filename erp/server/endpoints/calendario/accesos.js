import { handleCalendarioAccesos } from "../../calendario-api-handlers.js";

export default async function handler(req, res) {
  await handleCalendarioAccesos(req, res, process.env);
}
