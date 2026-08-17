import { buttonVariants } from "@repo/web-ui/button-variants";
import Link from "next/link";

/**
 * 404 UI for anything under `[locale]`.
 *
 * Status-code caveat: pages in this app render inside a `<Suspense>` boundary,
 * so the response has already begun streaming with `200` by the time a
 * `notFound()` fires. Next.js injects `<meta name="robots" content="noindex">`
 * so the URL is not indexed, but the HTTP status stays `200` (a "soft 404").
 * A real `404` status must be produced before the body streams — do that in
 * `proxy.ts`. See CODING_RULES.md §18.3.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold">This page does not exist</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The link may be outdated, or the record was removed. Check the address or head back to the
        dashboard.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back to dashboard
      </Link>
    </main>
  );
}
