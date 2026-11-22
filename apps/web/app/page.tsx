import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const adminUrl = process.env.ADMIN_URL ?? "http://localhost:3002";

const SURFACES = [
  {
    title: "API",
    description: "Auth with refresh rotation, users, files, jobs, mail, notifications.",
  },
  { title: "Worker", description: "Claims the jobs table with SKIP LOCKED, retries with backoff." },
  { title: "Admin", description: "Users, jobs and notifications over a cookie BFF." },
  { title: "Mobile", description: "Flutter login + home against the same API." },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-24">
      <section className="space-y-4">
        <Badge variant="secondary">NestJS · Next.js · Flutter · Postgres</Badge>
        <h1 className="text-4xl font-bold tracking-tight">Lean full-stack template</h1>
        <p className="text-lg text-muted-foreground">
          Four surfaces, one API: this landing page, an operations console, a Flutter app and the
          NestJS backend. Postgres for data and the job queue — no Redis, no plugin system.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <a href={`${adminUrl}/login`}>Sign in to the admin console</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com/2tsoftwareapp/super-template/tree/main">Source</a>
          </Button>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What is inside</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SURFACES.map((surface) => (
            <Card key={surface.title}>
              <CardHeader>
                <CardTitle>{surface.title}</CardTitle>
                <CardDescription>{surface.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
