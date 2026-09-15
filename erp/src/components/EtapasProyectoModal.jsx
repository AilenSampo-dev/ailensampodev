import { useMemo, useState } from "react";
import { X, ChevronRight, AlertTriangle, RotateCcw } from "lucide-react";
import {
  ETAPAS_PIPELINE,
  asegurarPipeline,
  avanzarEtapa,
  etapaLabel,
  mergePipelineEnProyecto,
  registrarCambioAlcance,
  siguienteEtapaId,
  validarCamposEtapa,
} from "../lib/proyecto-etapas.js";

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
  blue: "#6882EB",
  blueDeep: "#5C64F2",
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

function Label({ children }) {
  return (
    <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.2, color: t.muted, marginBottom: 4 }}>
      {children}
    </div>
  );
}

function Campo({ def, value, onChange }) {
  if (def.type === "textarea") {
    return (
      <textarea
        style={{ ...field, minHeight: 72, resize: "vertical" }}
        value={value || ""}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (def.type === "select") {
    return (
      <select style={field} value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {(def.options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      style={field}
      type={def.type || "text"}
      value={value || ""}
      placeholder={def.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function EtapasProyectoModal({ proyecto, cliente, onSave, onClose, onContrato, onAddendum }) {
  const [pipeline, setPipeline] = useState(() => asegurarPipeline(proyecto, cliente));
  const [selId, setSelId] = useState(pipeline.etapaActualId);
  const [error, setError] = useState(null);

  const etapaSel = ETAPAS_PIPELINE.find((e) => e.id === selId) || ETAPAS_PIPELINE[0];
  const datosSel = pipeline.datos[selId] || {};
  const idxActual = ETAPAS_PIPELINE.findIndex((e) => e.id === pipeline.etapaActualId);

  const estadoEtapa = useMemo(() => {
    return ETAPAS_PIPELINE.map((e, i) => {
      if (e.id === pipeline.etapaActualId) return "actual";
      if (i < idxActual) return "hecha";
      return "pendiente";
    });
  }, [pipeline.etapaActualId, idxActual]);

  const setCampo = (key, value) => {
    setPipeline((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        [selId]: { ...prev.datos[selId], [key]: value },
      },
      actualizadoEn: new Date().toISOString(),
    }));
  };

  const guardar = () => {
    onSave(mergePipelineEnProyecto(proyecto, pipeline));
    onClose();
  };

  const irAEtapa = (id) => {
    setError(null);
    setSelId(id);
  };

  const completarYAvanzar = () => {
    setError(null);
    const next = selId === "cambio_alcance" ? null : selId === pipeline.etapaActualId ? siguienteEtapaId(selId) : null;

    if (selId === pipeline.etapaActualId && selId === "cambio_alcance") {
      const r = registrarCambioAlcance(pipeline);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setPipeline(r.pipeline);
      setSelId("propuesta");
      return;
    }

    if (selId === pipeline.etapaActualId && next) {
      const r = avanzarEtapa(pipeline, next);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setPipeline(r.pipeline);
      setSelId(next);
      return;
    }

    if (selId === pipeline.etapaActualId && !next) {
      const faltantes = validarCamposEtapa(selId, pipeline.datos[selId]);
      if (faltantes.length) {
        setError(`Completá: ${faltantes.join(", ")}`);
        return;
      }
      setPipeline((p) => ({ ...p, actualizadoEn: new Date().toISOString() }));
    }
  };

  const activarCambioAlcance = () => {
    setError(null);
    setSelId("cambio_alcance");
  };

  const faltantesActuales = validarCamposEtapa(selId, datosSel);

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
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 960,
          maxWidth: "100%",
          background: t.paper,
          borderRadius: 16,
          border: `1px solid ${t.line}`,
          boxShadow: "0 24px 80px rgba(26,14,51,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 2, color: t.muted, marginBottom: 6 }}>
              ETAPAS · {cliente.negocio.toUpperCase()}
            </div>
            <h2 style={{ fontFamily: t.fTitle, fontSize: 22, fontWeight: 400, margin: 0 }}>{proyecto.nombre}</h2>
            <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.faint, marginTop: 6 }}>
              Etapa actual: {etapaLabel(pipeline.etapaActualId)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.muted }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: 520 }}>
          <div style={{ borderRight: `1px solid ${t.line}`, padding: "20px 16px 24px" }}>
            {ETAPAS_PIPELINE.map((e, i) => {
              const st = estadoEtapa[i];
              const active = selId === e.id;
              const dot =
                st === "actual" ? t.pink : st === "hecha" ? t.mint : t.faint;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => irAEtapa(e.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "10px 10px",
                    marginBottom: 4,
                    border: "none",
                    borderRadius: 8,
                    background: active ? `${t.pink}10` : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: dot,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    <div style={{ fontFamily: t.fMono, fontSize: 9, color: t.faint }}>{String(e.orden).padStart(2, "0")}</div>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: t.ink, lineHeight: 1.3 }}>{e.titulo}</div>
                  </span>
                </button>
              );
            })}

            {pipeline.etapaActualId === "produccion" && (
              <button
                type="button"
                onClick={activarCambioAlcance}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "10px 12px",
                  border: `1px solid ${t.orange}`,
                  borderRadius: 8,
                  background: `${t.orange}0A`,
                  color: t.orange,
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "left",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <RotateCcw size={13} /> Registrar cambio de alcance
              </button>
            )}
          </div>

          <div style={{ padding: "24px 28px 28px", maxHeight: "68vh", overflowY: "auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: t.fTitle, fontSize: 18, margin: "0 0 8px", color: t.plum }}>{etapaSel.titulo}</h3>
              <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.55, margin: 0 }}>{etapaSel.resumen}</p>
            </div>

            {etapaSel.id === "diagnostico" && datosSel.encaja === "no" && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 14,
                  marginBottom: 16,
                  background: `${t.orange}10`,
                  border: `1px solid ${t.orange}44`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: t.ink,
                }}
              >
                <AlertTriangle size={16} color={t.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                No encaja en el modelo — el proceso se cierra acá. No avances a propuesta.
              </div>
            )}

            {etapaSel.id === "negociacion" && (
              <div style={{ fontSize: 12, color: t.plum, marginBottom: 16, padding: "10px 12px", background: `${t.plum}08`, borderRadius: 8 }}>
                Regla pricing: la <strong>bonificación de implementación</strong> es negociable; el <strong>fee mensual es innegociable</strong>.
                Cambios post-demo van como producción, no como ajuste gratis de la propuesta.
              </div>
            )}

            {etapaSel.id === "firmada" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {onContrato && (
                  <button
                    type="button"
                    onClick={() => onContrato(proyecto.id)}
                    style={{ background: `${t.pink}14`, border: `1px solid ${t.pink}`, borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: t.pink }}
                  >
                    Abrir contrato
                  </button>
                )}
                {onAddendum && (
                  <button
                    type="button"
                    onClick={() => onAddendum(proyecto.id)}
                    style={{ background: `${t.plum}0E`, border: `1px solid ${t.plum}33`, borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: t.plum }}
                  >
                    Addendum alcance
                  </button>
                )}
              </div>
            )}

            {etapaSel.campos.map((c) => (
              <div key={c.key} style={{ marginBottom: 18 }}>
                <Label>
                  {c.label}
                  {c.required ? " *" : ""}
                </Label>
                <Campo def={c} value={datosSel[c.key]} onChange={(v) => setCampo(c.key, v)} />
              </div>
            ))}

            {error && (
              <p style={{ color: t.pink, fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}

            {faltantesActuales.length > 0 && selId === pipeline.etapaActualId && (
              <p style={{ color: t.orange, fontSize: 11, fontFamily: t.fMono, marginBottom: 12 }}>
                Pendiente: {faltantesActuales.join(" · ")}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              {selId === pipeline.etapaActualId && selId !== "cambio_alcance" && siguienteEtapaId(selId) && (
                <button
                  type="button"
                  onClick={completarYAvanzar}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: t.pink,
                    color: "#fff",
                    border: "none",
                    borderRadius: 99,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Completar y avanzar <ChevronRight size={14} />
                </button>
              )}
              {selId === "cambio_alcance" && (
                <button
                  type="button"
                  onClick={completarYAvanzar}
                  style={{
                    background: t.orange,
                    color: "#fff",
                    border: "none",
                    borderRadius: 99,
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Registrar y volver a Propuesta
                </button>
              )}
              <button
                type="button"
                onClick={guardar}
                style={{
                  background: "transparent",
                  color: t.plum,
                  border: `1px solid ${t.plum}44`,
                  borderRadius: 99,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Guardar etapas
              </button>
            </div>

            {pipeline.historial?.length > 0 && (
              <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${t.line}` }}>
                <Label>HISTORIAL DE TRANSICIONES</Label>
                <div style={{ fontFamily: t.fMono, fontSize: 10, color: t.faint, marginTop: 8, lineHeight: 1.7 }}>
                  {[...pipeline.historial].reverse().slice(0, 8).map((h, i) => (
                    <div key={i}>
                      {new Date(h.en).toLocaleDateString("es-AR")} · {etapaLabel(h.desde)} → {etapaLabel(h.hasta)}
                      {h.nota ? ` · ${h.nota.slice(0, 60)}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ETAPA_CORTA = {
  lead: "Lead",
  diagnostico: "Diagnóstico",
  propuesta: "Propuesta",
  enviada: "Enviada",
  negociacion: "Negociación",
  firmada: "Firmada",
  kickoff: "Kickoff",
  produccion: "Producción",
  cambio_alcance: "Cambio",
};

export function EtapasBtn({ onClick, pipeline, etapaActualId }) {
  const id = etapaActualId || pipeline?.etapaActualId;
  const label = id ? ETAPA_CORTA[id] || "Etapas" : "Etapas";
  return (
    <button
      type="button"
      onClick={onClick}
      title={id ? etapaLabel(id) : "Gestionar etapas"}
      style={{
        background: `${t.blue}12`,
        border: `1px solid ${t.blue}44`,
        borderRadius: 99,
        color: t.blueDeep || t.blue,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        whiteSpace: "nowrap",
        maxWidth: 110,
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {label || "Etapas"}
    </button>
  );
}
