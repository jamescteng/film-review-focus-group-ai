import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'dark' | 'light' | 'primary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'dark',
  className = '' 
}) => {
  const variants = {
    dark: 'bg-slate-900 text-white',
    light: 'bg-slate-100 text-slate-600',
    primary: 'bg-blue-600 text-white',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
