"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/src/lib/supabase";
import {
  Eye, MousePointerClick, TrendingUp, Users, Globe, Activity,
  ArrowUpRight, ArrowDownRight, Smartphone, CheckCircle,
  UtensilsCrossed, Tag, Star, AlertCircle, RefreshCw
} from "lucide-react";

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────
const ARG_TZ = "America/Argentina/Buenos_Aires";

function argNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: ARG_TZ }));
}

function startOfArgDay(daysAgo = 0) {
  const d = argNow();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function getGreeting() {
  const h = argNow().getHours();
  if (h < 12) return "Buen día";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function trend(cur, prev, label) {
  if (prev === 0 && cur === 0) return { text: "—", up: true };
  if (prev === 0) return { text: "+100% " + label, up: true };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { text: (pct >= 0 ? "+" : "") + pct + "% " + label, up: pct >= 0 };
}

function publishAgo(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days} día${days !== 1 ? "s" : ""}`;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CLICK_TYPES = ["whatsapp_click", "maps_click", "instagram_click", "facebook_click", "phone_click"];

const EVENT_META = {
  page_view:       { icon: "👁️",  text: "Visita a tu página",            badge: "visit" },
  whatsapp_click:  { icon: "📲",  text: "Clic en botón de WhatsApp",     badge: "cta" },
  maps_click:      { icon: "🔗",  text: "Clic en Google Maps",           badge: "map" },
  instagram_click: { icon: "📸",  text: "Clic en Instagram",             badge: "share" },
  facebook_click:  { icon: "👍",  text: "Clic en Facebook",              badge: "share" },
  phone_click:     { icon: "📞",  text: "Clic en teléfono",              badge: "cta" },
  share:           { icon: "🔗",  text: "Compartieron tu página",        badge: "share" },
};
const SOURCE_LABELS = { google: "Google", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook", direct: "Directo" };
const SOURCE_COLORS = { google: "#4ade80", instagram: "#fb923c", whatsapp: "#34d399", facebook: "#60a5fa", direct: "#94a3b8" };
const DEVICE_CONFIG = {
  mobile:  { label: "Móvil",      icon: Smartphone, color: "#f59e0b" },
  desktop: { label: "Escritorio", icon: Activity,    color: "#60a5fa" },
  tablet:  { label: "Tablet",     icon: Globe,       color: "#a78bfa" },
};

// ─────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend: trendObj, color, muted }) {
  const trendUp = trendObj?.up ?? true;
  const trendText = trendObj?.text ?? "—";
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trendText}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-bold text-slate-100 mt-1 font-mono">{value}</p>
        <p className="text-slate-600 text-xs mt-1">{sub}</p>
      </div>
    </div>
  );
}

function BarChart({ data, accentColor = "#f59e0b" }) {
  const maxVal = Math.max(...data.map(d => d.visits), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => {
        const isToday = d.day === "Hoy";
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full flex flex-col items-center justify-end h-24 gap-1 relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-100 text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {d.visits} visitas · {d.clicks} clics
              </div>
              <div className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                style={{ height: `${(d.clicks / maxVal) * 100}%`, background: isToday ? accentColor : `${accentColor}40`, borderRadius: "4px 4px 0 0", minHeight: d.clicks > 0 ? "4px" : 0 }} />
              <div className="w-full transition-all duration-300 group-hover:opacity-80"
                style={{ height: `${((d.visits - d.clicks) / maxVal) * 100}%`, background: isToday ? `${accentColor}55` : "#1e293b", borderRadius: "0 0 4px 4px", minHeight: d.visits > 0 ? "4px" : 0 }} />
            </div>
            <span className={`text-xs font-medium ${isToday ? "text-amber-400" : "text-slate-600"}`}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityBadge({ type }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${type === "visit" ? "bg-blue-400" : type === "cta" ? "bg-emerald-400" : type === "map" ? "bg-purple-400" : "bg-orange-400"}`} />;
}

// ─────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────
export default function DashboardHome({ session }) {
  const [loading, setLoading] = useState(true);
  const [events14d, setEvents14d] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const businessName = session?.businessName || session?.business_name || "Tu Negocio";
  const domain = session?.domain || "tu-negocio.com";
  const lastPublish = session?.lastPublish || null;

  // ── data loading ──
  useEffect(() => {
    if (!session?.id) { setLoading(false); return; }
    loadData();
  }, [session?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const since = startOfArgDay(14).toISOString();
      const [evRes, recRes, menuRes] = await Promise.allSettled([
        supabase.from("page_events").select("event_type, source, device, created_at")
          .eq("client_id", session.id).gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("page_events").select("event_type, source, device, created_at")
          .eq("client_id", session.id).order("created_at", { ascending: false }).limit(25),
        supabase.from("menu_items").select("id, categoria, activo, destacado, disponible")
          .eq("client_id", session.id),
      ]);
      if (evRes.status === "fulfilled" && !evRes.value.error) setEvents14d(evRes.value.data || []);
      if (recRes.status === "fulfilled" && !recRes.value.error) setRecentEvents(recRes.value.data || []);
      if (menuRes.status === "fulfilled" && !menuRes.value.error) setMenuItems(menuRes.value.data || []);
    } catch (e) {
      console.error("[DashboardHome] Error loading data:", e);
    }
    setLoading(false);
  }

  // ── computed analytics ──
  const a = useMemo(() => {
    const today = startOfArgDay(0);
    const yesterday = startOfArgDay(1);
    const weekStart = startOfArgDay(7);
    const prevWeekStart = startOfArgDay(14);

    const inRange = (e, from, to) => { const d = new Date(e.created_at); return d >= from && d < to; };
    const todayEv = events14d.filter(e => new Date(e.created_at) >= today);
    const yesterdayEv = events14d.filter(e => inRange(e, yesterday, today));
    const weekEv = events14d.filter(e => new Date(e.created_at) >= weekStart);
    const prevWeekEv = events14d.filter(e => inRange(e, prevWeekStart, weekStart));

    const countType = (arr, types) => arr.filter(e => types.includes(e.event_type)).length;

    const visitsToday = countType(todayEv, ["page_view"]);
    const visitsYday = countType(yesterdayEv, ["page_view"]);
    const clicksToday = countType(todayEv, CLICK_TYPES);
    const clicksYday = countType(yesterdayEv, CLICK_TYPES);
    const visitsWeek = countType(weekEv, ["page_view"]);
    const visitsPrevWeek = countType(prevWeekEv, ["page_view"]);
    const clicksWeek = countType(weekEv, CLICK_TYPES);
    const clicksPrevWeek = countType(prevWeekEv, CLICK_TYPES);

    // weekly chart
    const chart = [];
    for (let i = 6; i >= 0; i--) {
      const dStart = startOfArgDay(i);
      const dEnd = i === 0 ? new Date("2099-01-01") : startOfArgDay(i - 1);
      const dayEv = events14d.filter(e => inRange(e, dStart, dEnd));
      chart.push({
        day: i === 0 ? "Hoy" : DAY_NAMES[dStart.getDay()],
        visits: countType(dayEv, ["page_view"]),
        clicks: countType(dayEv, CLICK_TYPES),
      });
    }

    // traffic sources (this week)
    const srcCount = {};
    weekEv.forEach(e => { const s = e.source || "direct"; srcCount[s] = (srcCount[s] || 0) + 1; });
    const srcTotal = Object.values(srcCount).reduce((s, v) => s + v, 0) || 1;
    const sources = Object.entries(srcCount)
      .sort((a, b) => b[1] - a[1])
      .map(([src, count]) => ({
        label: SOURCE_LABELS[src] || src, pct: Math.round((count / srcTotal) * 100), color: SOURCE_COLORS[src] || "#94a3b8",
      }));

    // device breakdown (this week)
    const devCount = {};
    weekEv.forEach(e => { const d = e.device || "desktop"; devCount[d] = (devCount[d] || 0) + 1; });
    const devTotal = Object.values(devCount).reduce((s, v) => s + v, 0) || 1;
    const devices = Object.entries(devCount)
      .sort((a, b) => b[1] - a[1])
      .map(([dev, count]) => ({
        ...(DEVICE_CONFIG[dev] || { label: dev, icon: Globe, color: "#94a3b8" }),
        pct: Math.round((count / devTotal) * 100),
      }));

    return {
      visitsToday, visitsYday, clicksToday, clicksYday,
      visitsWeek, visitsPrevWeek, clicksWeek, clicksPrevWeek,
      chart, sources, devices,
      hasData: events14d.length > 0,
    };
  }, [events14d]);

  // ── content stats (always available) ──
  const content = useMemo(() => {
    const total = menuItems.length;
    const active = menuItems.filter(i => i.activo).length;
    const featured = menuItems.filter(i => i.destacado).length;
    const categories = [...new Set(menuItems.map(i => i.categoria))].length;
    return { total, active, featured, categories };
  }, [menuItems]);

  // ── loading state ──
  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 p-4 pt-16 md:pt-6 md:p-6 lg:p-8 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
      </div>
    );
  }

  const accentColor = session?.accentColor || "#f59e0b";
  const pubAgo = publishAgo(lastPublish);

  return (
    <div className="min-h-full bg-slate-950 p-4 pt-16 md:pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold">Tu sitio web está en vivo</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">{getGreeting()} 👋</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1">Resumen de actividad de <span className="text-slate-400 font-medium">{businessName}</span></p>
      </div>

      {/* Setup banner (when no analytics yet) */}
      {!a.hasData && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 font-semibold text-sm">Estadísticas pendientes de activar</p>
            <p className="text-amber-200/60 text-xs mt-1">
              Las métricas de visitas, clics y fuentes de tráfico se van a completar automáticamente cuando conectes la web de tu negocio.
              Mientras tanto, ya podés ver el resumen de tu contenido más abajo.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Eye}              label="Visitas hoy"          value={a.visitsToday}  sub="Páginas vistas"     trend={trend(a.visitsToday, a.visitsYday, "vs ayer")}    color="#60a5fa"  muted={!a.hasData} />
        <KpiCard icon={MousePointerClick} label="Clics en contacto"  value={a.clicksToday}  sub="WhatsApp + Maps"    trend={trend(a.clicksToday, a.clicksYday, "vs ayer")}    color="#4ade80"  muted={!a.hasData} />
        <KpiCard icon={TrendingUp}        label="Visitas esta semana" value={a.visitsWeek}  sub="Últimos 7 días"     trend={trend(a.visitsWeek, a.visitsPrevWeek, "vs sem. ant.")} color="#f59e0b" muted={!a.hasData} />
        <KpiCard icon={Users}             label="Clics esta semana"  value={a.clicksWeek}   sub="Últimos 7 días"     trend={trend(a.clicksWeek, a.clicksPrevWeek, "vs sem. ant.")} color="#a78bfa" muted={!a.hasData} />
      </div>

      {/* Content stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: UtensilsCrossed, label: "Platos en menú",    value: content.total,      color: accentColor },
          { icon: Tag,             label: "Categorías",         value: content.categories, color: "#60a5fa" },
          { icon: CheckCircle,     label: "Platos activos",     value: content.active,     color: "#4ade80" },
          { icon: Star,            label: "Destacados",         value: content.featured,   color: "#fbbf24" },
        ].map(c => {
          const CIcon = c.icon;
          return (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}15` }}>
                <CIcon className="w-4 h-4" style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100 font-mono">{c.value}</p>
                <p className="text-slate-500 text-xs">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-200 font-semibold">Tráfico semanal</h3>
              <p className="text-slate-600 text-xs mt-0.5">Visitas y clics de contacto</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded-sm bg-amber-500/40 inline-block" /> Visitas</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Contactos</span>
            </div>
          </div>
          {a.hasData ? (
            <BarChart data={a.chart} accentColor={accentColor} />
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm">
              Los datos del gráfico aparecerán cuando la web esté conectada.
            </div>
          )}
        </div>

        {/* Traffic sources */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-slate-200 font-semibold mb-1">Fuentes de tráfico</h3>
          <p className="text-slate-600 text-xs mb-6">¿De dónde vienen tus visitas?</p>
          {a.sources.length > 0 ? (
            <div className="space-y-4">
              {a.sources.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-400 text-sm font-medium">{s.label}</span>
                    <span className="text-slate-300 text-sm font-bold font-mono">{s.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 text-sm text-center py-6">Sin datos aún</div>
          )}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate">{domain}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity feed + device split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-200 font-semibold">Actividad reciente</h3>
              <p className="text-slate-600 text-xs mt-0.5">Lo que pasó en tu sitio</p>
            </div>
            {recentEvents.length > 0 && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((ev, i) => {
                const meta = EVENT_META[ev.event_type] || { icon: "❓", text: ev.event_type, badge: "visit" };
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
                    <ActivityBadge type={meta.badge} />
                    <span className="text-sm text-slate-400 flex-1">{meta.text}</span>
                    <span className="text-xs text-slate-600 shrink-0 mt-0.5 font-medium">{timeAgo(ev.created_at)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-slate-600 text-sm text-center py-10">
              Todavía no hay actividad registrada.<br/>
              <span className="text-slate-700 text-xs">Aparecerá acá cada visita y clic cuando la web esté conectada.</span>
            </div>
          )}
        </div>

        {/* Device split + site status */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-slate-200 font-semibold mb-1">Dispositivos</h3>
            <p className="text-slate-600 text-xs mb-5">Esta semana</p>
            {a.devices.length > 0 ? (
              <div className="space-y-4">
                {a.devices.map(d => {
                  const DIcon = d.icon;
                  return (
                    <div key={d.label} className="flex items-center gap-3">
                      <DIcon className="w-4 h-4 shrink-0" style={{ color: d.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-slate-500">{d.label}</span>
                          <span className="text-xs text-slate-400 font-bold">{d.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600 text-sm text-center py-4">Sin datos aún</div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-200 font-semibold text-sm">Tu sitio está al día</p>
                <p className="text-slate-500 text-xs mt-1">
                  {pubAgo
                    ? <>Última actualización publicada hace <span className="text-amber-400">{pubAgo}</span>.</>
                    : <>Publicá cambios desde el editor para actualizar tu web.</>
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
