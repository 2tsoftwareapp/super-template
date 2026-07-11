import type { Metadata } from "next";

import { tweakcnFontClassName } from "@repo/web-core/theme/tweakcn-fonts";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/lib/theme";

import "./globals.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
const swCleanupScript = `if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister();});})}`;

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
        <ThemeProvider defaultTheme="light">
          <NuqsAdapter>
            <Providers>{children}</Providers>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
