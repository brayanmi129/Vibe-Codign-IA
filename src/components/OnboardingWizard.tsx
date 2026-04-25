import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store as StoreIcon, 
  Palette, 
  User as UserIcon, 
  Users, 
  BrainCircuit, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Briefcase,
  Sparkles,
  Layout,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from './ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { UserRole, Store, StoreMember } from '../types';

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
  };
  adminInfo?: {
    displayName: string;
    email: string;
    password?: string;
  };
  employees: { email: string; role: UserRole; displayName: string }[];
  aiDescription: string;
}

const STEPS = [
  { id: 'welcome', title: 'Bienvenida', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'store-info', title: 'Tu Tienda', icon: <StoreIcon className="w-5 h-5" /> },
  { id: 'branding', title: 'Identidad', icon: <Palette className="w-5 h-5" /> },
  { id: 'admin', title: 'Cuenta', icon: <UserIcon className="w-5 h-5" /> },
  { id: 'employees', title: 'Equipo', icon: <Users className="w-5 h-5" /> },
  { id: 'ai-context', title: 'Cerebro IA', icon: <BrainCircuit className="w-5 h-5" /> },
  { id: 'review', title: 'Confirmar', icon: <CheckCircle2 className="w-5 h-5" /> },
];

const CATEGORIES = [
  { id: 'tech', label: 'Tecnología', icon: '💻' },
  { id: 'fashion', label: 'Moda/Ropa', icon: '👕' },
  { id: 'food', label: 'Alimentos/Restaurante', icon: '🍔' },
  { id: 'health', label: 'Salud/Bienestar', icon: '🏥' },
  { id: 'other', label: 'Otro', icon: '✨' },
];

const COLOR_PRESETS = [
  { name: 'Azul Moderno', primaryColor: '#2563EB', secondaryColor: '#1E40AF', backgroundColor: '#F8FAFC' },
  { name: 'Verde SaaS', primaryColor: '#10B981', secondaryColor: '#047857', backgroundColor: '#F0FDF4' },
  { name: 'Morado Tech', primaryColor: '#7C3AED', secondaryColor: '#5B21B6', backgroundColor: '#F5F3FF' },
  { name: 'Oscuro Elegante', primaryColor: '#3B82F6', secondaryColor: '#1D4ED8', backgroundColor: '#0F172A', isDark: true },
];

export function OnboardingWizard({ onComplete, currentUser, onGoogleSignIn }: OnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    storeName: '',
    businessType: 'tech',
    branding: COLOR_PRESETS[0],
    employees: [],
    aiDescription: '',
    adminInfo: currentUser ? {
      displayName: currentUser.displayName || '',
      email: currentUser.email || '',
    } : {
      displayName: '',
      email: '',
    }
  });

  const [newEmployee, setNewEmployee] = useState({ email: '', role: 'employee' as UserRole, displayName: '' });

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleAddEmployee = () => {
    if (newEmployee.email && newEmployee.displayName) {
      setData(prev => ({
        ...prev,
        employees: [...prev.employees, { ...newEmployee }]
      }));
      setNewEmployee({ email: '', role: 'employee', displayName: '' });
    }
  };

  const removeEmployee = (index: number) => {
    setData(prev => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index)
    }));
  };

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl relative">
        {/* Progress Bar */}
        <div className="mb-8 px-4 flex items-center justify-between gap-2">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex flex-col items-center gap-2 group transition-all duration-300 ${
                  idx <= currentStepIndex ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    idx < currentStepIndex ? 'bg-indigo-600 border-indigo-600 text-white' :
                    idx === currentStepIndex ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' :
                    'border-slate-200'
                  }`}
                >
                  {idx < currentStepIndex ? <CheckCircle2 size={18} /> : step.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-200 relative overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: idx < currentStepIndex ? '100%' : '0%' }}
                    className="absolute inset-0 bg-indigo-600"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className="shadow-2xl border-none overflow-hidden bg-white rounded-3xl">
              <div className="grid md:grid-cols-12 min-h-[500px]">
                {/* Left Side: Illustration / Context */}
                <div className="md:col-span-4 bg-indigo-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                      {currentStep.icon}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Paso {currentStepIndex + 1} de {STEPS.length}</h2>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      {currentStepIndex === 0 && "Inicia tu viaje hacia una gestión inteligente de inventario."}
                      {currentStepIndex === 1 && "Danos el nombre de tu imperio y ayúdanos a categorizarlo."}
                      {currentStepIndex === 2 && "Personaliza cómo se siente tu plataforma para ti y tu equipo."}
                      {currentStepIndex === 3 && "Asegura el acceso principal a la administración de tu negocio."}
                      {currentStepIndex === 4 && "Agrega a las personas que harán crecer este proyecto contigo."}
                      {currentStepIndex === 5 && "Explícale a la IA cómo funciona tu negocio para obtener mejores resultados."}
                      {currentStepIndex === 6 && "Todo listo. Verifica los detalles antes de lanzar tu tienda."}
                    </p>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold">Fact de hoy</p>
                      <p className="text-indigo-200">La IA reduce errores de stock en un 40%.</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:col-span-8 p-8 md:p-12 flex flex-col">
                  <div className="flex-1">
                    {currentStepIndex === 0 && (
                      <div className="space-y-8 py-4">
                        <div className="space-y-4">
                          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            Vamos a crear tu tienda <span className="text-indigo-600 italic">Pro</span> 🚀
                          </h1>
                          <p className="text-slate-500 text-lg">
                            Configura tu negocio en pocos pasos y empieza a vender inteligentemente hoy mismo.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                              <Layout size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">Dashboard Personalizado</p>
                              <p className="text-xs text-slate-500">Colores y branding únicos para tu marca.</p>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                              <BrainCircuit size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">Cerebro IA</p>
                              <p className="text-xs text-slate-500">Sugerencias inteligentes basadas en tu contexto.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepIndex === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-base">Nombre de la Tienda</Label>
                          <Input 
                            placeholder="Ej: TechStore Solutions" 
                            className="h-12 text-lg rounded-xl border-slate-200 focus:border-indigo-600 transition-all"
                            value={data.storeName}
                            onChange={e => setData(prev => ({ ...prev, storeName: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-base">¿A qué se dedica tu empresa?</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CATEGORIES.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => setData(prev => ({ ...prev, businessType: cat.id }))}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                                  data.businessType === cat.id 
                                  ? 'border-indigo-600 bg-indigo-50/50' 
                                  : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                              >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                                <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {data.storeName && (
                          <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <StoreIcon size={20} className="text-indigo-600" />
                              <p className="text-sm font-medium">Así se verá: <span className="font-bold text-indigo-700">{data.storeName}</span></p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStepIndex === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="text-base">Elige un estilo para tu tienda</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.name}
                                onClick={() => setData(prev => ({ ...prev, branding: preset }))}
                                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                                  data.branding.name === preset.name 
                                  ? 'border-indigo-600 ring-4 ring-indigo-50' 
                                  : 'border-slate-100 bg-white hover:border-indigo-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-sm">{preset.name}</span>
                                  {data.branding.name === preset.name && <CheckCircle2 size={16} className="text-indigo-600" />}
                                </div>
                                <div className="flex gap-2 h-8">
                                  <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: preset.primaryColor }} />
                                  <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: preset.secondaryColor }} />
                                  <div className="w-8 h-8 rounded-lg shadow-inner border border-slate-200" style={{ backgroundColor: preset.backgroundColor }} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-8 space-y-4">
                          <Label>Vista previa de tu Dashboard</Label>
                          <div 
                            className="w-full h-40 rounded-3xl border-2 border-slate-200 shadow-sm p-4 flex flex-col gap-3 transition-all duration-500 overflow-hidden"
                            style={{ backgroundColor: data.branding.backgroundColor }}
                          >
                            <header className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: data.branding.primaryColor }} />
                                <span className={(data.branding as any).isDark ? "text-white text-[10px] font-bold" : "text-slate-900 text-[10px] font-bold"}>
                                  {data.storeName || "Tu Tienda"}
                                </span>
                              </div>
                              <div className="w-12 h-2 rounded-full bg-slate-200" />
                            </header>
                            <div className="grid grid-cols-3 gap-2 flex-1">
                              <div className="bg-white/90 rounded-xl p-2 flex flex-col justify-end gap-1">
                                <div className="w-full h-1 rounded bg-slate-100" />
                                <div className="w-2/3 h-2 rounded-lg" style={{ backgroundColor: data.branding.secondaryColor }} />
                              </div>
                              <div className="bg-white/90 rounded-xl p-2 flex flex-col justify-end gap-1">
                                <div className="w-full h-1 rounded bg-slate-100" />
                                <div className="w-2/3 h-2 rounded-lg" style={{ backgroundColor: data.branding.primaryColor }} />
                              </div>
                              <div className="bg-white/90 rounded-xl p-2 flex flex-col justify-end gap-1">
                                <div className="w-full h-1 rounded bg-slate-100" />
                                <div className="w-2/3 h-2 rounded-lg" style={{ backgroundColor: data.branding.primaryColor }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepIndex === 3 && (
                      <div className="space-y-6">
                        {!currentUser ? (
                          <div className="space-y-6">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <Label>Nombre Completo</Label>
                                <Input 
                                  placeholder="Tu nombre" 
                                  value={data.adminInfo?.displayName || ''}
                                  onChange={e => setData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo!, displayName: e.target.value } }))}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                  type="email" 
                                  placeholder="admin@ejemplo.com" 
                                  value={data.adminInfo?.email || ''}
                                  onChange={e => setData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo!, email: e.target.value } }))}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Contraseña</Label>
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  value={data.adminInfo?.password || ''}
                                  onChange={e => setData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo!, password: e.target.value } }))}
                                  required
                                />
                                <div className="flex gap-1 h-1 mt-1">
                                  {[1,2,3,4].map(i => (
                                    <div 
                                      key={i} 
                                      className={`flex-1 rounded-full ${
                                        (data.adminInfo?.password?.length || 0) > i * 2 ? 'bg-emerald-500' : 'bg-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <Separator className="my-8" />
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-slate-400 font-bold uppercase tracking-widest">O continúa con</span>
                            </div>

                            <Button 
                              variant="outline" 
                              onClick={onGoogleSignIn}
                              className="w-full h-12 gap-3 border-2 hover:bg-slate-50 rounded-xl"
                            >
                              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                              Registrarme con Google
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-8 py-10 text-center">
                            <div className="mx-auto w-24 h-24 rounded-full border-4 border-emerald-500 p-1">
                              <img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} className="w-full h-full rounded-full" alt="Avatar" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-2xl font-bold">{currentUser.displayName}</h3>
                              <p className="text-slate-500">{currentUser.email}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-center gap-3 text-emerald-700">
                              <CheckCircle2 size={24} />
                              <span className="font-bold">Ya estás autenticado</span>
                            </div>
                            <Button variant="ghost" onClick={prevStep} className="text-slate-400">Usar otra cuenta</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStepIndex === 4 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Miembros del equipo</Label>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100">Opcional</Badge>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            <div className="md:col-span-12">
                              <Input 
                                placeholder="Nombre del empleado" 
                                value={newEmployee.displayName}
                                onChange={e => setNewEmployee(prev => ({ ...prev, displayName: e.target.value }))}
                              />
                            </div>
                            <div className="md:col-span-8">
                              <Input 
                                type="email" 
                                placeholder="email@equipo.com" 
                                value={newEmployee.email}
                                onChange={e => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Select 
                                value={newEmployee.role} 
                                onValueChange={(v: any) => setNewEmployee(prev => ({ ...prev, role: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="employee">Empleado</SelectItem>
                                  <SelectItem value="viewer">Ver</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-1">
                              <Button variant="outline" className="w-full h-full p-0" onClick={handleAddEmployee} type="button">
                                <Plus size={20} />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                          {data.employees.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                              <Users className="mx-auto w-10 h-10 text-slate-200 mb-2" />
                              <p className="text-xs text-slate-400">No hay empleados agregados aún</p>
                            </div>
                          )}
                          {data.employees.map((emp, idx) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                              key={idx}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-indigo-600">
                                  {emp.displayName[0].toUpperCase()}
                                </div>
                                <div className="text-xs">
                                  <p className="font-bold">{emp.displayName}</p>
                                  <p className="text-slate-400">{emp.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="capitalize text-[10px]">{emp.role}</Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removeEmployee(idx)}>
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepIndex === 5 && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="text-base flex items-center gap-2">
                            Describe tu negocio para la IA <Sparkles size={16} className="text-indigo-600" />
                          </Label>
                          <p className="text-sm text-slate-500">
                            Esto ayuda a nuestro sistema a darte mejores insights sobre inventario, ventas y tendencias.
                          </p>
                          <Textarea 
                            rows={6}
                            placeholder="Ej: Vendemos productos tecnológicos y queremos ayuda con inventario y ventas. Mi bodega se especializa en componentes de PC de alta gama..."
                            className="rounded-2xl border-slate-200 p-4 leading-relaxed focus:ring-4 ring-indigo-50 transition-all h-40"
                            value={data.aiDescription}
                            onChange={e => setData(prev => ({ ...prev, aiDescription: e.target.value }))}
                          />
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                          <BrainCircuit size={20} className="mt-1 text-amber-600" />
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-amber-900">¿Por qué es importante?</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                              La IA usará esta información para personalizar las notificaciones de stock bajo y sugerir temporadas de venta basadas en tu sector.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepIndex === 6 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold">Resumen de tu tienda</h3>
                        <div className="grid gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: data.branding.primaryColor }}>
                                <StoreIcon />
                              </div>
                              <div>
                                <p className="font-bold text-lg">{data.storeName}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">{CATEGORIES.find(c => c.id === data.businessType)?.label}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-slate-400">Admin</Label>
                                <p className="text-sm font-medium">{data.adminInfo?.displayName}</p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-slate-400">Equipo</Label>
                                <p className="text-sm font-medium">{data.employees.length} miembros</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">Estilo Visual</Label>
                            <div className="flex gap-2">
                              <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: data.branding.primaryColor }} />
                              <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: data.branding.secondaryColor }} />
                              <div className="flex-1 h-3 rounded-full ring-1 ring-slate-100" style={{ backgroundColor: data.branding.backgroundColor }} />
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-indigo-600 rounded-3xl text-white text-center space-y-4 shadow-xl shadow-indigo-200">
                          <CheckCircle2 size={32} className="mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold">¡Todo listo para despegar!</h4>
                            <p className="text-indigo-100 text-xs">Al crear tu tienda, aceptamos el reto de hacer crecer tu inventario.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="mt-12 flex items-center justify-between gap-4">
                    <Button 
                      variant="ghost" 
                      onClick={prevStep} 
                      disabled={currentStepIndex === 0}
                      className="h-12 px-6 rounded-xl text-slate-500 hover:text-slate-900"
                    >
                      <ArrowLeft size={18} className="mr-2" /> Atrás
                    </Button>
                    
                    {currentStepIndex === STEPS.length - 1 ? (
                      <Button 
                        onClick={() => onComplete(data)}
                        className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 group overflow-hidden relative"
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
                    ) : (
                      <Button 
                        onClick={nextStep}
                        className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-100"
                        disabled={
                          (currentStepIndex === 1 && !data.storeName) ||
                          (currentStepIndex === 3 && !currentUser && (!data.adminInfo?.email || !data.adminInfo?.password || !data.adminInfo?.displayName))
                        }
                      >
                        Siguiente <ArrowRight size={18} className="ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="text-center mt-8 space-y-6">
          <p className="text-xs text-slate-400 font-medium">StockMaster Pro v2.0 - Onboarding Seguro & Privado</p>
          <div className="flex justify-center gap-4">
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
