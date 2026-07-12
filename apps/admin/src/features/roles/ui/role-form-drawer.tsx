"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-core/components/button";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { Spinner } from "@repo/web-core/components/spinner";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { PermissionMultiSelect } from "@/components/permission-multi-select";
import { ResourceDrawer } from "@/components/resource-drawer";
import {
  type EditableRole,
  type PermissionDto,
  type RoleForm,
  roleSchema,
} from "@/features/roles/roles-schemas";
import { useSaveRoleMutation } from "@/features/roles/use-roles-mutations";

export function RoleFormDrawer({
  open,
  onClose,
  role,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  role: EditableRole | null;
  permissions: PermissionDto[];
}) {
  const isEditing = role !== null;

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
    });
  }, [open, role, form]);

  const saveRole = useSaveRoleMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const selectedPermissionIds = useWatch<RoleForm, "permissionIds">({
    control: form.control,
    name: "permissionIds",
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
          disabled={saveRole.isPending}
        >
          {saveRole.isPending ? <Spinner data-icon="inline-start" /> : null}
          {isEditing ? "Save changes" : "Create role"}
        </Button>
      }
    >
      <form
        id="role-form"
        className="space-y-6"
        onSubmit={form.handleSubmit((values) =>
          saveRole.mutate({ roleId: role?.id, input: values }),
        )}
      >
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
          <PermissionMultiSelect
            permissions={permissions}
            selected={selectedPermissionIds}
            onChange={(ids) => {
              form.setValue("permissionIds", ids, { shouldValidate: true });
            }}
            error={form.formState.errors.permissionIds?.message}
          />
        </div>
      </form>
    </ResourceDrawer>
  );
}
