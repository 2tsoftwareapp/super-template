import { SettingsNav } from "@/components/settings-nav";
import { Separator } from "@/components/ui/separator";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar navigation */}
        <aside className="w-full shrink-0 lg:w-64">
          <SettingsNav />
        </aside>

        <Separator className="hidden lg:block lg:h-auto lg:w-px lg:self-stretch" />

        {/* Content area */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
