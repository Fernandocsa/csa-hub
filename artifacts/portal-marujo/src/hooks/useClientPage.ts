import { useEffect, useMemo, useState } from "react";
import { LIST_PAGE_SIZE } from "@/lib/list-page";

/**
 * Client-side pagination for APIs that return a full array.
 * Controls only matter when `items.length > pageSize`.
 */
export function useClientPage<T>(items: T[], pageSize = LIST_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const slice = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    setPage,
    pageSize,
    total,
    slice,
    needsPagination: total > pageSize,
    rankOffset: (safePage - 1) * pageSize,
  };
}
