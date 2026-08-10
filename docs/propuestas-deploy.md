# Propuestas — dónde editar y cómo pushear

> Guía rápida para no perder cambios entre desarrollo y producción.

---

## El problema que nos pasó

Editamos propuestas en `feat/sitio`, hicimos push ahí, y **en el sitio en vivo no cambió nada**.

**Motivo:** Vercel despliega producción desde `main`. En esa rama las propuestas siguen siendo HTML estático. En `feat/sitio` ya están en el sistema Next.js, pero esa rama **no es la que ve el cliente hoy**.

---

## Dos lugares, dos ramas

| Entorno | Rama | Archivos de propuestas | URL |
|---|---|---|---|
| **Producción (cliente)** | `main` | `p/[slug]/index.html` | `https://ailensampo.com/p/stockin-lavanda` |
| **Desarrollo local** | `feat/sitio` | `src/content/propuestas/[slug]/propuesta.html` | `http://localhost:3000/p/stockin-lavanda` |

### Propuestas actuales

| Cliente | Slug | Producción (`main`) | Desarrollo (`feat/sitio`) |
|---|---|---|---|
| Stockin Lavanda | `stockin-lavanda` | `p/stockin-lavanda/index.html` | `src/content/propuestas/stockin-lavanda/propuesta.html` |
| Mash | `mash` | `p/mash/index.html` | `src/content/propuestas/mash/propuesta.html` |

Meta / precio en el panel interno (solo `feat/sitio`):

- `src/content/propuestas/[slug]/meta.json`

---

## Checklist al editar una propuesta

### Si el cliente tiene que verlo **ya** (producción)

1. Editar **`p/[slug]/index.html`** en la rama **`main`**
2. Commit y push a **`main`**
3. Esperar el deploy de Vercel (~1–2 min)
4. Verificar en `https://ailensampo.com/p/[slug]`
5. Si también se trabaja en Next, **replicar el mismo cambio** en `src/content/propuestas/[slug]/propuesta.html` en **`feat/sitio`**

### Si solo estamos probando en local

1. Editar **`src/content/propuestas/[slug]/propuesta.html`** en **`feat/sitio`**
2. `npm run dev` → `http://localhost:3000/p/[slug]`
3. Push a **`feat/sitio`** (opcional, para backup; **no actualiza producción**)

---

## Comandos de referencia

### Actualizar producción (lo que ve el cliente)

```bash
git checkout main
# editar p/stockin-lavanda/index.html y/o p/mash/index.html
git add p/
git commit -m "Actualizar propuesta [cliente]: [qué cambió]."
git push origin main
git checkout feat/sitio
```

### Mantener `feat/sitio` al día (recomendado)

Después de pushear a `main`, copiar el mismo cambio a:

- `src/content/propuestas/stockin-lavanda/propuesta.html`
- `src/content/propuestas/mash/propuesta.html`
- `meta.json` si cambió el precio

```bash
git checkout feat/sitio
# aplicar los mismos cambios
git add src/content/propuestas/
git commit -m "Sincronizar propuesta [cliente] con main."
git push origin feat/sitio
```

---

## Cómo verificar que deployó

1. Push a **`main`** (no alcanza con `feat/sitio`)
2. Deploy en Vercel terminado
3. Recarga forzada o ventana de incógnito (el iframe/HTML puede cachear)
4. Buscar en el HTML algo concreto del cambio (ej. `USD 25.000`, clase `price-was`)

---

## Qué rama usa cada cosa

| Acción | Rama correcta |
|---|---|
| Cliente abre link de propuesta en vivo | `main` → Vercel producción |
| Desarrollo con `npm run dev` | `feat/sitio` |
| Panel `/app/propuestas` | `feat/sitio` (Next) |
| Push “para que lo vea el cliente” | **`main`** |

---

## Cuando migremos el sitio completo a Next

Cuando `feat/sitio` pase a producción:

- Las propuestas vivirán solo en `src/content/propuestas/`
- Las rutas `p/[slug]/index.html` dejarán de usarse
- Un solo push a `main` (o la rama de producción que definamos) alcanzará

Hasta entonces: **cambio visible para el cliente = push a `main` en `p/[slug]/index.html`**.

---

## Historial de este aprendizaje

- **Jul 2026:** Cambios de precio Stockin Lavanda (USD 25.000 → 15.400) y responsive Mash pusheados solo a `feat/sitio` → no se vieron en producción.
- **Fix:** Mismo contenido aplicado en `p/stockin-lavanda/index.html` y `p/mash/index.html` en `main` (commit `d3ffbb4`).
