"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin-fetch";

interface Job {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: string;
}

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
    <main style={{ maxWidth: 860, margin: "6vh auto", fontFamily: "system-ui", padding: 24 }}>
      <h1 style={{ fontSize: 26 }}>Jobs ({total})</h1>
      <p style={{ color: "#666" }}>
        The worker claims PENDING rows with SKIP LOCKED; run it with{" "}
        <code>pnpm --filter @lean/worker run:once</code>.
      </p>

      <button
        type="button"
        onClick={() => void enqueue()}
        style={{ padding: "8px 14px", marginBottom: 16 }}
      >
        Enqueue demo job
      </button>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Type</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Last error</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{job.type}</td>
              <td>{job.status}</td>
              <td>
                {job.attempts}/{job.maxAttempts}
              </td>
              <td>{job.lastError ?? "—"}</td>
              <td>{new Date(job.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
