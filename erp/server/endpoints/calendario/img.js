import { handleCalendarioImg } from "../../calendario-api-handlers.js";

export default async function handler(req, res) {
  await handleCalendarioImg(req, res, process.env);
}
