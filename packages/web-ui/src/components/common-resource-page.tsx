"use client";

import type { AdminResourceConfig } from "@repo/web-utils/admin-resource";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@repo/web-utils/utils";

import { BulkActionBar } from "../composables/bulk-action-bar";
import { Pagination } from "./pagination";
import { type ResourcePageLinkComponent, ResourcePageShell } from "./resource-page-shell";
import { type ResourceStatCardItem, ResourceStatCards } from "./resource-stat-cards";

export interface CommonResourcePagePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number | undefined;
  pageSizeOptions?: readonly number[] | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange?: ((pageSize: number) => void) | undefined;
  isLoading?: boolean | undefined;
}

export interface CommonResourcePageBulkActions {
  selectedCount: number;
  onClear: () => void;
  actions?: ReactNode | undefined;
}

export interface CommonResourcePageProps {
  /** Resource metadata or configuration */
  resource: AdminResourceConfig<ComponentType<{ className?: string }>>;
  title?: string | undefined;
  description: string;
  headerActions?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  backHref?: string | undefined;
  meta?: ReactNode | undefined;
  isRefreshing?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  linkComponent?: ResourcePageLinkComponent | undefined;

  /** Stats section */
  stats?: ResourceStatCardItem[] | undefined;
  statsColumns?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  statsLoading?: boolean | undefined;
  statsSlot?: ReactNode | undefined;

  /** Filter / search toolbar */
  filterBar?: ReactNode | undefined;
  toolbarSlot?: ReactNode | undefined;

  /** Bulk Selection Bar */
  bulkActions?: CommonResourcePageBulkActions | undefined;
  bulkActionBarSlot?: ReactNode | undefined;

  /** Main content area (ResourceDataTable, grid, split view, or children) */
  content?: ReactNode | undefined;
  children?: ReactNode | undefined;

  /** Pagination footer */
  pagination?: CommonResourcePagePagination | undefined;
  paginationSlot?: ReactNode | undefined;

  /** Slide-over detail drawer / pane */
  detailPane?: ReactNode | undefined;

  /** Wrap the filter + content + pagination in a unified card container (default: true) */
  cardWrapper?: boolean | undefined;

  /** Error or custom banner */
  error?: ReactNode | undefined;

  /** Styling classes */
  className?: string | undefined;
  containerClassName?: string | undefined;
}

export function CommonResourcePage({
  resource,
  title,
  description,
  headerActions,
  actions,
  backHref,
  meta,
  isRefreshing,
  onRefresh,
  linkComponent,
  stats,
  statsColumns = 4,
  statsLoading,
  statsSlot,
  filterBar,
  toolbarSlot,
  bulkActions,
  bulkActionBarSlot,
  content,
  children,
  pagination,
  paginationSlot,
  detailPane,
  cardWrapper = true,
  error,
  className,
  containerClassName,
}: CommonResourcePageProps) {
  const effectiveHeaderActions = headerActions ?? actions;
  const effectiveFilterBar = filterBar ?? toolbarSlot;
  const effectiveBulkActionBar =
    bulkActionBarSlot ??
    (bulkActions ? (
      <BulkActionBar
        selectedCount={bulkActions.selectedCount}
        onClear={bulkActions.onClear}
        {...(bulkActions.actions ? { actions: bulkActions.actions } : {})}
      />
    ) : null);
  const effectiveContent = content ?? children;
  const effectivePagination =
    paginationSlot ??
    (pagination ? (
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages ?? Math.ceil(pagination.total / pagination.pageSize)}
        {...(pagination.pageSizeOptions ? { pageSizeOptions: pagination.pageSizeOptions } : {})}
        onPageChange={pagination.onPageChange}
        {...(pagination.onPageSizeChange ? { onPageSizeChange: pagination.onPageSizeChange } : {})}
        {...(pagination.isLoading !== undefined ? { isLoading: pagination.isLoading } : {})}
      />
    ) : null);

  return (
    <ResourcePageShell
      resource={resource}
      description={description}
      {...(title !== undefined ? { title } : {})}
      {...(effectiveHeaderActions !== undefined ? { actions: effectiveHeaderActions } : {})}
      {...(backHref !== undefined ? { backHref } : {})}
      {...(meta !== undefined ? { meta } : {})}
      {...(isRefreshing !== undefined ? { isRefreshing } : {})}
      {...(onRefresh !== undefined ? { onRefresh } : {})}
      {...(linkComponent !== undefined ? { linkComponent } : {})}
    >
      <div className={cn("flex flex-col gap-6", containerClassName)}>
        {/* Statistics Cards */}
        {statsSlot ??
          (stats && stats.length > 0 ? (
            <ResourceStatCards
              items={stats}
              columns={statsColumns}
              {...(statsLoading !== undefined ? { isLoading: statsLoading } : {})}
            />
          ) : null)}

        {/* Optional Error banner */}
        {error ? <div className="rounded-xl">{error}</div> : null}

        {/* Data / Table Container */}
        {cardWrapper ? (
          <div
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs",
              className,
            )}
            data-testid="common-resource-card-container"
          >
            {effectiveFilterBar}
            {effectiveBulkActionBar}
            <div className="min-w-0 flex-1">{effectiveContent}</div>
            {effectivePagination}
          </div>
        ) : (
          <div className={cn("flex flex-col gap-4", className)}>
            {effectiveFilterBar}
            {effectiveBulkActionBar}
            <div className="min-w-0 flex-1">{effectiveContent}</div>
            {effectivePagination}
          </div>
        )}

        {/* Slide-over Detail Drawer */}
        {detailPane}
      </div>
    </ResourcePageShell>
  );
}
