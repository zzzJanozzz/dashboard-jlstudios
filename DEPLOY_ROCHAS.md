# Guia de deploy — Rocha's Rotiseria

Esta guia es para cuando el cliente te pague y quieras dejar todo funcionando en produccion. Por ahora el CMS funciona con datos de prueba (mock). Cuando llegue el momento, seguis estos pasos en orden.

---

## Tu situacion actual (DEMO)

- El CMS corre localmente o en Gitpod
- Los datos estan hardcodeados en el codigo (no hay base de datos real todavia)
- La pagina del local (repo Comida) es un HTML estatico en GitHub
- No hay dominio comprado todavia
- No hay deploy en Cloudflare Pages todavia

**Esto esta bien.** Podes mostrarle el CMS al cliente como demo sin necesidad de nada de lo de abajo.

---

## Cuando el cliente te pague: pasos en orden

### PASO 1 — Crear la base de datos en Supabase (gratis)

1. Entra a https://supabase.com y crea una cuenta (es gratis)
2. Haz clic en **New Project**
3. Nombre: `jlstudios-cms` | Region: **South America (Sao Paulo)** | guarda la contrasena
4. Espera 2 minutos a que se cree el proyecto
5. En el menu de la izquierda, haz clic en **SQL Editor**
6. Copia todo el contenido del archivo `supabase-schema.sql` de este repo y pegalo ahi
7. Haz clic en **Run** (boton verde)
8. Si dice "Success", listo. Las tablas y los datos de Rocha's ya estan cargados

> Si ya ejecutaste el SQL antes y te tira error de "duplicate key", no pasa nada.
> El script usa ON CONFLICT DO NOTHING — podes ejecutarlo multiples veces sin problema.

---

### PASO 2 — Subir el CMS a Cloudflare Pages (gratis)

Cloudflare Pages es donde va a vivir el panel de control (el CMS).

1. Entra a https://cloudflare.com y crea una cuenta (es gratis)
2. Dashboard de Cloudflare → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Conecta tu cuenta de GitHub y selecciona el repo `dashboard-jlstudios`
4. Configuracion del build:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: `.next`
5. Haz clic en **Save and Deploy**
6. Cloudflare te da una URL tipo `dashboard-jlstudios.pages.dev` — esa es la URL del CMS

---

### PASO 3 — Subir la pagina del local a Cloudflare Pages

La pagina de Rocha's (el HTML estatico del repo `Comida`) tambien va en Cloudflare Pages, como proyecto separado.

1. En Cloudflare Pages, crea otra aplicacion
2. Conecta el repo `Comida` de GitHub
3. Framework preset: **None** (es HTML estatico)
4. Build command: (dejarlo vacio)
5. Output directory: `/`
6. Deploy → te da una URL tipo `rochas-comida.pages.dev`

---

### PASO 4 — Comprar el dominio en Spaceship

1. Entra a https://spaceship.com
2. Busca el dominio que quiera el cliente (ej: `rochasrotiseria.com`)
3. Compralo (cuesta aprox USD 10-15 por ano)
4. En el panel de Spaceship, busca **DNS / Nameservers**
5. Cambia los nameservers a los de Cloudflare (Cloudflare te los da cuando agregas el dominio)

---

### PASO 5 — Conectar el dominio

En Cloudflare:
1. Agrega el dominio en **Websites** → **Add a site**
2. Sigue los pasos para verificar que sos el dueno
3. En la pagina del local (repo Comida), anda a **Custom domains** y agrega `rochasrotiseria.com`
4. Para el CMS, usa un subdominio: `cms.rochasrotiseria.com`

El SSL (candado verde) lo activa Cloudflare automaticamente.

---

### PASO 6 — Conectar el CMS con la base de datos

Este es el unico paso tecnico que requiere tocar codigo. Cuando llegue el momento, avisame y lo hacemos juntos. En resumen:

1. En Supabase → **Settings → API**, copiar:
   - Project URL (algo como `https://abcdef.supabase.co`)
   - anon public key (una clave larga)
2. En Cloudflare Pages, en la configuracion del CMS, agregar esas dos variables de entorno
3. Cambiar el codigo del CMS para que lea de Supabase en lugar de los datos hardcodeados

---

## Resumen visual

```
AHORA (demo):
  Tu compu / Gitpod → CMS con datos mock → mostras al cliente

CUANDO TE PAGUEN:
  GitHub (codigo) → Cloudflare Pages → CMS en cms.rochasrotiseria.com
  GitHub (codigo) → Cloudflare Pages → Pagina en rochasrotiseria.com
  Supabase (base de datos) ← el CMS lee y escribe aca
  Spaceship (dominio) → apunta a Cloudflare
```

---

## Costos estimados

| Servicio            | Costo                              |
|---------------------|------------------------------------|
| Supabase            | Gratis (hasta 500MB)               |
| Cloudflare Pages    | Gratis (hasta 500 deploys/mes)     |
| Dominio .com        | ~USD 10-15 por ano (en Spaceship)  |
| Total primer ano    | ~USD 10-15                         |

---

## Preguntas frecuentes

**El cliente puede editar el menu sin saber programar?**
Si. Una vez conectado Supabase, cuando el cliente hace clic en "Guardar" en el CMS, los cambios se guardan en la base de datos y la pagina se actualiza.

**Necesito saber de servidores?**
No. Cloudflare Pages y Supabase son servicios gestionados. Vos solo subis el codigo.

**Puedo usar el mismo CMS para otros clientes?**
Si. El CMS ya esta preparado para multiples clientes. Cada uno tiene su usuario y contrasena, y solo ve sus propios datos.
