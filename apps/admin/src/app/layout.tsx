import type { Metadata } from "next";

import { tweakcnFontClassName } from "@repo/web-core/theme/tweakcn-fonts";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "@/components/providers";

import "./globals.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;

export const metadata: Metadata = {
  title: "Super Admin",
  description: "Administration console for Super Template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={tweakcnFontClassName}>
      <body>
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
