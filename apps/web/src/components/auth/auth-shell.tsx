"use client";

import { Badge } from "@repo/web-core/components/badge";
import { buttonVariants } from "@repo/web-core/components/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Separator } from "@repo/web-core/components/separator";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  body,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 py-4 lg:py-10">
          <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1">
            <ShieldCheck className="size-3.5" />
            Production-ready starter
          </Badge>
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="text-4xl leading-tight font-semibold text-foreground md:text-6xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              {body}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonVariants()}>
              View showcase
            </Link>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-2 size-4" />
              Back home
            </Link>
          </div>
        </section>
        <Card className="border-border bg-card  ">
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{body}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>{children}</div>
            {footer ? (
              <>
                <Separator />
                <div className="text-sm text-muted-foreground">{footer}</div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
