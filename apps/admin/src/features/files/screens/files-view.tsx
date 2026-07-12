"use client";

import { useFilesController } from "../controllers/use-files-controller";
import { FilesListView } from "../ui/files-list-view";

export function FilesView() {
  const controller = useFilesController();
  return <FilesListView {...controller} />;
}
