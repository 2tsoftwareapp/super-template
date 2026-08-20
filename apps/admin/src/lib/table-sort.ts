import type { SortingState } from "@tanstack/react-table";

import {
  formatSortParam,
  sortCriteriaEqual,
  type SortCriterion,
  type SortOrder,
} from "@repo/api-sort";

/**
 * Stable string key for a sort state — used to detect no-op sort events
 * (e.g. clicking a column already sorted) before syncing URL params.
 */
export function sortKey<TField extends string>(sort: readonly SortCriterion<TField>[]) {
  return formatSortParam(sort);
}

/** True when two sort states differ (order-sensitive, length-sensitive). */
export function sortChanged<TField extends string>(
  current: readonly SortCriterion<TField>[],
  next: readonly SortCriterion<TField>[],
) {
  return !sortCriteriaEqual(current, next);
}

/** Sort ↔ table-state mapping for one resource table. */
export interface TableSortBridge<TField extends string> {
  sortingStateFromParams(sort: readonly SortCriterion<TField>[]): SortingState;
  paramsFromSortingState(
    sorting: SortingState,
    current: readonly SortCriterion<TField>[],
  ): SortCriterion<TField>[];
}

export function createTableSortBridge<TField extends string>(config: {
  fieldByColumn: Record<string, TField | undefined>;
  columnByField: Record<TField, string>;
}): TableSortBridge<TField> {
  return {
    sortingStateFromParams(sort: readonly SortCriterion<TField>[]): SortingState {
      return sort.map((criterion) => ({
        id: config.columnByField[criterion.field] ?? criterion.field,
        desc: criterion.order === "desc",
      }));
    },

    paramsFromSortingState(
      sorting: SortingState,
      current: readonly SortCriterion<TField>[],
    ): SortCriterion<TField>[] {
      if (sorting.length === 0) {
        return [...current];
      }

      const next: SortCriterion<TField>[] = sorting.flatMap((entry) => {
        const field = config.fieldByColumn[entry.id];
        if (!field) {
          return [];
        }

        const order: SortOrder = entry.desc ? "desc" : "asc";
        return [{ field, order }];
      });

      return next.length > 0 ? next : [...current];
    },
  };
}
