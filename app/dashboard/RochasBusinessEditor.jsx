"use client";
/**
 * RochasBusinessEditor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Editor específico para Rocha's Rotisería. Permite editar:
 *   - Tarjetas "Por qué elegirnos" (why-cards)
 *   - Strip de rating (puntuación y frase)
 *
 * Solo se muestra cuando session.username === "rochas".
 * Se accede desde el nav como "Mi Negocio" (tab extra en DashboardLayout).
 *
 * TODO: On save, POST to /api/update-business:
 *   await supabase.from('why_cards').upsert(whyCards.map(c => ({ ...c, client_id: session.id })))
 *   await supabase.from('clients').update({ rating_score, rating_quote, rating_quote_body }).eq('id', session.id)
 */

import { useState } from "react";
import { Plus, Trash2, GripVertical, Star, CheckCircle, AlertTriangle } from "lucide-react";
import { ROCHAS_DATA } from "../../src/lib/rochas-data";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
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
      {success ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
      <span className="font-semibold text-sm">{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WHY CARD ROW
// ─────────────────────────────────────────────────────────────────────────────
function WhyCardRow({ card, index, accent, onChange, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl group">
      <div className="flex items-center gap-2 shrink-0 mt-1">
        <GripVertical className="w-4 h-4 text-slate-700 cursor-grab" />
        <span className="text-slate-600 text-xs font-mono w-4 text-center">{index + 1}</span>
      </div>

      {/* Emoji */}
      <input
        value={card.emoji}
        onChange={e => onChange(index, "emoji", e.target.value)}
        className="w-12 h-10 bg-slate-800 border border-slate-700 rounded-lg text-center text-xl focus:outline-none focus:border-amber-500/50 transition-all shrink-0"
      />

      {/* Title + Desc */}
      <div className="flex-1 space-y-2">
        <input
          value={card.title}
          onChange={e => onChange(index, "title", e.target.value)}
          placeholder="Título de la tarjeta"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500/50 transition-all placeholder-slate-600"
        />
        <textarea
          value={card.desc}
          onChange={e => onChange(index, "desc", e.target.value)}
          placeholder="Descripción breve..."
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-sm resize-none focus:outline-none focus:border-amber-500/50 transition-all placeholder-slate-600"
        />
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(index)}
        className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-500/15 text-slate-600 hover:text-rose-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 mt-1"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RochasBusinessEditor({ session }) {
  const accent = session.accentColor ?? "#ea580c";

  // Why cards state
  const [whyCards, setWhyCards] = useState(
    session.whyCards ?? ROCHAS_DATA.whyCards
  );

  // Rating state
  const [ratingScore,     setRatingScore]     = useState(session.rating?.score     ?? ROCHAS_DATA.rating.score);
  const [ratingQuote,     setRatingQuote]     = useState(session.rating?.quote     ?? ROCHAS_DATA.rating.quote);
  const [ratingQuoteBody, setRatingQuoteBody] = useState(session.rating?.quoteBody ?? ROCHAS_DATA.rating.quoteBody);

  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState({ show: false, success: true, message: "" });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, success: ok, message: msg });
    setTimeout(() => setToast({ show: false, success: true, message: "" }), 3500);
  };

  // Why card handlers
  const handleCardChange = (index, field, value) => {
    setWhyCards(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };
  const handleCardDelete = (index) => {
    setWhyCards(prev => prev.filter((_, i) => i !== index));
  };
  const handleCardAdd = () => {
    setWhyCards(prev => [...prev, { emoji: "✨", title: "Nueva ventaja", desc: "Describí por qué te eligen." }]);
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      /**
       * TODO: Replace simulation with real API call:
       * const res = await fetch("/api/update-business", {
       *   method: "POST",
       *   headers: { "Content-Type": "application/json" },
       *   body: JSON.stringify({
       *     clientId: session.username,
       *     whyCards,
       *     rating: { score: ratingScore, quote: ratingQuote, quoteBody: ratingQuoteBody },
       *   }),
       * });
       * if (!res.ok) throw new Error(await res.text());
       */
      await new Promise(r => setTimeout(r, 1200));
      showToast("✅ Cambios guardados correctamente");
    } catch {
      showToast("❌ Error al guardar. Intentá de nuevo.", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8 pb-28">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Mi Negocio</h1>
        <p className="text-slate-500 text-sm mt-1">
          {session.businessName} · Secciones de la página de inicio
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">

        {/* ── WHY CARDS ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accent}12` }}>
              <Star className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-100 font-bold text-base">Por qué elegirnos</h3>
              <p className="text-slate-500 text-xs mt-0.5">Las 6 tarjetas de la sección "Por qué elegirnos" de tu sitio</p>
            </div>
            <span className="text-slate-600 text-xs font-mono">{whyCards.length} tarjetas</span>
          </div>

          <div className="p-6 space-y-3">
            {whyCards.map((card, i) => (
              <WhyCardRow
                key={i}
                card={card}
                index={i}
                accent={accent}
                onChange={handleCardChange}
                onDelete={handleCardDelete}
              />
            ))}

            {whyCards.length < 8 && (
              <button
                onClick={handleCardAdd}
                className="w-full py-3 rounded-xl border border-dashed text-sm font-medium transition-all"
                style={{ borderColor: `${accent}33`, color: `${accent}99` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}66`; e.currentTarget.style.color = accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${accent}33`; e.currentTarget.style.color = `${accent}99`; }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Agregar tarjeta
              </button>
            )}
          </div>
        </div>

        {/* ── RATING STRIP ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accent}12` }}>
              <Star className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="text-slate-100 font-bold text-base">Franja de Puntuación</h3>
              <p className="text-slate-500 text-xs mt-0.5">La barra naranja con la puntuación y la frase destacada</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Preview */}
            <div className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
              style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent})` }}>
              <div>
                <div className="font-bold text-white text-4xl leading-none">{ratingScore || "9.2"}</div>
                <div className="text-orange-200 text-sm mt-1">★★★★★</div>
                <div className="text-white/60 text-xs mt-0.5">Puntuación local promedio</div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold text-sm">"{ratingQuote || "Tu frase aquí"}"</p>
                <p className="text-white/70 text-xs mt-1 line-clamp-2">{ratingQuoteBody}</p>
              </div>
            </div>

            {/* Fields */}
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                Puntuación (número)
              </label>
              <input
                value={ratingScore}
                onChange={e => setRatingScore(e.target.value)}
                placeholder="9.2"
                className="w-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                Frase destacada (entre comillas)
              </label>
              <input
                value={ratingQuote}
                onChange={e => setRatingQuote(e.target.value)}
                placeholder="La mejor relación calidad–precio de la zona"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                Texto de apoyo
              </label>
              <textarea
                value={ratingQuoteBody}
                onChange={e => setRatingQuoteBody(e.target.value)}
                rows={2}
                placeholder="Porciones generosas, precios justos..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm resize-none focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 disabled:cursor-not-allowed"
          style={{
            background: saving ? "#475569" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: "#0f172a",
            boxShadow: saving ? "none" : `0 8px 32px ${accent}44`,
          }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              Guardando...
            </span>
          ) : "Guardar cambios"}
        </button>
      </div>

      <Toast show={toast.show} success={toast.success} message={toast.message} />
    </div>
  );
}
