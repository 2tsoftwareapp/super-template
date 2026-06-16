import { AdminMovedNotice } from "@/components/app/admin-moved";

export default function AuditLogsPage() {
  return (
    <AdminMovedNotice
      title="Audit logs moved to the admin app"
      description="Operational auditing is now isolated in the separate admin workspace."
    />
  );
}
