# Facturación por cliente y mes

Acá va **cada ciclo mensual**: detalle para el cliente, factura fiscal (CAE) y comprobante de pago.

## Estructura

```
facturacion/
├── _plantillas/
│   └── detalle-servicios-modelo.html   ← copiá esto al mes que corresponda
└── clientes/
    └── stockin-lavanda/
        └── YYYY-MM/
            ├── registro.yaml             ← índice del mes (montos, estado, archivos)
            ├── detalle-servicios.html    ← detalle editable → exportar a PDF
            └── adjuntos/
                ├── detalle-servicios.pdf
                ├── factura-cae.pdf
                └── comprobante-pago.pdf
```

## Flujo por mes

1. **Copiá** `_plantillas/detalle-servicios-modelo.html` → `clientes/<cliente>/YYYY-MM/detalle-servicios.html`
2. **Completá** el HTML y exportá PDF a `adjuntos/detalle-servicios.pdf`
3. **Emití** factura AFIP → guardá `adjuntos/factura-cae.pdf`
4. **Al cobrar** → guardá transferencia/comprobante en `adjuntos/comprobante-pago.pdf`
5. **Actualizá** `registro.yaml` (estado, montos, nº de factura, CAE, fecha de pago)

## Convención de nombres (adjuntos)

| Archivo | Contenido |
|---------|-----------|
| `detalle-servicios.pdf` | Detalle enviado al cliente (sin CAE) |
| `factura-cae.pdf` | Factura electrónica AFIP |
| `comprobante-pago.pdf` | Transferencia / recibo del cliente |

Si hay más de un pago parcial en el mes: `comprobante-pago-01.pdf`, `comprobante-pago-02.pdf`.

## Git

Los **PDF** en `adjuntos/` están en `.gitignore` (datos sensibles). En el repo quedan el `registro.yaml` y el `detalle-servicios.html` editable.

Si querés versionar PDFs en un repo privado, comentá la regla en `.gitignore`.

## Clientes

| Carpeta | Proyecto |
|---------|----------|
| `stockin-lavanda/` | ERP Stockin Lavanda + Elixio Coins |

Para un cliente nuevo: `clientes/<slug>/YYYY-MM/` con el mismo esquema.
