"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { classifyError, getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { SettingsViewModel, SettingValue } from "@/features/settings/model/settings.types";

import { useUpdateSettingMutation } from "@/features/settings/api/settings.mutations";
import { useSettingsQuery } from "@/features/settings/api/settings.queries";
import { settingsKeys } from "@/features/settings/api/settings.query-keys";
import { selectSettingsPermissions } from "@/features/settings/model/settings.permissions";
import { parseSettingsSearchParams } from "@/features/settings/model/settings.search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

export type { SettingsViewModel };

/**
 * Orchestration hook for the settings screen.
 *
 * Flow:
 *   1. Session → settings read/update permission booleans.
 *   2. Load settings list (staleTime 5 min); client-side search filter.
 *   3. Track scalar + object draft state; detect per-setting changes.
 *   4. Save: confirm dialog → light Zod validation → PATCH → toast on error.
 * Owns: settings query, draft state, save mutation, permission gate.
 * Does not own: setting-card presentation.
 */
export function useSettingsController(): SettingsViewModel {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSession();
  const { canRead, canUpdate } = selectSettingsPermissions(session.data?.data?.permissions);

  const { q: urlSearch } = parseSettingsSearchParams(new URLSearchParams(searchParams.toString()));

  const settings = useSettingsQuery();

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const lastUrlSearchRef = useRef(urlSearch);
  const syncingFromUrlRef = useRef(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (lastUrlSearchRef.current === urlSearch) return;
    lastUrlSearchRef.current = urlSearch;
    syncingFromUrlRef.current = true;
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      if (debouncedSearch === urlSearch) syncingFromUrlRef.current = false;
      return;
    }
    if (debouncedSearch !== searchInput || debouncedSearch === urlSearch) return;

    const next = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");

    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [debouncedSearch, pathname, router, searchInput, searchParams, urlSearch]);

  const filtered = useMemo(() => {
    const all = settings.data?.data ?? [];
    if (!debouncedSearch) return all;
    const q = debouncedSearch.toLowerCase();
    return all.filter((s) => s.key.toLowerCase().includes(q));
  }, [settings.data?.data, debouncedSearch]);

  const updateSetting = useUpdateSettingMutation({
    onSuccess: () => {
      setSavingKey(null);
      toast.success("Setting saved");
    },
    onError: (error) => {
      setSavingKey(null);
      // classifyError standardizes kind/scope; message stays user-safe (§18.1).
      const classified = classifyError(error);
      toast.error(getErrorMessage(error, classified.message));
    },
  });

  const handleSave = (key: string, value: SettingValue) => {
    setSavingKey(key);
    updateSetting.mutate({ key, value });
  };

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
  };

  return {
    canRead,
    canUpdate,
    search: debouncedSearch,
    onSearchChange: setSearchInput,
    isLoading: settings.isLoading,
    isRefreshing: settings.isFetching,
    isError: settings.isError,
    onRetry: handleRetry,
    onRefresh: handleRetry,
    totalCount: settings.data ? settings.data.data.length : null,
    filtered,
    onSave: handleSave,
    isSavingKey: savingKey,
  };
}
