import { NextResponse, type NextRequest } from "next/server";

// Protege el panel interno y las rutas de administración de propuestas con usuario y contraseña
// (HTTP Basic Auth). Las páginas que ven los clientes (/p/..., document, open, accept, demo) quedan públicas.
// Variables: ADMIN_USER y ADMIN_PASSWORD (en .env.local y en Vercel).
// Si faltan en producción, el panel queda CERRADO (nunca abierto por olvido).

export const config = {
  matcher: ["/app/:path*", "/api/proposals", "/api/proposals/:slug/stats"],
};

function unauthorized() {
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel s(a)", charset="UTF-8"' },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Panel deshabilitado: faltan ADMIN_USER / ADMIN_PASSWORD", { status: 503 });
    }
    return NextResponse.next(); // en tu PC, sin credenciales cargadas, sigue abierto para desarrollar
  }

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const separator = decoded.indexOf(":");
  const givenUser = decoded.slice(0, separator);
  const givenPassword = decoded.slice(separator + 1);

  if (separator < 0 || !safeEqual(givenUser, user) || !safeEqual(givenPassword, password)) {
    return unauthorized();
  }
  return NextResponse.next();
}
