const { getClientIp, hashIp } = require("../_lib/ip");
const { loadStore, saveStore } = require("../_lib/store");
const { notifyOpen } = require("../_lib/notify");

async function resolveGeo(ip) {
  if (!ip || ip === "unknown") return {};
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "ailensampo-proposals/1.0" },
    });
    if (!response.ok) return {};
    const data = await response.json();
    return {
      geoCountry: data.country_name || undefined,
      geoRegion: data.region || undefined,
      geoCity: data.city || undefined,
    };
  } catch {
    return {};
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const geo = await resolveGeo(ip);
  const now = new Date().toISOString();
  const url = new URL(req.url, "https://ailensampo.com");

  const store = await loadStore();
  store.opens.push({
    id: `open_${Date.now()}`,
    ipHash,
    openedAt: now,
    referrer: req.headers.referer || undefined,
    userAgent: req.headers["user-agent"] || undefined,
    utmSource: url.searchParams.get("utm_source") || undefined,
    utmMedium: url.searchParams.get("utm_medium") || undefined,
    utmCampaign: url.searchParams.get("utm_campaign") || undefined,
    ...geo,
  });

  if (store.status === "sent") {
    store.status = "viewed";
  }

  await saveStore(store);
  await notifyOpen({
    ipHash,
    openedAt: now,
    geoCountry: geo.geoCountry,
    geoCity: geo.geoCity,
  });

  return res.status(200).json({ ok: true });
};
