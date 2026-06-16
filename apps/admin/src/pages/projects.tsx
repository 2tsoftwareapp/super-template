import { useQuery } from "@tanstack/react-query";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { webFetch } from "../lib/http";
import type { ListResponse, ProjectRow } from "../lib/types";

export function ProjectsPage() {
  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => webFetch<ListResponse<ProjectRow>>("/api/bff/projects?limit=50"),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Projects
        </Badge>
        <h1 className="text-4xl font-semibold">Project management</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Admin-side project review without mixing it into the client web.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(projects.data?.data ?? []).map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <CardDescription>{project.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {project.description ?? "No description available."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
