/**
 * Static marketing configuration for the landing feature.
 * Presentation-oriented data only; no React components or runtime state.
 */

export const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";
export const API_DOCS_URL =
  process.env.NEXT_PUBLIC_API_DOCS_URL ?? "http://localhost:3001/api/docs";

export const surfaces = [
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

export const features = [
  {
    icon: "code" as const,
    label: "API",
    title: "Contract-first API",
    description:
      "OpenAPI schema auto-generated from NestJS decorators. TypeScript and Dart clients regenerate on every change — no manual sync.",
    items: ["@nestjs/swagger decorators", "openapi-typescript client", "Dart codegen for Flutter"],
  },
  {
    icon: "shield" as const,
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
    icon: "layers" as const,
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
    icon: "monitor" as const,
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
    icon: "smartphone" as const,
    label: "Mobile",
    title: "Flutter + design system",
    description:
      "Material 3 tokens, 20+ shared widgets, and an in-app UI Kit tab for visual QA. Auto-generated API client from OpenAPI.",
    items: ["Riverpod + go_router", "Design tokens & UI Kit gallery", "FCM push (optional)"],
  },
  {
    icon: "palette" as const,
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

export const stackLayers = [
  {
    label: "Web",
    packages: [
      {
        name: "Next.js",
        version: "16",
        description: "App Router · SEO landing · lightweight public marketing surface",
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
        name: "@repo/web-ui",
        version: "workspace:*",
        description: "Shared UI primitives (components + hooks)",
      },
      {
        name: "@repo/env-loader",
        version: "workspace:*",
        description: "Layered .env loading for development, staging, and production",
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
        description: "Primary relational store with multi-tenant workspace isolation",
      },
    ],
  },
  {
    label: "Admin",
    packages: [
      {
        name: "Next.js",
        version: "16",
        description: "App Router · same-origin auth BFF · primary product surface",
      },
      {
        name: "TanStack Table",
        version: "8.x",
        description: "Headless table with sorting, filtering, and pagination hooks",
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
        description: "End-to-end browser testing across Chromium, Firefox, WebKit",
      },
    ],
  },
];

export const steps = [
  {
    step: "01",
    title: "Clone the repo",
    description: "One git clone to get the full monorepo — API, web, admin, and Flutter mobile.",
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
    description: "API, web, and admin start together. Run Flutter separately with make dev-mobile.",
    code: "make dev",
  },
];

export const highlights = [
  "Four-app monorepo",
  "Dev / staging / prod envs",
  "Mobile design system",
  "Full CI via make verify",
];
