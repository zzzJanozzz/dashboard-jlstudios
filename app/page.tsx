"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';

export default function Home() {
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [error, setError] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const handleStartAnimation = () => {
    setIsLoginVisible(true);
    setTimeout(() => {
        setIsFormExpanded(true);
        const inputElement = formRef.current?.querySelector('input');
        if (inputElement) inputElement.focus();
    }, 300);
  };

  const handleCancel = () => {
    setIsFormExpanded(false);
    setError(false);
    setTimeout(() => setIsLoginVisible(false), 300);
  };

  // --- LÓGICA DE LOGIN MODIFICADA ---
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Lista de usuarios válidos para las pruebas (simulando base de datos)
    const validUsers = ["pepe123", "juan321", "maria456", "carlos789"];
    
    // Todos usan la clave "admin" para las pruebas (se cambiará luego)
    if (validUsers.includes(username) && password === "admin") {
        setError(false);
        // Esto le dice al navegador quién entró para que el Dashboard lo lea
        localStorage.setItem("JL_LOGGED_USER", username);
        router.push('/dashboard');
    } else {
        setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-200 p-4">
      
      {/* Contenedor Principal: Aumentamos min-h-[650px] para que quepa todo el logo + texto + campos */}
      <div className="text-center w-full max-w-lg p-10 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative min-h-[650px] flex flex-col">
        
        {/* --- CAPA DEL LOGO (FLOTANTE) --- */}
        {/* Lo pegamos bien arriba (top-2) */}
        <div className="absolute top-2 left-0 right-0 h-0 flex justify-center items-start pointer-events-none z-0">
            <div className={`transition-all duration-700 ease-in-out transform ${isLoginVisible ? 'opacity-10 -translate-y-20 scale-110 blur-sm' : 'opacity-100 translate-y-0 scale-100'}`}>
                <img 
                    src="/JLstudios1.png" 
                    alt="JL Studios Logo" 
                    className="w-[312px] h-auto object-contain filter brightness-110 contrast-125 drop-shadow-[0_0_35px_rgba(245,158,11,0.4)]"
                />
            </div>
        </div>

        {/* --- CAPA DE CONTENIDO --- */}
        {/* Aumentamos mt-60 para que el texto "JLStudios Ingreso" empiece debajo del logo gigante */}
        <div className={`mt-60 transition-all duration-500 transform relative z-10 ${isLoginVisible ? '-translate-y-12' : 'translate-y-0'}`}>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">JLstudios Ingreso</h1>
            <p className="text-slate-400 text-sm mb-4 max-w-sm mx-auto">
                Administración de páginas comerciales.
            </p>
        </div>
        
        <div className="flex-1 relative flex items-center justify-center mt-4 z-20">
            
          {/* Botón Inicial */}
          <button 
            onClick={handleStartAnimation}
            className={`absolute z-20 w-72 h-16 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-bold text-lg rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isLoginVisible ? "scale-0 opacity-0" : "scale-100 opacity-100 hover:scale-105 hover:shadow-amber-500/50"}`}
          >
            Ingresar al Panel <ChevronRight className="w-5 h-5" />
          </button>

          {/* Formulario */}
          <form 
            ref={formRef}
            onSubmit={handleLogin} 
            className={`absolute z-10 w-full flex flex-col gap-5 transition-all duration-500
            ${isLoginVisible ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <div className={`relative group transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-100
                ${isFormExpanded ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-50"}`}>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5 z-10" />
                <input 
                    type="text" 
                    placeholder="Usuario CEO"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-950/80 border border-slate-700 rounded-full focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-200 placeholder-slate-500 transition-all shadow-sm group-hover:border-slate-600"
                />
            </div>
            
            <div className={`relative group transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-200
                ${isFormExpanded ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-50"}`}>
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5 z-10" />
                <input 
                    type="password" 
                    placeholder="Clave de acceso" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-950/80 border border-slate-700 rounded-full focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-200 placeholder-slate-500 transition-all shadow-sm group-hover:border-slate-600"
                />
            </div>

            {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm animate-bounce">
                    <AlertCircle className="w-4 h-4" />
                    <span>Credenciales incorrectas</span>
                </div>
            )}

            <div className={`flex items-center gap-3 mt-3 transition-all duration-500 delay-500 ${isFormExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <button 
                    type="button"
                    onClick={handleCancel}
                    className="p-4 rounded-full border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    type="submit"
                    className="flex-1 py-4 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    Validar Credenciales
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}