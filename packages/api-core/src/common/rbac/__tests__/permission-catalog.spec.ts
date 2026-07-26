import { describe, expect, it } from 'vitest';

import {
  allSeedPermissionNames,
  DEFAULT_ROLE_GRANTS,
} from '../default-role-grants.matrix';
import {
  RESOURCE_SCOPE,
  scopeForPermission,
} from '../permission-catalog';

describe('Permission Catalog Completeness', () => {
  it('explicitly catalogs every resource used by default role grants', () => {
    for (const grantSpec of Object.values(DEFAULT_ROLE_GRANTS)) {
      if (grantSpec === '*') {
        continue;
      }

      for (const grant of grantSpec) {
        expect(
          Object.prototype.hasOwnProperty.call(RESOURCE_SCOPE, grant.resource),
        ).toBe(true);
        expect(scopeForPermission(`${grant.resource}.read`)).toBe(
          RESOURCE_SCOPE[grant.resource],
        );
      }
    }
  });

  it('resolves the catalog scope for every seeded permission', () => {
    const seedPermissions = allSeedPermissionNames();
    expect(seedPermissions.length).toBeGreaterThan(0);

    for (const permission of seedPermissions) {
      const resource = permission.split('.', 1)[0];
      expect(resource).toBeDefined();
      expect(
        Object.prototype.hasOwnProperty.call(RESOURCE_SCOPE, resource),
      ).toBe(true);
      expect(scopeForPermission(permission)).toBe(
        RESOURCE_SCOPE[resource as keyof typeof RESOURCE_SCOPE],
      );
    }
  });

  it('maps unknown resources to platform (fail closed)', () => {
    expect(scopeForPermission('unknown.read')).toBe('platform');
    expect(scopeForPermission('random.create')).toBe('platform');
  });

  it('maps known resources to their declared scopes', () => {
    expect(scopeForPermission('users.read')).toBe('organization');
    expect(scopeForPermission('audit.read')).toBe('platform');
  });
});
