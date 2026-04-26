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
    variant === "warning" ? "border-amber-100 bg-amber-50/30" :
    variant === "danger" ? "border-rose-100 bg-rose-50/30" :
    "bg-white border-slate-200";

  return (
    <Card className={`${bgClass} shadow-sm border`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {description && <p className="text-[10px] text-slate-400 mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
