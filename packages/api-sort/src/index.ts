export type SortOrder = "asc" | "desc";

export interface SortCriterion<TField extends string = string> {
  field: TField;
  order: SortOrder;
}

function toAllowedFieldSet<TField extends string>(
  allowedFields: ReadonlySet<TField> | readonly TField[],
): ReadonlySet<TField> {
  return allowedFields instanceof Set ? allowedFields : new Set(allowedFields);
}

function parseSortOrder(value: string | undefined): SortOrder | null {
  const order = (value ?? "asc").trim().toLowerCase();

  if (order === "asc" || order === "desc") {
    return order;
  }

  return null;
}

function resolveAllowedField<TField extends string>(
  fieldRaw: string | undefined,
  allowed: ReadonlySet<TField>,
): TField | null {
  if (!fieldRaw) {
    return null;
  }

  const trimmed = fieldRaw.trim();

  for (const field of allowed) {
    if (field === trimmed) {
      return field;
    }
  }

  return null;
}

export function formatSortParam<TField extends string>(
  sort: readonly SortCriterion<TField>[],
): string {
  return sort.map((criterion) => `${criterion.field}:${criterion.order}`).join(",");
}

export function sortCriteriaEqual<TField extends string>(
  left: readonly SortCriterion<TField>[],
  right: readonly SortCriterion<TField>[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (criterion, index) =>
      criterion.field === right[index]?.field && criterion.order === right[index]?.order,
  );
}

export function parseSortParam<TField extends string>(
  sort: string | undefined,
  allowedFields: ReadonlySet<TField> | readonly TField[],
  fallback: readonly SortCriterion<TField>[],
): SortCriterion<TField>[] {
  if (!sort?.trim()) {
    return [...fallback];
  }

  const allowed = toAllowedFieldSet(allowedFields);
  const parsed: SortCriterion<TField>[] = [];
  const seen = new Set<TField>();

  for (const part of sort.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const [fieldRaw, orderRaw] = trimmed.split(":");
    const field = resolveAllowedField<TField>(fieldRaw, allowed);
    const order = parseSortOrder(orderRaw);

    if (!field || !order) {
      continue;
    }

    if (seen.has(field)) {
      continue;
    }

    seen.add(field);
    parsed.push({ field, order });
  }

  return parsed.length > 0 ? parsed : [...fallback];
}

export function sortsFromQuery<TField extends string>(
  query: {
    sort?: string | undefined;
    sortField: TField;
    sortOrder: SortOrder;
  },
  allowedFields: ReadonlySet<TField> | readonly TField[],
): SortCriterion<TField>[] {
  return parseSortParam(query.sort, allowedFields, [
    { field: query.sortField, order: query.sortOrder },
  ]);
}
