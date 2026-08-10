import { useMemo, useState, useEffect } from "react";
import { X, FileText, Download, RotateCcw, Mail, Paperclip } from "lucide-react";
import { generarContratoHtml } from "../lib/contrato-template.js";
import {
  calcularHuella,
  validarNombreEscrito,
  obtenerIpCliente,
  TEXTO_AYUDA_HUELLA,
  formatearIpParaMostrar,
} from "../lib/huella-browser.js";
import { generarPdfCertificado, nombreArchivoPdf } from "../lib/contrato-pdf.js";
import { bytesToBase64, base64ToBytes, descargarPdfBytes, normalizarRegistroAceptacion } from "../lib/pdf-utils.js";
import { emailCliente, enviarCertificadoPorEmail } from "../lib/enviar-certificado.js";
import { enviarContratoAlCliente } from "../lib/contrato-api.js";

const t = {
  paper: "#FFFFFF",
  ink: "#1A0E33",
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  pink: "#F656BF",
  mint: "#2FA98A",
  plum: "#3A1E66",
  fTitle: "'Roboto Slab', 'Egyptian Slate', Georgia, serif",
  fBody: "'Nunito Sans', system-ui, sans-serif",
  fMono: "'DM Mono', ui-monospace, monospace",
};

const docStyles = `
  .contrato-doc { font-family: ${t.fBody}; color: ${t.ink}; }
  .contrato-doc h1 { font-family: ${t.fBody}; font-size: 26px; font-weight: 900; margin: 0 0 8px; color: ${t.plum}; letter-spacing: -.02em; line-height: 1.15; }
  .contrato-doc h2 { font-family: ${t.fBody}; font-size: 18px; font-weight: 900; margin: 32px 0 12px; color: ${t.plum}; letter-spacing: -.01em; }
  .contrato-doc h3 { font-family: ${t.fBody}; font-size: 15px; font-weight: 700; margin: 20px 0 8px; color: ${t.plum}; }
  .contrato-doc p { margin: 0 0 14px; line-height: 1.65; font-size: 15px; }
  .contrato-doc ul, .contrato-doc ol { margin: 0 0 14px 20px; }
  .contrato-doc li { margin-bottom: 6px; line-height: 1.55; font-size: 15px; }
  .contrato-doc li p { margin: 0; }
  .contrato-doc strong { font-weight: 700; }
  .contrato-doc a { color: ${t.pink}; }
  .contrato-doc table { font-family: ${t.fBody}; }
  .contrato-doc table th { font-family: ${t.fMono}; }
`;

function Label({ children }) {
  return (
    <div style={{ fontFamily: t.fMono, fontSize: 10, letterSpacing: 1.4, color: t.muted, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Certificado({ datos }) {
  const ip = formatearIpParaMostrar(datos.ipAddress);
  return (
    <div style={{ border: `1px solid ${t.mint}44`, background: `${t.mint}0A`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: t.fMono, fontSize: 11, color: t.mint, fontWeight: 600, marginBottom: 16 }}>
        CERTIFICADO DE ACEPTACIÓN
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12 }}>
        <div>
          <Label>NOMBRE DECLARADO</Label>
          <div>{datos.typedName}</div>
        </div>
        <div>
          <Label>EMAIL</Label>
          <div>{datos.clientEmail}</div>
        </div>
        <div>
          <Label>IP</Label>
          <div>{ip.value}</div>
          {ip.note && <div style={{ fontSize: 10, color: t.faint, marginTop: 4 }}>{ip.note}</div>}
        </div>
        <div>
          <Label>FECHA</Label>
          <div>{datos.fecha}</div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>HUELLA SHA-256</Label>
          <div style={{ fontFamily: t.fMono, fontSize: 10, wordBreak: "break-all" }}>{datos.contentHash}</div>
          <div style={{ fontSize: 10, color: t.faint, marginTop: 6 }}>{TEXTO_AYUDA_HUELLA}</div>
        </div>
      </div>
    </div>
  );
}

export default function ContratoModal({ proyecto, cliente, onSave, onClose }) {
  const htmlInicial =
    proyecto.contratoHtml?.trim() ||
    generarContratoHtml({ cliente, proyecto });

  const [tab, setTab] = useState(proyecto.contratoEstado === "aceptado" ? "certificado" : "editar");
  const [html, setHtml] = useState(htmlInicial);
  const [vistaCliente, setVistaCliente] = useState(true);
  const [typedName, setTypedName] = useState(cliente.representante?.trim() || "");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [aceptacion, setAceptacion] = useState(proyecto.contratoAceptacion || null);
  const [pdfError, setPdfError] = useState(null);
  const [enviandoContrato, setEnviandoContrato] = useState(false);
  const [envioContratoMsg, setEnvioContratoMsg] = useState(null);
  const [enviandoMail, setEnviandoMail] = useState(false);

  const mailCliente = emailCliente(cliente);

  useEffect(() => {
    if (tab === "aceptar") setVistaCliente(true);
  }, [tab]);

  const nombreReferencia = cliente.representante?.trim() || "";
  const nameError = useMemo(() => {
    if (!typedName.trim()) return null;
    if (nombreReferencia) return validarNombreEscrito(typedName, nombreReferencia);
    if (typedName.trim().length < 3) return "Escribí tu nombre completo.";
    return null;
  }, [typedName, nombreReferencia]);

  const firmado = proyecto.contratoEstado === "aceptado" && !!proyecto.contratoAceptacion;

  const guardarBorrador = () => {
    onSave({
      ...proyecto,
      contratoHtml: html,
      contratoEstado: firmado ? "aceptado" : "borrador",
      contratoAceptacion: proyecto.contratoAceptacion,
    });
  };

  const regenerarPlantilla = () => {
    if (firmado) {
      alert("Este contrato ya fue aceptado. La huella y el texto firmado quedan guardados en Certificado; no se puede reemplazar la plantilla sin perder esa referencia.");
      return;
    }
    if (!confirm("¿Reemplazar el texto con la plantilla base? Se perderán las ediciones manuales.")) return;
    const nuevo = generarContratoHtml({ cliente, proyecto });
    setHtml(nuevo);
  };

  const generarPdfBytes = async (reg) => {
    const registro = normalizarRegistroAceptacion(reg);
    return generarPdfCertificado(registro, {
      etiquetaCategoria: "Tipo de proyecto",
      etiquetaValor: "Inversion mensual",
    });
  };

  const htmlAceptado = aceptacion?.contratoHtmlAceptado || proyecto.contratoAceptacion?.contratoHtmlAceptado;

  const descargarPdf = async (cert) => {
    setPdfError(null);
    try {
      let bytes;
      if (cert.registro) {
        bytes = await generarPdfBytes(cert.registro);
      } else if (cert.pdfBase64) {
        bytes = base64ToBytes(cert.pdfBase64);
      } else {
        throw new Error("No hay certificado para descargar.");
      }
      descargarPdfBytes(bytes, cert.pdfNombre || nombreArchivoPdf(proyecto.nombre, "contrato-aceptado"));
    } catch (e) {
      setPdfError(e.message || "Error al generar el PDF.");
    }
  };

  const enviarLinkCliente = async () => {
    if (!mailCliente) {
      setEnvioContratoMsg({ error: "Completá el email del cliente en su ficha." });
      return;
    }
    if (firmado) return;
    setEnviandoContrato(true);
    setEnvioContratoMsg(null);
    try {
      const r = await enviarContratoAlCliente(proyecto.id, html);
      onSave({
        ...proyecto,
        contratoHtml: html,
        contratoEstado: "enviado",
        contratoFirmaToken: r.token,
        contratoEnviadoAt: new Date().toISOString(),
        contratoEnviadoA: r.to,
        contratoFirmaUrl: r.url,
      });
      setEnvioContratoMsg({ ok: true, to: r.to, url: r.url });
    } catch (e) {
      setEnvioContratoMsg({ error: e.message });
    } finally {
      setEnviandoContrato(false);
    }
  };

  const reenviarEmail = async () => {
    if (!mailCliente || !aceptacion?.registro) return;
    setEnviandoMail(true);
    setPdfError(null);
    try {
      const pdfBytes = await generarPdfBytes(aceptacion.registro);
      const pdfBase64 = bytesToBase64(pdfBytes);
      const r = await enviarCertificadoPorEmail({
        to: mailCliente,
        pdfBase64,
        filename: aceptacion.pdfNombre || nombreArchivoPdf(proyecto.nombre, "contrato-aceptado"),
        cliente: cliente.negocio,
        proyecto: proyecto.nombre,
        typedName: aceptacion.typedName,
      });
      const cert = {
        ...aceptacion,
        pdfBase64,
        emailEnviadoAt: new Date().toISOString(),
        emailEnviadoA: r.to,
      };
      setAceptacion(cert);
      onSave({ ...proyecto, contratoAceptacion: cert, contratoEstado: "aceptado", contratoHtml: html });
    } catch (e) {
      setPdfError(e.message);
    } finally {
      setEnviandoMail(false);
    }
  };

  const aceptarContrato = async () => {
    if (!termsAccepted || nameError || !typedName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const contentHash = await calcularHuella(html);
      const ipAddress = (await obtenerIpCliente()) || "127.0.0.1";
      const acceptedAt = new Date();
      const email = mailCliente;
      const registro = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        subjectId: proyecto.id,
        clientEmail: email || "—",
        typedName: typedName.trim(),
        termsAccepted: true,
        ipAddress,
        userAgent: navigator.userAgent.slice(0, 512),
        contentHash,
        documentHtml: html,
        acceptedAt,
        subject: {
          title: proyecto.nombre,
          category: proyecto.tipo,
          value: Number(cliente.feeMensual) || 1500,
          valueCurrency: "USD",
        },
        client: {
          name: typedName.trim(),
          email: email || "—",
          company: cliente.negocio,
        },
      };

      const pdfNombre = nombreArchivoPdf(proyecto.nombre, "contrato-aceptado");
      let pdfBase64 = null;
      let pdfErrorMsg = null;

      try {
        const pdfBytes = await generarPdfBytes(registro);
        pdfBase64 = bytesToBase64(pdfBytes);
      } catch (e) {
        pdfErrorMsg = e.message || "No se pudo generar el PDF.";
      }

      let emailEnviadoAt = null;
      let emailEnviadoA = null;
      let emailError = null;

      if (pdfBase64 && email) {
        try {
          const r = await enviarCertificadoPorEmail({
            to: email,
            pdfBase64,
            filename: pdfNombre,
            cliente: cliente.negocio,
            proyecto: proyecto.nombre,
            typedName: typedName.trim(),
          });
          emailEnviadoAt = new Date().toISOString();
          emailEnviadoA = r.to;
        } catch (e) {
          emailError = e.message;
        }
      } else if (!email) {
        emailError = "Completá el email del cliente en su ficha para enviar el certificado.";
      } else if (pdfErrorMsg) {
        emailError = pdfErrorMsg;
      }

      const cert = {
        typedName: registro.typedName,
        clientEmail: registro.clientEmail,
        ipAddress: registro.ipAddress,
        contentHash: registro.contentHash,
        userAgent: registro.userAgent,
        contratoHtmlAceptado: html,
        fecha: acceptedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "medium" }),
        registro: { ...registro, documentHtml: undefined, acceptedAt: acceptedAt.toISOString() },
        pdfBase64,
        pdfNombre: pdfBase64 ? pdfNombre : null,
        pdfError: pdfErrorMsg,
        emailEnviadoAt,
        emailEnviadoA,
        emailError,
      };

      setAceptacion(cert);
      onSave({
        ...proyecto,
        contratoHtml: html,
        contratoEstado: "aceptado",
        contratoAceptacion: cert,
      });
      setTab("certificado");
    } catch (e) {
      setError(e.message || "No se pudo registrar la aceptación. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "editar", label: "Redactar" },
    { id: "preview", label: "Vista previa" },
    { id: "aceptar", label: "Aceptación" },
    ...(aceptacion ? [{ id: "certificado", label: "Certificado" }] : []),
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
              CONTRATO · {cliente.negocio.toUpperCase()}
            </div>
            <h2 style={{ fontFamily: t.fTitle, fontSize: 24, fontWeight: 400, margin: 0 }}>{proyecto.nombre}</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.muted, padding: 4 }}>
            <X size={22} />
          </button>
        </div>

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
                <Label>TEXTO DEL CONTRATO (HTML)</Label>
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
                }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={guardarBorrador}
                  style={{ flex: 1, background: t.pink, color: "#fff", border: "none", borderRadius: 99, padding: "12px", fontSize: 14, fontWeight: 700 }}
                >
                  Guardar borrador
                </button>
              </div>
            </>
          )}

          {tab === "preview" && (
            <>
              <style>{docStyles}</style>
              <div className="contrato-doc" dangerouslySetInnerHTML={{ __html: html }} />
            </>
          )}

          {tab === "aceptar" && !firmado && (
            <div style={{ marginBottom: 24, padding: 20, background: `${t.plum}08`, borderRadius: 12, border: `1px solid ${t.plum}22` }}>
              <Label>ENVIAR AL CLIENTE</Label>
              <p style={{ fontSize: 13, color: t.muted, margin: "10px 0 16px", lineHeight: 1.5 }}>
                Se envía un <strong>enlace único</strong> al email del cliente. Él lee el contrato, firma, recibe el certificado por email y el ERP se actualiza automáticamente.
              </p>
              {envioContratoMsg?.ok && (
                <p style={{ fontSize: 12, color: t.mint, marginBottom: 12 }}>
                  Enviado a {envioContratoMsg.to}
                  {proyecto.contratoEnviadoAt && !envioContratoMsg.url ? ` · ${new Date(proyecto.contratoEnviadoAt).toLocaleString("es-AR")}` : ""}
                </p>
              )}
              {proyecto.contratoEnviadoAt && !envioContratoMsg?.ok && (
                <p style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>
                  Último envío: {proyecto.contratoEnviadoA} · {new Date(proyecto.contratoEnviadoAt).toLocaleString("es-AR")}
                </p>
              )}
              {envioContratoMsg?.error && <p style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{envioContratoMsg.error}</p>}
              <button
                onClick={enviarLinkCliente}
                disabled={!mailCliente || enviandoContrato}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  background: !mailCliente || enviandoContrato ? t.faint : t.pink,
                  color: "#fff",
                  border: "none",
                  borderRadius: 99,
                  padding: "14px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: enviandoContrato ? "wait" : "pointer",
                }}
              >
                <Mail size={16} />
                {enviandoContrato ? "Enviando…" : proyecto.contratoEnviadoAt ? "Reenviar enlace al cliente" : "Enviar contrato al cliente"}
              </button>
              {(envioContratoMsg?.url || proyecto.contratoFirmaUrl) && (
                <p style={{ fontSize: 11, color: t.faint, marginTop: 12, wordBreak: "break-all" }}>
                  Enlace: {envioContratoMsg?.url || proyecto.contratoFirmaUrl}
                </p>
              )}
            </div>
          )}

          {tab === "aceptar" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setVistaCliente(!vistaCliente)}
                  style={{
                    background: vistaCliente ? `${t.pink}18` : "transparent",
                    border: `1px solid ${vistaCliente ? t.pink : t.line}`,
                    borderRadius: 99,
                    color: vistaCliente ? t.pink : t.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                  }}
                >
                  {vistaCliente ? "Vista cliente activa" : "Simular vista del cliente"}
                </button>
              </div>

              {vistaCliente && (
                <>
                  <style>{docStyles}</style>
                  <div
                    className="contrato-doc"
                    style={{ border: `1px solid ${t.line}`, borderRadius: 12, padding: 24, marginBottom: 24, maxHeight: 280, overflowY: "auto" }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                  <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 24 }}>
                    <Label>ACEPTACIÓN DEL REPRESENTANTE LEGAL</Label>
                    <p style={{ fontSize: 13, color: t.muted, margin: "8px 0 12px" }}>
                      Escribí tu <strong>nombre completo</strong> como representante legal de <strong>{cliente.negocio}</strong>.
                      {nombreReferencia ? ` Debe coincidir con: ${nombreReferencia}.` : ""}
                    </p>
                    <Label>FIRMA ELECTRÓNICA (ESCRIBÍ TU NOMBRE AQUÍ)</Label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Nombre y apellido del representante legal"
                      autoComplete="name"
                      aria-label="Nombre completo del representante legal"
                      style={{
                        width: "100%",
                        border: `2px solid ${nameError ? t.pink : t.plum}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 15,
                        marginBottom: 8,
                        outline: "none",
                        background: "#fff",
                        color: t.ink,
                        boxShadow: "inset 0 1px 2px rgba(26,14,51,0.06)",
                      }}
                    />
                    {nameError && <div style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{nameError}</div>}
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
                      <span>Leí y acepto los términos de este contrato. Confirmo ser representante legal de {cliente.negocio} y tener autoridad para obligar a la empresa.</span>
                    </label>
                    {error && <div style={{ fontSize: 12, color: t.pink, marginBottom: 12 }}>{error}</div>}
                    <button
                      onClick={aceptarContrato}
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
                </>
              )}

              {!vistaCliente && (
                <div style={{ textAlign: "center", padding: "40px 0", color: t.faint, fontFamily: t.fMono, fontSize: 13 }}>
                  <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p>Activá la vista del cliente para simular la firma electrónica con huella digital.</p>
                  <p style={{ marginTop: 8, fontSize: 11 }}>En producción, el cliente recibirá un enlace único por email.</p>
                </div>
              )}
            </>
          )}

          {tab === "certificado" && aceptacion && (
            <>
              <Certificado datos={aceptacion} />
              {htmlAceptado && (
                <p style={{ fontSize: 12, color: t.muted, marginTop: 12, lineHeight: 1.5 }}>
                  El texto exacto firmado queda guardado en el ERP junto con la huella. Podés seguir editando el contrato en Redactar; el certificado siempre refleja la versión aceptada el {aceptacion.fecha}.
                </p>
              )}
              {aceptacion.pdfNombre && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 13, color: t.muted }}>
                  <Paperclip size={14} />
                  <span>Adjunto en ERP: <strong style={{ color: t.ink }}>{aceptacion.pdfNombre}</strong></span>
                </div>
              )}
              {aceptacion.emailEnviadoAt ? (
                <p style={{ fontSize: 12, color: t.mint, marginTop: 10 }}>
                  Enviado a {aceptacion.emailEnviadoA} · {new Date(aceptacion.emailEnviadoAt).toLocaleString("es-AR")}
                </p>
              ) : aceptacion.emailError ? (
                <p style={{ fontSize: 12, color: t.pink, marginTop: 10 }}>{aceptacion.emailError}</p>
              ) : null}
              {pdfError && <p style={{ fontSize: 12, color: t.pink, marginTop: 10 }}>{pdfError}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => descargarPdf(aceptacion)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: t.plum,
                    color: "#fff",
                    border: "none",
                    borderRadius: 99,
                    padding: "14px",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <Download size={16} /> Descargar PDF
                </button>
                {mailCliente && (
                  <button
                    onClick={reenviarEmail}
                    disabled={enviandoMail || !aceptacion.pdfBase64}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: t.pink,
                      color: "#fff",
                      border: "none",
                      borderRadius: 99,
                      padding: "14px",
                      fontSize: 14,
                      fontWeight: 700,
                      opacity: enviandoMail ? 0.7 : 1,
                    }}
                  >
                    <Mail size={16} /> {enviandoMail ? "Enviando…" : "Reenviar al cliente"}
                  </button>
                )}
              </div>
              {!mailCliente && (
                <p style={{ fontSize: 11, color: t.faint, marginTop: 10 }}>Agregá el email del cliente en su ficha para enviar el certificado.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
