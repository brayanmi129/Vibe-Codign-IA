import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, LogOut, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Store as StoreIcon, Users, Package, AlertTriangle, Search,
  UserMinus, X, Moon, Sun, ShoppingCart, UserPlus, Mail,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
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

// ── Theme tokens ──────────────────────────────────────────────────────────────
function useTheme(dark: boolean) {
  return {
    page:        dark ? 'bg-slate-950 text-white'              : 'bg-slate-50 text-slate-900',
    header:      dark ? 'bg-slate-950 border-slate-800'        : 'bg-white border-slate-200',
    headerSub:   dark ? 'text-slate-500'                       : 'text-slate-400',
    headerEmail: dark ? 'text-slate-500'                       : 'text-slate-400',
    logoutBtn:   dark ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    toggleBtn:   dark ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    statCard:    dark ? 'bg-slate-900 border-slate-800'        : 'bg-white border-slate-200',
    statValue:   dark ? 'text-white'                           : 'text-slate-900',
    statLabel:   dark ? 'text-slate-500'                       : 'text-slate-500',
    input:       dark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
    inputIcon:   dark ? 'text-slate-500'                       : 'text-slate-400',
    refreshBtn:  dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    storeCard:   dark ? 'bg-slate-900 border-slate-800'        : 'bg-white border-slate-200 shadow-sm',
    storeName:   dark ? 'text-white'                           : 'text-slate-900',
    storeBadge:  dark ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-slate-100 text-slate-500 border-transparent',
    storeMeta:   dark ? 'text-slate-500'                       : 'text-slate-400',
    storeId:     dark ? 'text-slate-700'                       : 'text-slate-300',
    actionBtn:   dark ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    expandBorder:dark ? 'border-slate-800'                     : 'border-slate-100',
    memberArea:  dark ? 'bg-transparent'                       : 'bg-slate-50/50',
    memberLabel: dark ? 'text-slate-600'                       : 'text-slate-400',
    memberRow:   dark ? 'hover:bg-slate-800/50'                : 'hover:bg-slate-100/60',
    memberAvatar:dark ? 'bg-slate-800 text-slate-400'          : 'bg-slate-200 text-slate-500',
    memberName:  dark ? 'text-slate-300'                       : 'text-slate-700',
    memberEmail: dark ? 'text-slate-600'                       : 'text-slate-400',
    memberEmpty: dark ? 'text-slate-600'                       : 'text-slate-400',
    removeBtn:   dark ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10'
                      : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50',
    confirmArea: dark ? 'border-slate-800 bg-rose-950/30'      : 'border-slate-100 bg-rose-50/60',
    confirmText: dark ? 'text-rose-300'                        : 'text-rose-700',
    confirmCode: dark ? 'bg-rose-900/50'                       : 'bg-rose-100',
    confirmInput:dark ? 'bg-slate-900 border-rose-900 text-white placeholder:text-slate-600'
                      : 'bg-white border-rose-200 text-slate-900 placeholder:text-slate-400',
    emptyText:   dark ? 'text-slate-600'                       : 'text-slate-400',
    footer:      dark ? 'text-slate-700'                       : 'text-slate-400',
    footerCode:  dark ? 'bg-slate-800'                         : 'bg-slate-200',
    roleBadge: {
      admin:    dark ? 'bg-violet-900/50 text-violet-300 border-violet-800'
                     : 'bg-violet-100 text-violet-700 border-transparent',
      employee: dark ? 'bg-sky-900/50 text-sky-300 border-sky-800'
                     : 'bg-sky-100 text-sky-700 border-transparent',
    },
    saCard:    dark ? 'bg-slate-900 border-slate-800'        : 'bg-white border-slate-200 shadow-sm',
    saRow:     dark ? 'hover:bg-slate-800/50'                : 'hover:bg-slate-50',
    saName:    dark ? 'text-slate-200'                       : 'text-slate-800',
    saRemove:  dark ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10'
                    : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50',
    saInput:   dark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
  };
}

export function SuperAdminPage({ user, onLogout }: SuperAdminPageProps) {
  const [dark, setDark] = useState(false);
  const t = useTheme(dark);

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
    try {
      const [storesData, adminsData] = await Promise.all([getAllStores(), getSuperAdmins()]);
      setStores(storesData);
      setSuperAdmins(adminsData);
    } catch {
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    stores.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm)
    ), [stores, searchTerm]);

  const totalUsers  = useMemo(() => new Set(stores.flatMap(s => s.members.map(m => m.email))).size, [stores]);
  const totalSales  = useMemo(() => stores.reduce((a, s) => a + s.saleCount, 0), [stores]);

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
    if (superAdmins.includes(email)) {
      toast.error('Ese email ya es Super Admin');
      return;
    }
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
    if (email === user?.email) {
      toast.error('No puedes eliminarte a ti mismo como Super Admin');
      return;
    }
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
      setStores(prev =>
        prev.map(s =>
          s.id === store.id
            ? { ...s, members: s.members.filter(m => m.email !== member.email) }
            : s
        )
      );
      toast.success(`${member.displayName || member.email} eliminado de ${store.name}`);
    } catch {
      toast.error('Error al eliminar el miembro');
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${t.page}`}>

      {/* ── Header ── */}
      <header className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm ${t.header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Super Admin</h1>
            <p className={`text-[10px] mt-0.5 ${t.headerSub}`}>Panel de control global</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs hidden md:block mr-2 ${t.headerEmail}`}>{user?.email}</span>
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark(d => !d)}
            className={`h-8 w-8 rounded-xl transition-colors ${t.toggleBtn}`}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className={`gap-2 rounded-xl transition-colors ${t.logoutBtn}`}
          >
            <LogOut size={14} /> Salir
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <StoreIcon size={18} />,    label: 'Tenants',        value: stores.length,    accent: 'text-violet-500',  bg: dark ? 'bg-violet-500/10' : 'bg-violet-50' },
            { icon: <Users size={18} />,         label: 'Usuarios únicos',value: totalUsers,       accent: 'text-sky-500',     bg: dark ? 'bg-sky-500/10'    : 'bg-sky-50'    },
            { icon: <Package size={18} />,       label: 'Productos',      value: stores.reduce((a, s) => a + s.productCount, 0), accent: 'text-emerald-500', bg: dark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
            { icon: <ShoppingCart size={18} />,  label: 'Ventas totales', value: totalSales,       accent: 'text-amber-500',   bg: dark ? 'bg-amber-500/10'  : 'bg-amber-50'  },
          ].map(stat => (
            <div key={stat.label} className={`border rounded-2xl p-4 flex items-center gap-3 transition-colors ${t.statCard}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.accent}`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-xl font-bold ${t.statValue}`}>{stat.value}</p>
                <p className={`text-[10px] font-medium ${t.statLabel}`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`} />
            <Input
              placeholder="Buscar tienda por nombre o ID…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`pl-9 h-10 rounded-xl transition-colors ${t.input}`}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isLoading}
            className={`rounded-xl gap-2 transition-colors ${t.refreshBtn}`}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refrescar
          </Button>
        </div>

        {/* ── Store list ── */}
        {isLoading ? (
          <div className={`flex flex-col items-center gap-3 py-24 ${t.emptyText}`}>
            <RefreshCw size={28} className="animate-spin opacity-40" />
            <p className="text-sm">Cargando tenants…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-24 ${t.emptyText}`}>
            <StoreIcon size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No se encontraron tiendas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(store => (
              <motion.div
                key={store.id}
                layout
                className={`border rounded-2xl overflow-hidden transition-colors ${t.storeCard}`}
              >
                {/* Store row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Logo */}
                  <div
                    className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
                    style={{ backgroundColor: store.branding?.primaryColor || '#4f46e5' }}
                  >
                    {store.logoUrl
                      ? <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                      : <StoreIcon size={17} className="text-white/90" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-sm ${t.storeName}`}>{store.name}</h3>
                      {store.businessType && (
                        <Badge className={`text-[10px] font-medium ${t.storeBadge}`}>
                          {CATEGORY_LABELS[store.businessType] || store.businessType}
                        </Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-3 mt-1 flex-wrap text-[11px] ${t.storeMeta}`}>
                      <span className="flex items-center gap-1"><Users size={10} /> {store.members.length} miembro{store.members.length !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Package size={10} /> {store.productCount} productos</span>
                      <span className="flex items-center gap-1"><ShoppingCart size={10} /> {store.saleCount} ventas</span>
                      <span>{timeAgo(store.createdAt)}</span>
                    </div>
                    <p className={`text-[10px] font-mono mt-0.5 truncate ${t.storeId}`}>{store.id}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setExpandedId(expandedId === store.id ? null : store.id); setConfirmDeleteId(null); }}
                      className={`gap-1.5 text-xs rounded-xl transition-colors ${t.actionBtn}`}
                    >
                      <Users size={13} />
                      {expandedId === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setConfirmDeleteId(store.id); setConfirmDeleteInput(''); setExpandedId(null); }}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-1.5 text-xs rounded-xl transition-colors"
                    >
                      <Trash2 size={13} /> Eliminar
                    </Button>
                  </div>
                </div>

                {/* ── Delete confirmation ── */}
                <AnimatePresence>
                  {confirmDeleteId === store.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`border-t px-4 py-4 space-y-3 ${t.confirmArea}`}>
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
                          <div className={`text-xs leading-relaxed ${t.confirmText}`}>
                            <p className="font-semibold mb-1">Esta acción es irreversible.</p>
                            <p>Se eliminarán todos los datos de <strong>{store.name}</strong>: productos, ventas, miembros y sucursales.</p>
                            <p className="mt-1">Escribe <code className={`px-1 py-0.5 rounded ${t.confirmCode}`}>{store.name}</code> para confirmar.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Escribe: ${store.name}`}
                            value={confirmDeleteInput}
                            onChange={e => setConfirmDeleteInput(e.target.value)}
                            className={`h-9 text-xs rounded-xl flex-1 ${t.confirmInput}`}
                          />
                          <Button
                            size="sm"
                            disabled={confirmDeleteInput !== store.name || deletingId === store.id}
                            onClick={() => handleDeleteStore(store)}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5 disabled:opacity-40"
                          >
                            {deletingId === store.id
                              ? <RefreshCw size={12} className="animate-spin" />
                              : <Trash2 size={12} />
                            }
                            Eliminar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className={`rounded-xl ${t.actionBtn}`}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Members panel ── */}
                <AnimatePresence>
                  {expandedId === store.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`border-t px-4 py-3 space-y-1 ${t.expandBorder} ${t.memberArea}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${t.memberLabel}`}>
                          Miembros ({store.members.length})
                        </p>
                        {store.members.length === 0 ? (
                          <p className={`text-xs py-3 ${t.memberEmpty}`}>Sin miembros registrados</p>
                        ) : (
                          store.members.map(member => {
                            const key = `${store.id}-${member.email}`;
                            const isRemoving = removingMemberId === key;
                            const roleClass = t.roleBadge[member.role as keyof typeof t.roleBadge] || t.roleBadge.employee;
                            return (
                              <div
                                key={member.email}
                                className={`flex items-center gap-3 py-2 px-3 rounded-xl group transition-colors ${t.memberRow}`}
                              >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${t.memberAvatar}`}>
                                  {(member.displayName || member.email)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${t.memberName}`}>
                                    {member.displayName || '—'}
                                  </p>
                                  <p className={`text-[10px] truncate ${t.memberEmail}`}>{member.email}</p>
                                </div>
                                <Badge className={`text-[10px] capitalize border ${roleClass}`}>
                                  {member.role}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isRemoving}
                                  onClick={() => handleRemoveMember(store, member)}
                                  className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-all rounded-lg ${t.removeBtn}`}
                                >
                                  {isRemoving
                                    ? <RefreshCw size={11} className="animate-spin" />
                                    : <UserMinus size={11} />
                                  }
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Super Admins section ── */}
        <div className={`border rounded-2xl overflow-hidden transition-colors ${t.saCard}`}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'inherit' }}>
            <div className="w-8 h-8 bg-violet-600/10 rounded-xl flex items-center justify-center">
              <ShieldCheck size={15} className="text-violet-500" />
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-bold ${t.storeName}`}>Super Administradores</h3>
              <p className={`text-[11px] ${t.storeMeta}`}>{superAdmins.length} cuenta{superAdmins.length !== 1 ? 's' : ''} con acceso global</p>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddSuperAdmin} className="flex gap-2 px-5 py-4">
            <div className="relative flex-1">
              <Mail size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`} />
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={newSaEmail}
                onChange={e => setNewSaEmail(e.target.value)}
                className={`pl-8 h-9 rounded-xl text-sm transition-colors ${t.saInput}`}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isAddingSa || !newSaEmail.trim()}
              className="h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs disabled:opacity-40"
            >
              {isAddingSa
                ? <RefreshCw size={12} className="animate-spin" />
                : <UserPlus size={13} />
              }
              Añadir
            </Button>
          </form>

          {/* List */}
          <div className="px-2 pb-3 space-y-0.5">
            {superAdmins.length === 0 ? (
              <p className={`text-xs text-center py-4 ${t.memberEmpty}`}>Sin super admins registrados</p>
            ) : (
              superAdmins.map(email => {
                const isSelf = email === user?.email;
                const isRemoving = removingSaEmail === email;
                return (
                  <div
                    key={email}
                    className={`flex items-center gap-3 py-2 px-3 rounded-xl group transition-colors ${t.saRow}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${t.memberAvatar}`}>
                      {email[0].toUpperCase()}
                    </div>
                    <span className={`flex-1 text-sm truncate ${t.saName}`}>{email}</span>
                    {isSelf && (
                      <Badge className={`text-[10px] border ${t.roleBadge.admin}`}>tú</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isRemoving || isSelf}
                      onClick={() => handleRemoveSuperAdmin(email)}
                      title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Quitar Super Admin'}
                      className={`h-7 w-7 rounded-lg transition-all ${isSelf ? 'opacity-0 pointer-events-none' : `opacity-0 group-hover:opacity-100 ${t.saRemove}`}`}
                    >
                      {isRemoving
                        ? <RefreshCw size={11} className="animate-spin" />
                        : <Trash2 size={11} />
                      }
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p className={`text-center text-[11px] pb-4 ${t.footer}`}>
          StockMaster Pro · Panel Global
        </p>
      </div>
    </div>
  );
}
