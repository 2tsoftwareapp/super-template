import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HomeAuthActions } from "@/components/app/home-auth-actions";

const shippingPillars = [
  "Landing and auth pages",
  "Client workspace in Next.js",
  "Separate admin app in Vite",
];

const includedFlows = [
  "Authentication with seeded accounts",
  "Projects CRUD and notifications",
  "Next.js BFF and secure cookies",
  "Admin-only operational tools",
  "Contracts generated from the API",
];

export default function Home() {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              Reusable full-stack starter
            </Badge>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              A clean landing page for the template, with separate app surfaces
              and API support behind it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <HomeAuthActions />
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="space-y-6 p-6 md:p-8">
              <Badge className="w-fit">Editorial product showcase</Badge>
              <div className="space-y-4">
                <CardTitle className="max-w-2xl text-4xl leading-tight tracking-tight md:text-6xl">
                  Showcase the stack clearly, without dragging admin tools into
                  the landing page.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 md:text-lg">
                  This Next.js surface is the public face of the starter:
                  focused copy, clear entry points, and a session-aware CTA that
                  guides users to the right place.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {shippingPillars.map((pill) => (
                  <div
                    key={pill}
                    className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground"
                  >
                    {pill}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="#included"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Explore included flows
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 md:p-8 md:pt-0">
              <Separator />
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Web
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Landing, auth, client workspace
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Admin
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Users, projects, jobs, mail, imports
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    API
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Contracts, auth, BFF, and seed data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div id="included" className="space-y-4 scroll-mt-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="space-y-3">
                <Badge variant="outline" className="w-fit">
                  Included flows
                </Badge>
                <CardTitle className="text-2xl">
                  The landing should tell the truth at a glance.
                </CardTitle>
                <CardDescription>
                  Shadcn primitives, seeded auth, and the split between client
                  and admin are visible from the first screen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {includedFlows.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 size-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="space-y-3">
                <Badge variant="outline" className="w-fit">
                  Product split
                </Badge>
                <CardTitle className="text-2xl">Clear separation</CardTitle>
                <CardDescription>
                  The public site stays lightweight. Operational surfaces live
                  in the separate admin app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p>Login and registration remain in the Next.js web.</p>
                <p>Admin features move to the Vite workspace.</p>
                <p>The API stays shared and contract-driven underneath both.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
