export type GeoLocation = {
  country?: string;
  region?: string;
  city?: string;
};

/** Headers que Vercel agrega en producción (sin guardar la IP). */
export function getGeoFromRequest(request: Request): GeoLocation {
  const country = request.headers.get("x-vercel-ip-country") ?? undefined;
  const region = request.headers.get("x-vercel-ip-country-region") ?? undefined;
  const city = decodeHeader(request.headers.get("x-vercel-ip-city"));

  if (!country && !region && !city) {
    return {};
  }

  return { country, region, city };
}

function decodeHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isLocalIp(ip: string): boolean {
  return (
    ip === "unknown" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  );
}

/** Fallback en local cuando no hay headers de Vercel. No se guarda la IP. */
export async function resolveGeoFromIp(ip: string): Promise<GeoLocation> {
  if (isLocalIp(ip)) {
    return {};
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,regionName,city`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!res.ok) return {};

    const data = (await res.json()) as {
      status?: string;
      countryCode?: string;
      regionName?: string;
      city?: string;
    };

    if (data.status !== "success") return {};

    return {
      country: data.countryCode,
      region: data.regionName,
      city: data.city,
    };
  } catch {
    return {};
  }
}

export async function resolveGeo(
  request: Request,
  ip: string
): Promise<GeoLocation> {
  const fromVercel = getGeoFromRequest(request);
  if (fromVercel.country || fromVercel.city) {
    return fromVercel;
  }

  return resolveGeoFromIp(ip);
}

export function formatGeoLocation(geo: GeoLocation): string | undefined {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join(", ");
}
