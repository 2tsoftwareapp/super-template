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
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ResourceDrawer } from "@/components/resource-drawer";
import { useMyOrganizationsQuery } from "@/features/organizations/api/organizations.queries";
import { useCreateUser } from "@/features/users/api/users.mutations";
import { useAdminRolesQuery } from "@/features/users/api/users.queries";
import {
  type CreateUserForm,
  createUserSchema,
} from "@/features/users/model/users.schemas";
import {
  filterRolesForOrganization,
  formatRoleName,
  getAssignableRoles,
} from "@/lib/roles";

export function CreateUserDrawer({
  open,
  onClose,
  actorRoles,
  actorOrganizationId,
}: {
  open: boolean;
  onClose: () => void;
  actorRoles: string[];
  actorOrganizationId: string | null | undefined;
}) {
  const allRoles = useAdminRolesQuery();
  const organizations = useMyOrganizationsQuery();
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");

  const allAssignable = useMemo(
    () => getAssignableRoles(actorRoles, allRoles.data?.data ?? []),
    [actorRoles, allRoles.data],
  );

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const rolesForOrg = useMemo(
    () => filterRolesForOrganization(allAssignable, selectedOrgId),
    [allAssignable, selectedOrgId],
  );

  const roleIdsForOrg = useMemo(
    () => rolesForOrg.map((r) => r.id),
    [rolesForOrg],
  );

  const createSchema = useMemo(
    () => createUserSchema(actorRoles, roleIdsForOrg),
    [actorRoles, roleIdsForOrg],
  );

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      roleId: "",
      organizationId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isActorSuperAdmin) {
      const firstOrg = organizations.data?.data?.[0];
      const initialOrg = firstOrg?.id ?? "";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrgId(initialOrg);
      form.setValue("organizationId", initialOrg, { shouldValidate: false });
      const firstRole = rolesForOrg[0];
      form.setValue("roleId", firstRole?.id ?? "", { shouldValidate: false });
    } else {
      setSelectedOrgId("");
      form.setValue("organizationId", "", { shouldValidate: false });
      const firstRole = rolesForOrg[0];
      form.setValue("roleId", firstRole?.id ?? "", { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isActorSuperAdmin]);

  const createUser = useCreateUser({
    onSuccess: () => {
      form.reset({
        email: "",
        password: "",
        displayName: "",
        roleId: "",
        organizationId: "",
      });
      onClose();
    },
  });

  const selectedRoleId = useWatch<CreateUserForm, "roleId">({
    control: form.control,
    name: "roleId",
  });

  const actorOrg = organizations.data?.data?.find(
    (o) => o.id === actorOrganizationId,
  );

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
          const orgId = isActorSuperAdmin
            ? values.organizationId
            : actorOrganizationId;
          void createUser.mutateAsync({
            email: values.email,
            password: values.password,
            displayName: values.displayName,
            roleId: values.roleId,
            status: "PENDING",
            ...(orgId ? { organizationId: orgId } : {}),
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

        {isActorSuperAdmin ? (
          <div className="flex flex-col gap-1.5">
            <Label>Organization</Label>
            <Select
              value={selectedOrgId}
              onValueChange={(value) => {
                if (!value) return;
                setSelectedOrgId(value);
                form.setValue("organizationId", value, { shouldValidate: false });
                const currentRoleId = form.getValues("roleId");
                const roleInOrg = rolesForOrg.find((r) => r.id === currentRoleId);
                if (!roleInOrg) {
                  const firstRole = rolesForOrg[0];
                  form.setValue("roleId", firstRole?.id ?? "", { shouldValidate: true });
                }
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
          </div>
        ) : actorOrg ? (
          <div className="flex flex-col gap-1.5">
            <Label>Organization</Label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              {actorOrg.name}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label>Role</Label>
          {rolesForOrg.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {rolesForOrg.map((role) => (
                <Button
                  key={role.id}
                  type="button"
                  variant={selectedRoleId === role.id ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    form.setValue("roleId", role.id, { shouldValidate: true })
                  }
                >
                  {formatRoleName(role.name)}
                </Button>
              ))}
            </div>
          )}
          {form.formState.errors.roleId ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.roleId.message}
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
