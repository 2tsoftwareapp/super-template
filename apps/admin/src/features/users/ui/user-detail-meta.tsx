import { Badge } from "@repo/web-core/components/badge";
import { BadgeCheck, XCircle } from "lucide-react";

import type { AdminUserDto } from "@/lib/api-types";

import { statusProps } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UserDetailMetaProps {
  user: AdminUserDto;
  flags: { isSelf: boolean };
}

export function UserDetailMeta({ user, flags }: UserDetailMetaProps) {
  const { variant: sv, className: sc } = statusProps(user.status);
  const isVerified = Boolean(
    (user as Record<string, unknown>).emailVerifiedAt,
  );

  return (
    <>
      <Badge variant={sv} className={sc}>
        {user.status.toLowerCase()}
      </Badge>
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[11px] px-1.5 py-0",
          isVerified
            ? "text-primary border-primary/30"
            : "text-muted-foreground",
        )}
      >
        {isVerified ? (
          <>
            <BadgeCheck className="size-3" /> Verified
          </>
        ) : (
          <>
            <XCircle className="size-3" /> Unverified
          </>
        )}
      </Badge>
      {user.roles.map((r) => (
        <Badge
          key={r}
          variant={r === "SUPER_ADMIN" || r === "ADMIN" ? "default" : "secondary"}
        >
          {r.toLowerCase().replace(/_/g, " ")}
        </Badge>
      ))}
      {flags.isSelf && <Badge variant="secondary">You</Badge>}
    </>
  );
}
