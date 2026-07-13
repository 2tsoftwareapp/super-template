"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { PasswordInput } from "@repo/web-ui/password-input";
import { Spinner } from "@repo/web-ui/spinner";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ResourceDrawer } from "@/components/resource-drawer";
import { useCreateUser } from "@/features/users/api/users.mutations";
import {
  ASSIGNABLE_ROLES,
  type CreateUserForm,
  createUserSchema,
} from "@/features/users/model/users.schemas";
import { canAssignRole, formatRoleName } from "@/lib/roles";

export function CreateUserDrawer({
  open,
  onClose,
  actorRoles,
}: {
  open: boolean;
  onClose: () => void;
  actorRoles: string[];
}) {
  const assignableRoles = useMemo(
    () => ASSIGNABLE_ROLES.filter((role) => canAssignRole(actorRoles, role)),
    [actorRoles],
  );
  const createSchema = useMemo(
    () => createUserSchema(actorRoles),
    [actorRoles],
  );

  const form = useForm<CreateUserForm>({
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

  const createUser = useCreateUser({
    onSuccess: () => {
      form.reset({
        email: "",
        password: "",
        displayName: "",
        role: assignableRoles[0] ?? "USER",
      });
      onClose();
    },
  });

  const selectedRole = useWatch<CreateUserForm, "role">({
    control: form.control,
    name: "role",
  });

  return (
    <ResourceDrawer
      open={open}
      title="Invite user"
      description="Create an account and send an invite email to set up access."
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="create-user-form"
          className="w-full"
          disabled={createUser.isPending}
        >
          {createUser.isPending ? <Spinner data-icon="inline-start" /> : null}
          Send invite
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
            status: "PENDING",
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
          <Label htmlFor="password">Temporary password</Label>
          <PasswordInput
            id="password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <p className="text-xs text-muted-foreground">
            The user will be asked to set a new password after verifying their
            email.
          </p>
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
                  onClick={() =>
                    form.setValue("role", role, { shouldValidate: true })
                  }
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

        <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            An invite email with a verification link will be sent to the user.
            They must verify their email before signing in.
          </p>
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
