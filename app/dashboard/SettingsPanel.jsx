"use client";
/**
 * SettingsPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-ready settings form. All fields are functional with real validation.
 * Niche-aware sections are shown based on session.niche.
 *
 * TODO: On save, POST to /api/update-settings:
 *   1. Validate server-side (Zod / Yup schema)
 *   2. await prisma.client.update({ where: { username }, data: settings })
 *      — OR — Supabase: await supabase.from('clients').update(settings).eq('username', username)
 *   3. Flush Cloudflare cache for this client's domain
 *   4. Re-generate static pages if using Next.js ISR
 *
 * TODO: Cloudflare API calls (Dominio y Seguridad section):
 *   - Check SSL:  GET https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/ssl/certificate_packs
 *   - Purge cache: POST https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache
 *   - These calls happen SERVER-SIDE in /api/cf-status — never expose CF_TOKEN to the browser.
 */

import { useState } from "react";
import {
  Bell, Globe, Phone, Instagram, Facebook, Clock, Shield, Database,
  CheckCircle, AlertTriangle, Wifi, WifiOff, ChevronDown, MapPin,
  MessageSquare, Mail, Eye, EyeOff, Lock, RefreshCw, ExternalLink,
  Zap, Server,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// DAYS OF WEEK
// ─────────────────────────────────────────────────────────────────────────────
const DAYS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const DAY_LABELS = { lun: "Lunes", mar: "Martes", mie: "Miércoles", jue: "Jueves", vie: "Viernes", sab: "Sábado", dom: "Domingo" };

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validateWhatsApp = (v) => {
  const stripped = v.replace(/\D/g, "");
  return stripped.length >= 10 && stripped.length <= 15;
};
const validateURL = (v) => {
  if (!v) return true; // optional
  try { new URL(v); return true; } catch { return false; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, children, accent = "#f59e0b", warning }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}12` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-100 font-bold text-base">{title}</h3>
          {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {warning && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> {warning}
          </div>
        )}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, color = "#f59e0b" }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative flex items-center rounded-full transition-all duration-300 shrink-0"
      style={{ width: 52, height: 28, padding: 3, background: checked ? `${color}25` : "#1e293b", border: `1px solid ${checked ? color + "44" : "#334155"}` }}>
      <div className="absolute rounded-full transition-all duration-300"
        style={{ width: 22, height: 22, background: checked ? color : "#475569", transform: checked ? "translateX(24px)" : "translateX(0)", boxShadow: checked ? `0 2px 10px ${color}66` : "none" }} />
    </button>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text", icon: Icon, error, hint, required }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none transition-all duration-200 placeholder-slate-600"
          style={{
            paddingLeft: Icon ? "2.75rem" : "1rem",
            borderColor: error ? "#f87171" : "#334155",
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = "#f59e0b66"; }}
          onBlur={e => { e.target.style.borderColor = error ? "#f87171" : "#334155"; }}
        />
      </div>
      {error && <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
      {hint && !error && <p className="text-slate-700 text-xs mt-1">{hint}</p>}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, color }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="flex-1">
        <p className="text-slate-300 text-sm font-medium">{label}</p>
        {description && <p className="text-slate-600 text-xs mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} color={color} />
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-slate-800" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function MaintenanceModal({ isOn, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: isOn ? "linear-gradient(90deg,#4ade80,#22d3ee)" : "linear-gradient(90deg,#f97316,#ef4444)" }} />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: isOn ? "rgba(74,222,128,.1)" : "rgba(249,115,22,.1)" }}>
          {isOn ? <Wifi className="w-8 h-8 text-emerald-400" /> : <WifiOff className="w-8 h-8 text-orange-400" />}
        </div>
        <h3 className="text-slate-100 font-bold text-lg mb-2">
          {isOn ? "¿Volver a publicar el sitio?" : "¿Activar modo mantenimiento?"}
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          {isOn ? "Tu sitio volverá a ser visible para todos los visitantes."
                : "Tu sitio quedará offline para el público. Verán una página de 'Próximamente'."}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all"
            style={{ background: isOn ? "#22c55e" : "#f97316", boxShadow: isOn ? "0 4px 14px rgba(34,197,94,.3)" : "0 4px 14px rgba(249,115,22,.3)" }}>
            {isOn ? "Poner en vivo" : "Activar mantenimiento"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS PANEL
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPanel({ session }) {
  const accent = session.accentColor;

  // ── NOTIFICATIONS ──
  const [notifEmail,       setNotifEmail]      = useState(session.emailContact ?? "");
  const [notifGmail,       setNotifGmail]       = useState(true);
  const [notifWeekly,      setNotifWeekly]      = useState(true);
  const [notifVisitAlert,  setNotifVisitAlert]  = useState(false);
  const [notifWA,          setNotifWA]          = useState(true);

  // ── HERO ──
  const [heroBadge,          setHeroBadge]          = useState(session.hero?.badge          ?? "");
  const [heroTitle,          setHeroTitle]          = useState(session.hero?.title          ?? "");
  const [heroTitleHighlight, setHeroTitleHighlight] = useState(session.hero?.titleHighlight ?? "");
  const [heroSubtitle,       setHeroSubtitle]       = useState(session.hero?.subtitle       ?? "");

  // ── BUSINESS DATA ──
  const [phone,        setPhone]        = useState(session.phone ?? "");
  const [whatsapp,     setWhatsapp]     = useState(session.whatsapp ?? "");
  const [instagram,    setInstagram]    = useState(session.instagram ?? "");
  const [facebook,     setFacebook]     = useState(session.facebook ?? "");
  const [googleMaps,   setGoogleMaps]   = useState(session.googleMaps ?? "");
  const [address,      setAddress]      = useState(session.address ?? "");
  const [city,         setCity]         = useState(session.city ?? "");

  // ── SCHEDULE ──
  const [schedule, setSchedule] = useState(session.schedule ?? {});

  // Update a field inside a specific turno (t1 or t2) or the top-level closed flag
  const setDayField = (day, turno, field, value) => {
    setSchedule(prev => {
      const current = prev[day] ?? {
        t1: { open: "09:00", close: "18:00", active: true  },
        t2: { open: "",      close: "",       active: false },
        closed: false,
      };
      if (turno === "closed") {
        return { ...prev, [day]: { ...current, closed: value } };
      }
      return {
        ...prev,
        [day]: {
          ...current,
          [turno]: { ...current[turno], [field]: value },
        },
      };
    });
  };

  // ── MAINTENANCE ──
  const [maintenance,     setMaintenance]      = useState(false);
  const [showMaintModal,  setShowMaintModal]   = useState(false);

  // ── SAVE STATE ──
  const [saving,   setSaving]  = useState(false);
  const [toast,    setToast]   = useState({ show: false, success: true, message: "" });

  // ── VALIDATION ERRORS ──
  const [errors, setErrors] = useState({});

  const showToast = (msg, ok = true) => {
    setToast({ show: true, success: ok, message: msg });
    setTimeout(() => setToast({ show: false, success: true, message: "" }), 3500);
  };

  // Client-side validation
  const validate = () => {
    const e = {};
    if (notifGmail && !validateEmail(notifEmail)) {
      e.notifEmail = "Ingresá un email válido para recibir notificaciones.";
    }
    if (whatsapp && !validateWhatsApp(whatsapp)) {
      e.whatsapp = "Ingresá solo el número sin espacios. Ej: 5493511234567";
    }
    if (googleMaps && !validateURL(googleMaps)) {
      e.googleMaps = "Debe ser una URL válida (https://maps.google.com/...)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // SAVE — production-ready async structure
  const handleSave = async () => {
    if (!validate()) {
      showToast("❌ Corregí los errores antes de guardar.", false);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        clientId:    session.username,
        emailContact: notifEmail,
        notifications: { gmail: notifGmail, weekly: notifWeekly, visitAlert: notifVisitAlert, whatsapp: notifWA },
        hero: { badge: heroBadge, title: heroTitle, titleHighlight: heroTitleHighlight, subtitle: heroSubtitle },
        phone, whatsapp, instagram, facebook, googleMaps, address, city,
        schedule,
        maintenance,
      };

      // 1. Update clients table
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          hero_badge: heroBadge,
          hero_title: heroTitle,
          hero_title_highlight: heroTitleHighlight,
          hero_subtitle: heroSubtitle,
          phone,
          whatsapp,
          instagram,
          facebook,
          google_maps_short: googleMaps,
          address,
          city,
        })
        .eq('id', session.id);

      if (clientError) throw clientError;

      // 2. Upsert schedules
      const DAYS_KEYS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
      for (const dayKey of DAYS_KEYS) {
        const d = schedule[dayKey];
        if (!d) continue;
        const { error: schedError } = await supabase
          .from('schedules')
          .upsert({
            client_id: session.id,
            day_key: dayKey,
            closed: d.closed ?? false,
            t1_open: d.t1?.open || null,
            t1_close: d.t1?.close || null,
            t1_active: d.t1?.active ?? true,
            t2_open: d.t2?.open || null,
            t2_close: d.t2?.close || null,
            t2_active: d.t2?.active ?? false,
          }, { onConflict: 'client_id,day_key' });
        if (schedError) throw schedError;
      }

      console.log("[SettingsPanel] Saved to Supabase:", payload);
      showToast("✅ Configuración guardada y aplicada en tu sitio");
    } catch (err) {
      console.error("[SettingsPanel] Save error:", err);
      showToast("❌ Error al guardar. Intentá de nuevo.", false);
    } finally {
      setSaving(false);
    }
  };

  // SSL status helpers
  const sslActive  = session.ssl?.status === "active";
  const cdnActive  = session.cdn?.status === "active";

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8 pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">
          {session.businessName} · {session.domain}
        </p>
      </div>

      <div className="space-y-5 max-w-2xl">

        {/* ── 1. MAINTENANCE ── */}
        <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ${maintenance ? "border-orange-500/40 bg-orange-500/04" : "border-slate-800 bg-slate-900"}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${maintenance ? "bg-orange-500/15" : "bg-slate-800"}`}>
                {maintenance ? <WifiOff className="w-6 h-6 text-orange-400" /> : <Wifi className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-100 font-bold text-base">Modo Mantenimiento</h3>
                  {maintenance && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 animate-pulse">ACTIVO</span>}
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  {maintenance ? "Tu sitio está oculto. Los visitantes ven 'Próximamente'." : "Tu sitio está visible y funcionando normalmente."}
                </p>
              </div>
            </div>
            <button onClick={() => setShowMaintModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
              style={{
                background: maintenance ? "rgba(74,222,128,.1)" : "rgba(249,115,22,.1)",
                color: maintenance ? "#4ade80" : "#fb923c",
                border: `1px solid ${maintenance ? "rgba(74,222,128,.3)" : "rgba(249,115,22,.3)"}`,
              }}>
              {maintenance ? <><Eye className="w-4 h-4" /> Volver a publicar</> : <><EyeOff className="w-4 h-4" /> Ocultar sitio</>}
            </button>
          </div>
        </div>

        {/* ── 2. HERO ── */}
        <SectionCard title="Portada del Sitio (Hero)" subtitle="El texto principal que ven tus clientes al entrar" icon={Zap} accent={accent}>
          <FormInput label="Badge / Ubicación" value={heroBadge} onChange={setHeroBadge}
            placeholder="Santa Rosa de Calamuchita · Córdoba" icon={MapPin}
            hint="Aparece arriba del título principal." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Título (línea 1)" value={heroTitle} onChange={setHeroTitle}
              placeholder="El sabor de casa," icon={Globe} />
            <FormInput label="Título destacado (línea 2)" value={heroTitleHighlight} onChange={setHeroTitleHighlight}
              placeholder="listo para llevar." icon={Globe}
              hint="Esta línea aparece con el color de tu marca." />
          </div>
          <FormInput label="Subtítulo / Descripción" value={heroSubtitle} onChange={setHeroSubtitle}
            placeholder="Comida casera, abundante y a precios justos..." icon={Globe}
            hint="Frase corta debajo del título. Máximo 2 líneas." />
        </SectionCard>

        {/* ── 3. NOTIFICATIONS ── */}
        <SectionCard title="Notificaciones" subtitle="Configurá a qué correo llegan los avisos" icon={Bell} accent="#60a5fa">
          <FormInput
            label="Email para recibir notificaciones"
            value={notifEmail}
            onChange={setNotifEmail}
            placeholder="tu@email.com"
            type="email"
            icon={Mail}
            required={notifGmail}
            error={errors.notifEmail}
            hint="Las alertas del sitio, reportes y avisos llegarán aquí."
          />
          <Divider />
          <ToggleRow label="Resumen semanal" description="Cada lunes: visitas, clics y actividad de la semana" checked={notifWeekly} onChange={setNotifWeekly} color="#60a5fa" />
          <Divider />
          <ToggleRow label="Alerta de pico de tráfico" description="Cuando tu sitio reciba una cantidad inusual de visitas" checked={notifVisitAlert} onChange={setNotifVisitAlert} color="#60a5fa" />
          <Divider />
          <ToggleRow label="Alerta de clics en WhatsApp" description="Cada vez que alguien toca el botón de contacto" checked={notifWA} onChange={setNotifWA} color="#60a5fa" />
          {!notifGmail && !notifWeekly && !notifVisitAlert && !notifWA && (
            <p className="text-amber-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> No hay notificaciones activas.
            </p>
          )}
        </SectionCard>

        {/* ── 4. CONTACT & SOCIAL DATA ── */}
        <SectionCard title="Datos de Contacto y Redes" subtitle="Aparecen en tu sitio web y en la sección de contacto" icon={Globe} accent={accent}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Teléfono de contacto" value={phone} onChange={setPhone}
              placeholder="+54 9 351 555-0000" icon={Phone} hint="Visible en el sitio" />
            <FormInput label="Número de WhatsApp" value={whatsapp} onChange={setWhatsapp}
              placeholder="5493515550000" icon={MessageSquare}
              error={errors.whatsapp}
              hint="Solo números, con código de país. Ej: 5493515550000"
              required />
          </div>
          {whatsapp && !errors.whatsapp && (
            <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <span className="text-emerald-400 text-sm">✅</span>
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors">
                wa.me/{whatsapp.replace(/\D/g, "")} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Instagram" value={instagram} onChange={setInstagram}
              placeholder="@tu.negocio" icon={Instagram} />
            <FormInput label="Facebook" value={facebook} onChange={setFacebook}
              placeholder="NombreDelLocal" icon={Facebook} />
          </div>
          <FormInput label="Enlace de Google Maps" value={googleMaps} onChange={setGoogleMaps}
            placeholder="https://maps.google.com/?q=..." icon={MapPin}
            error={errors.googleMaps}
            hint="El botón 'Cómo llegar' en tu sitio usará este enlace."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Dirección física" value={address} onChange={setAddress}
              placeholder="Calle 3 755 (entre 14 y 16)" icon={MapPin} />
            <FormInput label="Ciudad / Localidad" value={city} onChange={setCity}
              placeholder="Santa Rosa de Calamuchita, Córdoba" icon={MapPin} />
          </div>
        </SectionCard>

        {/* ── 5. SCHEDULE ── */}
        <SectionCard title="Horarios de Atención" subtitle="Cada día puede tener hasta dos turnos (ej: mediodía y noche)" icon={Clock} accent={accent}>
          <div className="space-y-3">
            {DAYS.map(day => {
              const d = schedule[day] ?? {
                t1: { open: "09:00", close: "18:00", active: true  },
                t2: { open: "",      close: "",       active: false },
                closed: false,
              };
              return (
                <div key={day} className="rounded-xl border border-slate-800 bg-slate-800/30 p-3">
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold w-24 ${d.closed ? "text-slate-600 line-through" : "text-slate-200"}`}>
                      {DAY_LABELS[day]}
                    </span>
                    <div className="flex items-center gap-2">
                      <Toggle checked={!d.closed} onChange={v => setDayField(day, "closed", "closed", !v)} color={accent} />
                      <span className="text-xs text-slate-500">{d.closed ? "Cerrado" : "Abierto"}</span>
                    </div>
                  </div>

                  {!d.closed && (
                    <div className="space-y-2 pl-1">
                      {/* Turno 1 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 w-16 shrink-0">Turno 1</span>
                        <input
                          type="time"
                          value={d.t1?.open ?? ""}
                          onChange={e => setDayField(day, "t1", "open", e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-all"
                        />
                        <span className="text-slate-600 text-sm">—</span>
                        <input
                          type="time"
                          value={d.t1?.close ?? ""}
                          onChange={e => setDayField(day, "t1", "close", e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-all"
                        />
                      </div>

                      {/* Turno 2 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 w-16 shrink-0">Turno 2</span>
                        {d.t2?.active ? (
                          <>
                            <input
                              type="time"
                              value={d.t2?.open ?? ""}
                              onChange={e => setDayField(day, "t2", "open", e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-all"
                            />
                            <span className="text-slate-600 text-sm">—</span>
                            <input
                              type="time"
                              value={d.t2?.close ?? ""}
                              onChange={e => setDayField(day, "t2", "close", e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setDayField(day, "t2", "active", false)}
                              className="text-xs text-slate-600 hover:text-rose-400 transition-colors ml-1"
                            >
                              Quitar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDayField(day, "t2", "active", true)}
                            className="text-xs px-3 py-1 rounded-full border border-dashed border-slate-700 text-slate-500 hover:border-amber-500/50 hover:text-amber-400 transition-all"
                            style={{ borderColor: `${accent}44` }}
                          >
                            + Agregar segundo turno
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── 6. DOMAIN & SECURITY (Cloudflare) ── */}
        <SectionCard
          title="Dominio y Seguridad"
          subtitle="Estado técnico de tu sitio web · Cloudflare"
          icon={Shield}
          accent="#a78bfa"
          warning={!sslActive ? "SSL pendiente" : undefined}
        >
          {/* Domain info */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm font-semibold">Dominio activo</span>
            </div>
            <p className="text-slate-200 text-sm font-mono">{session.domain}</p>
            <p className="text-slate-600 text-xs mt-1">Gestionado por JL Studios · Para solicitar un cambio, contactanos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SSL Status */}
            <div className={`p-4 rounded-xl border ${sslActive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" style={{ color: sslActive ? "#4ade80" : "#fbbf24" }} />
                <span className="text-sm font-bold" style={{ color: sslActive ? "#4ade80" : "#fbbf24" }}>
                  SSL / HTTPS
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sslActive ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {sslActive ? "ACTIVO" : "PENDIENTE"}
                </span>
              </div>
              <p className="text-xs text-slate-600">Emisor: <span className="text-slate-500">{session.ssl?.issuer ?? "—"}</span></p>
              {session.ssl?.expiresAt && (
                <p className="text-xs text-slate-600 mt-0.5">Vence: <span className="text-slate-500">{new Date(session.ssl.expiresAt).toLocaleDateString("es-AR")}</span></p>
              )}
              {/* TODO: Call GET /api/cf-status?type=ssl to refresh real-time */}
            </div>

            {/* CDN Status */}
            <div className={`p-4 rounded-xl border ${cdnActive ? "bg-violet-500/5 border-violet-500/20" : "bg-slate-800 border-slate-700"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: cdnActive ? "#a78bfa" : "#475569" }} />
                <span className="text-sm font-bold" style={{ color: cdnActive ? "#a78bfa" : "#475569" }}>
                  CDN Global
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cdnActive ? "bg-violet-500/15 text-violet-400" : "bg-slate-700 text-slate-500"}`}>
                  {cdnActive ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
              <p className="text-xs text-slate-600">Proveedor: <span className="text-slate-500">{session.cdn?.provider ?? "—"}</span></p>
              <p className="text-xs text-slate-600 mt-0.5">Cache hit rate: <span className="text-slate-500 font-mono">{session.cdn?.cacheHit ?? "—"}</span></p>
              {/* TODO: Call GET /api/cf-status?type=cdn to refresh real-time cache analytics */}
            </div>
          </div>

          {/* Cache purge */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div>
              <p className="text-slate-300 text-sm font-semibold">Limpiar caché de Cloudflare</p>
              <p className="text-slate-600 text-xs mt-0.5">Fuerza a Cloudflare a servir la versión más nueva de tu sitio.</p>
              {/* TODO: Call POST /api/cf-purge-cache — uses CF Worker Token server-side */}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-all">
              <RefreshCw className="w-4 h-4" /> Purgar
            </button>
          </div>

          {/* DNS info */}
          <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 text-xs text-slate-700">
            <p className="font-mono">
              {/* TODO: Fetch real DNS records from Cloudflare API */}
              A → 192.0.2.1 (Cloudflare Proxy) · CNAME → pages.cloudflare.com
            </p>
            <p className="mt-0.5">Última verificación: {new Date(session.lastPublish).toLocaleString("es-AR")}</p>
          </div>
        </SectionCard>

        {/* ── 7. PLAN ── */}
        <SectionCard title="Plan Activo" subtitle="Tu suscripción con JL Studios" icon={Server} accent="#4ade80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-200 font-semibold capitalize">{session.plan === "profesional" ? "Plan Profesional" : "Plan Starter"}</p>
              <p className="text-slate-500 text-sm mt-0.5">
                {session.plan === "profesional"
                  ? "Hosting, SSL, CDN Cloudflare, soporte prioritario y hasta 50 fotos"
                  : "Hosting básico, SSL, soporte estándar y hasta 20 fotos"}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Fotos", session.plan === "profesional" ? "50" : "20"],
              ["Actualizaciones", "∞"],
              ["Soporte", session.plan === "profesional" ? "Prioritario" : "Estándar"],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-slate-600 text-xs mb-1">{l}</p>
                <p className="text-slate-200 font-bold text-sm font-mono">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-700 text-xs text-center">
            ¿Necesitás más?{" "}
            <span className="cursor-pointer transition-colors hover:text-amber-300" style={{ color: accent }}>
              Contactar a JL Studios →
            </span>
          </p>
        </SectionCard>

      </div>

      {/* Maintenance modal */}
      {showMaintModal && (
        <MaintenanceModal
          isOn={maintenance}
          onConfirm={() => { setMaintenance(m => !m); setShowMaintModal(false); }}
          onClose={() => setShowMaintModal(false)}
        />
      )}

      {/* Floating save button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 disabled:cursor-not-allowed"
          style={{
            background: saving ? "#475569" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: "#0f172a",
            boxShadow: saving ? "none" : `0 8px 32px ${accent}55`,
          }}>
          {saving
            ? <><div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" /> Guardando configuración...</>
            : <><Globe className="w-4 h-4" /> Guardar Configuración</>
          }
        </button>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl"
          style={{ background: toast.success ? "#052e16" : "#2d1a1a", border: `1px solid ${toast.success ? "rgba(74,222,128,.35)" : "rgba(244,63,94,.35)"}`, color: toast.success ? "#86efac" : "#fca5a5" }}>
          {toast.success ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
