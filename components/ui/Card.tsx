import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'concern' | 'elevated';
  onClick?: () => void;
  as?: 'div' | 'button';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  onClick,
  as = 'div'
}) => {
  const baseStyles = 'rounded-2xl border transition-all';
  
  const variants = {
    default: 'bg-white border-slate-200/70 shadow-soft',
    highlight: 'bg-white border-emerald-100 shadow-soft hover:shadow-card hover:border-emerald-300',
    concern: 'bg-white border-rose-100 shadow-soft hover:shadow-card hover:border-rose-300',
    elevated: 'bg-white border-slate-200/70 shadow-card',
  };

  const Component = as;
  
  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};
