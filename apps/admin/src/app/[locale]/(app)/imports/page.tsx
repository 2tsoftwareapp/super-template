import type { Metadata } from "next";

import { ImportsView } from "@/features/imports";

export const metadata: Metadata = {
  title: "Data Imports | Super Admin",
  description: "Monitor, review, and initiate system import jobs.",
};

export default function Page() {
  return <ImportsView />;
}
