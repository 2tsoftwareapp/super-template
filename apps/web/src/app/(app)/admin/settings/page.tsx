import { AdminMovedNotice } from "@/components/app/admin-moved";

export default function AdminSettingsPage() {
  return (
    <AdminMovedNotice
      title="System settings moved to the admin app"
      description="Platform and configuration controls now live in the separate admin workspace."
    />
  );
}
