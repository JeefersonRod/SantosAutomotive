import type { ReactNode } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-2xl border border-surface-200 bg-white p-1 shadow-sm">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            value === item.id ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-surface-500 hover:bg-surface-50'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
