import React from 'react';

interface SeverityPillProps {
  severity: number;
  className?: string;
}

export const SeverityPill: React.FC<SeverityPillProps> = ({ 
  severity,
  className = '' 
}) => {
  const getStyles = (s: number) => {
    if (s >= 4) return 'bg-red-50 text-red-700 border-red-200';
    if (s >= 3) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (s >= 2) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStyles(severity)} ${className}`}>
      {severity}/5
    </span>
  );
};
