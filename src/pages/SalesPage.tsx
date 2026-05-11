import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, ShoppingCart, DollarSign, TrendingUp, Download, Eye, User as UserIcon,
  MessageCircle, Receipt, FileSpreadsheet,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/formatters";
import { downloadInvoicePdf, calculateTotalsFromItems } from "@/lib/invoiceService";
import { exportSalesWorkbook } from "@/components/ExcelExport";
import {
  SaleRecord, Branch, Store, TaxCategory, TAX_CATEGORY_LABELS, TAX_CATEGORY_RATES,
  ID_TYPE_SHORT,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export type SalesRangeType = 'day' | 'week' | 'month' | 'custom';

interface SalesPageProps {
  sales: SaleRecord[];
  salesDateFilter: string;
  setSalesDateFilter: (v: string) => void;
  salesRangeType: SalesRangeType;
  setSalesRangeType: (v: SalesRangeType) => void;
  salesDateFrom?: string;
  setSalesDateFrom?: (v: string) => void;
  salesDateTo?: string;
  setSalesDateTo?: (v: string) => void;
  activeBranchId: string | null;
  branches: Branch[];
  currentStore: Store;
}

export function SalesPage({
  sales, salesDateFilter, setSalesDateFilter, salesRangeType, setSalesRangeType,
  salesDateFrom, setSalesDateFrom, salesDateTo, setSalesDateTo,
  activeBranchId, branches, currentStore,
}: SalesPageProps) {
  const [selectedReceipt, setSelectedReceipt] = React.useState<SaleRecord | null>(null);

  // ── Cálculo del rango efectivo ────────────────────────────────────
  // Para 'custom' usamos salesDateFrom/salesDateTo. Para los demás, derivamos
  // del salesDateFilter como antes.
  const { rangeStart, rangeEnd } = React.useMemo(() => {
    const filterDate = new Date(salesDateFilter);
    if (salesRangeType === 'custom' && salesDateFrom && salesDateTo) {
      const start = new Date(`${salesDateFrom}T00:00:00`);
      const end = new Date(`${salesDateTo}T23:59:59.999`);
      return { rangeStart: start, rangeEnd: end };
    }
    if (salesRangeType === 'day') {
      const start = new Date(`${salesDateFilter}T00:00:00`);
      const end = new Date(`${salesDateFilter}T23:59:59.999`);
      return { rangeStart: start, rangeEnd: end };
    }
    if (salesRangeType === 'week') {
      const start = new Date(filterDate);
      start.setDate(filterDate.getDate() - filterDate.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end };
    }
    // month
    const start = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { rangeStart: start, rangeEnd: end };
  }, [salesRangeType, salesDateFilter, salesDateFrom, salesDateTo]);

  const filteredSales = React.useMemo(() => {
    return sales.filter(s => {
      const saleDate = new Date(s.date);
      const matchesBranch = !activeBranchId || s.branchId === activeBranchId;
      if (!matchesBranch) return false;
      return saleDate >= rangeStart && saleDate <= rangeEnd;
    });
  }, [sales, activeBranchId, rangeStart, rangeEnd]);

  // ── Totales del período ───────────────────────────────────────────
  const periodTotals = React.useMemo(() => {
    let revenue = 0;
    let units = 0;
    let subtotal = 0;
    let taxAmount = 0;
    // Acumulador por categoría tributaria — útil para declaración renta
    const byCategory: Record<string, { base: number; iva: number; ventas: number }> = {};

    for (const sale of filteredSales) {
      revenue += sale.totalAmount;
      for (const item of sale.items) {
        units += item.quantity;
        const cat: TaxCategory = item.taxCategory || 'general';
        const rate = item.taxRate ?? TAX_CATEGORY_RATES[cat];
        const itemSubtotal = item.totalPrice / (1 + rate);
        const itemTax = item.totalPrice - itemSubtotal;
        subtotal += itemSubtotal;
        taxAmount += itemTax;
        if (!byCategory[cat]) byCategory[cat] = { base: 0, iva: 0, ventas: 0 };
        byCategory[cat].base += itemSubtotal;
        byCategory[cat].iva += itemTax;
        byCategory[cat].ventas += item.totalPrice;
      }
    }
    return {
      revenue,
      units,
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      byCategory,
    };
  }, [filteredSales]);

  const rangeLabel = (() => {
    if (salesRangeType === 'custom') {
      if (!salesDateFrom || !salesDateTo) return 'Selecciona un rango';
      return `${new Date(salesDateFrom).toLocaleDateString()} - ${new Date(salesDateTo).toLocaleDateString()}`;
    }
    if (salesRangeType === 'day') return "Reporte Diario";
    return `${rangeStart.toLocaleDateString()} - ${rangeEnd.toLocaleDateString()}`;
  })();

  const handleExport = () => {
    if (filteredSales.length === 0) return;
    const tag = salesRangeType === 'custom'
      ? `${salesDateFrom}_a_${salesDateTo}`
      : `${salesRangeType}_${salesDateFilter}`;
    exportSalesWorkbook(filteredSales, `ventas_${tag}.xlsx`);
  };

  return (
    <motion.div
      key="sales"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3 w-full md:w-auto flex-wrap">
            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-1 block">Rango de Reporte</Label>
              <Select value={salesRangeType} onValueChange={(v: any) => setSalesRangeType(v)}>
                <SelectTrigger className="h-9 w-full md:w-[160px] bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Día Único</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                  <SelectItem value="custom">Rango Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {salesRangeType === 'custom' ? (
              <>
                <div>
                  <Label htmlFor="sales-from" className="text-xs font-semibold text-slate-500 mb-1 block">Desde</Label>
                  <Input
                    id="sales-from"
                    type="date"
                    value={salesDateFrom || ''}
                    onChange={(e) => setSalesDateFrom?.(e.target.value)}
                    className="h-9 bg-slate-50"
                  />
                </div>
                <div>
                  <Label htmlFor="sales-to" className="text-xs font-semibold text-slate-500 mb-1 block">Hasta</Label>
                  <Input
                    id="sales-to"
                    type="date"
                    value={salesDateTo || ''}
                    onChange={(e) => setSalesDateTo?.(e.target.value)}
                    className="h-9 bg-slate-50"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="sales-date" className="text-xs font-semibold text-slate-500 mb-1 block">Fecha de Referencia</Label>
                <Input
                  id="sales-date"
                  type="date"
                  value={salesDateFilter}
                  onChange={(e) => setSalesDateFilter(e.target.value)}
                  className="h-9 bg-slate-50"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Calendar size={16} />
              <span className="font-medium">{rangeLabel}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={handleExport}
              disabled={filteredSales.length === 0}
              title="Descarga las ventas del filtro actual con su desglose de IVA"
            >
              <FileSpreadsheet size={14} />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Unidades Vendidas"
          value={periodTotals.units.toString()}
          icon={<ShoppingCart className="text-brand-primary" />}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(periodTotals.revenue)}
          icon={<DollarSign className="text-emerald-600" />}
        />
        <StatCard
          title="Promedio por Venta"
          value={formatCurrency(filteredSales.length ? (periodTotals.revenue / filteredSales.length) : 0)}
          icon={<TrendingUp className="text-brand-primary" />}
        />
        <StatCard
          title="IVA del Período"
          value={formatCurrency(periodTotals.taxAmount)}
          icon={<Receipt className="text-violet-600" />}
        />
      </div>

      {/* Desglose tributario para declaración de renta */}
      {Object.keys(periodTotals.byCategory).length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt size={18} className="text-violet-600" />
              Desglose Tributario (DIAN)
            </CardTitle>
            <CardDescription>
              Base gravable e IVA por categoría — útil para declarar renta y reporte de IVA recaudado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Categoría</TableHead>
                    <TableHead className="text-right font-semibold">Base Gravable</TableHead>
                    <TableHead className="text-right font-semibold">IVA Recaudado</TableHead>
                    <TableHead className="text-right font-semibold">Ventas Brutas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Object.entries(periodTotals.byCategory) as [TaxCategory, { base: number; iva: number; ventas: number }][])
                    .sort(([, a], [, b]) => b.ventas - a.ventas)
                    .map(([cat, v]) => (
                      <TableRow key={cat}>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              cat === 'general' ? 'bg-slate-100 text-slate-700' :
                              cat === 'reducido' ? 'bg-amber-50 text-amber-700' :
                              cat === 'exento' ? 'bg-sky-50 text-sky-700' :
                              'bg-violet-50 text-violet-700'
                            }
                          >
                            {TAX_CATEGORY_LABELS[cat]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-600">{formatCurrency(Math.round(v.base))}</TableCell>
                        <TableCell className="text-right font-semibold text-violet-700">{formatCurrency(Math.round(v.iva))}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(Math.round(v.ventas))}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
                      <TableHead className="text-right font-semibold">IVA</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="text-center font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sale) => {
                        const branchName = branches.find(b => b.id === sale.branchId)?.name;
                        const saleTax = sale.taxAmount ?? calculateTotalsFromItems(sale.items).taxAmount;
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
                                  <p className="text-[10px] text-slate-400">
                                    {ID_TYPE_SHORT[sale.customer.idType || 'CC']} {sale.customer.idNumber}
                                  </p>
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
                            <TableCell className="text-right text-violet-700 text-xs font-medium">
                              {formatCurrency(saleTax)}
                            </TableCell>
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
                        <TableCell colSpan={9} className="h-64 text-center">
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
                type DailyGroup = { date: string; total: number; units: number; iva: number };
                const grouped: Record<string, DailyGroup> = {};
                for (const s of filteredSales) {
                  const date = s.date.split('T')[0];
                  if (!grouped[date]) grouped[date] = { date, total: 0, units: 0, iva: 0 };
                  grouped[date].total += s.totalAmount;
                  grouped[date].units += (s.items || []).reduce((sum, item) => sum + item.quantity, 0);
                  grouped[date].iva += s.taxAmount ?? calculateTotalsFromItems(s.items).taxAmount;
                }
                const sortedGrouped: DailyGroup[] = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Unidades</TableHead>
                          <TableHead className="text-right">IVA</TableHead>
                          <TableHead className="text-right">Ingresos Totales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedGrouped.map((group) => (
                          <TableRow key={group.date}>
                            <TableCell className="font-medium">{new Date(group.date).toLocaleDateString()}</TableCell>
                            <TableCell>{group.units}</TableCell>
                            <TableCell className="text-right text-violet-700 font-medium">
                              {formatCurrency(Math.round(group.iva))}
                            </TableCell>
                            <TableCell className="text-right font-bold text-brand-primary">
                              {formatCurrency(group.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {sortedGrouped.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-64 text-center">
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

                {(() => {
                  // Recalcular para mostrar números correctos incluso en ventas antiguas
                  // que no tengan subtotal/taxAmount guardados.
                  const t = calculateTotalsFromItems(selectedReceipt.items);
                  const subtotal = selectedReceipt.subtotal ?? t.subtotal;
                  const taxAmount = selectedReceipt.taxAmount ?? t.taxAmount;
                  return (
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium tracking-tight">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium tracking-tight">
                        <span>IVA</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <Separator className="bg-slate-200/50 my-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-slate-900">Total</span>
                        <span className="text-xl font-black text-brand-primary tracking-tighter">{formatCurrency(selectedReceipt.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })()}

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
