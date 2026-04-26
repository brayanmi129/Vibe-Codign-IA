import * as React from "react";
import { motion } from "motion/react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, AlertTriangle, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
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
}

interface DashboardPageProps {
  analytics: Analytics;
  stats: InventoryStats;
  salesHistoryData: { date: string; sales: number }[];
  onOpenAI: () => void;
}

export function DashboardPage({ analytics, stats, salesHistoryData, onOpenAI }: DashboardPageProps) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos Hoy"
          value={formatCurrency(analytics.todayRevenue)}
          icon={<TrendingUp className="text-emerald-600" />}
          trend={`${analytics.revenueChange >= 0 ? '+' : ''}${analytics.revenueChange.toFixed(1)}%`}
          trendUp={analytics.revenueChange >= 0}
          description="vs. ayer"
        />
        <StatCard
          title="Ingresos Semana"
          value={formatCurrency(analytics.thisWeekRevenue)}
          icon={<DollarSign className="text-indigo-600" />}
          trend={`${analytics.weekChange >= 0 ? '+' : ''}${analytics.weekChange.toFixed(1)}%`}
          trendUp={analytics.weekChange >= 0}
          description="vs. semana anterior"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockCount.toString()}
          icon={<AlertTriangle className="text-amber-600" />}
          variant={stats.lowStockCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Sin Stock"
          value={stats.outOfStockCount.toString()}
          icon={<AlertTriangle className="text-rose-600" />}
          variant={stats.outOfStockCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI chat CTA */}
        <Card className="lg:col-span-2 bg-slate-950 text-white border-none shadow-2xl shadow-indigo-200/20 overflow-hidden relative group">
          <div 
            className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity" 
            style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, var(--brand-primary) 0%, transparent 70%)' }}
          />
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <BrainCircuit size={160} />
          </div>
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 px-2.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">Inteligencia Artificial</span>
              </div>
              <Sparkles size={14} className="text-emerald-400 animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight mb-2">Potencia tus decisiones<br/>con Insights IA</CardTitle>
            <CardDescription className="text-indigo-100/60 font-medium text-sm max-w-lg leading-relaxed">
              Analiza tendencias, predice faltantes de stock y optimiza tus márgenes de ganancia en segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="flex flex-wrap gap-2">
              {["¿Qué productos reponer?", "Analiza mis ventas", "Predicción stock"].map(hint => (
                <button
                  key={hint}
                  onClick={onOpenAI}
                  className="text-[11px] font-bold bg-white/5 hover:bg-white/15 text-white/80 border border-white/5 rounded-2xl px-4 py-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {hint}
                </button>
              ))}
            </div>
            <Button
              className="bg-white text-slate-950 hover:bg-indigo-50 font-black h-12 px-6 rounded-2xl shadow-xl shadow-white/5 transition-all group"
              onClick={onOpenAI}
            >
              <BrainCircuit size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
              Ver insights ahora
            </Button>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Alertas Inteligentes
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[280px]">
            <CardContent className="space-y-3">
              {analytics.notifications.length > 0 ? (
                analytics.notifications.map((notif) => (
                  <div key={notif.id} className={`p-3 rounded-lg border flex gap-3 ${
                    notif.type === 'high-demand' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className={`p-2 rounded-full h-fit ${
                      notif.type === 'high-demand' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {notif.type === 'high-demand' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 leading-tight">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm italic">No hay alertas nuevas.</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tendencia de Ventas</CardTitle>
            <CardDescription>Visualización del volumen de ventas diario.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesHistoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Top 5 Productos</CardTitle>
            <CardDescription>Por volumen de ventas total.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {analytics.topByQty.map((p, idx) => (
                <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{p.totalQty} ud.</p>
                    <p className="text-[10px] text-emerald-600 font-medium">{formatCurrency(p.totalRev)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
