const { getClientIp, hashIp } = require("../_lib/ip");
const { loadStore, saveStore } = require("../_lib/store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const store = await loadStore();

  if (store.status === "accepted") {
    return res.status(409).json({
      error: "Esta propuesta ya fue aceptada",
      status: store.status,
      acceptedAt: store.acceptedAt,
    });
  }

  const ipHash = hashIp(getClientIp(req));
  const now = new Date().toISOString();

  store.status = "accepted";
  store.acceptedAt = now;
  store.acceptedIpHash = ipHash;

  await saveStore(store);

  return res.status(200).json({
    ok: true,
    status: store.status,
    acceptedAt: store.acceptedAt,
  });
};
