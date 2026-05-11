import * as React from "react";
import { motion } from "motion/react";
import {
  Package,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface LoginPageProps {
  setAuthView: (v: "login" | "onboarding") => void;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  isAuthLoading: boolean;
  handleEmailLogin: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  handlePasswordReset: (email: string) => Promise<void>;
}

export function LoginPage({
  setAuthView,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  isAuthLoading,
  handleEmailLogin,
  handleGoogleLogin,
  handlePasswordReset,
}: LoginPageProps) {
  // ── Diálogo de recuperación de contraseña ──────────────────────────
  const [isResetOpen, setIsResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetState, setResetState] = React.useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetError, setResetError] = React.useState("");

  const openReset = () => {
    setResetEmail(authEmail || "");
    setResetState('idle');
    setResetError("");
    setIsResetOpen(true);
  };

  const submitReset = async () => {
    setResetError("");
    setResetState('sending');
    try {
      await handlePasswordReset(resetEmail);
      setResetState('sent');
    } catch (err: any) {
      setResetError(err?.message || "No se pudo enviar el correo");
      setResetState('idle');
    }
  };

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
              ¡Hola de nuevo!
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Ingresa con tu cuenta de equipo, admin o super admin.
            </p>
          </div>

          <Card className="border-none bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-100/50">
            <CardContent className="p-8">
              <form onSubmit={handleEmailLogin} className="space-y-5">
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
                    <button
                      type="button"
                      onClick={openReset}
                      disabled={isAuthLoading}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 transition-colors disabled:opacity-50"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
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
                      Entrar ahora
                      <ArrowRight size={18} />
                    </span>
                  )}
                </Button>
              </form>

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
            <div className="pt-2">
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

            <div className="pt-8 opacity-40">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Seguridad Protegida por Cloud AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de recuperación de contraseña */}
      <Dialog
        open={isResetOpen}
        onOpenChange={(open) => {
          if (!open && resetState !== 'sending') {
            setIsResetOpen(false);
            // Reset al cerrar para que la próxima apertura arranque limpia
            setTimeout(() => { setResetState('idle'); setResetError(""); }, 200);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          {resetState === 'sent' ? (
            <>
              <DialogHeader>
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <CheckCircle2 className="text-emerald-600" size={28} />
                </div>
                <DialogTitle className="text-center">Revisa tu correo</DialogTitle>
                <DialogDescription className="text-center">
                  Si existe una cuenta asociada a <strong className="text-slate-700">{resetEmail}</strong>, recibirás un enlace para restablecer tu contraseña en unos minutos.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-700 mb-1">¿No te llega?</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Revisa la carpeta de spam o promociones.</li>
                  <li>Si tu cuenta es solo de Google, no recibirás el correo — usa el botón "Google Account".</li>
                  <li>El enlace caduca después de un tiempo, vuelve a solicitarlo si es necesario.</li>
                </ul>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setIsResetOpen(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                >
                  Entendido
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <Mail className="text-indigo-600" size={26} />
                </div>
                <DialogTitle className="text-center">Recuperar contraseña</DialogTitle>
                <DialogDescription className="text-center">
                  Te enviaremos un enlace a tu correo para que crees una nueva contraseña.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email de tu cuenta
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetState === 'sending'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitReset();
                    }
                  }}
                  autoFocus
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl"
                />
                {resetError && <p className="text-xs text-rose-600">{resetError}</p>}
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Solo aplica si tu cuenta se creó con email y contraseña. Si entras con Google, usa el botón "Google Account".
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsResetOpen(false)}
                  disabled={resetState === 'sending'}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitReset}
                  disabled={resetState === 'sending' || !resetEmail.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {resetState === 'sending' ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    "Enviar enlace"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
