import { ADMIN_URL, API_DOCS_URL, GITHUB_URL } from "../config/landing-config";

export function LandingFooter() {
  return (
    <footer className="py-12 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-center md:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground"
          >
            ST
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Super Template</p>
            <p className="text-xs text-muted-foreground">MIT licensed monorepo starter</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {ADMIN_URL ? (
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Admin
            </a>
          ) : null}
          {API_DOCS_URL ? (
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              API docs
            </a>
          ) : null}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <a href="#start" className="hover:text-foreground">
            Get started
          </a>
        </nav>
      </div>
    </footer>
  );
}
