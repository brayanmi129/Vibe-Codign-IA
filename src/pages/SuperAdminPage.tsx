import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, LogOut, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Store as StoreIcon, Users, Package, AlertTriangle, Search, UserMinus, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { AdminStoreView, StoreMember } from '../types';
import { getAllStores, deleteStoreTenant, removeMemberFromStore } from '../lib/superAdminService';

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

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700',
  employee: 'bg-sky-100 text-sky-700',
  viewer: 'bg-slate-100 text-slate-600',
};

export function SuperAdminPage({ user, onLogout }: SuperAdminPageProps) {
  const [stores, setStores] = useState<AdminStoreView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getAllStores();
      setStores(data);
    } catch {
      toast.error('Error al cargar los tenants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    stores.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm)
    ),
    [stores, searchTerm]
  );

  const totalUsers = useMemo(() =>
    new Set(stores.flatMap(s => s.members.map(m => m.email))).size,
    [stores]
  );

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
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Super Admin</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Panel de control global</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 hidden md:block">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2"
          >
            <LogOut size={14} /> Salir
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: <StoreIcon size={18} />, label: 'Tenants', value: stores.length, color: 'text-violet-400' },
            { icon: <Users size={18} />, label: 'Usuarios únicos', value: totalUsers, color: 'text-sky-400' },
            { icon: <Package size={18} />, label: 'Total productos', value: stores.reduce((a, s) => a + s.productCount, 0), color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className={`${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Buscar tienda por nombre o ID…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isLoading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refrescar
          </Button>
        </div>

        {/* Store list */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-600">
            <RefreshCw size={28} className="animate-spin" />
            <p className="text-sm">Cargando tenants…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <StoreIcon size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron tiendas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(store => (
              <motion.div
                key={store.id}
                layout
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
              >
                {/* Store row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Logo / color block */}
                  <div
                    className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: store.branding?.primaryColor || '#4f46e5' }}
                  >
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <StoreIcon size={18} className="text-white/80" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{store.name}</h3>
                      {store.businessType && (
                        <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] font-medium">
                          {CATEGORY_LABELS[store.businessType] || store.businessType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users size={10} /> {store.members.length} miembro{store.members.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Package size={10} /> {store.productCount} productos
                      </span>
                      <span className="text-[11px] text-slate-600">{timeAgo(store.createdAt)}</span>
                    </div>
                    <p className="text-[10px] text-slate-700 font-mono mt-0.5 truncate">{store.id}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === store.id ? null : store.id)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5 text-xs rounded-xl"
                    >
                      <Users size={13} />
                      {expandedId === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfirmDeleteId(store.id);
                        setConfirmDeleteInput('');
                        setExpandedId(null);
                      }}
                      className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5 text-xs rounded-xl"
                    >
                      <Trash2 size={13} /> Eliminar
                    </Button>
                  </div>
                </div>

                {/* Delete confirmation panel */}
                <AnimatePresence>
                  {confirmDeleteId === store.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-800 bg-rose-950/30 px-4 py-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={15} className="text-rose-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-rose-300 leading-relaxed">
                            <p className="font-semibold mb-1">Esta acción es irreversible.</p>
                            <p>Se eliminarán todos los productos, ventas, miembros y datos de <strong>{store.name}</strong>.</p>
                            <p className="mt-1">Escribe <code className="bg-rose-900/50 px-1 rounded">{store.name}</code> para confirmar.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Escribe: ${store.name}`}
                            value={confirmDeleteInput}
                            onChange={e => setConfirmDeleteInput(e.target.value)}
                            className="h-9 bg-slate-900 border-rose-900 text-white placeholder:text-slate-600 text-xs rounded-xl flex-1"
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
                            Eliminar tenant
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-slate-400 hover:text-white rounded-xl"
                          >
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
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-800 px-4 py-3 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                          Miembros ({store.members.length})
                        </p>
                        {store.members.length === 0 ? (
                          <p className="text-xs text-slate-600 py-3">Sin miembros registrados</p>
                        ) : (
                          store.members.map(member => {
                            const key = `${store.id}-${member.email}`;
                            const isRemoving = removingMemberId === key;
                            return (
                              <div
                                key={member.email}
                                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-800/50 group transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                                  {(member.displayName || member.email)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-300 truncate">
                                    {member.displayName || '—'}
                                  </p>
                                  <p className="text-[10px] text-slate-600 truncate">{member.email}</p>
                                </div>
                                <Badge className={`text-[10px] capitalize ${ROLE_COLORS[member.role] || ROLE_COLORS.viewer} border-0`}>
                                  {member.role}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isRemoving}
                                  onClick={() => handleRemoveMember(store, member)}
                                  className="h-7 w-7 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
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

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-700">
          Para añadir un Super Admin, crea un documento en <code className="bg-slate-800 px-1 rounded">superadmins/&#123;uid&#125;</code> en la consola de Firebase.
        </p>
      </div>
    </div>
  );
}
