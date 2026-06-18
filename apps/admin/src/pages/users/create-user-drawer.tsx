import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ResourceDrawer } from "@/components/resource-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { webFetch } from "@/lib/http";
import { canAssignRole, formatRoleName } from "@/lib/roles";

import type { AdminUserDto, CreateAdminUserInput } from "../../lib/types";

import { USERS_QUERY_KEY } from "./constants";

const ASSIGNABLE_ROLES = ["USER", "ADMIN"] as const;

function createUserSchema(actorRoles: string[]) {
  const allowedRoles = ASSIGNABLE_ROLES.filter((role) =>
    canAssignRole(actorRoles, role),
  );

  return z.object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name must be at least 2 characters")
      .max(120, "Display name must be at most 120 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(allowedRoles.length > 0 ? allowedRoles : ["USER"]),
  });
}

type CreateForm = z.infer<ReturnType<typeof createUserSchema>>;

export function CreateUserDrawer({
  open,
  onClose,
  actorRoles,
}: {
  open: boolean;
  onClose: () => void;
  actorRoles: string[];
}) {
  const queryClient = useQueryClient();
  const assignableRoles = useMemo(
    () => ASSIGNABLE_ROLES.filter((role) => canAssignRole(actorRoles, role)),
    [actorRoles],
  );
  const createSchema = useMemo(
    () => createUserSchema(actorRoles),
    [actorRoles],
  );

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: "USER",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      email: "",
      password: "",
      displayName: "",
      role: assignableRoles[0] ?? "USER",
    });
  }, [open, assignableRoles, form]);

  const createUser = useMutation({
    mutationFn: (input: CreateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      form.reset({
        email: "",
        password: "",
        displayName: "",
        role: assignableRoles[0] ?? "USER",
      });
      toast.success("User created");
      onClose();
    },
  });

  const selectedRole = form.watch("role");

  return (
    <ResourceDrawer
      open={open}
      title="New user"
      description="Create an account and assign a fixed platform role."
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="create-user-form"
          className="w-full"
          disabled={createUser.isPending}
        >
          {createUser.isPending ? <Spinner data-icon="inline-start" /> : null}
          Create user
        </Button>
      }
    >
      <form
        id="create-user-form"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          void createUser.mutateAsync({
            email: values.email,
            password: values.password,
            displayName: values.displayName,
            role: values.role,
          });
        })}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            aria-invalid={Boolean(form.formState.errors.displayName)}
            {...form.register("displayName")}
          />
          {form.formState.errors.displayName ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.displayName.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Role</Label>
          {assignableRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignableRoles.map((role) => (
                <Button
                  key={role}
                  type="button"
                  variant={selectedRole === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => form.setValue("role", role, { shouldValidate: true })}
                >
                  {formatRoleName(role)}
                </Button>
              ))}
            </div>
          )}
          {form.formState.errors.role ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.role.message}
            </p>
          ) : null}
        </div>

        {createUser.isError ? (
          <p className="text-sm text-destructive">
            Failed to create user. Check inputs and role permissions.
          </p>
        ) : null}
      </form>
    </ResourceDrawer>
  );
}
