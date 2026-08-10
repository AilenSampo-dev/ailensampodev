const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtUsd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n) || 0);

/**
 * Contrato basado en la propuesta comercial s(a) — modelo Stockin Lavanda.
 * Ailén Sampó · Sistemas a medida
 */
export function generarContratoHtml({ cliente, proyecto }) {
  const licencia = Number(cliente.feeMensual) || Number(proyecto.feeMensual) || 1500;
  const licenciaErp = licencia >= 250 ? licencia - 250 : Math.round(licencia * 0.833);
  const licenciaPortal = licencia - licenciaErp;
  const setupReferenciaComercial = 15400;

  const bloqueInversion = `<p><strong>Puesta en marcha:</strong> ${esc(fmtUsd(setupReferenciaComercial))} de referencia comercial — <strong>100% bonificada</strong>. El cliente <strong>no abona puesta en marcha</strong>: la implementación completa queda cubierta en los términos de la propuesta aprobada.</p>
<p><strong>Forma de pago:</strong> el cliente abona <strong>únicamente la licencia mensual</strong> indicada abajo, facturada mes a mes mientras el sistema esté en operación.</p>`;

  const contacto = cliente.contacto || "—";
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const vigencia = new Date(Date.now() + 30 * 86400000).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<h1>Contrato de prestación de servicios</h1>
<p><strong>Sistema de gestión a medida</strong></p>

<p><strong>Fecha:</strong> ${fecha}</p>
<p><strong>Prestador:</strong> Ailén Sampó — s(a) Sistemas a medida · <a href="https://www.ailensampo.com">www.ailensampo.com</a></p>
<p><strong>Cliente:</strong> ${esc(cliente.negocio)}</p>
${cliente.representante?.trim() ? `<p><strong>Representante legal:</strong> ${esc(cliente.representante.trim())}</p>` : ""}
<p><strong>Contacto:</strong> ${esc(contacto)}</p>
<p><strong>Proyecto:</strong> ${esc(proyecto.nombre)} · ${esc(proyecto.tipo)}</p>

<div style="background:#faf7fe;border-left:4px solid #F656BF;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
<p style="margin:0"><strong>Propuesta comercial de referencia:</strong> documento &ldquo;${esc(proyecto.nombre)}&rdquo; emitido por Ailén Sampó (propuesta comercial v1). Su alcance funcional detallado forma parte integrante de este contrato como <strong>Anexo A</strong>. Ante discrepancia entre resúmenes y el Anexo A, prevalece el Anexo A aprobado por el cliente.</p>
</div>

<h2>1. Objeto</h2>
<p>El prestador se obliga a diseñar, construir, poner en marcha y operar un <strong>sistema de gestión a medida</strong> para ${esc(cliente.negocio)}, conforme al alcance funcional, plan de implementación e inversión acordados en la propuesta comercial aprobada y en el presente contrato.</p>
<p>El sistema se construye sobre la operación real del negocio del cliente. No es una plantilla genérica: está pensado para cómo trabaja ${esc(cliente.negocio)} y para el contexto normativo y operativo en el que opera (incluyendo, cuando corresponda, facturación electrónica ARCA, IVA, Ingresos Brutos, Convenio Multilateral y retenciones).</p>

<h2>2. Alcance funcional</h2>
<p>El alcance se organiza en <strong>Fase 1</strong> (alcance principal) y <strong>Fase 2</strong> (capacidades que se incorporan cuando el negocio lo requiera), según detalle del Anexo A. A título de resumen contractual, el sistema incluye:</p>

<h3>Ventas y facturación</h3>
<ul>
<li><p>Pedidos multilínea y multicanal, condiciones comerciales automáticas, remitos.</p></li>
<li><p>Facturación electrónica ARCA (CAE), Notas de Débito y Crédito.</p></li>
<li><p>Control de crédito otorgado, deuda de clientes, percepciones y retenciones IVA/IIBB sufridas.</p></li>
<li><p>Ventas discriminadas por jurisdicción (base Convenio Multilateral).</p></li>
</ul>

<h3>Deudores, compras y proveedores</h3>
<ul>
<li><p>Cuenta corriente por cliente, cobros parciales y totales, resumen de cuenta, antigüedad de deuda (aging), cartera de cheques.</p></li>
<li><p>Órdenes de compra, recepción, factura de compra, cuenta corriente de proveedores, órdenes de pago, retenciones impositivas.</p></li>
<li><p>Subdiarios de IVA Ventas e IVA Compras en formato exportable para el estudio contable.</p></li>
</ul>

<h3>Inventarios y tesorería</h3>
<ul>
<li><p>Stock por producto y por local, traspasos, kits, inventario valorizado, Kardex, punto de pedido.</p></li>
<li><p>Caja por local, cuentas bancarias, cheques, conciliación bancaria y posición de fondos.</p></li>
</ul>

<h3>Canales digitales</h3>
<ul>
<li><p>Shopify y Mercado Libre sincronizados con el mismo stock y precios del sistema (un catálogo, múltiples canales).</p></li>
</ul>

<h3>Portal mayoristas — Fase 2</h3>
<ul>
<li><p>Autogestión B2B: acceso por distribuidor, lista de precios, pedidos online que ingresan al ERP, consulta de cuenta corriente en tiempo real.</p></li>
</ul>

<h3>Transversales</h3>
<ul>
<li><p>Roles y permisos por sucursal, auditoría de operaciones, export por jurisdicción para liquidación IIBB/CM.</p></li>
</ul>

<div style="background:#faf7fe;border-left:4px solid #3A1E66;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
<p style="margin:0"><strong>Criterio de alcance — contabilidad:</strong> el sistema <strong>no incluye un motor contable completo</strong> (asientos, mayor, balances). Entrega subdiarios y exportaciones en formato importable para el estudio contable del cliente. El sistema informa y calcula; <strong>no asesora ni reemplaza al contador</strong> ni emite opinión fiscal, contable o legal.</p>
</div>

<h2>3. Plan de implementación</h2>
<p>La implementación se ejecuta por etapas entregables. Cada etapa se prueba en operación real antes de avanzar. El plan contractual es:</p>
<ol>
<li><p><strong>Facturación en producción</strong> (prioridad): base productiva, HTTPS, backups, CAE, puntos de venta ARCA, circuito pedido → caja → cobro → factura electrónica de punta a punta. Con esta etapa el cliente puede reemplazar al sistema anterior y facturar.</p></li>
<li><p>Registro de percepciones y retenciones sufridas · Subdiarios IVA Ventas.</p></li>
<li><p>Registro fiscal complementario de percepciones y retenciones sufridas.</p></li>
<li><p>Tesorería: cuentas bancarias, cartera de cheques, conciliación, posición de fondos.</p></li>
<li><p>Inventario, cobranzas y export Convenio Multilateral.</p></li>
<li><p>Canales: Shopify productivo y Mercado Libre integrado.</p></li>
<li><p>Portal mayoristas (Fase 2): pedidos online + cuenta corriente B2B.</p></li>
</ol>
<p><strong>Transición sin riesgo:</strong> el sistema anterior no se apaga el mismo día que el nuevo. Ambas facturaciones corren en paralelo una o dos semanas hasta confirmar CAE válidos en ARCA y numeración correcta. El sistema anterior se da de baja solo cuando el nuevo está probado en operación real.</p>

<h2>4. Comunicación y mesa de tickets</h2>
<p>Toda la comunicación operativa entre ${esc(cliente.negocio)} y el prestador — durante la implementación y durante el soporte en producción — se canaliza por una <strong>mesa de tickets</strong> (portal web de soporte). Esto garantiza trazabilidad, priorización y que nada quede suelto en chats o mails sueltos.</p>

<h3>Durante la implementación</h3>
<ul>
<li><p>El cliente designa uno o más <strong>interlocutores autorizados</strong> con capacidad de decidir y validar entregables.</p></li>
<li><p>Cada consulta, pedido de cambio, reporte de error, solicitud de acceso o validación de etapa se registra como <strong>ticket</strong>, con asunto, descripción, prioridad y archivos adjuntos cuando corresponda.</p></li>
<li><p>El avance por etapa (cláusula 3) se documenta en tickets vinculados: entregables, pruebas, observaciones del cliente y cierre de etapa.</p></li>
<li><p>Los bloqueos imputables al cliente (accesos pendientes, datos faltantes, definiciones sin responder) quedan registrados en el ticket para proteger los plazos de ambas partes.</p></li>
<li><p>Reuniones puntuales — presenciales o por videollamada — se acuerdan cuando un ticket lo requiera; lo acordado y los compromisos se dejan asentados en el mismo ticket.</p></li>
</ul>

<h3>Durante la operación y el soporte</h3>
<ul>
<li><p>Una vez el sistema está en producción, la <strong>misma mesa de tickets</strong> concentra incidencias, consultas de uso, pedidos de ayuda y seguimiento de tareas.</p></li>
<li><p><strong>Incluido en la licencia mensual:</strong> corrección de errores del sistema, consultas de operación, monitoreo y respuesta sobre incidentes que afecten el funcionamiento acordado.</p></li>
<li><p><strong>Evoluciones y cambios de alcance</strong> (funcionalidades nuevas, reportes adicionales, integraciones no previstas en el Anexo A) se registran como ticket tipo evolución y se presupuestan por separado antes de ejecutarse.</p></li>
<li><p>El prestador informará al cliente cuando habilite el acceso a la mesa de tickets y las credenciales de los usuarios autorizados.</p></li>
</ul>

<div style="background:#faf7fe;border-left:4px solid #6882EB;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
<p style="margin:0"><strong>Canal oficial:</strong> la mesa de tickets es el medio válido para iniciar y documentar pedidos técnicos y de soporte. Mensajes informales por WhatsApp u otros canales pueden usarse para avisos breves, pero <strong>no reemplazan al ticket</strong> ni generan compromiso de plazo hasta estar registrados en la mesa.</p>
</div>

<h2>5. Inversión y forma de pago</h2>
${bloqueInversion}

<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
<tr style="border-bottom:2px solid #3A1E66">
<th style="text-align:left;padding:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#4D4F54">Componente</th>
<th style="text-align:right;padding:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#4D4F54">Puesta en marcha</th>
<th style="text-align:right;padding:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#4D4F54">Licencia/mes</th>
</tr>
<tr style="border-bottom:1px solid #eee"><td style="padding:8px">Sistema de gestión (ERP + canales)</td><td style="padding:8px;text-align:right;font-family:monospace">Bonificada</td><td style="padding:8px;text-align:right;font-family:monospace">${esc(fmtUsd(licenciaErp))}</td></tr>
<tr style="border-bottom:1px solid #eee"><td style="padding:8px">Portal mayoristas (autogestión B2B) — Fase 2</td><td style="padding:8px;text-align:right;font-family:monospace">Bonificada</td><td style="padding:8px;text-align:right;font-family:monospace">+ ${esc(fmtUsd(licenciaPortal))}</td></tr>
</table>

<p><strong>Único cargo al cliente — licencia mensual total:</strong> ${esc(fmtUsd(licencia))} (dólares estadounidenses, sin impuestos).</p>

<p>Conversión a pesos argentinos al tipo de cambio vendedor BNA del día de cada factura. Sin licencias por usuario: el equipo del cliente puede crecer sin costo adicional por puesto de trabajo.</p>
<p>La licencia mensual es condición para el uso del sistema en producción. <strong>Se abona del 1 al 15 de cada mes.</strong></p>

<h2>6. Licencia, operación y soporte</h2>
<p>El sistema es un <strong>servicio continuo</strong>, no un archivo que se entrega y se abandona. La licencia mensual incluye:</p>
<ul>
<li><p><strong>Uso y operación:</strong> derecho de uso, infraestructura gestionada, backups verificados, monitoreo, uptime y atención vía mesa de tickets (cláusula 4).</p></li>
<li><p><strong>Evolución:</strong> mantenimiento al día con cambios de ARCA y plataformas integradas; mejoras continuas dentro del alcance acordado. Cada canal activo (Shopify, Mercado Libre y los que se agreguen) forma parte del servicio vivo.</p></li>
<li><p><strong>Consumo:</strong> capacidades con IA o mensajería transaccional, cuando se incorporen, se facturan con transparencia según consumo real.</p></li>
</ul>

<h2>7. Datos, propiedad y exportación</h2>
<ul>
<li><p><strong>Los datos del negocio son siempre del cliente.</strong> Clientes, ventas, stock e historial fiscal se pueden exportar en cualquier momento en formato estándar. <strong>Los datos son de la empresa ${esc(cliente.negocio)}.</strong></p></li>
<li><p>El software custom desarrollado para el cliente es de uso del cliente mientras la licencia esté activa. Componentes de terceros, librerías open source y frameworks mantienen sus licencias originales.</p></li>
<li><p>El prestador podrá conservar copias de respaldo y referencias técnicas anonimizadas para mejora de procesos, sin divulgar información confidencial del cliente.</p></li>
</ul>

<h2>8. Fuera de alcance</h2>
<p>Queda expresamente fuera de este contrato, salvo cotización escrita aparte:</p>
<ul>
<li><p>Contenido, copy comercial e identidad gráfica de marca del cliente (logo, paleta). La interfaz del sistema sí está incluida.</p></li>
<li><p>Migración de datos históricos desde sistemas anteriores.</p></li>
<li><p>Cuentas de servicios a nombre del cliente: facturación electrónica ARCA, hosting, Shopify, Mercado Libre y similares. El sistema los opera; la titularidad es del cliente.</p></li>
<li><p>Funcionalidades no detalladas en el Anexo A. Todo desarrollo adicional se presupuesta por separado.</p></li>
</ul>

<h2>9. Obligaciones del cliente</h2>
<ul>
<li><p>Designar un interlocutor con capacidad de decisión y proveer información, accesos y materiales en tiempo razonable.</p></li>
<li><p>Registrar pedidos y consultas técnicas en la mesa de tickets (cláusula 4).</p></li>
<li><p>Revisar entregables parciales sin demoras que afecten el cronograma.</p></li>
<li><p>Abonar la licencia mensual en los plazos acordados.</p></li>
<li><p>Mantener vigentes las credenciales, certificados y cuentas de servicios de terceros necesarios para la operación.</p></li>
</ul>

<h2>10. Confidencialidad</h2>
<p>Ambas partes mantendrán confidencial la información comercial, técnica y de negocio intercambiada durante la relación contractual.</p>

<h2>11. Plazos y vigencia</h2>
<p>Los plazos de cada etapa se coordinan al inicio del proyecto. Demoras imputables al cliente no generan responsabilidad por incumplimiento de plazos del prestador.</p>
<p>Este contrato entra en vigencia desde su aceptación y permanece vigente mientras la licencia esté activa. Cualquiera de las partes puede rescindir con preaviso escrito de 60 días. En caso de rescisión, el cliente abona el trabajo efectivamente realizado y las licencias devengadas hasta la fecha de baja.</p>
<p><strong>Vigencia de la oferta comercial asociada:</strong> ${esc(vigencia)}.</p>

<h2>12. Limitación de responsabilidad</h2>
<p>El prestador no será responsable por daños indirectos, lucro cesante o pérdidas derivadas del uso del sistema fuera del alcance acordado.</p>

<h2>13. Aceptación electrónica</h2>
<p>Al aceptar este contrato mediante el enlace enviado al contacto registrado, marcando la casilla de consentimiento e indicando su <strong>nombre completo como representante legal</strong> de ${esc(cliente.negocio)}, el firmante confirma tener facultades para obligar a la empresa, haber leído la propuesta comercial (Anexo A), comprendido el presente contrato y estar de acuerdo con todos sus términos.</p>
<p>Esa aceptación electrónica constituye manifestación válida de consentimiento entre las partes. Se registrará la fecha, hora, dirección IP, agente de navegador y una <strong>huella digital SHA-256</strong> del texto exacto aceptado, con fines probatorios de qué versión del documento fue consentida.</p>

<p style="margin-top:32px;font-size:13px;color:#4D4F54;border-top:1px solid #eee;padding-top:16px">
s(a) · Ailén Sampó · Sistemas a medida · ${esc(fecha)}
</p>`;
}
