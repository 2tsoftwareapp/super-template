import type { SortingState } from "@tanstack/react-table";

import type { SortCriterion, SortOrder } from "@repo/api-contract/sort/multi-sort";

export function createTableSortBridge<TField extends string>(config: {
  fieldByColumn: Record<string, TField | undefined>;
  columnByField: Record<TField, string>;
}) {
  return {
    sortingStateFromParams(sort: ReadonlyArray<SortCriterion<TField>>): SortingState {
      return sort.map((criterion) => ({
        id: config.columnByField[criterion.field] ?? criterion.field,
        desc: criterion.order === "desc",
      }));
    },

    paramsFromSortingState(
      sorting: SortingState,
      current: ReadonlyArray<SortCriterion<TField>>,
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
