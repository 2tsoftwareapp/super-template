import type { Metadata } from "next";

import { tweakcnFontClassName } from "@repo/web-utils/theme/tweakcn-fonts";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/lib/theme";

import "../globals.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
const swCleanupScript = `if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister();});})}`;

export const metadata: Metadata = {
  title: "Super Template — Full-stack monorepo starter",
  description:
    "Production-ready monorepo with NestJS API, Next.js web and admin, Flutter mobile, contract-driven clients, and dev/staging/prod environment layering.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`scroll-smooth ${tweakcnFontClassName}`}
    >
      <body>
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <script
          id="sw-cleanup"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: swCleanupScript }}
        />
        <NextIntlClientProvider>
          <ThemeProvider defaultTheme="light">
            <NuqsAdapter>
              <Providers>{children}</Providers>
            </NuqsAdapter>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
