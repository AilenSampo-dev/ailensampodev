# Tramas y texturas — referencia de diseño

Subí acá los archivos exportados desde Figma/Illustrator, **uno por slide**.

## Estructura

```
tramas/
├── degrade/         ← todos los artboards exportados (respaldo)
├── MAPA.md          ← asignación slide → trama (revisar juntas)
├── slide-01/        → slide 1 (/)
├── slide-02-03/     → slides 2+3 juntos (/test) — misma sección
├── slide-04-05/     → slides 4+5 (/builder)
├── slide-06/        → slide 6 (/contacto)
└── slide-07/        → slide 7 (/sistema) — falta degradé azul
```

Ya no usamos `slide-02/` y `slide-03/` por separado: **2 y 3 comparten carpeta** porque es la misma sección continua.

## Formatos aceptados

- `.png` / `.webp` — textura o trama raster (preferido si tiene degradé complejo)
- `.svg` — patrón repetible (grids, líneas)
- `.jpg` — solo si no hay transparencia

## Cómo nombrar los archivos

```
fondo.png              → fondo completo del slide
degrade.png            → capa de degradé (si va separada)
grid.svg               → grilla / trama repetible
textura.png            → textura overlay
```

Si hay varias capas, numerá: `01-fondo.png`, `02-degrade.png`, `03-grid.svg`

## Colores

La paleta está en `docs/colores.txt` (también en código: `src/data/colors.ts`).

## Flujo

1. Vos subís las tramas acá, slide por slide
2. Revisamos juntas contra `notas_privadas/_mockupSitio/slides/`
3. Las aprobadas se copian a `public/assets/tramas/` para el sitio
