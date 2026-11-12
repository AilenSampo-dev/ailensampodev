# Revisiones — Slide 2 (Demo / `#demo`)

> Estado: **validado y sellado** (2026-09-08)

## Resumen

| # | Tema | Estado |
|---|---|---|
| 1 | Fondo lila + grilla | ✅ |
| 2 | Card, banner amarillo, form, tags | ✅ |
| 3 | Typewriter banner + cursor al input | ✅ |
| 4 | Caritas fuera del card (mobile + desktop) | ✅ |
| 5 | Guiños alternados | ✅ |
| 6 | Posición caritas (distancia al card / bordes) | ✅ |

---

## 1. Estructura

- Eyebrow: "No te explico lo que hago"
- Título: "Te lo demuestro"
- `cardStage` → caritas absolutas + `form.card`
- Tags clicables → rellenan input y disparan generar

## 2. Typewriter

- Texto: `¿Qué tarea te está robando tiempo hoy?`
- Detección in-view con observer + scroll + polling (Strict Mode safe)
- Componente hijo `BannerTypewriter` con `setTimeout` recursivo
- Cursor banner `#5c64f2`; placeholder input con cursor al completar banner

## 3. Caritas

| Posición | Componente | Guiño |
|---|---|---|
| Abajo izquierda | `DemoFaceWink` | Primero (`winkPhase="first"`) |
| Arriba derecha | `DemoFaceNeutralWink` | Segundo (+1.8s) |

- Tamaño: `clamp` mobile; ~8–11.5rem desktop
- Gutter fluido empuja el card; caritas en zona exterior
- Mobile: abajo separada del lavanda; arriba más alta
- Desktop: abajo más hacia afuera; arriba más a la derecha

## 4. Breakpoints clave

- `@media (max-width: 639px)` — banner multilínea
- `@media (max-width: 380px)` — gutters y tipografía reducidos
- `@media (min-width: 640px)` — caritas grandes, banner una línea
- `@media (min-width: 900px)` — ajuste fino posición caritas PC

## Regla Cursor

`.cursor/rules/demo-sealed.mdc`
