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
            ? "bg-brand-text-secondary/20 text-brand-text-secondary"
            : "text-brand-text-secondary hover:bg-brand-text-secondary/10 hover:text-brand-text-secondary"
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
