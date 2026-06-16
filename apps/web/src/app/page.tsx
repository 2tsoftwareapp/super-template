import Link from "next/link";
import { ArrowRight, Lock, Smartphone, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    title: "NestJS API",
    body: "JWT auth, refresh rotation, RBAC, audit logging, Drizzle ORM, and OpenAPI contract generation.",
    icon: Lock,
  },
  {
    title: "Next.js BFF",
    body: "Same-origin route handlers, HttpOnly cookies, CSRF protection, and permission-aware workspace pages.",
    icon: Workflow,
  },
  {
    title: "Flutter client",
    body: "Mobile app scaffolded in-repo with generated API bindings, secure storage, and refresh-ready architecture.",
    icon: Smartphone,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5  md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              Reusable full-stack starter
            </Badge>
            <p className="text-sm text-muted-foreground">
              Auth, permissions, contracts, and a BFF layer packed into one
              production-ready workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline" })}
            >
              Sign in
            </Link>
            <Link href="/dashboard" className={buttonVariants()}>
              Open workspace
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border bg-card ">
            <CardHeader className="space-y-4">
              <Badge className="w-fit">Modular monolith starter</Badge>
              <CardTitle className="text-4xl leading-tight md:text-6xl">
                Production defaults without the dead weight.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                Start with real auth, real permissions, real session management,
                local infra, generated contracts, and a clean path across API,
                web, and mobile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Rotating refresh tokens",
                  "Backend permission enforcement",
                  "Projects CRUD and notifications",
                  "Secure cookie BFF routes",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl">Included flows</CardTitle>
              <CardDescription>
                The app already carries the important product paths.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                <li>Authentication with rotating refresh tokens</li>
                <li>Role and permission enforcement from the backend</li>
                <li>Projects CRUD with notifications and audit events</li>
                <li>Next.js BFF with secure cookie handling</li>
                <li>Flutter app with generated API client output path</li>
              </ul>
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {feature.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}
