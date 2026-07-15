"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { PasswordInput } from "@repo/web-ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/web-ui/select";
import { Spinner } from "@repo/web-ui/spinner";
import { Building2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ResourceDrawer } from "@/components/resource-drawer";
import { useMyOrganizationsQuery } from "@/features/organizations/api/organizations.queries";
import { useCreateUser } from "@/features/users/api/users.mutations";
import { useAdminRolesQuery } from "@/features/users/api/users.queries";
import {
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
  const allRoles = useAdminRolesQuery();
  const organizations = useMyOrganizationsQuery();
  const availableRoleNames = useMemo(
    () => (allRoles.data?.data ?? []).map((r) => r.name),
    [allRoles.data],
  );
  const assignableRoles = useMemo(
    () => availableRoleNames.filter((role) => canAssignRole(actorRoles, role)),
    [actorRoles, availableRoleNames],
  );
  const createSchema = useMemo(
    () => createUserSchema(actorRoles, availableRoleNames),
    [actorRoles, availableRoleNames],
  );

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: "USER",
      organizationId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      email: "",
      password: "",
      displayName: "",
      role: assignableRoles[0] ?? "USER",
      organizationId: "",
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
  const selectedOrgId = useWatch<CreateUserForm, "organizationId">({
    control: form.control,
    name: "organizationId",
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
            ...(values.role === "ADMIN" && values.organizationId
              ? { organizationId: values.organizationId }
              : {}),
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

        {selectedRole === "ADMIN" ? (
          <div className="flex flex-col gap-1.5">
            <Label>Organization</Label>
            <Select
              value={selectedOrgId ?? ""}
              onValueChange={(value) => {
                if (value) form.setValue("organizationId", value, { shouldValidate: true });
              }}
              disabled={organizations.isLoading}
            >
              <SelectTrigger>
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Search organization..." />
              </SelectTrigger>
              <SelectContent>
                {(organizations.data?.data ?? []).map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.organizationId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.organizationId.message}
              </p>
            ) : null}
          </div>
        ) : null}

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
