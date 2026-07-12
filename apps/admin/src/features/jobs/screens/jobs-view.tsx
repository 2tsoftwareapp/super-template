"use client";

import { useJobsController } from "@/features/jobs/controllers/use-jobs-controller";
import { JobsListView } from "@/features/jobs/ui/jobs-list-view";

export function JobsView() {
  const controller = useJobsController();
  return <JobsListView {...controller} />;
}
