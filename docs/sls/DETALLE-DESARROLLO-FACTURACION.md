# Detalle de desarrollo — Stockin Lavanda ERP

*Documento para facturación / entrega de servicios de software.*  
*Período cubierto: **30 jun 2026 → 14 sep 2026** (489 commits en repositorio).*  
*Última actualización: 14 sep 2026*

**Relacionados:** [ESTADO-MODULOS.md](./ESTADO-MODULOS.md) · [PLAN-TRABAJO.md](./PLAN-TRABAJO.md) · [BITACORA.md](./BITACORA.md) · [ELIXIO-COINS.md](./ELIXIO-COINS.md)

---

## Resumen ejecutivo

Desarrollo de un **ERP a medida** para Stockin Lavanda: monolito Node.js + Express con base SQLite (desarrollo local) y PostgreSQL (staging/prod), frontend React + TypeScript servido en puerto 3000, desplegado en VPS con HTTPS, backup off-site y integración parcial con Shopify y facturación electrónica ARCA vía Sistemas 360.

El sistema cubre la operación diaria de **~15 usuarios**, **5 locales + depósito central (`DEP1842`)**, **~2.000 SKU**, **~4.000 facturas/mes** (objetivo operativo), con datos reales cargados en producción (1.696 artículos, 2.722 clientes, ago 2026).

Además del ERP interno, se desarrolló el programa de fidelización **Elixio Coins** con portal cliente en `elixio.com.ar`.

---

## Concepto general para factura (encabezado)

**Desarrollo de software a medida — ERP Stockin Lavanda + programa Elixio Coins**  
Análisis, diseño, implementación, migración a React, despliegue en VPS (staging y producción), integraciones (Shopify, ARCA/S360), documentación técnica y contenidos legales del portal de clientes. Período jun–sep 2026.

---

## Detalle por módulos

### 1. Plataforma base y arquitectura

- Monolito Node.js + Express con API REST y servicio de frontend estático.
- Base de datos SQLite en desarrollo local; PostgreSQL en staging/prod vía `DATABASE_URL`.
- Capa de acceso dual: `better-sqlite3` (local) + Knex migrations (PG en deploy).
- Scripts de seed, importación masiva y utilidades operativas en `backend/scripts/`.
- Estructura modular: rutas API, librerías de negocio, migraciones versionadas.
- Documentación de stack, reglas de desarrollo, comandos VPS y checklist de deploy.

### 2. Migración frontend — React + TypeScript

- Cutover completo de UI vanilla (`frontend/`) a **React + Vite + TypeScript** (`frontend-react/`).
- Layout con sidebar, autenticación protegida, toasts, modales y componentes reutilizables.
- Paridad funcional de todas las pantallas operativas del ERP.
- Build de producción (`npm run build:react`) servido vía `FRONTEND_DIR`.
- Iconografía Tabler en menú lateral; UX iterada en pedidos, caja y artículos.

**Pantallas React implementadas:** Login, Inicio, Dashboard, Clientes, Artículos, Precios, Promociones, Pedidos, Sucursales y cajas, Reportes, Facturación, Condiciones comerciales, Usuarios, Permisos, Auditoría, Compras, Personal, Integraciones, Inventario (PWA), Listas público, Elixio Coins (gestión + portal).

### 3. Artículos, catálogo y stock

- ABM de productos con búsqueda por SKU, nombre, keywords y código interno (`CoArticulo`).
- Import masivo desde CSV/Excel (~1.877 filas de catálogo).
- Stock por local (depósito + 5 sucursales) con movimientos trazables.
- Descuento de stock al crear pedido (movimiento `venta`).
- Ajuste manual de stock en depósito con push automático a Shopify si artículo vinculado.
- **Traspasos multi-artículo** entre locales: envío, recepción con diferencias, PDF remito.
- **Mermas** con motivo (mercadería dañada).
- Alertas de stock bajo en dashboard y badge en artículos.
- Campo **marca** en artículos; filtros y datos masivos.
- **Vencimientos** múltiples por producto, informe «A vencer», lógica FEFO en ventas.
- **Estado de abastecimiento** por artículo.
- **Vínculos de stock unificado** entre hasta 3 presentaciones del mismo producto.
- Historia de cargas de inventario en ERP.

### 4. PWA Inventario (mobile)

- Aplicación instalable en celular (`/inventario`) con layout mobile sin sidebar.
- Búsqueda por nombre, SKU, marca; escáner de código de barras.
- Modos: inventario físico, recepción rápida (+1 / +N), ajuste absoluto.
- Sesión local con delta por producto; permiso `ajustar_stock`.
- Pestaña **Historia** con búsqueda por local.
- Redirect post-login directo a inventario cuando se abre como PWA.

### 5. Precios y listas

- Listas LP1, LP2, LP4, LP4P, LP5 con coeficientes sobre costo.
- Precio fijo por artículo y lista (`precios_articulo`).
- Import CSV de precios; recálculo automático al importar/editar costo.
- Pantalla **Precios y listas** con tabla dinámica por lista.
- **Aumento masivo de costo** con incluir/excluir SKU.
- Edición de costos en lista con permisos de inactivar masivo.
- **Portal público de listas** (`/p/{token}`): link permanente por LP, buscador, filtro marca, descarga Excel, `noindex`.
- Host dedicado `listas.stockinlavanda.com.ar` (prod).

### 6. Promociones, kits y condiciones comerciales

- Motor de **condiciones comerciales** con preview en pedido (`condicionesMotor.js`).
- ABM **Condiciones** con segmentos/tipos de cliente configurables.
- Descuentos por marca, cuotas, 3+1 profesional (parcial), +5% pedido > $400k.
- Flag `bloquea_canje_elixio` para incompatibilidad con canje de Coins.
- **Kits promocionales**: armado, métricas de costo/margen, sync masivo de desfasados.
- Integración kits ↔ Shopify (import/revisión documentada).
- Contexto de precio en pedidos según lista y condiciones aplicadas.

### 7. Clientes

- ABM completo con código automático (`CLI-0001`, …).
- **Anti-duplicados** por CUIT/CUIL/DNI normalizado.
- **Consulta AFIP** (padrón Sistemas 360) desde formulario de alta/edición.
- **Cuenta corriente** por cliente: pedidos, saldo, pagos, historial.
- Import masivo de clientes (2.722 en prod).
- Búsqueda por documento al armar pedido.
- Match Shopify por documento en checkout (código listo).
- Tarjeta **Elixio Coins** en ficha cliente (saldo, número participante, movimientos).
- Provincia obligatoria en alta.

### 8. Pedidos y ventas

- Alta de pedidos multi-línea con buscador de productos (F2, debounce, Enter).
- Canales: mostrador, WhatsApp, Mercado Libre, Shopify.
- Cobro contado al crear (efectivo, tarjeta, transferencia, cheque, QR/MP).
- **Cuenta corriente** sin cobro al crear; tab **CC por cobrar** global.
- Edición de pedidos pendientes (actualiza stock y cobro).
- Notas, descuento/recargo por porcentaje o importe.
- Check **IVA 21%** opcional (LP4/LP4P/LP5) — sin tilde no factura.
- Preview de condiciones comerciales y reglas aplicadas.
- Preview de **Elixio Coins** antes del cobro.
- **Canje de Coins** en pedido: validación código `ELX-…`, vouchers pendientes, línea regalo.
- Facturación desde detalle de pedido.
- Historial de pedido con forma de pago y trazabilidad de cobro en caja.
- Estados secundarios en desplegable «Más acciones».
- **Pedidos internos** sucursal → depósito: cola, borradores, selector múltiple, PDF, edición, historial, aviso WhatsApp, despacho sin stock.
- **Reposición por sucursal**: tab Pendientes, tab Sucursales, sugerencia semanal.
- Recepción con modificaciones y stock por local.
- Unificación flujos cancelar/devolver pedido.
- Modal detalle ampliado (UX sep 2026).

### 9. Caja, arqueo y cobranzas

- Caja por sucursal con sesión diaria única (reapertura auditada).
- KPIs separados: ventas comerciales / contado caja / cobranzas CC.
- Arqueo del día por fecha de **cobro** (no emisión).
- Cobro contado atómico con pedido (rollback si falla cobro).
- **Cobrar CC** parcial o total desde caja; lista de deudores bajo demanda.
- Ingresos y egresos manuales con **conceptos predefinidos**.
- Forma de pago en ingreso/egreso.
- Control/tildar movimientos con barra de progreso e impresión de arqueo.
- Cierre con diferencia de efectivo validada.
- Anulación trazable de cobros (devuelve stock, reversa sin borrar original).
- Anular ingresos/egresos (permiso cajero).
- Anular pagos con permiso configurable.
- Vendedores pueden cobrar CC en su sucursal (permiso).
- Pedidos CC visibles en dashboard y control de caja por local.
- Cobranzas del día en dashboard por local.
- Vincular facturas del día para pedidos legacy sin cobro.

### 10. Facturación electrónica (ARCA / Sistemas 360)

- Emisión de facturas A/B desde pedido según condición IVA del cliente.
- Multi-PV AFIP: PV 14–19 mapeados a locales (`punto_venta_afip`).
- CAE real en producción (PV 14–16 verificados ago 2026).
- Token `arca_prod_` en prod; validación de PV en respuesta S360.
- Estado `facturacion_error` + reintentar en UI (contingencia manual).
- **Notas de crédito** total/parcial: stock devolución, CC, devolución contado (saldo a favor o caja).
- Reverso de Elixio Coins al emitir NC (`nc_reverso`).
- Permiso rol `facturacion`.
- Export **TXT SICORE** para importación en SIAp.
- Pendiente operativo: CAE estable PV 17–19, cola automática S360.

### 11. Compras y proveedores (parcial)

- **Remitos de compra** con ingreso de stock al depósito central.
- Factura de compra con descuento sobre neto.
- **Retenciones** compras con PDF; cálculo automático retención F.744 por proveedor/mes.
- Dashboard filtrable por fecha.
- Rutas y pantalla Compras en UI.
- Pendiente: OC/pedido a proveedor, CC proveedores, cartera cheques.

### 12. Reportes y analítica

- Menú Reportes con **período personalizado** (desde/hasta).
- Rankings: artículos vendidos, sucursales, forma de cobro.
- Detalle de pedidos por artículo con modal y export CSV.
- Export precios por lista con filtro marca.
- **Eventos comerciales**: análisis de impacto en ventas, comparativa vs referencia, factor xN, responsive.
- Dashboard: ventas del día, canal 30 d, desglose por canal (mayoristas, ML, web).
- Meta mensual planta en Inicio (base 4.000 pedidos, +10% si se supera).
- Vista admin vs sucursal según permisos.

### 13. Usuarios, permisos y auditoría

- Login JWT con rate limiting (20 intentos / 15 min por IP+email).
- Rate limit API global con PostgreSQL.
- Roles: admin, gerente, depósito, vendedor, cajero, facturación.
- Filtro por sucursal (`local_id`); admin/gerente ven todo.
- Ocultar costos a roles de local.
- ABM usuarios y panel de permisos por rol.
- Tabla **auditoria** con log de pedidos, facturas, Elixio Coins, cobros y stock.
- Pantalla Auditoría con labels ampliados.
- Scripts VPS: `check-seguridad-env.sh`, `test-restore-pg.sh`.

### 14. Personal y colaboradores

- Módulo **Personal**: vista por local con cards.
- Liquidación de mes con selección por comprobante y adelantos.
- Integración con permisos y visibilidad por sucursal.

### 15. Pedidos internos — tinturas y catálogo TPC

- Selector de tonos en pedidos internos de tintura.
- Catálogo **38 tonos KTPAM** y tonos KAM (matizador, desamarillador, 12.111).
- Catálogo TPC unificado con sync de tinturas.
- Flujo completo sucursal → depósito documentado en PLAN-CADENA-SUMINISTRO.

### 16. Integraciones

- **Shopify → ERP:** import productos, webhooks inventario y pedidos.
- **ERP → Shopify:** push stock solo depósito `DEP1842`.
- Match cliente por documento en pedidos Shopify.
- Auditoría Fase 1 de vínculos ERP ↔ Shopify.
- Túnel ngrok para webhooks en desarrollo (`shopify:tunnel`).
- **Mercado Libre:** canal en pedidos; integración API pendiente.
- **WhatsApp:** canal manual en pedidos; avisos a ganadores sorteo/pedidos internos.

### 17. Infraestructura, deploy y seguridad

- VPS Hostinger con Node 22, PM2, Nginx, Certbot HTTPS.
- Ambientes: local (SQLite), **staging** (`staging.stockinlavanda.com.ar`), **prod** (`erp.stockinlavanda.com.ar`).
- PostgreSQL en VPS (`stockin_erp` prod, `erp_staging` staging).
- Backup diario off-site **Backblaze B2** con rclone (cron 3:00).
- Restore test automatizado; UptimeRobot en `/api/health`.
- Cloudflare DNS (proxy naranja confirmado ago 2026).
- Documentación: GUIA-STAGING-VPS, CHECKLIST-DEPLOY-STAGING, ENV-PRODUCCION, SEGURIDAD, BACKUP-RESTORE.
- DNS dominios: ERP, staging, listas público, coins/elixio.

### 18. Programa Elixio Coins (fidelización)

*Desarrollo adicional sep 2026 — ver también [ELIXIO-COINS-BLOG.md](../clientes/ELIXIO-COINS-BLOG.md).*

#### 18.1 Motor de Coins (backend ERP)

- Acreditación: **1 Coin cada $10.000** de compra al contado (tramos completos).
- Elegibilidad: Profesional, Elixio, LP2; excluye CC y cobros de deuda anterior.
- Registro automático al cobrar; preview en Pedidos; toast `+N Elixio Coins`.
- Reversos ante cancelación, anulación de cobro y NC.
- Campaña piloto `MARAVILLAS-2026` (sep–dic 2026).
- Tests automatizados del motor.

#### 18.2 Portal cliente — `elixio.com.ar`

- App web responsive: login DNI/CUIL, JWT, rate limiting.
- Saldo, historial, catálogo canje, selección sucursal con stock en tiempo real.
- Vouchers `ELX-…` (48 h), varios pendientes simultáneos.
- Ofertas exclusivas con activación y códigos `OFR-…`.
- PWA instalable; animaciones de canje; páginas legales integradas.
- Aceptación obligatoria de términos (registro IP/user-agent).
- Routing multi-host; redirect desde `erp…/coins` y host legacy.

#### 18.3 Canje en mostrador

- Botón Canje de Coins en Pedidos; validación código; vouchers pendientes.
- Línea regalo sin afectar promos; escala **1 Coin = $1.000** producto.
- Bloqueo/liberación de saldo; incompatibilidad con condiciones comerciales.

#### 18.4 Gestión interna ERP (`/elixio-coins`)

- Pestañas: Participantes, Simulador, Premios martes, Canje, Ofertas, Movimientos.
- Premios equipo por sucursal (umbrales facturado/vendido).
- Sorteos martes: orden $50.000 + máquina de corte (1.er martes).
- Aviso WhatsApp/email al ganador; export CSV.
- Estadísticas de canje; permisos granulares.

#### 18.5 Documentación legal y contenidos

- Bases y condiciones, política de privacidad, términos del portal.
- Guía para blog/centro de ayuda; textos cortos redes/WhatsApp.
- Checklist DNS Cloudflare + Nginx para `elixio.com.ar`.

### 19. Documentación entregada

- **~68 archivos** en `docs/`: estado por módulo, flujos operativos, plan de trabajo por fases, bitácora diaria, requisitos negocio, checklists legal/contable y producción.
- Documentación por área: artículos, pedidos, facturación, promociones, precios, clientes, administración, infra.
- Reglas Cursor (`.cursor/rules/`) para desarrollo seguro en prod.

---

## Versión resumida para factura (ítems numerados)

| # | Descripción | Cant. |
|---|-------------|------:|
| 1 | **Plataforma ERP base** — API Node/Express, SQLite/PG, migraciones Knex, scripts importación, documentación técnica | 1 |
| 2 | **Frontend React + TypeScript** — migración completa UI, 25+ pantallas, build prod, UX operativa | 1 |
| 3 | **Artículos, stock, traspasos, mermas, vencimientos, PWA inventario** — catálogo ~2.000 SKU, multi-local, escáner mobile | 1 |
| 4 | **Precios, listas LP1–LP5, portal público `/p/`** — coeficientes, import masivo, link WhatsApp con Excel | 1 |
| 5 | **Clientes, CC, AFIP, anti-duplicados** — ABM, cobranzas, match Shopify | 1 |
| 6 | **Pedidos, caja, arqueo, cobranzas CC** — flujo contado/CC atómico, ingresos/egresos, control diario | 1 |
| 7 | **Facturación ARCA multi-PV (14–19), NC, SICORE** — integración Sistemas 360, notas de crédito con stock | 1 |
| 8 | **Condiciones comerciales, kits, promociones** — motor reglas, preview pedido, sync kits | 1 |
| 9 | **Pedidos internos, tinturas TPC, reposición sucursales** — cola depósito, PDF, WhatsApp, sugerencia semanal | 1 |
| 10 | **Compras parcial, retenciones, personal** — remitos, F.744, liquidación mes | 1 |
| 11 | **Reportes, dashboard, eventos comerciales** — rankings, período custom, analítica impacto | 1 |
| 12 | **Usuarios, permisos, auditoría, seguridad** — JWT, roles sucursal, rate limits, backup B2 | 1 |
| 13 | **Integraciones Shopify** — productos, stock DEP1842, pedidos, webhooks, auditoría vínculos | 1 |
| 14 | **Infra VPS staging + prod** — PostgreSQL, HTTPS, PM2, Nginx, deploy checklist, restore | 1 |
| 15 | **Programa Elixio Coins** — motor Coins, portal `elixio.com.ar`, canje caja, sorteos, ofertas, legales | 1 |

---

## Versión ultra-resumida (1 renglón)

Desarrollo integral ERP Stockin Lavanda (jun–sep 2026): backend Node/PG, frontend React, operación multi-sucursal (pedidos, caja, CC, facturación ARCA, stock, traspasos, compras parcial, reportes, Shopify, PWA inventario, portal listas) + programa Elixio Coins con app cliente y gestión interna; deploy VPS prod/staging con backup y documentación técnica.

---

## Alcance pendiente / fuera de este entregable

Lo siguiente está documentado como **próxima fase** y no forma parte del desarrollo cerrado a la fecha:

| Tema | Estado |
|------|--------|
| POS mostrador dedicado | ❌ No iniciado |
| Mercado Libre API | ❌ Solo canal manual |
| Compras completo (OC, CC proveedores, cheques) | ⚠️ Parcial |
| ERP → Shopify precios masivos | ❌ Planificado |
| CAE estable PV 17–19 en prod | ⚠️ Pendiente operativo |
| Cola automática contingencia S360 | ❌ |
| Gran sorteo Navidad Elixio Coins | ❌ |
| Activación prod `SORTEO_MARAVILLAS_ENABLED=1` | ⚠️ Decisión negocio |
| Smoke final DNS `elixio.com.ar` en VPS | ⚠️ En curso |

---

## Métricas de referencia (ago–sep 2026)

| Métrica | Valor |
|---------|-------|
| Commits en repositorio | ~489 |
| Productos en prod | 1.696 |
| Clientes en prod | 2.722 |
| Locales + depósito | 6 (PV AFIP 14–19) |
| Pantallas React | 25+ |
| Rutas API backend | 36 |
| Migraciones Knex (Elixio) | 7 |
| Tests backend Elixio | 4 suites |
| Archivos documentación | ~68 |

---

## Notas para emisión

1. **Titular sugerido en descripción:** desarrollo de software a medida / servicios de programación.
2. **Período de prestación:** jun 2026 – sep 2026 (ajustar fechas de factura según contrato).
3. **Exclusiones recomendadas:** hosting VPS, dominios NIC, tokens S360/Shopify, cartelería física locales.
4. Este documento es **descriptivo del trabajo realizado**; no incluye montos ni condiciones comerciales.

---

*Generado a partir de: git log, ESTADO-MODULOS, PLAN-TRABAJO, BITACORA, código fuente y documentación del repositorio ERPDEMO.*
