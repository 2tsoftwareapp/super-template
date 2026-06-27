"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import type { ApiEnvelope } from "@/lib/api-types";
import type {
  PreferenceLanguage,
  PreferenceTheme,
} from "@/lib/preferences";

import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";
import { I18nProvider } from "@/lib/i18n/context";
import { useTheme } from "@/lib/theme";
import { UserPreferencesProvider } from "@/lib/user-preferences-context";

interface LoadedPreferences {
  theme: PreferenceTheme;
  language: PreferenceLanguage;
  timezone: string;
}

const defaultPreferences: LoadedPreferences = {
  theme: "system",
  language: "en",
  timezone: "UTC",
};

function PreferenceThemeSync({
  theme,
}: {
  theme: PreferenceTheme | undefined;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [setTheme, theme]);

  return null;
}

function AuthenticatedPreferenceSync({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();
  const preferences = useQuery({
    queryKey: ["preferences"],
    queryFn: async () =>
      webFetch<ApiEnvelope<LoadedPreferences>>(
        "/api/bff/users/me/preferences",
      ),
    enabled: Boolean(session.data?.data.user),
    retry: false,
    staleTime: 30_000,
  });

  const resolved = preferences.data?.data ?? defaultPreferences;

  useEffect(() => {
    document.documentElement.lang = resolved.language;
  }, [resolved.language]);

  return (
    <UserPreferencesProvider
      language={resolved.language}
      timezone={resolved.timezone}
    >
      <I18nProvider locale={resolved.language}>
        <PreferenceThemeSync theme={resolved.theme} />
        {children}
      </I18nProvider>
    </UserPreferencesProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedPreferenceSync>{children}</AuthenticatedPreferenceSync>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
