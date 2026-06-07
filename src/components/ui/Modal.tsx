import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, description, children, footer, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-surface-100 p-6">
          <div>
            <h2 className="text-xl font-display font-bold text-surface-950">{title}</h2>
            {description && <p className="mt-1 text-sm font-medium text-surface-500">{description}</p>}
          </div>
          <button className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-900" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && <footer className="border-t border-surface-100 p-4">{footer}</footer>}
      </div>
    </div>
  );
}
