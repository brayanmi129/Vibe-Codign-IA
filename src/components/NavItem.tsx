import * as React from "react";

interface NavItemProps {
  key?: React.Key;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primaryColor?: string;
}

export function NavItem({ active, onClick, icon, label }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
        active
          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
          : "text-slate-500 hover:bg-brand-primary/5 hover:text-brand-primary"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
