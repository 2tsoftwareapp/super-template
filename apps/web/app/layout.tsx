import "./globals.css";

import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Lean Template" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
