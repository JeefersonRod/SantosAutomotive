import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90',
  secondary: 'bg-white text-surface-700 border border-surface-200 hover:border-brand-primary/30 hover:text-brand-primary',
  ghost: 'bg-transparent text-surface-500 hover:bg-surface-100 hover:text-surface-900',
  danger: 'bg-red-500 text-white shadow-lg shadow-red-500/15 hover:bg-red-600',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-5 py-3 text-sm rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
};

export function Button({
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  icon,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
