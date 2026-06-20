import { describe, expect, it } from 'vitest';

import {
  formatSortParam,
  parseSortParam,
  sortCriteriaEqual,
  sortsFromQuery,
} from '../index';

const allowedFields = ['createdAt', 'displayName', 'email', 'status'] as const;
const fallback = [{ field: 'createdAt' as const, order: 'desc' as const }];

describe('multi-sort (canonical implementation)', () => {
  it('formats sort criteria into a query param', () => {
    expect(
      formatSortParam([
        { field: 'status', order: 'asc' },
        { field: 'createdAt', order: 'desc' },
      ]),
    ).toBe('status:asc,createdAt:desc');
  });

  it('parses multiple sort rules in order', () => {
    expect(
      parseSortParam('status:asc,createdAt:desc', allowedFields, fallback),
    ).toEqual([
      { field: 'status', order: 'asc' },
      { field: 'createdAt', order: 'desc' },
    ]);
  });

  it('ignores invalid fields, invalid orders, and duplicate rules', () => {
    expect(
      parseSortParam(
        'status:asc,invalid:desc,status:desc,email:sideways,email:asc',
        allowedFields,
        fallback,
      ),
    ).toEqual([
      { field: 'status', order: 'asc' },
      { field: 'email', order: 'asc' },
    ]);
  });

  it('defaults a rule with no explicit order to ascending', () => {
    expect(parseSortParam('email', allowedFields, fallback)).toEqual([
      { field: 'email', order: 'asc' },
    ]);
  });

  it('falls back when the sort param is empty or fully invalid', () => {
    expect(parseSortParam('', allowedFields, fallback)).toEqual(fallback);
    expect(parseSortParam('invalid:asc', allowedFields, fallback)).toEqual(
      fallback,
    );
  });

  it('prefers the sort param over legacy sortField/sortOrder', () => {
    expect(
      sortsFromQuery(
        { sort: 'email:asc', sortField: 'displayName', sortOrder: 'desc' },
        allowedFields,
      ),
    ).toEqual([{ field: 'email', order: 'asc' }]);
  });

  it('uses legacy sortField/sortOrder when no sort param is present', () => {
    expect(
      sortsFromQuery(
        { sort: undefined, sortField: 'displayName', sortOrder: 'desc' },
        allowedFields,
      ),
    ).toEqual([{ field: 'displayName', order: 'desc' }]);
  });

  it('compares sort criteria for structural equality', () => {
    const a = [{ field: 'email' as const, order: 'asc' as const }];
    const b = [{ field: 'email' as const, order: 'asc' as const }];
    const c = [{ field: 'email' as const, order: 'desc' as const }];
    expect(sortCriteriaEqual(a, b)).toBe(true);
    expect(sortCriteriaEqual(a, c)).toBe(false);
  });
});
