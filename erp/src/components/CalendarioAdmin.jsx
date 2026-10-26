import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Check } from "lucide-react";
import { getToken } from "../lib/erp-api.js";

/**
 * Calendario de contenido — administración (solo Ailén, dentro del ERP).
 * Crea un link por persona (ve el calendario y comenta), los desactiva, y muestra/resuelve los comentarios.
 * La página que ve cada persona es public/calendario/index.html, servida en /calendario/<link>.
 */

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de conexión");
  return data;
}

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function CalendarioAdmin({ t }) {
  const [accesos, setAccesos] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [piezas, setPiezas] = useState({});
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState("");
  const [verResueltos, setVerResueltos] = useState(false);

  async function cargar() {
    setError("");
    try {
      const [a, c, d] = await Promise.all([
        api("/api/calendario/accesos"),
        api("/api/calendario/comentarios"),
        api("/api/calendario/data"),
      ]);
      setAccesos(a.accesos || []);
      setComentarios(c.comentarios || []);
      setPiezas(Object.fromEntries((d.calendario?.piezas || []).map((p) => [p.id, p.titulo])));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const linkDe = (token) => `${window.location.origin}/calendario/${token}`;

  async function crear(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      const { acceso } = await api("/api/calendario/accesos", { method: "POST", body: JSON.stringify({ nombre }) });
      setAccesos((xs) => [acceso, ...xs]);
      setNombre("");
      copiar(acceso.token);
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function toggleActivo(a) {
    try {
      await api("/api/calendario/accesos", { method: "PATCH", body: JSON.stringify({ token: a.token, activo: !a.activo }) });
      setAccesos((xs) => xs.map((x) => (x.token === a.token ? { ...x, activo: !a.activo } : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleResuelto(c) {
    try {
      await api("/api/calendario/comentarios", { method: "PATCH", body: JSON.stringify({ id: c.id, resuelto: !c.resuelto }) });
      setComentarios((xs) => xs.map((x) => (x.id === c.id ? { ...x, resuelto: !c.resuelto } : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  function copiar(token) {
    const done = () => {
      setCopiado(token);
      setTimeout(() => setCopiado(""), 1800);
    };
    navigator.clipboard?.writeText(linkDe(token)).then(done, done);
  }

  function verCalendario() {
    // La sesión viaja en el fragmento (#), que no llega al servidor ni queda en el historial: la página lo borra al abrir.
    window.open(`/calendario/index.html#s=${encodeURIComponent(getToken() || "local")}`, "_blank", "noopener");
  }

  const pendientes = comentarios.filter((c) => !c.resuelto).length;
  const visibles = useMemo(() => comentarios.filter((c) => verResueltos || !c.resuelto), [comentarios, verResueltos]);

  const card = { border: `1px solid ${t.line}`, borderRadius: 14, padding: 24, marginBottom: 24 };
  const label = { fontFamily: t.fMono, fontSize: 10, letterSpacing: 2, color: t.muted, textTransform: "uppercase" };
  const btn = {
    display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${t.line}`, background: "transparent",
    color: t.ink, borderRadius: 99, padding: "6px 14px", fontSize: 13, fontWeight: 600,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <div>
          <div style={label}>Contenido</div>
          <h1 style={{ fontFamily: t.fTitle, fontSize: 34, margin: "6px 0 4px" }}>Calendario</h1>
          <div style={{ color: t.muted, fontSize: 14 }}>
            Cada persona tiene su link: ve el calendario y comenta. No puede editar ni borrar nada.
          </div>
        </div>
        <button onClick={verCalendario} style={{ ...btn, background: t.plum, color: "#fff", border: "none", padding: "10px 18px" }}>
          <ExternalLink size={14} /> Ver calendario
        </button>
      </div>

      {error && (
        <div style={{ ...card, borderColor: t.orange, color: t.orange, padding: 16, fontSize: 14 }}>{error}</div>
      )}

      <section style={card}>
        <div style={{ ...label, marginBottom: 14 }}>Links de acceso</div>
        <form onSubmit={crear} style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la persona (ej. Sofía · diseño)"
            maxLength={80}
            style={{ flex: "1 1 260px", border: `1px solid ${t.line}`, borderRadius: 99, padding: "10px 16px", fontSize: 14 }}
          />
          <button type="submit" style={{ ...btn, background: t.pink, color: "#fff", border: "none", padding: "10px 18px" }}>
            Crear link
          </button>
        </form>

        {cargando ? (
          <div style={{ color: t.muted, fontSize: 14 }}>Cargando…</div>
        ) : accesos.length === 0 ? (
          <div style={{ color: t.muted, fontSize: 14 }}>Todavía no compartiste el calendario con nadie.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {accesos.map((a) => (
              <div key={a.token} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: `1px solid ${t.line}`, flexWrap: "wrap", opacity: a.activo ? 1 : 0.5 }}>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 700 }}>{a.nombre}</div>
                  <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.muted }}>
                    {a.activo ? "activo" : "desactivado"} · último acceso {fmt(a.ultimo_acceso)} · {a.comentarios.total} comentarios
                    {a.comentarios.pendientes ? ` (${a.comentarios.pendientes} sin resolver)` : ""}
                  </div>
                </div>
                {a.activo && (
                  <button onClick={() => copiar(a.token)} style={btn}>
                    {copiado === a.token ? <Check size={14} /> : <Copy size={14} />}
                    {copiado === a.token ? "Copiado" : "Copiar link"}
                  </button>
                )}
                <button onClick={() => toggleActivo(a)} style={{ ...btn, color: a.activo ? t.orange : t.mint }}>
                  {a.activo ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
          <div style={label}>Comentarios · {pendientes} sin resolver</div>
          <label style={{ fontSize: 13, color: t.muted, display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={verResueltos} onChange={(e) => setVerResueltos(e.target.checked)} /> Mostrar resueltos
          </label>
        </div>
        {visibles.length === 0 ? (
          <div style={{ color: t.muted, fontSize: 14 }}>{cargando ? "Cargando…" : "No hay comentarios pendientes."}</div>
        ) : (
          visibles.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderTop: `1px solid ${t.line}`, opacity: c.resuelto ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={c.resuelto}
                onChange={() => toggleResuelto(c)}
                title={c.resuelto ? "Marcar como pendiente" : "Marcar como resuelto"}
                style={{ marginTop: 4 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.muted }}>
                  <strong style={{ color: c.autor === "Ailén" ? t.pink : t.ink }}>{c.autor}</strong> en{" "}
                  <strong style={{ color: t.ink }}>{piezas[c.pieza_id] || c.pieza_id}</strong> · {fmt(c.created_at)}
                </div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap", marginTop: 2 }}>{c.texto}</div>
              </div>
            </div>
          ))
        )}
        <div style={{ fontSize: 12, color: t.muted, marginTop: 12 }}>
          Para responder, abrí el calendario con “Ver calendario” y comentá en la pieza: tus comentarios los ve todo el equipo.
        </div>
      </section>
    </div>
  );
}
