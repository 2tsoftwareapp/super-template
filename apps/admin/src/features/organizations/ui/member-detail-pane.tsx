"use client";

import { ResourceDetailPane } from "@repo/web-ui/resource-detail-pane";
import { ResourcePropertyGrid } from "@repo/web-ui/resource-property-grid";

import type { OrganizationMemberDto } from "@/lib/api-types";

interface MemberDetailPaneProps {
  open: boolean;
  onClose: () => void;
  member: OrganizationMemberDto | null;
}

export function MemberDetailPane({ open, onClose, member }: MemberDetailPaneProps) {
  return (
    <ResourceDetailPane
      open={open}
      onClose={onClose}
      title={member?.displayName ?? "Member"}
      description={member?.email ?? undefined}
      id={member?.userId}
      overview={
        <ResourcePropertyGrid
          columns={1}
          density="default"
          properties={[
            { key: "email", label: "Email", value: member?.email },
            { key: "role", label: "Role", value: member?.role, type: "badge" as const },
            { key: "joined", label: "Joined", value: member?.createdAt, type: "timestamp" as const },
          ]}
        />
      }
    />
  );
}
