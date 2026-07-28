const { maskIpHash } = require("../_lib/ip");
const { loadStore, aggregateStats } = require("./_lib/store");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expectedKey = process.env.PROPOSAL_STATS_KEY;
  const providedKey = req.query.key;

  if (expectedKey && providedKey !== expectedKey) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const store = await loadStore();
  const byIp = aggregateStats(store);
  const totalOpens = byIp.reduce((sum, row) => sum + row.count, 0);

  return res.status(200).json({
    proposal: {
      slug: store.slug,
      status: store.status,
      acceptedAt: store.acceptedAt,
      totalOpens,
      uniqueIps: byIp.length,
    },
    byIp: byIp.map((row) => ({
      ...row,
      ipHashMasked: maskIpHash(row.ipHash),
    })),
  });
};
