"use client";
/**
 * ContentManager.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Niche-aware CRUD manager. The niche is derived exclusively from `session.niche`
 * — there is no UI to change it. Each client only ever sees their own schema.
 *
 * TODO: Replace MOCK_ITEMS with real DB reads:
 *   - Supabase: const { data } = await supabase.from('menu_items').select('*').eq('client_id', session.id)
 *   - Prisma:   const items = await prisma.menuItem.findMany({ where: { clientId: session.id } })
 */

import { useState, useEffect } from "react";
import { supabase, getAllMenuItems, getClientByUsername } from "@/src/lib/supabase";
import {
  Plus, Trash2, Edit3, Globe, CheckCircle, ChevronDown, Tag,
  Clock, User, Truck, Sparkles, Wrench, UtensilsCrossed, Dumbbell,
  Scissors, Package,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// NICHE SCHEMAS
// Each schema defines: display labels, fields, mock data, accent color.
// The `fields` array is the source of truth for both the table headers
// and the edit/create form inputs.
// ─────────────────────────────────────────────────────────────────────────────
export const NICHE_SCHEMAS = {

  gastronomia: {
    label:      "Restaurante / Gastronomía",
    Icon:       UtensilsCrossed,
    itemLabel:  "Plato",
    itemsLabel: "Menú y Productos",
    categoryField: "categoria",
    priceField:    "precio",
    fields: [
      { key: "nombre",    label: "Nombre del plato",   type: "text",     required: true,  placeholder: "Ej: Pizza Margarita" },
      { key: "categoria", label: "Categoría",          type: "select",   required: true,  options: ["Lomitos", "Hamburguesas", "Milanesas", "Pizzas", "Bebidas", "Entradas", "Postres", "Combos"] },
      { key: "precio",    label: "Precio ($)",         type: "price",    required: true,  placeholder: "0.00",  mono: true },
      { key: "desc",      label: "Descripción",        type: "textarea", required: false, placeholder: "Ingredientes, alérgenos, etc." },
      { key: "imageUrl",  label: "URL de la foto",     type: "text",     required: false, placeholder: "https://... (Supabase Storage o GitHub raw)" },
      { key: "destacado", label: "Plato destacado (badge en la web)", type: "toggle", required: false },
      { key: "disponible",label: "Disponible hoy",    type: "toggle",   required: false },
    ],
    extraColumns: ["categoria"],
    // Items genéricos de demo (se usan para otros clientes de nicho gastronomia)
    mockItems: [
      { id: 1, nombre: "Pizza Margarita",   categoria: "Pizzas",   precio: "8500",  desc: "Tomate artesanal, mozzarella fresca, albahaca.", imageUrl: "", destacado: true,  disponible: true,  emoji: "🍕", activo: true  },
      { id: 2, nombre: "Empanada de Carne", categoria: "Entradas", precio: "1800",  desc: "Masa a mano, carne a cuchillo, aceitunas.",      imageUrl: "", destacado: false, disponible: true,  emoji: "🥟", activo: true  },
      { id: 3, nombre: "Tiramisú Casero",   categoria: "Postres",  precio: "4200",  desc: "Mascarpone importado, bizcochuelo de amaretto.", imageUrl: "", destacado: false, disponible: false, emoji: "🍰", activo: false },
      { id: 4, nombre: "Limonada Natural",  categoria: "Bebidas",  precio: "2100",  desc: "Exprimida al momento, menta fresca.",            imageUrl: "", destacado: false, disponible: true,  emoji: "🍋", activo: true  },
      { id: 5, nombre: "Combo Familiar",    categoria: "Combos",   precio: "18900", desc: "2 pizzas grandes + 1.5L de bebida.",             imageUrl: "", destacado: true,  disponible: true,  emoji: "🎉", activo: true  },
    ],
  },

  gimnasio: {
    label:      "Gimnasio / Centro Deportivo",
    Icon:       Dumbbell,
    itemLabel:  "Clase",
    itemsLabel: "Clases y Horarios",
    categoryField: "disciplina",
    priceField:    "cuota",
    fields: [
      { key: "nombre",     label: "Nombre de la clase",    type: "text",   required: true,  placeholder: "Ej: CrossFit Avanzado" },
      { key: "disciplina", label: "Disciplina",            type: "select", required: true,  options: ["Cardio", "Musculación", "Yoga", "Pilates", "Crossfit", "Boxeo", "Spinning", "Natación"] },
      { key: "cuota",      label: "Cuota mensual ($)",     type: "price",  required: true,  placeholder: "0.00", mono: true },
      { key: "horario",    label: "Días y horario",        type: "text",   required: true,  placeholder: "Lun/Mié/Vie 07:00-08:00" },
      { key: "instructor", label: "Instructor",            type: "text",   required: true,  placeholder: "Nombre del instructor" },
      { key: "capacidad",  label: "Cupo máximo",          type: "number", required: false, placeholder: "20" },
      { key: "desc",       label: "Descripción",           type: "textarea",required: false,placeholder: "Nivel, equipamiento necesario..." },
      { key: "disponible", label: "Inscripciones abiertas",type: "toggle", required: false },
    ],
    extraColumns: ["disciplina", "instructor", "horario"],
    mockItems: [
      { id: 1, nombre: "CrossFit Avanzado", disciplina: "Crossfit",    cuota: "18000", horario: "Lun/Mié/Vie 06:00–07:30", instructor: "Carlos R.",  capacidad: "12", desc: "Alta intensidad. Requiere experiencia.", disponible: true,  emoji: "🏋️", activo: true  },
      { id: 2, nombre: "Yoga Flow",         disciplina: "Yoga",        cuota: "12000", horario: "Mar/Jue 09:00–10:30",      instructor: "Ana L.",      capacidad: "15", desc: "Todos los niveles. Trae tu mat.",       disponible: true,  emoji: "🧘", activo: true  },
      { id: 3, nombre: "Boxeo y Defensa",   disciplina: "Boxeo",       cuota: "15000", horario: "Lun/Mié 19:00–20:30",      instructor: "Marcos V.",   capacidad: "10", desc: "Técnica + sparring suave.",             disponible: false, emoji: "🥊", activo: false },
      { id: 4, nombre: "Pilates Reformer",  disciplina: "Pilates",     cuota: "20000", horario: "Mar/Vie 08:00–09:00",       instructor: "Sofía M.",   capacidad: "6",  desc: "Máquinas Reformer importadas.",         disponible: true,  emoji: "🤸", activo: true  },
    ],
  },

  estetica: {
    label:      "Salón de Belleza / Estética",
    Icon:       Scissors,
    itemLabel:  "Servicio",
    itemsLabel: "Servicios del Salón",
    categoryField: "categoria",
    priceField:    "precio",
    fields: [
      { key: "nombre",    label: "Nombre del servicio",  type: "text",   required: true,  placeholder: "Ej: Manicura Gel" },
      { key: "categoria", label: "Categoría",            type: "select", required: true,  options: ["Uñas", "Cabello", "Masajes", "Facial", "Depilación", "Maquillaje", "Combos"] },
      { key: "precio",    label: "Precio ($)",           type: "price",  required: true,  placeholder: "0.00", mono: true },
      { key: "duracion",  label: "Duración (minutos)",   type: "number", required: true,  placeholder: "60" },
      { key: "profesional",label: "Profesional a cargo", type: "text",   required: false, placeholder: "Nombre del/la profesional" },
      { key: "desc",      label: "Descripción",          type: "textarea",required: false,placeholder: "Materiales usados, cuidados post-servicio..." },
      { key: "reserva",   label: "Requiere turno previo",type: "toggle", required: false },
      { key: "disponible",label: "Disponible",           type: "toggle", required: false },
    ],
    extraColumns: ["categoria", "duracion", "profesional"],
    mockItems: [
      { id: 1, nombre: "Manicura Gel",        categoria: "Uñas",     precio: "6500",  duracion: "60",  profesional: "Lucía M.", desc: "Semipermanente de larga duración.",        reserva: true,  disponible: true,  emoji: "💅", activo: true  },
      { id: 2, nombre: "Corte + Brushing",    categoria: "Cabello",  precio: "8000",  duracion: "75",  profesional: "María P.", desc: "Lavado, corte y secado profesional.",      reserva: true,  disponible: true,  emoji: "💇", activo: true  },
      { id: 3, nombre: "Masaje Descontracturante",categoria:"Masajes",precio:"10000",  duracion: "60",  profesional: "Valeria G.",desc:"Aceites esenciales importados, 60 min.",   reserva: true,  disponible: true,  emoji: "🤲", activo: true  },
      { id: 4, nombre: "Diseño de Cejas",     categoria: "Facial",   precio: "3500",  duracion: "30",  profesional: "Sofía R.", desc: "Hilo, pinza y tinte opcional.",           reserva: false, disponible: true,  emoji: "✨", activo: true  },
      { id: 5, nombre: "Extensiones de Pelo", categoria: "Cabello",  precio: "35000", duracion: "240", profesional: "María P.", desc: "Extensiones naturales con queratina.",    reserva: true,  disponible: false, emoji: "👑", activo: false },
    ],
  },

  servicios: {
    label:      "Servicios del Hogar / Comerciales",
    Icon:       Wrench,
    itemLabel:  "Servicio",
    itemsLabel: "Catálogo de Servicios",
    categoryField: "tipo",
    priceField:    "precio",
    fields: [
      { key: "nombre",    label: "Nombre del servicio", type: "text",   required: true,  placeholder: "Ej: Destape de cañerías" },
      { key: "tipo",      label: "Tipo de servicio",    type: "select", required: true,  options: ["Plomería", "Electricidad", "Pintura", "Fletes", "Limpieza", "Mudanzas", "Jardinería", "Otros"] },
      { key: "precio",    label: "Precio desde ($)",    type: "price",  required: true,  placeholder: "0.00", mono: true },
      { key: "zona",      label: "Zona de cobertura",   type: "text",   required: true,  placeholder: "Ej: Córdoba Capital y GBA" },
      { key: "urgencia",  label: "Servicio 24hs / Urgencias", type: "toggle", required: false },
      { key: "presupuesto",label: "Presupuesto sin cargo",type: "toggle",required: false },
      { key: "desc",      label: "Descripción detallada",type: "textarea",required: false,placeholder: "Incluye materiales, garantía, etc." },
      { key: "disponible",label: "Disponible",          type: "toggle", required: false },
    ],
    extraColumns: ["tipo", "zona", "urgencia"],
    mockItems: [
      { id: 1, nombre: "Destape de Cañerías",    tipo: "Plomería",    precio: "5000",  zona: "Córdoba Capital", urgencia: true,  presupuesto: true,  desc: "Con equipos de alta presión. Incluye inspección.", disponible: true,  emoji: "🔧", activo: true  },
      { id: 2, nombre: "Instalación Eléctrica",  tipo: "Electricidad",precio: "8000",  zona: "Gran Córdoba",    urgencia: false, presupuesto: true,  desc: "Matriculado. Certificado al finalizar.",           disponible: true,  emoji: "⚡", activo: true  },
      { id: 3, nombre: "Flete Urbano",           tipo: "Fletes",      precio: "15000", zona: "Córdoba y alred.",urgencia: false, presupuesto: false, desc: "Camioneta doble cabina. Ayudante incluido.",       disponible: true,  emoji: "🚚", activo: true  },
      { id: 4, nombre: "Pintura Interior",       tipo: "Pintura",     precio: "12000", zona: "Córdoba Capital", urgencia: false, presupuesto: true,  desc: "Por ambiente (hasta 15m²). Incluye materiales.",   disponible: false, emoji: "🎨", activo: false },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ show, success, message }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl"
      style={{
        background: success ? "#052e16" : "#2d1a1a",
        border: `1px solid ${success ? "rgba(74,222,128,.35)" : "rgba(244,63,94,.35)"}`,
        color: success ? "#86efac" : "#fca5a5",
      }}>
      {success ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span className="text-rose-400">⚠</span>}
      <span className="font-semibold text-sm">{message}</span>
    </div>
  );
}

function FloatingPublishBtn({ onClick, loading, accent }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <button onClick={onClick} disabled={loading}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 disabled:cursor-not-allowed"
        style={{
          background: loading ? "#475569" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          color: "#0f172a",
          boxShadow: loading ? "none" : `0 8px 32px ${accent}55`,
        }}>
        {loading ? (
          <><div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />Sincronizando con servidor...</>
        ) : (
          <><Globe className="w-4 h-4" />Guardar y Publicar en Vivo</>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD RENDERER (form inputs)
// ─────────────────────────────────────────────────────────────────────────────
function FieldInput({ field, value, onChange, accent }) {
  const base = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder-slate-600";
  const focusStyle = { borderColor: `${accent}99`, boxShadow: `0 0 0 3px ${accent}15` };

  if (field.type === "toggle") {
    const checked = !!value;
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-slate-300 text-sm font-medium">{field.label}</span>
        <button onClick={() => onChange(!checked)}
          className="relative flex items-center rounded-full transition-all duration-300"
          style={{ width: 52, height: 28, padding: 3, background: checked ? `${accent}30` : "#1e293b", border: `1px solid ${checked ? accent + "50" : "#334155"}` }}>
          <div className="absolute rounded-full transition-all duration-300"
            style={{ width: 22, height: 22, background: checked ? accent : "#475569", transform: checked ? "translateX(24px)" : "translateX(0)", boxShadow: checked ? `0 2px 10px ${accent}77` : "none" }} />
        </button>
      </div>
    );
  }

  if (field.type === "combo") {
    const datalistId = `field-options-${field.key}`;
    return (
      <>
        <input
          list={datalistId}
          type="text"
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => { e.target.style.borderColor = "#334155"; e.target.style.boxShadow = "none"; }}
          className={base}
          required={field.required}
        />
        <datalist id={datalistId}>
          {field.options.map(o => <option key={o} value={o} />)}
        </datalist>
      </>
    );
  }

  if (field.type === "select") {
    return (
      <select value={value ?? ""} onChange={e => onChange(e.target.value)}
        onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => { e.target.style.borderColor = "#334155"; e.target.style.boxShadow = "none"; }}
        className={base + " cursor-pointer"}
        style={{ background: "#1e293b" }}>
        <option value="" disabled>Seleccioná una opción</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea value={value ?? ""} rows={3} placeholder={field.placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => { e.target.style.borderColor = "#334155"; e.target.style.boxShadow = "none"; }}
        className={base + " resize-none"} />
    );
  }

  const isPrice = field.type === "price";
  return (
    <div className="relative">
      {isPrice && <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: accent }}>$</span>}
      <input
        type={field.type === "price" || field.type === "number" ? "text" : "text"}
        value={value ?? ""} placeholder={field.placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => { e.target.style.borderColor = "#334155"; e.target.style.boxShadow = "none"; }}
        className={base + (isPrice ? " pl-8 font-mono font-semibold" : "") + (field.mono ? " font-mono" : "")}
        style={isPrice ? { color: accent } : {}}
        required={field.required}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT / CREATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ItemModal({ item, schema, accent, categoryOptions, onSave, onClose }) {
  const isNew = !item.id;
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const categoryFieldKey = schema.categoryField;
  const normalizedFields = schema.fields.map(field => {
    if (field.key !== categoryFieldKey) return field;
    return {
      ...field,
      type: "combo",
      options: categoryOptions,
      placeholder: field.placeholder ?? "Escribí una categoría nueva o elegí una existente",
    };
  });

  // Separate toggle fields from regular fields for layout
  const regularFields = normalizedFields.filter(f => f.type !== "toggle");
  const toggleFields  = normalizedFields.filter(f => f.type === "toggle");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{ animation: "fadeIn .2s ease forwards" }}>
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}77, ${accent})` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-slate-100 font-bold text-lg">
              {isNew ? `Nuevo ${schema.itemLabel}` : `Editar ${schema.itemLabel}`}
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              {isNew ? "Completá los campos para agregar al catálogo." : "Modificá los datos y guardá los cambios."}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all">✕</button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Emoji row */}
          <div className="flex gap-3 items-start">
            <div className="w-24 shrink-0">
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Emoji</label>
              <input value={form.emoji ?? "📦"} onChange={e => set("emoji", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 text-center text-2xl focus:outline-none focus:border-amber-500/50 transition-all" />
            </div>
            <div className="flex-1">
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Nombre *</label>
              <FieldInput field={normalizedFields.find(f => f.key === "nombre")} value={form.nombre} onChange={v => set("nombre", v)} accent={accent} />
            </div>
          </div>

          {/* All other non-toggle fields */}
          {regularFields.filter(f => f.key !== "nombre").map(field => (
            <div key={field.key}>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                {field.label} {field.required && <span style={{ color: accent }}>*</span>}
              </label>
              <FieldInput field={field} value={form[field.key]} onChange={v => set(field.key, v)} accent={accent} />
            </div>
          ))}

          {/* Toggle fields */}
          {toggleFields.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              {toggleFields.map(f => (
                <FieldInput key={f.key} field={f} value={form[f.key]} onChange={v => set(f.key, v)} accent={accent} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all">
            Cancelar
          </button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-xl text-slate-900 text-sm font-bold transition-all shadow-lg"
            style={{ background: accent, boxShadow: `0 4px 14px ${accent}44` }}>
            {isNew ? "Crear" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM ROW (table row)
// ─────────────────────────────────────────────────────────────────────────────
function ItemRow({ item, schema, accent, onEdit, onDelete, onToggleActive }) {
  const priceVal = item[schema.priceField];
  const categoryVal = item[schema.categoryField];

  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.nombre}
              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700"
              onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div
            className="w-10 h-10 rounded-lg bg-slate-800 items-center justify-center text-lg shrink-0"
            style={{ display: item.imageUrl ? "none" : "flex" }}
          >
            {item.emoji}
          </div>
          <div>
            <p className="text-slate-200 font-semibold text-sm">{item.nombre}</p>
            {item.desc && <p className="text-slate-600 text-xs mt-0.5 truncate max-w-50">{item.desc}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">{categoryVal}</span>
      </td>
      {schema.extraColumns.filter(c => c !== schema.categoryField).map(col => (
        <td key={col} className="px-4 py-3.5 text-slate-500 text-sm">
          {typeof item[col] === "boolean" ? (
            item[col]
              ? <span className="text-xs font-bold text-emerald-400">✓ Sí</span>
              : <span className="text-xs text-slate-700">—</span>
          ) : (item[col] || "—")}
        </td>
      ))}
      <td className="px-4 py-3.5">
        <span className="font-mono font-bold text-sm" style={{ color: accent }}>
          ${Number(priceVal || 0).toLocaleString("es-AR")}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <button onClick={() => onToggleActive(item.id)}
          className="relative flex items-center rounded-full transition-all duration-300"
          style={{ width: 44, height: 24, padding: 3, background: item.activo ? "rgba(74,222,128,.2)" : "#1e293b", border: `1px solid ${item.activo ? "#4ade8066" : "#334155"}` }}>
          <div className="absolute rounded-full transition-all duration-300"
            style={{ width: 18, height: 18, background: item.activo ? "#4ade80" : "#475569", transform: item.activo ? "translateX(20px)" : "translateX(0)", boxShadow: item.activo ? "0 0 8px rgba(74,222,128,.5)" : "none" }} />
        </button>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: `${accent}18`, color: accent }}
            onMouseEnter={e => e.currentTarget.style.background = `${accent}30`}
            onMouseLeave={e => e.currentTarget.style.background = `${accent}18`}>
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(item.id)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT MANAGER
// ─────────────────────────────────────────────────────────────────────────────
export default function ContentManager({ session }) {
  // Derive schema from session — immutable for this user
  const schema = NICHE_SCHEMAS[session.niche] ?? NICHE_SCHEMAS.gastronomia;
  const SchemaIcon = schema.Icon;
  const accent = session.accentColor;

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [filterCat,   setFilterCat]   = useState("Todos");
  const [editingItem, setEditingItem] = useState(null);
  const [publishing,  setPublishing]  = useState(false);
  const [toast,       setToast]       = useState({ show: false, success: true, message: "" });

  const showToast = (message, success = true) => {
    setToast({ show: true, success, message });
    setTimeout(() => setToast({ show: false, success: true, message: "" }), 3500);
  };

  // Resolver client ID (puede venir de session.id o buscarse por username)
  const [clientId, setClientId] = useState(session?.id || null);

  useEffect(() => {
    const resolveClientId = async () => {
      if (session?.id) {
        setClientId(session.id);
        return;
      }
      // Fallback: buscar por username si session.id no existe
      if (session?.username) {
        console.log("🔍 [ContentManager] session.id falta, buscando por username:", session.username);
        const client = await getClientByUsername(session.username);
        if (client?.id) {
          setClientId(client.id);
          console.log("✅ client_id resuelto:", client.id);
        } else {
          console.error("❌ No se pudo resolver client_id para:", session.username);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    resolveClientId();
  }, [session?.id, session?.username]);

  // Cargar items de Supabase al montar
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        console.log("🔍 [ContentManager] Cargando items para clientId:", clientId);
        const data = await getAllMenuItems(clientId);
        setItems(data || []);
        console.log("✅ Items cargados de Supabase:", data?.length);
      } catch (error) {
        console.error("❌ Error cargando items:", error);
        showToast("Error al cargar el menú", false);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadItems();
    }
  }, [clientId]);

  // CRUD handlers
  const handleSave = async (updated) => {
    try {
      setSyncing(true);

      const normalizedCategory = (updated[schema.categoryField] ?? "").trim();
      const normalizedPrice = updated[schema.priceField];

      if (!updated.id || typeof updated.id === 'number') {
        // INSERT nuevo item
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            client_id: clientId,
            nombre: updated.nombre,
            categoria: normalizedCategory,
            precio: parseFloat(normalizedPrice),
            descripcion: updated.desc,
            image_url: updated.imageUrl || null,
            emoji: updated.emoji || '✨',
            activo: updated.activo !== false,
            destacado: !!updated.destacado,
            disponible: updated.disponible !== false,
            sort_order: items.length + 1,
          })
          .select()
          .single();

        if (error) throw error;

        // Recargar items para obtener IDs reales de BD
        const fresh = await getAllMenuItems(clientId);
        setItems(fresh);
        showToast("✅ Item creado y guardado en la BD");
      } else {
        // UPDATE item existente
        const { error } = await supabase
          .from('menu_items')
          .update({
            nombre: updated.nombre,
            categoria: normalizedCategory,
            precio: parseFloat(normalizedPrice),
            descripcion: updated.desc,
            image_url: updated.imageUrl,
            emoji: updated.emoji,
            activo: updated.activo,
            destacado: updated.destacado,
            disponible: updated.disponible,
          })
          .eq('id', updated.id)
          .eq('client_id', clientId);

        if (error) throw error;

        // Actualizar estado local
        setItems(prev =>
          prev.map(it => it.id === updated.id ? { ...it, ...updated } : it)
        );
        showToast("✅ Cambios guardados en la BD");
      }

      setEditingItem(null);
    } catch (error) {
      console.error("Error guardando item:", error);
      showToast("❌ Error al guardar. Intentá de nuevo.", false);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que querés eliminar este item?")) return;

    try {
      setSyncing(true);

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;

      setItems(prev => prev.filter(it => it.id !== id));
      showToast("✅ Item eliminado de la BD");
    } catch (error) {
      console.error("Error eliminando item:", error);
      showToast("❌ Error al eliminar", false);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const item = items.find(it => it.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('menu_items')
        .update({ activo: !item.activo })
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;

      setItems(prev =>
        prev.map(it => it.id === id ? { ...it, activo: !it.activo } : it)
      );
    } catch (error) {
      console.error("Error actualizando estado:", error);
      showToast("❌ Error al actualizar", false);
    }
  };

  const openNew           = () => setEditingItem({ activo: true, disponible: true, emoji: "✨" });
  const openEdit          = (item) => setEditingItem({ ...item });

  // PUBLISH — production-ready async structure
  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Update last_publish timestamp in Supabase
      const { error } = await supabase
        .from('clients')
        .update({ last_publish: new Date().toISOString() })
        .eq('id', clientId);

      if (error) throw error;

      // TODO: Flush Cloudflare cache when CF API is configured
      showToast("✅ Cambios publicados en tu sitio web en vivo");
    } catch (err) {
      console.error("[ContentManager] Publish error:", err);
      showToast("❌ Error al publicar. Intentá de nuevo.", false);
    } finally {
      setPublishing(false);
    }
  };

  const baseCategoryOptions = schema.fields.find(f => f.key === schema.categoryField)?.options ?? [];
  const dbCategoryOptions = [...new Set(items.map(i => i[schema.categoryField]).filter(Boolean))];
  const categoryOptions = [...new Set([...baseCategoryOptions, ...dbCategoryOptions])].sort((a, b) => a.localeCompare(b, "es"));
  const cats = ["Todos", ...categoryOptions];
  const filtered = filterCat === "Todos" ? items : items.filter(it => it[schema.categoryField] === filterCat);
  const activeCount = items.filter(i => i.activo).length;

  // Table extra columns (excluding categoryField which always shows)
  const extraCols = schema.extraColumns.filter(c => c !== schema.categoryField);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando menú desde Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
            <SchemaIcon className="w-6 h-6" style={{ color: accent }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{schema.itemsLabel}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{session.businessName} · {schema.label}</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{ background: accent, color: "#0f172a", boxShadow: `0 4px 16px ${accent}44` }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          <Plus className="w-4 h-4" /> Agregar {schema.itemLabel}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: `${schema.itemsLabel.split(" ")[0]} activos`, value: activeCount, color: accent },
          { label: "Total en catálogo",  value: items.length,                            color: "#94a3b8" },
          { label: "Categorías",         value: [...new Set(items.map(i => i[schema.categoryField]))].length, color: "#64748b" },
          { label: "Inactivos / ocultos",value: items.length - activeCount,               color: "#475569" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
            <p className="font-bold text-2xl mt-1 font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
            style={filterCat === cat
              ? { background: accent, color: "#0f172a" }
              : { background: "#1e293b", color: "#64748b" }}>
            {cat}
            {cat !== "Todos" && (
              <span className="ml-1.5 opacity-60 text-xs">({items.filter(i => i[schema.categoryField] === cat).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {schema.itemLabel}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {schema.fields.find(f => f.key === schema.categoryField)?.label ?? "Categoría"}
              </th>
              {extraCols.map(col => (
                <th key={col} className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {schema.fields.find(f => f.key === col)?.label ?? col}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {schema.fields.find(f => f.key === schema.priceField)?.label ?? "Precio"}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Estado</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6 + extraCols.length} className="px-4 py-12 text-center text-slate-600 text-sm">
                No hay {schema.itemsLabel.toLowerCase()} en esta categoría. <button onClick={openNew} className="underline" style={{ color: accent }}>Agregar uno</button>
              </td></tr>
            ) : (
              filtered.map(item => (
                <ItemRow key={item.id} item={item} schema={schema} accent={accent}
                  onEdit={openEdit} onDelete={handleDelete} onToggleActive={handleToggleActive} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editingItem && (
        <ItemModal item={editingItem} schema={schema} accent={accent} categoryOptions={categoryOptions} onSave={handleSave} onClose={() => setEditingItem(null)} />
      )}

      <FloatingPublishBtn onClick={handlePublish} loading={publishing} accent={accent} />
      <Toast show={toast.show} success={toast.success} message={toast.message} />
    </div>
  );
}