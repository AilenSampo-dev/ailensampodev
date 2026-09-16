import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  pink: "#F656BF",
  orange: "#FF6437",
  fTitle: "'Roboto Slab', 'Egyptian Slate', Georgia, serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

const CONFIRM_WORD = "eliminar";

export default function ConfirmDeleteModal({ title, description, warning, onConfirm, onClose }) {
  const [checked, setChecked] = useState(false);
  const [typed, setTyped] = useState("");

  const ok = checked && typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,14,51,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: "100%",
          background: t.paper,
          borderRadius: 14,
          border: `1px solid ${t.line}`,
          boxShadow: "0 24px 80px rgba(26,14,51,0.18)",
          padding: "28px 28px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={22} color={t.orange} style={{ flexShrink: 0, marginTop: 2 }} />
            <h2 style={{ fontFamily: t.fTitle, fontSize: 20, fontWeight: 400, margin: 0 }}>{title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.muted, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.55, color: t.muted, margin: "0 0 12px" }}>{description}</p>
        {warning && (
          <p style={{ fontSize: 13, lineHeight: 1.5, color: t.orange, margin: "0 0 20px", fontWeight: 600 }}>{warning}</p>
        )}

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, marginBottom: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 3 }} />
          <span>Entiendo que esta acción no se puede deshacer.</span>
        </label>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1, color: t.muted, display: "block", marginBottom: 6 }}>
            ESCRIBÍ «{CONFIRM_WORD}» PARA CONFIRMAR
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            placeholder={CONFIRM_WORD}
            style={{
              width: "100%",
              border: `1px solid ${t.line}`,
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            disabled={!ok}
            onClick={() => ok && onConfirm()}
            style={{
              flex: 1,
              background: ok ? t.orange : t.faint,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: ok ? "pointer" : "not-allowed",
            }}
          >
            Eliminar definitivamente
          </button>
          <button
            type="button"
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
