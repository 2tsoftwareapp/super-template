import Link from "next/link";
import { ArrowRight, Lock, Smartphone, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),transparent_26%),linear-gradient(180deg,#f4f1ea_0%,#e7dfd4_60%,#dfd6ca_100%)] px-6 py-8 text-neutral-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),transparent_22%),linear-gradient(180deg,#111111_0%,#171717_48%,#090909_100%)] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Badge>Reusable Full-Stack Starter</Badge>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/dashboard">
              <Button>
                Open workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-20 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-neutral-500">
              Modular monolith starter
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
              Production defaults without the dead weight.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
              Start with real auth, real permissions, real session management,
              local infra, generated contracts, and a clean path across API,
              web, and mobile.
            </p>
          </div>
          <Card className="bg-neutral-950 text-white dark:bg-white/6">
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">
              Included flows
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-white/86">
              <li>Authentication with rotating refresh tokens</li>
              <li>Role and permission enforcement from the backend</li>
              <li>Projects CRUD with notifications and audit events</li>
              <li>Next.js BFF with secure cookie handling</li>
              <li>Flutter app with generated API client output path</li>
            </ul>
          </Card>
        </div>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <Icon className="h-6 w-6 text-amber-500" />
                <h2 className="mt-4 text-xl font-semibold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                  {feature.body}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
