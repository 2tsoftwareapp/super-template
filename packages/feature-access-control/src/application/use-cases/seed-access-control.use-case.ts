import type { ComposedAuthorization } from "@repo/api-plugin-kit";
import type { TransactionExecutor } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";
import { AccessProfileUseCase } from "./access-profile.use-case";

interface RoleSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
}

const ROLE_SEED_ENTRIES: RoleSeedEntry[] = [
  { name: "SUPER_ADMIN", description: "Platform owner role", isSystem: true },
  { name: "ADMIN", description: "Administrative role", isSystem: true },
  { name: "USER", description: "Standard user role", isSystem: true },
];

/**
 * Seeds the fixed platform roles plus the COMPOSED authorization catalog.
 * Permission entries are derived at execution time from
 * {@link ComposedAuthorization} — never from import-time module state — so
 * organization-scoped resources are seeded with `scope = "organization"`
 * regardless of module import order (regression: C-002).
 */
@Injectable()
export class SeedAccessControlUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
  ) {}

  async execute(
    authorization: ComposedAuthorization,
    executor?: TransactionExecutor,
  ): Promise<void> {
    await this.accessControlRepository.ensureRoles(ROLE_SEED_ENTRIES, executor);

    const [superAdminEntry, adminEntry, userEntry] = ROLE_SEED_ENTRIES;
    const superAdminRole = superAdminEntry
      ? await this.accessControlRepository.findRoleByName(superAdminEntry.name, null, executor)
      : undefined;
    const adminRole = adminEntry
      ? await this.accessControlRepository.findRoleByName(adminEntry.name, null, executor)
      : undefined;
    const userRole = userEntry
      ? await this.accessControlRepository.findRoleByName(userEntry.name, null, executor)
      : undefined;

    if (!superAdminRole || !adminRole || !userRole) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Role seed state is inconsistent",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Permission entries derive from the composed catalog AT RUN TIME.
    const permissionEntries = Object.entries(authorization.resources).flatMap(([resource, def]) =>
      def.actions.map((action) => ({
        name: `${resource}.${action}`,
        description: `${resource}.${action}`,
        isSystem: true,
        scope: def.scope,
      })),
    );

    const permissions = await this.accessControlRepository.ensurePermissions(
      permissionEntries,
      executor,
    );

    const permissionByName = new Map<string, string>(
      permissions.map((p) => [p.name, p.id] as const),
    );

    const allPermissionIds = permissions.map((p) => p.id);

    const resolveGrant = (role: string): string[] => {
      const names = authorization.grantsByRole[role] ?? [];
      return names.map((name) => {
        const permissionId = permissionByName.get(name);
        if (!permissionId) {
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            `Authorization grant for role "${role}" references unknown permission "${name}"`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        return permissionId;
      });
    };

    await this.accessControlRepository.replaceRolePermissions(
      superAdminRole.id,
      allPermissionIds,
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      adminRole.id,
      resolveGrant("ADMIN"),
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      userRole.id,
      resolveGrant("USER"),
      executor,
    );

    await this.accessProfileUseCase.invalidateUsersForRole(superAdminRole.id, executor);
    await this.accessProfileUseCase.invalidateUsersForRole(adminRole.id, executor);
    await this.accessProfileUseCase.invalidateUsersForRole(userRole.id, executor);
  }
}
