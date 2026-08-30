import { APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";
import { TenantContextService } from "@repo/api-runtime";

import { AccessControlModule } from "./access-control.module";
import { permissions, rolePermissions, roles, userRoles } from "./infrastructure/persistence";
import { accessControlSeeders } from "./seed";
import { TenantContextInterceptor } from "./tenant-context.interceptor";

export const accessControlFeature: FeatureManifest = defineFeature({
  id: "access-control",
  dependsOn: ["users", "organizations", "audit"],
  nestModule: AccessControlModule,
  httpPipeline: {
    interceptors: [
      {
        provide: APP_INTERCEPTOR,
        useFactory: (reflector: Reflector, tenantContextService: TenantContextService) =>
          new TenantContextInterceptor(reflector, tenantContextService),
        inject: [Reflector, TenantContextService],
      },
    ],
  },
  httpPipelineOrder: 30,
  authorization: {
    resources: {
      roles: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"],
        defaultGrants: { ADMIN: ["read", "update"] },
      },
    },
  },
  schema: { roles, permissions, rolePermissions, userRoles },
  seeders: accessControlSeeders,
});
