import { Badge } from "@repo/web-ui/badge";
import { CheckCircle2 } from "lucide-react";

interface MfaStatusBadgeProps {
  enabled: boolean;
}

export function MfaStatusBadge({ enabled }: MfaStatusBadgeProps) {
  return (
    <Badge variant={enabled ? "default" : "outline"}>
      {enabled ? (
        <>
          <CheckCircle2 className="mr-1 size-3" />
          Enabled
        </>
      ) : (
        "Disabled"
      )}
    </Badge>
  );
}
