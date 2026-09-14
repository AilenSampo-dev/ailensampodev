import { useState } from "react";
import { login } from "../lib/erp-api.js";

const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  pink: "#F656BF",
  plum: "#3A1E66",
  fTitle: "'Roboto Slab', 'Egyptian Slate', Georgia, serif",
  fBody: "'Nunito Sans', system-ui, sans-serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

export default function LoginScreen({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await login(password);
      onSuccess(r);
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: t.paper,
        fontFamily: t.fBody,
        color: t.ink,
        padding: 24,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&family=Roboto+Slab:wght@400;500&display=swap');
      `}</style>
      <form
        onSubmit={submit}
        style={{
          width: 380,
          maxWidth: "100%",
          border: `1px solid ${t.line}`,
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 24px 80px rgba(26,14,51,0.08)",
        }}
      >
        <div style={{ fontFamily: t.fMono, fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>
          s<span style={{ color: t.pink }}>(a)</span>
        </div>
        <div style={{ fontFamily: t.fMono, fontSize: 8.5, letterSpacing: 3, color: t.muted, marginBottom: 28 }}>
          ERP · ACCESO PRIVADO
        </div>
        <h1 style={{ fontFamily: t.fTitle, fontSize: 24, fontWeight: 400, margin: "0 0 8px" }}>
          Iniciar sesión
        </h1>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 28, lineHeight: 1.5 }}>
          Panel interno de clientes, proyectos y contratos.
        </p>
        <label
          style={{
            display: "block",
            fontFamily: t.fMono,
            fontSize: 10,
            letterSpacing: 1.2,
            color: t.muted,
            marginBottom: 8,
          }}
        >
          CONTRASEÑA
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          style={{
            width: "100%",
            border: `1px solid ${error ? t.pink : t.line}`,
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 15,
            marginBottom: 8,
            outline: "none",
          }}
        />
        {error && <p style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{error}</p>}
        <button
          type="submit"
          disabled={!password.trim() || loading}
          style={{
            width: "100%",
            marginTop: 12,
            background: !password.trim() || loading ? t.faint : t.pink,
            color: "#fff",
            border: "none",
            borderRadius: 99,
            padding: "14px",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
