/**
 * Static marketing configuration for the landing feature.
 * Presentation-oriented data only; no React components or runtime state.
 */

export const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";
export const API_DOCS_URL =
  process.env.NEXT_PUBLIC_API_DOCS_URL ?? "http://localhost:3001/api/docs";
export const GITHUB_URL = "https://github.com/truongnat/super-template";

export const surfaces = [
  {
    label: "Web",
    title: "SEO landing",
    description: "Public marketing site. Lightweight, indexable, no auth surface.",
    href: "/",
    external: false,
    tone: "muted" as const,
  },
  {
    label: "Admin",
    title: "Primary app + auth BFF",
    description: "Operations console with login, SSO, MFA, and same-origin session.",
    href: ADMIN_URL,
    external: true,
    tone: "accent" as const,
  },
  {
    label: "API",
    title: "NestJS backend",
    description: "REST API with OpenAPI docs and generated TypeScript + Dart clients.",
    href: API_DOCS_URL,
    external: true,
    tone: "ink" as const,
  },
  {
    label: "Mobile",
    title: "Flutter client",
    description: "iOS and Android with design tokens and an in-app UI Kit gallery.",
    href: `${GITHUB_URL}#quick-start`,
    external: true,
    tone: "soft" as const,
  },
];

export const capabilities = [
  {
    title: "Contract-first API",
    description:
      "OpenAPI from Nest decorators. TypeScript and Dart clients regenerate on every change.",
    detail: "Swagger · openapi-typescript · Dart codegen",
  },
  {
    title: "Multi-tenant auth",
    description:
      "JWT in HttpOnly cookies, workspace isolation, CSRF on BFFs, roles and TOTP MFA.",
    detail: "Argon2 · GitHub / Google / Apple SSO · session revocation",
  },
  {
    title: "Env layering that ships",
    description:
      "Shared env-loader across API, web, and admin. Flutter reads dart-define JSON per environment.",
    detail: "development · staging · production guard rails",
  },
  {
    title: "Admin as the product surface",
    description:
      "Users, roles, jobs, mail, imports, and all auth flows via a same-origin Next.js BFF.",
    detail: "Login · SSO · MFA · operations tooling",
  },
  {
    title: "Flutter + design system",
    description:
      "Material 3 tokens, shared widgets, UI Kit tab for visual QA, generated API client.",
    detail: "Riverpod · go_router · optional FCM",
  },
  {
    title: "Web stays marketing-only",
    description:
      "Fast, indexable landing. Sign-in and product flows live in Admin on purpose.",
    detail: "SSR · Tailwind 4 · shared web-ui",
  },
];

export const stackLayers = [
  {
    label: "Web",
    packages: [
      { name: "Next.js", version: "16", description: "App Router landing surface" },
      { name: "shadcn/ui", version: "4.x", description: "Base UI primitives via web-ui" },
      { name: "Tailwind CSS", version: "4.x", description: "OKLCH theme tokens" },
    ],
  },
  {
    label: "API",
    packages: [
      { name: "NestJS", version: "11", description: "Feature-plugin composition root" },
      { name: "Drizzle ORM", version: "0.45", description: "Typed SQL, no magic" },
      { name: "PostgreSQL", version: "18", description: "RLS multi-tenant store" },
    ],
  },
  {
    label: "Admin",
    packages: [
      { name: "Next.js", version: "16", description: "Auth BFF + operations console" },
      { name: "TanStack Query", version: "5.x", description: "Server state and mutations" },
      { name: "TanStack Table", version: "8.x", description: "Sort, filter, paginate" },
    ],
  },
  {
    label: "Mobile",
    packages: [
      { name: "Flutter", version: "3.x", description: "iOS and Android from one codebase" },
      { name: "Riverpod", version: "2.x", description: "Compile-safe reactive state" },
    ],
  },
  {
    label: "Tooling",
    packages: [
      { name: "Turborepo", version: "2.x", description: "Task graph + remote cache" },
      { name: "pnpm", version: "11", description: "Workspace package manager" },
      { name: "Vitest", version: "4.x", description: "Unit tests" },
      { name: "Playwright", version: "1.61", description: "Browser e2e" },
    ],
  },
];

export const steps = [
  {
    title: "Clone",
    description: "One repo: API, web, admin, and Flutter.",
    code: "git clone https://github.com/truongnat/super-template",
  },
  {
    title: "Bootstrap",
    description: "Deps, Postgres, migrate, seed, generate contracts.",
    code: "make bootstrap",
  },
  {
    title: "Develop",
    description: "API + web + admin together. Flutter via make dev-mobile.",
    code: "make dev",
  },
];

export const proofLogos = [
  { name: "NestJS", slug: "nestjs" },
  { name: "Next.js", slug: "nextdotjs" },
  { name: "Flutter", slug: "flutter" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "TypeScript", slug: "typescript" },
  { name: "Turborepo", slug: "turborepo" },
  { name: "pnpm", slug: "pnpm" },
  { name: "Docker", slug: "docker" },
];
