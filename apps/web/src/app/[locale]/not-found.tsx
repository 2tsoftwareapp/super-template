import { buttonVariants } from "@repo/web-ui/button-variants";
import Link from "next/link";

/**
 * 404 UI for anything under `[locale]`.
 *
 * Status-code caveat (matters more here than in admin — these pages are
 * indexable): once the response starts streaming, the status is already `200`.
 * Next.js injects `<meta name="robots" content="noindex">` so the URL stays out
 * of the index, but crawlers may log a "soft 404". For a real `404` status,
 * decide before the body streams — in `proxy.ts`. See CODING_RULES.md §18.3.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The page you are looking for was moved or never existed.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back to home
      </Link>
    </main>
  );
}
