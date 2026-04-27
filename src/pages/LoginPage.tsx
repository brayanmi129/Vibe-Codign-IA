import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { motion as motionBase } from "framer-motion"; // fallback if needed
import { 
  Package, 
  RefreshCw, 
  UserPlus, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LoginPageProps {
  authView: "login" | "signup";
  setAuthView: (v: "login" | "signup" | "onboarding") => void;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  authDisplayName: string;
  setAuthDisplayName: (v: string) => void;
  isAuthLoading: boolean;
  handleEmailAuth: (e: React.FormEvent, mode: "login" | "signup") => void;
  handleGoogleLogin: () => void;
}

export function LoginPage({
  authView,
  setAuthView,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authDisplayName,
  setAuthDisplayName,
  isAuthLoading,
  handleEmailAuth,
  handleGoogleLogin,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Visual Side (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400 blur-[120px] animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
              <Package className="text-indigo-600 w-7 h-7" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">STOCKMASTER PRO</span>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
                Gestiona tu Negocio <br /> 
                <span className="text-indigo-200">con inteligencia real.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Zap size={18} />, title: "Tiempo Real", desc: "Sincronización instantánea en todos tus dispositivos." },
                { icon: <ShieldCheck size={18} />, title: "Seguro", desc: "Tus datos protegidos con seguridad de nivel empresarial." },
                { icon: <BarChart3 size={18} />, title: "Analytics", desc: "Gráficos y reportes detallados para mejores decisiones." },
                { icon: <Globe size={18} />, title: "Sucursales", desc: "Control total de todas tus tiendas desde un solo lugar." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white mb-3">
                    {item.icon}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-[11px] text-indigo-100 font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-indigo-200 text-xs font-medium border-t border-white/10 pt-8">
            © 2024 StockMaster Pro. La plataforma número uno para retailers modernos.
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        {/* Background Accents (Mobile/Desktop) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:hidden inline-flex w-14 h-14 bg-indigo-600 rounded-3xl items-center justify-center shadow-2xl shadow-indigo-200 mb-6 transform rotate-3"
            >
              <Package className="text-white w-7 h-7" />
            </motion.div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {authView === "login" ? "¡Hola de nuevo!" : "Empieza con StockMaster"}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              {authView === "login" 
                ? "Ingresa tus credenciales para continuar." 
                : "Regístrate para gestionar tu equipo e inventario."}
            </p>
          </div>

          <Card className="border-none bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-100/50">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={authView}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={(e) => handleEmailAuth(e, authView)} className="space-y-5">
                    {authView === "signup" && (
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Nombre Completo</Label>
                        <Input
                          placeholder="Tu nombre"
                          value={authDisplayName}
                          onChange={e => setAuthDisplayName(e.target.value)}
                          disabled={isAuthLoading}
                          required
                          className="h-13 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 px-5"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                      <Input
                        type="email"
                        placeholder="ejemplo@stockmaster.ai"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        disabled={isAuthLoading}
                        required
                        className="h-13 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 px-5"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <Label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Contraseña</Label>
                        {authView === "login" && (
                          <Button variant="link" className="text-indigo-600 text-[10px] uppercase font-black tracking-widest h-auto p-0 hover:text-indigo-700">¿La olvidaste?</Button>
                        )}
                      </div>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        disabled={isAuthLoading}
                        required
                        className="h-13 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 px-5"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 h-13 rounded-2xl text-white font-bold text-base shadow-xl shadow-indigo-900/10 transition-all active:scale-[0.98]"
                    >
                      {isAuthLoading ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          {authView === "login" ? "Entrar ahora" : "Crear mi cuenta"}
                          <ArrowRight size={18} />
                        </span>
                      )}
                    </Button>
                  </form>
                </motion.div>
              </AnimatePresence>

              <div className="relative my-8">
                <Separator className="bg-slate-100" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  O continúa con
                </span>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAuthLoading}
                className="w-full h-13 gap-3 border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-600 font-bold bg-transparent transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Google Account
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 text-center">
            {authView === "login" ? (
              <>
                <p className="text-sm text-slate-500 font-medium tracking-tight">
                  ¿No tienes acceso todavía? {" "}
                  <Button 
                    variant="link" 
                    onClick={() => setAuthView("signup")}
                    className="text-indigo-600 font-bold p-0 h-auto hover:text-indigo-700"
                  >
                    Regístrate como empleado
                  </Button>
                </p>
                
                <div className="pt-4">
                  <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 inline-block w-full">
                    <p className="text-xs text-emerald-600 font-bold mb-3 uppercase tracking-wider">¿Quieres registrar tu propio negocio?</p>
                    <Button
                      onClick={() => setAuthView("onboarding")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest h-10 shadow-lg shadow-emerald-900/10"
                    >
                      Empezar Onboarding
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 font-medium tracking-tight">
                ¿Ya tienes una cuenta activa? {" "}
                <Button 
                  variant="link" 
                  onClick={() => setAuthView("login")}
                  className="text-indigo-600 font-bold p-0 h-auto hover:text-indigo-700"
                >
                  Inicia sesión aquí
                </Button>
              </p>
            )}
            
            <div className="pt-8 opacity-40">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Seguridad Protegida por Cloud AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
