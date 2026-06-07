import type { ChangeEventHandler } from 'react';

interface TextareaProps {
  label?: string;
  id?: string;
  name?: string;
  className?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

export function Textarea({ className = '', label, id, ...props }: TextareaProps) {
  const textareaId = id || props.name;

  return (
    <label className="block space-y-2" htmlFor={textareaId}>
      {label && <span className="micro-label ml-1">{label}</span>}
      <textarea
        id={textareaId}
        className={`input-tech min-h-28 resize-y ${className}`}
        {...props}
      />
    </label>
  );
}
