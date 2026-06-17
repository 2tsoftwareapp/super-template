import { normalizeProjectsSearch } from "@/lib/search-params";

import { ProjectsView } from "./projects-view";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  normalizeProjectsSearch(await searchParams);
  return <ProjectsView />;
}
