import {
  CheckCircle2,
  Code2,
  Github,
  LogIn,
  Monitor,
  Shield,
  Smartphone,
  UserPlus,
  Zap,
} from "lucide-react";

import { HomeAuthActions } from "@/components/app/home-auth-actions";
import { ScrollToTop } from "@/components/app/scroll-to-top";
import { ArchDiagram } from "@/components/arch-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Code2,
    label: "API",
    title: "Contract-first API",
    description:
      "OpenAPI schema auto-generated from NestJS decorators. TypeScript and Dart clients regenerate on every change — no manual sync.",
    items: [
      "@nestjs/swagger decorators",
      "openapi-typescript client",
      "Dart codegen for Flutter",
    ],
  },
  {
    icon: Shield,
    label: "Auth",
    title: "Multi-tenant auth",
    description:
      "JWT access + refresh tokens in secure HttpOnly cookies. Workspace isolation, CSRF protection, and role-based access built in.",
    items: [
      "Argon2 password hashing",
      "Refresh token rotation",
      "CSRF protection",
    ],
  },
  {
    icon: Monitor,
    label: "Admin",
    title: "Separate admin app",
    description:
      "A dedicated Next.js admin workspace that reuses the shared web-core layer while keeping operational tooling isolated from the user-facing product.",
    items: [
      "User & role management",
      "Jobs, mail, imports",
      "Audit logs & notifications",
    ],
  },
  {
    icon: Smartphone,
    label: "Mobile",
    title: "Flutter mobile",
    description:
      "Production-oriented Flutter starter with an auto-generated API client from the OpenAPI schema and FCM push support.",
    items: [
      "Riverpod state management",
      "go_router navigation",
      "FCM push notifications",
    ],
  },
];

const stackLayers = [
  {
    label: "Web",
    packages: [
      {
        name: "Next.js",
        version: "16",
        description:
          "App Router · same-origin BFF · product-facing routing and middleware",
      },
      {
        name: "shadcn/ui",
        version: "4.x",
        description: "Unstyled component system built on Base UI primitives",
      },
      {
        name: "TanStack Query",
        version: "5.x",
        description: "Server state synchronization, mutations, and caching",
      },
      {
        name: "Tailwind CSS",
        version: "4.x",
        description: "Utility-first styling with OKLCH perceptual color tokens",
      },
    ],
  },
  {
    label: "Shared",
    packages: [
      {
        name: "@repo/web-core",
        version: "workspace:*",
        description:
          "Shared auth, session, HTTP, query, and utility logic used by web and admin",
      },
    ],
  },
  {
    label: "API",
    packages: [
      {
        name: "NestJS",
        version: "11",
        description: "Modular Node.js framework with dependency injection",
      },
      {
        name: "Drizzle ORM",
        version: "0.45",
        description: "Type-safe SQL with zero runtime overhead — no magic",
      },
      {
        name: "PostgreSQL",
        version: "18",
        description:
          "Primary relational store with multi-tenant workspace isolation",
      },
    ],
  },
  {
    label: "Admin",
    packages: [
      {
        name: "Next.js",
        version: "16",
        description: "App Router · same-origin BFF · admin-only routes",
      },
      {
        name: "TanStack Table",
        version: "8.x",
        description:
          "Headless table with sorting, filtering, and pagination hooks",
      },
    ],
  },
  {
    label: "Mobile",
    packages: [
      {
        name: "Flutter",
        version: "3.x",
        description: "Cross-platform iOS and Android from a single codebase",
      },
      {
        name: "Riverpod",
        version: "2.x",
        description: "Compile-safe reactive state management for Flutter",
      },
    ],
  },
  {
    label: "Tooling",
    packages: [
      {
        name: "Turborepo",
        version: "2.x",
        description: "Monorepo task orchestration with remote caching",
      },
      {
        name: "pnpm",
        version: "11",
        description: "Content-addressable, disk-efficient package manager",
      },
      {
        name: "Vitest",
        version: "4.x",
        description: "Vite-native test runner · compatible with Jest APIs",
      },
      {
        name: "Playwright",
        version: "1.61",
        description:
          "End-to-end browser testing across Chromium, Firefox, WebKit",
      },
    ],
  },
];

const steps = [
  {
    step: "01",
    title: "Clone the repo",
    description:
      "One git clone to get the full monorepo — web, API, admin, and Flutter mobile.",
    code: "git clone https://github.com/truongnat/super-template",
  },
  {
    step: "02",
    title: "Bootstrap",
    description:
      "Installs deps, starts Postgres, migrates, seeds demo accounts, and generates all API contracts.",
    code: "make bootstrap",
  },
  {
    step: "03",
    title: "Start building",
    description:
      "All apps start in parallel. Replace the placeholder content with your product.",
    code: "make dev",
  },
];

const highlights = [
  "Contract-driven API",
  "Seeded admin account",
  "One-command bootstrap",
  "Full CI pipeline",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-foreground">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Super Template
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#architecture"
              className="transition-colors hover:text-foreground"
            >
              Architecture
            </a>
            <a
              href="#stack"
              className="transition-colors hover:text-foreground"
            >
              Stack
            </a>
            <a
              href="#get-started"
              className="transition-colors hover:text-foreground"
            >
              Get started
            </a>
          </nav>
          <div className="flex items-center justify-end gap-2">
            <HomeAuthActions />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/4 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 md:px-6 md:py-40">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 text-xs">
              Production-ready · pnpm monorepo · MIT licensed
            </Badge>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
              Ship your product.{" "}
              <span className="text-muted-foreground">
                Not your boilerplate.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              A complete monorepo with Next.js web and admin apps, NestJS,
              Flutter, and shared @repo/web-core logic — wired together with a
              contract-driven API, seeded auth, and production tooling from day
              one.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={
                  <a
                    href="https://github.com/truongnat/super-template"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Github className="size-4" />
                View on GitHub
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {highlights.map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              What&apos;s inside
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Everything connected, nothing missing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Four apps sharing one database schema and one API contract. Change
              the schema, regenerate — all clients update automatically.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted transition-colors group-hover:bg-muted/70">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="mb-0.5 text-xs uppercase tracking-widest text-muted-foreground">
                          {feat.label}
                        </p>
                        <h3 className="font-semibold">{feat.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {feat.description}
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {feat.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section id="architecture" className="border-b border-border py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              Architecture
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Three surfaces, one backend
            </h2>
            <p className="mt-4 text-muted-foreground">
              The NestJS API serves all three frontends from a single Postgres
              database. Web and admin traffic flow through Next.js BFFs that
              share @repo/web-core, while Flutter talks directly to the API.
            </p>
          </div>
          <ArchDiagram />
        </div>
      </section>

      {/* ── Stack ── */}
      <section id="stack" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {/* Header — left-aligned, editorial */}
          <div className="mb-16 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tech stack
              </p>
              <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Every dependency chosen
                <br className="hidden lg:block" /> for production, not demos.
              </h2>
            </div>
            <p className="max-w-xs shrink-0 text-sm leading-6 text-muted-foreground lg:text-right">
              {stackLayers.reduce((n, l) => n + l.packages.length, 0)} packages
              across {stackLayers.length} layers. Every version pinned. Every
              choice documented.
            </p>
          </div>

          {/* Manifest */}
          <div>
            {stackLayers.map((layer) => (
              <div key={layer.label}>
                {/* Layer rule */}
                <div className="flex items-center gap-5 pb-1 pt-6">
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground/50">
                    {layer.label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Package rows */}
                {layer.packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="grid grid-cols-[1fr] gap-1 border-b border-border/40 py-3.5 last:border-0 sm:grid-cols-[160px_56px_1fr] sm:items-baseline sm:gap-6"
                  >
                    <span className="font-semibold text-foreground">
                      {pkg.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground/60 sm:text-center">
                      {pkg.version}
                    </span>
                    <span className="text-sm leading-6 text-muted-foreground">
                      {pkg.description}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Get Started ── */}
      <section id="get-started" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              Get started
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Running in under 5 minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              Docker, pnpm, and the Flutter SDK are all you need.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="mb-3 font-mono text-4xl font-bold text-muted-foreground/20">
                  {step.step}
                </p>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {step.description}
                </p>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <code className="font-mono text-xs">
                    <span className="text-muted-foreground">$ </span>
                    {step.code}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Auth CTA ── */}
      <section className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <Badge variant="outline">Authentication</Badge>
              <h2 className="text-4xl font-bold tracking-tight">
                Ready-to-use auth flows
              </h2>
              <p className="text-muted-foreground">
                Every common authentication pattern ships out of the box — JWT
                session management, multi-factor, social login, and secure
                password recovery.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Email + password with Argon2 hashing",
                  "GitHub, Google & Apple SSO (OAuth2 / OIDC)",
                  "TOTP two-factor authentication",
                  "Secure refresh token rotation",
                  "Password reset via email",
                  "Email verification flow",
                  "Session management & revocation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/login",
                  label: "Sign in",
                  description: "Email + password or social login",
                  icon: LogIn,
                },
                {
                  href: "/register",
                  label: "Create account",
                  description: "Register with email and password",
                  icon: UserPlus,
                },
                {
                  href: "/forgot-password",
                  label: "Forgot password",
                  description: "Send a password reset email",
                  icon: Shield,
                },
                {
                  href: "/verify-email",
                  label: "Verify email",
                  description: "Confirm your email address",
                  icon: CheckCircle2,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted transition-colors group-hover:bg-muted/70">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />

      {/* ── Footer ── */}
      <footer className="py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex size-6 items-center justify-center rounded-md bg-foreground">
                <Zap className="size-3 text-background" />
              </div>
              <span className="text-sm font-semibold">Super Template</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="/login" className="hover:text-foreground">Sign in</a>
              <a href="/register" className="hover:text-foreground">Register</a>
              <a href="/forgot-password" className="hover:text-foreground">Forgot password</a>
              <a
                href="https://github.com/truongnat/super-template"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                GitHub
              </a>
            </nav>
            <p className="text-center text-sm text-muted-foreground">
              MIT licensed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
