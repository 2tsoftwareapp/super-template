import type { components } from "@repo/api-contract";

import { describe, expect, it } from "vitest";

import { EVENT_STYLES, jobStatusProps, STATUS_OPTIONS } from "../jobs.constants";

type ApiJobStatus = NonNullable<components["schemas"]["JobDto"]["status"]>;

type ApiJobEventType = components["schemas"]["JobEventDto"]["type"];

/**
 * Runtime mirror of the API status enum. The generated contract only ships
 * types, so this list is the value side of the pin: `satisfies` rejects a value
 * the API does not accept, and `assertEveryApiStatusIsListed` rejects a list
 * missing a value the API does accept. Both make the file fail to compile the
 * moment `JobDto["status"]` changes — the signal to update `STATUS_OPTIONS`.
 */
const API_JOB_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "BLOCKED",
] as const satisfies readonly ApiJobStatus[];

type UnlistedApiStatus = Exclude<ApiJobStatus, (typeof API_JOB_STATUSES)[number]>;

const assertEveryApiStatusIsListed = (): UnlistedApiStatus extends never ? true : never => true;

/** Same pin, for the event-type vocabulary that `EVENT_STYLES` labels. */
const API_JOB_EVENT_TYPES = [
  "claimed",
  "completed",
  "failed",
  "processing_error",
  "retry_scheduled",
  "cancelled",
  "no_handler",
  "dependency_failed",
] as const satisfies readonly ApiJobEventType[];

type UnlistedApiEventType = Exclude<ApiJobEventType, (typeof API_JOB_EVENT_TYPES)[number]>;

const assertEveryApiEventTypeIsStyled = (): UnlistedApiEventType extends never ? true : never =>
  true;

const adminStatusValues = STATUS_OPTIONS.map((option) => option.value).filter(
  (value) => value !== "",
);

describe("jobs.status constants", () => {
  it("mirrors the API status enum (compile-time pin satisfied)", () => {
    expect(assertEveryApiStatusIsListed()).toBe(true);
  });

  it("offers every status the API accepts as a filter, and nothing else", () => {
    expect([...adminStatusValues].sort()).toEqual([...API_JOB_STATUSES].sort());
  });

  it("keeps the empty option first so the filter can be cleared", () => {
    expect(STATUS_OPTIONS[0]).toEqual({ value: "", label: "All statuses" });
  });

  it("gives every filterable status a human-readable label", () => {
    for (const option of STATUS_OPTIONS) {
      expect(option.label.trim()).not.toBe("");
    }
    expect(STATUS_OPTIONS.find((option) => option.value === "BLOCKED")?.label).toBe("Blocked");
  });

  it("styles a BLOCKED badge with the failure tone, distinct from CANCELLED", () => {
    expect(jobStatusProps("BLOCKED")).toEqual({
      variant: "outline",
      className: "text-destructive border-destructive/40",
    });
    expect(jobStatusProps("BLOCKED")).not.toEqual(jobStatusProps("CANCELLED"));
  });

  it("keeps the dependency failure event tone aligned with the BLOCKED badge", () => {
    const dependencyFailedTone = EVENT_STYLES.dependency_failed?.text ?? "";
    expect(dependencyFailedTone).not.toBe("");
    expect(jobStatusProps("BLOCKED").className ?? "").toContain(dependencyFailedTone);
  });

  it("styles every event type the API can emit, and nothing else", () => {
    expect(assertEveryApiEventTypeIsStyled()).toBe(true);
    expect(Object.keys(EVENT_STYLES).sort()).toEqual([...API_JOB_EVENT_TYPES].sort());
  });
});
