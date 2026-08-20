"use client";

import { useJobsController } from "@/features/jobs/controllers/use-jobs-controller";
import { JobsListView } from "@/features/jobs/ui/jobs-list-view";
import { createJobsColumns } from "@/features/jobs/ui/jobs-table-columns";

export function JobsView() {
  const controller = useJobsController({ createColumns: createJobsColumns });
  return <JobsListView {...controller} />;
}
