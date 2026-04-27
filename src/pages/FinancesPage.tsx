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
  Filter
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

interface FinancesPageProps {
  expenses: Expense[];
  analytics: InventoryAnalytics;
  onAddExpense: (expense: Omit<Expense, "id" | "date" | "userId">) => void;
  onDeleteExpense: (id: string) => void;
}

export function FinancesPage({ expenses, analytics, onAddExpense, onDeleteExpense }: FinancesPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

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
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-6 shadow-lg shadow-indigo-200" />}>
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
                <Button type="submit" className="bg-indigo-600 text-white rounded-xl">Guardar Gasto</Button>
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

        <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
            <Wallet size={80} className="text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-indigo-200 uppercase tracking-widest text-[10px]">Utilidad Neta (Estimada)</CardDescription>
            <CardTitle className="text-2xl font-black">{formatCurrency((analytics.netProfit || 0))}</CardTitle>
          </CardHeader>
        </Card>
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
                <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                  <Receipt size={64} className="opacity-10 mb-4" />
                  <p className="text-sm font-medium italic">No se han registrado gastos aún.</p>
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
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Margen de Ganancia</p>
              <p className="text-sm leading-relaxed text-slate-300">
                Tu margen bruto promedio actual es del **32%**. Para negocios de este tipo, el ideal es superar el **35%**. Considera ajustar precios en productos de baja rotación.
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">Alerta de Costos</p>
              <p className="text-sm leading-relaxed text-slate-300">
                Los gastos de **Transporte** han subido un **15%** esta semana. Revisa si puedes consolidar pedidos de proveedores para ahorrar.
              </p>
            </div>

            <Button variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 font-bold rounded-2xl">
              Generar reporte PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
