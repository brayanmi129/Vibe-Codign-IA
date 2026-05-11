import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowDownCircle,
  CalendarDays,
  Award,
  Clock,
  Tag,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/formatters";
import { InventoryStats, SaleRecord, Product, StoreMember } from "@/types";

interface Analytics {
  todayRevenue: number;
  revenueChange: number;
  thisWeekRevenue: number;
  weekChange: number;
  topByQty: Array<{ id: string; name: string; category: string; totalQty: number; totalRev: number }>;
  notifications: Array<{ id: string; type: string; title: string; message: string }>;
  netProfit: number;
  totalExpenses: number;
  profitCoverage?: number;
  productsMissingCost?: number;
  salesItemsMissingCost?: number;
}

interface DashboardPageProps {
  analytics: Analytics;
  stats: InventoryStats;
  salesHistoryData: { date: string; sales: number }[];
  onOpenAI: () => void;
  // Datos crudos para calcular comparativas en cliente
  sales: SaleRecord[];
  products: Product[];
  members: StoreMember[];
  // Si false, oculta utilidad neta, gastos, y valor de inventario a precio costo.
  canViewFinancials: boolean;
}

// ── Cálculo de comparativas mensual/anual + insights ─────────────────────
function useDashboardComparatives(sales: SaleRecord[], products: Product[], members: StoreMember[]) {
  return React.useMemo(() => {
    const now = new Date();
    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    // Mes actual completo (1ro hasta fin de mes)
    const currMonthStart = startOfMonth(now);
    const currMonthEnd = endOfMonth(now);
    // Mes anterior completo
    const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    // Mismo mes año anterior
    const yoyStart = startOfMonth(new Date(now.getFullYear() - 1, now.getMonth(), 1));
    const yoyEnd = endOfMonth(new Date(now.getFullYear() - 1, now.getMonth(), 1));
    // "A la fecha" — del 1ro al día de hoy (para comparación justa con mes anterior y YoY)
    const todayCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dayOfMonth = now.getDate();

    let currMonthRev = 0;
    // Mes anterior "a la fecha" (mismo día del mes) — para comparar justo
    let prevMonthRevToDate = 0;
    let prevMonthRevFull = 0;
    let yoyRevToDate = 0;

    // Top categoría del mes (por monto)
    const categoryRev: Record<string, number> = {};
    // Top empleado del mes (por monto)
    const userRev: Record<string, number> = {};
    const userUnits: Record<string, number> = {};
    // Distribución por hora — solo del mes actual
    const hourlyBuckets: number[] = new Array(24).fill(0);

    // Producto-categoría lookup
    const productCategory: Record<string, string> = {};
    for (const p of products) productCategory[p.id] = p.category;

    for (const s of sales) {
      const d = new Date(s.date);
      // Mes actual
      if (d >= currMonthStart && d <= currMonthEnd) {
        currMonthRev += s.totalAmount;
        // Categoría
        for (const item of s.items) {
          const cat = productCategory[item.productId] || 'Sin categoría';
          categoryRev[cat] = (categoryRev[cat] || 0) + item.totalPrice;
        }
        // Empleado
        userRev[s.userId] = (userRev[s.userId] || 0) + s.totalAmount;
        const units = s.items.reduce((acc, i) => acc + i.quantity, 0);
        userUnits[s.userId] = (userUnits[s.userId] || 0) + units;
        // Hora
        hourlyBuckets[d.getHours()] += s.totalAmount;
      }
      // Mes anterior "a la fecha" — mismo día numérico
      if (d >= prevMonthStart && d <= prevMonthEnd) {
        prevMonthRevFull += s.totalAmount;
        if (d.getDate() <= dayOfMonth) prevMonthRevToDate += s.totalAmount;
      }
      // YoY a la fecha
      if (d >= yoyStart && d <= yoyEnd && d.getDate() <= dayOfMonth) {
        yoyRevToDate += s.totalAmount;
      }
    }

    // Variaciones
    const pctChange = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : null;
      return ((curr - prev) / prev) * 100;
    };
    const monthChange = pctChange(currMonthRev, prevMonthRevToDate);
    const yoyChange = pctChange(currMonthRev, yoyRevToDate);

    // Top categoría
    const sortedCategories = Object.entries(categoryRev).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0] || null;
    const totalCategoryRev = Object.values(categoryRev).reduce((acc, v) => acc + v, 0);
    const topCategoryPct = topCategory && totalCategoryRev > 0 ? (topCategory[1] / totalCategoryRev) * 100 : 0;

    // Top empleado
    const sortedUsers = Object.entries(userRev).sort((a, b) => b[1] - a[1]);
    const topUserId = sortedUsers[0]?.[0];
    const topUserRev = sortedUsers[0]?.[1] || 0;
    const topUserUnits = topUserId ? userUnits[topUserId] || 0 : 0;
    // Resolver nombre del empleado: members.userId tiene el UID
    let topUserName = 'Sin datos';
    if (topUserId) {
      const member = members.find(m => m.userId === topUserId);
      topUserName = member?.displayName || member?.email?.split('@')[0] || `Usuario ${topUserId.slice(0, 6)}`;
    }

    // Hora pico
    let peakHour = -1;
    let peakHourRev = 0;
    hourlyBuckets.forEach((v, i) => {
      if (v > peakHourRev) { peakHourRev = v; peakHour = i; }
    });
    const peakHourLabel = peakHour >= 0
      ? `${peakHour.toString().padStart(2, '0')}:00 - ${((peakHour + 1) % 24).toString().padStart(2, '0')}:00`
      : '—';

    // Heatmap horario (para gráfica)
    const hourlyData = hourlyBuckets.map((v, h) => ({ hour: `${h.toString().padStart(2, '0')}h`, sales: Math.round(v) }));

    return {
      currMonthRev,
      prevMonthRevToDate,
      prevMonthRevFull,
      yoyRevToDate,
      monthChange,
      yoyChange,
      topCategory,
      topCategoryPct,
      topUserName,
      topUserRev,
      topUserUnits,
      peakHour,
      peakHourRev,
      peakHourLabel,
      hourlyData,
      hasData: currMonthRev > 0,
    };
  }, [sales, products, members]);
}

export function DashboardPage({ analytics, stats, salesHistoryData, onOpenAI, sales, products, members, canViewFinancials }: DashboardPageProps) {
  const recentSalesCount = React.useMemo(() => analytics.notifications.length, [analytics.notifications]);
  const comp = useDashboardComparatives(sales, products, members);
  const monthName = new Date().toLocaleDateString('es-CO', { month: 'long' });
  
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      {/* Header section with cumulative stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 font-medium">El estado actual de tu negocio en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          {canViewFinancials && (
            <>
              <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Inventario</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
            </>
          )}
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Productos</p>
            <p className="text-sm font-bold text-slate-900">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[minmax(160px,auto)]">
        
        {/* Row 1: Key Metrics */}
        <div className="md:col-span-3 lg:col-span-3">
          <StatCard
            title="Ingresos Hoy"
            value={formatCurrency(analytics.todayRevenue)}
            icon={<TrendingUp className="text-emerald-600" />}
            trend={`${analytics.revenueChange >= 0 ? '+' : ''}${analytics.revenueChange.toFixed(1)}%`}
            trendUp={analytics.revenueChange >= 0}
            description="vs. ayer"
          />
        </div>
        <div className="md:col-span-3 lg:col-span-3">
          <StatCard
            title="Ingresos Semana"
            value={formatCurrency(analytics.thisWeekRevenue)}
            icon={<DollarSign className="text-brand-primary" />}
            trend={`${analytics.weekChange >= 0 ? '+' : ''}${analytics.weekChange.toFixed(1)}%`}
            trendUp={analytics.weekChange >= 0}
            description="vs. semana anterior"
          />
        </div>
        {canViewFinancials && (
          <div className="md:col-span-3 lg:col-span-3">
            {(() => {
              const coverage = analytics.profitCoverage ?? 100;
              const missing = analytics.productsMissingCost ?? 0;
              const isPartial = coverage < 100;
              // Si cobertura = 100 → ganancia confirmada (verde, ShieldCheck).
              // Si cobertura < 100 → ganancia parcial (warning amber, AlertTriangle) con cuántos productos faltan.
              return (
                <StatCard
                  title={isPartial ? `Utilidad Parcial · ${coverage}%` : "Utilidad Neta"}
                  value={formatCurrency(analytics.netProfit)}
                  icon={isPartial
                    ? <AlertTriangle className="text-amber-600" />
                    : <ShieldCheck className="text-emerald-600" />}
                  variant={isPartial ? "warning" : "default"}
                  description={isPartial
                    ? `Faltan precios de costo en ${missing} producto${missing !== 1 ? 's' : ''}`
                    : "Ganancia real (todos los costos registrados)"}
                />
              );
            })()}
          </div>
        )}
        {canViewFinancials && (
          <div className="md:col-span-3 lg:col-span-3">
            <StatCard
              title="Gastos Totales"
              value={formatCurrency(analytics.totalExpenses)}
              icon={<ArrowDownCircle className="text-rose-600" />}
              variant="default"
              description="Egresos registrados"
            />
          </div>
        )}

        {/* Row 2: Charts and AI */}
        <Card className="md:col-span-6 lg:col-span-8 row-span-2 bg-white border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Tendencia de Ventas</CardTitle>
              <CardDescription>Unidades vendidas en los últimos 7 días</CardDescription>
            </div>
            <div className="h-8 px-3 rounded-xl bg-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">En Vivo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <LineChart data={salesHistoryData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}
                  labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 800 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Action Card */}
        <Card className="md:col-span-6 lg:col-span-4 row-span-2 bg-slate-900 text-white border-none shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-900/20 opacity-50" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          
          <CardHeader className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Sparkles className="text-emerald-400" size={20} />
            </div>
            <CardTitle className="text-2xl font-bold leading-tight">Optimización con ARIA</CardTitle>
            <CardDescription className="text-indigo-100/60 mt-1">Tu asistente personal de negocios.</CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-6">
            <div className="space-y-2">
              {[
                "¿Qué productos debo reponer hoy?",
                "Analiza mis ventas de la semana",
                "Estrategia para stock estancado"
              ].map((q, i) => (
                <button 
                  key={i}
                  onClick={onOpenAI}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium transition-all flex items-center justify-between group/btn"
                >
                  <span className="truncate mr-2">{q}</span>
                  <ArrowUpRight size={14} className="text-white/30 group-hover/btn:text-white transition-colors" />
                </button>
              ))}
            </div>
            <Button 
              onClick={onOpenAI}
              className="w-full h-12 bg-white text-slate-900 hover:bg-indigo-50 font-bold rounded-2xl"
            >
              Consultar con ARIA
            </Button>
          </CardContent>
        </Card>

        {/* Row 3: Alerts and Top Products */}
        <Card className="md:col-span-3 lg:col-span-5 bg-white border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Alertas del Sistema
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 max-h-[320px]">
            <CardContent className="p-0">
              {analytics.notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {analytics.notifications.map((notif) => (
                    <div key={notif.id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className={`p-2 rounded-xl h-fit ${
                        notif.type === 'high-demand' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {notif.type === 'high-demand' ? <ArrowUpRight size={14} /> : <AlertTriangle size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ShieldCheck size={32} className="opacity-20 mb-2" />
                  <p className="text-sm italic">Todo bajo control.</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="md:col-span-3 lg:col-span-7 bg-white border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold">Top 5 Productos por Volumen</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="grid grid-cols-1 divide-y divide-slate-100">
              {analytics.topByQty.length > 0 ? (
                analytics.topByQty.map((p, idx) => (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs ring-4 ring-white">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{p.totalQty} <span className="text-[10px] text-slate-400">uds.</span></p>
                      <p className="text-xs font-bold text-emerald-600">{formatCurrency(p.totalRev)}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 ml-2" />
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-slate-400 text-sm italic">
                  No hay datos de ventas disponibles.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Sección Comparativas ─────────────────────────────────── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Comparativas del mes</h3>
            <p className="text-xs text-slate-500 capitalize">
              {monthName} {new Date().getFullYear()} · datos hasta hoy
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Mes en curso
          </Badge>
        </div>

        {!comp.hasData ? (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-12 text-center">
              <CalendarDays size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">Aún no hay ventas este mes</p>
              <p className="text-xs text-slate-400 mt-1">Las comparativas aparecerán cuando registres la primera venta del mes.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Comparativa mes a mes */}
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mes vs mes anterior</p>
                    {comp.monthChange !== null && (
                      comp.monthChange >= 0
                        ? <TrendingUp size={16} className="text-emerald-500" />
                        : <TrendingDown size={16} className="text-rose-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(comp.currMonthRev)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      vs {formatCurrency(comp.prevMonthRevToDate)} a la misma fecha
                    </p>
                  </div>
                  {comp.monthChange !== null && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                      comp.monthChange >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {comp.monthChange >= 0 ? '+' : ''}{comp.monthChange.toFixed(1)}%
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* YoY (año contra año) */}
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Año vs año</p>
                    {comp.yoyChange !== null && (
                      comp.yoyChange >= 0
                        ? <TrendingUp size={16} className="text-emerald-500" />
                        : <TrendingDown size={16} className="text-rose-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(comp.currMonthRev)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      vs {formatCurrency(comp.yoyRevToDate)} en {monthName} del año pasado
                    </p>
                  </div>
                  {comp.yoyChange !== null ? (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                      comp.yoyChange >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {comp.yoyChange >= 0 ? '+' : ''}{comp.yoyChange.toFixed(1)}%
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Sin datos del año pasado</span>
                  )}
                </CardContent>
              </Card>

              {/* Top categoría del mes */}
              <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100 shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Top categoría</p>
                    <Tag size={16} className="text-violet-500" />
                  </div>
                  {comp.topCategory ? (
                    <>
                      <div>
                        <p className="text-base font-black text-slate-900 tracking-tight truncate">{comp.topCategory[0]}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatCurrency(comp.topCategory[1])}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-700">
                        {comp.topCategoryPct.toFixed(0)}% de las ventas
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin datos</p>
                  )}
                </CardContent>
              </Card>

              {/* Top empleado del mes */}
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Top vendedor</p>
                    <Award size={16} className="text-amber-500" />
                  </div>
                  {comp.topUserRev > 0 ? (
                    <>
                      <div>
                        <p className="text-base font-black text-slate-900 tracking-tight truncate">{comp.topUserName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatCurrency(comp.topUserRev)} · {comp.topUserUnits} uds.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                        🏆 #1 del mes
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin datos</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Heatmap horario */}
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock size={18} className="text-indigo-500" />
                      Hora pico de ventas
                    </CardTitle>
                    <CardDescription>
                      Distribución de ingresos por hora del día durante {monthName}
                    </CardDescription>
                  </div>
                  {comp.peakHour >= 0 && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora pico</p>
                      <p className="text-lg font-black text-indigo-600">{comp.peakHourLabel}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comp.hourlyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      interval={1}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '10px',
                      }}
                      itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}
                      labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 800 }}
                      formatter={(v: number) => [formatCurrency(v), 'Ingresos']}
                    />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </motion.div>
  );
}
