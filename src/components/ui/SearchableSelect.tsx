import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string | number;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  onChange: (value: string) => void;
}

export function SearchableSelect({
  label,
  value,
  options,
  placeholder = 'Selecione',
  searchPlaceholder = 'Pesquisar...',
  emptyLabel = 'Nenhuma opcao encontrada',
  required = false,
  disabled = false,
  className = '',
  icon,
  onChange
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLLabelElement>(null);
  const stringValue = String(value ?? '');

  const selectedOption = options.find((option) => option.value === stringValue);
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <label ref={containerRef} className={`relative block space-y-2 ${className}`}>
      {label && <span className="micro-label ml-1">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        className={`input-tech flex items-center gap-3 text-left ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon && <span className="text-surface-300">{icon}</span>}
        <span className={`flex-1 truncate font-bold ${selectedOption ? 'text-surface-900' : 'text-surface-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        {stringValue && !required && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            onClick={(event) => {
              event.stopPropagation();
              selectOption('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                selectOption('');
              }
            }}
            aria-label="Limpar selecao"
          >
            <X className="h-4 w-4" />
          </span>
        ) : null}
        <ChevronDown className={`h-4 w-4 text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 rounded-2xl border border-surface-200 bg-white p-2 shadow-2xl shadow-surface-900/15">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 py-3 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto" role="listbox">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm font-medium text-surface-400">{emptyLabel}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors ${
                    option.value === stringValue
                      ? 'bg-brand-primary text-white'
                      : 'text-surface-700 hover:bg-surface-50'
                  }`}
                  onClick={() => selectOption(option.value)}
                  role="option"
                  aria-selected={option.value === stringValue}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </label>
  );
}
