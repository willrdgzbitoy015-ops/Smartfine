import { useEffect, useRef, useState } from "react";

// How many rows a list shows per page.
export const PAGE_SIZE = 10;

// Splits an already filtered list into pages. `resetKey` is anything that
// should send the list back to page 1 when it changes (a search, a filter);
// if the list shrinks (a fine is deleted, a filter narrows it) the current page
// moves back to the last page that still exists.
export function usePagination<T>(
  items: readonly T[],
  resetKey: string,
  pageSize: number = PAGE_SIZE,
) {
  const [requested, setRequested] = useState(1);

  const lastKey = useRef(resetKey);

  useEffect(() => {
    if (lastKey.current !== resetKey) {
      lastKey.current = resetKey;
      setRequested(1);
    }
  }, [resetKey]);

  const total = items.length;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const page = Math.min(requested, pageCount);

  const start = (page - 1) * pageSize;

  return {
    page,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    setPage: (next: number) =>
      setRequested(Math.min(Math.max(1, next), pageCount)),
  };
}

export type Pager = ReturnType<typeof usePagination>;
