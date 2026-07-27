import { createHash } from "crypto";

const DEFAULT_SALT = "ailensampo-dev";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? DEFAULT_SALT;
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

export function maskIpHash(ipHash: string): string {
  if (ipHash.length <= 6) return ipHash;
  return `${ipHash.slice(0, 6)}…`;
}
