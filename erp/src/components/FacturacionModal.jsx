import { useMemo, useState } from "react";
import { X, Plus, ChevronLeft, Paperclip, Download, Trash2, Receipt, ExternalLink, Mail } from "lucide-react";
import { base64ToBytes, descargarPdfBytes } from "../lib/pdf-utils.js";
import {
  crearMesFacturacion,
  ESTADOS_PAGO,
  etiquetaMes,
  leerAdjunto,
  mesActual,
  MONEDAS,
  ordenarMeses,
  resumenMes,
} from "../lib/facturacion-model.js";
import { asegurarFacturacionStockin } from "../lib/facturacion-stockin-seed.js";
import { enviarDetalleFacturacionPorEmail, urlPreviewFacturacion } from "../lib/facturacion-api.js";
import { emailCliente } from "../lib/enviar-certificado.js";

const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  plum: "#3A1E66",
  pink: "#F656BF",
  mint: "#2FA98A",
  orange: "#FF6437",
  yellow: "#E0B93A",
  fTitle: "'Roboto Slab', 'Egyptian Slate', Georgia, serif",
  fBody: "'Nunito Sans', system-ui, sans-serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

const field = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${t.line}`,
  borderRadius: 0,
  padding: "8px 0",
  color: t.ink,
  fontSize: 14,
  outline: "none",
};

const labelStyle = {
  fontFamily: t.fMono,
  fontSize: 10,
  letterSpacing: 1,
  color: t.muted,
  display: "block",
  marginBottom: 4,
};

function Label({ children }) {
  return <label style={labelStyle}>{children}</label>;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PagoBadge({ estado }) {
  const map = {
    pendiente: { c: t.orange, t: "Pendiente" },
    pagado: { c: t.mint, t: "Pagado" },
    parcial: { c: t.yellow, t: "Parcial" },
  };
  const s = map[estado] || map.pendiente;
  return (
    <span
      style={{
        fontFamily: t.fMono,
        fontSize: 10,
        padding: "3px 8px",
        borderRadius: 99,
        background: `${s.c}18`,
        border: `1px solid ${s.c}44`,
        color: t.ink,
      }}
    >
      {s.t}
    </span>
  );
}

function AdjuntoSlot({ label, adjunto, onUpload, onRemove, onDownload }) {
  return (
    <div
      style={{
        border: `1px solid ${t.line}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1, color: t.muted }}>{label}</div>
        {adjunto && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={onDownload}
              title="Descargar"
              style={{ background: "transparent", border: "none", color: t.plum, padding: 4 }}
            >
              <Download size={14} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              title="Quitar"
              style={{ background: "transparent", border: "none", color: t.faint, padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      {adjunto ? (
        <div style={{ fontSize: 12, color: t.ink, display: "flex", alignItems: "center", gap: 6 }}>
          <Paperclip size={12} color={t.mint} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adjunto.nombre}</span>
        </div>
      ) : (
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: t.pink,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <Paperclip size={13} /> Adjuntar PDF
          <input
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

function descargarAdjunto(adjunto) {
  if (!adjunto?.base64) return;
  const bytes = base64ToBytes(adjunto.base64);
  descargarPdfBytes(bytes, adjunto.nombre || "documento.pdf");
}

function DetalleHtmlActions({ registro, cliente, onEnviado }) {
  const templateKey = registro?.documentoDetalle?.templateKey;
  const previewUrl = templateKey ? urlPreviewFacturacion(templateKey) : null;
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  if (!templateKey) return null;

  const enviar = async () => {
    const to = emailCliente(cliente);
    if (!to) {
      setError("Completá el email del cliente en la ficha del proyecto.");
      return;
    }
    if (!window.confirm(`¿Enviar detalle ${registro.documentoDetalle.numero || ""} a ${to}?`)) return;
    setEnviando(true);
    setError("");
    try {
      await enviarDetalleFacturacionPorEmail({
        to,
        templateKey,
        cliente: cliente.negocio,
        representante: cliente.representante,
        numeroDoc: registro.documentoDetalle.numero,
        mes: registro.mes,
      });
      onEnviado();
      window.alert(`Detalle enviado a ${to}.`);
    } catch (e) {
      setError(e.message || "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        background: `${t.plum}08`,
        border: `1px solid ${t.plum}22`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 16,
      }}
    >
      <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1, color: t.plum, marginBottom: 10 }}>
        DETALLE HTML (PLANTILLA)
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: t.plum,
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 99,
              border: `1px solid ${t.plum}33`,
              background: "#fff",
            }}
          >
            <ExternalLink size={13} /> Ver detalle
          </a>
        )}
        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 99,
            border: "none",
            background: enviando ? t.faint : t.pink,
            cursor: enviando ? "wait" : "pointer",
          }}
        >
          <Mail size={13} /> {enviando ? "Enviando…" : "Enviar por mail"}
        </button>
      </div>
      {error && (
        <div style={{ fontSize: 12, color: t.orange, marginTop: 10, lineHeight: 1.45 }}>{error}</div>
      )}
    </div>
  );
}

function MesEditor({ registro, cliente, onChange }) {
  const set = (path, value) => {
    onChange((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="PERÍODO (MES)">
          <input style={field} type="month" value={registro.mes} onChange={(e) => set("mes", e.target.value)} />
        </Field>
        <Field label="ETAPA">
          <input style={field} value={registro.etapa} onChange={(e) => set("etapa", e.target.value)} placeholder="Etapa 1 — Facturación en producción" />
        </Field>
        <Field label="SERVICIO DESDE">
          <input style={field} type="date" value={registro.servicioDesde} onChange={(e) => set("servicioDesde", e.target.value)} />
        </Field>
        <Field label="SERVICIO HASTA">
          <input style={field} type="date" value={registro.servicioHasta} onChange={(e) => set("servicioHasta", e.target.value)} />
        </Field>
      </div>

      <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.2, color: t.plum, margin: "8px 0 14px" }}>
        DETALLE DE SERVICIOS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Nº DOCUMENTO">
          <input style={field} value={registro.documentoDetalle.numero} onChange={(e) => set("documentoDetalle.numero", e.target.value)} placeholder="DS-2026-009" />
        </Field>
        <Field label="FECHA EMISIÓN">
          <input style={field} type="date" value={registro.documentoDetalle.fechaEmision} onChange={(e) => set("documentoDetalle.fechaEmision", e.target.value)} />
        </Field>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={!!registro.documentoDetalle.enviadoAlCliente}
          onChange={(e) => set("documentoDetalle.enviadoAlCliente", e.target.checked)}
        />
        Enviado al cliente
      </label>
      {registro.documentoDetalle.enviadoAlCliente && (
        <Field label="FECHA ENVÍO">
          <input style={field} type="date" value={registro.documentoDetalle.fechaEnvio} onChange={(e) => set("documentoDetalle.fechaEnvio", e.target.value)} />
        </Field>
      )}
      <DetalleHtmlActions
        registro={registro}
        cliente={cliente}
        onEnviado={() => {
          onChange((prev) => ({
            ...prev,
            documentoDetalle: {
              ...prev.documentoDetalle,
              enviadoAlCliente: true,
              fechaEnvio: prev.documentoDetalle.fechaEnvio || new Date().toISOString().slice(0, 10),
            },
          }));
        }}
      />
      <AdjuntoSlot
        label="PDF DETALLE DE SERVICIOS"
        adjunto={registro.documentoDetalle.adjunto}
        onUpload={async (file) => set("documentoDetalle.adjunto", await leerAdjunto(file))}
        onRemove={() => set("documentoDetalle.adjunto", null)}
        onDownload={() => descargarAdjunto(registro.documentoDetalle.adjunto)}
      />

      <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.2, color: t.plum, margin: "8px 0 14px" }}>
        IMPORTES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="MONEDA">
          <select style={field} value={registro.importe.moneda} onChange={(e) => set("importe.moneda", e.target.value)}>
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="SUBTOTAL">
          <input style={field} type="number" value={registro.importe.subtotal} onChange={(e) => set("importe.subtotal", e.target.value)} />
        </Field>
        <Field label="IVA">
          <input style={field} type="number" value={registro.importe.iva} onChange={(e) => set("importe.iva", e.target.value)} />
        </Field>
        <Field label="TOTAL">
          <input style={field} type="number" value={registro.importe.total} onChange={(e) => set("importe.total", e.target.value)} />
        </Field>
        <Field label="TIPO CAMBIO BNA">
          <input style={field} type="number" value={registro.importe.tipoCambioBna} onChange={(e) => set("importe.tipoCambioBna", e.target.value)} />
        </Field>
        <Field label="TOTAL ARS">
          <input style={field} type="number" value={registro.importe.totalArs} onChange={(e) => set("importe.totalArs", e.target.value)} />
        </Field>
      </div>

      <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.2, color: t.plum, margin: "8px 0 14px" }}>
        FACTURA FISCAL (CAE)
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
        <input type="checkbox" checked={!!registro.facturaFiscal.emitida} onChange={(e) => set("facturaFiscal.emitida", e.target.checked)} />
        Factura emitida en AFIP
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="TIPO">
          <select style={field} value={registro.facturaFiscal.tipo} onChange={(e) => set("facturaFiscal.tipo", e.target.value)}>
            <option value="">—</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </Field>
        <Field label="PUNTO VENTA">
          <input style={field} type="number" value={registro.facturaFiscal.puntoVenta} onChange={(e) => set("facturaFiscal.puntoVenta", e.target.value)} />
        </Field>
        <Field label="NÚMERO">
          <input style={field} type="number" value={registro.facturaFiscal.numero} onChange={(e) => set("facturaFiscal.numero", e.target.value)} />
        </Field>
        <Field label="CAE">
          <input style={field} value={registro.facturaFiscal.cae} onChange={(e) => set("facturaFiscal.cae", e.target.value)} />
        </Field>
        <Field label="VENC. CAE">
          <input style={field} type="date" value={registro.facturaFiscal.vencimientoCae} onChange={(e) => set("facturaFiscal.vencimientoCae", e.target.value)} />
        </Field>
      </div>
      <AdjuntoSlot
        label="PDF FACTURA CAE"
        adjunto={registro.facturaFiscal.adjunto}
        onUpload={async (file) => set("facturaFiscal.adjunto", await leerAdjunto(file))}
        onRemove={() => set("facturaFiscal.adjunto", null)}
        onDownload={() => descargarAdjunto(registro.facturaFiscal.adjunto)}
      />

      <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.2, color: t.plum, margin: "8px 0 14px" }}>
        PAGO
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="ESTADO">
          <select style={field} value={registro.pago.estado} onChange={(e) => set("pago.estado", e.target.value)}>
            {ESTADOS_PAGO.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="FECHA PAGO">
          <input style={field} type="date" value={registro.pago.fecha} onChange={(e) => set("pago.fecha", e.target.value)} />
        </Field>
        <Field label="MONTO COBRADO">
          <input style={field} type="number" value={registro.pago.montoCobrado} onChange={(e) => set("pago.montoCobrado", e.target.value)} />
        </Field>
      </div>
      <div style={{ marginBottom: 8, fontFamily: t.fMono, fontSize: 10, color: t.muted }}>COMPROBANTES DE PAGO</div>
      {(registro.pago.comprobantes || []).map((c, i) => (
        <AdjuntoSlot
          key={c.id || i}
          label={`COMPROBANTE ${i + 1}`}
          adjunto={c}
          onUpload={async () => {}}
          onRemove={() =>
            onChange((prev) => ({
              ...prev,
              pago: { ...prev.pago, comprobantes: prev.pago.comprobantes.filter((_, j) => j !== i) },
            }))
          }
          onDownload={() => descargarAdjunto(c)}
        />
      ))}
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: t.pink,
          cursor: "pointer",
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        <Plus size={13} /> Agregar comprobante
        <input
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const adj = await leerAdjunto(file);
            onChange((prev) => ({
              ...prev,
              pago: { ...prev.pago, comprobantes: [...(prev.pago.comprobantes || []), adj] },
            }));
            e.target.value = "";
          }}
        />
      </label>

      <Field label="NOTAS">
        <textarea
          style={{ ...field, minHeight: 72, resize: "vertical" }}
          value={registro.notas}
          onChange={(e) => set("notas", e.target.value)}
          placeholder="Observaciones del mes…"
        />
      </Field>
    </div>
  );
}

export default function FacturacionModal({ cliente, onSave, onClose }) {
  const [facturacion, setFacturacion] = useState(() =>
    asegurarFacturacionStockin(cliente, [...(cliente.facturacion || [])])
  );
  const [mesId, setMesId] = useState(null);

  const meses = useMemo(() => ordenarMeses(facturacion), [facturacion]);
  const mesSel = meses.find((m) => m.id === mesId) || null;

  const guardar = () => {
    onSave({ ...cliente, facturacion });
    onClose();
  };

  const agregarMes = () => {
    const existentes = new Set(facturacion.map((m) => m.mes));
    let mes = mesActual();
    while (existentes.has(mes)) {
      const [y, m] = mes.split("-").map(Number);
      const d = new Date(y, m, 1);
      mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    const nuevo = crearMesFacturacion(mes);
    setFacturacion((prev) => [...prev, nuevo]);
    setMesId(nuevo.id);
  };

  const eliminarMes = (id) => {
    if (!window.confirm("¿Eliminar este mes de facturación?")) return;
    setFacturacion((prev) => prev.filter((m) => m.id !== id));
    if (mesId === id) setMesId(null);
  };

  const actualizarMes = (updater) => {
    setFacturacion((prev) =>
      prev.map((m) => {
        if (m.id !== mesId) return m;
        const draft = structuredClone(m);
        const next = typeof updater === "function" ? updater(draft) : updater;
        return next;
      })
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,14,51,0.20)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: mesSel ? 620 : 480,
          maxWidth: "96vw",
          height: "100%",
          background: t.paper,
          borderLeft: `1px solid ${t.line}`,
          padding: "36px 36px",
          overflowY: "auto",
          boxShadow: "-24px 0 60px rgba(26,14,51,0.06)",
          transition: "width 0.2s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            {mesSel && (
              <button
                type="button"
                onClick={() => setMesId(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  color: t.muted,
                  fontSize: 12,
                  marginBottom: 8,
                  padding: 0,
                }}
              >
                <ChevronLeft size={14} /> Volver al listado
              </button>
            )}
            <h2 style={{ fontFamily: t.fTitle, fontSize: 22, fontWeight: 400, margin: 0 }}>
              {mesSel ? etiquetaMes(mesSel.mes) : "Facturación mensual"}
            </h2>
            <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint, marginTop: 6 }}>{cliente.negocio}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.muted }}>
            <X size={20} />
          </button>
        </div>

        {!mesSel ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: t.fMono, fontSize: 10, color: t.muted, letterSpacing: 1 }}>
                {meses.length} MES{meses.length === 1 ? "" : "ES"} REGISTRADOS
              </div>
              <button
                type="button"
                onClick={agregarMes}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: t.pink,
                  color: "#fff",
                  border: "none",
                  borderRadius: 99,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Plus size={13} /> Agregar mes
              </button>
            </div>

            {meses.length === 0 ? (
              <div style={{ padding: "32px 0", color: t.faint, fontFamily: t.fMono, fontSize: 13, lineHeight: 1.6 }}>
                Todavía no hay meses cargados. Agregá uno para registrar detalle, factura CAE y comprobante de pago.
              </div>
            ) : (
              meses.map((m) => {
                const { total, moneda, pago, docs } = resumenMes(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 0",
                      borderTop: `1px solid ${t.line}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setMesId(m.id)}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{etiquetaMes(m.mes)}</div>
                      <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint, marginTop: 4 }}>
                        {total ? `${moneda} ${total}` : "Sin importe"} · {docs} adjunto{docs === 1 ? "" : "s"}
                      </div>
                    </button>
                    <PagoBadge estado={pago} />
                    <button
                      type="button"
                      onClick={() => setMesId(m.id)}
                      style={{
                        background: `${t.plum}0E`,
                        border: `1px solid ${t.plum}22`,
                        borderRadius: 99,
                        color: t.plum,
                        fontSize: 11,
                        padding: "5px 12px",
                        fontWeight: 600,
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarMes(m.id)}
                      style={{ background: "transparent", border: "none", color: t.faint, padding: 4 }}
                      title="Eliminar mes"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <MesEditor registro={mesSel} cliente={cliente} onChange={actualizarMes} />
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 32, paddingTop: 16, borderTop: `1px solid ${t.line}` }}>
          <button
            onClick={guardar}
            style={{
              flex: 1,
              background: t.pink,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "12px",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Guardar facturación
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: t.muted,
              border: `1px solid ${t.line}`,
              borderRadius: 99,
              padding: "12px 20px",
              fontSize: 14,
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function FacturacionBtn({ onClick, count, pendientes }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Facturación mensual"
      style={{
        background: pendientes ? `${t.orange}14` : `${t.plum}0E`,
        border: `1px solid ${pendientes ? t.orange : t.plum}33`,
        borderRadius: 99,
        color: pendientes ? t.orange : t.plum,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      <Receipt size={11} /> {count ? `Fact. (${count})` : "Facturación"}
    </button>
  );
}
