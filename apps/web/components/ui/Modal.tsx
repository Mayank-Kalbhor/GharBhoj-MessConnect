import React, { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className={cn(
          'w-full bg-bg-card border border-border-default rounded-card p-5 relative max-h-[90vh] overflow-y-auto',
          maxWidthStyles[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-3 mb-3 border-b border-border-default">
          <div>
            <h3 className="text-base font-medium text-text-primary">{title}</h3>
            {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-screen transition-colors"
          >
            <IconX size={18} stroke={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
