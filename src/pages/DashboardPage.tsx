import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ArrowDownCircle
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/formatters";
import { InventoryStats } from "@/types";

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
}

export function DashboardPage({ analytics, stats, salesHistoryData, onOpenAI }: DashboardPageProps) {
  const recentSalesCount = React.useMemo(() => analytics.notifications.length, [analytics.notifications]);
  
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
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Inventario</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
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
            icon={<DollarSign className="text-indigo-600" />}
            trend={`${analytics.weekChange >= 0 ? '+' : ''}${analytics.weekChange.toFixed(1)}%`}
            trendUp={analytics.weekChange >= 0}
            description="vs. semana anterior"
          />
        </div>
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
        <div className="md:col-span-3 lg:col-span-3">
          <StatCard
            title="Gastos Totales"
            value={formatCurrency(analytics.totalExpenses)}
            icon={<ArrowDownCircle className="text-rose-600" />}
            variant="default"
            description="Egresos registrados"
          />
        </div>

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
    </motion.div>
  );
}
