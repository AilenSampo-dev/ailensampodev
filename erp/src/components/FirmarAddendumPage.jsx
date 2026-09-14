import { useEffect, useMemo, useState } from "react";
import { validarNombreEscrito } from "../lib/huella-browser.js";
import { cargarAddendumPublico, confirmarAddendumPublico } from "../lib/addendum-api.js";

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
  .contrato-doc a { color: ${t.pink}; }
  .contrato-doc code { font-family: ${t.fMono}; font-size: 13px; background: rgba(26,14,51,0.06); padding: 2px 6px; border-radius: 4px; }
`;

export default function FirmarAddendumPage({ token }) {
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
        const d = await cargarAddendumPublico(token);
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

  const confirmar = async () => {
    if (!termsAccepted || nameError || !typedName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await confirmarAddendumPublico({ token, typedName: typedName.trim(), termsAccepted });
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
        Cargando addendum…
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
          <h1 style={{ color: t.plum, fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Addendum confirmado</h1>
          <p style={{ color: t.muted, lineHeight: 1.6 }}>
            Gracias. Registramos tu confirmación de <strong>{datos.titulo}</strong>.
          </p>
          {hecho?.fecha && <p style={{ color: t.mint, fontSize: 14, marginTop: 12 }}>{hecho.fecha}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: t.paper, fontFamily: t.fBody, padding: "32px 16px 64px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: t.fMono, fontSize: 22, marginBottom: 8 }}>
            s<span style={{ color: t.pink }}>(a)</span>
          </div>
          <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 2, color: t.muted }}>{datos.negocio.toUpperCase()}</div>
          <h1 style={{ color: t.plum, fontSize: 22, fontWeight: 700, marginTop: 12 }}>{datos.titulo}</h1>
        </div>

        <div style={{ background: `${t.plum}08`, border: `1px solid ${t.plum}22`, borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, color: t.muted, lineHeight: 1.55 }}>
          También podés confirmar <strong>respondiendo al mail</strong> con el que recibiste este enlace. No hace falta el proceso completo de firma del contrato madre.
        </div>

        <style>{docStyles}</style>
        <div
          className="contrato-doc"
          style={{ border: `1px solid ${t.line}`, borderRadius: 12, padding: 28, marginBottom: 28, background: "#fff" }}
          dangerouslySetInnerHTML={{ __html: datos.html }}
        />

        <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 24 }}>
          <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.4, color: t.muted, marginBottom: 8 }}>
            CONFIRMACIÓN DEL INTERLOCUTOR AUTORIZADO
          </div>
          <p style={{ fontSize: 13, color: t.muted, marginBottom: 16, lineHeight: 1.5 }}>
            Escribí tu <strong>nombre completo</strong> como representante de <strong>{datos.negocio}</strong>.
            {datos.representante ? ` Debe coincidir con: ${datos.representante}.` : ""}
          </p>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Nombre y apellido"
            style={{
              width: "100%",
              border: `1px solid ${nameError ? t.pink : t.line}`,
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 15,
              marginBottom: 8,
            }}
          />
          {nameError && <p style={{ color: t.pink, fontSize: 12, marginBottom: 12 }}>{nameError}</p>}
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: t.ink, marginBottom: 20, lineHeight: 1.5 }}>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
            Confirmo haber leído este addendum y estar de acuerdo con sus términos.
          </label>
          {error && <p style={{ color: t.pink, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            onClick={confirmar}
            disabled={!termsAccepted || !!nameError || !typedName.trim() || submitting}
            style={{
              width: "100%",
              background: submitting ? t.faint : t.pink,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Registrando…" : "Confirmar addendum"}
          </button>
        </div>
      </div>
    </div>
  );
}
