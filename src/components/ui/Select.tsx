import type { ChangeEventHandler, ReactNode } from 'react';

interface SelectProps {
  label?: string;
  children?: ReactNode;
  id?: string;
  name?: string;
  className?: string;
  value?: string | number | readonly string[];
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}

export function Select({ className = '', label, id, children, ...props }: SelectProps) {
  const selectId = id || props.name;

  return (
    <label className="block space-y-2" htmlFor={selectId}>
      {label && <span className="micro-label ml-1">{label}</span>}
      <select
        id={selectId}
        className={`input-tech appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
