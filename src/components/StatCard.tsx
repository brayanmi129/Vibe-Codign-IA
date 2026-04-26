import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  description?: string;
  variant?: "default" | "warning" | "danger";
}

export function StatCard({ title, value, icon, trend, trendUp, description, variant = "default" }: StatCardProps) {
  const bgClass =
    variant === "warning" ? "border-amber-100 bg-amber-50/50" :
    variant === "danger" ? "border-rose-100 bg-rose-50/50" :
    "bg-white border-slate-200/60";

  return (
    <Card className={`${bgClass} shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border-2 rounded-2xl transition-all hover:shadow-xl hover:shadow-slate-200/50 group`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${
              trendUp 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100" 
                : "bg-rose-50 text-rose-700 border-rose-100 shadow-sm shadow-rose-100"
            }`}>
              {trendUp ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {description && <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1 opacity-70">
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            {description}
          </p>}
        </div>
      </CardContent>
    </Card>
  );
}
