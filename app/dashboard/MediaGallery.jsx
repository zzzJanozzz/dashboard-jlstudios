"use client";
/**
 * MediaGallery.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * RELATIONAL media manager. Photos are bound to content items (products, services,
 * classes, etc.) — not a generic dump of images.
 *
 * Architecture:
 *  - gastronomia: each menu item has one photo slot + optional gallery
 *  - gimnasio:    fixed slots (Fachada, Sala Pesas, Cardio, Vestuarios) + instructor photos
 *  - estetica:    service photos + ambience gallery
 *  - servicios:   before/after photos per service + team photos
 *
 * TODO: Replace simulateUpload() with real object storage:
 *   Option A – Cloudflare R2 (recommended for this stack):
 *     const presigned = await fetch('/api/upload-url', { method: 'POST', body: JSON.stringify({ key, contentType }) })
 *     const { url, publicUrl } = await presigned.json()
 *     await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
 *     // save publicUrl to DB linked to itemId
 *
 *   Option B – AWS S3:
 *     const { url, fields } = await getSignedS3UploadUrl(key)
 *     const form = new FormData(); Object.entries(fields).forEach(([k,v])=>form.append(k,v)); form.append('file',file)
 *     await fetch(url, { method: 'POST', body: form })
 *
 *   Option C – Supabase Storage:
 *     const { data, error } = await supabase.storage.from('client-media').upload(key, file)
 *
 * TODO: After upload, save URL to DB:
 *   await prisma.mediaAsset.upsert({ where: { clientId_slotKey: { clientId, slotKey: item.id } }, update: { url }, create: { clientId, slotKey, url, type: 'image' } })
 */

import { useState, useRef, useCallback } from "react";
import { Upload, Trash2, Globe, CheckCircle, ImageOff, RefreshCw, AlertTriangle } from "lucide-react";
import { NICHE_SCHEMAS } from "./ContentManager";

// ─────────────────────────────────────────────────────────────────────────────
// NICHE-SPECIFIC FIXED SLOTS
// These slots always exist regardless of catalog items
// ─────────────────────────────────────────────────────────────────────────────
const FIXED_SLOTS = {
  gastronomia: [
    { key: "fachada",   label: "Foto de Fachada / Local",     desc: "Foto exterior del local, usada en la página de inicio." },
    { key: "salon",     label: "Interior del Salón",          desc: "Ambiente del salón. Aparece en la sección 'Quiénes Somos'." },
    { key: "logo",      label: "Logo del Negocio",            desc: "PNG con fondo transparente, mínimo 512x512px." },
    { key: "portada",   label: "Foto de Portada (Hero)",      desc: "Imagen principal de la web, 1920x1080px ideal." },
  ],
  gimnasio: [
    { key: "fachada",   label: "Foto de Fachada / Entrada",   desc: "Vista exterior del gimnasio." },
    { key: "pesas",     label: "Sala de Pesas / Musculación", desc: "Foto de la sala principal con equipamiento." },
    { key: "cardio",    label: "Sala de Cardio / Máquinas",   desc: "Foto de las máquinas de cardio." },
    { key: "vestuario", label: "Vestuarios / Instalaciones",  desc: "Muestra la calidad de las instalaciones." },
    { key: "logo",      label: "Logo del Gimnasio",           desc: "PNG con fondo transparente." },
    { key: "portada",   label: "Foto de Portada (Hero)",      desc: "Imagen principal de la web." },
  ],
  estetica: [
    { key: "fachada",   label: "Foto de Fachada / Entrada",   desc: "Vista exterior del salón." },
    { key: "interior",  label: "Interior del Salón",          desc: "Ambiente y decoración del local." },
    { key: "logo",      label: "Logo del Salón",              desc: "PNG con fondo transparente." },
    { key: "portada",   label: "Foto de Portada (Hero)",      desc: "Imagen principal de la web." },
  ],
  servicios: [
    { key: "equipo",    label: "Foto del Equipo / Vehículo",  desc: "Foto del equipo de trabajo o vehículo." },
    { key: "logo",      label: "Logo de la Empresa",          desc: "PNG con fondo transparente." },
    { key: "portada",   label: "Foto de Portada (Hero)",      desc: "Imagen principal de la web." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATED UPLOAD with stages (mimics real object-storage lifecycle)
// ─────────────────────────────────────────────────────────────────────────────
const simulateUpload = async (file, onProgress) => {
  // Stage 1: request pre-signed URL from our API
  // TODO: const { uploadUrl, publicUrl } = await fetch('/api/upload-url', {...}).then(r=>r.json())
  onProgress({ stage: "requesting", pct: 10, message: "Obteniendo URL de subida..." });
  await new Promise(r => setTimeout(r, 500));

  // Stage 2: upload to object storage (R2 / S3)
  // TODO: await fetch(uploadUrl, { method: 'PUT', body: file })
  for (let p = 10; p <= 80; p += 10) {
    onProgress({ stage: "uploading", pct: p, message: "Subiendo a Cloudflare R2..." });
    await new Promise(r => setTimeout(r, 120));
  }

  // Stage 3: confirm & save URL to DB
  // TODO: await fetch('/api/confirm-upload', { method: 'POST', body: JSON.stringify({ publicUrl, slotKey, clientId }) })
  onProgress({ stage: "saving", pct: 90, message: "Guardando en base de datos..." });
  await new Promise(r => setTimeout(r, 400));

  onProgress({ stage: "done", pct: 100, message: "¡Listo!" });

  // Return the local blob URL as a stand-in for the real CDN URL
  // TODO: return publicUrl  ← the actual Cloudflare R2 / S3 URL
  return URL.createObjectURL(file);
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD SLOT (single image slot with drag & drop)
// ─────────────────────────────────────────────────────────────────────────────
function UploadSlot({ slotKey, label, desc, currentUrl, accent, onUploaded, onRemove }) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(null);
  const [error,     setError]     = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file?.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes (JPG, PNG, WEBP).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await simulateUpload(file, p => setProgress(p));
      onUploaded(slotKey, url);
    } catch (e) {
      setError("Error al subir. Intentá de nuevo.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [slotKey, onUploaded]);

  const hasImage = !!currentUrl;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60">
        <p className="text-slate-200 font-semibold text-sm">{label}</p>
        <p className="text-slate-600 text-xs mt-0.5">{desc}</p>
      </div>

      {/* Image area */}
      <div className="p-4">
        {hasImage ? (
          <div className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Reemplazar
              </button>
              <button onClick={() => onRemove(slotKey)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
            {/* CDN badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-bold">CDN</span>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => !uploading && inputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer"
            style={{
              aspectRatio: "16/9",
              borderColor: dragging ? accent : "#334155",
              background: dragging ? `${accent}08` : "transparent",
            }}>
            <Upload className="w-6 h-6 mb-2 transition-colors" style={{ color: dragging ? accent : "#475569" }} />
            <p className="text-sm font-medium transition-colors" style={{ color: dragging ? accent : "#64748b" }}>
              {dragging ? "Soltá para subir" : "Subir foto"}
            </p>
            <p className="text-xs text-slate-700 mt-1">JPG, PNG o WEBP · Máx. 5MB</p>
          </div>
        )}

        {/* Upload progress */}
        {uploading && progress && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">{progress.message}</span>
              <span className="text-xs font-mono" style={{ color: accent }}>{progress.pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-200" style={{ width: `${progress.pct}%`, background: accent }} />
            </div>
            <p className="text-[10px] text-slate-700 mt-1">
              {/* TODO: Replace with: Conectado a Cloudflare R2 → bucket: jlstudios-media */}
              Simulando subida a Cloudflare R2 (conectar en producción)
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-rose-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => processFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG ITEM PHOTO SLOT
// For niche types where each catalog item has its own photo
// ─────────────────────────────────────────────────────────────────────────────
function ItemPhotoSlot({ item, accent, photoUrl, showWithoutPhoto, onUploaded, onToggleShow }) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file?.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await simulateUpload(file, p => setProgress(p));
      onUploaded(item.id, url);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [item.id, onUploaded]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex gap-0">
      {/* Item info */}
      <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base shrink-0">{item.emoji}</div>
        <div className="min-w-0 flex-1">
          <p className="text-slate-200 text-sm font-semibold truncate">{item.nombre}</p>
          <p className="text-slate-600 text-xs">{item.categoria || item.disciplina || item.tipo}</p>
        </div>
      </div>

      {/* Photo slot */}
      <div className="w-32 h-20 shrink-0 relative">
        {photoUrl ? (
          <div className="relative w-full h-full group">
            <img src={photoUrl} alt={item.nombre} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button onClick={() => inputRef.current?.click()} className="p-1.5 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white text-xs transition-all"><RefreshCw className="w-3 h-3" /></button>
              <button onClick={() => onUploaded(item.id, null)} className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs transition-all"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            style={{ background: dragging ? `${accent}10` : "#0f172a", borderLeft: "1px solid #1e293b" }}>
            <Upload className="w-4 h-4" style={{ color: dragging ? accent : "#334155" }} />
            <span className="text-[10px] mt-1" style={{ color: dragging ? accent : "#334155" }}>Subir</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => processFile(e.target.files?.[0])} />
      </div>

      {/* Show without photo toggle */}
      <div className="flex items-center px-4 border-l border-slate-800">
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => onToggleShow(item.id)}
            className="relative flex items-center rounded-full transition-all duration-300"
            style={{ width: 36, height: 20, padding: 2, background: showWithoutPhoto ? `${accent}20` : "#1e293b", border: `1px solid ${showWithoutPhoto ? accent + "44" : "#334155"}` }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: showWithoutPhoto ? accent : "#475569", transform: showWithoutPhoto ? "translateX(16px)" : "translateX(0)", transition: "all .3s" }} />
          </button>
          <span className="text-[9px] text-slate-700 text-center leading-tight">Mostrar<br />sin foto</span>
        </div>
      </div>

      {uploading && progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div className="h-full transition-all" style={{ width: `${progress.pct}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA GALLERY
// ─────────────────────────────────────────────────────────────────────────────
export default function MediaGallery({ session }) {
  const niche = session.niche;
  const accent = session.accentColor;
  const schema = NICHE_SCHEMAS[niche] ?? NICHE_SCHEMAS.gastronomia;
  const fixedSlots = FIXED_SLOTS[niche] ?? [];

  // State: fixed slot photos  { slotKey: url }
  const [slotPhotos,    setSlotPhotos]    = useState({});
  // State: item photos         { itemId: url }
  const [itemPhotos,    setItemPhotos]    = useState({});
  // State: which items show without photo
  const [showNoPhoto,   setShowNoPhoto]   = useState({});
  // Publish state
  const [publishing,    setPublishing]    = useState(false);
  const [toast,         setToast]         = useState({ show: false, success: true, message: "" });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, success: ok, message: msg });
    setTimeout(() => setToast({ show: false, success: true, message: "" }), 3500);
  };

  const handleSlotUploaded = (key, url) => {
    setSlotPhotos(p => ({ ...p, [key]: url }));
    showToast(`✅ "${fixedSlots.find(s => s.key === key)?.label}" actualizada`);
  };
  const handleSlotRemove   = (key) => setSlotPhotos(p => ({ ...p, [key]: null }));
  const handleItemPhoto    = (id, url) => {
    setItemPhotos(p => ({ ...p, [id]: url }));
    if (url) showToast("✅ Foto del ítem actualizada");
  };
  const handleToggleShow   = (id) => setShowNoPhoto(p => ({ ...p, [id]: !p[id] }));

  // Stats
  const filledSlots = Object.values(slotPhotos).filter(Boolean).length;
  const filledItems = Object.values(itemPhotos).filter(Boolean).length;
  const totalItems  = schema.mockItems.length;

  // PUBLISH
  const handlePublish = async () => {
    setPublishing(true);
    try {
      /**
       * TODO: Real publish:
       * const res = await fetch('/api/update-media', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ clientId: session.username, slotPhotos, itemPhotos, showNoPhoto }),
       * });
       * if (!res.ok) throw new Error(await res.text());
       *
       * TODO: Inside /api/update-media:
       *   1. Validate session
       *   2. Upsert media assets table in DB
       *   3. Flush Cloudflare cache for affected pages
       *   4. Trigger ISR revalidation if using Next.js
       */
      await new Promise(r => setTimeout(r, 1800));
      showToast("✅ Galería publicada en tu sitio web en vivo");
    } catch (e) {
      showToast("❌ Error al publicar. Intentá de nuevo.", false);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8 pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Fotos del Negocio</h1>
        <p className="text-slate-500 text-sm mt-1">{session.businessName} · Gestión relacional de imágenes</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Slots fijos cubiertos",    value: `${filledSlots} / ${fixedSlots.length}`, color: accent },
          { label: "Ítems con foto",           value: `${filledItems} / ${totalItems}`,        color: "#94a3b8" },
          { label: "Pendientes de foto",       value: totalItems - filledItems,                color: "#f59e0b" },
          { label: "Almacenamiento simulado",  value: "Cloudflare R2",                        color: "#4ade80" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <p className="font-bold text-lg mt-1 font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── SECTION 1: Fixed structural slots ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">Fotos estructurales del sitio</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {fixedSlots.map(slot => (
            <UploadSlot
              key={slot.key}
              slotKey={slot.key}
              label={slot.label}
              desc={slot.desc}
              currentUrl={slotPhotos[slot.key] ?? null}
              accent={accent}
              onUploaded={handleSlotUploaded}
              onRemove={handleSlotRemove}
            />
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Per-item photos ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            Fotos por {schema.itemLabel.toLowerCase()} (relacional)
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Storage info callout */}
        <div className="flex items-start gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 shrink-0 text-sm">☁️</div>
          <div>
            <p className="text-slate-300 text-sm font-semibold">Almacenamiento en la nube</p>
            <p className="text-slate-600 text-xs mt-0.5">
              Las fotos se suben directamente a <span className="text-slate-400 font-medium">Cloudflare R2</span> y se sirven
              desde CDN global. El bucket <span className="text-slate-500 font-mono text-[10px]">jlstudios-media/{session.username}/</span> se configurará al activar tu plan.
              {/* TODO: Link actual del bucket una vez configurado en Cloudflare Workers */}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {schema.mockItems.map(item => (
            <ItemPhotoSlot
              key={item.id}
              item={item}
              accent={accent}
              photoUrl={itemPhotos[item.id] ?? null}
              showWithoutPhoto={showNoPhoto[item.id] ?? false}
              onUploaded={handleItemPhoto}
              onToggleShow={handleToggleShow}
            />
          ))}
        </div>

        {/* Niche-specific extra instruction */}
        {niche === "gimnasio" && (
          <div className="mt-5 p-4 bg-slate-900 border border-cyan-500/15 rounded-xl">
            <p className="text-cyan-400 text-sm font-semibold mb-1">💡 Tip para Gimnasios</p>
            <p className="text-slate-600 text-xs">Subí fotos de los instructores en la sección de cada clase para aumentar la confianza de los nuevos alumnos. Formato recomendado: retrato 3:4, fondo neutro.</p>
          </div>
        )}
        {niche === "servicios" && (
          <div className="mt-5 p-4 bg-slate-900 border border-emerald-500/15 rounded-xl">
            <p className="text-emerald-400 text-sm font-semibold mb-1">💡 Tip para Servicios</p>
            <p className="text-slate-600 text-xs">Las fotos de "Antes y Después" son las que más conversiones generan. Subí un par por cada servicio principal.</p>
          </div>
        )}
      </div>

      {/* Floating publish */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button onClick={handlePublish} disabled={publishing}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm text-slate-900 shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: publishing ? "#475569" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow: publishing ? "none" : `0 8px 32px ${accent}55`,
          }}>
          {publishing
            ? <><div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" /> Sincronizando con R2 y DB...</>
            : <><Globe className="w-4 h-4" /> Guardar y Publicar Fotos</>
          }
        </button>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl"
          style={{ background: toast.success ? "#052e16" : "#2d1a1a", border: `1px solid ${toast.success ? "rgba(74,222,128,.35)" : "rgba(244,63,94,.35)"}`, color: toast.success ? "#86efac" : "#fca5a5" }}>
          {toast.success ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span>⚠</span>}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
