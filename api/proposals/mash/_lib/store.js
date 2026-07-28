const SLUG = "mash";
const STORE_KEY = `proposal:${SLUG}`;

function emptyStore() {
  return {
    slug: SLUG,
    status: "sent",
    acceptedAt: null,
    acceptedIpHash: null,
    opens: [],
  };
}

function getMemoryStore() {
  if (!globalThis.__proposalStores) {
    globalThis.__proposalStores = {};
  }
  if (!globalThis.__proposalStores[SLUG]) {
    globalThis.__proposalStores[SLUG] = emptyStore();
  }
  return globalThis.__proposalStores[SLUG];
}

async function kvRequest(path, init) {
  const baseUrl = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!baseUrl || !token) return null;

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init && init.headers ? init.headers : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`KV error ${response.status}`);
  }

  return response.json();
}

async function loadStore() {
  try {
    const data = await kvRequest(`/get/${STORE_KEY}`);
    if (data && data.result) {
      return JSON.parse(data.result);
    }
  } catch {
    // Fallback a memoria del runtime si KV no está configurado.
  }

  return getMemoryStore();
}

async function saveStore(store) {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await fetch(`${process.env.KV_REST_API_URL}/set/${STORE_KEY}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
        body: JSON.stringify(JSON.stringify(store)),
      });
      return store;
    }
  } catch {
    // Fallback silencioso.
  }

  globalThis.__proposalStores = globalThis.__proposalStores || {};
  globalThis.__proposalStores[SLUG] = store;
  return store;
}

function aggregateStats(store) {
  const byIp = new Map();

  for (const open of store.opens) {
    const existing = byIp.get(open.ipHash);
    if (!existing) {
      byIp.set(open.ipHash, {
        ipHash: open.ipHash,
        count: 1,
        firstOpenedAt: open.openedAt,
        lastOpenedAt: open.openedAt,
        geoCountry: open.geoCountry,
        geoRegion: open.geoRegion,
        geoCity: open.geoCity,
      });
      continue;
    }

    byIp.set(open.ipHash, {
      ...existing,
      count: existing.count + 1,
      lastOpenedAt: open.openedAt,
      geoCountry: open.geoCountry || existing.geoCountry,
      geoRegion: open.geoRegion || existing.geoRegion,
      geoCity: open.geoCity || existing.geoCity,
    });
  }

  return [...byIp.values()].sort(
    (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
  );
}

module.exports = {
  SLUG,
  emptyStore,
  loadStore,
  saveStore,
  aggregateStats,
};
