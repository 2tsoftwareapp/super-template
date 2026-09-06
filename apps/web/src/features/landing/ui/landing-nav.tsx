import { Button } from "@repo/web-ui/button";
import { Github } from "lucide-react";

import { ADMIN_URL, GITHUB_URL } from "../config/landing-config";

const NAV_LINKS = [
  { href: "#surfaces", label: "Surfaces" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#architecture", label: "Architecture" },
  { href: "#start", label: "Start" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <a href="#top" className="group flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold tracking-tight text-primary-foreground"
          >
            ST
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            Super Template
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex lg:gap-6">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="size-4" />
              GitHub
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
              Open admin
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
