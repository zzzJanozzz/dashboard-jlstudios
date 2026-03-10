# Guía de deploy — Rocha's Rotisería (Actualizado)

Estado actual: El CMS está 100% conectado a Supabase y listo para producción.

---

## Arquitectura actual

```
GitHub (dashboard-jlstudios)  →  Vercel        →  CMS en cms.rochasrotiseria.com
GitHub (Comida)                →  Cloudflare    →  Página en rochasrotiseria.com
Supabase (BD + Storage)        ←  ambos leen/escriben acá
Spaceship (dominio)            →  DNS apunta a Cloudflare
```

---

## PASO 1 — Deploying el CMS en Vercel

El CMS es una app Next.js. Vercel es el hosting ideal.

1. Entrá a https://vercel.com e iniciá sesión con tu cuenta de GitHub
2. Hacé clic en **"Add New..." → Project**
3. Importá el repo: `zzzJanozzz/dashboard-jlstudios`
4. En **Framework Preset**, elegí: **Next.js**
5. Hacé clic en **Environment Variables** y agregá estas dos:

   | Variable                          | Valor                                                |
   |-----------------------------------|------------------------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`        | `https://pupnmwaydhycxqgodsqa.supabase.co`           |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | `sb_publishable_flOKWX7GPyX0S9LBBEZrfA_j3bvPLOc`    |

6. En **Root Directory**, dejá vacío (raíz del repo)
7. En **Build Command**, dejá el default: `next build`
8. En **Git Branch**, seleccioná: `feature/rochas-client-setup`
9. Hacé clic en **Deploy**
10. Esperá ~2 minutos. Vercel te da una URL tipo `dashboard-jlstudios-xxxx.vercel.app`

### Conectar dominio personalizado (opcional)

Si querés que el CMS esté en `cms.rochasrotiseria.com`:
1. En Vercel → **Settings → Domains** → agregar `cms.rochasrotiseria.com`
2. En Cloudflare DNS, agregar un registro CNAME:
   - Nombre: `cms`
   - Destino: `cname.vercel-dns.com`
   - Proxy: **DNS only** (nube gris, no naranja)

---

## PASO 2 — Página pública en Cloudflare Pages

La página de Rocha's (repo `Comida`, HTML estático) ya está en Cloudflare Pages con dominio `rochasrotiseria.com`.

Si necesitás re-deployar:
1. Pusheá los cambios al repo `Comida` en GitHub
2. Cloudflare Pages detecta el push y re-deploya automáticamente
3. O hacé deploy manual desde el dashboard de Cloudflare Pages

---

## PASO 3 — Migración de BD (si ya tenés data)

Si ya ejecutaste el `supabase-schema.sql` antes de los últimos cambios, corré esto en el **SQL Editor** de Supabase:

```sql
-- Agregar columnas nuevas si no existen
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hero_url text;

-- Corregir datos del hero para Rochas
UPDATE clients
SET hero_title = E'El sabor\nde casa,\nlisto para llevar.',
    hero_title_highlight = 'casa,'
WHERE username = 'rochas';
```

---

## Variables de entorno

| Variable                        | Dónde se usa | Valor                                              |
|---------------------------------|--------------|----------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | CMS (Vercel) | `https://pupnmwaydhycxqgodsqa.supabase.co`         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | CMS (Vercel) | `sb_publishable_flOKWX7GPyX0S9LBBEZrfA_j3bvPLOc`  |

La página pública (`index.html`) tiene las claves hardcodeadas en el `<script>` ya que es un HTML estático sin build step.

---

## Costos

| Servicio            | Costo                              |
|---------------------|------------------------------------|
| Supabase            | Gratis (hasta 500MB BD + 1GB Storage) |
| Vercel (CMS)        | Gratis (hasta 100GB bandwidth/mes) |
| Cloudflare Pages    | Gratis (hasta 500 deploys/mes)     |
| Dominio .com        | ~USD 10-15 por año (Spaceship)     |
| **Total**           | **~USD 10-15 por año**             |

---

## Flujo de edición del cliente

1. El cliente entra al CMS (`cms.rochasrotiseria.com`)
2. Inicia sesión con usuario `rochas`
3. Edita menú, fotos, horarios, hero, etc.
4. Hace clic en **Guardar** → se guarda en Supabase al instante
5. El visitante entra a `rochasrotiseria.com` → la página carga los datos frescos de Supabase

**No hace falta re-deployar nada.** Los cambios son en tiempo real porque la página lee de Supabase en cada visita.

---

## Re-deploy automático

- **CMS**: Cada push a `feature/rochas-client-setup` en GitHub → Vercel re-deploya automáticamente
- **Página pública**: Cada push al repo `Comida` en GitHub → Cloudflare re-deploya automáticamente
