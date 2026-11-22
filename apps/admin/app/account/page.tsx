import { ChangePasswordForm } from "@/components/account/change-password-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader title="Account" description="Settings for the admin you are signed in as." />
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
