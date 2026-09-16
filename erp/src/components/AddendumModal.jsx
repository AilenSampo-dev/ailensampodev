import { useState } from "react";
import { X, Mail, RotateCcw, CheckCircle2 } from "lucide-react";
import { generarAddendumElixioHtml } from "../lib/contrato-template.js";
import { enviarAddendumAlCliente } from "../lib/addendum-api.js";
import { emailCliente } from "../lib/enviar-certificado.js";
import { mergeAddendumEnProyecto } from "../lib/addendum-model.js";

const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  pink: "#F656BF",
  mint: "#2FA98A",
  plum: "#3A1E66",
  orange: "#FF6437",
  fTitle: "'Roboto Slab', 'Egyptian Slate', Georgia, serif",
  fBody: "'Nunito Sans', system-ui, sans-serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

const docStyles = `
  .contrato-doc { font-family: ${t.fBody}; color: ${t.ink}; }
  .contrato-doc h1 { font-family: ${t.fBody}; font-size: 26px; font-weight: 900; margin: 0 0 8px; color: ${t.plum}; letter-spacing: -.02em; line-height: 1.15; }
  .contrato-doc h2 { font-family: ${t.fBody}; font-size: 18px; font-weight: 900; margin: 32px 0 12px; color: ${t.plum}; letter-spacing: -.01em; }
  .contrato-doc p { margin: 0 0 14px; line-height: 1.65; font-size: 15px; }
  .contrato-doc ul, .contrato-doc ol { margin: 0 0 14px 20px; }
  .contrato-doc li { margin-bottom: 6px; line-height: 1.55; font-size: 15px; }
  .contrato-doc li p { margin: 0; }
  .contrato-doc strong { font-weight: 700; }
  .contrato-doc a { color: ${t.pink}; }
  .contrato-doc code { font-family: ${t.fMono}; font-size: 13px; background: rgba(26,14,51,0.06); padding: 2px 6px; border-radius: 4px; }
`;

function Label({ children }) {
  return (
    <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.4, color: t.muted, marginBottom: 6 }}>
      {children}
    </div>
  );
}

export default function AddendumModal({ proyecto, cliente, addendum, onSave, onClose }) {
  const [tab, setTab] = useState(addendum.estado === "aceptado" ? "preview" : "editar");
  const [html, setHtml] = useState(addendum.html || "");
  const [doc, setDoc] = useState(addendum);
  const [enviando, setEnviando] = useState(false);
  const [envioMsg, setEnvioMsg] = useState(null);

  const mailCliente = emailCliente(cliente);
  const confirmado = doc.estado === "aceptado";

  const persistir = (nextDoc) => {
    setDoc(nextDoc);
    onSave(mergeAddendumEnProyecto(proyecto, nextDoc));
  };

  const guardarBorrador = () => {
    persistir({ ...doc, html, estado: confirmado ? "aceptado" : doc.estado === "enviado" ? "enviado" : "borrador" });
  };

  const regenerarPlantilla = () => {
    if (confirmado) {
      alert("Este addendum ya fue confirmado. No se puede reemplazar la plantilla.");
      return;
    }
    if (!confirm("¿Reemplazar el texto con la plantilla Elixio Coins? Se perderán las ediciones manuales.")) return;
    setHtml(generarAddendumElixioHtml({ cliente, proyecto }));
  };

  const enviarAlCliente = async () => {
    if (!mailCliente) {
      setEnvioMsg({ error: "Completá el email del cliente en su ficha." });
      return;
    }
    if (confirmado) return;
    setEnviando(true);
    setEnvioMsg(null);
    try {
      const draft = { ...doc, html };
      persistir(mergeAddendumEnProyecto(proyecto, draft));
      const r = await enviarAddendumAlCliente(proyecto.id, doc.id, html, draft);
      const next = {
        ...doc,
        html,
        estado: "enviado",
        firmaToken: r.token,
        enviadoAt: new Date().toISOString(),
        enviadoA: r.to,
        firmaUrl: r.url,
      };
      persistir(next);
      setEnvioMsg({ ok: true, to: r.to, url: r.url, copiaAdmin: r.copiaAdmin });
      const copiaTxt = r.copiaAdmin ? `\nCopia CC: ${r.copiaAdmin}` : "";
      window.alert(`Addendum enviado a ${r.to}.${copiaTxt}`);
    } catch (e) {
      setEnvioMsg({ error: e.message });
    } finally {
      setEnviando(false);
    }
  };

  const marcarAceptadoPorMail = () => {
    if (!confirm("¿Marcar como confirmado por respuesta de mail del cliente?")) return;
    const aceptacion = {
      typedName: cliente.representante?.trim() || "Confirmado por mail",
      clientEmail: mailCliente || "—",
      metodo: "mail",
      fecha: new Date().toLocaleString("es-AR", { dateStyle: "long", timeStyle: "medium" }),
      nota: "Confirmación registrada manualmente desde el ERP.",
    };
    persistir({ ...doc, html, estado: "aceptado", aceptacion });
    setTab("preview");
  };

  const tabs = [
    { id: "editar", label: "Redactar" },
    { id: "preview", label: "Vista previa" },
    { id: "enviar", label: "Enviar" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,14,51,0.22)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        zIndex: 50,
        padding: "32px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: "100%",
          background: t.paper,
          borderRadius: 16,
          border: `1px solid ${t.line}`,
          boxShadow: "0 24px 80px rgba(26,14,51,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "28px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 2, color: t.muted, marginBottom: 8 }}>
              ADDENDUM · {cliente.negocio.toUpperCase()}
            </div>
            <h2 style={{ fontFamily: t.fTitle, fontSize: 24, fontWeight: 400, margin: 0 }}>{doc.titulo}</h2>
            <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint, marginTop: 6 }}>{proyecto.nombre} · {proyecto.tipo}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.muted, padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {confirmado && (
          <div style={{ margin: "16px 32px 0", padding: "12px 16px", background: `${t.mint}12`, border: `1px solid ${t.mint}44`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.ink }}>
            <CheckCircle2 size={16} color={t.mint} />
            Confirmado {doc.aceptacion?.metodo === "mail" ? "por mail" : "por web"} · {doc.aceptacion?.fecha}
          </div>
        )}

        <div style={{ display: "flex", gap: 4, padding: "20px 32px 0", borderBottom: `1px solid ${t.line}` }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: tab === tb.id ? `2px solid ${t.pink}` : "2px solid transparent",
                color: tab === tb.id ? t.ink : t.muted,
                fontWeight: tab === tb.id ? 700 : 500,
                fontSize: 13,
                padding: "10px 14px",
                marginBottom: -1,
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "28px 32px 32px", maxHeight: "70vh", overflowY: "auto" }}>
          {tab === "editar" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Label>TEXTO DEL ADDENDUM (HTML)</Label>
                <button
                  onClick={regenerarPlantilla}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: t.faint, fontSize: 12 }}
                >
                  <RotateCcw size={12} /> Restaurar plantilla
                </button>
              </div>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                disabled={confirmado}
                style={{
                  width: "100%",
                  minHeight: 360,
                  fontFamily: t.fMono,
                  fontSize: 12,
                  lineHeight: 1.5,
                  border: `1px solid ${t.line}`,
                  borderRadius: 8,
                  padding: 16,
                  color: t.ink,
                  resize: "vertical",
                  opacity: confirmado ? 0.7 : 1,
                }}
              />
              {!confirmado && (
                <button
                  onClick={guardarBorrador}
                  style={{ marginTop: 20, width: "100%", background: t.pink, color: "#fff", border: "none", borderRadius: 99, padding: "12px", fontSize: 14, fontWeight: 700 }}
                >
                  Guardar borrador
                </button>
              )}
            </>
          )}

          {tab === "preview" && (
            <>
              <style>{docStyles}</style>
              <div className="contrato-doc" dangerouslySetInnerHTML={{ __html: html }} />
            </>
          )}

          {tab === "enviar" && !confirmado && (
            <>
              <div style={{ marginBottom: 24, padding: 20, background: `${t.plum}08`, borderRadius: 12, border: `1px solid ${t.plum}22` }}>
                <Label>ENVIAR AL CLIENTE</Label>
                <p style={{ fontSize: 13, color: t.muted, margin: "10px 0 16px", lineHeight: 1.5 }}>
                  Se envía un <strong>enlace único</strong> al email del cliente, con el mismo formato que el contrato madre.
                  El cliente puede confirmar <strong>respondiendo al mail</strong> o usando el enlace (nombre + conformidad).
                </p>
                {envioMsg?.ok && (
                  <p style={{ fontSize: 12, color: t.mint, marginBottom: 12 }}>
                    Enviado a {envioMsg.to}
                    {envioMsg.copiaAdmin ? ` · Copia CC: ${envioMsg.copiaAdmin}` : ""}
                  </p>
                )}
                {doc.enviadoAt && !envioMsg?.ok && (
                  <p style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>
                    Último envío: {doc.enviadoA} · {new Date(doc.enviadoAt).toLocaleString("es-AR")}
                  </p>
                )}
                {envioMsg?.error && <p style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{envioMsg.error}</p>}
                <button
                  onClick={enviarAlCliente}
                  disabled={!mailCliente || enviando}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    background: !mailCliente || enviando ? t.faint : t.pink,
                    color: "#fff",
                    border: "none",
                    borderRadius: 99,
                    padding: "14px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: enviando ? "wait" : "pointer",
                  }}
                >
                  <Mail size={16} />
                  {enviando ? "Enviando…" : doc.enviadoAt ? "Reenviar addendum al cliente" : "Enviar addendum al cliente"}
                </button>
                {(envioMsg?.url || doc.firmaUrl) && (
                  <p style={{ fontSize: 11, color: t.faint, marginTop: 12, wordBreak: "break-all" }}>
                    Enlace: {envioMsg?.url || doc.firmaUrl}
                  </p>
                )}
              </div>

              <div style={{ padding: 20, background: `${t.orange}0A`, borderRadius: 12, border: `1px solid ${t.orange}33` }}>
                <Label>CONFIRMACIÓN POR MAIL</Label>
                <p style={{ fontSize: 13, color: t.muted, margin: "10px 0 16px", lineHeight: 1.5 }}>
                  Si el cliente ya respondió al mail confirmando, registrá la aceptación acá sin esperar el enlace web.
                </p>
                <button
                  onClick={marcarAceptadoPorMail}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: t.orange,
                    border: `1px solid ${t.orange}`,
                    borderRadius: 99,
                    padding: "12px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Marcar confirmado por mail
                </button>
              </div>
            </>
          )}

          {tab === "enviar" && confirmado && (
            <p style={{ fontSize: 14, color: t.muted, lineHeight: 1.6 }}>
              Este addendum ya está confirmado. Podés revisarlo en la pestaña Vista previa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AddendumBtn({ onClick, addendum }) {
  const estado = addendum?.estado;
  const label = estado === "aceptado" ? "Addendum OK" : estado === "enviado" ? "Addendum enviado" : "Addendum";
  const color = estado === "aceptado" ? t.mint : estado === "enviado" ? t.pink : t.muted;
  return (
    <button
      type="button"
      onClick={onClick}
      title={addendum?.titulo || "Addendum Elixio Coins"}
      style={{
        background: estado === "aceptado" ? `${t.mint}18` : estado === "enviado" ? `${t.pink}18` : "transparent",
        border: `1px solid ${estado ? color : t.line}`,
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
      {label}
    </button>
  );
}
