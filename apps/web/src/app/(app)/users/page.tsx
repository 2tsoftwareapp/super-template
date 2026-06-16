import { AdminMovedNotice } from "@/components/app/admin-moved";

export default function UsersPage() {
  return (
    <AdminMovedNotice
      title="Users moved to the admin app"
      description="User and role management now live in the separate admin workspace."
    />
  );
}
