import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Search, Users, ArrowLeft, Phone, Mail, MapPin, ShoppingBag, TrendingUp,
  Calendar, Star, User as UserIcon, Building2, ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { CustomerRecord, SaleRecord, ID_TYPE_SHORT, ID_TYPE_LABELS, buildCustomerKey } from "@/types";
import { StatCard } from "@/components/StatCard";

interface CustomersPageProps {
  customers: CustomerRecord[];
  sales: SaleRecord[];
}

// "Hace X tiempo"
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  return `hace ${Math.floor(days / 365)} años`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CustomersPage({ customers, sales }: CustomersPageProps) {
  const [search, setSearch] = React.useState("");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  const filteredCustomers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.idNumber.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  }, [customers, search]);

  // Stats agregados
  const stats = React.useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const recurring = customers.filter(c => c.totalPurchases >= 2).length;
    const avgTicket = totalCustomers > 0 ? totalRevenue / customers.reduce((acc, c) => acc + c.totalPurchases, 0) : 0;
    return { totalCustomers, totalRevenue, recurring, avgTicket };
  }, [customers]);

  const selected = selectedKey ? customers.find(c => c.id === selectedKey) || null : null;

  // Ventas del cliente seleccionado — se hace match por idType + idNumber normalizados.
  const customerSales = React.useMemo(() => {
    if (!selected) return [];
    return sales.filter(s => {
      if (!s.customer) return false;
      const key = buildCustomerKey(s.customer.idType || 'CC', s.customer.idNumber);
      return key === selected.id;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selected, sales]);

  return (
    <motion.div
      key="customers"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {selected === null ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clientes</h2>
              <p className="text-sm text-slate-500 mt-1">
                Cada persona o empresa que ha comprado en tu tienda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Clientes" value={stats.totalCustomers.toString()} icon={<Users className="text-brand-primary" />} />
              <StatCard title="Recurrentes" value={stats.recurring.toString()} icon={<Star className="text-amber-500" />} />
              <StatCard title="Ingresos Histórico" value={formatCurrency(stats.totalRevenue)} icon={<TrendingUp className="text-emerald-600" />} />
              <StatCard title="Ticket Promedio" value={formatCurrency(Math.round(stats.avgTicket || 0))} icon={<ShoppingBag className="text-violet-600" />} />
            </div>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Directorio</CardTitle>
                    <CardDescription>
                      {filteredCustomers.length === customers.length
                        ? `${customers.length} cliente${customers.length !== 1 ? 's' : ''} registrado${customers.length !== 1 ? 's' : ''}`
                        : `${filteredCustomers.length} de ${customers.length} mostrados`}
                    </CardDescription>
                  </div>
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Buscar por nombre, documento, email..."
                      className="pl-9 h-9 bg-slate-50 border-slate-200"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="font-semibold">Documento</TableHead>
                        <TableHead className="font-semibold">Contacto</TableHead>
                        <TableHead className="text-center font-semibold">Compras</TableHead>
                        <TableHead className="text-right font-semibold">Total Gastado</TableHead>
                        <TableHead className="font-semibold">Última Compra</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => {
                        const isRecurring = customer.totalPurchases >= 2;
                        const isCompany = customer.idType === 'NIT';
                        return (
                          <TableRow
                            key={customer.id}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                            onClick={() => setSelectedKey(customer.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  isCompany
                                    ? 'bg-amber-100 text-amber-700'
                                    : isRecurring
                                      ? 'bg-violet-100 text-violet-700'
                                      : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {isCompany ? <Building2 size={14} /> : initials(customer.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">{customer.fullName}</p>
                                  {isRecurring && (
                                    <Badge variant="secondary" className="bg-violet-50 text-violet-700 text-[9px] mt-0.5">
                                      <Star size={8} className="mr-1" /> Recurrente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <Badge variant="outline" className="text-[10px] mb-0.5">
                                  {ID_TYPE_SHORT[customer.idType]}
                                </Badge>
                                <p className="font-mono text-xs text-slate-500">{customer.idNumber}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-0.5">
                                {customer.phone && (
                                  <p className="flex items-center gap-1 text-slate-600">
                                    <Phone size={10} /> {customer.phone}
                                  </p>
                                )}
                                {customer.email && (
                                  <p className="flex items-center gap-1 text-slate-500 truncate max-w-[180px]">
                                    <Mail size={10} /> {customer.email}
                                  </p>
                                )}
                                {!customer.phone && !customer.email && (
                                  <span className="text-slate-300 italic text-[11px]">Sin contacto</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-slate-700">{customer.totalPurchases}</span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-700">
                              {formatCurrency(customer.totalSpent)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {timeAgo(customer.lastPurchaseAt)}
                            </TableCell>
                            <TableCell>
                              <ChevronRight size={16} className="text-slate-300" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredCustomers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-64 text-center">
                            <div className="flex flex-col items-center gap-3 py-6">
                              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <Users size={24} className="text-slate-300" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">
                                  {search ? 'No se encontraron clientes' : 'Aún no tienes clientes registrados'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {search ? 'Prueba con otro término.' : 'Se irán creando automáticamente con cada venta facturada.'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // ─── Detalle del cliente ────────────────────────────────────
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedKey(null)}
                className="gap-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 -ml-2"
              >
                <ArrowLeft size={16} />
                Volver al directorio
              </Button>
            </div>

            {/* Encabezado del cliente */}
            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black flex-shrink-0 ${
                    selected.idType === 'NIT'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                      : selected.totalPurchases >= 2
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                        : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'
                  } shadow-lg`}>
                    {selected.idType === 'NIT' ? <Building2 size={32} /> : initials(selected.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selected.fullName}</h3>
                      {selected.totalPurchases >= 2 && (
                        <Badge className="bg-violet-100 text-violet-700 border-none">
                          <Star size={10} className="mr-1" /> Cliente recurrente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      <Badge variant="outline" className="mr-2 text-[10px]">{ID_TYPE_LABELS[selected.idType]}</Badge>
                      <span className="font-mono">{selected.idNumber}</span>
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                      {selected.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {selected.phone}</span>}
                      {selected.email && <span className="flex items-center gap-1.5"><Mail size={12} /> {selected.email}</span>}
                      {selected.address && <span className="flex items-center gap-1.5"><MapPin size={12} /> {selected.address}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats personales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Compras"
                value={selected.totalPurchases.toString()}
                icon={<ShoppingBag className="text-brand-primary" />}
              />
              <StatCard
                title="Total Gastado"
                value={formatCurrency(selected.totalSpent)}
                icon={<TrendingUp className="text-emerald-600" />}
              />
              <StatCard
                title="Ticket Promedio"
                value={formatCurrency(Math.round(selected.totalSpent / selected.totalPurchases))}
                icon={<Star className="text-amber-500" />}
              />
              <StatCard
                title="Cliente Desde"
                value={timeAgo(selected.firstPurchaseAt)}
                icon={<Calendar className="text-violet-600" />}
              />
            </div>

            {/* Historial de compras */}
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag size={18} className="text-brand-primary" />
                  Historial de Compras
                </CardTitle>
                <CardDescription>
                  Todas las facturas emitidas a {selected.fullName}.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Factura</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerSales.map(sale => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <span className="font-mono text-xs font-bold text-brand-secondary bg-indigo-50 px-2 py-1 rounded-lg">
                              {sale.invoiceNumber || `#${sale.id.slice(-6).toUpperCase()}`}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(sale.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5 max-w-md">
                              {sale.items.slice(0, 3).map((item, idx) => (
                                <p key={idx}>
                                  <span className="font-semibold">{item.productName}</span>
                                  <span className="text-slate-400 ml-1">x{item.quantity}</span>
                                </p>
                              ))}
                              {sale.items.length > 3 && (
                                <p className="text-slate-400 italic">
                                  + {sale.items.length - 3} producto{sale.items.length - 3 !== 1 ? 's' : ''} más
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-800">
                            {formatCurrency(sale.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {customerSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center text-slate-400 italic">
                            Sin ventas registradas en este historial.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {customerSales.length > 0 && (
                  <>
                    <Separator />
                    <div className="bg-slate-50 px-6 py-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-600">Total facturado</span>
                      <span className="font-black text-emerald-700">
                        {formatCurrency(customerSales.reduce((acc, s) => acc + s.totalAmount, 0))}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
