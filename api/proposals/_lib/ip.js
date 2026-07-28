const crypto = require("crypto");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || "unknown";
}

function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || "ailensampo-proposals";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

function maskIpHash(ipHash) {
  if (!ipHash || ipHash.length <= 6) return ipHash || "—";
  return `${ipHash.slice(0, 6)}…`;
}

module.exports = { getClientIp, hashIp, maskIpHash };
