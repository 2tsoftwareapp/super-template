"use client";

import { useDebouncedUrlSearch } from "@repo/web-hooks/use-debounced-url-search";
import { createUseSession } from "@repo/web-hooks/use-session-factory";
import { classifyError, getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { adminSessionQueryKey } from "@/lib/query-keys";

import type { SettingsViewModel, SettingValue } from "../model/settings.types";

import { useUpdateSettingMutation } from "../api/settings.mutations";
import { useSettingsQuery } from "../api/settings.queries";
import { settingsKeys } from "../api/settings.query-keys";
import { selectSettingsPermissions } from "../model/settings.permissions";

const useAdminSession = createUseSession({
  queryKey: adminSessionQueryKey,
});

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
  const session = useAdminSession();
  const { canRead, canUpdate } = selectSettingsPermissions(session.data?.data?.permissions);

  const {
    value: search,
    debouncedValue: debouncedSearch,
    setValue: setSearchInput,
  } = useDebouncedUrlSearch({
    searchParams,
    pathname,
    replace: (url) => {
      void router.replace(url);
    },
    paramName: "q",
  });

  const settings = useSettingsQuery();
  const [savingKey, setSavingKey] = useState<string | null>(null);

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
    search,
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
