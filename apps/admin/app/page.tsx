import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  { href: "/users", title: "Users", description: "Create, block and delete accounts." },
  { href: "/jobs", title: "Jobs", description: "Inspect the Postgres queue and enqueue jobs." },
  { href: "/files", title: "Files", description: "Browse, download and delete uploads." },
  { href: "/notifications", title: "Notifications", description: "Read your in-app inbox." },
  { href: "/account", title: "Account", description: "Change your password." },
];

export default async function HomePage() {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader title="Dashboard" description="Operations console for the lean template." />
      <div className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
