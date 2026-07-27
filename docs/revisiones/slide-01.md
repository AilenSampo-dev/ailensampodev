# Revisiones — Slide 1 (`/`)

> Feedback de validación. Estado: **en curso**

## Resumen

| # | Tema | Estado |
|---|---|---|
| 1 | Logo secundario oficial | ✅ Corregido |
| 2 | Fuentes del proyecto | ✅ Confirmado |
| 3 | "Disponible para nuevos proyectos" | ✅ OK (sin cambios por ahora) |
| 4 | Textos en varias líneas → cuadros más grandes | ✅ Corregido |
| 5 | Íconos naranja, más grandes, mejor posición | ✅ Corregido |
| — | Animaciones (Paso B) | ⏳ Después de validar estático |

---

## 1. Logo

**Problema:** Se usó `icono-a.svg` + texto "Ailén" recreado manualmente.

**Corrección:** Usar `public/assets/logos/(a) Ailen_logo secundario.svg` (logo secundario oficial).

---

## 2. Fuentes

| Elemento | Fuente |
|---|---|
| Logo | SVG (no es texto) |
| Nav links + status + ticker | **Nunito Sans** (`public/fonts/`) |
| Texto en ventanas | **Egyptian Slate** (`public/fonts/`) |

Ambas cargadas en `src/styles/fonts.css` → `globals.css`.

---

## 3. "Disponible para nuevos proyectos"

Texto en nav derecha + punto verde `#ABE3D2`. Sin cambio solicitado explícito.

---

## 4. Textos multilínea

**Problema:** Copy en una sola línea → cuadros chicos.

**Corrección — copy del mockup:**

Ventana clara (4 líneas):
```
Si vos frenas
y tu negocio
se detiene
con vos...
```

Ventana oscura (3 líneas):
```
Estás sosteniendo a
pulso lo que podría
sostener un sistema
```

Cuadros más anchos para acomodar el corte de línea.

---

## 5. Íconos decorativos

**Problema:** Amarillos, chicos, mal posicionados sobre los cuadros.

**Corrección:**
- Color: **naranja** `#FF6437` (ambos)
- Tamaño: más grandes
- Posición: anclados a la ventana oscura (esquina inferior izq. + superior der.)

---

## Pendiente (después de tu OK)

- [ ] Ajuste fino posición íconos (si aún no coinciden)
- [ ] Export SVG pixel `(!!)` si el texto no alcanza
- [ ] Animación ticker
- [ ] Animación entrada ventanas

## Ronda 2 — fidelidad mockup (2026-07-11)

- Degradé diagonal (155deg) como Artboard 28
- Ventanas: posición absoluta con overlap como mockup; oscura más grande
- Tipografía ventanas: **Nunito Sans** (no serif)
- Ventanas sin borde/sombra pesados; titlebar más fino
- Ticker: segunda mitad en **bold**
- Grilla más sutil (líneas blancas)
- [x] Íconos re-posicionados en esquinas de ventana oscura
- [x] Triángulo warning: esquina inferior izquierda (no mitad del cuadro)
