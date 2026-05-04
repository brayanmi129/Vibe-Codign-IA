import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  DollarSign,
  Receipt,
  ArrowDownCircle,
  Wallet,
  Calendar,
  Filter,
  AlertTriangle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/formatters";
import { Expense, InventoryAnalytics } from "@/types";

import { Product, SaleRecord } from "@/types";

interface FinancesPageProps {
  expenses: Expense[];
  analytics: InventoryAnalytics;
  products?: Product[];
  sales?: SaleRecord[];
  onAddExpense: (expense: Omit<Expense, "id" | "date" | "userId">) => void;
  onDeleteExpense: (id: string) => void;
}

export function FinancesPage({ expenses, analytics, products = [], sales = [], onAddExpense, onDeleteExpense }: FinancesPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // ── Insights reales (en lugar de texto hardcoded) ──────────────────
  // Margen bruto promedio: solo cuenta productos vendidos con costPrice conocido.
  const grossMarginInfo = React.useMemo(() => {
    let revenueWithCost = 0;
    let costOfSold = 0;
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const p = products.find(prod => prod.id === item.productId);
        if (p?.costPrice && p.costPrice > 0) {
          revenueWithCost += item.totalPrice;
          costOfSold += item.quantity * p.costPrice;
        }
      }
    }
    if (revenueWithCost === 0) return null;
    const margin = ((revenueWithCost - costOfSold) / revenueWithCost) * 100;
    return { margin, revenueWithCost };
  }, [products, sales]);

  // Top categoría de gasto (la que más representa el total)
  const topExpenseCategory = React.useMemo(() => {
    if (expenses.length === 0) return null;
    const byCat: Record<string, number> = {};
    for (const e of expenses) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    const [name, amount] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    return { name, amount, pct };
  }, [expenses, totalExpenses]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddExpense({
      storeId: "", // Se maneja en App.tsx
      category: formData.get("category") as string,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
    });
    setIsAddDialogOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finanzas</h2>
          <p className="text-slate-500 font-medium">Control de gastos y rentabilidad real.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="bg-brand-primary hover:bg-brand-secondary text-white rounded-2xl h-12 px-6 shadow-lg shadow-indigo-200" />}>
            <Plus size={18} className="mr-2" /> Registrar Gasto
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Nuevo Egreso</DialogTitle>
                <DialogDescription>
                  Registra cualquier gasto operativo de tu negocio.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select name="category" defaultValue="Servicios">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Servicios">Servicios (Luz, Agua, Internet)</SelectItem>
                      <SelectItem value="Arriendo">Arriendo</SelectItem>
                      <SelectItem value="Sueldos">Sueldos</SelectItem>
                      <SelectItem value="Transporte">Transporte / Domicilios</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="Impuestos">Impuestos</SelectItem>
                      <SelectItem value="Otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input id="description" name="description" placeholder="Ej: Pago internet marzo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <Input id="amount" name="amount" type="number" step="1" className="pl-7" placeholder="0" required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-brand-primary text-white rounded-xl">Guardar Gasto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
            <DollarSign size={80} className="text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Ingresos Brutos (30d)</CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900">{formatCurrency(analytics.thisWeekRevenue * 4)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-rose-50 border-rose-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
            <ArrowDownCircle size={80} className="text-rose-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-rose-400 uppercase tracking-widest text-[10px]">Gastos Totales</CardDescription>
            <CardTitle className="text-2xl font-black text-rose-700">{formatCurrency(totalExpenses)}</CardTitle>
          </CardHeader>
        </Card>

        {(() => {
          const coverage = analytics.profitCoverage ?? 100;
          const missing = analytics.productsMissingCost ?? 0;
          const isPartial = coverage < 100;
          // Cuando hay productos sin costo, la utilidad es parcial. Pintamos
          // distinto la card y damos el aviso explícito en lugar de inflar el número.
          return (
            <Card className={`${isPartial ? 'bg-amber-500' : 'bg-brand-primary'} text-white border-none shadow-xl ${isPartial ? 'shadow-amber-200' : 'shadow-indigo-200'} overflow-hidden relative group`}>
              <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                {isPartial ? <AlertTriangle size={80} className="text-white" /> : <Wallet size={80} className="text-white" />}
              </div>
              <CardHeader className="pb-2">
                <CardDescription className={`font-bold uppercase tracking-widest text-[10px] ${isPartial ? 'text-amber-100' : 'text-indigo-200'}`}>
                  {isPartial ? `Utilidad Parcial · Cobertura ${coverage}%` : 'Utilidad Neta'}
                </CardDescription>
                <CardTitle className="text-2xl font-black">{formatCurrency(analytics.netProfit || 0)}</CardTitle>
                {isPartial && (
                  <p className="text-[11px] font-medium text-amber-50/90 leading-relaxed mt-2">
                    Falta el precio de costo en <span className="font-bold">{missing}</span> producto{missing !== 1 ? 's' : ''}.
                    El cálculo solo incluye lo que sí tiene costo registrado.
                  </p>
                )}
              </CardHeader>
            </Card>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Historial de Gastos</CardTitle>
              <CardDescription>Lista completa de egresos registrados.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 rounded-full">
              <Filter size={18} />
            </Button>
          </CardHeader>
          <ScrollArea className="h-[450px]">
            <CardContent className="p-0">
              {expenses.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                    <div key={expense.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                          <Receipt size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{expense.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-950 text-white rounded-full">
                              {expense.category}
                            </span>
                            <span className="flex items-center text-[11px] text-slate-400 font-bold">
                              <Calendar size={10} className="mr-1" />
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="text-lg font-black text-rose-600">-{formatCurrency(expense.amount)}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDeleteExpense(expense.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all rounded-full"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                    <Receipt size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Aún no registras gastos</p>
                  <p className="text-xs text-slate-400 mt-1 mb-5 max-w-xs">
                    Registra arriendo, servicios, sueldos y demás para que tu utilidad neta refleje la realidad.
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-brand-primary hover:bg-brand-secondary text-white rounded-xl"
                  >
                    <Plus size={16} className="mr-2" /> Registrar primer gasto
                  </Button>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="text-emerald-400" size={18} />
              Consejos de Rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Margen real calculado de tus ventas */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Margen Bruto Promedio</p>
              {grossMarginInfo ? (
                <p className="text-sm leading-relaxed text-slate-300">
                  Tu margen bruto promedio es del <span className="font-bold text-white">{grossMarginInfo.margin.toFixed(1)}%</span>.{' '}
                  {grossMarginInfo.margin >= 35
                    ? 'Excelente — estás por encima del 35% recomendado.'
                    : grossMarginInfo.margin >= 20
                    ? 'Está dentro del rango aceptable, pero el ideal es superar el 35%.'
                    : 'Está bajo. Revisa si puedes subir precios o reducir costos de los productos de baja rotación.'}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-400 italic">
                  Aún no podemos calcular tu margen — necesitas registrar el precio de costo de tus productos vendidos.
                </p>
              )}
            </div>

            {/* Top categoría de gastos basado en datos reales */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">Categoría con Más Gastos</p>
              {topExpenseCategory ? (
                <p className="text-sm leading-relaxed text-slate-300">
                  <span className="font-bold text-white">{topExpenseCategory.name}</span> representa el{' '}
                  <span className="font-bold text-amber-200">{topExpenseCategory.pct.toFixed(0)}%</span> de tus gastos
                  ({formatCurrency(topExpenseCategory.amount)}). Si puedes reducir esa partida, mejorarás directamente tu utilidad neta.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-400 italic">
                  Aún no has registrado gastos. Empieza añadiendo los gastos operativos (arriendo, servicios, etc.) para ver esta sugerencia.
                </p>
              )}
            </div>

            <Button variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 font-bold rounded-2xl" disabled>
              Generar reporte PDF (próximamente)
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
