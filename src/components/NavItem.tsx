import * as React from "react";

interface NavItemProps {
  key?: React.Key;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primaryColor?: string;
  dark?: boolean;
}

export function NavItem({ active, onClick, icon, label, dark = false }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all font-semibold text-sm group ${
        dark
          ? active
            ? "bg-white/10 text-white shadow-xl shadow-black/10"
            : "text-white/60 hover:bg-white/5 hover:text-white"
          : active
            ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/30"
            : "text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary"
      }`}
    >
      <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
