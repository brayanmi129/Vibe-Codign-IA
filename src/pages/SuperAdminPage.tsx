import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShieldCheck, LogOut, RefreshCw, Trash2, Store as StoreIcon,
  Users, Search, AlertTriangle, X, UserPlus, Mail,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Toaster } from '../components/ui/sonner';
import { toast } from 'sonner';
import { AdminStoreView } from '../types';
import {
  getAllStores, deleteStoreTenant,
  getSuperAdmins, addSuperAdmin, removeSuperAdmin,
} from '../lib/superAdminService';

interface SuperAdminPageProps {
  user: any;
  onLogout: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tecnología', fashion: 'Moda', food: 'Alimentos',
  health: 'Salud', retail: 'Retail', other: 'Otro',
};

export function SuperAdminPage({ user, onLogout }: SuperAdminPageProps) {
  const [stores, setStores] = useState<AdminStoreView[]>([]);
  const [superAdmins, setSuperAdmins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newSaEmail, setNewSaEmail] = useState('');
  const [isAddingSa, setIsAddingSa] = useState(false);
  const [removingSaEmail, setRemovingSaEmail] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [storesResult, adminsResult] = await Promise.allSettled([
      getAllStores(),
      getSuperAdmins(),
    ]);
    if (storesResult.status === 'fulfilled') setStores(storesResult.value);
    else toast.error('Error al cargar las tiendas');
    if (adminsResult.status === 'fulfilled') setSuperAdmins(adminsResult.value);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    stores.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm)
    ), [stores, searchTerm]);

  const handleDeleteStore = async (store: AdminStoreView) => {
    if (confirmDeleteInput !== store.name) return;
    setDeletingId(store.id);
    try {
      await deleteStoreTenant(store.id, store.members);
      setStores(prev => prev.filter(s => s.id !== store.id));
      setConfirmDeleteId(null);
      setConfirmDeleteInput('');
      toast.success(`"${store.name}" eliminada`);
    } catch {
      toast.error('Error al eliminar la tienda');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newSaEmail.trim().toLowerCase();
    if (!email) return;
    if (superAdmins.includes(email)) { toast.error('Ya es Super Admin'); return; }
    setIsAddingSa(true);
    try {
      await addSuperAdmin(email);
      setSuperAdmins(prev => [...prev, email]);
      setNewSaEmail('');
      toast.success(`${email} ahora es Super Admin`);
    } catch {
      toast.error('Error al añadir Super Admin');
    } finally {
      setIsAddingSa(false);
    }
  };

  const handleRemoveSuperAdmin = async (email: string) => {
    if (email === user?.email) { toast.error('No puedes eliminarte a ti mismo'); return; }
    setRemovingSaEmail(email);
    try {
      await removeSuperAdmin(email);
      setSuperAdmins(prev => prev.filter(e => e !== email));
      toast.success(`${email} eliminado`);
    } catch {
      toast.error('Error al eliminar Super Admin');
    } finally {
      setRemovingSaEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      <Toaster position="top-right" />

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-60 md:min-h-screen bg-violet-700 flex md:flex-col p-5 gap-4 md:gap-0 flex-shrink-0">
        <div className="flex items-center gap-3 md:mb-10">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Super Admin</p>
            <p className="text-violet-300 text-[10px] mt-0.5">StockMaster Pro</p>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 mb-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <StoreIcon size={13} className="text-violet-300" />
            <span className="text-white/60 text-xs flex-1">Tiendas</span>
            <span className="text-white font-bold text-sm">{stores.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <Users size={13} className="text-violet-300" />
            <span className="text-white/60 text-xs flex-1">Super Admins</span>
            <span className="text-white font-bold text-sm">{superAdmins.length}</span>
          </div>
        </div>

        <div className="ml-auto md:ml-0 md:mt-8 flex md:flex-col gap-3">
          <div className="hidden md:block">
            <p className="text-white/80 text-xs font-semibold truncate">{user?.displayName || user?.email}</p>
            <p className="text-violet-300 text-[10px] truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-violet-300 hover:text-white text-xs font-medium transition-colors md:mt-3"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Global</h1>
            <p className="text-slate-500 text-sm mt-0.5">Tiendas registradas y administradores del sistema</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading} className="gap-2">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refrescar
          </Button>
        </div>

        {/* ── Tiendas ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base">Tiendas registradas</CardTitle>
              <CardDescription>Eliminar una tienda borra todos sus datos de la base de datos</CardDescription>
            </div>
            <div className="relative w-52 flex-shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                <RefreshCw size={18} className="animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <StoreIcon size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No se encontraron tiendas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(store => (
                  <motion.div key={store.id} layout>
                    {/* Row */}
                    <div className="flex items-center gap-4 px-6 py-4">
                      {/* Logo */}
                      <div
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: store.branding?.primaryColor || '#4f46e5' }}
                      >
                        {store.logoUrl
                          ? <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                          : <StoreIcon size={15} className="text-white/90" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 truncate">{store.name}</span>
                          {store.businessType && (
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                              {CATEGORY_LABELS[store.businessType] || store.businessType}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><Users size={10} /> {store.members.length} miembro{store.members.length !== 1 ? 's' : ''}</span>
                          <span className="font-mono text-slate-300">{store.id}</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setConfirmDeleteId(store.id); setConfirmDeleteInput(''); }}
                        className="gap-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 rounded-xl flex-shrink-0"
                      >
                        <Trash2 size={13} /> Eliminar
                      </Button>
                    </div>

                    {/* Confirm delete */}
                    <AnimatePresence>
                      {confirmDeleteId === store.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-6 mb-4 border border-rose-100 bg-rose-50/60 rounded-2xl px-4 py-3 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-rose-700 leading-relaxed">
                                <span className="font-semibold">Esto eliminará todo</span> — productos, ventas, miembros e historial de{' '}
                                <strong>{store.name}</strong>. Esta acción no se puede deshacer.
                                Escribe el nombre para confirmar.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder={`Escribe: ${store.name}`}
                                value={confirmDeleteInput}
                                onChange={e => setConfirmDeleteInput(e.target.value)}
                                className="h-9 text-xs flex-1 border-rose-200 focus:border-rose-400"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                disabled={confirmDeleteInput !== store.name || deletingId === store.id}
                                onClick={() => handleDeleteStore(store)}
                                className="bg-rose-600 hover:bg-rose-700 text-white h-9 rounded-xl text-xs gap-1.5 disabled:opacity-40"
                              >
                                {deletingId === store.id
                                  ? <RefreshCw size={12} className="animate-spin" />
                                  : <Trash2 size={12} />}
                                Eliminar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-9 rounded-xl text-slate-400"
                              >
                                <X size={14} />
                              </Button>
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

        {/* ── Super Admins ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                <ShieldCheck size={15} className="text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">Super Administradores</CardTitle>
                <CardDescription>Cuentas con acceso a este panel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddSuperAdmin} className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newSaEmail}
                  onChange={e => setNewSaEmail(e.target.value)}
                  className="pl-8 h-9 text-sm"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isAddingSa || !newSaEmail.trim()}
                className="h-9 bg-violet-600 hover:bg-violet-700 text-white gap-1.5 disabled:opacity-40"
              >
                {isAddingSa ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
                Agregar
              </Button>
            </form>

            <Separator />

            {superAdmins.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay super admins registrados</p>
            ) : (
              <div className="space-y-1">
                {superAdmins.map(email => {
                  const isSelf = email === user?.email;
                  const isRemoving = removingSaEmail === email;
                  return (
                    <div key={email} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 group transition-colors">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {email[0].toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-slate-700 truncate">{email}</span>
                      {isSelf
                        ? <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-600 border-violet-200">tú</Badge>
                        : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isRemoving}
                            onClick={() => handleRemoveSuperAdmin(email)}
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            {isRemoving ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          </Button>
                        )
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
