/** Utilidades de huella compatibles con navegador (Web Crypto API). */

export const TEXTO_AYUDA_HUELLA =
  "Huella digital única del texto exacto del documento en el momento de aceptar. Si alguien cambia una coma del texto, la huella cambia. Sirve para probar qué versión aceptó el cliente.";

/** SHA-256 en hex cuando Web Crypto no está disponible (p. ej. HTTP no localhost). */
function sha256HexFallback(bytes) {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const bitLen = bytes.length * 8;
  const withLen = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  withLen.set(bytes);
  withLen[bytes.length] = 0x80;
  new DataView(withLen.buffer).setUint32(withLen.length - 4, bitLen, false);

  const w = new Uint32Array(64);
  for (let i = 0; i < withLen.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] =
        (withLen[i + j * 4] << 24) |
        (withLen[i + j * 4 + 1] << 16) |
        (withLen[i + j * 4 + 2] << 8) |
        withLen[i + j * 4 + 3];
    }
    for (let j = 16; j < 64; j++) {
      const s0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^ ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^ (w[j - 15] >>> 3);
      const s1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^ ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let j = 0; j < 64; j++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }
  return [...H].map((n) => n.toString(16).padStart(8, "0")).join("");
}

export async function calcularHuella(html) {
  const data = new TextEncoder().encode(html.trim());
  if (globalThis.crypto?.subtle?.digest) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return sha256HexFallback(data);
}

export function normalizarNombre(nombre) {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function validarNombreEscrito(nombreEscrito, nombreEsperado) {
  const escrito = normalizarNombre(nombreEscrito);
  const esperado = normalizarNombre(nombreEsperado);

  if (!escrito || escrito.length < 3) {
    return "Escribí tu nombre completo tal como figura en el documento.";
  }
  if (escrito === esperado) return null;

  const partesEsperadas = esperado.split(" ").filter((p) => p.length > 1);
  const partesEscritas = escrito.split(" ").filter(Boolean);

  if (partesEsperadas.length >= 2) {
    const ok = partesEsperadas.every((part) =>
      partesEscritas.some((e) => e === part || e.startsWith(part))
    );
    if (ok) return null;
  }

  return `El nombre debe coincidir con el registrado (${nombreEsperado}).`;
}

export function formatearIpParaMostrar(ip) {
  if (!ip) return { value: "—" };
  if (ip === "::1" || ip === "127.0.0.1") {
    return {
      value: ip,
      note: "Prueba local. En producción se guarda la IP pública del cliente.",
    };
  }
  return { value: ip };
}

export async function obtenerIpCliente() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    if (r.ok) {
      const j = await r.json();
      return j.ip || "";
    }
  } catch {}
  return "";
}

export function htmlAPtextoPlano(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
