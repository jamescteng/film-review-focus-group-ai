import React from 'react';

interface PillProps {
  children: React.ReactNode;
  icon?: string;
  variant?: 'default' | 'highlight' | 'concern' | 'muted';
  className?: string;
}

export const Pill: React.FC<PillProps> = ({ 
  children, 
  icon,
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    highlight: 'bg-emerald-50 text-emerald-700',
    concern: 'bg-rose-50 text-rose-700',
    muted: 'bg-slate-50 text-slate-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};
