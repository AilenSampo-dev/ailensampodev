# ERP — deploy en Vercel (proyecto separado)

El sitio público y el ERP comparten el mismo repo de GitHub, pero se despliegan como **dos proyectos Vercel distintos**.

| Proyecto | Root en Vercel | Dominio | Rama |
|---|---|---|---|
| **Sitio público** | `/` (raíz) | `ailensampo.com` | `main` |
| **ERP privado** | `erp/` | `app.ailensampo.com` | `main` |

---

## 1. Crear el proyecto ERP en Vercel

1. Entrá a [vercel.com/new](https://vercel.com/new)
2. Importá el repo **`AilenSampo-dev/ailensampodev`**
3. En **Configure Project**:
   - **Project Name:** `ailensampo-erp` (o similar)
   - **Root Directory:** `erp` → Edit → seleccionar carpeta `erp`
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **No** despliegues todavía — primero cargá las variables de entorno (paso 2).

---

## 2. Variables de entorno (ERP)

En **Project → Settings → Environment Variables**, agregá todo esto para **Production** (y **Preview** si querés probar en branches):

| Variable | Valor | Notas |
|---|---|---|
| `APP_URL` | `https://app.ailensampo.com` | URL pública del ERP (enlaces de firma de contrato) |
| `ERP_PASSWORD` | *(tu clave)* | Acceso al panel |
| `JWT_SECRET` | *(string largo aleatorio)* | Sesiones — generá uno único |
| `SUPABASE_URL` | *(de Supabase)* | Requerido para backup y contratos |
| `SUPABASE_SERVICE_ROLE_KEY` | *(de Supabase)* | Solo servidor — nunca en el frontend |
| `BREVO_API_KEY` | *(de Brevo)* | Envío de emails |
| `BREVO_FROM_EMAIL` | `hola@ailensampo.com` | Remitente verificado en Brevo |
| `ADMIN_EMAIL` | `hola@ailensampo.com` | Copia admin de certificados |

Referencia local: `erp/.env.example`

### Supabase

Ejecutá el schema en **SQL Editor**:

```
erp/supabase/schema.sql
```

---

## 3. Dominio `app.ailensampo.com`

1. En el proyecto ERP → **Settings → Domains**
2. Agregá `app.ailensampo.com`
3. Vercel te dará un registro DNS. En tu proveedor de dominio (donde está `ailensampo.com`):

| Tipo | Nombre | Valor |
|---|---|---|
| `CNAME` | `app` | `cname.vercel-dns.com` |

*(El valor exacto puede variar — usá el que muestre Vercel.)*

4. Esperá propagación DNS (minutos a horas)
5. Confirmá que `APP_URL` = `https://app.ailensampo.com`

---

## 4. Deploy

1. Con variables cargadas → **Deploy**
2. Verificá:
   - `https://app.ailensampo.com` → pantalla de login del ERP
   - `https://app.ailensampo.com/api/auth/status` → JSON `{ ok: ... }`
   - Login con `ERP_PASSWORD` → panel de clientes

---

## 5. Evitar deploys cruzados (recomendado)

Para que un push que solo toca `erp/` no redepliegue el sitio público (y viceversa):

### Proyecto sitio público (`ailensampo.com`)

**Settings → Git → Ignored Build Step:**

```bash
git diff HEAD^ HEAD --quiet -- . ':!erp'
```

### Proyecto ERP (`app.ailensampo.com`)

**Settings → Git → Ignored Build Step:**

```bash
git diff HEAD^ HEAD --quiet -- erp/
```

---

## 6. Desarrollo local

```bash
# Sitio público → http://localhost:3000
npm run dev:site

# ERP → http://localhost:5173
cp erp/.env.example erp/.env   # completar valores
npm run install:erp
npm run dev:erp
```

---

## 7. Qué va en cada lado

```text
ailensampo.com (público)          app.ailensampo.com (ERP)
─────────────────────────         ─────────────────────────
index.html                        Panel de clientes
p/stockin-lavanda/                Contratos + firma (/firmar/:token)
p/mash/                           Envío de propuestas (próximo)
p/soulful-branding/               Backup Supabase
api/proposals/ (tracking)         api/auth, api/erp, api/contrato
```

El cliente **nunca** entra al ERP. Solo ve propuestas en `ailensampo.com/p/...` y contratos en `app.ailensampo.com/firmar/...`.

---

## 8. Deploy manual (CLI)

Desde la carpeta `erp/` (no desde la raíz):

```bash
cd erp
npx vercel login
npx vercel link          # proyecto: erp-ailen-sampo
npx vercel --prod
```

> **Importante:** el proyecto en Vercel tiene **Root Directory = `erp`** para deploys automáticos desde Git. Los deploys manuales con CLI se hacen entrando a `erp/` antes de correr `vercel --prod`.

---

## Estado actual (ago 2026)

| Item | Valor |
|---|---|
| Proyecto Vercel | `erp-ailen-sampo` |
| URL producción | `https://app.ailensampo.com` |
| Repo Git | `AilenSampo-dev/ailensampodev` (root: `erp/`) |
| Variables | Configuradas (Brevo, Supabase, auth) |

### DNS pendiente (si `app.ailensampo.com` no resuelve)

Agregá en tu proveedor de dominio:

| Tipo | Nombre | Valor |
|---|---|---|
| `A` | `app` | `76.76.21.21` |

Verificá con: `npx vercel domains inspect app.ailensampo.com`
