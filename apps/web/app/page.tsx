import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const adminUrl = process.env.ADMIN_URL ?? "http://localhost:3002";

const SURFACES = [
  {
    title: "API",
    description:
      "Sign-up, password reset, refresh rotation, users, files, jobs, mail, notifications.",
  },
  { title: "Worker", description: "Claims the jobs table with SKIP LOCKED, retries with backoff." },
  { title: "Web", description: "This site: sign-up, sign-in, password reset and an account page." },
  { title: "Admin", description: "Users, files, jobs and notifications over a cookie BFF." },
  { title: "Mobile", description: "Flutter app: sign-in, notifications and file uploads." },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-6 py-24">
      <section className="space-y-4">
        <Badge variant="secondary">NestJS · Next.js · Flutter · Postgres</Badge>
        <h1 className="text-4xl font-bold tracking-tight">Lean full-stack template</h1>
        <p className="text-lg text-muted-foreground">
          Four surfaces, one API: this landing page, an operations console, a Flutter app and the
          NestJS backend. Postgres for data and the job queue — no Redis, no plugin system.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <a href="/register">Create an account</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`${adminUrl}/login`}>Admin console</a>
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
