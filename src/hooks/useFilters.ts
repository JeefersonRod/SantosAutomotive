import { useMemo, useState } from 'react';

export function useFilters<T>(items: T[], predicate: (item: T, search: string) => boolean) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(
    () => items.filter(item => predicate(item, search.trim().toLowerCase())),
    [items, predicate, search]
  );

  return { search, setSearch, filteredItems };
}
