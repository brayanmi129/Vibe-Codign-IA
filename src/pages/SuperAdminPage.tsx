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
  const [activeView, setActiveView] = React.useState<"stores" | "admins">("stores");

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
        
        <div className="p-8 pb-4 relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 rotate-container hover:rotate-0 transition-transform cursor-pointer">
              <ShieldCheck className="text-indigo-600 w-7 h-7" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tighter uppercase leading-none">SUPER ADMIN</p>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">StockMaster Pro</p>
            </div>
          </div>

          <nav className="space-y-4">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] px-4 mb-4">Administración</p>
            
            <Button
              onClick={() => setActiveView("stores")}
              className={`w-full justify-start gap-4 h-14 rounded-2xl transition-all font-black text-xs uppercase tracking-widest px-5 ${
                activeView === "stores" 
                  ? "bg-white text-indigo-700 shadow-xl shadow-indigo-900/20" 
                  : "bg-transparent text-indigo-100 hover:bg-white/10"
              }`}
            >
              <StoreIcon size={20} />
              Tiendas
              <Badge className={`ml-auto border-none pointer-events-none ${activeView === "stores" ? "bg-indigo-700 text-white" : "bg-white/20 text-indigo-100"}`}>
                {stores.length}
              </Badge>
            </Button>

            <Button
              onClick={() => setActiveView("admins")}
              className={`w-full justify-start gap-4 h-14 rounded-2xl transition-all font-black text-xs uppercase tracking-widest px-5 ${
                activeView === "admins" 
                  ? "bg-white text-indigo-700 shadow-xl shadow-indigo-900/20" 
                  : "bg-transparent text-indigo-100 hover:bg-white/10"
              }`}
            >
              <Users size={20} />
              Super Usuarios
              <Badge className={`ml-auto border-none pointer-events-none ${activeView === "admins" ? "bg-indigo-700 text-white" : "bg-white/20 text-indigo-100"}`}>
                {superAdmins.length}
              </Badge>
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/10 bg-black/5 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-sm font-black ring-2 ring-white/10 shadow-xl">
              {activeView === "admins" ? <Activity size={16} /> : (user?.displayName?.[0] || user?.email?.[0]?.toUpperCase())}
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
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              {activeView === "stores" ? "Control de Tiendas" : "Equipo de Super Usuarios"}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {activeView === "stores" 
                ? "Gestiona el ecosistema de sucursales y suscriptores." 
                : "Administra los accesos de nivel raíz al sistema."}
            </p>
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

        <AnimatePresence mode="wait">
          {activeView === "stores" ? (
            <motion.div
              key="stores"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <Card className="bg-white border-none shadow-2xl shadow-indigo-100/40 rounded-[40px] overflow-hidden">
                <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between gap-8 flex-wrap">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl font-black text-slate-900">Ecosistema Global</CardTitle>
                      <div className="px-3 py-1 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest">
                        {filtered.length} Tenants
                      </div>
                    </div>
                    <CardDescription className="text-base text-slate-400 font-medium">Listado detallado de todas las organizaciones registradas.</CardDescription>
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
                          <div className="flex items-center gap-8 p-10 hover:bg-indigo-50/30 transition-all cursor-default">
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
                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
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
                              <Button
                                variant="ghost"
                                className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center p-0"
                              >
                                <ChevronRight size={24} />
                              </Button>
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
            </motion.div>
          ) : (
            <motion.div
              key="admins"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-white border-none shadow-2xl shadow-indigo-100/40 rounded-[40px] overflow-hidden">
                <CardHeader className="p-10 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-600 shadow-inner">
                      <ShieldCheck size={28} />
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                      Admin Management
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-slate-900">Equipo de Altas Capacidades</CardTitle>
                  <CardDescription className="text-base text-slate-400 font-medium tracking-tight">Cuentas con privilegios de nivel raíz para gestionar todo el ecosistema.</CardDescription>
                </CardHeader>

                <CardContent className="p-10 pt-4 space-y-12">
                  <form onSubmit={handleAddSuperAdmin} className="space-y-4 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Añadir nuevo Super Administrador</p>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="email@stockmaster.pro"
                          value={newSaEmail}
                          onChange={e => setNewSaEmail(e.target.value)}
                          className="pl-14 h-14 bg-white border-none rounded-2xl text-base font-black text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isAddingSa || !newSaEmail.trim()}
                        className="h-14 px-8 bg-indigo-600 border-2 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 text-white rounded-[18px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all gap-4 disabled:opacity-30"
                      >
                        {isAddingSa ? <RefreshCw size={20} className="animate-spin" /> : <UserPlus size={20} />}
                        Autorizar
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-6">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] px-1">Lista de Personal Autorizado</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {superAdmins.map(email => {
                        const isSelf = email === user?.email;
                        const isRemoving = removingSaEmail === email;
                        return (
                          <div key={email} className="flex items-center gap-5 p-6 rounded-[28px] bg-white border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group relative">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black ring-4 ring-slate-50 shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              {email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate tracking-tight">{email}</p>
                              {isSelf && <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-widest mt-1">Tu Perfil</Badge>}
                            </div>
                            {!isSelf && (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isRemoving}
                                onClick={() => handleRemoveSuperAdmin(email)}
                                className="h-12 w-12 text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl border border-transparent hover:border-rose-100"
                              >
                                {isRemoving ? <RefreshCw size={20} className="animate-spin" /> : <Trash2 size={20} />}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
