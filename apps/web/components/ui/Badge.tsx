import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'muted',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-badge';

  const variantStyles = {
    primary: 'bg-brand-primary-tint text-brand-primary',
    accent: 'bg-brand-accent-bg text-brand-accent-text',
    success: 'bg-success-bg text-success-text',
    danger: 'bg-danger-bg text-danger-text border border-danger-border',
    muted: 'bg-bg-card text-text-secondary border border-border-default'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 leading-none',
    md: 'text-xs px-2.5 py-1 leading-none'
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
