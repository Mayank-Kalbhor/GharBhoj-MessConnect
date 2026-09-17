import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px]';

  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:opacity-90 active:opacity-100',
    secondary: 'bg-bg-card text-text-primary border border-border-muted hover:bg-bg-screen',
    accent: 'bg-brand-accent text-white hover:opacity-90',
    destructive: 'bg-danger-bg text-danger-text border border-danger-border hover:bg-red-100',
    outline: 'bg-transparent text-brand-primary border border-brand-primary hover:bg-brand-primary-tint',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-screen'
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
