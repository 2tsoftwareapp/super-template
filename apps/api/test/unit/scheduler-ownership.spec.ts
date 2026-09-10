import { MODULE_METADATA } from "@nestjs/common/constants";
import { ScheduleModule } from "@nestjs/schedule";
import type { DynamicModule } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { RuntimeModule } from "../../src/composition/runtime.module";

describe("API scheduler ownership", () => {
  it("does not import the scheduler module", () => {
    const imports = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, RuntimeModule) ??
      []) as readonly (DynamicModule | unknown)[];

    expect(
      imports.some(
        (entry) =>
          entry === ScheduleModule ||
          (entry as DynamicModule | undefined)?.module === ScheduleModule,
      ),
    ).toBe(false);
  });
});
