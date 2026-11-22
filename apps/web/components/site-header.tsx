import Link from "next/link";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const store = await cookies();
  const signedIn = store.has("access_token") || store.has("refresh_token");

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="font-semibold">
          Lean Template
        </Link>
        <nav className="flex gap-2">
          {signedIn ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/account">Account</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
