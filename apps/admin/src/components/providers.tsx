"use client";

import { CsrfBootstrap } from "@repo/web-core/components/csrf-bootstrap";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

import { I18nProvider } from "@/lib/i18n";

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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <CsrfBootstrap />
          {children}
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
