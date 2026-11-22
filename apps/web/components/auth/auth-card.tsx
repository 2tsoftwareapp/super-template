import type { FormEvent, ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** The shared frame of every sign-in / sign-up / reset form. */
export function AuthCard(props: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{props.title}</CardTitle>
          <CardDescription>{props.description}</CardDescription>
        </CardHeader>
        <form onSubmit={props.onSubmit}>
          <CardContent className="grid gap-4">
            {props.children}
            <FormError message={props.error} />
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button type="submit" className="w-full" disabled={props.pending}>
              {props.pending ? "Please wait…" : props.submitLabel}
            </Button>
            {props.footer ? (
              <div className="flex w-full justify-between text-sm text-muted-foreground">
                {props.footer}
              </div>
            ) : null}
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
