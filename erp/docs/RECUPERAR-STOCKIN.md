# Recuperar Stockin Lavanda en el ERP

## Opción A — Supabase (funciona ahora, sin deploy)

1. Entrá a **supabase.com** → tu proyecto ERP.
2. **SQL Editor** → **New query**.
3. Pegá y ejecutá el contenido de `erp/supabase/restaurar-stockin.sql`.
4. Recargá **app.ailensampo.com** con `Ctrl+Shift+R`.

## Opción B — Después de un deploy exitoso

1. Entrá a **app.ailensampo.com** → **Clientes**.
2. Clic en **Restaurar Stockin Lavanda** (si la lista está vacía).

## Si los deploys en Vercel fallan

1. Vercel → proyecto **erp-ailen-sampo** → deployment fallido → **View Build Logs**.
2. Copiá el error y compartilo para corregir el build.
3. Mientras tanto usá la **Opción A** (Supabase).
