import { describe, expect, it } from 'vitest';

import { ACTION, ALL_ACTIONS, hasPermission, perm } from '../permission.helpers';

describe('permission helpers', () => {
  it('formats a resource.action permission string', () => {
    expect(perm('projects', ACTION.READ)).toBe('projects.read');
    expect(perm('users', ACTION.DELETE)).toBe('users.delete');
  });

  it('exposes all four CRUD actions', () => {
    expect(ALL_ACTIONS).toEqual(['read', 'create', 'update', 'delete']);
  });

  it('detects a granted permission', () => {
    const granted = ['projects.read', 'projects.create'];
    expect(hasPermission(granted, 'projects', ACTION.READ)).toBe(true);
  });

  it('returns false when the permission is missing', () => {
    expect(hasPermission(['projects.read'], 'projects', ACTION.DELETE)).toBe(
      false,
    );
    expect(hasPermission([], 'users', ACTION.READ)).toBe(false);
  });
});
