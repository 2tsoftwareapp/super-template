import { describe, expect, it } from "vitest";

import {
  buildProjectCreatePath,
  buildProjectDetailPath,
  buildProjectReturnTo,
  buildProjectsListPath,
  normalizeBffListPath,
  normalizeProjectReturnTo,
} from "./search-params";

describe("search param helpers", () => {
  it("builds canonical project list paths without default noise", () => {
    expect(buildProjectsListPath()).toBe("/api/bff/projects");
    expect(
      buildProjectsListPath({
        search: "starter",
        status: "ACTIVE",
      }),
    ).toBe("/api/bff/projects?search=starter&status=ACTIVE");
  });

  it("preserves project list context in detail and create routes", () => {
    const returnTo = buildProjectReturnTo({
      page: 2,
      status: "ACTIVE",
      search: "nuqs",
    });

    expect(buildProjectDetailPath("project-1", returnTo)).toBe(
      "/projects/project-1?returnTo=%2Fprojects%3Fpage%3D2%26search%3Dnuqs%26status%3DACTIVE",
    );
    expect(buildProjectCreatePath(returnTo)).toBe(
      "/projects/new?returnTo=%2Fprojects%3Fpage%3D2%26search%3Dnuqs%26status%3DACTIVE",
    );
  });

  it("rejects unsafe returnTo values and strips unknown proxy query keys", () => {
    expect(normalizeProjectReturnTo("https://evil.example")).toBe("/projects");
    expect(normalizeProjectReturnTo("/users")).toBe("/projects");
    expect(
      normalizeBffListPath(
        "projects",
        new URLSearchParams(
          "page=3&limit=10&sortField=name&status=ACTIVE&unknown=1",
        ),
      ),
    ).toBe("projects?page=3&limit=10&status=ACTIVE&sortField=name");
  });
});
