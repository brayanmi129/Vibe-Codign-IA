import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ShoppingCart, DollarSign, TrendingUp, Download, Eye, MapPin, Phone, User as UserIcon, MessageCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/formatters";
import { downloadInvoicePdf } from "@/lib/invoiceService";
import { SaleRecord, Branch, Store } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface SalesPageProps {
  sales: SaleRecord[];
  salesDateFilter: string;
  setSalesDateFilter: (v: string) => void;
  salesRangeType: 'day' | 'week' | 'month';
  setSalesRangeType: (v: 'day' | 'week' | 'month') => void;
  activeBranchId: string | null;
  branches: Branch[];
  currentStore: Store;
}

export function SalesPage({
  sales, salesDateFilter, setSalesDateFilter, salesRangeType, setSalesRangeType,
  activeBranchId, branches, currentStore,
}: SalesPageProps) {
  const [selectedReceipt, setSelectedReceipt] = React.useState<SaleRecord | null>(null);

  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.date);
    const filterDate = new Date(salesDateFilter);
    const matchesBranch = !activeBranchId || s.branchId === activeBranchId;
    if (!matchesBranch) return false;
    if (salesRangeType === 'day') return s.date.startsWith(salesDateFilter);
    if (salesRangeType === 'week') {
      const startOfWeek = new Date(filterDate);
      startOfWeek.setDate(filterDate.getDate() - filterDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return saleDate >= startOfWeek && saleDate <= endOfWeek;
    }
    return saleDate.getMonth() === filterDate.getMonth() && saleDate.getFullYear() === filterDate.getFullYear();
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalUnits = filteredSales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);

  const rangeLabel = (() => {
    const filterDate = new Date(salesDateFilter);
    if (salesRangeType === 'day') return "Reporte Diario";
    if (salesRangeType === 'week') {
      const start = new Date(filterDate);
      start.setDate(filterDate.getDate() - filterDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    const start = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
    const end = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  })();

  return (
    <motion.div
      key="sales"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none">
              <Label htmlFor="sales-date" className="text-xs font-semibold text-slate-500 mb-1 block">Fecha de Referencia</Label>
              <Input
                id="sales-date"
                type="date"
                value={salesDateFilter}
                onChange={(e) => setSalesDateFilter(e.target.value)}
                className="h-9 bg-slate-50"
              />
            </div>
            <div className="flex-1 md:flex-none">
              <Label className="text-xs font-semibold text-slate-500 mb-1 block">Rango de Reporte</Label>
              <Select value={salesRangeType} onValueChange={(v: any) => setSalesRangeType(v)}>
                <SelectTrigger className="h-9 w-full md:w-[140px] bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Día Único</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Calendar size={16} />
            <span className="font-medium">{rangeLabel}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Unidades Vendidas"
          value={totalUnits.toString()}
          icon={<ShoppingCart className="text-brand-primary" />}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="text-emerald-600" />}
        />
        <StatCard
          title="Promedio por Venta"
          value={formatCurrency(filteredSales.length ? (totalRevenue / filteredSales.length) : 0)}
          icon={<TrendingUp className="text-brand-primary" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {salesRangeType === 'day' ? (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Detalle de Ventas</CardTitle>
              <CardDescription>Listado completo de transacciones para el día seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold">Código / Factura</TableHead>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Producto</TableHead>
                      <TableHead className="font-semibold">Sucursal</TableHead>
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Cant.</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="text-center font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sale) => {
                        const branchName = branches.find(b => b.id === sale.branchId)?.name;
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>
                              {sale.invoiceNumber ? (
                                <span className="font-mono text-xs font-bold text-brand-secondary bg-indigo-50 px-2 py-1 rounded-lg">
                                  {sale.invoiceNumber}
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-slate-400">
                                  #{sale.id.slice(-6).toUpperCase()}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {sale.customer ? (
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{sale.customer.fullName}</p>
                                  <p className="text-[10px] text-slate-400">{sale.customer.idNumber}</p>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs italic">Anónimo</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex flex-col gap-1">
                                {(sale.items || []).map((item, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-semibold">{item.productName}</span>
                                    <span className="text-slate-500 ml-1">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {branchName ? (
                                <Badge variant="secondary" className="bg-indigo-50 text-brand-secondary text-[10px]">
                                  {branchName}
                                </Badge>
                              ) : <span className="text-slate-300 text-xs">—</span>}
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs">
                              {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>{(sale.items || []).reduce((acc, i) => acc + i.quantity, 0)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(sale.totalAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                  onClick={() => setSelectedReceipt(sale)}
                                  title="Ver Recibo Digital"
                                >
                                  <Eye size={14} />
                                </Button>
                                {sale.customer && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-indigo-400 hover:text-brand-primary hover:bg-indigo-50"
                                    title={`Descargar ${sale.invoiceNumber || 'factura'}`}
                                    onClick={() => downloadInvoicePdf({
                                      sale,
                                      store: currentStore,
                                      customer: sale.customer!,
                                    })}
                                  >
                                    <Download size={14} />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredSales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-64 text-center">
                          <div className="flex flex-col items-center gap-3 py-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                              <ShoppingCart size={24} className="text-slate-300" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">Sin ventas en este día</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Cambia el filtro de fecha o registra una nueva venta para empezar.
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
        ) : (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Resumen Agrupado</CardTitle>
              <CardDescription>Ventas consolidadas por día en el rango seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                const grouped = filteredSales.reduce((acc, s) => {
                  const date = s.date.split('T')[0];
                  if (!acc[date]) acc[date] = { date, total: 0, units: 0 };
                  acc[date].total += s.totalAmount;
                  acc[date].units += (s.items || []).reduce((sum, item) => sum + item.quantity, 0);
                  return acc;
                }, {} as Record<string, any>);

                const sortedGrouped = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));

                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Unidades</TableHead>
                          <TableHead className="text-right">Ingresos Totales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedGrouped.map((group: any) => (
                          <TableRow key={group.date}>
                            <TableCell className="font-medium">{new Date(group.date).toLocaleDateString()}</TableCell>
                            <TableCell>{group.units}</TableCell>
                            <TableCell className="text-right font-bold text-brand-primary">
                              {formatCurrency(group.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {sortedGrouped.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="h-64 text-center">
                              <div className="flex flex-col items-center gap-3 py-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                                  <Calendar size={24} className="text-slate-300" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-700">Sin datos en este rango</p>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Prueba seleccionando otra semana o mes.
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-[380px] p-0 border-none bg-slate-50 overflow-hidden">
          {selectedReceipt && (
            <div className="bg-white m-3 rounded-2xl shadow-sm overflow-hidden flex flex-col border border-slate-100">
              <div className="bg-slate-900 p-6 text-white text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                  <ShoppingCart size={80} />
                </div>
                <h3 className="text-lg font-black tracking-tighter uppercase">{currentStore.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recibo de Venta</p>
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono">
                  {selectedReceipt.invoiceNumber || `#${selectedReceipt.id.slice(-8).toUpperCase()}`}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Descripción</span>
                    <span>Total</span>
                  </div>
                  <Separator className="bg-slate-100" />
                  <div className="space-y-4">
                    {selectedReceipt.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium tracking-tight">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedReceipt.subtotal || selectedReceipt.totalAmount / (1 + (selectedReceipt.taxRate || 0)))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium tracking-tight">
                    <span>IVA (19%)</span>
                    <span>{formatCurrency(selectedReceipt.taxAmount || 0)}</span>
                  </div>
                  <Separator className="bg-slate-200/50 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-900">Total</span>
                    <span className="text-xl font-black text-brand-primary tracking-tighter">{formatCurrency(selectedReceipt.totalAmount)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserIcon size={12} className="shrink-0" />
                    <p className="text-[10px] font-bold truncate uppercase tracking-tight">
                      {selectedReceipt.customer?.fullName || "Cliente Anónimo"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={12} className="shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-tight">
                      {new Date(selectedReceipt.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">¡Gracias por tu compra!</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-10 text-[11px] font-bold uppercase border-slate-200 gap-1.5"
                    onClick={() => {
                      // Construye mensaje WhatsApp con resumen + link al PDF si existe.
                      // Si el cliente tiene teléfono → abre chat directo; si no → wa.me sin número (selector de contacto).
                      const lines = [
                        `Hola${selectedReceipt.customer?.fullName ? ` ${selectedReceipt.customer.fullName}` : ''} 👋`,
                        ``,
                        `*${currentStore.name}* — Recibo ${selectedReceipt.invoiceNumber || `#${selectedReceipt.id.slice(-6).toUpperCase()}`}`,
                        `Fecha: ${new Date(selectedReceipt.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}`,
                        ``,
                        ...selectedReceipt.items.map(i => `• ${i.productName} × ${i.quantity} = ${formatCurrency(i.totalPrice)}`),
                        ``,
                        `*Total: ${formatCurrency(selectedReceipt.totalAmount)}*`,
                      ];
                      if (selectedReceipt.invoicePdfUrl) {
                        lines.push('', `📄 Factura PDF: ${selectedReceipt.invoicePdfUrl}`);
                      }
                      const text = encodeURIComponent(lines.join('\n'));
                      const phoneRaw = selectedReceipt.customer?.phone?.replace(/\D/g, '') || '';
                      // Si el teléfono no tiene código de país, asumimos Colombia (+57)
                      const phone = phoneRaw && phoneRaw.length === 10 ? `57${phoneRaw}` : phoneRaw;
                      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-slate-900 text-white rounded-xl h-10 text-[11px] font-bold uppercase gap-1.5 disabled:opacity-50"
                    disabled={!selectedReceipt.customer}
                    title={!selectedReceipt.customer ? 'Necesitas datos del cliente para generar PDF' : 'Descargar factura PDF'}
                    onClick={() => {
                      if (selectedReceipt.customer) {
                        downloadInvoicePdf({ sale: selectedReceipt, store: currentStore, customer: selectedReceipt.customer });
                      }
                    }}
                  >
                    <Download size={13} /> PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
