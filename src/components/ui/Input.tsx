import type { ChangeEventHandler, ReactNode } from 'react';

interface InputProps {
  label?: string;
  icon?: ReactNode;
  id?: string;
  name?: string;
  className?: string;
  type?: string;
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function Input({ className = '', label, icon, id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label && <span className="micro-label ml-1">{label}</span>}
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">{icon}</div>}
        <input
          id={inputId}
          className={`input-tech ${icon ? 'pl-11' : ''} ${className}`}
          {...props}
        />
      </div>
    </label>
  );
}
