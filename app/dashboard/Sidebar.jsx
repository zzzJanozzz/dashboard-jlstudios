"use client";
import { Home, ClipboardList, Images, Settings, ChevronLeft, LogOut, Globe, Zap } from "lucide-react";

const NAV = [
  { id: "inicio",  label: "Inicio",       icon: Home,          badge: null },
  { id: "content", label: "Editar Contenido", icon: ClipboardList, badge: "4" },
  { id: "fotos",   label: "Fotos",        icon: Images,        badge: null },
  { id: "config",  label: "Configuración",icon: Settings,      badge: null },
];

export default function Sidebar({ collapsed, setCollapsed, activePage, setActivePage, clientData = {} }) {
  const { nombre = "Mi Negocio", emoji = "🍕", dominio = "mi-negocio.surge.sh", usuario = "cliente" } = clientData;

  return (
    <aside
      className="relative flex flex-col shrink-0 bg-slate-900 border-r border-slate-800/60 transition-all duration-300 ease-in-out overflow-hidden"
      style={{ width: collapsed ? 72 : 260 }}
    >
      {/* Top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bgbg-linear-to-rrom-amber-500 via-orange-400 to-amber-500 opacity-90" />

      {/* Logo area */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800/60">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Zap className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <p className="text-slate-100 font-bold text-sm tracking-wide leading-none">JL Studios</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">Panel de Cliente</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft
            className="w-3.5 h-3.5 transition-transform duration-300"
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>

      {/* Business card */}
      {!collapsed ? (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-rose-400 to-pink-600 flex items-center justify-center text-xl shrink-0">{emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 font-semibold text-sm leading-none truncate">{nombre}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" style={{ animation: "pulse 2s infinite" }} />
                <span className="text-emerald-400 text-xs font-medium">Sitio en vivo</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-4">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-rose-400 to-pink-600 flex items-center justify-center text-xl">{emoji}</div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 mt-2">
        {!collapsed && (
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pb-2">Navegación</p>
        )}
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative"
              style={{
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                color: active ? "#fbbf24" : "#64748b",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#cbd5e1"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-amber-400" />
              )}
              <Icon className="w-5 h-5 shrink-0" style={{ color: active ? "#fbbf24" : "currentColor" }} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Domain quick link */}
      {!collapsed && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <a href={`https://${dominio}`} target="_blank" rel="noopener noreferrer"
            className="text-slate-500 text-xs hover:text-amber-400 transition-colors truncate font-medium">
            {dominio}
          </a>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-slate-800/60">
        <div
          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {usuario.slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-semibold truncate">{usuario}</p>
                <p className="text-slate-600 text-xs truncate">{dominio}</p>
              </div>
              <button className="text-slate-600 hover:text-rose-400 transition-colors duration-200">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
