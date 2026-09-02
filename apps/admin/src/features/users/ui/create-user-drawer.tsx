"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { PasswordInput } from "@repo/web-ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/web-ui/select";
import { Spinner } from "@repo/web-ui/spinner";
import { Building2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { CreateUserForm } from "@/features/users/model/users.schemas";
import type { AdminUserDto, RoleDto } from "@/lib/api-types";
import { ResourceDrawer } from "@repo/web-ui/resource-drawer";
import { createUserSchema } from "@/features/users/model/users.schemas";
import { filterRolesForOrganization, findPlatformUserRoleId, formatRoleName } from "@/lib/roles";

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  actorRoles: string[];
  actorOrganizationId: string | null | undefined;
  assignableRoles: RoleDto[];
  organizations: { id: string; name: string }[];
  isOrganizationsLoading: boolean;
  isSaving: boolean;
  onSubmit: (values: {
    email: string;
    password: string;
    displayName: string;
    roleId: string;
    organizationId?: string | undefined;
  }) => Promise<{ data: AdminUserDto }>;
}

export function CreateUserDrawer({
  open,
  onClose,
  actorRoles,
  actorOrganizationId,
  assignableRoles,
  organizations,
  isOrganizationsLoading,
  isSaving,
  onSubmit,
}: CreateUserDrawerProps) {
  const isActorSuperAdmin = actorRoles.includes("SUPER_ADMIN");

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const effectiveOrgId = isActorSuperAdmin ? selectedOrgId : (actorOrganizationId ?? "");

  const rolesForOrg = useMemo(
    () => filterRolesForOrganization(assignableRoles, effectiveOrgId),
    [assignableRoles, effectiveOrgId],
  );

  const roleIdsForOrg = useMemo(() => rolesForOrg.map((r) => r.id), [rolesForOrg]);

  const createSchema = useMemo(() => createUserSchema(roleIdsForOrg), [roleIdsForOrg]);

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

  const initialisedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initialisedRef.current = false;
      return;
    }

    if (assignableRoles.length === 0) return;
    if (isActorSuperAdmin && organizations.length === 0) return;
    if (!isActorSuperAdmin && !actorOrganizationId) return;

    if (initialisedRef.current) return;
    if (isActorSuperAdmin) {
      const firstOrg = organizations[0];
      if (!firstOrg) return;
      initialisedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrgId(firstOrg.id);
      form.setValue("organizationId", firstOrg.id, { shouldValidate: false });
      const roles = filterRolesForOrganization(assignableRoles, firstOrg.id);
      form.setValue("roleId", findPlatformUserRoleId(roles), {
        shouldValidate: false,
      });
    } else {
      initialisedRef.current = true;
      setSelectedOrgId("");
      form.setValue("organizationId", "", { shouldValidate: false });
      const roles = filterRolesForOrganization(assignableRoles, actorOrganizationId ?? undefined);
      form.setValue("roleId", findPlatformUserRoleId(roles), {
        shouldValidate: false,
      });
    }
  }, [open, isActorSuperAdmin, actorOrganizationId, assignableRoles, organizations, form]);

  const selectedRoleId = useWatch<CreateUserForm, "roleId">({
    control: form.control,
    name: "roleId",
  });

  const actorOrg = organizations.find((o) => o.id === actorOrganizationId);

  return (
    <ResourceDrawer
      open={open}
      title="Invite user"
      description="Create an account and send an invite email to set up access."
      onClose={onClose}
      footer={
        <Button type="submit" form="create-user-form" className="w-full" disabled={isSaving}>
          {isSaving ? <Spinner data-icon="inline-start" /> : null}
          Send invite
        </Button>
      }
    >
      <form
        id="create-user-form"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          void onSubmit(values);
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
            <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
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
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
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
            The user will be asked to set a new password after verifying their email.
          </p>
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
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
                form.setValue("organizationId", value, {
                  shouldValidate: false,
                });
                const nextRoles = filterRolesForOrganization(assignableRoles, value);
                const currentRoleId = form.getValues("roleId");
                const roleInOrg = nextRoles.find((r) => r.id === currentRoleId);
                if (!roleInOrg) {
                  form.setValue("roleId", findPlatformUserRoleId(nextRoles), {
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isOrganizationsLoading}
            >
              <SelectTrigger>
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Search organization..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
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
                  onClick={() => form.setValue("roleId", role.id, { shouldValidate: true })}
                >
                  {formatRoleName(role.name)}
                </Button>
              ))}
            </div>
          )}
          {form.formState.errors.roleId ? (
            <p className="text-xs text-destructive">{form.formState.errors.roleId.message}</p>
          ) : null}
        </div>

        <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            An invite email with a verification link will be sent to the user. They must verify
            their email before signing in.
          </p>
        </div>
      </form>
    </ResourceDrawer>
  );
}
