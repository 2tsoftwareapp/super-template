import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminRedirectPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Admin moved
        </Badge>
        <h1 className="text-4xl font-semibold">Admin now lives in a separate app</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          The Next.js web stays client-focused. Open the Vite admin workspace for management tools.
        </p>
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Use the admin app</CardTitle>
          <CardDescription>
            Launch the separate React + Vite + shadcn app for admin work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="http://127.0.0.1:3001"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ className: "w-full sm:w-auto" })}
          >
            Open admin app
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
