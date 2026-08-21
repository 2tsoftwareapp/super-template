import type { Metadata } from "next";

import { FilesView } from "@/features/files";

export const metadata: Metadata = {
  title: "Files & Storage | Super Admin",
  description: "Browse, manage, and verify uploads and media files.",
};

export default function Page() {
  return <FilesView />;
}
