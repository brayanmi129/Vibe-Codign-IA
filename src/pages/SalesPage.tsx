import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ShoppingCart, DollarSign, TrendingUp, Download } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/formatters";
import { downloadInvoicePdf } from "@/lib/invoiceService";
import { SaleRecord, Branch, Store } from "@/types";

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
          icon={<ShoppingCart className="text-indigo-600" />}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="text-emerald-600" />}
        />
        <StatCard
          title="Promedio por Venta"
          value={formatCurrency(filteredSales.length ? (totalRevenue / filteredSales.length) : 0)}
          icon={<TrendingUp className="text-indigo-600" />}
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
                      <TableHead className="text-center font-semibold">PDF</TableHead>
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
                                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
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
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px]">
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
                              {sale.customer ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                                  title={`Descargar ${sale.invoiceNumber || 'factura'}`}
                                  onClick={() => downloadInvoicePdf({
                                    sale,
                                    store: currentStore,
                                    customer: sale.customer!,
                                  })}
                                >
                                  <Download size={14} />
                                </Button>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredSales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-slate-400 italic">
                          No hay ventas registradas para este día.
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
                            <TableCell className="text-right font-bold text-indigo-600">
                              {formatCurrency(group.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {sortedGrouped.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="h-32 text-center text-slate-400 italic">
                              No hay datos para el rango seleccionado.
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
    </motion.div>
  );
}
