import type { DynamicModule, Provider } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants";
import { ScheduleModule } from "@nestjs/schedule";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { composedSchema, featureModules, orderedFeatures } from "@repo/app-composition";
import { DATABASE_SCHEMA, DatabaseModule } from "@repo/database-runtime";
import { WorkerModule } from "../src/worker.module";

type ModuleImport = DynamicModule | object;

function moduleImports(moduleClass: object): readonly ModuleImport[] {
  return (Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass) ?? []) as readonly ModuleImport[];
}

function hasModule(imports: readonly ModuleImport[], moduleClass: object): boolean {
  return imports.some(
    (entry) => entry === moduleClass || (entry as DynamicModule | undefined)?.module === moduleClass,
  );
}

function databaseImport(imports: readonly ModuleImport[]): DynamicModule {
  const database = imports.find(
    (entry) => (entry as DynamicModule | undefined)?.module === DatabaseModule,
  );
  if (!database || !("providers" in database)) {
    throw new Error("Expected a configured DatabaseModule import");
  }
  return database as DynamicModule;
}

function schemaProvider(database: DynamicModule): Provider | undefined {
  return database.providers?.find(
    (provider) =>
      typeof provider === "object" && provider !== null && "provide" in provider && provider.provide === DATABASE_SCHEMA,
  );
}

describe("worker host ownership", () => {
  it("uses the shared ordered feature graph and composed schema", () => {
    const workerImports = moduleImports(WorkerModule);

    expect(orderedFeatures.length).toBe(featureModules.length);
    expect(featureModules.every((featureModule) => workerImports.includes(featureModule))).toBe(true);
    expect(schemaProvider(databaseImport(workerImports))).toMatchObject({ useValue: composedSchema });
  });

  it("registers the scheduler in the worker host", () => {
    expect(hasModule(moduleImports(WorkerModule), ScheduleModule)).toBe(true);
  });

  it("uses application-context startup and has no HTTP listener", () => {
    const source = readFileSync(resolve(__dirname, "../src/main.ts"), "utf8");

    expect(source).toContain("NestFactory.createApplicationContext");
    expect(source).toContain("app?.close()");
    expect(source).not.toMatch(/\.listen\s*\(/);
    expect(source).toContain('process.once("SIGINT"');
    expect(source).toContain('process.once("SIGTERM"');
  });
});
