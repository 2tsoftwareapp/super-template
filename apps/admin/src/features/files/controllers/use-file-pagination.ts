"use client";

import { useCallback, useState } from "react";

export function useFilePagination() {
  const [search, setSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [page, setPage] = useState(1);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleMimeFilterChange = useCallback((value: string) => {
    setMimeFilter(value);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setMimeFilter("");
    setSearch("");
    setPage(1);
  }, []);

  return {
    search,
    mimeFilter,
    page,
    hasFilters: Boolean(mimeFilter || search),
    onSearchChange: handleSearchChange,
    onMimeFilterChange: handleMimeFilterChange,
    onClearFilters: clearFilters,
    onPageChange: setPage,
  };
}
