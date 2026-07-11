import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Separator } from "@repo/web-core/components/separator";
import {
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Layers,
  LayoutDashboard,
  Monitor,
  Palette,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";

import { ScrollToTop } from "@/components/app/scroll-to-top";
import { ArchDiagram } from "@/components/arch-diagram";

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";
const API_DOCS_URL =
  process.env.NEXT_PUBLIC_API_DOCS_URL ??
  "http://localhost:3001/api/docs";

const surfaces = [
  {
    label: "Web",
    title: "SEO landing",
    description: "Public marketing site — lightweight, indexable, no auth surface.",
    href: "/",
    external: false,
  },
  {
    label: "Admin",
    title: "Primary app + auth BFF",
    description: "Operations dashboard with login, SSO, MFA, and same-origin session.",
    href: ADMIN_URL,
    external: true,
  },
  {
    label: "API",
    title: "NestJS backend",
    description: "REST API with OpenAPI docs and generated clients.",
    href: API_DOCS_URL,
    external: true,
  },
  {
    label: "Mobile",
    title: "Flutter client",
    description: "iOS & Android app with design system and UI Kit gallery.",
    href: "https://github.com/truongnat/super-template#quick-start",
    external: true,
  },
];

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
      "GitHub, Google & Apple SSO",
      "TOTP MFA + session revocation",
    ],
  },
  {
    icon: Layers,
    label: "Environments",
    title: "Dev · staging · prod",
    description:
      "Shared @repo/env-loader layers .env files across API, web, and admin. Flutter reads dart-define JSON per environment.",
    items: [
      "Committed .env.development defaults",
      "Production guard rails at API boot",
      "make dev-mobile-staging / prod",
    ],
  },
  {
    icon: Monitor,
    label: "Admin",
    title: "Primary app + auth BFF",
    description:
      "The main product surface — operational tooling and all authentication flows via a same-origin Next.js BFF.",
    items: [
      "Login, SSO, MFA & session management",
      "User & role management",
      "Jobs, mail, imports/exports",
    ],
  },
  {
    icon: Smartphone,
    label: "Mobile",
    title: "Flutter + design system",
    description:
      "Material 3 tokens, 20+ shared widgets, and an in-app UI Kit tab for visual QA. Auto-generated API client from OpenAPI.",
    items: [
      "Riverpod + go_router",
      "Design tokens & UI Kit gallery",
      "FCM push (optional)",
    ],
  },
  {
    icon: Palette,
    label: "Web",
    title: "SEO landing only",
    description:
      "Minimal public marketing page — fast, indexable, and free of auth routes. Sign-in and product flows live in Admin.",
    items: [
      "Server-rendered marketing content",
      "shadcn/ui + Tailwind CSS 4",
      "Light Green theme + optional dark mode",
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
          "App Router · SEO landing · lightweight public marketing surface",
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
          "Shared session, HTTP, query, and utility logic — auth BFF lives in admin",
      },
      {
        name: "@repo/env-loader",
        version: "workspace:*",
        description:
          "Layered .env loading for development, staging, and production",
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
        description:
          "App Router · same-origin auth BFF · primary product surface",
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
      "One git clone to get the full monorepo — API, web, admin, and Flutter mobile.",
    code: "git clone https://github.com/truongnat/super-template",
  },
  {
    step: "02",
    title: "Bootstrap",
    description:
      "Installs deps, starts Postgres, migrates, seeds demo accounts, and generates all API contracts. Uses .env.development by default.",
    code: "make bootstrap",
  },
  {
    step: "03",
    title: "Start building",
    description:
      "API, web, and admin start together. Run Flutter separately with make dev-mobile.",
    code: "make dev",
  },
];

const highlights = [
  "Four-app monorepo",
  "Dev / staging / prod envs",
  "Mobile design system",
  "Full CI via make verify",
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 flex min-h-14 shrink-0 items-center border-b border-border bg-card">
        <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <Zap className="size-4 text-background" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold tracking-tight">
                Super Template
              </span>
              <p className="truncate text-[11px] text-muted-foreground">
                Full-stack monorepo starter
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a
              href="#surfaces"
              className="transition-colors hover:text-foreground"
            >
              Surfaces
            </a>
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
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Admin
            </a>
          </nav>
          <div className="hidden md:block" />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-3 py-28 md:px-6 md:py-40">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 text-xs">
              Production-ready · 4 surfaces · MIT licensed
            </Badge>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
              Ship your product.{" "}
              <span className="text-muted-foreground">
                Not your boilerplate.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              A complete monorepo with a NestJS API, a public SEO landing page,
              an admin app with auth BFF, and a Flutter mobile client — wired
              with contract-driven clients and production tooling from day one.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<a href="#get-started" />}
              >
                Get started
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={
                  <a
                    href={ADMIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <LayoutDashboard className="size-4" />
                Open admin
              </Button>
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
                GitHub
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

      {/* ── Surfaces ── */}
      <section id="surfaces" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              Four surfaces
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              One backend, clear separation
            </h2>
            <p className="mt-4 text-muted-foreground">
              Web is a lean SEO landing page. Admin is the primary app with auth
              and operations. Mobile ships the native experience. All three talk
              to the same NestJS API.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {surfaces.map((surface) => (
              <a
                key={surface.label}
                href={surface.href}
                target={surface.external ? "_blank" : undefined}
                rel={surface.external ? "noopener noreferrer" : undefined}
                className="group block h-full"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-widest">
                        {surface.label}
                      </CardDescription>
                      {surface.external ? (
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      ) : null}
                    </div>
                    <CardTitle>{surface.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {surface.description}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              What&apos;s inside
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Everything connected, nothing missing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Four apps sharing one database schema and one API contract. Admin
              hosts auth via a BFF; web stays marketing-only — change the
              schema, regenerate, all clients update.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card key={feat.title} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <CardDescription className="text-xs uppercase tracking-widest">
                          {feat.label}
                        </CardDescription>
                        <CardTitle>{feat.title}</CardTitle>
                        <CardDescription className="text-sm leading-6">
                          {feat.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section id="architecture" className="border-b border-border py-32">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              Architecture
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Three clients, one backend
            </h2>
            <p className="mt-4 text-muted-foreground">
              The NestJS API serves web, admin, and mobile from a single
              Postgres database. Admin traffic flows through a Next.js BFF
              with @repo/web-core; web is static marketing; Flutter talks
              directly to the API.
            </p>
          </div>
          <ArchDiagram />
        </div>
      </section>

      {/* ── Stack ── */}
      <section id="stack" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
          {/* Header — left-aligned, editorial */}
          <div className="mb-16 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className="mb-3">
                Tech stack
              </Badge>
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

          <Card>
            <CardContent className="px-0">
              {stackLayers.map((layer, layerIndex) => (
                <div key={layer.label}>
                  <div className="flex items-center gap-5 px-6 pb-1 pt-6">
                    <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {layer.label}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  {layer.packages.map((pkg, pkgIndex) => (
                    <div key={pkg.name}>
                      <div className="grid grid-cols-1 gap-1 px-6 py-3.5 sm:grid-cols-[160px_56px_1fr] sm:items-baseline sm:gap-6">
                        <span className="font-semibold text-foreground">
                          {pkg.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground sm:text-center">
                          {pkg.version}
                        </span>
                        <span className="text-sm leading-6 text-muted-foreground">
                          {pkg.description}
                        </span>
                      </div>
                      {pkgIndex < layer.packages.length - 1 ? (
                        <Separator className="mx-6" />
                      ) : null}
                    </div>
                  ))}
                  {layerIndex < stackLayers.length - 1 ? (
                    <Separator className="mt-2" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Get Started ── */}
      <section id="get-started" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
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
              <Card key={step.step}>
                <CardHeader>
                  <CardDescription className="font-mono text-4xl font-bold text-muted-foreground">
                    {step.step}
                  </CardDescription>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <code className="font-mono text-xs text-foreground">
                      <span className="text-muted-foreground">$ </span>
                      {step.code}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ScrollToTop />

      {/* ── Footer ── */}
      <footer className="py-12">
        <div className="mx-auto max-w-7xl px-3 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
                <Zap className="size-4 text-background" />
              </div>
              <span className="text-sm font-semibold">Super Template</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a
                href={ADMIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Admin
              </a>
              <a
                href={API_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                API docs
              </a>
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
