import { Button } from "@repo/web-ui/button";
import Image from "next/image";

import { ADMIN_URL } from "../config/landing-config";

export function LandingHero() {
  return (
    <section id="top" className="relative isolate overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,oklch(0.92_0.04_145/_0.7),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.94_0.02_145/_0.5),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,oklch(0.28_0.04_145/_0.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.22_0.02_145/_0.4),transparent_50%)]"
      />

      <div className="mx-auto grid min-h-[100dvh] max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-6 md:pb-20 md:pt-12 lg:gap-14">
        <div className="max-w-xl">
          <p className="text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Super Template
          </p>
          <h1 className="mt-4 text-balance text-2xl font-medium leading-snug tracking-tight text-foreground/90 sm:text-3xl">
            Ship the product. Keep the monorepo scaffolding.
          </h1>
          <p className="mt-5 max-w-[38ch] text-base leading-relaxed text-muted-foreground">
            NestJS API, Next web and admin, Flutter mobile. One Postgres schema, one OpenAPI
            contract, production tooling from day one.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <a href="#start">Get started</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
                Open admin
              </a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg md:mx-0 md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted shadow-[0_24px_80px_-32px_oklch(0.35_0.04_145/_0.55)] md:aspect-[4/5]">
            <Image
              src="https://picsum.photos/seed/super-template-monorepo-desk/960/1200"
              alt="Developer workspace with monitors and code editors"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-primary/10"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-background/90">
                Four surfaces · one contract
              </p>
              <p className="mt-1 text-sm font-medium text-background">Web · Admin · API · Mobile</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
