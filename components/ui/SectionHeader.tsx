import React from 'react';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  children, 
  className = '',
  as: Component = 'h3'
}) => {
  return (
    <Component className={`text-xs font-bold uppercase tracking-widest text-slate-400 ${className}`}>
      {children}
    </Component>
  );
};
