import type { ReactNode } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@repo/web-core/components/card";

export function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        {icon ? (
          <div className="flex items-center gap-2">
            {icon}
            <CardDescription>{label}</CardDescription>
          </div>
        ) : (
          <CardDescription>{label}</CardDescription>
        )}
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
