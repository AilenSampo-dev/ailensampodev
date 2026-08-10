import { useState, useEffect, useRef } from "react";
import { Plus, X, Pencil, Trash2, FileText, LogOut, Cloud, CloudOff } from "lucide-react";
import ContratoModal from "./components/ContratoModal.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import { checkAuthStatus, fetchErpData, saveErpData, logout as logoutSession, getToken } from "./lib/erp-api.js";

/**
 * Panel de clientes — s(a)
 * Ailén Sampó · Sistemas a medida
 *
 * Fondo blanco, color en los detalles (estados, números clave, acento de nav).
 * Prototipo React (JS) para portar a React + TS + Vite + Supabase.
 * Persiste en el storage del artefacto con fallback a localStorage.
 * Títulos: Egyptian Slate en prod (acá slab de fallback). Labels/números: DM Mono.
 */

// ─── Tokens ────────────────────────────────────────────────────────
const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  plum: "#3A1E66",
  lilac: "#E1ADFF",
  pink: "#F656BF",
  orange: "#FF6437",
  yellow: "#E0B93A",
  mint: "#2FA98A",
  blue: "#6882EB",
  blueDeep: "#5C64F2",
  gray: "#4D4F54",
  fTitle: "'Roboto Slab', 'Egyptian Slate', Georgia, serif",
  fBody: "'Nunito Sans', system-ui, sans-serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

const COLOR = {
  Prospecto: t.yellow,
  Activo: t.mint,
  Pausado: t.orange,
  Cerrado: t.gray,
  Propuesta: t.yellow,
  "En construcción": t.blue,
  Producción: t.mint,
  Mantenimiento: t.lilac,
};

const ESTADOS_CLIENTE = ["Prospecto", "Activo", "Pausado", "Cerrado"];
const ESTADOS_PROYECTO = ["Propuesta", "En construcción", "Producción", "Mantenimiento", "Pausado"];
const TIPOS = ["Web", "ERP", "Automatización", "Panel", "Otro"];

// ─── Persistencia ──────────────────────────────────────────────────
const store = {
  async get(key, fallback) {
    try {
      if (window.storage?.get) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : fallback;
      }
    } catch {}
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      if (window.storage?.set) {
        await window.storage.set(key, JSON.stringify(value));
        return;
      }
    } catch {}
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const DATA_VERSION = 2;

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── App ───────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState({ loading: true, authenticated: false, cloudBackup: false, passwordRequired: true });

  useEffect(() => {
    (async () => {
      try {
        if (!getToken()) {
          const probe = await fetch("/api/auth/status")
            .then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) }))
            .catch(() => null);

          // Solo en dev local, sin ERP_PASSWORD configurada
          if (probe?.passwordRequired === false && import.meta.env.DEV) {
            setSession({ loading: false, authenticated: true, cloudBackup: !!probe.cloudBackup, passwordRequired: false });
            return;
          }
          setSession({
            loading: false,
            authenticated: false,
            cloudBackup: !!probe?.cloudBackup,
            passwordRequired: true,
          });
          return;
        }
        const status = await checkAuthStatus();
        setSession({
          loading: false,
          authenticated: !!status.ok,
          cloudBackup: !!status.cloudBackup,
          passwordRequired: true,
        });
      } catch {
        setSession({ loading: false, authenticated: false, cloudBackup: false, passwordRequired: true });
      }
    })();
  }, []);

  const onLogin = (result) => {
    setSession({ loading: false, authenticated: true, cloudBackup: !!result.cloudBackup, passwordRequired: true });
  };

  const onLogout = () => {
    logoutSession();
    setSession({ loading: false, authenticated: false, cloudBackup: false, passwordRequired: true });
  };

  if (session.loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.fBody, color: t.muted }}>
        Cargando…
      </div>
    );
  }

  if (!session.authenticated) {
    return <LoginScreen onSuccess={onLogin} />;
  }

  return <ErpPanel session={session} onLogout={onLogout} />;
}

function ErpPanel({ session, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [highlightCliente, setHighlightCliente] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const migratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      let nextClientes = [];
      let nextProyectos = [];

      if (session.cloudBackup) {
        try {
          const cloud = await fetchErpData();
          if (Array.isArray(cloud.clientes) && (cloud.clientes.length || cloud.proyectos?.length)) {
            nextClientes = cloud.clientes;
            nextProyectos = cloud.proyectos ?? [];
          } else {
            nextClientes = (await store.get("clientes", null)) ?? [];
            nextProyectos = (await store.get("proyectos", null)) ?? [];
            if ((nextClientes.length || nextProyectos.length) && !migratedRef.current) {
              migratedRef.current = true;
              await saveErpData({ clientes: nextClientes, proyectos: nextProyectos, dataVersion: DATA_VERSION });
            }
          }
        } catch {
          nextClientes = (await store.get("clientes", null)) ?? [];
          nextProyectos = (await store.get("proyectos", null)) ?? [];
        }
      } else {
        const version = await store.get("dataVersion", 0);
        if (version < DATA_VERSION) {
          await store.set("clientes", []);
          await store.set("proyectos", []);
          await store.set("dataVersion", DATA_VERSION);
        } else {
          nextClientes = (await store.get("clientes", null)) ?? [];
          nextProyectos = (await store.get("proyectos", null)) ?? [];
        }
      }

      setClientes(nextClientes);
      setProyectos(nextProyectos);
      setReady(true);
    })();
  }, [session.cloudBackup]);

  useEffect(() => {
    if (!ready) return;
    store.set("clientes", clientes);
    store.set("proyectos", proyectos);
    store.set("dataVersion", DATA_VERSION);
  }, [clientes, proyectos, ready]);

  useEffect(() => {
    if (!ready || !session.cloudBackup) return;
    setSyncState("pending");
    const timer = setTimeout(async () => {
      try {
        await saveErpData({ clientes, proyectos, dataVersion: DATA_VERSION });
        setSyncState("ok");
      } catch (e) {
        setSyncState("error");
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [clientes, proyectos, ready, session.cloudBackup]);

  const activos = clientes.filter((c) => c.estado === "Activo");
  const mrr = activos.reduce((s, c) => s + (Number(c.feeMensual) || 0), 0);
  const prospectos = clientes.filter((c) => c.estado === "Prospecto").length;
  const enConstruccion = proyectos.filter((p) => p.estado === "En construcción").length;
  const enProduccion = proyectos.filter((p) => p.estado === "Producción").length;
  const pendienteCobro = proyectos.reduce(
    (s, p) => s + Math.max((Number(p.feeConstruccion) || 0) - (Number(p.cobrado) || 0), 0), 0
  );

  const saveCliente = (d) => {
    setClientes((prev) => (d.id ? prev.map((c) => (c.id === d.id ? d : c)) : [...prev, { ...d, id: uid() }]));
    setModal(null);
  };
  const saveProyecto = (d) => {
    if (!d.clienteId || !clientes.some((c) => c.id === d.clienteId)) return;
    setProyectos((prev) => (d.id ? prev.map((p) => (p.id === d.id ? d : p)) : [...prev, { ...d, id: uid() }]));
    setModal(null);
  };
  const delCliente = (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setProyectos((prev) => prev.filter((p) => p.clienteId !== id));
  };
  const delProyecto = (id) => setProyectos((prev) => prev.filter((p) => p.id !== id));

  const abrirContrato = (proyectoId) => {
    const p = proyectos.find((x) => x.id === proyectoId);
    const c = clientes.find((x) => x.id === p?.clienteId);
    if (p && c) setModal({ tipo: "contrato", proyecto: p, cliente: c });
  };

  const saveContrato = (proyectoActualizado) => {
    setProyectos((prev) => prev.map((p) => (p.id === proyectoActualizado.id ? proyectoActualizado : p)));
  };

  const nav = [
    { id: "dashboard", label: "Panel" },
    { id: "clientes", label: "Clientes" },
    { id: "proyectos", label: "Proyectos" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.paper, color: t.ink, fontFamily: t.fBody }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&family=Roboto+Slab:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, textarea, button { font-family: ${t.fBody}; }
        button { cursor: pointer; }
        ::placeholder { color: ${t.faint}; }
      `}</style>

      <aside style={{ width: 208, borderRight: `1px solid ${t.line}`, padding: "40px 28px", position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: t.fMono, fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>
          s<span style={{ color: t.pink }}>(a)</span>
        </div>
        <div style={{ fontFamily: t.fMono, fontSize: 8.5, letterSpacing: 3, color: t.muted, marginBottom: 44 }}>
          SISTEMAS A MEDIDA
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 0", border: "none", background: "transparent",
                  color: active ? t.ink : t.muted, fontSize: 15,
                  fontWeight: active ? 700 : 500, textAlign: "left",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: 99, background: active ? t.pink : "transparent" }} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 32 }}>
          {session.cloudBackup ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: t.fMono, fontSize: 10, color: syncState === "error" ? t.orange : t.mint, marginBottom: 12 }}>
              {syncState === "error" ? <CloudOff size={12} /> : <Cloud size={12} />}
              {syncState === "pending" ? "Guardando…" : syncState === "error" ? "Error de respaldo" : "Respaldo en nube"}
            </div>
          ) : session.offline ? null : (
            <div style={{ fontFamily: t.fMono, fontSize: 10, color: t.faint, marginBottom: 12 }}>Solo local</div>
          )}
          {session.passwordRequired && (
            <button
              onClick={onLogout}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: t.muted, fontSize: 13, padding: "8px 0" }}
            >
              <LogOut size={14} /> Salir
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, padding: "56px 64px", maxWidth: 1080 }}>
        {!ready ? (
          <div style={{ color: t.muted, fontFamily: t.fMono, fontSize: 13 }}>Cargando datos…</div>
        ) : (
          <>
        {view === "dashboard" && (
          <Dashboard {...{ mrr, activos: activos.length, prospectos, enConstruccion, enProduccion, pendienteCobro, total: clientes.length }} />
        )}
        {view === "clientes" && (
          <Clientes clientes={clientes} proyectos={proyectos}
            onNew={() => setModal({ tipo: "cliente", data: null })}
            onEdit={(c) => setModal({ tipo: "cliente", data: c })}
            onDel={delCliente}
            onNewProyecto={(clienteId) => setModal({ tipo: "proyecto", data: null, clienteId })}
            onEditProyecto={(p) => setModal({ tipo: "proyecto", data: p })}
            onDelProyecto={delProyecto}
            onContrato={abrirContrato}
            highlightId={highlightCliente}
            onClearHighlight={() => setHighlightCliente(null)} />
        )}
        {view === "proyectos" && (
          <Proyectos proyectos={proyectos} clientes={clientes}
            onNew={() => setModal({ tipo: "proyecto", data: null })}
            onEdit={(p) => setModal({ tipo: "proyecto", data: p })}
            onDel={delProyecto}
            onContrato={abrirContrato}
            onVerCliente={(id) => { setView("clientes"); setHighlightCliente(id); }} />
        )}
          </>
        )}
      </main>

      {modal?.tipo === "cliente" && <ClienteModal data={modal.data} onSave={saveCliente} onClose={() => setModal(null)} />}
      {modal?.tipo === "proyecto" && (
        <ProyectoModal
          data={modal.data}
          defaultClienteId={modal.clienteId}
          clientes={clientes}
          onSave={saveProyecto}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.tipo === "contrato" && (
        <ContratoModal
          proyecto={modal.proyecto}
          cliente={modal.cliente}
          onSave={saveContrato}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Header({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 48 }}>
      <h1 style={{ fontFamily: t.fTitle, fontSize: 30, fontWeight: 400, margin: 0, letterSpacing: -0.2 }}>{children}</h1>
      {action}
    </div>
  );
}

function AddBtn({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: 6, background: disabled ? t.faint : t.pink, color: "#fff", border: "none", borderRadius: 99, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      <Plus size={14} /> {children}
    </button>
  );
}

function Status({ estado }) {
  const c = COLOR[estado] || t.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      fontFamily: t.fMono, fontSize: 11, letterSpacing: 0.2,
      padding: "3px 10px 3px 8px", borderRadius: 99,
      background: `${c}1E`, border: `1px solid ${c}44`, color: t.ink,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: c }} />
      {estado}
    </span>
  );
}

function Label({ children }) {
  return <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.4, color: t.muted }}>{children}</div>;
}

function RowActions({ onEdit, onDel }) {
  const b = { background: "transparent", border: "none", color: t.faint, display: "flex", padding: 4 };
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button style={b} onClick={onEdit} title="Editar"><Pencil size={15} /></button>
      <button style={b} onClick={onDel} title="Eliminar"><Trash2 size={15} /></button>
    </div>
  );
}

function Empty({ texto }) {
  return <div style={{ padding: "40px 0", color: t.faint, fontFamily: t.fMono, fontSize: 13 }}>{texto}</div>;
}

function Dashboard({ mrr, activos, prospectos, enConstruccion, enProduccion, pendienteCobro, total }) {
  const Metric = ({ label, value, color, primary }) => (
    <div style={{ padding: "26px 0", borderTop: `1px solid ${t.line}` }}>
      <Label>{label}</Label>
      <div style={{ fontFamily: t.fTitle, fontSize: primary ? 46 : 30, fontWeight: 400, marginTop: 12, color: color || t.ink, letterSpacing: -0.5 }}>
        {value}
      </div>
    </div>
  );
  return (
    <>
      <Header>Panel</Header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 56 }}>
        <Metric primary color={t.pink} label="INGRESO RECURRENTE MENSUAL" value={fmt(mrr)} />
        <Metric primary color={t.blueDeep} label="CONSTRUCCIÓN PENDIENTE DE COBRO" value={fmt(pendienteCobro)} />
        <Metric color={t.yellow} label="PROSPECTOS" value={prospectos} />
        <Metric color={t.blue} label="EN CONSTRUCCIÓN" value={enConstruccion} />
        <Metric color={t.mint} label="EN PRODUCCIÓN" value={enProduccion} />
        <Metric label="CLIENTES TOTALES" value={total} />
      </div>
    </>
  );
}

function ContratoBtn({ onClick, aceptado, enviado }) {
  const label = aceptado ? "Firmado" : enviado ? "Enviado" : "Contrato";
  const color = aceptado ? t.mint : enviado ? t.pink : t.muted;
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: aceptado ? `${t.mint}18` : enviado ? `${t.pink}18` : "transparent",
        border: `1px solid ${aceptado ? t.mint : enviado ? t.pink : t.line}`,
        borderRadius: 99,
        color,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      <FileText size={11} /> {label}
    </button>
  );
}

function Clientes({ clientes, proyectos, onNew, onEdit, onDel, onNewProyecto, onEditProyecto, onDelProyecto, onContrato, highlightId, onClearHighlight }) {
  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`cliente-${highlightId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const tmr = setTimeout(() => onClearHighlight?.(), 2000);
    return () => clearTimeout(tmr);
  }, [highlightId, onClearHighlight]);

  return (
    <>
      <Header action={<AddBtn onClick={onNew}>Cliente</AddBtn>}>Clientes</Header>
      {clientes.length === 0 ? <Empty texto="Sin clientes todavía." /> : (
        <div>
          {clientes.map((c) => {
            const proys = proyectos.filter((p) => p.clienteId === c.id);
            const highlighted = highlightId === c.id;
            return (
              <div key={c.id} id={`cliente-${c.id}`} style={{ borderTop: `1px solid ${t.line}`, background: highlighted ? `${t.pink}0A` : "transparent", transition: "background 0.4s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 0" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{c.negocio}</div>
                    <div style={{ fontFamily: t.fMono, fontSize: 12, color: t.faint, marginTop: 4 }}>
                      {c.contacto || "—"} · {proys.length} proyecto{proys.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div style={{ width: 160 }}><Status estado={c.estado} /></div>
                  <div style={{ width: 130, textAlign: "right", fontFamily: t.fMono, fontSize: 14 }}>{fmt(c.feeMensual)}</div>
                  <button
                    onClick={() => onNewProyecto(c.id)}
                    title="Agregar proyecto a este cliente"
                    style={{ background: "transparent", border: `1px solid ${t.line}`, borderRadius: 99, color: t.muted, fontSize: 11, fontWeight: 600, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
                  >
                    <Plus size={11} /> Proyecto
                  </button>
                  <RowActions onEdit={() => onEdit(c)} onDel={() => onDel(c.id)} />
                </div>
                {proys.length > 0 && (
                  <div style={{ paddingBottom: 12, paddingLeft: 16 }}>
                    {proys.map((p) => {
                      const pend = Math.max((Number(p.feeConstruccion) || 0) - (Number(p.cobrado) || 0), 0);
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0 10px 12px", borderLeft: `2px solid ${t.line}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nombre}</div>
                            <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint, marginTop: 2 }}>{p.tipo}</div>
                          </div>
                          <div style={{ width: 160 }}><Status estado={p.estado} /></div>
                          <div style={{ width: 120, textAlign: "right", fontFamily: t.fMono, fontSize: 12 }}>
                            <span style={{ color: pend > 0 ? t.pink : t.mint }}>{fmt(pend)}</span>
                          </div>
                          <ContratoBtn onClick={() => onContrato(p.id)} aceptado={p.contratoEstado === "aceptado"} enviado={p.contratoEstado === "enviado"} />
                          <RowActions onEdit={() => onEditProyecto(p)} onDel={() => onDelProyecto(p.id)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${t.line}` }} />
        </div>
      )}
    </>
  );
}

function Proyectos({ proyectos, clientes, onNew, onEdit, onDel, onContrato, onVerCliente }) {
  const grupos = clientes
    .map((c) => ({ cliente: c, items: proyectos.filter((p) => p.clienteId === c.id) }))
    .filter((g) => g.items.length > 0);
  const huerfanos = proyectos.filter((p) => !clientes.some((c) => c.id === p.clienteId));

  const renderProyecto = (p, cliente) => {
    const pend = Math.max((Number(p.feeConstruccion) || 0) - (Number(p.cobrado) || 0), 0);
    return (
      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 0", borderTop: `1px solid ${t.line}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{p.nombre}</div>
          <div style={{ fontFamily: t.fMono, fontSize: 12, color: t.faint, marginTop: 4 }}>{p.tipo}</div>
        </div>
        {cliente && (
          <button
            onClick={() => onVerCliente(cliente.id)}
            style={{ background: `${t.plum}0E`, border: `1px solid ${t.plum}22`, borderRadius: 99, color: t.plum, fontFamily: t.fMono, fontSize: 11, padding: "4px 12px", whiteSpace: "nowrap" }}
          >
            {cliente.negocio}
          </button>
        )}
        <div style={{ width: 180 }}><Status estado={p.estado} /></div>
        <div style={{ width: 150, textAlign: "right", fontFamily: t.fMono, fontSize: 14 }}>
          <span style={{ color: pend > 0 ? t.pink : t.mint }}>{fmt(pend)}</span>
          <span style={{ color: t.faint }}> / {fmt(p.feeConstruccion)}</span>
        </div>
        <ContratoBtn onClick={() => onContrato(p.id)} aceptado={p.contratoEstado === "aceptado"} enviado={p.contratoEstado === "enviado"} />
        <RowActions onEdit={() => onEdit(p)} onDel={() => onDel(p.id)} />
      </div>
    );
  };

  return (
    <>
      <Header action={<AddBtn onClick={onNew} disabled={clientes.length === 0}>Proyecto</AddBtn>}>Proyectos</Header>
      {clientes.length === 0 ? <Empty texto="Creá un cliente antes de agregar proyectos." /> : proyectos.length === 0 ? (
        <Empty texto="Sin proyectos todavía." />
      ) : (
        <div>
          {grupos.map(({ cliente, items }) => (
            <div key={cliente.id} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 8 }}>
                <button
                  onClick={() => onVerCliente(cliente.id)}
                  style={{ background: "none", border: "none", fontFamily: t.fTitle, fontSize: 18, fontWeight: 400, color: t.ink, padding: 0 }}
                >
                  {cliente.negocio}
                </button>
                <Status estado={cliente.estado} />
                <span style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint }}>{items.length} proyecto{items.length === 1 ? "" : "s"}</span>
              </div>
              {items.map((p) => renderProyecto(p, null))}
            </div>
          ))}
          {huerfanos.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <Label>SIN CLIENTE VINCULADO</Label>
              {huerfanos.map((p) => renderProyecto(p, null))}
            </div>
          )}
          <div style={{ borderTop: `1px solid ${t.line}` }} />
        </div>
      )}
    </>
  );
}

const field = { width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${t.line}`, borderRadius: 0, padding: "8px 0", color: t.ink, fontSize: 15, outline: "none" };
const labelStyle = { fontFamily: t.fMono, fontSize: 10, letterSpacing: 1, color: t.muted, display: "block", marginBottom: 4 };

function Field({ label, children }) {
  return <div style={{ marginBottom: 22 }}><label style={labelStyle}>{label}</label>{children}</div>;
}

function ModalShell({ title, onClose, onSave, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,14,51,0.20)", display: "flex", justifyContent: "flex-end", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "92vw", height: "100%", background: t.paper, borderLeft: `1px solid ${t.line}`, padding: "40px 40px", overflowY: "auto", boxShadow: "-24px 0 60px rgba(26,14,51,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <h2 style={{ fontFamily: t.fTitle, fontSize: 22, fontWeight: 400, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.muted }}><X size={20} /></button>
        </div>
        {children}
        <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
          <button onClick={onSave} style={{ flex: 1, background: t.pink, color: "#fff", border: "none", borderRadius: 99, padding: "12px", fontSize: 14, fontWeight: 700 }}>Guardar</button>
          <button onClick={onClose} style={{ background: "transparent", color: t.muted, border: `1px solid ${t.line}`, borderRadius: 99, padding: "12px 20px", fontSize: 14 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function ClienteModal({ data, onSave, onClose }) {
  const [f, setF] = useState(data || { negocio: "", representante: "", email: "", contacto: "", estado: "Prospecto", feeMensual: 0, notas: "", alta: new Date().toISOString().slice(0, 10) });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <ModalShell title={data ? "Editar cliente" : "Nuevo cliente"} onClose={onClose} onSave={() => f.negocio.trim() && onSave(f)}>
      <Field label="NEGOCIO / RAZÓN SOCIAL"><input style={field} value={f.negocio} onChange={(e) => set("negocio", e.target.value)} placeholder="Ej. Stockin Lavanda S.A.S." /></Field>
      <Field label="REPRESENTANTE LEGAL"><input style={field} value={f.representante || ""} onChange={(e) => set("representante", e.target.value)} placeholder="Nombre completo de quien firma" /></Field>
      <Field label="EMAIL"><input style={field} type="email" value={f.email || (f.contacto?.includes("@") ? f.contacto : "")} onChange={(e) => set("email", e.target.value)} placeholder="certificado@cliente.com" /></Field>
      <Field label="CONTACTO / TELÉFONO"><input style={field} value={f.contacto?.includes("@") ? "" : (f.contacto || "")} onChange={(e) => set("contacto", e.target.value)} placeholder="Teléfono u otro contacto" /></Field>
      <Field label="ESTADO"><select style={field} value={f.estado} onChange={(e) => set("estado", e.target.value)}>{ESTADOS_CLIENTE.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="FEE MENSUAL (ARS)"><input style={field} type="number" value={f.feeMensual} onChange={(e) => set("feeMensual", e.target.value)} /></Field>
      <Field label="NOTAS"><textarea style={{ ...field, minHeight: 70, resize: "vertical" }} value={f.notas} onChange={(e) => set("notas", e.target.value)} /></Field>
    </ModalShell>
  );
}

function ProyectoModal({ data, clientes, defaultClienteId, onSave, onClose }) {
  const [f, setF] = useState(
    data || { clienteId: defaultClienteId || clientes[0]?.id || "", nombre: "", tipo: "Web", estado: "Propuesta", feeConstruccion: 0, cobrado: 0, repo: "", notas: "" }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const clienteValido = f.clienteId && clientes.some((c) => c.id === f.clienteId);
  const clienteSel = clientes.find((c) => c.id === f.clienteId);
  return (
    <ModalShell title={data ? "Editar proyecto" : "Nuevo proyecto"} onClose={onClose} onSave={() => f.nombre.trim() && clienteValido && onSave(f)}>
      {clienteSel && (
        <div style={{ marginBottom: 24, padding: "12px 14px", background: `${t.plum}0A`, borderRadius: 8, border: `1px solid ${t.plum}18` }}>
          <Label>CLIENTE VINCULADO</Label>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{clienteSel.negocio}</div>
          <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint, marginTop: 2 }}>{clienteSel.contacto || "—"}</div>
        </div>
      )}
      <Field label="NOMBRE"><input style={field} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} /></Field>
      <Field label="CLIENTE">
        <select style={field} value={f.clienteId} onChange={(e) => set("clienteId", e.target.value)} required>
          {clientes.length === 0 && <option value="">— sin clientes —</option>}
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.negocio}</option>)}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}><Field label="TIPO"><select style={field} value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>{TIPOS.map((x) => <option key={x}>{x}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="ESTADO"><select style={field} value={f.estado} onChange={(e) => set("estado", e.target.value)}>{ESTADOS_PROYECTO.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}><Field label="FEE CONSTRUCCIÓN"><input style={field} type="number" value={f.feeConstruccion} onChange={(e) => set("feeConstruccion", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="COBRADO"><input style={field} type="number" value={f.cobrado} onChange={(e) => set("cobrado", e.target.value)} /></Field></div>
      </div>
      <Field label="REPO / LINK"><input style={field} value={f.repo} onChange={(e) => set("repo", e.target.value)} /></Field>
      <Field label="NOTAS"><textarea style={{ ...field, minHeight: 60, resize: "vertical" }} value={f.notas} onChange={(e) => set("notas", e.target.value)} /></Field>
    </ModalShell>
  );
}
