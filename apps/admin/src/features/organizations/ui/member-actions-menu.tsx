"use client";

import { Dropdown, type DropdownItem } from "@repo/web-ui/dropdown";
import { Crown, MoreHorizontal, Shield, UserMinus, UserX } from "lucide-react";

interface MemberActionsMenuProps {
  canPromoteToAdmin: boolean;
  canDemoteToMember: boolean;
  canPromoteToOwner: boolean;
  canDemoteToAdmin: boolean;
  onMakeAdmin: () => void;
  onDemoteToMember: () => void;
  onMakeOwner: () => void;
  onDemoteToAdmin: () => void;
  onRemove: () => void;
}

export function MemberActionsMenu(props: MemberActionsMenuProps) {
  const items: DropdownItem[] = [];

  if (props.canPromoteToAdmin) {
    items.push({
      label: "Make Admin",
      icon: <Shield className="size-3.5" />,
      onClick: props.onMakeAdmin,
    });
  }
  if (props.canDemoteToMember) {
    items.push({
      label: "Demote to Member",
      icon: <UserMinus className="size-3.5" />,
      onClick: props.onDemoteToMember,
    });
  }
  if (props.canPromoteToOwner) {
    items.push({
      label: "Make Owner",
      icon: <Crown className="size-3.5" />,
      onClick: props.onMakeOwner,
    });
  }
  if (props.canDemoteToAdmin) {
    items.push({
      label: "Demote to Admin",
      icon: <UserMinus className="size-3.5" />,
      onClick: props.onDemoteToAdmin,
    });
  }
  if (items.length > 0) {
    items.push({ separator: true });
  }
  items.push({
    label: "Remove",
    icon: <UserX className="size-3.5" />,
    onClick: props.onRemove,
    destructive: true,
  });

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="size-8 rounded-md hover:bg-muted flex items-center justify-center"
          aria-label="Member actions"
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </button>
      }
      items={items}
    />
  );
}
