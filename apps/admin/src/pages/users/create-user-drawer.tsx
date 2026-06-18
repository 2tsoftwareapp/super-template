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
import { formatRoleName, getAssignableRoles } from "@/lib/roles";

import { USERS_QUERY_KEY } from "./constants";

import type { AdminUserDto, CreateAdminUserInput, RoleDto } from "../../lib/types";

function createUserSchema(assignableRoleIds: string[]) {
  return z.object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name must be at least 2 characters")
      .max(120, "Display name must be at most 120 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    roleIds: z
      .array(z.uuid())
      .min(1, "Select at least one role")
      .refine(
        (roleIds) => roleIds.every((roleId) => assignableRoleIds.includes(roleId)),
        "One or more selected roles cannot be assigned",
      ),
  });
}

type CreateForm = z.infer<ReturnType<typeof createUserSchema>>;

export function CreateUserDrawer({
  open,
  onClose,
  actorRoles,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  actorRoles: string[];
  roles: RoleDto[];
}) {
  const queryClient = useQueryClient();
  const assignableRoles = useMemo(
    () => getAssignableRoles(actorRoles, roles),
    [actorRoles, roles],
  );
  const assignableRoleIds = useMemo(
    () => assignableRoles.map((role) => role.id),
    [assignableRoles],
  );
  const defaultRoleIds = useMemo(
    () =>
      assignableRoles
        .filter((role) => role.name === "USER")
        .map((role) => role.id),
    [assignableRoles],
  );
  const createSchema = useMemo(
    () => createUserSchema(assignableRoleIds),
    [assignableRoleIds],
  );

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      roleIds: defaultRoleIds,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      email: "",
      password: "",
      displayName: "",
      roleIds: defaultRoleIds,
    });
  }, [open, defaultRoleIds, form]);

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
        roleIds: defaultRoleIds,
      });
      toast.success("User created");
      onClose();
    },
  });

  const selectedRoleIds = form.watch("roleIds");

  const toggleRole = (id: string) => {
    const next = selectedRoleIds.includes(id)
      ? selectedRoleIds.filter((roleId) => roleId !== id)
      : [...selectedRoleIds, id];
    form.setValue("roleIds", next, { shouldValidate: true });
  };

  return (
    <ResourceDrawer
      open={open}
      title="New user"
      description="Create an account and assign the roles this operator can grant."
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
            roleIds: values.roleIds,
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
          <Label>Roles</Label>
          {assignableRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignableRoles.map((role) => {
                const selected = selectedRoleIds.includes(role.id);
                return (
                  <Button
                    key={role.id}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRole(role.id)}
                  >
                    {formatRoleName(role.name)}
                  </Button>
                );
              })}
            </div>
          )}
          {form.formState.errors.roleIds ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.roleIds.message}
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
