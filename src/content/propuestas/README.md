# Propuestas — fuentes de contenido

Cada propuesta vive en su propia carpeta. El ERP las lee desde acá.

```
src/content/propuestas/
├── stockin-lavanda/
│   ├── meta.json        ← datos para el ERP (cliente, slug, precio, estado)
│   └── propuesta.html   ← documento completo que ve el cliente
└── otro-cliente/
    ├── meta.json
    └── propuesta.html
```

## Tipos

| `format` en meta.json | Uso |
|---|---|
| `document` | HTML a medida (como Stockin Lavanda) |
| `simple` | Se crea desde `/app/propuestas/nueva` (formulario) |

## Flujo

1. Creá la carpeta `src/content/propuestas/[slug]/`
2. Pegá el HTML en `propuesta.html`
3. Completá `meta.json`
4. Reiniciá dev (hoy) o guardás en Firebase (Fase 3)
5. Link público: `https://ailensampo.com/p/[slug]`
6. Tracking: `/app/propuestas/[slug]`

## Reglas

- **No** dejar HTML sueltos en la raíz del repo
- El `slug` de la carpeta debe coincidir con `meta.json` y con la URL `/p/[slug]`
- `propuesta.html` es la fuente; no editar copias duplicadas
