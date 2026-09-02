"use client";

import type { Table } from "@tanstack/react-table";

import { ResourceDataTable } from "@repo/web-ui/resource-data-table";

export interface MemberRow {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
}

interface OrganizationMembersTableProps {
  table: Table<MemberRow>;
  isLoading?: boolean;
  error?: { title: string; onRetry?: () => void };
  onRowClick?: (row: MemberRow) => void;
}

export function OrganizationMembersTable({
  table,
  isLoading,
  error,
  onRowClick,
}: OrganizationMembersTableProps) {
  return (
    <ResourceDataTable
      table={table}
      isLoading={isLoading}
      error={error}
      onRowClick={onRowClick}
      enableDensityToggle
      enableColumnVisibility
    />
  );
}
