import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, LogOut, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Store as StoreIcon, Users, Package, AlertTriangle, Search,
  UserMinus, X, ShoppingCart, UserPlus, Mail,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { AdminStoreView, StoreMember } from '../types';
import { getAllStores, deleteStoreTenant, removeMemberFromStore, getSuperAdmins, addSuperAdmin, removeSuperAdmin } from '../lib/superAdminService';

interface SuperAdminPageProps {
  user: any;
  onLogout: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tecnología', fashion: 'Moda', food: 'Alimentos',
  health: 'Salud', retail: 'Retail', other: 'Otro',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months !== 1 ? 'es' : ''}`;
}

export function SuperAdminPage({ user, onLogout }: SuperAdminPageProps) {
  const [stores, setStores] = useState<AdminStoreView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [superAdmins, setSuperAdmins] = useState<string[]>([]);
  const [newSaEmail, setNewSaEmail] = useState('');
  const [isAddingSa, setIsAddingSa] = useState(false);
  const [removingSaEmail, setRemovingSaEmail] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    // Independent loads — a permissions error on superadmins won't block stores
    const [storesResult, adminsResult] = await Promise.allSettled([
      getAllStores(),
      getSuperAdmins(),
    ]);
    if (storesResult.status === 'fulfilled') setStores(storesResult.value);
    else toast.error('Error al cargar los tenants');
    if (adminsResult.status === 'fulfilled') setSuperAdmins(adminsResult.value);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    stores.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm)
    ), [stores, searchTerm]);

  const totalUsers = useMemo(() => new Set(stores.flatMap(s => s.members.map(m => m.email))).size, [stores]);
  const totalSales = useMemo(() => stores.reduce((a, s) => a + s.saleCount, 0), [stores]);

  const handleDeleteStore = async (store: AdminStoreView) => {
    if (confirmDeleteInput !== store.name) return;
    setDeletingId(store.id);
    try {
      await deleteStoreTenant(store.id, store.members);
      setStores(prev => prev.filter(s => s.id !== store.id));
      setConfirmDeleteId(null);
      setConfirmDeleteInput('');
      toast.success(`Tenant "${store.name}" eliminado`);
    } catch {
      toast.error('Error al eliminar el tenant');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newSaEmail.trim().toLowerCase();
    if (!email) return;
    if (superAdmins.includes(email)) { toast.error('Ese email ya es Super Admin'); return; }
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
      toast.success(`${email} ya no es Super Admin`);
    } catch {
      toast.error('Error al eliminar Super Admin');
    } finally {
      setRemovingSaEmail(null);
    }
  };

  const handleRemoveMember = async (store: AdminStoreView, member: StoreMember) => {
    const key = `${store.id}-${member.email}`;
    setRemovingMemberId(key);
    try {
      await removeMemberFromStore(store.id, member);
      setStores(prev => prev.map(s =>
        s.id === store.id
          ? { ...s, members: s.members.filter(m => m.email !== member.email) }
          : s
      ));
      toast.success(`${member.displayName || member.email} eliminado de ${store.name}`);
    } catch {
      toast.error('Error al eliminar el miembro');
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      <Toaster position="top-right" />

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 md:min-h-screen bg-violet-700 flex md:flex-col flex-row items-center md:items-stretch p-4 md:p-6 gap-4 md:gap-0 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 md:mb-10">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Super Admin</p>
            <p className="text-violet-300 text-[10px] mt-0.5 font-medium">Panel global</p>
          </div>
        </div>

        {/* Stats pills — visible on desktop in sidebar */}
        <div className="hidden md:flex flex-col gap-2 mb-auto">
          {[
            { label: 'Tenants', value: stores.length, icon: <StoreIcon size={13} /> },
            { label: 'Usuarios', value: totalUsers, icon: <Users size={13} /> },
            { label: 'Ventas totales', value: totalSales, icon: <ShoppingCart size={13} /> },
            { label: 'Productos totales', value: stores.reduce((a, s) => a + s.productCount, 0), icon: <Package size={13} /> },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 rounded-xl">
              <span className="text-violet-300">{s.icon}</span>
              <span className="text-white/70 text-xs flex-1">{s.label}</span>
              <span className="text-white font-bold text-sm">{s.value}</span>
            </div>
          ))}
        </div>

        {/* User + logout */}
        <div className="md:mt-8 ml-auto md:ml-0 flex md:flex-col gap-2">
          <div className="hidden md:block">
            <p className="text-white/90 text-xs font-semibold truncate">{user?.displayName || '—'}</p>
            <p className="text-violet-300 text-[10px] truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-violet-300 hover:text-white text-xs font-medium transition-colors mt-1 md:mt-3"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Global</h1>
            <p className="text-slate-500 text-sm mt-0.5">Gestiona todos los tenants y administradores del sistema.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refrescar
          </Button>
        </div>

        {/* ── Stats row (mobile) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:hidden">
          {[
            { label: 'Tenants', value: stores.length, color: 'bg-violet-50 text-violet-600', icon: <StoreIcon size={16} /> },
            { label: 'Usuarios', value: totalUsers, color: 'bg-sky-50 text-sky-600', icon: <Users size={16} /> },
            { label: 'Productos', value: stores.reduce((a, s) => a + s.productCount, 0), color: 'bg-emerald-50 text-emerald-600', icon: <Package size={16} /> },
            { label: 'Ventas', value: totalSales, color: 'bg-amber-50 text-amber-600', icon: <ShoppingCart size={16} /> },
          ].map(s => (
            <Card key={s.label} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tenants ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-bold">Tenants</CardTitle>
              <CardDescription>Todas las tiendas registradas en el sistema</CardDescription>
            </div>
            <div className="relative w-56 flex-shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar tienda…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                <RefreshCw size={20} className="animate-spin" />
                <span className="text-sm">Cargando tenants…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <StoreIcon size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No se encontraron tiendas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(store => (
                  <motion.div key={store.id} layout>
                    {/* Store row */}
                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: store.branding?.primaryColor || '#4f46e5' }}
                      >
                        {store.logoUrl
                          ? <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                          : <StoreIcon size={16} className="text-white/90" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900">{store.name}</span>
                          {store.businessType && (
                            <Badge variant="secondary" className="text-[10px]">
                              {CATEGORY_LABELS[store.businessType] || store.businessType}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1"><Users size={10} /> {store.members.length} miembro{store.members.length !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><Package size={10} /> {store.productCount} productos</span>
                          <span className="flex items-center gap-1"><ShoppingCart size={10} /> {store.saleCount} ventas</span>
                          <span className="text-slate-300">{timeAgo(store.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setExpandedId(expandedId === store.id ? null : store.id); setConfirmDeleteId(null); }}
                          className="gap-1.5 text-xs text-slate-500 hover:text-slate-900 h-8 rounded-xl"
                        >
                          <Users size={13} />
                          {expandedId === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setConfirmDeleteId(store.id); setConfirmDeleteInput(''); setExpandedId(null); }}
                          className="gap-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 rounded-xl"
                        >
                          <Trash2 size={13} /> Eliminar
                        </Button>
                      </div>
                    </div>

                    {/* Delete confirmation */}
                    <AnimatePresence>
                      {confirmDeleteId === store.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-6 mb-4 border border-rose-100 bg-rose-50/60 rounded-2xl px-4 py-3 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-rose-700 leading-relaxed">
                                <span className="font-semibold">Acción irreversible.</span> Se eliminarán todos los datos de{' '}
                                <strong>{store.name}</strong>. Escribe el nombre para confirmar.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder={`Escribe: ${store.name}`}
                                value={confirmDeleteInput}
                                onChange={e => setConfirmDeleteInput(e.target.value)}
                                className="h-9 text-xs flex-1 border-rose-200 focus:border-rose-400"
                              />
                              <Button
                                size="sm"
                                disabled={confirmDeleteInput !== store.name || deletingId === store.id}
                                onClick={() => handleDeleteStore(store)}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5 disabled:opacity-40 h-9"
                              >
                                {deletingId === store.id ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                Eliminar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)} className="h-9 rounded-xl text-slate-400">
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Members panel */}
                    <AnimatePresence>
                      {expandedId === store.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-6 pt-3 pb-1">
                              Miembros ({store.members.length})
                            </p>
                            {store.members.length === 0 ? (
                              <p className="text-xs text-slate-400 px-6 py-3">Sin miembros registrados</p>
                            ) : (
                              <Table>
                                <TableBody>
                                  {store.members.map(member => {
                                    const key = `${store.id}-${member.email}`;
                                    const isRemoving = removingMemberId === key;
                                    return (
                                      <TableRow key={member.email} className="group hover:bg-slate-100/60">
                                        <TableCell className="py-2 pl-6">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                              {(member.displayName || member.email)[0].toUpperCase()}
                                            </div>
                                            <div>
                                              <p className="text-xs font-medium text-slate-700">{member.displayName || '—'}</p>
                                              <p className="text-[10px] text-slate-400">{member.email}</p>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] capitalize ${member.role === 'admin' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}
                                          >
                                            {member.role === 'admin' ? 'Admin' : 'Empleado'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 pr-4 text-right">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isRemoving}
                                            onClick={() => handleRemoveMember(store, member)}
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                          >
                                            {isRemoving ? <RefreshCw size={11} className="animate-spin" /> : <UserMinus size={11} />}
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            )}
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
                <ShieldCheck size={16} className="text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Super Administradores</CardTitle>
                <CardDescription>Cuentas con acceso global al panel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add form */}
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
                Añadir
              </Button>
            </form>

            <Separator />

            {/* List */}
            {superAdmins.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay super admins registrados</p>
            ) : (
              <div className="space-y-1">
                {superAdmins.map(email => {
                  const isSelf = email === user?.email;
                  const isRemoving = removingSaEmail === email;
                  return (
                    <div
                      key={email}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 group transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {email[0].toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-slate-700 truncate">{email}</span>
                      {isSelf && (
                        <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">tú</Badge>
                      )}
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isRemoving}
                          onClick={() => handleRemoveSuperAdmin(email)}
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          {isRemoving ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 pb-4">StockMaster Pro · Panel Global</p>
      </main>
    </div>
  );
}
