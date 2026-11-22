"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sessionFetch } from "@lean/next-bff/client";

import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Me {
  email: string;
  displayName: string;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void sessionFetch("/api/auth/me").then(async (response) => {
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.ok) setMe(((await response.json()) as { data: Me }).data);
    });
  }, [router]);

  async function signOut(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!me) {
    return <main className="mx-auto max-w-3xl p-6 text-muted-foreground">Loading…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm email={me.email} displayName={me.displayName} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
