import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminMovedNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Admin moved
        </Badge>
        <h1 className="text-4xl font-semibold">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Use the admin app</CardTitle>
          <CardDescription>
            The management UI now lives in the separate Next.js admin app and
            shares the same `@repo/web-core` logic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="http://127.0.0.1:3002"
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
