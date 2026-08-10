import { useEffect, useMemo, useState } from "react";
import { validarNombreEscrito } from "../lib/huella-browser.js";
import { cargarContratoPublico, firmarContratoPublico } from "../lib/contrato-api.js";

const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  pink: "#F656BF",
  mint: "#2FA98A",
  plum: "#3A1E66",
  fBody: "'Nunito Sans', system-ui, sans-serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

const docStyles = `
  .contrato-doc { font-family: ${t.fBody}; color: ${t.ink}; }
  .contrato-doc h1 { font-size: 26px; font-weight: 900; margin: 0 0 8px; color: ${t.plum}; }
  .contrato-doc h2 { font-size: 18px; font-weight: 900; margin: 32px 0 12px; color: ${t.plum}; }
  .contrato-doc p { margin: 0 0 14px; line-height: 1.65; font-size: 15px; }
  .contrato-doc ul, .contrato-doc ol { margin: 0 0 14px 20px; }
  .contrato-doc li { margin-bottom: 6px; line-height: 1.55; font-size: 15px; }
  .contrato-doc strong { font-weight: 700; }
`;

export default function FirmarContratoPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);
  const [typedName, setTypedName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hecho, setHecho] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await cargarContratoPublico(token);
        setDatos(d);
        if (d.representante) setTypedName(d.representante);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const nameError = useMemo(() => {
    if (!typedName.trim() || !datos?.representante) return null;
    return validarNombreEscrito(typedName, datos.representante);
  }, [typedName, datos?.representante]);

  const firmar = async () => {
    if (!termsAccepted || nameError || !typedName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await firmarContratoPublico({ token, typedName: typedName.trim(), termsAccepted });
      setHecho(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.fBody, color: t.muted }}>
        Cargando contrato…
      </div>
    );
  }

  if (error && !datos) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.fBody, padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center", color: t.pink }}>{error}</div>
      </div>
    );
  }

  if (datos?.firmado || hecho) {
    return (
      <div style={{ minHeight: "100vh", background: t.paper, fontFamily: t.fBody, padding: "48px 24px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: t.fMono, fontSize: 22, marginBottom: 24 }}>
            s<span style={{ color: t.pink }}>(a)</span>
          </div>
          <h1 style={{ color: t.plum, fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Contrato aceptado</h1>
          <p style={{ color: t.muted, lineHeight: 1.6, marginBottom: 8 }}>
            Gracias. Registramos tu aceptación de <strong>{datos.proyecto}</strong>.
          </p>
          {hecho?.emailEnviado ? (
            <p style={{ color: t.mint, fontSize: 14 }}>Te enviamos el certificado por email.</p>
          ) : hecho?.emailError ? (
            <p style={{ color: t.pink, fontSize: 13 }}>{hecho.emailError}</p>
          ) : (
            <p style={{ color: t.muted, fontSize: 14 }}>La aceptación quedó registrada.</p>
          )}
          {datos.fechaAceptacion && !hecho && (
            <p style={{ color: t.faint, fontSize: 13, marginTop: 12 }}>Aceptado el {datos.fechaAceptacion}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: t.paper, fontFamily: t.fBody, color: t.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        ${docStyles}
      `}</style>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ fontFamily: t.fMono, fontSize: 22, marginBottom: 8 }}>
          s<span style={{ color: t.pink }}>(a)</span>
        </div>
        <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 2, color: t.muted, marginBottom: 24 }}>
          {datos.negocio.toUpperCase()} · {datos.proyecto}
        </div>

        <style>{docStyles}</style>
        <div
          className="contrato-doc"
          style={{ border: `1px solid ${t.line}`, borderRadius: 12, padding: 24, marginBottom: 28, maxHeight: 420, overflowY: "auto" }}
          dangerouslySetInnerHTML={{ __html: datos.html }}
        />

        <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 24 }}>
          <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.4, color: t.muted, marginBottom: 8 }}>
            ACEPTACIÓN DEL REPRESENTANTE LEGAL
          </div>
          <p style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>
            Escribí tu <strong>nombre completo</strong> como representante legal de <strong>{datos.negocio}</strong>.
            {datos.representante ? ` Debe coincidir con: ${datos.representante}.` : ""}
          </p>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Nombre y apellido"
            style={{
              width: "100%",
              border: `2px solid ${nameError ? t.pink : t.plum}`,
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 15,
              marginBottom: 8,
            }}
          />
          {nameError && <div style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{nameError}</div>}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              Leí y acepto los términos de este contrato. Confirmo ser representante legal de {datos.negocio} y tener autoridad para obligar a la empresa.
            </span>
          </label>
          {error && <div style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{error}</div>}
          <button
            onClick={firmar}
            disabled={!termsAccepted || !!nameError || !typedName.trim() || submitting}
            style={{
              width: "100%",
              background: !termsAccepted || nameError ? t.faint : t.mint,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "14px",
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Registrando…" : "Aceptar contrato"}
          </button>
        </div>
      </div>
    </div>
  );
}
