"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
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

import { PermissionMultiSelect } from "@/components/permission-multi-select";
import { ResourceDrawer } from "@/components/resource-drawer";
import { selectDelegatablePermissions } from "@/features/roles/model/roles.permissions";
import {
  createRoleFormSchema,
  type EditableRole,
  type PermissionDto,
  type RoleForm,
  roleSchema,
} from "@/features/roles/model/roles.schemas";

export function RoleFormDrawer({
  open,
  onClose,
  role,
  permissions,
  permissionsError,
  isSaving,
  isSuperAdmin,
  actorPermissions,
  organizations,
  selectedOrganizationId,
  onOrganizationSelect,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  role: EditableRole | null;
  permissions: PermissionDto[];
  permissionsError: boolean;
  isSaving: boolean;
  isSuperAdmin: boolean;
  actorPermissions: string[];
  organizations: { id: string; name: string }[];
  selectedOrganizationId: string;
  onOrganizationSelect: (id: string) => void;
  onSave: (values: {
    name: string;
    description: string;
    permissionIds: string[];
    organizationId: string;
  }) => void;
}) {
  const isEditing = role !== null;

  const schema = isSuperAdmin && !isEditing
    ? createRoleFormSchema
    : roleSchema;

  const form = useForm<RoleForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
      organizationId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
      organizationId: role?.organizationId ?? "",
    });
  }, [open, role, form]);

  const selectedPermissionIds = useWatch<RoleForm, "permissionIds">({
    control: form.control,
    name: "permissionIds",
  });

  const orgPermissions = useMemo(
    () =>
      selectDelegatablePermissions(
        permissions,
        actorPermissions,
        isSuperAdmin,
      ),
    [actorPermissions, permissions, isSuperAdmin],
  );

  const handleSubmit = form.handleSubmit((values) => {
    onSave({
      name: values.name,
      description: values.description ?? "",
      permissionIds: values.permissionIds,
      organizationId: !isEditing && isSuperAdmin ? selectedOrganizationId : "",
    });
  });

  return (
    <ResourceDrawer
      open={open}
      title={isEditing ? "Edit custom role" : "New custom role"}
      description="Custom roles use permissions from the system catalog and stay scoped to your organization."
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="role-form"
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? <Spinner data-icon="inline-start" /> : null}
          {isEditing ? "Save changes" : "Create role"}
        </Button>
      }
    >
      <form id="role-form" className="space-y-6" onSubmit={handleSubmit}>
        {isSuperAdmin && !isEditing && (
          <div className="space-y-2">
            <Label htmlFor="role-org">Organization</Label>
            <Select
              value={selectedOrganizationId}
              onValueChange={(value) => {
                if (value) {
                  onOrganizationSelect(value);
                  form.setValue("organizationId", value, {
                    shouldValidate: true,
                  });
                }
              }}
            >
              <SelectTrigger id="role-org" className="w-full">
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Select an organization..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.organizationId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.organizationId.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="role-name">Name</Label>
          <Input id="role-name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <Input id="role-description" {...form.register("description")} />
        </div>

        <div className="space-y-2">
          <Label>Permissions</Label>
          {permissionsError ? (
            <p className="text-xs text-destructive">
              Failed to load permissions. Please refresh and try again.
            </p>
          ) : (
            <PermissionMultiSelect
              permissions={orgPermissions}
              selected={selectedPermissionIds}
              onChange={(ids) => {
                form.setValue("permissionIds", ids, { shouldValidate: true });
              }}
              error={form.formState.errors.permissionIds?.message}
            />
          )}
        </div>
      </form>
    </ResourceDrawer>
  );
}
