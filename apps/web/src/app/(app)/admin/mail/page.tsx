import { AdminMovedNotice } from "@/components/app/admin-moved";

export default function AdminMailPage() {
  return (
    <AdminMovedNotice
      title="Mail logs moved to the admin app"
      description="Message delivery history is now isolated in the separate admin workspace."
    />
  );
}
