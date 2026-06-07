export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-surface-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary/20 border-t-brand-primary" />
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}
