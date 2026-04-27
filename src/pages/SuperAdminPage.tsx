import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  Trash2, 
  Store as StoreIcon,
  Users, 
  Search, 
  AlertTriangle, 
  X, 
  UserPlus, 
  Mail,
  ChevronRight,
  BarChart3,
  Activity,
  ArrowRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { AdminStoreView } from "../types";
import {
  getAllStores, 
  deleteStoreTenant,
  getSuperAdmins, 
  addSuperAdmin, 
  removeSuperAdmin,
} from "../lib/superAdminService";

interface SuperAdminPageProps {
  user: any;
  onLogout: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: "Tecnología", 
  fashion: "Moda", 
  food: "Alimentos",
  health: "Salud", 
  retail: "Retail", 
  other: "Otro",
};

export function SuperAdminPage({ user, onLogout }: SuperAdminPageProps) {
  const [stores, setStores] = React.useState<AdminStoreView[]>([]);
  const [superAdmins, setSuperAdmins] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [newSaEmail, setNewSaEmail] = React.useState("");
  const [isAddingSa, setIsAddingSa] = React.useState(false);
  const [removingSaEmail, setRemovingSaEmail] = React.useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [storesResult, adminsResult] = await Promise.allSettled([
      getAllStores(),
      getSuperAdmins(),
    ]);
    if (storesResult.status === "fulfilled") setStores(storesResult.value);
    else toast.error("Error al cargar las tiendas");
    if (adminsResult.status === "fulfilled") setSuperAdmins(adminsResult.value);
    setIsLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const filtered = React.useMemo(() =>
    stores.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm)
    ), [stores, searchTerm]);

  const totalMembers = React.useMemo(() => 
    stores.reduce((acc, s) => acc + (s.members?.length || 0), 0), 
  [stores]);

  const handleDeleteStore = async (store: AdminStoreView) => {
    if (confirmDeleteInput !== store.name) return;
    setDeletingId(store.id);
    try {
      await deleteStoreTenant(store.id, store.members);
      setStores(prev => prev.filter(s => s.id !== store.id));
      setConfirmDeleteId(null);
      setConfirmDeleteInput("");
      toast.success(`"${store.name}" eliminada correctamente`);
    } catch {
      toast.error("Error al eliminar la tienda");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newSaEmail.trim().toLowerCase();
    if (!email) return;
    if (superAdmins.includes(email)) { toast.error("Ya es Super Admin"); return; }
    setIsAddingSa(true);
    try {
      await addSuperAdmin(email);
      setSuperAdmins(prev => [...prev, email]);
      setNewSaEmail("");
      toast.success(`${email} ahora es Super Admin`);
    } catch {
      toast.error("Error al añadir Super Admin");
    } finally {
      setIsAddingSa(false);
    }
  };

  const handleRemoveSuperAdmin = async (email: string) => {
    if (email === user?.email) { toast.error("No puedes eliminarte a ti mismo"); return; }
    setRemovingSaEmail(email);
    try {
      await removeSuperAdmin(email);
      setSuperAdmins(prev => prev.filter(e => e !== email));
      toast.success(`${email} eliminado`);
    } catch {
      toast.error("Error al eliminar Super Admin");
    } finally {
      setRemovingSaEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* ── Sidebar ── */}
      <aside className="w-full lg:w-[280px] bg-indigo-700 text-white flex flex-col transition-all relative z-50 shadow-2xl overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] pointer-events-none" />
        
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 rotate-container hover:rotate-0 transition-transform cursor-pointer">
              <ShieldCheck className="text-indigo-600 w-7 h-7" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tighter uppercase leading-none">SUPER ADMIN</p>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">StockMaster Pro</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="px-4 py-4 bg-white/10 rounded-2xl flex items-center gap-4 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-lg">
                <StoreIcon size={18} className="text-indigo-100" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1.5">Tiendas</p>
                <p className="text-2xl font-black tracking-tight">{stores.length}</p>
              </div>
            </div>
            
            <div className="px-4 py-4 bg-white/10 rounded-2xl flex items-center gap-4 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-lg">
                <Users size={18} className="text-indigo-100" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1.5">Miembros</p>
                <p className="text-2xl font-black tracking-tight">{totalMembers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/10 bg-black/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-sm font-black ring-2 ring-white/10 shadow-xl">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{user?.displayName || "Admin Principal"}</p>
              <p className="text-[10px] font-bold text-indigo-300 truncate tracking-tight">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={onLogout}
            className="w-full justify-start gap-3 h-13 rounded-2xl text-indigo-200 hover:text-white hover:bg-white/10 transition-all font-black text-[11px] uppercase tracking-[0.15em] border border-white/5"
          >
            <LogOut size={16} /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-12 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Sistema Activo
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Panel de Control Global</h1>
            <p className="text-slate-500 font-medium text-lg">Monitorea cada aspecto del ecosistema StockMaster Pro.</p>
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={load} 
            disabled={isLoading}
            className="h-14 px-8 rounded-[20px] border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest gap-4 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all bg-white"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            Sincronizar Datos
          </Button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* ── Stores Management (Bento Big) ── */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-white border-none shadow-2xl shadow-slate-200/40 rounded-[40px] overflow-hidden">
              <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between gap-8 flex-wrap">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl font-black text-slate-900">Ecosistema de Tiendas</CardTitle>
                    <div className="px-3 py-1 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest">
                      {filtered.length} Tenants
                    </div>
                  </div>
                  <CardDescription className="text-base text-slate-400 font-medium">Gestión administrativa de cuentas corporativas.</CardDescription>
                </div>
                
                <div className="relative flex-1 min-w-[280px] max-w-sm">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Filtrar por nombre, ID o email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-14 h-14 bg-slate-50 border-none rounded-2xl placeholder:text-slate-400 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-40 text-slate-300">
                    <RefreshCw size={56} className="animate-spin mb-6 opacity-40 text-indigo-600" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Consultando Nube...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-40 text-slate-400">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
                      <StoreIcon size={44} className="opacity-10 text-slate-900" />
                    </div>
                    <p className="text-lg font-black tracking-tight text-slate-900">Sin coincidencias</p>
                    <p className="text-sm font-medium">No hay tiendas que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {filtered.map(store => (
                      <motion.div key={store.id} layout className="group">
                        <div className="flex items-center gap-8 p-10 hover:bg-slate-50/70 transition-all cursor-default">
                          {/* Store Avatar */}
                          <div 
                            className="w-20 h-20 rounded-[28px] flex-shrink-0 flex items-center justify-center shadow-xl shadow-slate-200/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-500"
                            style={{ backgroundColor: store.branding?.primaryColor || "#4f46e5" }}
                          >
                            <div className="absolute inset-0 bg-black/10" />
                            {store.logoUrl ? (
                              <img src={store.logoUrl} alt="" className="w-full h-full object-cover relative z-10" />
                            ) : (
                              <StoreIcon size={30} className="text-white relative z-10" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-4 mb-2">
                              <h4 className="text-xl font-black text-slate-900 truncate tracking-tight">{store.name}</h4>
                              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest font-mono bg-slate-50 px-2 py-0.5 rounded-md">
                                {store.id}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-5">
                              <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <Users size={16} className="text-indigo-500" />
                                {store.members.length} Miembros
                              </div>
                              {store.businessType && (
                                <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-500 border-none font-black text-[10px] uppercase tracking-widest rounded-lg px-2.5">
                                  {CATEGORY_LABELS[store.businessType] || store.businessType}
                                </Badge>
                              )}
                              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest shrink-0">
                                <Activity size={12} className="shrink-0" />
                                Monitor On
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              onClick={() => { setConfirmDeleteId(store.id); setConfirmDeleteInput(""); }}
                              className="w-14 h-14 rounded-2xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center p-0 border border-transparent hover:border-rose-100"
                            >
                              <Trash2 size={24} />
                            </Button>
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300">
                              <ChevronRight size={24} />
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Drawer */}
                        <AnimatePresence>
                          {confirmDeleteId === store.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-rose-50/50"
                            >
                              <div className="p-10 border-t border-rose-100 flex flex-col xl:flex-row gap-10 items-start">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center gap-3 text-rose-600 font-black text-sm uppercase tracking-widest">
                                    <AlertTriangle size={24} className="shrink-0" /> Acción Crítica de Destrucción
                                  </div>
                                  <p className="text-base text-rose-900 leading-relaxed font-bold">
                                    Confirmar eliminación de <span className="underline decoration-2 underline-offset-4 font-black">"{store.name}"</span>. 
                                    Se purgarán <span className="font-black italic">todos</span> los activos financieros, inventarios y perfiles de empleados. 
                                    No existe protocolo de recuperación.
                                  </p>
                                </div>
                                <div className="w-full xl:w-[400px] space-y-4">
                                  <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.2em] px-1">Verificación de Identidad por Nombre</p>
                                  <div className="flex gap-3">
                                    <Input
                                      placeholder={`Escribe: ${store.name}`}
                                      value={confirmDeleteInput}
                                      onChange={e => setConfirmDeleteInput(e.target.value)}
                                      className="h-14 bg-white border-2 border-rose-100 rounded-[18px] text-base font-black text-rose-900 focus:ring-4 focus:ring-rose-200 focus:border-rose-300 transition-all"
                                      autoFocus
                                    />
                                    <Button
                                      disabled={confirmDeleteInput !== store.name || deletingId === store.id}
                                      onClick={() => handleDeleteStore(store)}
                                      className="h-14 w-14 rounded-[18px] bg-rose-600 hover:bg-rose-700 text-white shadow-2xl shadow-rose-300 transition-all flex items-center justify-center p-0 disabled:opacity-30 active:scale-95"
                                    >
                                      {deletingId === store.id ? (
                                        <RefreshCw size={24} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={24} />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="h-14 w-14 rounded-[18px] text-rose-300 hover:bg-rose-100 p-0 border border-slate-200 bg-white"
                                    >
                                      <X size={28} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Side Panels (Bento Small) ── */}
          <div className="space-y-10">
            {/* Super Admins Management */}
            <Card className="bg-white border-none shadow-2xl shadow-slate-200/40 rounded-[40px] overflow-hidden">
              <CardHeader className="p-10 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-600 shadow-inner">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                    Root Access
                  </div>
                </div>
                <CardTitle className="text-2xl font-black text-slate-900">Equipo Global</CardTitle>
                <CardDescription className="text-base text-slate-400 font-medium tracking-tight">Cuentas con privilegios de nivel raíz.</CardDescription>
              </CardHeader>

              <CardContent className="p-10 pt-4 space-y-8">
                <form onSubmit={handleAddSuperAdmin} className="space-y-4">
                  <div className="relative">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="email@admin.pro"
                      value={newSaEmail}
                      onChange={e => setNewSaEmail(e.target.value)}
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl text-base font-black text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isAddingSa || !newSaEmail.trim()}
                    className="w-full h-14 bg-slate-900 border-2 border-slate-900 hover:bg-indigo-600 hover:border-indigo-600 text-white rounded-[18px] font-black uppercase text-xs tracking-[0.25em] shadow-2xl active:scale-[0.98] transition-all gap-4 disabled:opacity-30"
                  >
                    {isAddingSa ? <RefreshCw size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    Asignar Privilegios
                  </Button>
                </form>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] px-1 translate-y-2">Jerarquía Autorizada</p>
                  <div className="space-y-2 translate-y-4">
                    {superAdmins.map(email => {
                      const isSelf = email === user?.email;
                      const isRemoving = removingSaEmail === email;
                      return (
                        <div key={email} className="flex items-center gap-5 p-4 rounded-[22px] hover:bg-slate-50 transition-all group relative border border-transparent hover:border-slate-100">
                          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black ring-4 ring-slate-100 shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            {email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate tracking-tight">{email}</p>
                            {isSelf && <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Eres tú</p>}
                          </div>
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isRemoving}
                              onClick={() => handleRemoveSuperAdmin(email)}
                              className="h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                            >
                              {isRemoving ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Stats / Health */}
            <Card className="bg-indigo-700 text-white border-none shadow-2xl shadow-indigo-200/50 rounded-[40px] overflow-hidden relative p-10 group">
              {/* Animated Accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 blur-[50px] translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white font-black text-[10px] uppercase tracking-widest">
                    <Activity size={14} className="animate-pulse" /> Global Health
                  </div>
                  <h3 className="text-3xl font-black tracking-tight leading-tight">Métricas de Escalabilidad</h3>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80">Rendimiento garantizado para el crecimiento de StockMaster Pro en la nube.</p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="p-5 rounded-[22px] bg-white/10 border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Disponibilidad</p>
                    <p className="text-3xl font-black text-white leading-none">99.9<span className="text-lg opacity-60">%</span></p>
                  </div>
                  <div className="p-5 rounded-[22px] bg-white/10 border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Latencia</p>
                    <p className="text-3xl font-black text-white leading-none">24<span className="text-lg opacity-60">ms</span></p>
                  </div>
                </div>

                <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 h-14 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] gap-3 shadow-xl active:scale-[0.98] transition-all">
                  Analizar Latencia
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
