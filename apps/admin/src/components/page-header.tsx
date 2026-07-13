import type { ReactNode } from "react";

import { Badge } from "@repo/web-ui/badge";

export function PageHeader({
  label,
  title,
  description,
  actions,
}: {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Badge variant="outline" className="w-fit">
        {label}
      </Badge>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
