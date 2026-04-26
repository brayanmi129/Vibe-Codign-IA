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
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium ${
        dark
          ? active
            ? "bg-white/20 text-white"
            : "text-white/65 hover:bg-white/10 hover:text-white"
          : active
            ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
            : "text-brand-text-secondary hover:bg-brand-primary/8 hover:text-brand-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
