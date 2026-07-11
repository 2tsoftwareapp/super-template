import type { Metadata } from "next";

import { tweakcnFontClassName } from "@repo/web-core/theme/tweakcn-fonts";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Super Template — Full-stack monorepo starter",
  description:
    "Production-ready monorepo with NestJS API, Next.js web and admin, Flutter mobile, contract-driven clients, and dev/staging/prod environment layering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${tweakcnFontClassName}`}
    >
      <body>
        {/*
          beforeInteractive: Next.js injects these into raw HTML outside React's
          rendering pipeline, so React 19 never sees them as <script> elements.
        */}
        {/* Prevent FOUC: apply saved theme before hydration */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`,
          }}
        />
        {/* Unregister any stale service workers so old cached chunks are cleared */}
        <Script
          id="sw-cleanup"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister();});})}`,
          }}
        />
        <ThemeProvider defaultTheme="light">
          <NuqsAdapter>
            <Providers>{children}</Providers>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
