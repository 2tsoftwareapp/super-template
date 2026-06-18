import { describe, expect, it } from 'vitest';

import {
  formatSortParam,
  parseSortParam,
  sortsFromQuery,
} from './multi-sort';

describe('multi-sort helpers', () => {
  const allowedFields = ['createdAt', 'displayName', 'email', 'status'] as const;
  const fallback = [{ field: 'createdAt' as const, order: 'desc' as const }];

  it('formats sort criteria into a query param', () => {
    expect(
      formatSortParam([
        { field: 'status', order: 'asc' },
        { field: 'createdAt', order: 'desc' },
      ]),
    ).toBe('status:asc,createdAt:desc');
  });

  it('parses a single sort rule', () => {
    expect(parseSortParam('status:asc', allowedFields, fallback)).toEqual([
      { field: 'status', order: 'asc' },
    ]);
  });

  it('parses multiple sort rules in order', () => {
    expect(
      parseSortParam('status:asc,createdAt:desc', allowedFields, fallback),
    ).toEqual([
      { field: 'status', order: 'asc' },
      { field: 'createdAt', order: 'desc' },
    ]);
  });

  it('ignores invalid fields and duplicate rules', () => {
    expect(
      parseSortParam(
        'status:asc,invalid:desc,status:desc,email:asc',
        allowedFields,
        fallback,
      ),
    ).toEqual([
      { field: 'status', order: 'asc' },
      { field: 'email', order: 'asc' },
    ]);
  });

  it('falls back when sort param is empty or invalid', () => {
    expect(parseSortParam('', allowedFields, fallback)).toEqual(fallback);
    expect(parseSortParam('invalid:asc', allowedFields, fallback)).toEqual(
      fallback,
    );
  });

  it('prefers sort param over legacy sortField and sortOrder', () => {
    expect(
      sortsFromQuery(
        {
          sort: 'email:asc,createdAt:desc',
          sortField: 'displayName',
          sortOrder: 'asc',
        },
        allowedFields,
      ),
    ).toEqual([
      { field: 'email', order: 'asc' },
      { field: 'createdAt', order: 'desc' },
    ]);
  });
});
