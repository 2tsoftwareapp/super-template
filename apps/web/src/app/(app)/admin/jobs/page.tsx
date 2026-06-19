import { AdminMovedNotice } from "@/components/app/admin-moved";

export default function AdminJobsPage() {
  return (
    <AdminMovedNotice
      title="Jobs moved to the admin app"
      description="Operational job controls now live in the separate Next.js admin app."
    />
  );
}
