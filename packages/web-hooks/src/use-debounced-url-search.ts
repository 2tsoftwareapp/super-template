"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDebouncedUrlSearchOptions {
  /** Current URL search params (from useSearchParams). */
  searchParams: Pick<URLSearchParams, "get" | "toString">;
  /** Current pathname (from usePathname). */
  pathname: string;
  /** Router.replace function (from useRouter). */
  replace: (url: string) => void;
  /** URL search param name to read/write (e.g. "q", "search"). */
  paramName?: string;
  /** Default value when the param is absent from the URL. */
  defaultValue?: string;
  /** Debounce delay in ms before writing to the URL. @default 300 */
  debounceMs?: number;
}

interface UseDebouncedUrlSearchReturn {
  /** Current (instant) value — updates on every keystroke. */
  value: string;
  /** Debounced value — updates after debounceMs delay. Use this for queries. */
  debouncedValue: string;
  /** Set the search value immediately (updates input, triggers debounce to URL). */
  setValue: (value: string) => void;
}

/**
 * Bidirectional sync between a local search input and a URL search param,
 * with debounced writes to the URL.
 *
 * - **URL → local:** When the URL changes (back/forward, external navigation),
 *   the local value updates immediately.
 * - **Local → URL:** When the user types, the local value updates immediately
 *   but the URL only updates after `debounceMs` (default 300ms).
 *
 * Pass Next.js navigation primitives (`useSearchParams`, `usePathname`, `useRouter`)
 * as options — this keeps the hook framework-agnostic at the package level.
 *
 * @example
 * const searchParams = useSearchParams();
 * const pathname = usePathname();
 * const router = useRouter();
 *
 * const { value, debouncedValue, setValue } = useDebouncedUrlSearch({
 *   searchParams,
 *   pathname,
 *   replace: router.replace,
 *   paramName: "q",
 * });
 *
 * // Use `value` for the input field
 * <Input value={value} onChange={(e) => setValue(e.target.value)} />
 *
 * // Use `debouncedValue` for the query
 * const { data } = useQuery({ queryKey: ["items", debouncedValue] });
 */
export function useDebouncedUrlSearch({
  searchParams,
  pathname,
  replace,
  paramName = "q",
  defaultValue = "",
  debounceMs = 300,
}: UseDebouncedUrlSearchOptions): UseDebouncedUrlSearchReturn {
  // Read initial value from URL
  const urlValue = searchParams.get(paramName) ?? defaultValue;

  const [localValue, setLocalValue] = useState(urlValue);

  // Debounce localValue → debouncedValue
  const [debouncedValue, setDebouncedValue] = useState(localValue);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  // Refs to prevent sync loops between URL → local and local → URL
  const lastUrlValueRef = useRef(urlValue);
  const syncingFromUrlRef = useRef(false);

  // Sync URL → local (e.g. back/forward navigation, external URL change)
  useEffect(() => {
    if (lastUrlValueRef.current === urlValue) return;
    lastUrlValueRef.current = urlValue;
    syncingFromUrlRef.current = true;
    setLocalValue(urlValue);
  }, [urlValue]);

  // Sync local → URL (debounced)
  useEffect(() => {
    // If we're syncing from URL, wait until debounced catches up
    if (syncingFromUrlRef.current) {
      if (debouncedValue === urlValue) syncingFromUrlRef.current = false;
      return;
    }

    // Skip if debounced hasn't caught up to local yet (debounce pending)
    // or if debounced already matches URL (nothing to write)
    if (debouncedValue !== localValue || debouncedValue === urlValue) return;

    const next = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      next.set(paramName, debouncedValue);
    } else {
      next.delete(paramName);
    }

    const queryString = next.toString();
    replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [debouncedValue, localValue, urlValue, paramName, pathname, replace, searchParams]);

  const setValue = useCallback((value: string) => {
    setLocalValue(value);
  }, []);

  return {
    value: localValue,
    debouncedValue,
    setValue,
  };
}
