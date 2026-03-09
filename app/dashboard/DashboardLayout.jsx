"use client";
/**
 * DashboardLayout.jsx (ACTUALIZADO CON SUPABASE)
 * ─────────────────────────────────────────────────────────────────────────────
 * ROOT LAYOUT for the JLStudios CMS SaaS.
 *
 * Ahora se conecta a Supabase para obtener datos del cliente.
 * Si no hay conexión, cae back a MOCK_AUTH_DB para desarrollo.
 */

import { useState, createContext, useContext, useEffect } from "react";
import { Home, ClipboardList, Images, Settings, ChevronLeft, LogOut, Globe, Zap, Shield, Store } from "lucide-react";
import { getClientByUsername, getSchedules } from "@/src/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT — shared across all dashboard components
// ─────────────────────────────────────────────────────────────────────────────
export const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

// ─────────────────────────────────────────────────────────────────────────────
// MOCK AUTH DATABASE (fallback if Supabase fails)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_AUTH_DB = {
  pepe123: {
    username:     "pepe123",
    passwordHash: "pepe123",
    businessName: "Pizzería Pepe",
    emoji:        "🍕",
    domain:       "pepe-pizza.surge.sh",
    niche:        "gastronomia",
    plan:         "profesional",
    accentColor:  "#f59e0b",
    emailContact: "pepe@pizzeriapepe.com",
    phone:        "+54 9 351 555-1234",
    address:      "Av. Colón 1234, Córdoba",
    instagram:    "@pizzeria.pepe",
    facebook:     "PizzeriaPepe",
    whatsapp:     "5493515551234",
    googleMaps:   "https://maps.google.com/?q=Pizzeria+Pepe+Cordoba",
    schedule: {
      lun: { open: "12:00", close: "23:30", closed: false },
      mar: { open: "12:00", close: "23:30", closed: false },
      mie: { open: "12:00", close: "23:30", closed: false },
      jue: { open: "12:00", close: "23:30", closed: false },
      vie: { open: "12:00", close: "01:00", closed: false },
      sab: { open: "12:00", close: "01:00", closed: false },
      dom: { open: "12:00", close: "23:00", closed: false },
    },
    ssl:      { status: "active",  issuer: "Cloudflare", expiresAt: "2026-08-14" },
    cdn:      { status: "active",  provider: "Cloudflare", cacheHit: "94%" },
    lastPublish: "2025-02-23T14:32:00Z",
  },

  juan321: {
    username:     "juan321",
    passwordHash: "juan321",
    businessName: "Alpha Gym",
    emoji:        "💪",
    domain:       "alpha-gym.surge.sh",
    niche:        "gimnasio",
    plan:         "profesional",
    accentColor:  "#22d3ee",
    emailContact: "info@alphagym.com",
    phone:        "+54 9 351 444-5678",
    address:      "Bv. San Juan 789, Córdoba",
    instagram:    "@alphagym.cba",
    facebook:     "AlphaGymCba",
    whatsapp:     "5493514445678",
    googleMaps:   "https://maps.google.com/?q=Alpha+Gym+Cordoba",
    schedule: {
      lun: { open: "06:00", close: "22:00", closed: false },
      mar: { open: "06:00", close: "22:00", closed: false },
      mie: { open: "06:00", close: "22:00", closed: false },
      jue: { open: "06:00", close: "22:00", closed: false },
      vie: { open: "06:00", close: "21:00", closed: false },
      sab: { open: "08:00", close: "18:00", closed: false },
      dom: { open: "00:00", close: "00:00", closed: true  },
    },
    ssl:      { status: "active",  issuer: "Cloudflare", expiresAt: "2026-09-01" },
    cdn:      { status: "active",  provider: "Cloudflare", cacheHit: "91%" },
    lastPublish: "2025-02-20T09:10:00Z",
  },

  maria456: {
    username:     "maria456",
    passwordHash: "maria456",
    businessName: "Studio Bella",
    emoji:        "💅",
    domain:       "studio-bella.surge.sh",
    niche:        "estetica",
    plan:         "starter",
    accentColor:  "#f472b6",
    emailContact: "hola@studiobella.com",
    phone:        "+54 9 351 777-9900",
    address:      "Recta Martinoli 456, Córdoba",
    instagram:    "@studiobella.cba",
    facebook:     "StudioBellaCba",
    whatsapp:     "5493517779900",
    googleMaps:   "https://maps.google.com/?q=Studio+Bella+Cordoba",
    schedule: {
      lun: { open: "09:00", close: "20:00", closed: false },
      mar: { open: "09:00", close: "20:00", closed: false },
      mie: { open: "09:00", close: "20:00", closed: false },
      jue: { open: "09:00", close: "20:00", closed: false },
      vie: { open: "09:00", close: "20:00", closed: false },
      sab: { open: "09:00", close: "15:00", closed: false },
      dom: { open: "00:00", close: "00:00", closed: true  },
    },
    ssl:      { status: "pending", issuer: "Cloudflare", expiresAt: null },
    cdn:      { status: "active",  provider: "Cloudflare", cacheHit: "88%" },
    lastPublish: "2025-02-18T16:45:00Z",
  },

  carlos789: {
    username:     "carlos789",
    passwordHash: "carlos789",
    businessName: "Servicios Rápidos CR",
    emoji:        "🔧",
    domain:       "servicios-cr.surge.sh",
    niche:        "servicios",
    plan:         "starter",
    accentColor:  "#34d399",
    emailContact: "carlos@serviciosr.com",
    phone:        "+54 9 351 222-3344",
    address:      "Av. Circunvalación 2000, Córdoba",
    instagram:    "@serviciosr.cba",
    facebook:     "ServiciosRapidosCR",
    whatsapp:     "5493512223344",
    googleMaps:   "https://maps.google.com/?q=Servicios+CR+Cordoba",
    schedule: {
      lun: { open: "08:00", close: "18:00", closed: false },
      mar: { open: "08:00", close: "18:00", closed: false },
      mie: { open: "08:00", close: "18:00", closed: false },
      jue: { open: "08:00", close: "18:00", closed: false },
      vie: { open: "08:00", close: "17:00", closed: false },
      sab: { open: "09:00", close: "13:00", closed: false },
      dom: { open: "00:00", close: "00:00", closed: true  },
    },
    ssl:      { status: "active",  issuer: "Cloudflare", expiresAt: "2026-07-22" },
    cdn:      { status: "inactive",provider: "Cloudflare", cacheHit: "0%" },
    lastPublish: "2025-01-30T11:00:00Z",
  },

  rochas: {
    username:     "rochas",
    passwordHash: "rochas2026",
    businessName: "Rocha's Rotisería",
    emoji:        "🍖",
    domain:       "rochasrotiseria.com",
    niche:        "gastronomia",
    plan:         "profesional",
    accentColor:  "#ea580c",
    emailContact: "rochasrotiseria@gmail.com",
    phone:        "+54 9 3546 48-8351",
    address:      "Calle 3 755 (entre 14 y 16)",
    city:         "Santa Rosa de Calamuchita, Córdoba",
    instagram:    "@rochasrotiseria",
    facebook:     "",
    whatsapp:     "543546488351",
    googleMaps:   "https://maps.app.goo.gl/QmARWF93kgw1FR8C9",
    ssl:      { status: "active",  issuer: "Cloudflare", expiresAt: "2026-12-01" },
    cdn:      { status: "active",  provider: "Cloudflare", cacheHit: "89%" },
    lastPublish: "2025-03-08T10:15:00Z",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "inicio",  label: "Inicio",             icon: Home },
  { id: "content", label: "Editar Contenido",  icon: ClipboardList },
  { id: "fotos",   label: "Fotos",             icon: Images },
  { id: "config",  label: "Configuración",     icon: Settings },
  { id: "negocio", label: "Mi Negocio",        icon: Store },
];

function Sidebar({ collapsed, setCollapsed, activePage, setActivePage, session }) {
  const accent = session?.accentColor ?? "#f59e0b";

  return (
    <aside className="relative flex flex-col shrink-0 bg-slate-900 border-r border-slate-800/60 transition-all duration-300 ease-in-out overflow-hidden"
      style={{ width: collapsed ? 72 : 260 }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-500 via-orange-400 to-amber-500 opacity-90" />

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
        <button onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-slate-200">
          <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-300"
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>
      </div>

      {session && (!collapsed ? (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${accent}44, ${accent}22)`, border: `1px solid ${accent}33` }}>
              {session.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 font-semibold text-sm leading-none truncate">{session.business_name || session.businessName}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #4ade80", animation: "pulse 2s infinite" }} />
                <span className="text-emerald-400 text-xs font-medium">Sitio en vivo</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `linear-gradient(135deg, ${accent}44, ${accent}22)` }}>
            {session.emoji}
          </div>
        </div>
      ))}

      <nav className="flex-1 px-3 py-4 space-y-1 mt-2">
        {!collapsed && (
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pb-2">Navegación</p>
        )}
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${active ? "" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"}`}
              style={{
                background: active ? `${accent}14` : "transparent",
                color: active ? accent : undefined,
                justifyContent: collapsed ? "center" : "flex-start",
              }}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full" style={{ background: accent }} />}
              <Icon className="w-5 h-5 shrink-0" style={{ color: active ? accent : "currentColor" }} />
              {!collapsed && <span className="flex-1 text-left">{label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && session && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
          <span className="text-slate-500 text-xs font-mono truncate hover:text-slate-300 transition-colors cursor-pointer">
            {session.domain}
          </span>
        </div>
      )}

      {!collapsed && session && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: session.ssl?.status === "active" ? "#4ade80" : "#f59e0b" }} />
          <span className="text-xs font-medium" style={{ color: session.ssl?.status === "active" ? "#4ade80" : "#f59e0b" }}>
            SSL {session.ssl?.status === "active" ? "Activo" : "Pendiente"}
          </span>
        </div>
      )}

      <div className="p-3 border-t border-slate-800/60">
        <div className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-800"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent}66)` }}>
            {session?.username?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          {!collapsed && session && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-semibold truncate">{session.username}</p>
                <p className="text-slate-600 text-xs truncate font-mono">{session.domain}</p>
              </div>
              <button onClick={() => { localStorage.removeItem("JL_LOGGED_USER"); window.location.href = "/"; }} className="text-slate-600 hover:text-rose-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
import DashboardHome          from "./DashboardHome";
import ContentManager         from "./ContentManager";
import MediaGallery           from "./MediaGallery";
import SettingsPanel          from "./SettingsPanel";
import RochasBusinessEditor   from "./RochasBusinessEditor";

export default function DashboardLayout() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [activePage, setActivePage] = useState("inicio");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const loadUserSession = async () => {
      const savedUser = localStorage.getItem("JL_LOGGED_USER");
      if (!savedUser) {
        setLoading(false);
        return;
      }

      setLoggedInUser(savedUser);

      // Intentar cargar desde Supabase primero
      const supabaseData = await getClientByUsername(savedUser);
      
      if (supabaseData) {
        // Cargar horarios desde Supabase
        const schedulesData = await getSchedules(supabaseData.id);
        const scheduleMap = {};
        if (schedulesData && schedulesData.length > 0) {
          schedulesData.forEach(s => {
            scheduleMap[s.day_key] = {
              t1: { open: s.t1_open || "", close: s.t1_close || "", active: s.t1_active ?? true },
              t2: { open: s.t2_open || "", close: s.t2_close || "", active: s.t2_active ?? false },
              closed: s.closed ?? false,
            };
          });
        }

        // Transformar datos de Supabase al formato esperado
        const sessionData = {
          id: supabaseData.id,
          username: supabaseData.username,
          businessName: supabaseData.business_name,
          business_name: supabaseData.business_name,
          emoji: supabaseData.emoji || "🏢",
          domain: supabaseData.domain,
          accentColor: supabaseData.accent_color || "#f59e0b",
          tagline: supabaseData.tagline,
          phone: supabaseData.phone,
          emailContact: supabaseData.email_contact || "",
          instagram: supabaseData.instagram,
          facebook: supabaseData.facebook,
          whatsapp: supabaseData.whatsapp,
          address: supabaseData.address,
          city: supabaseData.city,
          googleMaps: supabaseData.google_maps_short,
          googleMapsEmbed: supabaseData.google_maps_embed,
          niche: supabaseData.niche,
          plan: supabaseData.plan,
          hero: {
            badge: supabaseData.hero_badge || "",
            title: supabaseData.hero_title || "",
            titleHighlight: supabaseData.hero_title_highlight || "",
            subtitle: supabaseData.hero_subtitle || "",
          },
          rating: {
            score: supabaseData.rating_score || "9.2",
            quote: supabaseData.rating_quote || "",
            quoteBody: supabaseData.rating_quote_body || "",
          },
          rating_score: supabaseData.rating_score,
          rating_quote: supabaseData.rating_quote,
          rating_quote_body: supabaseData.rating_quote_body,
          logo_url: supabaseData.logo_url || null,
          hero_url: supabaseData.hero_url || null,
          schedule: scheduleMap,
          lastPublish: supabaseData.last_publish || supabaseData.updated_at,
          // Fallback a mock si algunas propiedades faltan
          ssl: { status: "active", issuer: "Cloudflare", expiresAt: "2026-12-01" },
          cdn: { status: "active", provider: "Cloudflare", cacheHit: "90%" },
        };
        setUserSession(sessionData);
      } else {
        // Fallback a mock si Supabase falla
        console.log("⚠️ No se pudo conectar a Supabase, usando datos mock");
        const mockData = MOCK_AUTH_DB[savedUser];
        if (mockData) {
          setUserSession(mockData);
        }
      }

      setLoading(false);
    };

    loadUserSession();
  }, []);

  if (loading) return <div className="h-screen bg-slate-950"></div>;

  if (!userSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <p>Sesión inválida o expirada. <a href="/" className="text-amber-400 underline font-bold ml-1">Volver al inicio.</a></p>
      </div>
    );
  }

  const pages = {
    inicio:  <DashboardHome  session={userSession} />,
    content: <ContentManager session={userSession} />,
    fotos:   <MediaGallery   session={userSession} />,
    config:  <SettingsPanel  session={userSession} />,
    negocio: <RochasBusinessEditor session={userSession} />,
  };

  return (
    <SessionContext.Provider value={userSession}>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          activePage={activePage}
          setActivePage={setActivePage}
          session={userSession}
        />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {pages[activePage]}
        </main>
      </div>
    </SessionContext.Provider>
  );
}