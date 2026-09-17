import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-text-primary mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-bg-card border rounded-[8px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-primary transition-colors',
            error ? 'border-danger-text' : 'border-border-default',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-danger-text mt-1">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-text-secondary mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
