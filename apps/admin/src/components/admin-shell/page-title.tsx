"use client";

import { usePathname } from "@/i18n/navigation";
import { getResourceForPath } from "@/lib/admin-resources";
import { useI18n } from "@/lib/i18n";

export function PageTitle() {
  const pathname = usePathname();
  const matched = getResourceForPath(pathname);
  const Icon = matched.icon;
  const { t } = useI18n();

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs font-semibold text-foreground/80">
      <Icon className="size-3.5 shrink-0 text-primary" />
      <span className="truncate">{t(`nav.${matched.id}`)}</span>
    </div>
  );
}
