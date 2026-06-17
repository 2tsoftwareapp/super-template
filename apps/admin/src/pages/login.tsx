import type { operations } from "@repo/api-contract";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { setStoredAuthTokens } from "../lib/auth";
import { webFetch } from "../lib/http";
import { sessionQueryKey } from "../lib/session";

type AuthLoginResponse =
  operations["AuthController_login"]["responses"][201]["content"]["application/json"];

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginInput = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@example.local",
      password: "ChangeMe123!",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const response = await webFetch<AuthLoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (!response.data.user.roles.includes("SUPER_ADMIN")) {
        throw new Error("not-admin");
      }

      return response;
    },
    onSuccess: async (response) => {
      setStoredAuthTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      await navigate("/", { replace: true });
    },
  });

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6 py-4 lg:py-10">
          <Badge variant="outline" className="w-fit">
            Admin workspace
          </Badge>
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Separate project
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Sign in to the admin app
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              This app is split away from the client web. It owns management
              workflows, review queues, and system controls.
            </p>
          </div>
        </section>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Admin login</CardTitle>
            <CardDescription>Use the seeded admin account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                void mutation.mutateAsync(values);
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} />
              </div>
              {mutation.isError && (
                <Alert>
                  {mutation.error instanceof Error &&
                  mutation.error.message === "not-admin"
                    ? "Access denied. This portal is for administrators only."
                    : mutation.error instanceof Error &&
                        mutation.error.message.includes("401")
                      ? "Invalid email or password."
                      : mutation.error instanceof Error &&
                          mutation.error.message.includes("403")
                        ? "Your account is not active or has not been verified."
                        : mutation.error instanceof Error &&
                            mutation.error.message.includes("failed to fetch")
                          ? "Cannot reach the API. Make sure the server is running."
                          : "Sign in failed. Please try again."}
                </Alert>
              )}
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
