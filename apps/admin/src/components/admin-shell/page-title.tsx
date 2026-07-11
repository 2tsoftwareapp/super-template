"use client";

import { usePathname } from "next/navigation";

import { getResourceForPath } from "@/lib/admin-resources";
import { useI18n } from "@/lib/i18n";

export function PageTitle() {
  const pathname = usePathname();
  const matched = getResourceForPath(pathname);
  const Icon = matched.icon;
  const { t } = useI18n();

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground/90 bg-muted/30 border border-border/20 px-2.5 py-1 rounded-md">
      <Icon className="shrink-0 size-3.5 text-primary" />
      <span className="truncate">{t(`nav.${matched.id}`)}</span>
    </div>
  );
}
