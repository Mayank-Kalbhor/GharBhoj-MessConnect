import React from 'react';
import { cn } from '@/lib/utils';

export interface MetricTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    positive?: boolean;
    text: string;
  };
  className?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  className
}) => {
  return (
    <div className={cn('bg-bg-card border border-border-default rounded-card p-4 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between text-text-secondary mb-1">
        <span className="text-xs font-medium">{label}</span>
        {icon && <div className="text-text-secondary">{icon}</div>}
      </div>

      <div className="text-xl font-medium text-text-primary tracking-tight">
        {value}
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px]">
          {trend && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded font-medium',
                trend.positive
                  ? 'bg-success-bg text-success-text'
                  : 'bg-danger-bg text-danger-text'
              )}
            >
              {trend.text}
            </span>
          )}
          {subtext && <span className="text-text-secondary">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
