"use client";

import { useCallback, useEffect, useState } from "react";

import { FormError } from "@/components/form-error";
import { JobsTable, type Job } from "@/components/jobs/jobs-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminFetch } from "@/lib/admin-fetch";

interface ListResponse {
  data: Job[];
  meta: { total: number };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await adminFetch("/api/jobs?page=1&limit=20");

    if (!response.ok) {
      setError("Could not load jobs");
      return;
    }

    const body = (await response.json()) as ListResponse;
    setJobs(body.data);
    setTotal(body.meta.total);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function enqueue(): Promise<void> {
    setError(null);

    const response = await adminFetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "demo.echo", payload: { at: new Date().toISOString() } }),
    });

    if (!response.ok) {
      setError("Could not enqueue the job");
      return;
    }

    await load();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title={`Jobs (${total})`}
          description="The worker claims PENDING rows with SKIP LOCKED; run it with pnpm --filter @lean/worker run:once."
        />
        <Button onClick={() => void enqueue()}>Enqueue demo job</Button>
      </div>
      <FormError message={error} />
      <Card>
        <CardContent>
          <JobsTable jobs={jobs} />
        </CardContent>
      </Card>
    </main>
  );
}
