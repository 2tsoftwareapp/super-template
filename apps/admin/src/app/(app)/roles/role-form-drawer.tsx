"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ResourceDrawer } from "@/components/resource-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionMultiSelect } from "@/components/ui/permission-multi-select";
import { Spinner } from "@/components/ui/spinner";
import { webFetch } from "@/lib/http";

interface PermissionDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface EditableRole {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionDto[];
}

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(80, "Role name must be at most 80 characters"),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

type RoleForm = z.infer<typeof roleSchema>;

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
  const queryClient = useQueryClient();
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

  const saveRole = useMutation({
    mutationFn: async (input: RoleForm) => {
      const payload = {
        name: input.name,
        description: input.description ?? null,
        permissionIds: input.permissionIds,
      };

      if (isEditing && role) {
        return webFetch<{
          data: EditableRole & { permissions: PermissionDto[] };
        }>(`/api/bff/admin/roles/${role.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      return webFetch<{
        data: EditableRole & { permissions: PermissionDto[] };
      }>("/api/bff/admin/roles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(isEditing ? "Role updated" : "Role created");
      onClose();
    },
    onError: () => {
      toast.error(
        isEditing ? "Could not update role" : "Could not create role",
      );
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
        onSubmit={form.handleSubmit((values) => saveRole.mutate(values))}
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
