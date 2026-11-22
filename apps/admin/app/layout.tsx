import "./globals.css";

import { AdminNav } from "@/components/admin-nav";

export const metadata = { title: "Lean Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/40">
        <AdminNav />
        {children}
      </body>
    </html>
  );
}
