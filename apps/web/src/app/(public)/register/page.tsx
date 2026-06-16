"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { RegisterInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(120),
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterInput) =>
      webFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Registration submitted. Check Mailpit for verification.");
      router.replace("/login");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AuthShell
      eyebrow="New account"
      title="Create a workspace user"
      body="Register a developer or admin account for the local starter."
      footer={
        <p>
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      }
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-4 p-6">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" {...form.register("displayName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating account..." : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
