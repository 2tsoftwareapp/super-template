#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git" || name === "generated") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs|js|json|md)$/.test(name)) out.push(p);
  }
  return out;
}

const replacements = [
  // Package renames (order matters — more specific first)
  [/@repo\/api-database/g, "@repo/database-runtime"],
  [/@repo\/api-health/g, "@repo/feature-health"],
  [/@repo\/feature-identity\/admin/g, "@/features/_plugin-resources/identity-admin"],
  [/@repo\/feature-identity\/web/g, "@/features/identity-web"],
  [/@repo\/feature-platform\/admin/g, "@/features/_plugin-resources/platform-admin"],
  // Deep identity module imports → feature packages
  [/@repo\/feature-identity\/modules\/access-control/g, "@repo/feature-access-control"],
  [/@repo\/feature-identity\/modules\/auth/g, "@repo/feature-auth"],
  [/@repo\/feature-identity\/modules\/mfa/g, "@repo/feature-mfa"],
  [/@repo\/feature-identity\/modules\/organizations/g, "@repo/feature-organizations"],
  [/@repo\/feature-identity\/modules\/preferences/g, "@repo/feature-user-preferences"],
  [/@repo\/feature-identity\/modules\/sso/g, "@repo/feature-sso"],
  [/@repo\/feature-identity\/modules\/users/g, "@repo/feature-users"],
  [/@repo\/feature-identity/g, "@repo/feature-auth"], // leftover barrel → auth as keystone fallback; fix manually if wrong
  // Deep platform module imports
  [/@repo\/feature-platform\/modules\/activities/g, "@repo/feature-activities"],
  [/@repo\/feature-platform\/modules\/attachments/g, "@repo/feature-upload"],
  [/@repo\/feature-platform\/modules\/audit/g, "@repo/feature-audit"],
  [/@repo\/feature-platform\/modules\/exports/g, "@repo/feature-import-export"],
  [/@repo\/feature-platform\/modules\/files/g, "@repo/feature-upload"],
  [/@repo\/feature-platform\/modules\/imports/g, "@repo/feature-import-export"],
  [/@repo\/feature-platform\/modules\/jobs/g, "@repo/feature-jobs"],
  [/@repo\/feature-platform\/modules\/mail/g, "@repo/feature-mail"],
  [/@repo\/feature-platform\/modules\/notifications/g, "@repo/feature-notifications"],
  [/@repo\/feature-platform\/modules\/settings/g, "@repo/feature-settings"],
  [/@repo\/feature-platform\/modules\/storage/g, "@repo/feature-upload"],
  [/@repo\/feature-platform/g, "@repo/feature-upload"],
  // api-core → api-runtime (broad); domain files may need kernel — second pass later
  [/@repo\/api-core\/config\/app-config\.module/g, "@repo/api-runtime"],
  [/@repo\/api-core\/config\/environment\.service/g, "@repo/api-runtime"],
  [/@repo\/api-core/g, "@repo/api-runtime"],
];

const files = [
  ...walk(join(root, "apps")),
  ...walk(join(root, "packages")),
  ...walk(join(root, "scripts")),
  ...walk(join(root, "docs")),
].filter((f) => !f.includes("/node_modules/") && !f.includes("/.git/"));

let changed = 0;
for (const file of files) {
  // skip lock
  if (file.endsWith("pnpm-lock.yaml")) continue;
  let text = readFileSync(file, "utf8");
  const orig = text;
  for (const [re, to] of replacements) {
    text = text.replace(re, to);
  }
  // schema path fixes inside feature packages
  text = text.replace(
    /from ["']\.\.\/identity\/(users|organizations)["']/g,
    (_m, table) => {
      if (table === "users") return 'from "@repo/feature-users/schema"';
      return 'from "@repo/feature-organizations/schema"';
    },
  );
  text = text.replace(
    /from ["']\.\.\/\.\.\/identity\/(users|organizations)["']/g,
    (_m, table) => {
      if (table === "users") return 'from "@repo/feature-users/schema"';
      return 'from "@repo/feature-organizations/schema"';
    },
  );
  text = text.replace(
    /from ["']\.\.\/shared\/timestamps["']/g,
    'from "@repo/database-runtime"',
  );
  text = text.replace(
    /from ["']\.\.\/\.\.\/shared\/timestamps["']/g,
    'from "@repo/database-runtime"',
  );
  text = text.replace(
    /from ["']\.\/enums["']/g,
    (m, _o, s) => {
      // leave local enums alone if file is in feature-users
      return m;
    },
  );
  if (text !== orig) {
    writeFileSync(file, text);
    changed++;
  }
}
console.log(`Rewrote imports in ${changed} files`);

// Write apps/api composition structure
const compositionDir = join(root, "apps/api/src/composition");
mkdirSync(compositionDir, { recursive: true });

writeFileSync(
  join(compositionDir, "feature-registry.ts"),
  `import type { FeatureManifest } from "@repo/api-plugin-kit";
import { accessControlFeature } from "@repo/feature-access-control";
import { activitiesFeature } from "@repo/feature-activities";
import { auditFeature } from "@repo/feature-audit";
import { authFeature } from "@repo/feature-auth";
import { healthFeature } from "@repo/feature-health";
import { importExportFeature } from "@repo/feature-import-export";
import { jobsFeature } from "@repo/feature-jobs";
import { mailFeature } from "@repo/feature-mail";
import { mfaFeature } from "@repo/feature-mfa";
import { notificationsFeature } from "@repo/feature-notifications";
import { organizationsFeature } from "@repo/feature-organizations";
import { settingsFeature } from "@repo/feature-settings";
import { ssoFeature } from "@repo/feature-sso";
import { uploadFeature } from "@repo/feature-upload";
import { userPreferencesFeature } from "@repo/feature-user-preferences";
import { usersFeature } from "@repo/feature-users";

/**
 * Explicit compile-time feature registry for the API host.
 * Disable a feature by removing it here and from apps/api/package.json.
 */
export const enabledFeatures: readonly FeatureManifest[] = [
  accessControlFeature,
  authFeature,
  organizationsFeature,
  usersFeature,
  mfaFeature,
  ssoFeature,
  userPreferencesFeature,
  jobsFeature,
  mailFeature,
  uploadFeature,
  auditFeature,
  activitiesFeature,
  notificationsFeature,
  settingsFeature,
  importExportFeature,
  healthFeature,
];
`,
);

writeFileSync(
  join(compositionDir, "composed-schema.ts"),
  `import { composeFeatures } from "@repo/api-plugin-kit";

import { enabledFeatures } from "./feature-registry";

const composed = composeFeatures(enabledFeatures);

/** Drizzle schema composed from enabled feature manifests (deterministic order). */
export const composedSchema = composed.schema;

/** Nest modules in dependency order. */
export const featureModules = composed.modules;

/** Ordered manifests after dependency validation. */
export const orderedFeatures = composed.features;
`,
);

writeFileSync(
  join(compositionDir, "runtime.module.ts"),
  `import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import {
  EnvironmentService,
  LoggingModule,
  RedisThrottlerStorage,
} from "@repo/api-runtime";
import { AppConfigModule } from "@repo/api-runtime";
import { DatabaseModule } from "@repo/database-runtime";

import { composedSchema, featureModules } from "./composed-schema";

/**
 * Technical runtime + composed feature modules. No business logic lives here.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ThrottlerModule.forRootAsync({
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => ({
        skipIf: () => environmentService.isTest,
        throttlers: [
          {
            ttl: environmentService.values.THROTTLER_TTL_MS,
            limit: environmentService.values.THROTTLER_LIMIT,
          },
        ],
        storage: new RedisThrottlerStorage(environmentService),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot({ schema: composedSchema }),
    ...featureModules,
  ],
})
export class RuntimeModule {}
`,
);

writeFileSync(
  join(compositionDir, "global-pipeline.ts"),
  `import type { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { RequestMethod } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import {
  ACCESS_TOKEN_AUTHENTICATOR,
  type AccessTokenAuthenticator,
  APP_LOGGER,
  AppExceptionFilter,
  type AppLogger,
  AuthorizeGuard,
  EnvironmentService,
  ErrorReporterService,
  RequestContextMiddleware,
  RequestLoggerMiddleware,
  ResponseEnvelopeInterceptor,
  TenantContextService,
} from "@repo/api-runtime";

import { AuthGuard } from "../shell/auth.guard";
import { MaintenanceModeGuard } from "../shell/maintenance-mode.guard";
import { TenantContextInterceptor } from "../shell/tenant-context.interceptor";

/** Global HTTP pipeline providers for the API host. */
export const globalPipelineProviders = [
  RequestLoggerMiddleware,
  {
    provide: APP_FILTER,
    useFactory: (
      environmentService: EnvironmentService,
      logger: AppLogger,
      errorReporter: ErrorReporterService,
    ) => new AppExceptionFilter(environmentService, logger, errorReporter),
    inject: [EnvironmentService, APP_LOGGER, ErrorReporterService],
  },
  { provide: APP_GUARD, useClass: MaintenanceModeGuard },
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  {
    provide: APP_GUARD,
    useFactory: (reflector: Reflector, accessTokenAuthenticator: AccessTokenAuthenticator) =>
      new AuthGuard(reflector, accessTokenAuthenticator),
    inject: [Reflector, ACCESS_TOKEN_AUTHENTICATOR],
  },
  {
    provide: APP_GUARD,
    useFactory: (reflector: Reflector) => new AuthorizeGuard(reflector),
    inject: [Reflector],
  },
  {
    provide: APP_INTERCEPTOR,
    useFactory: (reflector: Reflector) => new ResponseEnvelopeInterceptor(reflector),
    inject: [Reflector],
  },
  {
    provide: APP_INTERCEPTOR,
    useFactory: (reflector: Reflector, tenantContextService: TenantContextService) =>
      new TenantContextInterceptor(reflector, tenantContextService),
    inject: [Reflector, TenantContextService],
  },
  TenantContextService,
];

export function configureGlobalMiddleware(consumer: MiddlewareConsumer): void {
  consumer
    .apply(RequestContextMiddleware, RequestLoggerMiddleware)
    .forRoutes({ path: "*path", method: RequestMethod.ALL });
}

export type { NestModule };
`,
);

writeFileSync(
  join(root, "apps/api/src/app.module.ts"),
  `import { Module, type NestModule, type MiddlewareConsumer } from "@nestjs/common";

import {
  configureGlobalMiddleware,
  globalPipelineProviders,
} from "./composition/global-pipeline";
import { RuntimeModule } from "./composition/runtime.module";

@Module({
  imports: [RuntimeModule],
  providers: [...globalPipelineProviders],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    configureGlobalMiddleware(consumer);
  }
}
`,
);

writeFileSync(
  join(root, "apps/api/src/features.ts"),
  `/** @deprecated Import from ./composition/* instead. Kept as a thin re-export for tests during migration. */
export { enabledFeatures as featureManifests } from "./composition/feature-registry";
export { composedSchema, featureModules, orderedFeatures } from "./composition/composed-schema";
`,
);

console.log("Wrote apps/api composition root");
