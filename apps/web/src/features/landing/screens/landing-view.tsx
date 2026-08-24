import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Separator } from "@repo/web-ui/separator";
import { Show } from "@repo/web-ui/show";
import {
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Monitor,
  Palette,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";

import {
  ADMIN_URL,
  API_DOCS_URL,
  features,
  highlights,
  stackLayers,
  steps,
  surfaces,
} from "../config/landing-config";
import { ArchDiagram } from "../ui/arch-diagram";
import { ScrollToTop } from "../ui/scroll-to-top";

/** Icon lookup for feature cards (config stores keys only). */
const FEATURE_ICONS: Record<string, LucideIcon> = {
  code: Code2,
  shield: Shield,
  layers: Layers,
  monitor: Monitor,
  smartphone: Smartphone,
  palette: Palette,
};

export function LandingView() {
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
              <span className="text-sm font-semibold tracking-tight">Super Template</span>
              <p className="truncate text-[11px] text-muted-foreground">
                Full-stack monorepo starter
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#surfaces" className="transition-colors hover:text-foreground">
              Surfaces
            </a>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#architecture" className="transition-colors hover:text-foreground">
              Architecture
            </a>
            <a href="#stack" className="transition-colors hover:text-foreground">
              Stack
            </a>
            <a href="#get-started" className="transition-colors hover:text-foreground">
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
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/truongnat/super-template"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center md:px-6 md:py-28">
            <Badge variant="secondary" className="mb-5">
              Production-ready full-stack starter
            </Badge>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Build products, not boilerplate.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              A batteries-included monorepo with web, admin, API, and mobile surfaces — wired for
              authentication, multi-tenancy, generated contracts, and CI from day one.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <a href="#get-started">Get started</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer">
                  API docs <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {highlights.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Surfaces ── */}
        <section id="surfaces" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mb-8 max-w-2xl">
            <Badge variant="outline" className="mb-3">
              Surfaces
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              One repository, four product surfaces
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Each app has a focused responsibility while sharing contracts, tooling, and design
              primitives across the monorepo.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {surfaces.map((surface) => (
              <Card key={surface.label} className="h-full">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    {surface.label}
                  </Badge>
                  <CardTitle className="text-lg">{surface.title}</CardTitle>
                  <CardDescription>{surface.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={surface.href}
                      {...(surface.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      Open {surface.label}
                      {surface.external ? <ExternalLink className="size-3.5" /> : null}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mb-8 max-w-2xl">
            <Badge variant="outline" className="mb-3">
              Features
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Production concerns already wired
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = FEATURE_ICONS[feature.icon];
              return (
                <Card key={feature.title} className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex size-9 items-center justify-center rounded-md border border-border bg-muted">
                      {Icon ? <Icon className="size-4" /> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{feature.label}</Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {feature.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* ── Architecture ── */}
        <section id="architecture" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mb-8 max-w-2xl">
            <Badge variant="outline" className="mb-3">
              Architecture
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Clear ownership, explicit boundaries
            </h2>
          </div>
          <ArchDiagram />
        </section>

        <Separator />

        {/* ── Stack ── */}
        <section id="stack" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mb-8 max-w-2xl">
            <Badge variant="outline" className="mb-3">
              Stack
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Modern tools, one workflow
            </h2>
          </div>
          <div className="space-y-6">
            {stackLayers.map((layer) => (
              <div key={layer.label}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {layer.label}
                </h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {layer.packages.map((pkg) => (
                    <Card key={`${layer.label}-${pkg.name}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base">{pkg.name}</CardTitle>
                          <Badge variant="outline">{pkg.version}</Badge>
                        </div>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Get started ── */}
        <section id="get-started" className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">
              Get started
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              From clone to running in three steps
            </h2>
          </div>
          <div className="space-y-4">
            {steps.map((step) => (
              <Card key={step.step}>
                <CardContent className="grid gap-4 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <code className="rounded-md bg-muted px-3 py-2 text-xs">{step.code}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <span>Super Template · full-stack monorepo starter</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/truongnat/super-template"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              API docs
            </a>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
