import { Badge } from "@repo/web-ui/badge";
import { CheckCircle2, ShieldOff } from "lucide-react";

interface MfaStatusBadgeProps {
  enabled: boolean;
}

export function MfaStatusBadge({ enabled }: MfaStatusBadgeProps) {
  return (
    <Badge
      variant={enabled ? "default" : "outline"}
      className={
        enabled
          ? "bg-primary text-primary-foreground font-medium gap-1 text-xs"
          : "text-muted-foreground border-border gap-1 text-xs"
      }
    >
      {enabled ? (
        <>
          <CheckCircle2 className="size-3" />
          Enabled
        </>
      ) : (
        <>
          <ShieldOff className="size-3" />
          Disabled
        </>
      )}
    </Badge>
  );
}
