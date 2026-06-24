import { Suspense } from "react";

import { ProjectsView } from "./projects-view";

export default function Page() {
  return (
    <Suspense>
      <ProjectsView />
    </Suspense>
  );
}
