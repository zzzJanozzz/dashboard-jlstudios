"use client";
import { useState } from "react";
import {
  Eye, MousePointerClick, TrendingUp, Users, Globe, Activity,
  ArrowUpRight, ArrowDownRight, Smartphone, Share2, Clock, CheckCircle
} from "lucide-react";

// ─────────────────────────────────────────
//  MOCK ANALYTICS DATA
// ─────────────────────────────────────────
const WEEK_TRAFFIC = [
  { day: "Lun", visits: 38, clicks: 12 },
  { day: "Mar", visits: 52, clicks: 18 },
  { day: "Mié", visits: 47, clicks: 15 },
  { day: "Jue", visits: 61, clicks: 22 },
  { day: "Vie", visits: 89, clicks: 34 },
  { day: "Sáb", visits: 103, clicks: 41 },
  { day: "Hoy", visits: 74, clicks: 28 },
];

const RECENT_ACTIVITY = [
  { icon: "👁️",  text: "Alguien visitó tu página",            time: "hace 2 min",  type: "visit" },
  { icon: "📲",  text: "Clic en botón de WhatsApp",           time: "hace 5 min",  type: "cta" },
  { icon: "📲",  text: "Clic en botón de WhatsApp",           time: "hace 12 min", type: "cta" },
  { icon: "👁️",  text: "3 nuevas visitas desde Instagram",    time: "hace 18 min", type: "visit" },
  { icon: "🔗",  text: "Clic en enlace de Google Maps",       time: "hace 31 min", type: "map" },
  { icon: "📲",  text: "Clic en botón de WhatsApp",           time: "hace 45 min", type: "cta" },
  { icon: "👁️",  text: "Alguien visitó tu página",            time: "hace 1 hora", type: "visit" },
  { icon: "🔗",  text: "Compartieron tu página en Instagram", time: "hace 2 horas", type: "share" },
];

const TRAFFIC_SOURCES = [
  { label: "Google",    pct: 48, color: "#4ade80" },
  { label: "Instagram", pct: 31, color: "#fb923c" },
  { label: "WhatsApp",  pct: 14, color: "#34d399" },
  { label: "Directo",   pct: 7,  color: "#94a3b8" },
];

// ─────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend, trendUp, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend}
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
  const maxVal = Math.max(...data.map(d => d.visits));
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => {
        const isToday = d.day === "Hoy";
        const heightPct = (d.visits / maxVal) * 100;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full flex flex-col items-center justify-end h-24 gap-1 relative">
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-100 text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {d.visits} visitas
              </div>
              {/* Click bar (stacked) */}
              <div className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                style={{ height: `${(d.clicks / maxVal) * 100}%`, background: isToday ? accentColor : `${accentColor}40`, borderRadius: "4px 4px 0 0" }} />
              {/* Visit bar */}
              <div className="w-full transition-all duration-300 group-hover:opacity-80"
                style={{ height: `${((d.visits - d.clicks) / maxVal) * 100}%`, background: isToday ? `${accentColor}55` : "#1e293b", borderRadius: "0 0 4px 4px" }} />
            </div>
            <span className={`text-xs font-medium ${isToday ? "text-amber-400" : "text-slate-600"}`}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityBadge({ type }) {
  const map = { visit: "bg-blue-500/10 text-blue-400", cta: "bg-emerald-500/10 text-emerald-400", map: "bg-purple-500/10 text-purple-400", share: "bg-orange-500/10 text-orange-400" };
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${type === "visit" ? "bg-blue-400" : type === "cta" ? "bg-emerald-400" : type === "map" ? "bg-purple-400" : "bg-orange-400"}`} />;
}

// ─────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────
export default function DashboardHome({ session }) {
  const businessName = session?.businessName || session?.business_name || "Tu Negocio";
  const domain = session?.domain || "tu-negocio.surge.sh";
  const todayVisits = WEEK_TRAFFIC[WEEK_TRAFFIC.length - 1].visits;
  const todayClicks = WEEK_TRAFFIC[WEEK_TRAFFIC.length - 1].clicks;

  return (
    <div className="min-h-full bg-slate-950 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold">Tu sitio web está en vivo</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Buen día 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de actividad de <span className="text-slate-400 font-medium">{businessName}</span></p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Eye}              label="Visitas hoy"        value={todayVisits} sub="Usuarios únicos"         trend="+18% vs ayer" trendUp color="#60a5fa" />
        <KpiCard icon={MousePointerClick} label="Clics en contacto" value={todayClicks} sub="WhatsApp + Maps"          trend="+24% vs ayer" trendUp color="#4ade80" />
        <KpiCard icon={TrendingUp}        label="Visitas esta semana" value="464"        sub="Últimos 7 días"         trend="+12% vs semana ant." trendUp color="#f59e0b" />
        <KpiCard icon={Users}             label="Visitantes únicos" value="311"         sub="Esta semana"             trend="-3% vs semana ant." trendUp={false} color="#a78bfa" />
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
          <BarChart data={WEEK_TRAFFIC} />
        </div>

        {/* Traffic sources */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-slate-200 font-semibold mb-1">Fuentes de tráfico</h3>
          <p className="text-slate-600 text-xs mb-6">¿De dónde vienen tus visitas?</p>
          <div className="space-y-4">
            {TRAFFIC_SOURCES.map(s => (
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
              <p className="text-slate-600 text-xs mt-0.5">Lo que pasó en tu sitio hoy</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
                <ActivityBadge type={a.type} />
                <span className="text-sm text-slate-400 flex-1">{a.text}</span>
                <span className="text-xs text-slate-600 shrink-0 mt-0.5 font-medium">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device split + quick info */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-slate-200 font-semibold mb-1">Dispositivos</h3>
            <p className="text-slate-600 text-xs mb-5">Esta semana</p>
            <div className="space-y-4">
              {[
                { label: "Móvil",     pct: 73, icon: Smartphone, color: "#f59e0b" },
                { label: "Escritorio",pct: 21, icon: Activity,    color: "#60a5fa" },
                { label: "Tablet",    pct: 6,  icon: Globe,       color: "#a78bfa" },
              ].map(d => {
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
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-200 font-semibold text-sm">Tu sitio está al día</p>
                <p className="text-slate-500 text-xs mt-1">Última actualización publicada hace <span className="text-amber-400">2 días</span>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
