# Deploy — Rocha's Rotisería CMS

Pasos para pasar de mock a producción real.

---

## 1. Supabase

### Crear proyecto
1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `jlstudios-cms` | Región: South America (São Paulo)
3. Guardar la contraseña de la DB

### Ejecutar el schema
En **SQL Editor** del dashboard de Supabase, pegar y ejecutar el contenido de `supabase-schema.sql`.

Esto crea las tablas `clients`, `schedules`, `menu_items`, `why_cards` con los datos reales de Rocha's ya insertados.

### Variables de entorno
Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # solo en server-side
```

Obtener los valores en: Supabase Dashboard → Settings → API.

### Instalar cliente
```bash
npm install @supabase/supabase-js
```

### Reemplazar el mock login
En `app/page.tsx`, reemplazar `CREDENTIALS` con:
```ts
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// En handleLogin:
const { data, error } = await supabase
  .from("clients")
  .select("*")
  .eq("username", username)
  .single();
// Verificar password con bcrypt en una API route (nunca en el cliente)
```

### Reemplazar MOCK_AUTH_DB
En `app/dashboard/DashboardLayout.jsx`, reemplazar la lectura de `localStorage` con una llamada a Supabase Auth o una API route que devuelva la sesión.

### Reemplazar datos del menú
En `app/dashboard/ContentManager.jsx`, reemplazar `initialItems` con:
```ts
const { data } = await supabase
  .from("menu_items")
  .select("*")
  .eq("client_id", session.id)
  .order("sort_order");
```

---

## 2. Cloudflare Pages

### Instalar adaptador
```bash
npm install -D @cloudflare/next-on-pages
```

Agregar a `package.json`:
```json
"scripts": {
  "pages:build": "npx @cloudflare/next-on-pages"
}
```

### Conectar repositorio
1. Cloudflare Dashboard → Pages → Create application → Connect to Git
2. Seleccionar `dashboard-jlstudios`
3. Framework preset: **Next.js**
4. Build command: `npm run pages:build`
5. Output directory: `.vercel/output/static`

### Variables de entorno en CF Pages
En CF Pages → Settings → Environment variables, agregar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Dominio personalizado
1. CF Pages → Custom domains → Add domain
2. Ingresar el dominio comprado en Spaceship (ej: `cms.rochasrotiseria.com`)
3. Seguir las instrucciones de DNS (agregar CNAME en Spaceship apuntando a `<project>.pages.dev`)

---

## 3. Dominio en Spaceship

1. Comprar dominio en [spaceship.com](https://spaceship.com)
2. En DNS Management, agregar:
   - `CNAME @ <project>.pages.dev` — para la página del local
   - `CNAME cms <cms-project>.pages.dev` — para el CMS (subdominio)
3. Activar Cloudflare como nameserver para aprovechar SSL automático y CDN

---

## 4. Imágenes — migrar de GitHub a Supabase Storage

Las fotos del menú actualmente apuntan a `raw.githubusercontent.com`. En producción:

1. Crear bucket en Supabase Storage: `client-media` (público)
2. Subir las imágenes desde el panel de Supabase o via API
3. Actualizar las URLs en la tabla `menu_items`:
   ```sql
   UPDATE menu_items
   SET image_url = replace(image_url, 'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/', 'https://<project-ref>.supabase.co/storage/v1/object/public/client-media/')
   WHERE client_id = (SELECT id FROM clients WHERE username = 'rochas');
   ```
4. En el CMS, el campo "URL de la foto" en cada producto ya acepta URLs de Supabase Storage

---

## 5. Checklist final antes de entregar al cliente

- [ ] Schema SQL ejecutado en Supabase
- [ ] Variables de entorno configuradas en CF Pages
- [ ] Login con Supabase Auth funcionando
- [ ] Imágenes migradas a Supabase Storage
- [ ] Dominio .com apuntando al sitio del local
- [ ] Subdominio `cms.` apuntando al panel
- [ ] SSL activo en ambos dominios (Cloudflare lo gestiona automáticamente)
- [ ] Contraseña de `rochas` cambiada a una segura (bcrypt en DB)
