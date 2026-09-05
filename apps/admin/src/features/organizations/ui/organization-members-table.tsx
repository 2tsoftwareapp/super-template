"use client";

import type { Table } from "@tanstack/react-table";

import { ResourceDataTable } from "@repo/web-ui/resource-data-table";

import type { MemberRow } from "@/features/organizations/model/organizations.types";

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
