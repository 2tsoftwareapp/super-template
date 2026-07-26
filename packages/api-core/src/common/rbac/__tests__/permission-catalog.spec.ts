import { describe, expect, it } from 'vitest';
import { allSeedPermissionNames } from '../default-role-grants.matrix';
import { scopeForPermission, RESOURCE_SCOPE } from '../permission-catalog';

describe('Permission Catalog Completeness', () => {
  it('should resolve a valid scope for all seeded permissions without fallback', () => {
    const seedPermissions = allSeedPermissionNames();
    expect(seedPermissions.length).toBeGreaterThan(0);

    for (const permission of seedPermissions) {
      const resource = permission.split('.')[0] as keyof typeof RESOURCE_SCOPE;
      const scope = RESOURCE_SCOPE[resource];
      
      expect(scope, `Resource '${resource}' (from permission '${permission}') is missing from RESOURCE_SCOPE`).toBeDefined();
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
