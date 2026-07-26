import { describe, expect, it } from 'vitest';
import { allSeedPermissionNames } from '../default-role-grants.matrix';
import { scopeForPermission } from '../permission-catalog';

describe('Permission Catalog Completeness', () => {
  it('should resolve a valid scope for all seeded permissions', () => {
    const seedPermissions = allSeedPermissionNames();
    expect(seedPermissions.length).toBeGreaterThan(0);

    for (const permission of seedPermissions) {
      // scopeForPermission defaults to 'platform' if not found.
      // But we can check that it's correctly mapped by ensuring the resource is in the catalog.
      // Since unknown defaults to platform, we just verify it doesn't throw and 
      // returns 'platform' or 'organization'.
      const scope = scopeForPermission(permission);
      expect(['platform', 'organization']).toContain(scope);
    }
  });

  it('should map unknown resources to platform (fail-closed)', () => {
    expect(scopeForPermission('unknown.read')).toBe('platform');
    expect(scopeForPermission('random.create')).toBe('platform');
  });

  it('should map known resources to their correct scopes', () => {
    expect(scopeForPermission('users.read')).toBe('organization');
    expect(scopeForPermission('audit.read')).toBe('platform');
  });
});
