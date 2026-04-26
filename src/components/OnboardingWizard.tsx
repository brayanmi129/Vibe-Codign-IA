import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  ImagePlus,
  Mail,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { UserRole } from '../types';
import { getContrastColor } from '../lib/utils';
import { COLOR_PRESETS, FONT_PRESETS } from '../constants';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  currentUser: any;
  onGoogleSignIn: () => Promise<void>;
}

export interface OnboardingData {
  storeName: string;
  businessType: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    textSecondaryColor: string;
    textAccentColor: string;
    fontFamily?: string;
  };
  logoFile?: File;
  adminInfo?: {
    displayName: string;
    email: string;
    password?: string;
    authMethod?: 'google' | 'email';
  };
  employees: {
    email: string;
    role: UserRole;
    displayName: string;
    authMethod: 'google' | 'email';
    password?: string;
  }[];
  aiDescription: string;
}

const CATEGORIES = [
  { id: 'tech', label: 'Tecnología', icon: '💻' },
  { id: 'fashion', label: 'Moda / Ropa', icon: '👕' },
  { id: 'food', label: 'Alimentos', icon: '🍔' },
  { id: 'health', label: 'Salud', icon: '🏥' },
  { id: 'retail', label: 'Retail', icon: '🛍️' },
  { id: 'other', label: 'Otro', icon: '✨' },
];

const DEFAULT_BRANDING = COLOR_PRESETS[0];

// 8 steps: 0=welcome, 1=name, 2=category, 3=branding, 4=admin, 5=ai, 6=employees, 7=launch
const TOTAL_STEPS = 8;

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48, filter: 'blur(6px)' }),
};

const slideTransition = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as any };

export function OnboardingWizard({ onComplete, currentUser, onGoogleSignIn }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [adminAuthMethod, setAdminAuthMethod] = useState<'google' | 'email' | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    storeName: '',
    businessType: 'retail',
    branding: DEFAULT_BRANDING,
    employees: [],
    aiDescription: '',
    adminInfo: currentUser
      ? { displayName: currentUser.displayName || '', email: currentUser.email || '', authMethod: 'google' }
      : { displayName: '', email: '', password: '', authMethod: 'email' },
  });

  const [newEmployee, setNewEmployee] = useState({
    email: '',
    role: 'employee' as UserRole,
    displayName: '',
    authMethod: 'email' as 'google' | 'email',
    password: '',
  });

  useEffect(() => {
    return () => { if (logoPreview) URL.revokeObjectURL(logoPreview); };
  }, []);

  useEffect(() => {
    if (currentUser) {
      setData(prev => ({
        ...prev,
        adminInfo: {
          displayName: currentUser.displayName || prev.adminInfo?.displayName || '',
          email: currentUser.email || prev.adminInfo?.email || '',
          authMethod: 'google',
        },
      }));
    }
  }, [currentUser]);

  const go = (delta: number) => {
    setDirection(delta);
    setStep(s => Math.max(0, Math.min(TOTAL_STEPS - 1, s + delta)));
  };

  const canContinue = (): boolean => {
    if (step === 1) return data.storeName.trim().length > 0;
    if (step === 4 && !currentUser) {
      if (adminAuthMethod === 'email') {
        return !!(data.adminInfo?.displayName && data.adminInfo?.email && data.adminInfo?.password);
      }
      return false;
    }
    return true;
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    setData(prev => ({ ...prev, logoFile: file }));
  };

  const handleAddEmployee = () => {
    if (newEmployee.email && newEmployee.displayName) {
      setData(prev => ({ ...prev, employees: [...prev.employees, { ...newEmployee }] }));
      setNewEmployee({ email: '', role: 'employee', displayName: '', authMethod: 'email', password: '' });
    }
  };

  const removeEmployee = (idx: number) => {
    setData(prev => ({ ...prev, employees: prev.employees.filter((_, i) => i !== idx) }));
  };

  const firstName = (currentUser?.displayName || data.adminInfo?.displayName || '').split(' ')[0];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Top bar */}
      <AnimatePresence>
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          >
            <button
              onClick={() => go(-1)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Atrás
            </button>
            <span className="text-xs font-semibold text-slate-300 tabular-nums">
              {step} / {TOTAL_STEPS - 1}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              {/* ── Step 0: Welcome ── */}
              {step === 0 && (
                <div className="space-y-10 text-center">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-4 py-1.5 text-sm font-semibold">
                      <Sparkles size={14} /> StockMaster Pro
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                      Tu tienda inteligente<br />te espera 🚀
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed">
                      Configúrala en minutos. La IA hace el resto.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: '📦', label: 'Inventario inteligente' },
                      { icon: '📊', label: 'Análisis de ventas' },
                      { icon: '🤖', label: 'IA incluida' },
                    ].map(f => (
                      <div key={f.label} className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-2xl mb-1.5">{f.icon}</div>
                        <p className="text-[10px] text-slate-500 font-semibold leading-tight">{f.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => go(1)}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                  >
                    Comenzar <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              )}

              {/* ── Step 1: Store name ── */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Tu negocio</p>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                      ¿Cómo se llama<br />tu empresa?
                    </h2>
                    <p className="text-slate-400 text-sm">Este será el nombre visible de tu tienda.</p>
                  </div>
                  <Input
                    autoFocus
                    placeholder="Ej: TechStore, La Bodega, MiTienda…"
                    className="h-14 text-lg rounded-2xl border-slate-200 focus:border-indigo-500 px-5 transition-all"
                    value={data.storeName}
                    onChange={e => setData(prev => ({ ...prev, storeName: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && canContinue() && go(1)}
                  />
                  <Button
                    onClick={() => go(1)}
                    disabled={!canContinue()}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 shadow-lg shadow-indigo-50"
                  >
                    Continuar <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              )}

              {/* ── Step 2: Business type ── */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Categoría</p>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                      ¿A qué se dedica{' '}
                      <span className="text-indigo-600">{data.storeName || 'tu empresa'}</span>?
                    </h2>
                    <p className="text-slate-400 text-sm">La IA usará esto para personalizar tu experiencia.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setData(prev => ({ ...prev, businessType: cat.id }))}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left group ${
                          data.businessType === cat.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                        <span className="text-sm font-semibold text-slate-700">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => go(1)}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-50"
                  >
                    Continuar <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              )}

              {/* ── Step 3: Branding (logo + colors) ── */}
              {step === 3 && (
                <div className="space-y-7">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Identidad visual</p>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                      Dale vida a<br />tu marca
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Sube tu logo y elige tus colores.{' '}
                      <span className="text-indigo-500 font-medium">Opcional.</span>
                    </p>
                  </div>

                  {/* Logo upload */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Logo</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
                    />
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDraggingLogo(true); }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleLogoFile(f);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-3 h-28 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        isDraggingLogo
                          ? 'border-indigo-400 bg-indigo-50'
                          : logoPreview
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo preview" className="h-16 w-auto max-w-[60%] object-contain rounded-xl" />
                          <p className="text-[10px] text-slate-400 font-medium absolute bottom-2">Haz clic para cambiar</p>
                        </>
                      ) : (
                        <>
                          <ImagePlus size={22} className="text-slate-300" />
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-500">Sube tu logo</p>
                            <p className="text-[10px] text-slate-400">PNG, JPG, SVG · Arrastra o haz clic</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Color presets */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Color principal</p>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_PRESETS.map(preset => {
                        const isSelected = data.branding.primaryColor === preset.primaryColor;
                        return (
                          <button
                            key={preset.name}
                            onClick={() => setData(prev => ({ ...prev, branding: preset }))}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all ${
                              isSelected ? 'border-slate-400 bg-slate-50' : 'border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className="w-6 h-6 rounded-lg flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <span className="text-xs font-semibold text-slate-600 truncate">{preset.name}</span>
                            {isSelected && <CheckCircle2 size={13} className="text-slate-500 ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom color picker */}
                    <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <div
                          className="w-7 h-7 rounded-lg border-2 border-white shadow-md flex-shrink-0 overflow-hidden"
                          style={{ backgroundColor: data.branding.primaryColor }}
                        >
                          <input
                            type="color"
                            value={data.branding.primaryColor}
                            onChange={e => setData(prev => ({
                              ...prev,
                              branding: { ...prev.branding, primaryColor: e.target.value, secondaryColor: e.target.value }
                            }))}
                            className="opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500">Color personalizado</span>
                      </label>
                      <span className="text-xs font-mono text-slate-400">{data.branding.primaryColor}</span>
                    </div>

                    {/* Font selection */}
                    <div className="mt-6">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Estilo de Letra (Fuente)</p>
                      <Select
                        value={data.branding.fontFamily || FONT_PRESETS[0].value}
                        onValueChange={(val) => setData(prev => ({ 
                          ...prev, 
                          branding: { ...prev.branding, fontFamily: val } 
                        }))}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-2 border-slate-100 bg-slate-50/50">
                          <SelectValue placeholder="Selecciona una fuente" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {FONT_PRESETS.map(font => (
                            <SelectItem 
                              key={font.value} 
                              value={font.value}
                              style={{ fontFamily: font.value }}
                            >
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-[10px] text-slate-400 font-medium italic">
                        Esta fuente se aplicará a toda tu tienda.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => go(1)}
                      className="flex-1 h-12 rounded-xl border-2 text-slate-500 hover:text-slate-800"
                    >
                      Saltar
                    </Button>
                    <Button
                      onClick={() => go(1)}
                      className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Continuar <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Admin ── */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Administrador</p>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                      Registra tu cuenta<br />de administrador
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Serás el admin de <span className="font-semibold text-slate-700">{data.storeName || 'tu tienda'}</span>.
                    </p>
                  </div>

                  {currentUser ? (
                    /* ── Verified state ── */
                    <>
                      <div className="flex flex-col items-center gap-4 py-2">
                        <div className="w-20 h-20 rounded-full border-4 border-indigo-100 overflow-hidden bg-slate-100">
                          <img
                            src={
                              currentUser.photoURL ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'A')}&background=4f46e5&color=fff`
                            }
                            className="w-full h-full object-cover"
                            alt="Avatar"
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg text-slate-900">{currentUser.displayName}</p>
                          <p className="text-slate-400 text-sm">{currentUser.email}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-semibold">
                          <CheckCircle2 size={14} /> Cuenta verificada
                        </div>
                      </div>
                      <Button
                        onClick={() => go(1)}
                        size="lg"
                        className="w-full h-14 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-50"
                      >
                        Perfecto, continuar <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </>
                  ) : adminAuthMethod === null ? (
                    /* ── Method chooser ── */
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Elige cómo acceder</p>
                      <button
                        onClick={async () => {
                          setAdminAuthMethod('google');
                          setIsGoogleLoading(true);
                          try { await onGoogleSignIn(); } finally { setIsGoogleLoading(false); }
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm flex-shrink-0">
                          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">Continuar con Google</p>
                          <p className="text-xs text-slate-400 mt-0.5">Rápido y seguro con tu cuenta de Google</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </button>
                      <button
                        onClick={() => setAdminAuthMethod('email')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Mail size={18} className="text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">Email y contraseña</p>
                          <p className="text-xs text-slate-400 mt-0.5">Crea tu cuenta con correo y contraseña</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    </div>
                  ) : adminAuthMethod === 'google' ? (
                    /* ── Waiting for Google ── */
                    <div className="flex flex-col items-center gap-5 py-6">
                      {isGoogleLoading ? (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center animate-pulse">
                            <img src="https://www.google.com/favicon.ico" className="w-7 h-7" alt="Google" />
                          </div>
                          <p className="text-slate-500 text-sm">Abriendo Google...</p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-500 text-sm text-center">El popup de Google se cerró sin iniciar sesión.</p>
                          <Button
                            onClick={async () => {
                              setIsGoogleLoading(true);
                              try { await onGoogleSignIn(); } finally { setIsGoogleLoading(false); }
                            }}
                            variant="outline"
                            className="gap-3 h-12 rounded-xl"
                          >
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                            Intentar de nuevo
                          </Button>
                        </>
                      )}
                      <button
                        onClick={() => { setAdminAuthMethod(null); setIsGoogleLoading(false); }}
                        className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        ← Cambiar método
                      </button>
                    </div>
                  ) : (
                    /* ── Email form ── */
                    <div className="space-y-3">
                      <button
                        onClick={() => setAdminAuthMethod(null)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors mb-2"
                      >
                        <ArrowLeft size={13} /> Cambiar método
                      </button>
                      <Input
                        placeholder="Tu nombre completo"
                        className="h-12 rounded-xl"
                        value={data.adminInfo?.displayName || ''}
                        onChange={e =>
                          setData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo!, displayName: e.target.value, authMethod: 'email' } }))
                        }
                      />
                      <Input
                        type="email"
                        placeholder="correo@empresa.com"
                        className="h-12 rounded-xl"
                        value={data.adminInfo?.email || ''}
                        onChange={e =>
                          setData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo!, email: e.target.value, authMethod: 'email' } }))
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Contraseña (mín. 6 caracteres)"
                        className="h-12 rounded-xl"
                        value={data.adminInfo?.password || ''}
                        onChange={e =>
                          setData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo!, password: e.target.value, authMethod: 'email' } }))
                        }
                      />
                      <Button
                        onClick={() => go(1)}
                        disabled={!canContinue()}
                        size="lg"
                        className="w-full h-14 rounded-2xl text-base font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 mt-2"
                      >
                        Continuar <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 5: AI description (optional) ── */}
              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Contexto IA</p>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                      Cuéntanos sobre<br />tu negocio
                    </h2>
                    <p className="text-slate-400 text-sm">
                      La IA usará esto para recomendaciones personalizadas.{' '}
                      <span className="text-indigo-500 font-medium">Opcional.</span>
                    </p>
                  </div>
                  <Textarea
                    autoFocus
                    rows={5}
                    placeholder="Ej: Vendemos ropa deportiva para mujeres, tenemos bodega propia y vendemos principalmente en Instagram…"
                    className="rounded-2xl border-slate-200 p-4 text-sm leading-relaxed resize-none focus:border-indigo-500 transition-all"
                    value={data.aiDescription}
                    onChange={e => setData(prev => ({ ...prev, aiDescription: e.target.value }))}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => go(1)}
                      className="flex-1 h-12 rounded-xl border-2 text-slate-500 hover:text-slate-800"
                    >
                      Saltar
                    </Button>
                    <Button
                      onClick={() => go(1)}
                      className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Continuar <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 6: Employees (optional) ── */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Tu equipo</p>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                      ¿Quieres agregar<br />empleados?
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Puedes hacerlo desde ajustes más tarde.{' '}
                      <span className="text-indigo-500 font-medium">Opcional.</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Nombre del empleado"
                      className="h-11 rounded-xl"
                      value={newEmployee.displayName}
                      onChange={e => setNewEmployee(prev => ({ ...prev, displayName: e.target.value }))}
                    />
                    <Input
                      type="email"
                      placeholder="correo@equipo.com"
                      className="h-11 rounded-xl"
                      value={newEmployee.email}
                      onChange={e => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {/* Auth method toggle */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewEmployee(prev => ({ ...prev, authMethod: 'google', password: '' }))}
                        className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all ${
                          newEmployee.authMethod === 'google'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                        Google
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewEmployee(prev => ({ ...prev, authMethod: 'email' }))}
                        className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all ${
                          newEmployee.authMethod === 'email'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Mail size={14} />
                        Email/Contraseña
                      </button>
                    </div>
                    {newEmployee.authMethod === 'email' && (
                      <Input
                        type="password"
                        placeholder="Contraseña inicial"
                        className="h-11 rounded-xl"
                        value={newEmployee.password}
                        onChange={e => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                      />
                    )}
                    <div className="flex gap-2 pt-1">
                      <Select
                        value={newEmployee.role}
                        onValueChange={(v: any) => setNewEmployee(prev => ({ ...prev, role: v }))}
                      >
                        <SelectTrigger className="h-11 flex-1 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="employee">Empleado</SelectItem>
                          <SelectItem value="viewer">Ver</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        className="h-11 w-11 p-0 rounded-xl flex-shrink-0"
                        onClick={handleAddEmployee}
                        disabled={!newEmployee.email || !newEmployee.displayName}
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>
                  {data.employees.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {data.employees.map((emp, idx) => (
                        <motion.div
                          key={idx}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                              {emp.displayName[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold leading-none">{emp.displayName}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{emp.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] capitalize">{emp.role}</Badge>
                            <Badge variant="outline" className={`text-[10px] gap-1 ${emp.authMethod === 'google' ? 'border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'}`}>
                              {emp.authMethod === 'google'
                                ? <><img src="https://www.google.com/favicon.ico" className="w-2.5 h-2.5" alt="" />Google</>
                                : <><Mail size={9} />Email</>}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-400 hover:text-rose-600"
                              onClick={() => removeEmployee(idx)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => go(1)}
                      className="flex-1 h-12 rounded-xl border-2 text-slate-500 hover:text-slate-800"
                    >
                      Saltar
                    </Button>
                    <Button
                      onClick={() => go(1)}
                      className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Continuar <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 7: Launch ── */}
              {step === 7 && (
                <div className="space-y-8 text-center">
                  <div className="space-y-4">
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.05 }}
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 overflow-hidden"
                      style={{ backgroundColor: data.branding.primaryColor }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <CheckCircle2 className="text-white" size={38} />
                      )}
                    </motion.div>
                    <div className="space-y-2 pt-1">
                      <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                        ¡Todo listo{firstName ? `, ${firstName}` : ''}! 🎉
                      </h2>
                      <p className="text-slate-500 text-sm">
                        Tu tienda <span className="font-semibold text-slate-800">{data.storeName}</span> está lista para despegar.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3.5">
                    {[
                      { label: 'Tienda', value: data.storeName },
                      { label: 'Categoría', value: CATEGORIES.find(c => c.id === data.businessType)?.label },
                      { label: 'Color de Marca', value: (
                        <span className="flex items-center gap-2 justify-end">
                          <span className="w-4 h-4 rounded-full inline-block border border-slate-200" style={{ backgroundColor: data.branding.primaryColor }} />
                          <span className="font-mono text-xs">{data.branding.primaryColor}</span>
                        </span>
                      )},
                      { label: 'Color Destaque', value: (
                        <span className="flex items-center gap-2 justify-end">
                          <span className="w-4 h-4 rounded-full inline-block border border-slate-200" style={{ backgroundColor: data.branding.textAccentColor || data.branding.primaryColor }} />
                          <span className="font-mono text-xs">{data.branding.textAccentColor || data.branding.primaryColor}</span>
                        </span>
                      )},
                      { label: 'Fuente', value: FONT_PRESETS.find(f => f.value === (data.branding.fontFamily || FONT_PRESETS[0].value))?.name },
                      { label: 'Logo', value: logoPreview ? '✓ Subido' : 'Sin logo' },
                      { label: 'Equipo', value: `${data.employees.length} miembro${data.employees.length !== 1 ? 's' : ''}` },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{row.label}</span>
                        <span className="text-sm font-bold text-slate-800">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => onComplete(data)}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-semibold shadow-xl shadow-indigo-100 relative overflow-hidden transition-colors"
                    style={{ 
                      backgroundColor: data.branding.primaryColor,
                      color: getContrastColor(data.branding.primaryColor) === "white" ? "#ffffff" : "#0f172a"
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Crear mi tienda <Sparkles size={18} />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom step dots */}
      <AnimatePresence>
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-1.5 pb-8 flex-shrink-0"
          >
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i + 1 === step ? 24 : 8,
                  backgroundColor: i + 1 === step ? '#6366f1' : '#e2e8f0',
                }}
                className="h-2 rounded-full"
                transition={{ duration: 0.25 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
