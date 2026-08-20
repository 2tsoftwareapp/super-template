"use client";

import { useFilesController } from "../controllers/use-files-controller";
import { FilesListView } from "../ui/files-list-view";
import { createFilesColumns } from "../ui/files-table-columns";

export function FilesView() {
  const controller = useFilesController({ createColumns: createFilesColumns });
  return <FilesListView {...controller} />;
}
