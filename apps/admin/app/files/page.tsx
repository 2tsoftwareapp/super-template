"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage, sendJson, sessionFetch } from "@lean/next-bff/client";

import { FilesTable, type StoredFile } from "@/components/files/files-table";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { Card, CardContent } from "@/components/ui/card";

interface ListResponse {
  data: StoredFile[];
  meta: { page: number; total: number; totalPages: number };
}

const PAGE_SIZE = 20;

export default function FilesPage() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await sessionFetch(`/api/files?page=${page}&limit=${PAGE_SIZE}`);

    if (!response.ok) {
      setError("Could not load files");
      return;
    }

    const body = (await response.json()) as ListResponse;
    setFiles(body.data);
    setMeta(body.meta);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(file: StoredFile): Promise<void> {
    setError(null);
    const response = await sendJson(`/api/files/${file.id}`, "DELETE");

    if (!response.ok) {
      setError(await errorMessage(response, "Could not delete the file"));
    }

    await load();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title={`Files (${meta.total})`}
        description="Every upload stored by the API. Users upload from the mobile app or POST /files."
      />
      <FormError message={error} />
      <Card>
        <CardContent className="space-y-4">
          <FilesTable files={files} onDelete={(file) => void remove(file)} />
          <Pager page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
        </CardContent>
      </Card>
    </main>
  );
}
