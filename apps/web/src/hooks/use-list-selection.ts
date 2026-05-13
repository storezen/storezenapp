"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ListSelectable = { id: string };

/**
 * Prunes selection when the visible list changes; supports select-all on current page.
 */
export function useListSelection<T extends ListSelectable>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const idsOnPage = useMemo(() => items.map((i) => i.id), [items]);

  useEffect(() => {
    const allowed = new Set(idsOnPage);
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
      }
      return next.size === prev.size && [...prev].every((id) => next.has(id)) ? prev : next;
    });
  }, [idsOnPage]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setSelected(new Set(idsOnPage));
  }, [idsOnPage]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const isAllOnPageSelected = idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id));

  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);

  const selectedCount = selected.size;

  const headerIndeterminate = selectedCount > 0 && !isAllOnPageSelected;

  return {
    selected,
    selectedCount,
    selectedItems,
    toggle,
    selectAllOnPage,
    clear,
    isSelected,
    isAllOnPageSelected,
    headerIndeterminate,
  };
}
