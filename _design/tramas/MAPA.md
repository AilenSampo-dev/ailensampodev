# Mapa de tramas → slides

Comparación contra mockups (`notas_privadas/_mockupSitio/slides/`).

## Resumen — estado de validación

| Slide | Ruta | Trama | Estado |
|---|---|---|---|
| 1 | `/` | Artboard 28 | ⚠️ Cercano — se ve más oscuro en mockup (ajustamos en código) |
| 2 + 3 | `/test` | Artboard 25 | ✅ Confirmado — fin de 2 = inicio de 3 |
| 4 + 5 | `/builder` | Por confirmar | ❓ Ver sección Builder abajo |
| 6 | `/contacto` | Artboard 28 | ⚠️ Mismo que slide 1 |
| 7 | `/sistema` | Sin degradé | ✅ Azul plano `#6882EB` + grilla CSS |

---

## 1. Slide 1 y 6 — Artboard 28

**Colores del SVG:** `#361f62` → `#e462bb`

Puede verse más oscuro en el mockup por tres razones (no es que el export esté mal):

1. **La grilla encima** oscurece un poco la percepción
2. **La dirección del degradé** en Figma puede diferir del SVG exportado
3. **El rosa arriba** en el mockup ocupa más área — en código podemos ajustar stops o ángulo

→ Usamos Artboard 28 como base y **afinamos al implementar** comparando con `slides/1.png`.

**Ticker naranja (footer):** color sólido `#FF6437` de `docs/colores.txt` (no degradé), salvo que prefieras Artboard 27.

---

## 2. Slides 2 + 3 — Artboard 25 ✅

**Colores:** `#e462bb` → `#b7e2d3`

Una sola trama para `/test`. El final del slide 2 conecta con el inicio del slide 3 — es un scroll o cambio de estado en la misma página, no dos fondos distintos.

Archivo: `slide-02-03/degrade.svg`

---

## 3. Slides 4 + 5 — Builder (te lo explico simple)

En el mockup del mini-juego el fondo es **muy oscuro** (casi negro/violeta) con una **mancha u onda** rosa/naranja brillante atrás.

Yo había puesto dos archivos porque a veces eso son **dos capas**:

| Archivo en `slide-04-05/` | Colores | ¿Qué sería? |
|---|---|---|
| `degrade-oscuro.svg` (Artboard 31) | lila → púrpura oscuro | El fondo general |
| `degrade-glow.svg` (Artboard 32) | naranja → púrpura | La onda brillante |

**Para confirmar:** abrí en el explorador los archivos de `_design/tramas/degrade/` y compará con `slides/4.png`:

- ¿Cuál se parece más al **fondo oscuro**? → ese va de fondo
- ¿Cuál se parece a la **onda/luz** rosa? → ese va encima (si existe)

Si con uno solo alcanza, decime cuál. Si ninguno coincide, decime y usamos color plano `#3A1E66` + la onda la hacemos en CSS después.

---

## 4. Slide 7 — Sin degradé ✅

Fondo **azul plano** `#6882EB` (azul medio de `docs/colores.txt`) + **grilla en CSS**.

No hace falta exportar SVG. La grilla es la misma técnica que la landing legacy.

---

## Carpeta `degrade/` — los 9 artboards

| Artboard | Colores | Notas |
|---|---|---|
| 24 | verde agua → amarillo | Reserva / acentos |
| 25 | rosa → verde agua | **Slides 2+3** ✅ |
| 26 | naranja → lila | Reserva |
| 27 | amarillo → naranja | Posible ticker (o sólido) |
| 28 | púrpura → rosa | **Slides 1 y 6** ⚠️ |
| 29 | verde agua → púrpura | Reserva / transiciones |
| 30 | naranja → lila | = similar a 26 |
| 31 | lila → púrpura | Builder fondo (?) |
| 32 | naranja → púrpura | Builder onda (?) |

---

## Grillas

Todas las slides con cuadrícula → **CSS** (`background-image` con líneas), no SVG extra.

---

## Próximo paso

1. Arrancamos **layout + slide 1 estático** con Artboard 28 (ajustamos oscuridad al verlo en navegador)
2. Cuando lleguemos al **builder**, revisamos juntas qué artboard usar
3. **Slide 7** queda resuelto: azul plano + CSS
