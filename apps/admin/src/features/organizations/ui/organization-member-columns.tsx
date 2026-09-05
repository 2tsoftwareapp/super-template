"use client";

import { Badge } from "@repo/web-ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { Crown, Shield, User } from "lucide-react";

import type { MemberRow } from "@/features/organizations/model/organizations.types";
import type { OrganizationMemberDto } from "@/lib/api-types";

import { MemberActionsMenu } from "./member-actions-menu";

const columnHelper = createColumnHelper<MemberRow>();

export interface MemberColumnConfig {
  canManageMember: (member: OrganizationMemberDto) => boolean;
  canDemoteAdminToMember: (member: OrganizationMemberDto) => boolean;
  canPromoteAdminToOwner: (member: OrganizationMemberDto) => boolean;
  canDemoteOwnerToAdmin: (member: OrganizationMemberDto) => boolean;
  memberActions: {
    onUpdateRole: (userId: string, role: string) => void;
    onRemove: (userId: string) => void;
  };
}

export function createOrganizationMemberColumns(config: MemberColumnConfig) {
  const {
    canManageMember,
    canDemoteAdminToMember,
    canPromoteAdminToOwner,
    canDemoteOwnerToAdmin,
    memberActions,
  } = config;

  return [
    columnHelper.accessor("displayName", {
      header: "Name",
      cell: ({ row }) => {
        const { displayName, email } = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{displayName ?? "Unknown"}</span>
            {email && <span className="text-xs text-muted-foreground">{email}</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge
            variant={role === "OWNER" ? "default" : role === "ADMIN" ? "secondary" : "outline"}
            className="capitalize gap-1"
          >
            {role === "OWNER" && <Crown className="size-3 text-yellow-500" />}
            {role === "ADMIN" && <Shield className="size-3 text-blue-500" />}
            {role === "MEMBER" && <User className="size-3 text-muted-foreground" />}
            {role.toLowerCase()}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.createdAt}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const member = row.original;
        const manageable = canManageMember(member as unknown as OrganizationMemberDto);
        if (!manageable) return null;

        return (
          <MemberActionsMenu
            canPromoteToAdmin={member.role === "MEMBER"}
            canDemoteToMember={canDemoteAdminToMember(member as unknown as OrganizationMemberDto)}
            canPromoteToOwner={canPromoteAdminToOwner(member as unknown as OrganizationMemberDto)}
            canDemoteToAdmin={canDemoteOwnerToAdmin(member as unknown as OrganizationMemberDto)}
            onMakeAdmin={() => memberActions.onUpdateRole(member.userId, "ADMIN")}
            onDemoteToMember={() => memberActions.onUpdateRole(member.userId, "MEMBER")}
            onMakeOwner={() => memberActions.onUpdateRole(member.userId, "OWNER")}
            onDemoteToAdmin={() => memberActions.onUpdateRole(member.userId, "ADMIN")}
            onRemove={() => memberActions.onRemove(member.userId)}
          />
        );
      },
    }),
  ];
}
