import type { Metadata } from "next";

import { JobsView } from "@/features/jobs";

export const metadata: Metadata = {
  title: "Job Queue | Super Admin",
  description: "Monitor and manage background tasks, execution metrics, and workers.",
};

export default function Page() {
  return <JobsView />;
}
